import { PDFDocument } from "pdf-lib";

/** Render an HTML string to a PDF Blob using html2canvas + jsPDF (same recipe as tz/render.ts). */
async function htmlToPdfBlob(html: string): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:absolute;left:-9999px;top:0;width:794px;border:none;";
  document.body.appendChild(iframe);
  iframe.srcdoc = html;
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("iframe timeout")), 12000);
    iframe.onload = () => { clearTimeout(t); resolve(); };
  });
  await new Promise(r => setTimeout(r, 250));

  const body = iframe.contentDocument!.body;
  iframe.style.height = body.scrollHeight + "px";

  const canvas = await html2canvas(body, {
    scale: 1.2,
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
  const imgData = canvas.toDataURL("image/jpeg", 0.9);
  pdf.addImage(imgData, "JPEG", 0, position, pdfW, imgH);
  heightLeft -= pdfH;
  while (heightLeft > 0) {
    position -= pdfH;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, pdfW, imgH);
    heightLeft -= pdfH;
  }
  return pdf.output("blob");
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
