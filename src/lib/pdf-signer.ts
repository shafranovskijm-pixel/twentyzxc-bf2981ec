import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - vite ?url import
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { preloadDocumentImages } from "./document-images";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Sizing in PDF points (1pt = 1/72in). Used everywhere consistently.
export const STAMP_W_PT = 140;
export const SIG_W_PT = 160;

function dataUriToBytes(dataUri: string): Uint8Array {
  const base64 = dataUri.split(",")[1];
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export type Placement = {
  // Position of the BOTTOM-LEFT corner of each image, in PDF points (PDF origin = bottom-left of page).
  sigX: number;
  sigY: number;
  stampX: number;
  stampY: number;
};

export type PageInfo = {
  pageIndex: number;
  pageWidthPt: number;
  pageHeightPt: number;
};

export type LoadedPdf = {
  buf: ArrayBuffer;
  pages: PageInfo[];
  /** Initial placements per page derived from "М.П." anchors or fallback. */
  initial: Record<number, Placement>;
  /** Image natural sizes (px) so we can keep aspect ratio. */
  sigAspect: number; // height/width
  stampAspect: number;
};

let cachedAspects: { sig: number; stamp: number } | null = null;

async function getAspects(): Promise<{ sig: number; stamp: number }> {
  if (cachedAspects) return cachedAspects;
  const imgs = await preloadDocumentImages();
  const load = (src: string) => new Promise<{ w: number; h: number }>((res, rej) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = rej;
    img.src = src;
  });
  const [s, st] = await Promise.all([load(imgs.signature), load(imgs.stamp)]);
  cachedAspects = { sig: s.h / s.w, stamp: st.h / st.w };
  return cachedAspects;
}

/** Compute initial placements per page using "М.П." anchors when present. */
async function computeInitialPlacements(buf: ArrayBuffer, sigAspect: number, stampAspect: number): Promise<{ pages: PageInfo[]; initial: Record<number, Placement> }> {
  const pdf = await (pdfjsLib as any).getDocument({ data: buf.slice(0) }).promise;
  const pages: PageInfo[] = [];
  const initial: Record<number, Placement> = {};

  const STAMP_H = STAMP_W_PT * stampAspect;
  const SIG_H = SIG_W_PT * sigAspect;

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const pageWidthPt = viewport.width;
    const pageHeightPt = viewport.height;
    pages.push({ pageIndex: p - 1, pageWidthPt, pageHeightPt });

    const tc = await page.getTextContent();
    type Cand = { x: number; y: number };
    const stamps: Cand[] = [];
    for (const it of tc.items as any[]) {
      const str = (it.str || "").trim();
      if (!str) continue;
      const x = it.transform[4];
      const y = it.transform[5];
      if (/^М\.?\s*П\.?$/i.test(str) || str.includes("М.П.")) {
        stamps.push({ x, y });
      }
    }
    const leftStamps = stamps.filter(s => s.x < pageWidthPt / 2);
    const chosen = leftStamps[0] || stamps[0];

    if (chosen) {
      // Anchor x,y is baseline of the "М.П." text. Place stamp roughly centered there.
      const stampX = Math.max(0, chosen.x - STAMP_W_PT * 0.35);
      const stampY = Math.max(0, chosen.y - STAMP_H * 0.35);
      const sigX = Math.max(0, chosen.x - 20);
      const sigY = chosen.y + 22;
      initial[p - 1] = { sigX, sigY, stampX, stampY };
    } else {
      // Default: bottom-left, only on the LAST page
      if (p === pdf.numPages) {
        initial[p - 1] = { sigX: 60, sigY: 100, stampX: 60, stampY: 40 };
      }
    }
  }

  return { pages, initial };
}

export async function loadPdf(file: File): Promise<LoadedPdf> {
  const buf = await file.arrayBuffer();
  const { sig, stamp } = await getAspects();
  const { pages, initial } = await computeInitialPlacements(buf, sig, stamp);
  return { buf, pages, initial, sigAspect: sig, stampAspect: stamp };
}

/** Render a page to a data URL at a scale that fits targetWidthPx. */
export async function renderPagePreview(
  buf: ArrayBuffer,
  pageIndex: number,
  targetWidthPx: number,
): Promise<{ dataUrl: string; widthPx: number; heightPx: number; scale: number }> {
  const pdf = await (pdfjsLib as any).getDocument({ data: buf.slice(0) }).promise;
  const page = await pdf.getPage(pageIndex + 1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = targetWidthPx / baseViewport.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), widthPx: canvas.width, heightPx: canvas.height, scale };
}

/** Sign PDF using user-provided placements (per page). Pages without entries are left untouched. */
export async function signPdfWithPlacements(
  buf: ArrayBuffer,
  placements: Record<number, Placement>,
): Promise<Uint8Array> {
  const imgs = await preloadDocumentImages();
  const pdfDoc = await PDFDocument.load(buf);
  const sigPng = await pdfDoc.embedPng(dataUriToBytes(imgs.signature));
  const stampPng = await pdfDoc.embedPng(dataUriToBytes(imgs.stamp));
  const pages = pdfDoc.getPages();

  const STAMP_H = (stampPng.height / stampPng.width) * STAMP_W_PT;
  const SIG_H = (sigPng.height / sigPng.width) * SIG_W_PT;

  for (const [idxStr, pl] of Object.entries(placements)) {
    const idx = Number(idxStr);
    const page = pages[idx];
    if (!page) continue;
    page.drawImage(stampPng, {
      x: pl.stampX,
      y: pl.stampY,
      width: STAMP_W_PT,
      height: STAMP_H,
      opacity: 0.85,
      rotate: degrees(-4),
    });
    page.drawImage(sigPng, {
      x: pl.sigX,
      y: pl.sigY,
      width: SIG_W_PT,
      height: SIG_H,
      opacity: 0.95,
    });
  }

  return await pdfDoc.save();
}

/** Get base64 data URIs for the signature and stamp images (for UI overlay). */
export async function getOverlayImages(): Promise<{ signature: string; stamp: string }> {
  return await preloadDocumentImages();
}
