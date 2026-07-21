import { COLORS, STYLES } from "./theme";

// Best-effort HTML → pdfmake content walker specialised for the 24ZXC
// contract / invoice / act / development-contract / FRDO / NMO templates.
// We only need to understand the tags those templates actually emit
// (h1..h3, p, strong/b, em/i, br, ul/ol/li, table with our conventions,
// signatures/bank-header/services-table wrappers, kicker/header-row, img).

type PmNode = any;

const IMG_PLACEHOLDER = "__PDF_IMG__";

/** Fetch every <img src="..."> in the document and return src → data URI map. */
export async function resolveImages(doc: Document): Promise<Record<string, string>> {
  const srcs = new Set<string>();
  doc.querySelectorAll("img").forEach((img) => {
    const s = img.getAttribute("src");
    if (s) srcs.add(s);
  });
  const entries = await Promise.all(
    Array.from(srcs).map(async (src) => {
      try {
        if (src.startsWith("data:")) return [src, src] as const;
        const res = await fetch(src, { credentials: "omit" });
        const blob = await res.blob();
        const dataUri: string = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(r.error);
          r.readAsDataURL(blob);
        });
        return [src, dataUri] as const;
      } catch {
        return [src, ""] as const;
      }
    }),
  );
  return Object.fromEntries(entries.filter(([, v]) => v));
}

function inlineAlign(el: Element): "left" | "center" | "right" | undefined {
  const s = (el.getAttribute("style") || "").toLowerCase();
  const m = s.match(/text-align:\s*(left|center|right)/);
  if (m) return m[1] as any;
  return undefined;
}

/** Convert inline (phrasing) content to a pdfmake text array. */
function inlineNodes(nodes: NodeListOf<ChildNode> | Node[]): PmNode[] {
  const out: PmNode[] = [];
  const arr = Array.from(nodes as any as Node[]);
  for (const n of arr) {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n.textContent || "";
      if (t) out.push({ text: t });
      continue;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) continue;
    const el = n as Element;
    const tag = el.tagName.toLowerCase();
    if (tag === "br") {
      out.push({ text: "\n" });
      continue;
    }
    if (tag === "strong" || tag === "b") {
      out.push(...inlineNodes(el.childNodes).map((x) => ({ ...x, bold: true })));
      continue;
    }
    if (tag === "em" || tag === "i") {
      out.push(...inlineNodes(el.childNodes).map((x) => ({ ...x, italics: true })));
      continue;
    }
    if (tag === "u") {
      out.push(...inlineNodes(el.childNodes).map((x) => ({ ...x, decoration: "underline" })));
      continue;
    }
    if (tag === "span") {
      const style = (el.getAttribute("style") || "").toLowerCase();
      const color = /color:\s*(#[0-9a-f]{3,8})/.exec(style)?.[1];
      const size = /font-size:\s*(\d+(?:\.\d+)?)(?:pt|px)/.exec(style);
      const fontSize = size ? Math.round(parseFloat(size[1]) * (size[0].endsWith("px") ? 0.75 : 1) * 10) / 10 : undefined;
      out.push(
        ...inlineNodes(el.childNodes).map((x) => ({
          ...x,
          ...(color ? { color } : {}),
          ...(fontSize ? { fontSize } : {}),
        })),
      );
      continue;
    }
    if (tag === "img") {
      // Images inside inline flow are rendered as separate nodes; caller must
      // hoist them out. We flag with placeholder so paragraph walker can split.
      const src = el.getAttribute("src") || "";
      out.push({ text: "", _image: src });
      continue;
    }
    // Unknown: recurse for text content.
    out.push(...inlineNodes(el.childNodes));
  }
  return out;
}

function textOf(el: Element): string {
  return (el.textContent || "").replace(/\s+/g, " ").trim();
}

function classList(el: Element): string[] {
  return (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);
}

function pushParagraph(out: PmNode[], el: Element, images: Record<string, string>) {
  const align = inlineAlign(el);
  const style = (el.getAttribute("style") || "").toLowerCase();
  const marginTop = /margin-top:\s*(\d+)/.exec(style);
  const parts = inlineNodes(el.childNodes);
  // Extract images so they render as separate blocks after the text.
  const imgs: string[] = [];
  const textParts = parts.filter((p) => {
    if (p && p._image) {
      if (images[p._image]) imgs.push(images[p._image]);
      return false;
    }
    return true;
  });
  if (textParts.length) {
    out.push({
      text: textParts,
      alignment: align,
      margin: [0, marginTop ? Math.round(parseInt(marginTop[1]) * 0.5) : 2, 0, 2],
      lineHeight: 1.35,
    });
  }
  for (const img of imgs) out.push({ image: img, width: 120, margin: [0, 4, 0, 4] });
}

/** Services-table (dark header, right-aligned money) → pdfmake table with our layout. */
function servicesTable(tbl: HTMLTableElement): PmNode {
  const rows: PmNode[][] = [];
  const headEl = tbl.querySelector("thead tr");
  const headerCells = headEl ? Array.from(headEl.querySelectorAll("th,td")) : [];
  const columns = headerCells.length || 6;
  if (headEl) {
    rows.push(
      headerCells.map((th) => ({
        text: textOf(th),
        style: "tableHeader",
        fillColor: COLORS.darkBar,
        alignment: /qty|price|sum|money/.test(th.className) ? "right" : "left",
        margin: [4, 6, 4, 6],
      })),
    );
  }
  tbl.querySelectorAll("tbody tr").forEach((tr) => {
    const cells = Array.from(tr.querySelectorAll("td")).map((td) => ({
      text: inlineNodes(td.childNodes),
      style: "tableCell",
      alignment: /money|num/.test(td.className) ? (td.classList.contains("num") ? "center" : "right") : "left",
      color: td.classList.contains("num") ? COLORS.faint : COLORS.text,
      margin: [4, 4, 4, 4],
    }));
    if (cells.length) rows.push(cells);
  });
  tbl.querySelectorAll("tfoot tr").forEach((tr) => {
    const isGrand = tr.classList.contains("grand");
    const tds = Array.from(tr.querySelectorAll("td"));
    const cells: PmNode[] = tds.map((td, i) => {
      const isLast = i === tds.length - 1;
      const colspan = parseInt(td.getAttribute("colspan") || "1", 10);
      const cell: PmNode = {
        text: textOf(td),
        alignment: /money/.test(td.className) ? "right" : "right",
        fontSize: isGrand ? 11 : 9.5,
        bold: isGrand,
        color: isGrand ? COLORS.text : COLORS.muted,
        fillColor: isGrand ? COLORS.gold : undefined,
        margin: [6, isGrand ? 8 : 5, 6, isGrand ? 8 : 5],
      };
      if (colspan > 1) cell.colSpan = colspan;
      // pdfmake requires filler cells when colSpan > 1
      return cell;
    });
    // Insert filler {} after any colSpan > 1
    const expanded: PmNode[] = [];
    for (const c of cells) {
      expanded.push(c);
      if (c.colSpan && c.colSpan > 1) {
        for (let k = 1; k < c.colSpan; k++) expanded.push({});
      }
    }
    if (expanded.length) rows.push(expanded);
  });
  // Column widths: keep 6-col contract layout, widen name column for 5-col
  // specification tables so the description doesn't collapse into a tall
  // narrow strip. Fallback: equal widths.
  let widths: any = Array(columns).fill("*");
  if (columns === 6) widths = [20, "*", 40, 40, 65, 75];
  else if (columns === 5) widths = ["*", 55, 40, 70, 70];
  return {
    table: {
      headerRows: headEl ? 1 : 0,
      dontBreakRows: true,
      widths,
      body: rows,
    },
    layout: {
      hLineWidth: (i: number, node: any) =>
        i === 0 || i === node.table.body.length ? 0 : 0.5,
      vLineWidth: () => 0,
      hLineColor: () => COLORS.sectionRule,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 4, 0, 6],
  };
}

/** Bank-header table (invoice top block). */
function bankHeaderTable(tbl: HTMLTableElement): PmNode {
  const rows: PmNode[][] = [];
  tbl.querySelectorAll("tr").forEach((tr) => {
    const tds = Array.from(tr.querySelectorAll("td"));
    const cells = tds.map((td) => {
      const cell: PmNode = {
        text: inlineNodes(td.childNodes),
        style: "bankCell",
        fillColor: COLORS.warmBg,
        margin: [6, 5, 6, 5],
      };
      const colspan = parseInt(td.getAttribute("colspan") || "1", 10);
      const rowspan = parseInt(td.getAttribute("rowspan") || "1", 10);
      if (colspan > 1) cell.colSpan = colspan;
      if (rowspan > 1) cell.rowSpan = rowspan;
      return cell;
    });
    const expanded: PmNode[] = [];
    for (const c of cells) {
      expanded.push(c);
      if (c.colSpan && c.colSpan > 1) for (let k = 1; k < c.colSpan; k++) expanded.push({});
    }
    if (expanded.length) rows.push(expanded);
  });
  const cols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return {
    table: {
      widths: cols === 3 ? ["*", 80, 140] : Array(cols).fill("*"),
      body: rows,
      dontBreakRows: true,
    },
    layout: {
      hLineWidth: (i: number, node: any) => (i === 0 ? 1.5 : i === node.table.body.length ? 1.5 : 0.5),
      vLineWidth: () => 0.5,
      hLineColor: (i: number, node: any) =>
        i === 0 ? COLORS.darkBar : i === node.table.body.length ? COLORS.gold : COLORS.sectionRule,
      vLineColor: () => COLORS.sectionRule,
    },
    margin: [0, 0, 0, 10],
  };
}

/** Generic fallback table. */
function genericTable(tbl: HTMLTableElement): PmNode {
  const rows: PmNode[][] = [];
  tbl.querySelectorAll("tr").forEach((tr, ri) => {
    const cells = Array.from(tr.querySelectorAll("th,td")).map((td) => {
      const isHead = td.tagName === "TH" || ri === 0;
      return {
        text: inlineNodes(td.childNodes),
        bold: isHead,
        fontSize: isHead ? 9.5 : 10,
        fillColor: isHead ? COLORS.warmBg : undefined,
        margin: [4, 4, 4, 4],
      } as PmNode;
    });
    if (cells.length) rows.push(cells);
  });
  if (!rows.length) return { text: "" };
  const cols = rows[0].length;
  return {
    table: { widths: Array(cols).fill("*"), body: rows, dontBreakRows: true, headerRows: 1 },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLORS.sectionRule,
      vLineColor: () => COLORS.sectionRule,
    },
    margin: [0, 4, 0, 8],
  };
}

/** Render a .signatures container as a two-column layout. */
function signaturesBlock(container: Element, images: Record<string, string>): PmNode {
  const blocks = Array.from(container.querySelectorAll(".signature-block"));
  const cols = blocks.map((block) => {
    // 1) Header text lines (party name, INN, address, bank…)
    const headerLines: PmNode[] = [];
    let signatureLineEl: Element | null = null;
    Array.from(block.children).forEach((child) => {
      const tag = child.tagName.toLowerCase();
      if (tag === "p") {
        const parts = inlineNodes(child.childNodes).filter((p) => !p._image);
        if (parts.length) headerLines.push({ text: parts, margin: [0, 1, 0, 1] });
      } else if (child.classList.contains("signature-line") && !signatureLineEl) {
        signatureLineEl = child;
      }
    });

    // 2) Signature stage — fixed-height footer that holds line + signature + stamp
    //    side-by-side so the stamp never pushes the card taller.
    const stampEl = block.querySelector("img.stamp-img");
    const stampData = stampEl ? images[stampEl.getAttribute("src") || ""] : "";
    const sigImgEl = block.querySelector("img.signature-img");
    const sigImgData = sigImgEl ? images[sigImgEl.getAttribute("src") || ""] : "";
    const sigCaption = signatureLineEl
      ? inlineNodes(signatureLineEl.childNodes).filter((p) => !p._image)
      : [];

    // Right side: invisible top spacer → signature image (if any) → underline → caption.
    const rightStack: PmNode[] = [];
    rightStack.push({ text: " ", margin: [0, 8, 0, 0] });
    if (sigImgData) {
      rightStack.push({ image: sigImgData, fit: [95, 32], alignment: "center", margin: [0, 0, 0, -6] });
    } else {
      rightStack.push({ text: " ", margin: [0, 14, 0, 0] });
    }
    rightStack.push({
      canvas: [{ type: "line", x1: 0, y1: 0, x2: 175, y2: 0, lineWidth: 0.7, lineColor: COLORS.text }],
      margin: [0, 0, 0, 2],
    });
    if (sigCaption.length) {
      rightStack.push({ text: sigCaption, fontSize: 9, color: COLORS.text });
    }

    // Left side: stamp fits into fixed cell so it overlaps the signature line
    // area without inflating card height.
    const leftCell: PmNode = stampData
      ? { image: stampData, fit: [92, 92], opacity: 0.92, alignment: "center", margin: [0, -6, 0, 0] }
      : { text: "" };

    const stage: PmNode = {
      columns: [
        { width: 100, stack: [leftCell] },
        { width: "*", stack: rightStack },
      ],
      columnGap: 6,
      margin: [0, 8, 0, 0],
    };

    return { stack: [...headerLines, stage], style: "signature", margin: [0, 0, 0, 0] };
  });
  // Two-column signature block with gold left rule using a wrapping table per column
  const wrapped = cols.map((c) => ({
    table: { widths: [3, "*"], body: [[{ text: "", fillColor: COLORS.gold }, { stack: c.stack, fillColor: COLORS.warmBg, margin: [10, 10, 10, 12] }]] },
    layout: "noBorders",
    unbreakable: true,
  }));
  if (wrapped.length === 1) return { ...wrapped[0], margin: [0, 14, 0, 0], unbreakable: true };
  // Wrap the whole two-column signatures row as unbreakable so the two parties
  // never split across pages.
  return {
    stack: [{ columns: wrapped, columnGap: 12 }],
    margin: [0, 14, 0, 0],
    unbreakable: true,
  };
}

/** Totals-box (invoice discount). */
function totalsBox(el: Element): PmNode {
  const rows: PmNode[] = [];
  el.querySelectorAll(".row").forEach((r) => {
    const grand = r.classList.contains("grand");
    rows.push({
      table: {
        widths: ["*", "auto"],
        body: [[
          { text: textOf(r.querySelector("span:first-child") || r), alignment: "left", bold: grand, color: grand ? COLORS.text : COLORS.muted, fontSize: grand ? 12 : 10, margin: [8, grand ? 8 : 4, 8, grand ? 8 : 4] },
          { text: textOf(r.querySelector("span:last-child") || r), alignment: "right", bold: grand, color: grand ? COLORS.text : COLORS.muted, fontSize: grand ? 12 : 10, margin: [8, grand ? 8 : 4, 8, grand ? 8 : 4] },
        ]],
      },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0, fillColor: () => (grand ? COLORS.gold : undefined) },
      margin: [0, 2, 0, 2],
    });
  });
  return { stack: rows, alignment: "right", margin: [0, 10, 0, 0] };
}

function isBlockTag(tag: string) {
  return [
    "div", "section", "article", "header", "footer", "main", "aside",
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "table",
  ].includes(tag);
}

/** Recursively walk a DOM node and push pdfmake nodes into `out`. */
export function walk(node: Element, out: PmNode[], images: Record<string, string>) {
  const children = Array.from(node.children);
  // If node has no element children but has text, treat as paragraph.
  if (!children.length) {
    const t = (node.textContent || "").trim();
    if (t) out.push({ text: inlineNodes(node.childNodes), style: "body" });
    return;
  }
  for (const el of children) {
    const tag = el.tagName.toLowerCase();
    const classes = classList(el);

    if (classes.includes("brand-strip")) continue;

    // Appendices / annexes (Спецификация, Поручение на обработку ПДн, …)
    // must always start on a new page and try to stay together so the
    // heading + table + totals + signatures do not split across pages.
    if (classes.includes("page-break")) {
      const inner: PmNode[] = [];
      walk(el, inner, images);
      if (inner.length) {
        // Mark the first node as page-break-before; wrap the rest as an
        // unbreakable stack when it plausibly fits on one page.
        inner[0] = { ...inner[0], pageBreak: "before" };
        out.push({ stack: inner, unbreakable: true, margin: [0, 0, 0, 0] });
      }
      continue;
    }

    if (classes.includes("kicker")) {
      out.push({ text: textOf(el), style: "kicker" });
      continue;
    }
    if (classes.includes("header-row")) {
      const spans = Array.from(el.querySelectorAll("span"));
      out.push({
        columns: spans.map((s, i) => ({ text: textOf(s), alignment: i === spans.length - 1 ? "right" : "left" })),
        style: "meta",
      });
      continue;
    }
    if (classes.includes("signatures")) {
      out.push(signaturesBlock(el, images));
      continue;
    }
    if (classes.includes("totals-box")) {
      out.push(totalsBox(el));
      continue;
    }
    if (tag === "h1") {
      out.push({ text: textOf(el), style: "h1" });
      // Gold underline
      out.push({ canvas: [{ type: "rect", x: 227, y: 0, w: 60, h: 3, color: COLORS.gold, r: 1 }], margin: [0, -4, 0, 6] });
      continue;
    }
    if (tag === "h2") {
      out.push({ text: textOf(el).toUpperCase(), style: "h2", pageBreak: undefined });
      out.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 499, y2: 0, lineWidth: 0.6, lineColor: COLORS.gold }], margin: [0, -4, 0, 6] });
      continue;
    }
    if (tag === "h3") {
      out.push({ text: textOf(el), style: "h3" });
      continue;
    }
    if (tag === "p") {
      pushParagraph(out, el, images);
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.querySelectorAll(":scope > li")).map((li) => ({ text: inlineNodes(li.childNodes), style: "body" }));
      out.push(tag === "ul" ? { ul: items, margin: [0, 4, 0, 4] } : { ol: items, margin: [0, 4, 0, 4] });
      continue;
    }
    if (tag === "table") {
      if (classes.includes("services-table")) out.push(servicesTable(el as HTMLTableElement));
      else if (classes.includes("bank-header")) out.push(bankHeaderTable(el as HTMLTableElement));
      else out.push(genericTable(el as HTMLTableElement));
      continue;
    }
    if (tag === "img") {
      const src = el.getAttribute("src") || "";
      const data = images[src];
      if (data) out.push({ image: data, width: 120, margin: [0, 4, 0, 4] });
      continue;
    }
    if (tag === "br") {
      out.push({ text: " ", margin: [0, 0, 0, 2] });
      continue;
    }
    // Div / section / article / etc → recurse
    if (isBlockTag(tag)) {
      walk(el, out, images);
      continue;
    }
    // Fallback: treat as inline paragraph
    const t = textOf(el);
    if (t) out.push({ text: inlineNodes(el.childNodes), style: "body" });
  }
}

/** Parse the full HTML string into a Document (jsdom-like, browser DOMParser). */
export function parseDoc(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

export { IMG_PLACEHOLDER };