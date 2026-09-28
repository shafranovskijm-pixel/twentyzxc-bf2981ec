/// <reference lib="dom" />
import pdfMakeModule from "npm:pdfmake@0.3.11";
import fontModule from "npm:pdfmake@0.3.11/build/vfs_fonts.js";
import { DOMParser } from "npm:linkedom@0.18.12";
import { buildPdfDefinition } from "../../../../src/lib/pdf/definition.ts";

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 4 * MAX_IMAGE_BYTES;
const MAX_IMAGES = 8;
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 10_000;
const ORIGINS = new Set(["https://24zxc.ru", "https://twentyzxc.lovable.app"]);
const ASSET_PATHS = new Set(["/images/signature.png", "/images/stamp.png"]);
type ImageMime = "image/png" | "image/jpeg";
export class PdfRenderError extends Error {
  constructor(readonly code: string) { super(code); this.name = "PdfRenderError"; }
}
export interface PdfRenderDependencies {
  fetch?: typeof globalThis.fetch;
}

function fail(code: string): never { throw new PdfRenderError(code); }
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}
function checkDimensions(width: number, height: number) {
  if (!width || !height || width > 6000 || height > 6000 || width * height > 16_000_000)
    fail("PDF_IMAGE_DIMENSIONS_INVALID");
}
function validateImage(bytes: Uint8Array, declaredMime: ImageMime): void {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) fail("PDF_IMAGE_SIZE_INVALID");
  if (declaredMime === "image/png") {
    const magic = [137, 80, 78, 71, 13, 10, 26, 10];
    if (bytes.length < 24 || !magic.every((value, index) => bytes[index] === value)
      || new TextDecoder().decode(bytes.subarray(12, 16)) !== "IHDR") fail("PDF_IMAGE_FORMAT_INVALID");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    checkDimensions(view.getUint32(16), view.getUint32(20));
    return;
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) fail("PDF_IMAGE_FORMAT_INVALID");
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) fail("PDF_IMAGE_FORMAT_INVALID");
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd8) continue;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) fail("PDF_IMAGE_FORMAT_INVALID");
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (length < 8) fail("PDF_IMAGE_FORMAT_INVALID");
      checkDimensions((bytes[offset + 5] << 8) | bytes[offset + 6], (bytes[offset + 3] << 8) | bytes[offset + 4]);
      return;
    }
    offset += length;
  }
  fail("PDF_IMAGE_FORMAT_INVALID");
}
function dataImage(src: string): { bytes: Uint8Array; mime: ImageMime } {
  if (src.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 40) fail("PDF_IMAGE_SIZE_INVALID");
  const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(src);
  if (!match || match[2].length % 4 !== 0) fail("PDF_IMAGE_FORMAT_INVALID");
  let binary: string;
  try { binary = atob(match[2]); } catch { return fail("PDF_IMAGE_FORMAT_INVALID"); }
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  const mime = match[1] as ImageMime;
  validateImage(bytes, mime);
  return { bytes, mime };
}
function allowedAsset(src: string): string {
  // Relative paths from legacy same-origin templates are resolved only against
  // the canonical CRM host, never against an HTML <base> element.
  if (ASSET_PATHS.has(src)) return `https://24zxc.ru${src}`;
  let url: URL;
  try { url = new URL(src); } catch { return fail("PDF_IMAGE_SOURCE_NOT_ALLOWED"); }
  if (!ORIGINS.has(url.origin) || !ASSET_PATHS.has(url.pathname)
    || url.username || url.password || url.search || url.hash
    || url.href !== `${url.origin}${url.pathname}`) fail("PDF_IMAGE_SOURCE_NOT_ALLOWED");
  return url.href;
}
async function readBounded(response: Response): Promise<Uint8Array> {
  const length = response.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_IMAGE_BYTES)) fail("PDF_IMAGE_SIZE_INVALID");
  if (!response.body) fail("PDF_IMAGE_FETCH_FAILED");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel();
        fail("PDF_IMAGE_SIZE_INVALID");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}
async function imageForSource(src: string, fetcher: typeof fetch): Promise<{ bytes: Uint8Array; mime: ImageMime }> {
  if (src.startsWith("data:")) return dataImage(src);
  const url = allowedAsset(src);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    const response = await fetcher(url, { redirect: "manual", credentials: "omit", signal: controller.signal });
    if (!response.ok || response.redirected || response.status >= 300
      || (response.url && response.url !== url)) fail("PDF_IMAGE_FETCH_FAILED");
    const mime = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (mime !== "image/png" && mime !== "image/jpeg") fail("PDF_IMAGE_FORMAT_INVALID");
    const bytes = await readBounded(response);
    validateImage(bytes, mime);
    return { bytes, mime };
  } catch (error) {
    if (error instanceof PdfRenderError) throw error;
    return fail("PDF_IMAGE_FETCH_FAILED");
  } finally { clearTimeout(timeout); }
}

/** Strict server resolver. Every referenced image must resolve; signatures are never silently dropped. */
export async function resolveDocumentImages(doc: Document, fetcher: typeof fetch = globalThis.fetch): Promise<Record<string, string>> {
  const sources = new Set<string>();
  for (const img of Array.from(doc.querySelectorAll("img"))) {
    const src = img.getAttribute("src");
    if (!src) fail("PDF_IMAGE_SOURCE_NOT_ALLOWED");
    sources.add(src);
  }
  if (sources.size > MAX_IMAGES) fail("PDF_TOO_MANY_IMAGES");
  const images: Record<string, string> = Object.create(null);
  let totalBytes = 0;
  for (const src of sources) {
    const { bytes, mime } = await imageForSource(src, fetcher);
    totalBytes += bytes.length;
    if (totalBytes > MAX_TOTAL_IMAGE_BYTES) fail("PDF_IMAGE_SIZE_INVALID");
    images[src] = `data:${mime};base64,${bytesToBase64(bytes)}`;
  }
  return images;
}

/** Render exact saved HTML with the shared 24ZXC layout. Never uses global DOM state. */
export async function renderDocumentPdf(html: string, title: string, dependencies: PdfRenderDependencies = {}): Promise<Uint8Array> {
  if (typeof html !== "string" || !html.trim() || new TextEncoder().encode(html).length > MAX_HTML_BYTES)
    fail("PDF_HTML_SIZE_INVALID");
  if (typeof title !== "string" || !title.trim() || title.length > 300 || /[\u0000-\u001f]/.test(title)) fail("PDF_TITLE_INVALID");
  const doc = new DOMParser().parseFromString(html, "text/html") as unknown as Document;
  if (!doc?.body || !doc.body.textContent?.trim()) fail("PDF_EMPTY_DOCUMENT");
  if (doc.querySelector("script,iframe,object,embed")) fail("PDF_ACTIVE_CONTENT_NOT_ALLOWED");
  const images = await resolveDocumentImages(doc, dependencies.fetch ?? globalThis.fetch);
  const definition = buildPdfDefinition(doc, images, title);
  if (!definition.content.length) fail("PDF_EMPTY_DOCUMENT");
  // npm:pdfmake exports an instance. Its constructor and virtual FS constructor
  // create isolated state: concurrent renders cannot alter each other's fonts,
  // images, resource policies or document definitions.
  const module: any = pdfMakeModule;
  const engine = new module.constructor();
  engine.virtualfs = new module.virtualfs.constructor();
  engine.setUrlAccessPolicy(() => false);
  engine.setLocalAccessPolicy(() => false);
  const fontFiles: Record<string, string> = (fontModule as any).pdfMake?.vfs ?? (fontModule as any).vfs ?? fontModule;
  for (const name of ["Roboto-Regular.ttf", "Roboto-Medium.ttf", "Roboto-Italic.ttf", "Roboto-MediumItalic.ttf"]) {
    if (typeof fontFiles[name] !== "string") fail("PDF_FONT_UNAVAILABLE");
    engine.virtualfs.writeFileSync(name, fontFiles[name], "base64");
  }
  engine.setFonts({ Roboto: { normal: "Roboto-Regular.ttf", bold: "Roboto-Medium.ttf", italics: "Roboto-Italic.ttf", bolditalics: "Roboto-MediumItalic.ttf" } });
  try {
    const bytes = new Uint8Array(await engine.createPdf(definition).getBuffer());
    if (bytes.length > MAX_PDF_BYTES) fail("PDF_OUTPUT_TOO_LARGE");
    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") fail("PDF_RENDER_FAILED");
    return bytes;
  } catch (error) {
    if (error instanceof PdfRenderError) throw error;
    return fail("PDF_RENDER_FAILED");
  }
}
