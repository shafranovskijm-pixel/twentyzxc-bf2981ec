import { buildPdfDefinition } from "./definition.ts";
import { parseDoc, resolveImages } from "./html-to-pdfmake.ts";

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

/** Render an HTML document string as a text-first vector PDF Blob. */
export async function renderPdfFromHtml(html: string, meta?: { title?: string }): Promise<Blob> {
  const doc = parseDoc(html);
  const images = await resolveImages(doc);
  const pdfMake = await getPdfMake();
  const docDefinition = buildPdfDefinition(doc, images, meta?.title);

  // pdfmake 0.3+ returns a Promise from getBlob(); older versions used a callback.
  const pdfDoc: any = pdfMake.createPdf(docDefinition);
  const result = pdfDoc.getBlob();
  if (result && typeof (result as Promise<Blob>).then === "function") {
    return await (result as Promise<Blob>);
  }
  return await new Promise<Blob>((resolve, reject) => {
    try {
      pdfDoc.getBlob((b: Blob) => resolve(b));
    } catch (e) {
      reject(e);
    }
  });
}