import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { EncryptedPDFError, PDFArray, PDFDict, PDFDocument, PDFName } from "pdf-lib";
import { CrmError, createUserDatabase, requireAdmin } from "./service";
import { downloadChatPdf, type ChatFile } from "./client-files-service";

export type CompanyAssetId = "signature" | "stamp";
export interface CompanyDocumentAsset {
  readonly id: CompanyAssetId; readonly label: string; readonly url: string; readonly contentType: "image/png";
  readonly size: number; readonly sha256: string; readonly width: number; readonly height: number;
}
export const COMPANY_DOCUMENT_ASSETS: readonly CompanyDocumentAsset[] = Object.freeze([
  Object.freeze({ id: "signature" as const, label: "Подпись исполнителя 24ZXC", url: "https://24zxc.ru/images/signature.png",
    contentType: "image/png" as const, size: 4902, sha256: "e18804c80605fe11ca29e93613ddd360f4a81252d4f5c705227c999aff75f787", width: 250, height: 99 }),
  Object.freeze({ id: "stamp" as const, label: "Печать исполнителя 24ZXC", url: "https://24zxc.ru/images/stamp.png",
    contentType: "image/png" as const, size: 220242, sha256: "21481d87bc5f80bd8382e8a0137f19824babf61fd4b72bedbf07c7c14d1e14ef", width: 1920, height: 1920 }),
]);
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 500;
const BUCKET = "contracts";
const ROW_FIELDS = "id,request_id,actor_id,request,source_file_id,source_sha256,output_sha256,output_size,storage_path,file_name,page_count,placements,asset_hashes,created_at";
const HASH = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function hasControl(value: string) { return Array.from(value).some(character => { const code = character.charCodeAt(0); return code < 32 || code >= 127 && code <= 159; }); }

export interface PdfAssetPlacement {
  assetId: CompanyAssetId; pageNumber: number; x: number; y: number; width: number; height: number;
}
export interface ApplyCompanyAssetsInput {
  requestId: string; file: ChatFile; fileName?: string; expectedSourceSha256: string;
  placements: PdfAssetPlacement[]; expectedAssetHashes: Partial<Record<CompanyAssetId, string>>;
}
export interface CompanyAssetDependencies {
  fetcher?: typeof fetch;
  /** Dependency injection for local synthetic tests; the public tool always uses the fixed registry. */
  assets?: readonly CompanyDocumentAsset[];
}
function fail(code: string, message: string): never { throw new CrmError(code, message); }
const DATABASE_MESSAGES: Record<string, string> = {
  CRM_AUTH_REQUIRED: "Требуется вход в CRM.", CRM_FORBIDDEN: "Работа с PDF разрешена администратору CRM.",
  CRM_PRIVATE_STORAGE_REQUIRED: "Сохранение PDF остановлено: приватное хранилище не подтверждено.",
  CRM_INVALID_ARGUMENT: "Проверьте исходный PDF, имя файла, точные координаты и хеши изображений.",
  CRM_REQUEST_CONFLICT: "Этот requestId уже использован для другого PDF, позиции или версии изображения.",
};
function databaseError(error: { message?: string } | null) {
  if (!error) return;
  const code = error.message?.match(/CRM_[A-Z_]+/)?.[0];
  if (code && Object.prototype.hasOwnProperty.call(DATABASE_MESSAGES, code)) fail(code, DATABASE_MESSAGES[code]);
  fail("CRM_SIGNED_PDF_DATABASE_ERROR", "Операция с PDF не подтверждена. Проверьте сохранённый результат и повторяйте с тем же requestId.");
}
function plain(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function exactKeys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).every(key => allowed.includes(key));
}
function canonical(value: unknown): string {
  const order = (part: unknown): unknown => Array.isArray(part) ? part.map(order)
    : plain(part) ? Object.fromEntries(Object.keys(part).sort().map(key => [key, order(part[key])])) : part;
  return JSON.stringify(order(value));
}
export async function companyAssetSha256(bytes: Uint8Array): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer)),
    value => value.toString(16).padStart(2, "0")).join("");
}
function fileReference(file: ChatFile) {
  if (!plain(file) || typeof file.file_id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(file.file_id))
    fail("CRM_INVALID_PDF_REFERENCE", "Передайте исходный PDF через файловый параметр ChatGPT.");
}
function outputName(input: ApplyCompanyAssetsInput): string {
  let name = input.fileName;
  if (name === undefined) {
    const source = input.file.file_name || "document.pdf";
    name = source.replace(/\.pdf$/i, "") + "_подписан.pdf";
  }
  if (typeof name !== "string" || !name.trim() || name !== name.trim() || name.length > 200
    || /[\\/:*?"<>|]/.test(name) || hasControl(name) || !/^.+\.pdf$/i.test(name))
    fail("CRM_INVALID_PDF_FILENAME", "Укажите имя нового PDF до 200 символов, без папок и управляющих символов.");
  return name;
}
function checkedPlacements(value: unknown): PdfAssetPlacement[] {
  if (!Array.isArray(value) || !value.length || value.length > 100)
    fail("CRM_INVALID_PDF_PLACEMENTS", "Укажите от 1 до 100 точных мест для оригинальных подписи и печати.");
  return value.map(item => {
    if (!plain(item) || !exactKeys(item, ["assetId", "pageNumber", "x", "y", "width", "height"])
      || !["signature", "stamp"].includes(item.assetId as string)
      || !Number.isSafeInteger(item.pageNumber) || (item.pageNumber as number) < 1 || (item.pageNumber as number) > MAX_PAGES
      || !["x", "y", "width", "height"].every(key => typeof item[key] === "number" && Number.isFinite(item[key]))
      || ["x", "y", "width", "height"].some(key => (item[key] as number) > 14400)
      || (item.x as number) < 0 || (item.y as number) < 0 || (item.width as number) <= 0 || (item.height as number) <= 0)
      fail("CRM_INVALID_PDF_PLACEMENTS", "Координаты задаются явно в пунктах PDF от левого нижнего угла; размер должен быть положительным.");
    return { assetId: item.assetId as CompanyAssetId, pageNumber: item.pageNumber as number,
      x: item.x as number, y: item.y as number, width: item.width as number, height: item.height as number };
  });
}
export async function downloadCompanyAsset(asset: CompanyDocumentAsset, fetcher: typeof fetch = fetch): Promise<Uint8Array> {
  // The caller cannot supply asset URLs to the public API; every runtime asset is registry-owned.
  const original = COMPANY_DOCUMENT_ASSETS.find(item => item.id === asset.id);
  if (!original || asset.url !== original.url || asset.contentType !== "image/png" || !HASH.test(asset.sha256)
    || !Number.isSafeInteger(asset.size) || asset.size < 24 || asset.size > MAX_IMAGE_BYTES)
    return fail("CRM_COMPANY_ASSET_INVALID", "Источник оригинального изображения не поддерживается.");
  let response: Response;
  try { response = await fetcher(asset.url, { redirect: "manual", credentials: "omit", signal: AbortSignal.timeout(10_000) }); }
  catch { return fail("CRM_COMPANY_ASSET_UNAVAILABLE", "Оригинал подписи или печати недоступен. Изображение не будет заменено."); }
  if (!response.ok || response.redirected || response.status >= 300 || !response.body
    || (response.url && response.url !== asset.url)) return fail("CRM_COMPANY_ASSET_UNAVAILABLE", "Оригинал подписи или печати недоступен.");
  if (response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "image/png")
    return fail("CRM_COMPANY_ASSET_INVALID", "Тип оригинала подписи или печати не подтверждён.");
  const declared = response.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_IMAGE_BYTES))
    return fail("CRM_COMPANY_ASSET_INVALID", "Размер оригинала подписи или печати недопустим.");
  const chunks: Uint8Array[] = []; let total = 0; const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.length;
      if (total > MAX_IMAGE_BYTES) { await reader.cancel(); return fail("CRM_COMPANY_ASSET_INVALID", "Оригинал изображения слишком большой."); }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof CrmError) throw error;
    return fail("CRM_COMPANY_ASSET_UNAVAILABLE", "Загрузка оригинала изображения прервалась.");
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const magic = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || bytes.length !== asset.size || !magic.every((n, index) => bytes[index] === n)
    || new TextDecoder().decode(bytes.subarray(12, 16)) !== "IHDR")
    return fail("CRM_COMPANY_ASSET_INVALID", "Формат оригинала подписи или печати не подтверждён.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16), height = view.getUint32(20);
  if (!width || !height || width > 6000 || height > 6000 || width * height > 16_000_000
    || width !== asset.width || height !== asset.height || await companyAssetSha256(bytes) !== asset.sha256)
    return fail("CRM_COMPANY_ASSET_CHANGED", "Оригинал подписи или печати изменился. Перечитайте сведения об изображениях.");
  return bytes;
}
function signaturePresent(pdf: PDFDocument): boolean {
  // Inspect decoded indirect objects and nested direct dictionaries, including fields that have not been signed yet.
  const visited = new Set<unknown>();
  const visit = (value: unknown): boolean => {
    if (!value || visited.has(value)) return false;
    visited.add(value);
    if (value instanceof PDFDict) {
      if (pdf.context.lookup(value.get(PDFName.of("FT"))) === PDFName.of("Sig") || pdf.context.lookup(value.get(PDFName.of("Type"))) === PDFName.of("Sig")
        || value.has(PDFName.of("ByteRange"))) return true;
      return value.entries().some(([, child]) => visit(child));
    }
    if (value instanceof PDFArray) return value.asArray().some(visit);
    return false;
  };
  return pdf.context.enumerateIndirectObjects().some(([, object]) => visit(object));
}
async function loadPdf(bytes: Uint8Array) {
  let pdf: PDFDocument;
  try { pdf = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true }); }
  catch (error) {
    // pdf-lib's ES5 native Error subclass does not always retain its prototype.
    // Match only its fixed encryption marker; never echo parser messages or retry with ignoreEncryption.
    if (error instanceof EncryptedPDFError || (error as Error)?.message?.startsWith("Input document to `PDFDocument.load` is encrypted."))
      return fail("CRM_PDF_ENCRYPTED", "Зашифрованный PDF нельзя обработать. Передайте незашифрованный оригинал.");
    return fail("CRM_PDF_INVALID", "Не удалось прочитать исходный PDF.");
  }
  if (pdf.isEncrypted || pdf.context.trailerInfo.Encrypt)
    return fail("CRM_PDF_ENCRYPTED", "Зашифрованный PDF нельзя обработать.");
  const pageCount = pdf.getPageCount();
  if (!pageCount || pageCount > MAX_PAGES) return fail("CRM_PDF_PAGE_LIMIT", "Допустим PDF от 1 до 500 страниц.");
  const pages = pdf.getPages().map((page, index) => {
    const box = page.getCropBox(), media = page.getMediaBox();
    if (![box.x, box.y, box.width, box.height, media.x, media.y, media.width, media.height].every(Number.isFinite)
      || box.width <= 0 || box.height <= 0 || box.width > 14400 || box.height > 14400
      || media.width <= 0 || media.height <= 0 || media.width > 14400 || media.height > 14400
      || box.x < media.x || box.y < media.y || box.x + box.width > media.x + media.width || box.y + box.height > media.y + media.height)
      return fail("CRM_PDF_PAGE_GEOMETRY", "Геометрия страницы PDF не поддерживается.");
    return { pageNumber: index + 1, width: box.width, height: box.height, rotation: page.getRotation().angle,
      originX: box.x, originY: box.y, mediaOriginX: media.x, mediaOriginY: media.y };
  });
  return { pdf, pages, pageCount, hasDigitalSignatures: signaturePresent(pdf) };
}
interface SignedPdfRow {
  id: string; request_id: string; actor_id: string; request: unknown; source_file_id: string;
  source_sha256: string; output_sha256: string; output_size: number; storage_path: string;
  file_name: string; page_count: number; placements: PdfAssetPlacement[];
  asset_hashes: Partial<Record<CompanyAssetId, string>>; created_at: string;
}
function safeArtifact(row: SignedPdfRow) {
  return { id: row.id, fileName: row.file_name, sha256: row.output_sha256, size: Number(row.output_size),
    sourceFileId: row.source_file_id, sourceSha256: row.source_sha256, pageCount: row.page_count,
    placements: row.placements, assetHashes: row.asset_hashes, createdAt: row.created_at };
}

/** Uses only original company PNGs and explicit positions. Never touches the source attachment. */
export class CrmCompanyAssetsService {
  private fetcher: typeof fetch; private assets: readonly CompanyDocumentAsset[];
  constructor(private db: SupabaseClient, private actorId: string, dependencies: CompanyAssetDependencies = {}) {
    this.fetcher = dependencies.fetcher ?? fetch; this.assets = dependencies.assets ?? COMPANY_DOCUMENT_ASSETS;
  }
  async getAssets() {
    await Promise.all(this.assets.map(asset => downloadCompanyAsset(asset, this.fetcher)));
    const { data, error } = await this.db.from("site_settings").select("key,value").in("key", ["company_name", "company_inn"]);
    databaseError(error);
    const settings = Object.fromEntries((data || []).map((row: { key: string; value: unknown }) => [row.key, row.value]));
    const supplier = {
      name: typeof settings.company_name === "string" && settings.company_name.length <= 500 && !hasControl(settings.company_name) ? settings.company_name : null,
      inn: typeof settings.company_inn === "string" && /^\d{10}(\d{2})?$/.test(settings.company_inn.trim()) ? settings.company_inn.trim() : null,
    };
    return { assets: this.assets.map(asset => ({ ...asset, role: "supplier" as const })), supplier,
      cryptographicSignature: false, saved: false, sent: false,
      usage: "Оригинальные растровые изображения исполнителя. В договорах используйте штатный renderer или отдельную строку {{company.signature}}. Для приложенного PDF задайте точные координаты после inspection." };
  }
  async inspectPdf(file: ChatFile) {
    fileReference(file);
    const source = await downloadChatPdf(file, this.fetcher);
    const loaded = await loadPdf(source);
    return { sourceFileId: file.file_id, sourceSha256: await companyAssetSha256(source), pageCount: loaded.pageCount,
      pages: loaded.pages, hasDigitalSignatures: loaded.hasDigitalSignatures, saved: false, sent: false };
  }
  private async signedRow(column: "id" | "request_id", id: string) {
    const { data, error } = await this.db.from("crm_signed_pdfs").select(ROW_FIELDS).eq(column, id).eq("actor_id", this.actorId).maybeSingle();
    databaseError(error); return data;
  }
  private async result(row: SignedPdfRow, replayed: boolean) {
    if (!UUID.test(row.id || "") || row.actor_id !== this.actorId || !HASH.test(row.output_sha256 || "")
      || !HASH.test(row.source_sha256 || "") || !UUID.test(row.request_id || "")
      || row.storage_path !== `crm-signed-pdfs/${this.actorId}/${row.request_id}/${row.output_sha256}.pdf`
      || !Number.isSafeInteger(Number(row.output_size)) || Number(row.output_size) < 8 || Number(row.output_size) > MAX_PDF_BYTES
      || !Number.isSafeInteger(row.page_count) || row.page_count < 1 || row.page_count > MAX_PAGES
      || typeof row.source_file_id !== "string" || !row.source_file_id.trim() || row.source_file_id.length > 200 || hasControl(row.source_file_id)
      || typeof row.file_name !== "string" || row.file_name !== outputName({ fileName: row.file_name } as ApplyCompanyAssetsInput)
      || typeof row.created_at !== "string" || row.created_at.length > 100 || !Number.isFinite(Date.parse(row.created_at)))
      return fail("CRM_SIGNED_PDF_UNCONFIRMED", "Метаданные сохранённого PDF не подтверждены.");
    const placements = checkedPlacements(row.placements);
    const used = [...new Set(placements.map(item => item.assetId))].sort();
    const assetHashes = Object.fromEntries(used.map(id => [id, this.assets.find(asset => asset.id === id)?.sha256]));
    if (placements.some(item => item.pageNumber > row.page_count) || canonical(row.asset_hashes) !== canonical(assetHashes)
      || !plain(row.request) || !exactKeys(row.request, ["sourceFileId", "sourceSha256", "filename", "placements", "assetHashes"])
      || canonical(row.request) !== canonical({ sourceFileId: row.source_file_id, sourceSha256: row.source_sha256,
        filename: row.file_name, placements, assetHashes }))
      return fail("CRM_SIGNED_PDF_UNCONFIRMED", "Состав сохранённого PDF не подтверждён.");
    const { data, error } = await this.db.storage.from(BUCKET).createSignedUrl(row.storage_path, 600);
    if (error || typeof data?.signedUrl !== "string") return fail("CRM_SIGNED_PDF_LINK_FAILED", "PDF сохранён, но временная ссылка недоступна. Прочитайте результат по ID.");
    let link: URL;
    try { link = new URL(data.signedUrl); } catch { return fail("CRM_SIGNED_PDF_LINK_FAILED", "Временная ссылка на PDF не подтверждена."); }
    if (link.origin !== "https://veedztdijmscebgadzyx.supabase.co" || link.username || link.password || link.hash
      || link.pathname !== `/storage/v1/object/sign/contracts/${row.storage_path}`
      || [...link.searchParams.keys()].length !== 1 || !link.searchParams.get("token"))
      return fail("CRM_SIGNED_PDF_LINK_FAILED", "Временная ссылка на PDF не подтверждена.");
    // The storage API is asked for exactly 600 seconds. Verify its JWT expiry as well;
    // this does not authenticate the JWT and never exposes its claims separately.
    try {
      const token = link.searchParams.get("token")!;
      if (token.length > 4000) throw new Error();
      const part = token.split(".")[1];
      if (!part) throw new Error();
      const encoded = part.replace(/-/g, "+").replace(/_/g, "/");
      const claims = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
      const now = Math.floor(Date.now() / 1000);
      if (!Number.isSafeInteger(claims.exp) || !Number.isSafeInteger(claims.iat) || claims.exp <= now
        || claims.exp > now + 660 || claims.exp - claims.iat > 600 || claims.exp <= claims.iat) throw new Error();
    } catch { return fail("CRM_SIGNED_PDF_LINK_FAILED", "Срок временной ссылки на PDF не подтверждён."); }
    return { artifact: safeArtifact(row), downloadUrl: link.href, expiresInSeconds: 600,
      status: "saved" as const, saved: true, sent: false, replayed, cryptographicSignature: false };
  }
  async getSignedPdf(id: string) {
    if (!UUID.test(id)) return fail("CRM_INVALID_SIGNED_PDF_ID", "Укажите точный ID сохранённого PDF.");
    const row = await this.signedRow("id", id.toLowerCase());
    if (!row) return fail("CRM_SIGNED_PDF_NOT_FOUND", "PDF не найден среди сохранённых вами результатов.");
    return this.result(row, false);
  }
  async applyToPdf(input: ApplyCompanyAssetsInput) {
    if (!plain(input) || !exactKeys(input as unknown as Record<string, unknown>, ["requestId", "file", "fileName", "expectedSourceSha256", "placements", "expectedAssetHashes"])
      || !UUID.test(input.requestId || "") || !UUID.test(this.actorId) || !HASH.test(input.expectedSourceSha256 || ""))
      return fail("CRM_INVALID_SIGNED_PDF_REQUEST", "Укажите requestId и точный SHA256 исходного PDF из inspection.");
    fileReference(input.file);
    const requestId = input.requestId.toLowerCase(), filename = outputName(input), placements = checkedPlacements(input.placements);
    const used = [...new Set(placements.map(item => item.assetId))].sort() as CompanyAssetId[];
    const hashes = input.expectedAssetHashes;
    if (!plain(hashes) || !exactKeys(hashes, used) || used.some(id => !HASH.test(hashes[id] || "")))
      return fail("CRM_COMPANY_ASSET_HASH_REQUIRED", "Для каждого используемого изображения передайте точный SHA256 из crm_get_company_document_assets.");
    const assetHashes = Object.fromEntries(used.map(id => [id, this.assets.find(asset => asset.id === id)?.sha256]));
    if (canonical(hashes) !== canonical(assetHashes))
      return fail("CRM_COMPANY_ASSET_CHANGED", "SHA256 оригинала подписи или печати не совпадает. Перечитайте изображения.");
    const request = { sourceFileId: input.file.file_id, sourceSha256: input.expectedSourceSha256, filename, placements, assetHashes };
    const previous = await this.signedRow("request_id", requestId);
    if (previous) {
      if (previous.actor_id !== this.actorId || canonical(previous.request) !== canonical(request))
        return fail("CRM_REQUEST_CONFLICT", "Этот requestId уже использован для другого PDF, позиции или версии изображения.");
      return this.result(previous, true);
    }
    const { data: privateStorage, error: privateStorageError } = await this.db.rpc("crm_check_signed_pdf_storage", {});
    databaseError(privateStorageError);
    if (privateStorage !== true) return fail("CRM_PRIVATE_STORAGE_REQUIRED", "Сохранение PDF остановлено: приватное хранилище не подтверждено.");
    const source = await downloadChatPdf(input.file, this.fetcher);
    if (await companyAssetSha256(source) !== input.expectedSourceSha256)
      return fail("CRM_PDF_SOURCE_CHANGED", "Исходный PDF отличается от проверенного. Выполните inspection заново.");
    const loaded = await loadPdf(source);
    if (loaded.hasDigitalSignatures) return fail("CRM_PDF_DIGITAL_SIGNATURE_PRESENT", "В PDF есть поле электронной подписи. Изменение такого оригинала не выполняется.");
    for (const place of placements) {
      const page = loaded.pages[place.pageNumber - 1];
      if (!page) return fail("CRM_PDF_PAGE_NOT_FOUND", "В исходном PDF нет указанной страницы.");
      if (page.rotation % 360 !== 0) return fail("CRM_PDF_ROTATION_UNSUPPORTED", "Страница повёрнута. Явное наложение поддерживается на страницах без поворота.");
      if (page.originX !== 0 || page.originY !== 0 || page.mediaOriginX !== 0 || page.mediaOriginY !== 0)
        return fail("CRM_PDF_PAGE_GEOMETRY", "Страница имеет смещённую область обрезки. Координаты требуют отдельной проверки.");
      if (place.x + place.width > page.width || place.y + place.height > page.height)
        return fail("CRM_PDF_PLACEMENT_OUT_OF_BOUNDS", "Подпись или печать выходит за границы страницы.");
    }
    const embedded = new Map<CompanyAssetId, Awaited<ReturnType<PDFDocument["embedPng"]>>>();
    for (const id of used) {
      const asset = this.assets.find(asset => asset.id === id)!;
      embedded.set(id, await loaded.pdf.embedPng(await downloadCompanyAsset(asset, this.fetcher)));
    }
    for (const place of placements) loaded.pdf.getPage(place.pageNumber - 1).drawImage(embedded.get(place.assetId)!, {
      x: place.x, y: place.y, width: place.width, height: place.height,
    });
    const output = await loaded.pdf.save({ addDefaultPage: false, updateFieldAppearances: false });
    if (output.length > MAX_PDF_BYTES) return fail("CRM_SIGNED_PDF_TOO_LARGE", "PDF после наложения превышает 10 МиБ.");
    const outputHash = await companyAssetSha256(output);
    const path = `crm-signed-pdfs/${this.actorId}/${requestId}/${outputHash}.pdf`;
    const { error: uploadError } = await this.db.storage.from(BUCKET).upload(path, output, { contentType: "application/pdf", upsert: false });
    if (uploadError) {
      const { data, error } = await this.db.storage.from(BUCKET).download(path);
      if (error || !data || data.size > MAX_PDF_BYTES || await companyAssetSha256(new Uint8Array(await data.arrayBuffer())) !== outputHash)
        return fail("CRM_SIGNED_PDF_UPLOAD_UNCONFIRMED", "Сохранение результата не подтверждено. Повторите с тем же requestId; существующий файл не перезаписывается.");
    }
    const { data, error } = await this.db.rpc("crm_register_signed_pdf", {
      p_request_id: requestId, p_request: request,
      p_artifact: { path, sha256: outputHash, size: output.length, pageCount: loaded.pageCount },
    });
    databaseError(error);
    if (!plain(data) || !plain(data.artifact) || typeof data.replayed !== "boolean")
      return fail("CRM_SIGNED_PDF_UNCONFIRMED", "PDF загружен, но сохранение метаданных не подтверждено. Повторите с тем же requestId.");
    return this.result(data.artifact as unknown as SignedPdfRow, data.replayed);
  }
}
export async function runCompanyAssetsTool<T>(ctx: ToolContext, action: (service: CrmCompanyAssetsService) => Promise<T>) {
  try {
    const db = createUserDatabase(ctx); await requireAdmin(db, ctx.getUserId());
    const result = await action(new CrmCompanyAssetsService(db, ctx.getUserId()!));
    return { structuredContent: result, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const result = error instanceof CrmError ? { code: error.code, message: error.message }
      : { code: "CRM_COMPANY_ASSET_OPERATION_FAILED", message: "Операция с оригинальной подписью или печатью не подтверждена. Исходный файл не изменяется." };
    return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
}

