import { downloadFrdoTemplate, FrdoCatalogError, getFrdoTemplate, MAX_FRDO_FILE_BYTES, MAX_FRDO_TOTAL_BYTES, type FrdoTemplate } from "./catalog.ts";
import { escapeEmailText, sha256, toBase64 } from "../crm-email/delivery.ts";
import { validateEmailAddress, type SmtpEmail } from "../crm-email/smtp.ts";

export type FrdoState = "preparing" | "prepared" | "sending" | "smtp_accepted" | "failed" | "unknown";
export interface FrdoSnapshot {
  templateId: string; revision: number; label: string; filename: string; sha256: string;
  size: number; contentType: string; ext: string; sourceUrl: string;
}
export interface FrdoAttachment {
  templateId: string; revision: number; filename: string; path: string; sha256: string;
  size: number; contentType: string;
}
export interface FrdoDelivery {
  id: string; request_id: string; actor_id: string; client_id: string; recipient: string;
  subject: string; body: string; state: FrdoState; message_id: string;
  templates: FrdoSnapshot[]; attachments: FrdoAttachment[];
  client_snapshot: { id: string; name: string; inn: string | null; email: string | null; crm_revision: number };
}
export interface FrdoDeliveryDependencies {
  resolve(id: string, revision: number): FrdoTemplate;
  fetchTemplate(ref: { id: string; revision: number }): Promise<Uint8Array>;
  upload(path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  download(path: string): Promise<Uint8Array>;
  finalize(id: string, actor: string, attachments: FrdoAttachment[]): Promise<unknown>;
  claim(id: string, actor: string): Promise<unknown>;
  finish(id: string, actor: string, state: FrdoState, receipt: string | null, error: string | null): Promise<unknown>;
  send(input: SmtpEmail): Promise<{ receipt: string }>;
}

// Only these fixed codes can cross the public error boundary. Never copy provider
// messages, SQL diagnostics, SMTP replies or a raw receipt into the response.
const SAFE_CODES = new Set([
  "CRM_ADMIN_REQUIRED", "CRM_CLIENT_NOT_FOUND", "CRM_FRDO_IDENTITY_MISMATCH", "CRM_CLIENT_REVISION_CONFLICT",
  "CRM_INVALID_FRDO_REQUEST", "CRM_REQUEST_ID_CONFLICT", "CRM_FRDO_TEMPLATE_NOT_FOUND",
  "CRM_FRDO_TEMPLATE_UNAVAILABLE", "CRM_FRDO_TEMPLATE_MIME_MISMATCH", "CRM_FRDO_TEMPLATE_TOO_LARGE",
  "CRM_FRDO_TEMPLATE_CONTENT_MISMATCH", "CRM_FRDO_INVALID_TEMPLATE_SET", "CRM_FRDO_PACKAGE_TOO_LARGE",
  "CRM_DELIVERY_NOT_FOUND", "CRM_RECIPIENT_CHANGED", "CRM_FRDO_STORAGE_FAILED", "CRM_FRDO_INVALID_DELIVERY",
  "CRM_FRDO_ATTACHMENT_INTEGRITY_FAILED", "CRM_FRDO_EMAIL_OPERATION_FAILED", "CRM_DATABASE_ERROR",
  "CRM_FRDO_INVALID_RECIPIENT", "CRM_FRDO_DELIVERY_NOT_READY", "CRM_INVALID_EMAIL_REQUEST",
  "CRM_AUTH_REQUIRED", "CRM_FORBIDDEN", "CRM_INVALID_ARGUMENT", "CRM_CLIENT_INN_CONFLICT", "CRM_REQUEST_CONFLICT",
  "CRM_TEMPLATE_NOT_FOUND", "CRM_TEMPLATE_REVISION_CONFLICT", "CRM_PRIVATE_STORAGE_REQUIRED",
  "CRM_DELIVERY_ATTACHMENT_MISMATCH", "CRM_DELIVERY_NOT_PREPARED", "CRM_DELIVERY_NOT_CLAIMED", "CRM_DELIVERY_RESULT_CONFLICT",
]);
export class FrdoOperationError extends Error {
  constructor(readonly code: string, readonly status = 400) {
    super(SAFE_CODES.has(code) || ["INVALID_INPUT", "REQUEST_TOO_LARGE"].includes(code) ? code : "CRM_FRDO_EMAIL_OPERATION_FAILED");
    this.name = "FrdoOperationError";
  }
}
function fail(code = "CRM_FRDO_INVALID_DELIVERY", status = 400): never { throw new FrdoOperationError(code, status); }
export function frdoDatabaseError(error: unknown): never {
  const message = record(error) && typeof error.message === "string" ? error.message : "";
  fail(SAFE_CODES.has(message) ? message : "CRM_DATABASE_ERROR");
}
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const positive = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const inn = (value: unknown): value is string | null => value === null || (typeof value === "string" && /^(?:\d{10}|\d{12})$/.test(value));
function hasControls(value: string, multiline = false): boolean {
  return Array.from(value).some(char => {
    const code = char.charCodeAt(0);
    return (code < 32 && !(multiline && [9, 10, 13].includes(code))) || (code >= 127 && code <= 159);
  });
}
function text(value: unknown, max: number, multiline = false): value is string {
  return typeof value === "string" && !!value.trim() && value.length <= max && !hasControls(value, multiline);
}
function mailbox(value: unknown): value is string {
  try { return typeof value === "string" && validateEmailAddress(value) === value; } catch { return false; }
}
function keys(value: Record<string, unknown>, allowed: readonly string[]) { return Object.keys(value).every(key => allowed.includes(key)); }
function resolveTemplate(resolve: FrdoDeliveryDependencies["resolve"], id: unknown, revision: unknown) {
  if (typeof id !== "string" || !positive(revision)) fail("INVALID_INPUT");
  try { return resolve(id, revision); } catch { return fail("CRM_FRDO_TEMPLATE_NOT_FOUND"); }
}
function extension(item: FrdoTemplate): string {
  const ext = item.fileName.split(".").pop();
  if (!["docx", "pdf", "xlsx"].includes(ext || "")) fail();
  return ext!;
}
export function frdoStoragePath(id: string, item: FrdoTemplate): string {
  return `crm-frdo-email/${id}/${item.id}-r${item.revision}-${item.sha256}.${extension(item)}`;
}
function snapshot(item: FrdoTemplate): FrdoSnapshot {
  return { templateId: item.id, revision: item.revision, label: item.label, filename: item.fileName,
    sha256: item.sha256, size: item.size, contentType: item.contentType, ext: extension(item), sourceUrl: item.url };
}

/** Reject mismatched snapshots; the DB row is not an authority for arbitrary files. */
export function checkedFrdoDelivery(raw: unknown, resolve = getFrdoTemplate, expected?: { id?: string; actor?: string; client?: string }): FrdoDelivery {
  if (!record(raw) || !uuid(raw.id) || !uuid(raw.request_id) || raw.request_id !== raw.id || !uuid(raw.actor_id) || !uuid(raw.client_id)
    || (expected?.id && raw.id !== expected.id) || (expected?.actor && raw.actor_id !== expected.actor)
    || (expected?.client && raw.client_id !== expected.client) || !mailbox(raw.recipient)
    || !text(raw.subject, 500) || !text(raw.body, 12000, true)
    || raw.recipient !== raw.recipient.toLowerCase() || typeof raw.message_id !== "string" || raw.message_id !== `<crm-frdo-${raw.id}@24zxc.ru>`
    || typeof raw.state !== "string" || !["preparing", "prepared", "sending", "smtp_accepted", "failed", "unknown"].includes(raw.state)
    || !Array.isArray(raw.templates) || !raw.templates.length || raw.templates.length > 8 || !Array.isArray(raw.attachments)) fail();
  const client = raw.client_snapshot;
  if (!record(client) || client.id !== raw.client_id || typeof client.name !== "string" || !client.name.trim()
    || !inn(client.inn) || !(client.email === null || typeof client.email === "string") || !positive(client.crm_revision)) fail();
  const templates: FrdoSnapshot[] = []; const seen = new Set<string>(); let total = 0;
  for (const value of raw.templates) {
    if (!record(value)) fail();
    const item = resolveTemplate(resolve, value.templateId, value.revision);
    const pinned = snapshot(item);
    if (seen.has(item.id) || Object.entries(pinned).some(([key, expectedValue]) => value[key] !== expectedValue)) fail();
    total += item.size; seen.add(item.id); templates.push(pinned);
  }
  if (total > MAX_FRDO_TOTAL_BYTES) fail();
  const attachments: FrdoAttachment[] = []; const attached = new Set<string>();
  for (const value of raw.attachments) {
    if (!record(value) || typeof value.templateId !== "string") fail();
    const item = templates.find(item => item.templateId === value.templateId);
    if (!item || attached.has(item.templateId)) fail();
    const path = `crm-frdo-email/${raw.id}/${item.templateId}-r${item.revision}-${item.sha256}.${item.ext}`;
    const file: FrdoAttachment = { templateId: item.templateId, revision: item.revision, filename: item.filename,
      sha256: item.sha256, size: item.size, contentType: item.contentType, path };
    if (Object.entries(file).some(([key, expectedValue]) => value[key] !== expectedValue)) fail();
    attached.add(file.templateId); attachments.push(file);
  }
  if (raw.state === "preparing" ? attachments.length !== 0 : attachments.length !== templates.length) fail();
  return { id: raw.id, request_id: raw.request_id, actor_id: raw.actor_id, client_id: raw.client_id,
    recipient: raw.recipient, subject: raw.subject, body: raw.body, state: raw.state as FrdoState, message_id: raw.message_id,
    templates, attachments, client_snapshot: { id: raw.client_id, name: client.name, inn: client.inn,
      email: typeof client.email === "string" ? client.email : null, crm_revision: client.crm_revision } };
}

export function publicFrdoDelivery(row: FrdoDelivery) {
  return { deliveryId: row.id, clientId: row.client_id, recipient: row.recipient, subject: row.subject,
    body: row.body, state: row.state, messageId: row.message_id,
    templates: row.templates.map(file => ({ templateId: file.templateId, revision: file.revision, label: file.label,
      filename: file.filename, sha256: file.sha256, size: file.size, contentType: file.contentType })),
    attachments: row.attachments.map(file => ({ templateId: file.templateId, revision: file.revision, filename: file.filename,
      sha256: file.sha256, size: file.size, contentType: file.contentType })),
    smtpAccepted: row.state === "smtp_accepted", recipientDeliveryConfirmed: false, retryAllowed: false };
}
export async function verifyFrdoBytes(item: FrdoTemplate, bytes: Uint8Array): Promise<void> {
  const magic = item.contentType === "application/pdf" ? new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-"
    : bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4;
  if (!magic || bytes.length > MAX_FRDO_FILE_BYTES || bytes.length !== item.size || await sha256(bytes) !== item.sha256)
    fail("CRM_FRDO_ATTACHMENT_INTEGRITY_FAILED");
}
function sameFrozen(before: FrdoDelivery, after: FrdoDelivery): boolean {
  return before.id === after.id && before.request_id === after.request_id && before.actor_id === after.actor_id
    && before.client_id === after.client_id && before.recipient === after.recipient && before.subject === after.subject
    && before.body === after.body && before.message_id === after.message_id
    && JSON.stringify(before.templates) === JSON.stringify(after.templates)
    && JSON.stringify(before.client_snapshot) === JSON.stringify(after.client_snapshot);
}
export async function prepareFrdoAttachments(raw: unknown, deps: FrdoDeliveryDependencies): Promise<FrdoDelivery> {
  const row = checkedFrdoDelivery(raw, deps.resolve);
  if (row.state !== "preparing") return row;
  const attachments: FrdoAttachment[] = []; let total = 0;
  for (const template of row.templates) {
    const item = deps.resolve(template.templateId, template.revision);
    const bytes = await deps.fetchTemplate({ id: item.id, revision: item.revision });
    await verifyFrdoBytes(item, bytes); total += bytes.length;
    if (total > MAX_FRDO_TOTAL_BYTES) fail("CRM_FRDO_PACKAGE_TOO_LARGE");
    const path = frdoStoragePath(row.id, item);
    await deps.upload(path, bytes, item.contentType);
    attachments.push({ templateId: item.id, revision: item.revision, filename: item.fileName, path,
      sha256: item.sha256, size: bytes.length, contentType: item.contentType });
  }
  const finalized = checkedFrdoDelivery(await deps.finalize(row.id, row.actor_id, attachments), deps.resolve,
    { id: row.id, actor: row.actor_id, client: row.client_id });
  if (finalized.state === "preparing" || !sameFrozen(row, finalized)) fail();
  return finalized;
}
export async function dispatchFrdoDelivery(id: string, actor: string, expectedRecipient: string, deps: FrdoDeliveryDependencies): Promise<FrdoDelivery> {
  const claim = await deps.claim(id, actor);
  if (!record(claim) || typeof claim.claimed !== "boolean") fail();
  const row = checkedFrdoDelivery(claim.delivery, deps.resolve, { id, actor });
  if (row.recipient !== expectedRecipient) fail("CRM_RECIPIENT_CHANGED");
  if (!claim.claimed) return row;
  if (row.state !== "sending") fail();
  let enteredSmtp = false; let accepted = false; let acceptedReceipt: string | null = null;
  try {
    const attachments: SmtpEmail["attachments"] = []; let total = 0;
    for (const file of row.attachments) {
      const bytes = await deps.download(file.path);
      await verifyFrdoBytes(deps.resolve(file.templateId, file.revision), bytes);
      total += bytes.length;
      if (total > MAX_FRDO_TOTAL_BYTES) fail("CRM_FRDO_PACKAGE_TOO_LARGE");
      attachments.push({ filename: file.filename, base64: toBase64(bytes), contentType: file.contentType });
    }
    enteredSmtp = true;
    const sent = await deps.send({ to: row.recipient, subject: row.subject, messageId: row.message_id,
      html: `<div style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeEmailText(row.body)}</div>`, attachments });
    // The transport resolves only after acceptance. Even a malformed receipt must
    // remain uncertain rather than turn into a safely retryable failed attempt.
    accepted = true;
    if (typeof sent?.receipt !== "string" || sent.receipt.length > 2000 || hasControls(sent.receipt) || !/^250[ -]/.test(sent.receipt)) fail();
    acceptedReceipt = sent.receipt;
    const finished = checkedFrdoDelivery(await deps.finish(id, actor, "smtp_accepted", acceptedReceipt, null), deps.resolve, { id, actor });
    if (!sameFrozen(row, finished) || finished.state !== "smtp_accepted") fail();
    return finished;
  } catch (error) {
    const outcome = record(error) ? error.outcome : undefined;
    const state: FrdoState = accepted || (enteredSmtp && outcome !== "failed") ? "unknown" : "failed";
    const code = state === "unknown" ? "FRDO_SMTP_UNKNOWN" : enteredSmtp ? "FRDO_SMTP_REJECTED" : "FRDO_DELIVERY_FAILED";
    try {
      const finished = checkedFrdoDelivery(await deps.finish(id, actor, state, null, code), deps.resolve, { id, actor });
      if (!sameFrozen(row, finished) || ![state, "smtp_accepted"].includes(finished.state)) fail();
      return finished;
    } catch { return { ...row, state: "unknown" }; }
  }
}

export function defaultFrdoBody(items: readonly FrdoTemplate[]): string {
  const hasPrikaz = items.some(item => item.id === "prikaz" || item.id === "prikaz-pdf");
  const parts = ["Здравствуйте!"];
  if (!(items.length === 1 && hasPrikaz)) parts.push(`Направляем вам ${items.length > 1 ? "пакет документов" : "документ"} ФИС ФРДО:`);
  if (items.some(item => item.id === "terms")) parts.push(
    "Мне чтобы приступить к регистрации, нужно чтобы Вы подписали соглашение во вложении электронной подписью, формат подписи DER, тип подписи «присоединённая», для подписания нужна программа КриптоАрм и/или КриптоПро.",
    "(видеоинструкция — https://disk.yandex.ru/i/QTZtMfOsbHEzgQ).",
  );
  if (hasPrikaz) parts.push("Приказ во вложении нужно заполнить на бланке организации, ответственный должен быть тот же человек, на которого зарегистрирована ЭЦП. После подписания отсканировать в PDF, после чего PDF подписать электронной подписью.");
  parts.push("Файлы прикреплены к письму. При возникновении вопросов свяжитесь с нами.", "С уважением, команда Синтагма");
  return parts.join("\n\n");
}

export interface FrdoUserAdapter {
  authenticate(token: string): Promise<string | null>;
  isAdmin(actor: string): Promise<boolean>;
  prepare(args: Record<string, unknown>): Promise<unknown>;
  findDelivery(id: string, actor: string): Promise<unknown>;
  signDownload(path: string, filename: string): Promise<string | null>;
}
export interface FrdoHandlerRuntime {
  user(authorization: string): FrdoUserAdapter;
  worker(): Omit<FrdoDeliveryDependencies, "resolve" | "fetchTemplate">;
  resolve?: FrdoDeliveryDependencies["resolve"];
  fetchTemplate?: FrdoDeliveryDependencies["fetchTemplate"];
  isSignedDownload(url: string, path: string): boolean;
}
const cors = { "Access-Control-Allow-Origin": "https://24zxc.ru", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function readInput(req: Request): Promise<Record<string, unknown>> {
  const limit = 64 * 1024;
  const declared = req.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit)) fail("REQUEST_TOO_LARGE", 413);
  if (!req.body) fail("INVALID_INPUT");
  const reader = req.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); fail("REQUEST_TOO_LARGE", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const input: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!record(input)) fail("INVALID_INPUT");
    return input;
  } catch { return fail("INVALID_INPUT"); }
}
export function createFrdoEmailHandler(runtime: FrdoHandlerRuntime) {
  const resolve = runtime.resolve || getFrdoTemplate;
  const fetchTemplate = runtime.fetchTemplate || downloadFrdoTemplate;
  return async function handler(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return json({ code: "METHOD_NOT_ALLOWED" }, 405);
    try {
      const authorization = req.headers.get("authorization");
      if (!authorization?.startsWith("Bearer ") || authorization.length <= 7) return json({ code: "UNAUTHORIZED" }, 401);
      const user = runtime.user(authorization);
      const actor = await user.authenticate(authorization.slice(7));
      if (!uuid(actor)) return json({ code: "UNAUTHORIZED" }, 401);
      if (!await user.isAdmin(actor)) return json({ code: "FORBIDDEN" }, 403);
      const input = await readInput(req);
      if (input.action === "getTemplate") {
        if (!keys(input, ["action", "templateId", "revision"])) fail("INVALID_INPUT");
        const item = resolveTemplate(resolve, input.templateId, input.revision);
        await verifyFrdoBytes(item, await fetchTemplate({ id: item.id, revision: item.revision }));
        return json({ template: { templateId: item.id, label: item.label, revision: item.revision, filename: item.fileName,
          contentType: item.contentType, size: item.size, sha256: item.sha256, url: item.url }, verified: true, saved: false, sent: false });
      }
      let delivery: FrdoDelivery; let replayed: boolean | undefined;
      if (input.action === "prepare") {
        if (!keys(input, ["action", "requestId", "clientId", "expectedClientRevision", "expectedInn", "templates", "recipient", "subject", "body"])
          || !uuid(input.requestId) || !uuid(input.clientId) || !positive(input.expectedClientRevision) || !inn(input.expectedInn)
          || !Array.isArray(input.templates) || !input.templates.length || input.templates.length > 8
          || (input.recipient !== undefined && !mailbox(input.recipient))
          || (input.subject !== undefined && !text(input.subject, 500)) || (input.body !== undefined && !text(input.body, 12000, true))) fail("INVALID_INPUT");
        const items: FrdoTemplate[] = []; const seen = new Set<string>(); let total = 0;
        const refs = input.templates.map(value => {
          if (!record(value) || !keys(value, ["templateId", "revision", "sha256"])) fail("INVALID_INPUT");
          const item = resolveTemplate(resolve, value.templateId, value.revision);
          if (value.sha256 !== item.sha256 || seen.has(item.id)) fail("INVALID_INPUT");
          seen.add(item.id); items.push(item); total += item.size;
          return { templateId: item.id, revision: item.revision, sha256: item.sha256 };
        });
        if (total > MAX_FRDO_TOTAL_BYTES) fail("CRM_FRDO_PACKAGE_TOO_LARGE");
        const body = input.body ?? defaultFrdoBody(items);
        const subject = typeof input.subject === "string" ? input.subject.trim() : null;
        const prepared = await user.prepare({ p_request_id: input.requestId, p_client_id: input.clientId,
          p_expected_client_revision: input.expectedClientRevision, p_expected_inn: input.expectedInn,
          p_templates: refs, p_recipient: typeof input.recipient === "string" ? input.recipient.toLowerCase() : null, p_subject: subject, p_body: body });
        if (!record(prepared) || typeof prepared.replayed !== "boolean") fail();
        const row = checkedFrdoDelivery(prepared.delivery, resolve, { actor, client: input.clientId });
        if (row.request_id !== input.requestId || row.client_snapshot.crm_revision !== input.expectedClientRevision
          || row.client_snapshot.inn !== input.expectedInn || row.body !== body || (subject !== null && row.subject !== subject)
          || (typeof input.recipient === "string" && row.recipient !== input.recipient.toLowerCase())
          || row.templates.length !== refs.length || row.templates.some((item, index) => item.templateId !== refs[index].templateId || item.revision !== refs[index].revision || item.sha256 !== refs[index].sha256)) fail();
        replayed = prepared.replayed;
        delivery = row.state === "preparing" ? await prepareFrdoAttachments(row, { ...runtime.worker(), resolve, fetchTemplate }) : row;
      } else if (input.action === "send" || input.action === "status") {
        const send = input.action === "send";
        if (!keys(input, send ? ["action", "deliveryId", "expectedRecipient"] : ["action", "deliveryId"])
          || !uuid(input.deliveryId) || (send && !mailbox(input.expectedRecipient))) fail("INVALID_INPUT");
        const row = checkedFrdoDelivery(await user.findDelivery(input.deliveryId, actor), resolve, { id: input.deliveryId, actor });
        const expectedRecipient = typeof input.expectedRecipient === "string" ? input.expectedRecipient.toLowerCase() : "";
        if (send && row.recipient !== expectedRecipient) fail("CRM_RECIPIENT_CHANGED");
        delivery = send ? await dispatchFrdoDelivery(row.id, actor, expectedRecipient, { ...runtime.worker(), resolve, fetchTemplate }) : row;
      } else return json({ code: "INVALID_INPUT" }, 400);
      const downloads: { templateId: string; revision: number; filename: string; url: string; expiresInSeconds: number }[] = [];
      for (const file of delivery.attachments) {
        try {
          const url = await user.signDownload(file.path, file.filename);
          if (url && runtime.isSignedDownload(url, file.path)) downloads.push({ templateId: file.templateId, revision: file.revision, filename: file.filename, url, expiresInSeconds: 600 });
        } catch { /* Missing preview links never make the historical SMTP result a failure. */ }
      }
      return json({ ...publicFrdoDelivery(delivery), ...(replayed === undefined ? {} : { replayed }), downloads });
    } catch (error) {
      const known = error instanceof FrdoOperationError || error instanceof FrdoCatalogError;
      const candidate = known ? error.message : "";
      const code = SAFE_CODES.has(candidate) || ["INVALID_INPUT", "REQUEST_TOO_LARGE"].includes(candidate) ? candidate : "CRM_FRDO_EMAIL_OPERATION_FAILED";
      return json({ code, message: "Операция не завершена. Проверьте состояние отправки по deliveryId. Повтор с тем же ID не отправит письмо повторно." },
        error instanceof FrdoOperationError ? error.status : 400);
    }
  };
}
