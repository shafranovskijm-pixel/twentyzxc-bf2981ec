import type { jsPDF } from "jspdf";

// Roboto TTF from Google Fonts CDN. Fetched once, cached in-memory as base64,
// then registered into each jsPDF instance so Cyrillic in the header/footer
// renders correctly instead of becoming gibberish under the default Helvetica.
const REGULAR_URL =
  "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf";
const BOLD_URL =
  "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.ttf";

let cache: { regular: string; bold: string } | null = null;
let inflight: Promise<{ regular: string; bold: string } | null> | null = null;

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font fetch ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

async function loadFonts(): Promise<{ regular: string; bold: string } | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const [regular, bold] = await Promise.all([
        fetchAsBase64(REGULAR_URL),
        fetchAsBase64(BOLD_URL),
      ]);
      cache = { regular, bold };
      return cache;
    } catch (e) {
      console.warn("pdf-fonts: failed to load Roboto, falling back to helvetica", e);
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Register Roboto (regular + bold) into a jsPDF doc. Returns the family name to use. */
export async function ensurePdfFont(doc: jsPDF): Promise<string> {
  const fonts = await loadFonts();
  if (!fonts) return "helvetica";
  doc.addFileToVFS("Roboto-Regular.ttf", fonts.regular);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", fonts.bold);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  return "Roboto";
}