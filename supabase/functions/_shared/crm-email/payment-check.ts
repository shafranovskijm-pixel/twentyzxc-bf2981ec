import { assertCurrentBankText, type CurrentBankPolicy } from "../current-bank-requisites.ts";
import type { EmailAttachment, SmtpEmail } from "./smtp.ts";

const MAX_PAGES = 40;
const MAX_TEXT_CHARS = 2 * 1024 * 1024;
const MAX_XML_BYTES = 2 * 1024 * 1024;
const MAX_WORD_XML_BYTES = 4 * 1024 * 1024;
const MAX_PARSE_MS = 10_000;
const decoder = new TextDecoder();

export class PaymentRequisitesUnverifiedError extends Error {
  readonly code = "CRM_PAYMENT_REQUISITES_UNVERIFIED";
  constructor() {
    super("Не удалось проверить банковские реквизиты в фактическом вложении. Отправка остановлена. Создайте PDF или DOCX с доступным текстом и актуальными реквизитами.");
    this.name = "PaymentRequisitesUnverifiedError";
  }
}
function unverified(): never { throw new PaymentRequisitesUnverifiedError(); }
export interface ExtractedPaymentText { text: string; links?: string[] }
export interface PaymentCheckDependencies {
  extractPdf?: (bytes: Uint8Array) => Promise<ExtractedPaymentText>;
  extractDocx?: (bytes: Uint8Array) => Promise<ExtractedPaymentText>;
  timeoutMs?: number;
}

async function bounded<T>(action: () => Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([action(), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new PaymentRequisitesUnverifiedError()), ms);
    })]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}

/** The serverless PDF.js build does not execute PDF scripts or fetch PDF links. */
export async function extractPdfPaymentText(bytes: Uint8Array): Promise<ExtractedPaymentText> {
  let document: Awaited<ReturnType<typeof import("npm:unpdf@1.8.1").getDocumentProxy>> | undefined;
  try {
    const { getDocumentProxy, extractText, extractLinks } = await import("npm:unpdf@1.8.1");
    document = await getDocumentProxy(bytes.slice(), {
      maxImageSize: 16_000_000, useSystemFonts: false,
      disableFontFace: true, stopAtErrors: true,
    });
    if (!Number.isInteger(document.numPages) || document.numPages < 1 || document.numPages > MAX_PAGES) unverified();
    const extracted = await extractText(document);
    // A scan or an unreadable page could hide bank details, even if other pages have text.
    if (!extracted.text.length || extracted.text.some(page => !page.trim())) unverified();
    const text = extracted.text.join("\n");
    if (text.length > MAX_TEXT_CHARS) unverified();
    const { links } = await extractLinks(document);
    return { text, links };
  } catch { return unverified(); }
  finally { if (document) await document.loadingTask.destroy(); }
}

// Validate the central directory before inflating Word XML. Embedded images and
// binaries are never expanded. ZIP64, encryption and unsafe paths fail closed.
function inspectDocx(bytes: Uint8Array): Set<string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 22 || view.getUint32(0, true) !== 0x04034b50) unverified();
  let end = bytes.length - 22;
  const minimum = Math.max(0, end - 65535);
  while (end >= minimum && (view.getUint32(end, true) !== 0x06054b50 || end + 22 + view.getUint16(end + 20, true) !== bytes.length)) end--;
  if (end < minimum) unverified();
  const entries = view.getUint16(end + 10, true);
  const size = view.getUint32(end + 12, true);
  let offset = view.getUint32(end + 16, true);
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || view.getUint16(end + 8, true) !== entries
    || !entries || entries > 2048 || offset + size !== end) unverified();
  const names = new Set<string>();
  let expandedXml = 0;
  for (let i = 0; i < entries; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) unverified();
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressed = view.getUint32(offset + 20, true);
    const expanded = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const local = view.getUint32(offset + 42, true);
    if (offset + 46 + nameLength + extraLength + commentLength > end || (flags & 0x41) || ![0, 8].includes(method)
      || view.getUint16(offset + 34, true) || local + 30 > offset) unverified();
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (!name || names.has(name) || /(^|\/)\.\.(\/|$)|\\|\0/.test(name) || name.startsWith("/") || /vbaproject\.bin$/i.test(name)) unverified();
    names.add(name);
    if (name.endsWith(".xml") || name.endsWith(".rels")) {
      expandedXml += expanded;
      if (expanded > MAX_XML_BYTES || expandedXml > MAX_WORD_XML_BYTES) unverified();
    }
    if (view.getUint32(local, true) !== 0x04034b50 || view.getUint16(local + 8, true) !== method || view.getUint16(local + 6, true) !== flags) unverified();
    const localNameLength = view.getUint16(local + 26, true);
    const localExtraLength = view.getUint16(local + 28, true);
    if (local + 30 + localNameLength + localExtraLength + compressed > offset
      || decoder.decode(bytes.subarray(local + 30, local + 30 + localNameLength)) !== name) unverified();
    offset += 46 + nameLength + extraLength + commentLength;
  }
  if (offset !== end || !names.has("[Content_Types].xml") || !names.has("word/document.xml")) unverified();
  return names;
}

/** Inspect actual DOCX body, headers/footers and hyperlinks, including split Word runs. */
export async function extractDocxPaymentText(bytes: Uint8Array): Promise<ExtractedPaymentText> {
  try {
    const names = inspectDocx(bytes);
    const [{ default: JSZip }, { DOMParser }] = await Promise.all([import("npm:jszip@3.10.1"), import("npm:linkedom@0.18.12")]);
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: false, createFolders: false });
    const parts: string[] = [];
    const links: string[] = [];
    for (const name of names) {
      if (!(/^word\/.*\.xml$/i.test(name) || /\.rels$/i.test(name))) continue;
      const entry = zip.file(name);
      if (!entry || entry.dir) unverified();
      const bytes = await entry.async("uint8array");
      if (bytes.length > MAX_XML_BYTES) unverified();
      const xml = decoder.decode(bytes);
      if (/<!DOCTYPE|<!ENTITY/i.test(xml)) unverified();
      const document = new DOMParser().parseFromString(xml, "text/xml");
      if (document.querySelector("parsererror")) unverified();
      if (name.endsWith(".rels")) {
        for (const element of document.getElementsByTagName("Relationship")) {
          const target = element.getAttribute("Target");
          if (target) links.push(target);
        }
      } else {
        const tokens = [...document.getElementsByTagName("w:t"), ...document.getElementsByTagName("w:instrText")];
        parts.push(tokens.map(token => token.textContent || "").join(" "));
      }
    }
    const text = parts.join("\n");
    if (!text.trim() || text.length > MAX_TEXT_CHARS) unverified();
    return { text, links };
  } catch { return unverified(); }
}

function attachmentBytes(attachment: EmailAttachment): Uint8Array {
  try { return Uint8Array.from(atob(attachment.base64), character => character.charCodeAt(0)); }
  catch { return unverified(); }
}
function assertLinkText(link: string, policy: CurrentBankPolicy) {
  assertCurrentBankText(link, policy);
  try { assertCurrentBankText(decodeURIComponent(link), policy); } catch (error) {
    if (!(error instanceof URIError)) throw error;
  }
}

function requiresOwnBankTuple(text: string, policy: CurrentBankPolicy): boolean {
  // The owner's INN can legitimately appear as the customer of another issuer.
  // Prefer the actual document's explicit supplier/recipient section over any INN mention.
  const issuers: string[] = [];
  for (const match of text.matchAll(/(?:Исполнитель|Получатель|Поставщик)(?![\p{L}])/giu)) {
    const section = text.slice(match.index! + match[0].length, match.index! + match[0].length + 3000)
      .split(/(?:Заказчик|Покупатель)(?![\p{L}])/iu)[0];
    const inn = /ИНН[^0-9]{0,15}([0-9]{10,12})(?![0-9])/iu.exec(section)?.[1];
    if (inn) issuers.push(inn);
  }
  return !issuers.length || issuers.includes(policy.issuer_inn);
}

/** Called after authentication and before any SMTP connection or message submission. */
export async function assertLegacyEmailCurrentBankRequisites(
  email: Pick<SmtpEmail, "subject" | "html" | "attachments">,
  policy: CurrentBankPolicy | null,
  dependencies: PaymentCheckDependencies = {},
): Promise<void> {
  if (!policy) return;
  assertCurrentBankText(`${email.subject}\n${email.html}`, policy);
  for (const match of email.html.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi)) assertLinkText(match[2], policy);
  const deadline = Date.now() + (dependencies.timeoutMs ?? MAX_PARSE_MS);
  for (const attachment of email.attachments) {
    const type = attachment.contentType?.toLowerCase();
    const name = attachment.filename.toLowerCase();
    let extracted: ExtractedPaymentText;
    try {
      if (name.endsWith(".pdf") || type === "application/pdf") {
        extracted = await bounded(() => (dependencies.extractPdf || extractPdfPaymentText)(attachmentBytes(attachment)), Math.max(1, deadline - Date.now()));
      } else if (name.endsWith(".docx") || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        extracted = await bounded(() => (dependencies.extractDocx || extractDocxPaymentText)(attachmentBytes(attachment)), Math.max(1, deadline - Date.now()));
      } else {
        // .doc and other opaque files cannot prove which bank details will reach the client.
        unverified();
      }
      if (!extracted.text.trim() || extracted.text.length > MAX_TEXT_CHARS) unverified();
    } catch { return unverified(); }
    assertCurrentBankText(extracted.text, policy, requiresOwnBankTuple(extracted.text, policy));
    for (const link of extracted.links || []) assertLinkText(link, policy);
  }
}
