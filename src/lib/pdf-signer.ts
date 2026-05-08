import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - vite ?url import
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { preloadDocumentImages } from "./document-images";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfjsWorker;

function dataUriToBytes(dataUri: string): Uint8Array {
  const base64 = dataUri.split(",")[1];
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

type Anchor = { x: number; y: number; pageWidth: number; pageHeight: number; pageIndex: number };

/**
 * Scan PDF text using pdf.js and find positions of "М.П." anchors (preferring left half).
 * Returns one anchor per page where found.
 */
async function findStampAnchors(buf: ArrayBuffer): Promise<Anchor[]> {
  const pdf = await (pdfjsLib as any).getDocument({ data: buf.slice(0) }).promise;
  const anchors: Anchor[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;
    const tc = await page.getTextContent();

    type Cand = { x: number; y: number };
    const stamps: Cand[] = [];

    for (const it of tc.items as any[]) {
      const str = (it.str || "").trim();
      if (!str) continue;
      // PDF user space: transform = [a,b,c,d,e,f] -> e=x, f=y (baseline)
      const x = it.transform[4];
      const y = it.transform[5];
      if (/^М\.?\s*П\.?$/i.test(str) || str.includes("М.П.")) {
        stamps.push({ x, y });
      }
    }

    // Prefer left half
    const leftStamps = stamps.filter(s => s.x < pageWidth / 2);
    const chosen = leftStamps[0] || stamps[0];
    if (chosen) {
      anchors.push({ x: chosen.x, y: chosen.y, pageWidth, pageHeight, pageIndex: p - 1 });
    }
  }

  return anchors;
}

/**
 * Sign a PDF: overlay signature.png + stamp.png near each detected "М.П." anchor.
 * If no anchors detected, places signature/stamp at bottom-left of the last page.
 */
export async function signPdf(file: File): Promise<{ bytes: Uint8Array; anchorsFound: number }> {
  const buf = await file.arrayBuffer();
  const imgs = await preloadDocumentImages();

  const pdfDoc = await PDFDocument.load(buf);
  const sigPng = await pdfDoc.embedPng(dataUriToBytes(imgs.signature));
  const stampPng = await pdfDoc.embedPng(dataUriToBytes(imgs.stamp));

  const anchors = await findStampAnchors(buf);
  const pages = pdfDoc.getPages();

  // Sizing in PDF points
  const STAMP_W = 140;
  const STAMP_H = (stampPng.height / stampPng.width) * STAMP_W;
  const SIG_W = 160;
  const SIG_H = (sigPng.height / sigPng.width) * SIG_W;

  if (anchors.length === 0) {
    // Fallback: bottom-left of last page
    const page = pages[pages.length - 1];
    const { width, height } = page.getSize();
    page.drawImage(sigPng, {
      x: 60,
      y: 100,
      width: SIG_W,
      height: SIG_H,
      opacity: 0.95,
    });
    page.drawImage(stampPng, {
      x: 60,
      y: 40,
      width: STAMP_W,
      height: STAMP_H,
      opacity: 0.85,
    });
  } else {
    for (const a of anchors) {
      const page = pages[a.pageIndex];
      // Stamp: centered on "М.П." text, slight rotation for realism
      const stampX = a.x - STAMP_W * 0.35;
      const stampY = a.y - STAMP_H * 0.35;
      page.drawImage(stampPng, {
        x: stampX,
        y: stampY,
        width: STAMP_W,
        height: STAMP_H,
        opacity: 0.85,
        rotate: degrees(-4),
      });
      // Signature: above stamp, on the signature underline (~35pt above М.П.)
      const sigX = a.x - 20;
      const sigY = a.y + 22;
      page.drawImage(sigPng, {
        x: sigX,
        y: sigY,
        width: SIG_W,
        height: SIG_H,
        opacity: 0.95,
      });
    }
  }

  const bytes = await pdfDoc.save();
  return { bytes, anchorsFound: anchors.length };
}
