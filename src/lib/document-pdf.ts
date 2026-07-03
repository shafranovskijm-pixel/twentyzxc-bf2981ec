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

  // Collect vertical ranges (in body px, top→bottom) that must NOT be split across pages.
  const noBreakEls = Array.from(
    iframe.contentDocument!.querySelectorAll<HTMLElement>("[data-no-break='true']")
  );
  const bodyRect = body.getBoundingClientRect();
  const noBreakRanges: Array<{ top: number; bottom: number }> = noBreakEls
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top - bodyRect.top, bottom: r.bottom - bodyRect.top };
    })
    .filter((r) => r.bottom > r.top)
    .sort((a, b) => a.top - b.top);

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
  // Convert canvas-space ranges → pdf-mm (imgHeight is in mm, corresponds to canvas.height px)
  const pxToMm = imgHeight / canvas.height;
  const scale = canvas.height / body.scrollHeight; // px canvas per body px
  const noBreakMm = noBreakRanges.map((r) => ({
    top: r.top * scale * pxToMm,
    bottom: r.bottom * scale * pxToMm,
  }));

  // Walk the image top→bottom; for each page decide how many mm to consume,
  // shrinking the page if a no-break range would be split.
  let consumed = 0;
  let page = 0;
  while (consumed < imgHeight - 0.5) {
    if (page > 0) pdf.addPage();
    let pageHeight = Math.min(usable, imgHeight - consumed);
    const pageEnd = consumed + pageHeight;
    // If any no-break range straddles pageEnd, cut the page earlier at its top.
    for (const r of noBreakMm) {
      if (r.top > consumed + 5 && r.top < pageEnd && r.bottom > pageEnd) {
        const shortened = r.top - consumed;
        if (shortened > 20) {
          pageHeight = shortened;
        }
        break;
      }
    }
    const yOffset = margin - consumed;
    pdf.addImage(imgData, "PNG", 0, yOffset, pdfWidth, imgHeight, undefined, "FAST");
    consumed += pageHeight;
    page++;
    if (page > 50) break; // safety
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
