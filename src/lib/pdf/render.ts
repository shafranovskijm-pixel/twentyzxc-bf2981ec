import { COLORS, PAGE, STYLES } from "./theme";
import { parseDoc, resolveImages, walk } from "./html-to-pdfmake";

let pdfMakePromise: Promise<any> | null = null;

async function getPdfMake() {
  if (!pdfMakePromise) {
    pdfMakePromise = (async () => {
      const [pdfMakeMod, vfsMod] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        // vfs_fonts is a UMD side-effect module: it attaches to
        // window.pdfMake.vfs. We import it after pdfMake for that reason.
        import("pdfmake/build/vfs_fonts"),
      ]);
      const pdfMake: any = (pdfMakeMod as any).default || pdfMakeMod;
      const vfs: any = (vfsMod as any).default || vfsMod;
      // pdfmake 0.3+ uses addVirtualFileSystem(); older builds exposed .vfs.
      const vfsMap = vfs?.pdfMake?.vfs || vfs?.vfs || vfs;
      if (typeof pdfMake.addVirtualFileSystem === "function") {
        pdfMake.addVirtualFileSystem(vfsMap);
      } else {
        pdfMake.vfs = vfsMap;
      }
      pdfMake.fonts = {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
          italics: "Roboto-Italic.ttf",
          bolditalics: "Roboto-MediumItalic.ttf",
        },
      };
      return pdfMake;
    })();
  }
  return pdfMakePromise;
}

function headerFn(pageWidth: number) {
  return {
    margin: 0,
    stack: [
      {
        canvas: [
          { type: "rect", x: 0, y: 0, w: pageWidth, h: 32, color: COLORS.darkBar },
        ],
      },
      {
        columns: [
          {
            width: "*",
            margin: [PAGE.margins[3], -22, 0, 0],
            text: [
              { text: "24", color: COLORS.invert, bold: true, fontSize: 14, characterSpacing: 1 },
              { text: "ZXC", color: COLORS.gold, bold: true, fontSize: 14, characterSpacing: 1 },
            ],
          },
          {
            width: "auto",
            margin: [0, -18, PAGE.margins[1], 0],
            text: "WEB & LICENSING STUDIO",
            color: COLORS.gold,
            fontSize: 7,
            characterSpacing: 2,
            alignment: "right",
          },
        ],
      },
    ],
  };
}

function footerFn(title: string, pageWidth: number) {
  return (currentPage: number, pageCount: number) => ({
    margin: [PAGE.margins[3], 4, PAGE.margins[1], 0],
    stack: [
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: pageWidth - PAGE.margins[3] - PAGE.margins[1],
            y2: 0,
            lineWidth: 0.6,
            lineColor: COLORS.gold,
          },
        ],
      },
      {
        columns: [
          { text: title || "24ZXC · Web & Licensing Studio", color: COLORS.paperFooter, fontSize: 8, margin: [0, 6, 0, 0] },
          { text: `Страница ${currentPage} из ${pageCount}`, color: COLORS.paperFooter, fontSize: 8, alignment: "right", margin: [0, 6, 0, 0] },
        ],
      },
    ],
  });
}

/** Render an HTML document string as a text-first vector PDF Blob. */
export async function renderPdfFromHtml(html: string, meta?: { title?: string }): Promise<Blob> {
  const doc = parseDoc(html);
  const images = await resolveImages(doc);
  const content: any[] = [];
  const body = doc.body;
  if (body) walk(body, content, images);

  // A4 width in pt for the header canvas
  const A4_WIDTH_PT = 595.28;
  const pdfMake = await getPdfMake();

  const documentTitle = (meta?.title || doc.title || "24ZXC документ").trim();

  const docDefinition: any = {
    pageSize: PAGE.size,
    pageMargins: PAGE.margins,
    defaultStyle: { font: "Roboto", fontSize: 10, color: COLORS.text, lineHeight: 1.32 },
    styles: STYLES as any,
    header: () => headerFn(A4_WIDTH_PT),
    footer: footerFn(documentTitle, A4_WIDTH_PT),
    content,
    info: { title: documentTitle, creator: "24ZXC", producer: "24ZXC PDF" },
  };

  return await new Promise<Blob>((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition).getBlob((b: Blob) => resolve(b));
    } catch (e) {
      reject(e);
    }
  });
}