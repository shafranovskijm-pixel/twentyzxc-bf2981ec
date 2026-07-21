/** Public PDF API — thin wrapper over the pdfmake-based vector renderer. */
import { renderPdfFromHtml } from "./pdf/render";

export async function generatePdfBlob(
  htmlContent: string,
  meta?: { title?: string },
): Promise<Blob> {
  return renderPdfFromHtml(htmlContent, meta);
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
