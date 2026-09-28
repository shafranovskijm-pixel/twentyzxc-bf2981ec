import { COLORS, PAGE, STYLES } from "./theme.ts";
import { walk } from "./html-to-pdfmake.ts";

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


/** Shared branded definition; all DOM and image resolution belong to the caller. */
export function buildPdfDefinition(doc: Document, images: Record<string, string>, title?: string): any {
  const content: any[] = [];
  if (doc.body) walk(doc.body, content, images);
  const pageWidth = 595.28;
  const documentTitle = (title || doc.title || "24ZXC документ").trim();
  return {
    pageSize: PAGE.size,
    pageMargins: PAGE.margins,
    defaultStyle: { font: "Roboto", fontSize: 10, color: COLORS.text, lineHeight: 1.32 },
    styles: STYLES as any,
    header: () => headerFn(pageWidth),
    footer: footerFn(documentTitle, pageWidth),
    content,
    info: { title: documentTitle, creator: "24ZXC", producer: "24ZXC PDF" },
  };
}
