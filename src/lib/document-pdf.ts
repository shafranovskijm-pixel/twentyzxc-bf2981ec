/** Render an HTML document into a PDF Blob via html2canvas + jsPDF. */
export async function generatePdfBlob(htmlContent: string): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.width = "794px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  iframe.srcdoc = htmlContent;
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("iframe timeout")), 10000);
    iframe.onload = () => {
      clearTimeout(t);
      resolve();
    };
  });
  await new Promise((r) => setTimeout(r, 500));

  const body = iframe.contentDocument!.body;
  iframe.style.height = body.scrollHeight + "px";

  const canvas = await html2canvas(body, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: 794,
    height: body.scrollHeight,
    windowWidth: 794,
    windowHeight: body.scrollHeight,
    logging: false,
    imageTimeout: 5000,
  });
  document.body.removeChild(iframe);

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  const margin = 10;
  const usable = pdfHeight - margin * 2;
  let heightLeft = imgHeight;
  let page = 0;
  while (heightLeft > 0) {
    if (page > 0) pdf.addPage();
    const yOffset = margin - page * usable;
    pdf.addImage(imgData, "PNG", 0, yOffset, pdfWidth, imgHeight, undefined, "FAST");
    heightLeft -= usable;
    page++;
  }
  return pdf.output("blob");
}

/** Convert a Blob to base64 (without data: prefix). */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safePdfFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, "_");
}
