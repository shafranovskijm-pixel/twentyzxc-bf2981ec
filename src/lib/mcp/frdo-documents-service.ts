import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { FRDO_TEMPLATES, getFrdoTemplate } from "../../../supabase/functions/_shared/crm-frdo/catalog";
import { CrmError, createUserDatabase, requireAdmin } from "./service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HASH = /^[a-f0-9]{64}$/;
const states = ["preparing", "prepared", "sending", "smtp_accepted", "failed", "unknown"];
const messages: Record<string, string> = {
  UNAUTHORIZED: "Подключите учётную запись CRM.",
  FORBIDDEN: "Работа с документами ФРДО разрешена администратору CRM.",
  NOT_CONFIGURED: "Не настроено подключение к CRM.",
  CRM_ADMIN_REQUIRED: "Работа с документами ФРДО разрешена администратору CRM.",
  CRM_CLIENT_NOT_FOUND: "Карточка клиента не найдена. Сначала выберите существующую организацию.",
  CRM_CLIENT_REVISION_CONFLICT: "Карточка изменилась. Перечитайте её и проверьте получателя перед подготовкой пакета.",
  CRM_FRDO_IDENTITY_MISMATCH: "ИНН не совпадает с выбранной карточкой. Уточните организацию.",
  CRM_REQUEST_ID_CONFLICT: "requestId уже использован для другого комплекта. Повторяйте только прежнюю неизменную команду.",
  CRM_FRDO_TEMPLATE_NOT_FOUND: "Шаблон или его версия не найдены. Прочитайте каталог ФРДО и выберите точные ID, версии и хеши.",
  CRM_FRDO_TEMPLATE_CHANGED: "Файл отличается от зарегистрированного оригинала. Подготовка остановлена; не заменяйте его другим файлом автоматически.",
  CRM_FRDO_RECIPIENT_CHANGED: "Получатель отличается от подготовленного. Покажите комплект и адрес повторно; письмо не отправлено.",
  CRM_RECIPIENT_CHANGED: "Получатель отличается от подготовленного. Покажите комплект и адрес повторно; письмо не отправлено.",
  CRM_FRDO_DELIVERY_NOT_FOUND: "Подготовленная отправка не найдена для этой учётной записи.",
  CRM_INVALID_FRDO_PACKAGE: "Проверьте clientId, ИНН, версию карточки и выбранные шаблоны ФРДО.",
  CRM_AUTH_REQUIRED: "Подключите учётную запись CRM.",
  CRM_FORBIDDEN: "Работа с документами ФРДО разрешена администратору CRM.",
  CRM_INVALID_ARGUMENT: "Проверьте реквизиты пакета, выбранные версии шаблонов и текст письма.",
  CRM_CLIENT_INN_CONFLICT: "ИНН не совпадает с выбранной карточкой. Уточните организацию.",
  CRM_REQUEST_CONFLICT: "requestId уже использован для другого комплекта. Повторяйте только прежнюю неизменную команду.",
  CRM_TEMPLATE_NOT_FOUND: "Шаблон не найден. Перечитайте каталог ФРДО.",
  CRM_TEMPLATE_REVISION_CONFLICT: "Версия или хеш шаблона изменились. Перечитайте каталог ФРДО.",
  CRM_DELIVERY_NOT_FOUND: "Подготовленная отправка не найдена для этой учётной записи.",
  CRM_PRIVATE_STORAGE_REQUIRED: "Приватное хранилище недоступно. Подготовка и отправка остановлены.",
  CRM_FRDO_OPERATION_UNCONFIRMED: "Операция ФРДО не подтверждена. Проверьте состояние по deliveryId; не создавайте новую отправку для обхода ошибки.",
};
function fail(code = "CRM_INVALID_FRDO_PACKAGE"): never { throw new CrmError(code, messages[code]); }
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function safeCode(error: unknown) {
  if (!object(error)) return "CRM_FRDO_OPERATION_UNCONFIRMED";
  if (typeof error.code === "string" && Object.prototype.hasOwnProperty.call(messages, error.code)) return error.code;
  return "CRM_FRDO_OPERATION_UNCONFIRMED";
}
function id(value: unknown) { if (typeof value !== "string" || !UUID.test(value)) fail(); return value.toLowerCase(); }
function text(value: unknown, limit: number, multiline = false) { if (typeof value !== "string" || !value.trim() || value.length > limit || /\p{Cc}/u.test(multiline ? value.replace(/[\t\r\n]/g, "") : value)) fail(); return value; }
function email(value: unknown) {
  if (typeof value !== "string" || value.length > 254 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value)) fail();
  return value.toLowerCase();
}
export type FrdoTemplateRef = { templateId: string; revision: number; sha256: string };
export type PrepareFrdoPackageInput = {
  requestId: string; clientId: string; expectedClientRevision: number; expectedInn: string | null;
  templates: FrdoTemplateRef[]; recipient?: string; subject?: string; body?: string;
};
export function publicFrdoTemplate(template: typeof FRDO_TEMPLATES[number]) {
  return { templateId: template.id, label: template.label, revision: template.revision,
    filename: template.fileName, contentType: template.contentType, size: template.size, sha256: template.sha256, url: template.url };
}
function templateRef(value: unknown) {
  if (!object(value) || typeof value.templateId !== "string" || !Number.isSafeInteger(value.revision) ||
      typeof value.sha256 !== "string" || !HASH.test(value.sha256)) fail();
  let registered: typeof FRDO_TEMPLATES[number];
  try { registered = getFrdoTemplate(value.templateId, value.revision as number); }
  catch { fail("CRM_FRDO_TEMPLATE_NOT_FOUND"); }
  if (registered.sha256 !== value.sha256) fail("CRM_FRDO_TEMPLATE_CHANGED");
  return registered;
}
function publicPackage(raw: unknown, expectedId: string, expectedClientId?: string) {
  if (!object(raw) || id(raw.deliveryId) !== expectedId || !states.includes(String(raw.state))) fail("CRM_FRDO_OPERATION_UNCONFIRMED");
  const clientId = id(raw.clientId);
  if (expectedClientId && clientId !== expectedClientId) fail("CRM_FRDO_OPERATION_UNCONFIRMED");
  const recipient = email(raw.recipient), subject = text(raw.subject, 500), body = text(raw.body, 12000, true);
  if (raw.messageId !== `<crm-frdo-${expectedId}@24zxc.ru>` ||
      !Array.isArray(raw.templates) || raw.templates.length < 1 || raw.templates.length > 8 || !Array.isArray(raw.attachments) ||
      raw.smtpAccepted !== (raw.state === "smtp_accepted") || raw.recipientDeliveryConfirmed !== false || raw.retryAllowed !== false) fail("CRM_FRDO_OPERATION_UNCONFIRMED");
  const templates = raw.templates.map(value => {
    const entry = templateRef(value);
    if (!object(value) || value.filename !== entry.fileName || value.size !== entry.size || value.contentType !== entry.contentType) fail("CRM_FRDO_OPERATION_UNCONFIRMED");
    const { url: _url, ...metadata } = publicFrdoTemplate(entry);
    return metadata;
  });
  if (new Set(templates.map(item => item.templateId)).size !== templates.length) fail("CRM_FRDO_OPERATION_UNCONFIRMED");
  const attachments = raw.attachments.map(value => {
    const entry = templateRef(value);
    if (!object(value) || !templates.some(t => t.templateId === entry.id && t.revision === entry.revision) ||
        value.filename !== entry.fileName || value.size !== entry.size || value.contentType !== entry.contentType) fail("CRM_FRDO_OPERATION_UNCONFIRMED");
    return { templateId: entry.id, revision: entry.revision, filename: entry.fileName, sha256: entry.sha256, size: entry.size, contentType: entry.contentType };
  });
  if (new Set(attachments.map(item => item.templateId)).size !== attachments.length ||
      raw.state !== "preparing" && attachments.length !== templates.length) fail("CRM_FRDO_OPERATION_UNCONFIRMED");
  const downloads = (Array.isArray(raw.downloads) ? raw.downloads : []).map(value => {
    if (!object(value) || typeof value.url !== "string" || value.expiresInSeconds !== 600) fail("CRM_FRDO_OPERATION_UNCONFIRMED");
    const file = attachments.find(a => a.templateId === value.templateId && a.revision === value.revision && a.filename === value.filename);
    let link: URL;
    try { link = new URL(value.url); } catch { fail("CRM_FRDO_OPERATION_UNCONFIRMED"); }
    if (!file || link.origin !== "https://veedztdijmscebgadzyx.supabase.co" || link.username || link.password || link.hash || !link.searchParams.get("token") ||
        decodeURIComponent(link.pathname) !== `/storage/v1/object/sign/contracts/crm-frdo-email/${expectedId}/${file.templateId}-r${file.revision}-${file.sha256}.${file.filename.split(".").pop()}`) fail("CRM_FRDO_OPERATION_UNCONFIRMED");
    return { templateId: file.templateId, revision: file.revision, filename: file.filename, url: link.href, expiresInSeconds: 600 };
  });
  return { deliveryId: expectedId, clientId, recipient, subject, body, state: raw.state as string, messageId: raw.messageId,
    templates, attachments, downloads, smtpAccepted: raw.state === "smtp_accepted", recipientDeliveryConfirmed: false,
    retryAllowed: false, replayed: raw.replayed === true,
    ...(raw.state === "sending" || raw.state === "unknown" ? { warning: "Результат отправки не установлен. Проверьте журнал; не создавайте дубль письма." } : {}) };
}
export class CrmFrdoDocumentsService {
  constructor(private db: SupabaseClient) {}
  listTemplates() {
    return { templates: FRDO_TEMPLATES.map(publicFrdoTemplate), kind: "original_frdo_reference_files", saved: false, sent: false };
  }
  private async operation(input: Record<string, unknown>): Promise<unknown> {
    try {
      const { data, error } = await this.db.functions.invoke("crm-frdo-email", { body: input });
      if (error) {
        let code = "CRM_FRDO_OPERATION_UNCONFIRMED";
        if (error.context instanceof Response) {
          try { code = safeCode(await error.context.json()); } catch { /* Transport body is never echoed. */ }
        }
        fail(code);
      }
      return data;
    } catch (error) { fail(safeCode(error)); }
  }
  async getTemplate(templateId: string, revision: number) {
    let entry: typeof FRDO_TEMPLATES[number];
    try { entry = getFrdoTemplate(templateId, revision); } catch { fail("CRM_FRDO_TEMPLATE_NOT_FOUND"); }
    const raw = await this.operation({ action: "getTemplate", templateId, revision });
    if (!object(raw) || raw.verified !== true || !object(raw.template) || raw.template.sha256 !== entry.sha256 ||
        raw.template.size !== entry.size || raw.template.templateId !== entry.id || raw.template.revision !== entry.revision) fail("CRM_FRDO_OPERATION_UNCONFIRMED");
    return { template: publicFrdoTemplate(entry), verified: true, saved: false, sent: false };
  }
  async preparePackage(input: PrepareFrdoPackageInput) {
    const requestId = id(input.requestId), clientId = id(input.clientId);
    if (!Number.isSafeInteger(input.expectedClientRevision) || input.expectedClientRevision < 1 ||
        input.expectedInn !== null && (typeof input.expectedInn !== "string" || !/^(\d{10}|\d{12})$/.test(input.expectedInn)) ||
        !Array.isArray(input.templates) || !input.templates.length || input.templates.length > 8) fail();
    const templates = input.templates.map(value => { const e = templateRef(value); return { templateId: e.id, revision: e.revision, sha256: e.sha256 }; });
    if (new Set(templates.map(value => value.templateId)).size !== templates.length) fail();
    const optional = { ...(input.recipient !== undefined ? { recipient: email(input.recipient) } : {}),
      ...(input.subject !== undefined ? { subject: text(input.subject, 500) } : {}), ...(input.body !== undefined ? { body: text(input.body, 12000, true) } : {}) };
    if (input.subject !== undefined && (!input.subject.trim() || /[\r\n]/.test(input.subject)) || input.body !== undefined && !input.body.trim()) fail();
    const raw = await this.operation({ action: "prepare", requestId, clientId, expectedClientRevision: input.expectedClientRevision,
      expectedInn: input.expectedInn, templates, ...optional });
    return publicPackage(raw, requestId, clientId);
  }
  async sendPackage(deliveryId: string, expectedRecipient: string) {
    const checkedId = id(deliveryId), recipient = email(expectedRecipient);
    const result = publicPackage(await this.operation({ action: "send", deliveryId: checkedId, expectedRecipient: recipient }), checkedId);
    if (result.recipient !== recipient) fail("CRM_FRDO_RECIPIENT_CHANGED");
    return result;
  }
  async getDelivery(deliveryId: string) {
    const checkedId = id(deliveryId);
    return publicPackage(await this.operation({ action: "status", deliveryId: checkedId }), checkedId);
  }
}
export async function runFrdoDocumentsTool<T extends object>(ctx: ToolContext, action: (api: CrmFrdoDocumentsService) => Promise<T> | T) {
  try {
    const db = createUserDatabase(ctx); await requireAdmin(db, ctx.getUserId());
    const result = await action(new CrmFrdoDocumentsService(db));
    return { structuredContent: { ...result }, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const code = safeCode(error), result = { code, message: messages[code] };
    return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
}
