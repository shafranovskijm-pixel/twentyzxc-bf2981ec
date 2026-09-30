import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { createUserDatabase, requireAdmin, CrmError } from "./service";
import { CLIENT_FILE_MIME, validateClientFileBytes, type ClientFileExtension } from "./client-file-format";

export const MAX_CLIENT_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_CLIENT_PDF_BYTES = MAX_CLIENT_FILE_BYTES;
export const CLIENT_FILE_FIELDS = "id,client_id,file_name,file_size,content_type,sha256,description,created_at";
const INTERNAL_FIELDS = `${CLIENT_FILE_FIELDS},request_id,actor_id,source_file_id,file_path`;
const BUCKET = "crm-client-files";
// OpenAI's documented file-host family. The leading dot is a DNS-label
// boundary: neither the bare apex nor evil-oaiusercontent.com is included.
// https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps
const CHAT_FILE_HOST_SUFFIX = ".oaiusercontent.com";
// Exact native attachment origin observed in ChatGPT. This does not trust
// sibling Azure accounts or the shared blob.core.windows.net host family.
const CHAT_FILE_AZURE_HOST = "oaisdmntprpolandcentral.blob.core.windows.net";
export interface ChatFile { download_url: string; file_id: string; mime_type?: string; file_name?: string }
export interface ImportClientPdfInput { requestId: string; clientId: string; file: ChatFile; fileName?: string; description?: string }
export type ImportClientFileInput = ImportClientPdfInput;

function databaseError(error: { message?: string } | null) {
  if (error) throw new CrmError(error.message?.match(/CRM_[A-Z_]+/)?.[0] || "FILE_DATABASE_ERROR", "Не удалось сохранить или прочитать файл CRM. Повторяйте импорт с тем же requestId.");
}
function publicFile(row: Record<string, unknown>) {
  return Object.fromEntries(CLIENT_FILE_FIELDS.split(",").map(key => [key, row[key]]));
}
export function validateChatFileUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new CrmError("INVALID_FILE_URL", "Не получена ссылка на оригинальный файл ChatGPT."); }
  // Only OpenAI's file-host family and the exact observed native Azure host.
  const allowedHost = url.hostname.endsWith(CHAT_FILE_HOST_SUFFIX) || url.hostname === CHAT_FILE_AZURE_HOST;
  if (url.protocol !== "https:" || !allowedHost || url.port || url.username || url.password || url.hash) {
    throw new CrmError("UNSUPPORTED_FILE_ORIGIN", `Источник файлового параметра пока не поддерживается: ${url.protocol}//${url.hostname.slice(0, 253) || "(без домена)"}. Передайте оригинальное вложение через файловый параметр инструмента. Путь и токен ссылки не записываются.`);
  }
  return url;
}
export function clientPdfName(input: ImportClientPdfInput): string {
  const name = clientFileName(input);
  if (!/\.pdf$/i.test(name)) throw new CrmError("INVALID_FILE_NAME", "Укажите название исходного PDF с расширением .pdf, без папок.");
  return name;
}
export function clientFileName(input: ImportClientFileInput): string {
  const name = (input.fileName || input.file.file_name || "").trim();
  if (!name || name.length > 200 || /[\\/\u0000-\u001f\u007f]/.test(name) || !/^.+\.(pdf|doc|docx)$/i.test(name)) {
    throw new CrmError("INVALID_FILE_NAME", "Укажите название исходного файла с расширением .pdf, .doc или .docx, без папок.");
  }
  return name;
}
export async function downloadChatPdf(file: ChatFile, fetcher: typeof fetch = fetch): Promise<Uint8Array> {
  return downloadChatFile(file, "pdf", fetcher);
}
export async function downloadChatFile(file: ChatFile, extension: ClientFileExtension, fetcher: typeof fetch = fetch): Promise<Uint8Array> {
  const url = validateChatFileUrl(file.download_url);
  // ChatGPT can expose an original attachment as generic binary. Bytes and
  // extension establish the canonical MIME; a conflicting specific MIME fails.
  const mime = file.mime_type?.split(";", 1)[0].trim().toLowerCase();
  if (mime && mime !== "application/octet-stream" && mime !== CLIENT_FILE_MIME[extension]) throw new CrmError("FILE_TYPE_MISMATCH", "Тип вложения не соответствует расширению файла.");
  let response: Response;
  try { response = await fetcher(url, { redirect: "error", signal: AbortSignal.timeout(20_000) }); }
  catch { throw new CrmError("FILE_DOWNLOAD_FAILED", "Не удалось получить вложение ChatGPT. Обновите файловый параметр и повторите с тем же requestId."); }
  if (!response.ok || !response.body) throw new CrmError("FILE_DOWNLOAD_FAILED", "Ссылка на вложение недоступна или истекла. Передайте файл повторно.");
  const length = Number(response.headers.get("content-length"));
  if (length > MAX_CLIENT_FILE_BYTES) { await response.body.cancel(); throw new CrmError("FILE_TOO_LARGE", "Допустим файл PDF или Word размером до 10 МиБ."); }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.length;
      if (total > MAX_CLIENT_FILE_BYTES) { await reader.cancel(); throw new CrmError("FILE_TOO_LARGE", "Допустим файл PDF или Word размером до 10 МиБ."); }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof CrmError) throw error;
    throw new CrmError("FILE_DOWNLOAD_FAILED", "Загрузка оригинального файла прервалась.");
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  await validateClientFileBytes(bytes, extension);
  return bytes;
}
async function sha256(bytes: Uint8Array) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource)), x => x.toString(16).padStart(2, "0")).join("");
}

export class CrmClientFilesService {
  constructor(private db: SupabaseClient, private actorId: string, private fetcher: typeof fetch = fetch) {}
  private async client(clientId: string) {
    const { data, error } = await this.db.from("clients").select("id,name").eq("id", clientId).maybeSingle();
    databaseError(error);
    if (!data) throw new CrmError("CLIENT_NOT_FOUND", "Карточка клиента не найдена.");
    return data;
  }
  async list(clientId: string) {
    await this.client(clientId);
    const { data, error } = await this.db.from("client_files").select(CLIENT_FILE_FIELDS).eq("client_id", clientId).order("created_at", { ascending: false }).order("id").limit(50);
    databaseError(error);
    return { files: data || [], possiblyMore: data?.length === 50, scope: "linked_client_id", kind: "original_client_files" };
  }
  async get(fileId: string, clientId: string) {
    await this.client(clientId);
    const { data, error } = await this.db.from("client_files").select(`${CLIENT_FILE_FIELDS},file_path`).eq("id", fileId).eq("client_id", clientId).maybeSingle();
    databaseError(error);
    if (!data) throw new CrmError("FILE_NOT_FOUND", "Файл не найден в выбранной карточке клиента.");
    const { data: link, error: linkError } = await this.db.storage.from(BUCKET).createSignedUrl(data.file_path, 600);
    if (linkError || !link?.signedUrl) throw new CrmError("FILE_LINK_FAILED", "Файл сохранён, но временная ссылка недоступна.");
    return { file: publicFile(data), downloadUrl: link.signedUrl, expiresInSeconds: 600, kind: data.content_type === CLIENT_FILE_MIME.pdf ? "original_pdf" : "original_word" };
  }
  async importPdf(input: ImportClientPdfInput) {
    clientPdfName(input);
    return this.importFile(input);
  }
  async importFile(input: ImportClientFileInput) {
    // PostgreSQL UUID text is canonical lowercase, including paths made by RPC.
    input = { ...input, clientId: input.clientId.toLowerCase(), requestId: input.requestId.toLowerCase() };
    const fileName = clientFileName(input);
    const extension = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase() as ClientFileExtension;
    const contentType = CLIENT_FILE_MIME[extension];
    const kind = extension === "pdf" ? "original_pdf" : "original_word";
    const description = input.description?.trim() || null;
    if (description && description.length > 2000) throw new CrmError("INVALID_DESCRIPTION", "Описание файла должно быть не длиннее 2000 символов.");
    if (!input.file.file_id?.trim() || input.file.file_id.length > 200) throw new CrmError("INVALID_FILE_REFERENCE", "Не получен идентификатор исходного вложения ChatGPT.");
    await this.client(input.clientId);
    const { data: previous, error: previousError } = await this.db.from("client_files").select(INTERNAL_FIELDS).eq("request_id", input.requestId).maybeSingle();
    databaseError(previousError);
    if (previous) {
      if (previous.actor_id !== this.actorId || previous.client_id !== input.clientId || previous.source_file_id !== input.file.file_id || previous.file_name !== fileName || previous.description !== description) {
        throw new CrmError("CRM_REQUEST_CONFLICT", "Этот requestId уже использован для другого файла или клиента.");
      }
      return { file: publicFile(previous), status: "saved", replayed: true, kind, sent: false };
    }
    const bytes = await downloadChatFile(input.file, extension, this.fetcher);
    const hash = await sha256(bytes);
    const path = `${input.clientId}/${input.requestId}.${extension}`;
    const { error: uploadError } = await this.db.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false });
    if (uploadError) {
      // A previous attempt may have saved bytes before its database response was lost.
      // Never overwrite or delete that object; verify its exact contents before retrying registration.
      const { data: existing, error: readError } = await this.db.storage.from(BUCKET).download(path);
      if (readError || !existing || existing.size > MAX_CLIENT_FILE_BYTES || await sha256(new Uint8Array(await existing.arrayBuffer())) !== hash) {
        throw new CrmError("FILE_UPLOAD_UNCONFIRMED", "Сохранение файла не подтверждено. Повторите с тем же requestId; существующий файл не будет перезаписан.");
      }
    }
    const { data, error } = await this.db.rpc("crm_register_client_file", {
      p_request_id: input.requestId, p_client_id: input.clientId, p_source_file_id: input.file.file_id,
      p_file_name: fileName, p_file_size: bytes.length, p_sha256: hash, p_description: description,
    });
    databaseError(error);
    if (!data?.file?.id) throw new CrmError("FILE_SAVE_UNCONFIRMED", "Файл загружен, но запись в карточке не подтверждена. Повторите с тем же requestId.");
    return { ...data, status: "saved", kind, sent: false };
  }
}

export async function runClientFilesTool<T>(ctx: ToolContext, action: (service: CrmClientFilesService) => Promise<T>) {
  try {
    const db = createUserDatabase(ctx); await requireAdmin(db, ctx.getUserId());
    const result = await action(new CrmClientFilesService(db, ctx.getUserId()!));
    return { structuredContent: result, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const result = error instanceof CrmError ? { code: error.code, message: error.message } : { code: "FILE_OPERATION_FAILED", message: "Операция с файлом не подтверждена. Проверьте карточку клиента и повторите с тем же requestId." };
    return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
}
