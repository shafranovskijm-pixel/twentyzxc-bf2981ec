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
  const bodyHeight = body.scrollHeight;
  iframe.style.height = bodyHeight + "px";

  // Collect vertical ranges (in body px, top→bottom) that must NOT be split across pages.
  // Besides explicit markers, protect legal paragraphs, table rows and signature blocks so
  // a rendered PDF page never slices through text, rows, signature or stamp imagery.
  const noBreakEls = Array.from(
    iframe.contentDocument!.querySelectorAll<HTMLElement>(
      "[data-no-break='true'], .signatures, .signature-block, .signature-line, .bank-header, .services-table tr, h1, h2, h3, p, li"
    )
  );
  const bodyRect = body.getBoundingClientRect();
  const noBreakRanges: Array<{ top: number; bottom: number }> = noBreakEls
    .map((el) => {
      const r = el.getBoundingClientRect();
      let top = r.top - bodyRect.top;
      let bottom = r.bottom - bodyRect.top;
      // Expand to include absolutely-positioned / overflowing descendants
      // (e.g. stamp images anchored with bottom:-10px on the signature block).
      el.querySelectorAll<HTMLElement>("*").forEach((child) => {
        const cr = child.getBoundingClientRect();
        if (cr.width === 0 && cr.height === 0) return;
        const cTop = cr.top - bodyRect.top;
        const cBottom = cr.bottom - bodyRect.top;
        if (cTop < top) top = cTop;
        if (cBottom > bottom) bottom = cBottom;
      });
      // Small safety padding so borders/shadows aren't clipped.
      return { top: Math.max(0, top - 4), bottom: bottom + 10 };
    })
    .filter((r) => r.bottom > r.top && r.bottom - r.top < bodyHeight * 0.8)
    .sort((a, b) => a.top - b.top);

  const renderScale = bodyHeight > 14000 ? 1.25 : bodyHeight > 10000 ? 1.5 : 2;
  const canvas = await html2canvas(body, {
    scale: renderScale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: 794,
    height: bodyHeight,
    windowWidth: 794,
    windowHeight: bodyHeight,
    logging: false,
    imageTimeout: 5000,
  });
  document.body.removeChild(iframe);

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  const margin = 10;
  const usable = pdfHeight - margin * 2;
  // Convert canvas-space ranges → pdf-mm (imgHeight is in mm, corresponds to canvas.height px)
  const pxToMm = imgHeight / canvas.height;
  const scale = canvas.height / bodyHeight; // px canvas per body px
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
        if (shortened > 8) {
          pageHeight = shortened;
        }
        break;
      }
    }

    // Render only the chosen slice for this page. This is important: adding the
    // whole long canvas with a Y offset cannot respect a shortened pageHeight,
    // so it still visually cuts through signatures/rows. A real cropped slice
    // leaves the protected range for the next page.
    const srcY = Math.floor((consumed / imgHeight) * canvas.height);
    const sliceCanvasHeight = Math.max(1, Math.ceil((pageHeight / imgHeight) * canvas.height));
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceCanvasHeight;
    const ctx = sliceCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      srcY,
      canvas.width,
      sliceCanvasHeight,
      0,
      0,
      canvas.width,
      sliceCanvasHeight,
    );
    const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(sliceData, "JPEG", 0, margin, pdfWidth, pageHeight, undefined, "FAST");
    consumed += pageHeight;
    page++;
    if (page > 50) break; // safety
  }
  return pdf.output("blob");
}

export async function generatePdfBase64(htmlContent: string): Promise<string> {
  const blob = await generatePdfBlob(htmlContent);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error || new Error("Не удалось прочитать PDF"));
    reader.readAsDataURL(blob);
  });
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
