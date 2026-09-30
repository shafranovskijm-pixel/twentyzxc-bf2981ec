import JSZip from "jszip";
import { CrmError } from "./service";

export const CLIENT_FILE_MIME = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;
export type ClientFileExtension = keyof typeof CLIENT_FILE_MIME;
const decoder = new TextDecoder();
const XML_LIMIT = 512 * 1024;
function invalid(extension: ClientFileExtension): never {
  throw new CrmError(`INVALID_${extension.toUpperCase()}`, "Содержимое файла не соответствует выбранному формату PDF или Word. Оригинальный файл не сохранён.");
}

// Inspect the central directory before JSZip parses anything. Only the small
// content-types manifest is inflated; document text, images and embedded files
// are never expanded or executed. ZIP64 and split/encrypted archives fail closed.
function inspectDocxDirectory(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 22 || view.getUint32(0, true) !== 0x04034b50) invalid("docx");
  let end = bytes.length - 22;
  const minimum = Math.max(0, end - 65535);
  while (end >= minimum && (view.getUint32(end, true) !== 0x06054b50 || end + 22 + view.getUint16(end + 20, true) !== bytes.length)) end--;
  if (end < minimum) invalid("docx");
  const entries = view.getUint16(end + 10, true);
  const size = view.getUint32(end + 12, true);
  let offset = view.getUint32(end + 16, true);
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true)
    || view.getUint16(end + 8, true) !== entries || !entries || entries > 2048 || offset + size !== end) invalid("docx");
  const names = new Set<string>();
  let totalExpanded = 0;
  for (let i = 0; i < entries; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) invalid("docx");
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressed = view.getUint32(offset + 20, true);
    const expanded = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const local = view.getUint32(offset + 42, true);
    if (offset + 46 + nameLength + extraLength + commentLength > end || (flags & 0x41)
      || ![0, 8].includes(method) || view.getUint16(offset + 34, true) || local + 30 > offset) invalid("docx");
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (!name || names.has(name) || /(^|\/)\.\.(\/|$)|\\|\0/.test(name) || name.startsWith("/") || /vbaproject\.bin$/i.test(name)) invalid("docx");
    names.add(name);
    totalExpanded += expanded;
    if (totalExpanded > 100 * 1024 * 1024 || (name === "[Content_Types].xml" && expanded > XML_LIMIT)) invalid("docx");
    if (view.getUint32(local, true) !== 0x04034b50 || view.getUint16(local + 8, true) !== method || view.getUint16(local + 6, true) !== flags) invalid("docx");
    const localNameLength = view.getUint16(local + 26, true);
    const localExtraLength = view.getUint16(local + 28, true);
    const start = local + 30 + localNameLength + localExtraLength;
    if (start + compressed > offset || decoder.decode(bytes.subarray(local + 30, local + 30 + localNameLength)) !== name) invalid("docx");
    offset += 46 + nameLength + extraLength + commentLength;
  }
  if (offset !== end || !names.has("[Content_Types].xml") || !names.has("word/document.xml")) invalid("docx");
}

async function boundedZipText(entry: JSZip.JSZipObject): Promise<string> {
  // JSZip documents internalStream, but omits it from JSZipObject's TS interface.
  const stream = (entry as JSZip.JSZipObject & { internalStream(type: "uint8array"): JSZip.JSZipStreamHelper<Uint8Array> }).internalStream("uint8array");
  return await new Promise<string>((resolve, reject) => {
    let total = 0; const chunks: Uint8Array[] = [];
    stream.on("data", chunk => {
      total += chunk.length;
      if (total > XML_LIMIT) { stream.pause(); reject(new Error("Oversized manifest")); return; }
      chunks.push(chunk);
    }).on("error", reject).on("end", () => {
      const result = new Uint8Array(total); let offset = 0;
      for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
      resolve(decoder.decode(result));
    }).resume();
  });
}

async function validateDocx(bytes: Uint8Array) {
  try {
    inspectDocxDirectory(bytes);
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: false, createFolders: false });
    const manifest = zip.file("[Content_Types].xml");
    const document = zip.file("word/document.xml");
    if (!manifest || manifest.dir || !document || document.dir) invalid("docx");
    const xml = await boundedZipText(manifest);
    if (/<!DOCTYPE|<!ENTITY|macroEnabled|vbaProject/i.test(xml)) invalid("docx");
    const overrides = xml.match(/<(?:[\w.-]+:)?Override\b[^>]*>/g) || [];
    const mainType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
    const valid = overrides.some(tag => {
      const attributes = Object.fromEntries(Array.from(tag.matchAll(/\b(PartName|ContentType)\s*=\s*(["'])(.*?)\2/g), match => [match[1], match[3]]));
      return attributes.PartName === "/word/document.xml" && attributes.ContentType === mainType;
    });
    if (!valid) invalid("docx");
  } catch { invalid("docx"); }
}

// Legacy .doc is an OLE compound file. Follow only bounded FAT/directory
// sectors to identify its WordDocument stream; do not read or execute streams.
function validateDoc(bytes: Uint8Array) {
  const signature = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
  if (bytes.length < 512 || signature.some((value, i) => bytes[i] !== value)) invalid("doc");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const major = view.getUint16(26, true); const shift = view.getUint16(30, true);
  if (view.getUint16(28, true) !== 0xfffe || !((major === 3 && shift === 9) || (major === 4 && shift === 12))) invalid("doc");
  const sectorSize = 2 ** shift;
  const count = Math.floor(bytes.length / sectorSize) - 1;
  const sector = (id: number) => {
    if (id >= count) invalid("doc");
    return (id + 1) * sectorSize;
  };
  const fatCount = view.getUint32(44, true);
  if (!fatCount || fatCount > Math.ceil(count / (sectorSize / 4))) invalid("doc");
  const fat: number[] = [];
  for (let i = 0; i < 109; i++) { const id = view.getUint32(76 + i * 4, true); if (id !== 0xffffffff) fat.push(id); }
  const difatCount = view.getUint32(72, true); let difat = view.getUint32(68, true);
  if (difatCount > count) invalid("doc");
  const seenDifat = new Set<number>();
  for (let i = 0; i < difatCount; i++) {
    if (seenDifat.has(difat)) invalid("doc");
    seenDifat.add(difat); const start = sector(difat);
    for (let p = 0; p < sectorSize - 4; p += 4) {
      const id = view.getUint32(start + p, true);
      if (id !== 0xffffffff) fat.push(id);
      if (fat.length > fatCount) invalid("doc");
    }
    difat = view.getUint32(start + sectorSize - 4, true);
  }
  if (fat.length !== fatCount || new Set(fat).size !== fat.length) invalid("doc");
  fat.forEach(sector);
  const nextSector = (id: number) => {
    const fatIndex = Math.floor(id / (sectorSize / 4));
    if (fatIndex >= fat.length) invalid("doc");
    return view.getUint32(sector(fat[fatIndex]) + (id % (sectorSize / 4)) * 4, true);
  };
  let directory = view.getUint32(48, true); let wordFound = false;
  const seenDirectory = new Set<number>();
  while (directory !== 0xfffffffe) {
    if (seenDirectory.has(directory) || seenDirectory.size >= count) invalid("doc");
    seenDirectory.add(directory); const start = sector(directory);
    for (let p = 0; p < sectorSize; p += 128) {
      const length = view.getUint16(start + p + 64, true);
      if (view.getUint8(start + p + 66) !== 2 || length < 2 || length > 64 || length % 2) continue;
      const name = new TextDecoder("utf-16le").decode(bytes.subarray(start + p, start + p + length - 2));
      if (name === "WordDocument" && view.getUint32(start + p + 120, true) > 0) wordFound = true;
    }
    directory = nextSector(directory);
  }
  if (!wordFound) invalid("doc");
}

export async function validateClientFileBytes(bytes: Uint8Array, extension: ClientFileExtension): Promise<void> {
  if (extension === "pdf") {
    if (decoder.decode(bytes.subarray(0, 5)) !== "%PDF-" || !decoder.decode(bytes.subarray(-2048)).includes("%%EOF")) invalid("pdf");
  } else if (extension === "docx") await validateDocx(bytes);
  else { try { validateDoc(bytes); } catch { invalid("doc"); } }
}
