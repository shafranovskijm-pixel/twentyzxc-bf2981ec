import type { TzPayload } from "./types";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU");
};

const fmtMoney = (v?: number) => {
  if (v === undefined || v === null) return "";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(v) + " ₽";
};

/** HTML for screen preview + html2canvas → PDF. A4-friendly width 794px. */
export function renderTzHtml(payload: TzPayload, opts: { tzNumber?: string; tzDate?: string; title?: string; appendixNumber?: string; contractNumber?: string; contractDate?: string }): string {
  const { tzNumber, tzDate, title, appendixNumber, contractNumber, contractDate } = opts;

  const sectionsHtml = payload.sections
    .filter(s => s.enabled !== false)
    .map((s, idx) => {
      const checked = s.items.filter(i => i.checked);
      if (checked.length === 0 && !s.customNote) return "";
      const items = checked
        .map(i => `<li>${escape(i.label)}${i.note ? ` <span style="color:#666;">— ${escape(i.note)}</span>` : ""}</li>`)
        .join("");
      const note = s.customNote
        ? `<p style="margin:6px 0 0;color:#444;font-style:italic;">${escape(s.customNote)}</p>`
        : "";
      return `
        <section style="margin:14px 0;page-break-inside:avoid;">
          <h2 style="font-size:14px;color:#15171e;margin:0 0 6px;border-bottom:2px solid #d4be37;padding-bottom:3px;">
            ${escape(s.title)}
          </h2>
          <ul style="margin:6px 0 0 18px;padding:0;">${items}</ul>
          ${note}
        </section>
      `;
    })
    .join("");

  const header = `
    <div style="text-align:center;margin-bottom:18px;">
      <div style="font-size:11px;color:#777;letter-spacing:2px;text-transform:uppercase;">Техническое задание</div>
      <h1 style="font-size:22px;margin:6px 0 4px;color:#15171e;">${escape(title || "Техническое задание")}</h1>
      <div style="font-size:12px;color:#444;">
        ${tzNumber ? `№&nbsp;${escape(tzNumber)}` : ""}
        ${tzNumber && tzDate ? " · " : ""}
        ${tzDate ? `от ${escape(fmtDate(tzDate))}` : ""}
      </div>
      ${appendixNumber || contractNumber ? `<div style="font-size:11px;color:#8a6d12;margin-top:6px;font-style:italic;">
        Приложение${appendixNumber ? ` №&nbsp;${escape(appendixNumber)}` : ""}${contractNumber ? ` к&nbsp;Договору №&nbsp;${escape(contractNumber)}` : ""}${contractDate ? ` от ${escape(fmtDate(contractDate))}` : ""}
      </div>` : ""}
    </div>
  `;

  const reqRows: [string, string | undefined][] = [
    ["Заказчик", payload.client_name],
    ["ИНН", payload.client_inn],
    ["Юр. адрес", payload.legal_address],
    ["Руководитель", payload.director_name],
    ["Договор",
      payload.contract_number || payload.contract_date
        ? `${payload.contract_number ? "№ " + payload.contract_number : ""}${payload.contract_date ? " от " + fmtDate(payload.contract_date) : ""}`.trim()
        : undefined,
    ],
    ["Сумма по договору", payload.contract_amount ? fmtMoney(payload.contract_amount) : undefined],
    ["Сфера / тематика", payload.project_scope],
    ["Срок реализации", payload.deadline_days ? `${payload.deadline_days} рабочих дней` : undefined],
    ["Домен", payload.domain],
    ["Референсы", payload.references],
  ];

  const reqHtml = `
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px;">
      <tbody>
        ${reqRows
          .filter(([, v]) => v && String(v).trim())
          .map(
            ([k, v]) => `
          <tr>
            <td style="padding:4px 8px;border:1px solid #e5e5e5;background:#fafafa;width:32%;color:#444;">${escape(k)}</td>
            <td style="padding:4px 8px;border:1px solid #e5e5e5;">${escape(String(v))}</td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  `;

  const signature = `
    <div style="margin-top:30px;display:flex;gap:40px;font-size:12px;page-break-inside:avoid;">
      <div style="flex:1;">
        <div style="border-bottom:1px solid #333;height:32px;"></div>
        <div style="margin-top:4px;color:#444;">Исполнитель</div>
      </div>
      <div style="flex:1;">
        <div style="border-bottom:1px solid #333;height:32px;"></div>
        <div style="margin-top:4px;color:#444;">Заказчик / ${escape(payload.client_name)}</div>
      </div>
    </div>
  `;

  return `<!doctype html><html><head><meta charset="utf-8"><title>ТЗ</title></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;color:#15171e;background:#fff;padding:30px 36px;font-size:12.5px;line-height:1.5;">
  ${header}
  ${reqHtml}
  ${sectionsHtml}
  ${signature}
</body></html>`;
}

/** Generate PDF blob via html2canvas + jsPDF (matches DocumentsTab pattern). */
export async function exportTzPdf(html: string, fileName: string): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:absolute;left:-9999px;top:0;width:794px;border:none;";
  document.body.appendChild(iframe);
  iframe.srcdoc = html;
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("iframe timeout")), 10000);
    iframe.onload = () => { clearTimeout(t); resolve(); };
  });
  await new Promise(r => setTimeout(r, 300));

  const body = iframe.contentDocument!.body;
  iframe.style.height = body.scrollHeight + "px";

  const canvas = await html2canvas(body, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: 794,
    height: body.scrollHeight,
    windowWidth: 794,
    windowHeight: body.scrollHeight,
    logging: false,
  });
  document.body.removeChild(iframe);

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pdfW) / canvas.width;
  let heightLeft = imgH;
  let position = 0;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  pdf.addImage(imgData, "JPEG", 0, position, pdfW, imgH);
  heightLeft -= pdfH;
  while (heightLeft > 0) {
    position -= pdfH;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, pdfW, imgH);
    heightLeft -= pdfH;
  }
  pdf.save(fileName);
}

/** Generate DOCX (Word) via docx package. */
export async function exportTzDocx(payload: TzPayload, opts: { tzNumber?: string; tzDate?: string; title?: string; fileName: string; appendixNumber?: string; contractNumber?: string; contractDate?: string }): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = await import("docx");

  const titleP = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: opts.title || "Техническое задание", bold: true, size: 36 })],
  });
  const subP = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({
      text: [opts.tzNumber ? `№ ${opts.tzNumber}` : "", opts.tzDate ? `от ${new Date(opts.tzDate).toLocaleDateString("ru-RU")}` : ""].filter(Boolean).join("  "),
      size: 22,
      color: "555555",
    })],
  });
  const appendixP = (opts.appendixNumber || opts.contractNumber) ? new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({
      text: `Приложение${opts.appendixNumber ? ` № ${opts.appendixNumber}` : ""}${opts.contractNumber ? ` к Договору № ${opts.contractNumber}` : ""}${opts.contractDate ? ` от ${new Date(opts.contractDate).toLocaleDateString("ru-RU")}` : ""}`,
      italics: true, size: 20, color: "8A6D12",
    })],
  }) : null;

  // Requisites table
  const rows: [string, string | undefined][] = [
    ["Заказчик", payload.client_name],
    ["ИНН", payload.client_inn],
    ["Юр. адрес", payload.legal_address],
    ["Руководитель", payload.director_name],
    ["Договор", payload.contract_number || payload.contract_date
      ? `${payload.contract_number ? "№ " + payload.contract_number : ""}${payload.contract_date ? " от " + new Date(payload.contract_date).toLocaleDateString("ru-RU") : ""}`.trim()
      : undefined],
    ["Сумма по договору", payload.contract_amount ? new Intl.NumberFormat("ru-RU").format(payload.contract_amount) + " ₽" : undefined],
    ["Сфера / тематика", payload.project_scope],
    ["Срок реализации", payload.deadline_days ? `${payload.deadline_days} рабочих дней` : undefined],
    ["Домен", payload.domain],
    ["Референсы", payload.references],
  ].filter(r => r[1] && String(r[1]).trim()) as [string, string][];

  const border = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
  const reqTable = new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [3000, 6000],
    rows: rows.map(([k, v]) => new TableRow({
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          borders: { top: border, bottom: border, left: border, right: border },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 6000, type: WidthType.DXA },
          borders: { top: border, bottom: border, left: border, right: border },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: v as string, size: 20 })] })],
        }),
      ],
    })),
  });

  const sectionParas: any[] = [];
  for (const s of payload.sections.filter(s => s.enabled !== false)) {
    const checked = s.items.filter(i => i.checked);
    if (checked.length === 0 && !s.customNote) continue;
    sectionParas.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: s.title, bold: true, size: 26, color: "15171E" })],
    }));
    for (const item of checked) {
      sectionParas.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: item.label, size: 22 }),
          ...(item.note ? [new TextRun({ text: ` — ${item.note}`, size: 22, color: "666666", italics: true })] : []),
        ],
      }));
    }
    if (s.customNote) {
      sectionParas.push(new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: s.customNote, italics: true, size: 22, color: "444444" })],
      }));
    }
  }

  const sigP = new Paragraph({
    spacing: { before: 400 },
    children: [new TextRun({ text: "_______________________   /   _______________________", size: 22 })],
  });
  const sigLabel = new Paragraph({
    children: [new TextRun({ text: `Исполнитель                                Заказчик / ${payload.client_name}`, size: 18, color: "555555" })],
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{
      properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
      children: [titleP, subP, ...(appendixP ? [appendixP] : []), reqTable, new Paragraph({ children: [new TextRun(" ")] }), ...sectionParas, sigP, sigLabel],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}