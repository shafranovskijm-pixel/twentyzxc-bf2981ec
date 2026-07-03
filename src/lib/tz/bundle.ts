import { PDFDocument } from "pdf-lib";
import { generatePdfBlob } from "@/lib/document-pdf";

/** Render an HTML string to a PDF Blob using html2canvas + jsPDF (same recipe as tz/render.ts). */
async function htmlToPdfBlob(html: string): Promise<Blob> {
  return generatePdfBlob(html);
}

/** Merge an ordered list of HTML pages into a single PDF and trigger download. */
export async function mergeHtmlsToPdf(parts: { label: string; html: string }[], fileName: string): Promise<void> {
  if (parts.length === 0) throw new Error("Нет документов для сборки пакета");

  const merged = await PDFDocument.create();
  for (const part of parts) {
    const blob = await htmlToPdfBlob(part.html);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const src = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach(p => merged.addPage(p));
  }

  const out = await merged.save();
  // Copy into a fresh ArrayBuffer to satisfy Blob's typing across TS lib versions.
  const buf = new ArrayBuffer(out.byteLength);
  new Uint8Array(buf).set(out);
  const blob = new Blob([buf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
