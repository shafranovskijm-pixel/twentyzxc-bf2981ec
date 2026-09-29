import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { CrmError, createUserDatabase, requireAdmin } from "./service";

// A separate allowlist is intentional: clients also holds passwords and notes.
export const CLIENT_CARD_FIELDS = "id,name,contact_person,email,phone,telegram,inn,kpp,ogrn,legal_address,director_name,director_post,crm_revision,updated_at";
export const CLIENT_WRITABLE_FIELDS = ["name", "contact_person", "email", "phone", "telegram", "inn", "kpp", "ogrn", "legal_address", "director_name", "director_post"] as const;
export type ClientField = typeof CLIENT_WRITABLE_FIELDS[number];
export type ClientChanges = Partial<Record<ClientField, string | null>>;

const messages: Record<string, string> = {
  CRM_ADMIN_REQUIRED: "Изменять карточки клиентов может только администратор CRM.",
  CRM_CLIENT_NOT_FOUND: "Клиент не найден. Сначала выберите существующую карточку.",
  CRM_CLIENT_REVISION_CONFLICT: "Карточка уже изменилась. Перечитайте её crm_get_client, покажите актуальные данные и повторите согласованную правку с новой версией.",
  CRM_REQUEST_ID_CONFLICT: "Этот requestId уже использован для другой операции. Не подменяйте успешную команду повтором с другими данными.",
  CRM_CLIENT_NAME_EXISTS: "Карточка с таким названием уже существует. Найдите клиента и уточните нужную карточку; автоматическое объединение не выполнялось.",
  CRM_CLIENT_INN_EXISTS: "Этот ИНН уже есть в другой карточке. Найдите клиента по ИНН и уточните нужную карточку.",
  CRM_CLIENT_EMAIL_EXISTS: "Этот email уже есть у другого клиента. Проверьте совпадение; allowSharedEmail допустим только после подтверждения, что один адрес действительно используется несколькими клиентами.",
  CRM_CLIENT_RENAME_AMBIGUOUS: "Название нельзя безопасно изменить: старые договоры связаны по названию и совпадение неоднозначно. Сначала требуется точное сопоставление карточек и договоров.",
  CRM_CLIENT_NAME_HAS_CONTRACTS: "Под новым названием уже есть старые договоры. Автоматическое присвоение этих договоров клиенту остановлено; сначала требуется сопоставление.",
  CRM_INVALID_CLIENT_FIELDS: "Укажите только поддерживаемые поля карточки; название обязательно при создании. Пустые строки не удаляют данные — для явной очистки используйте null.",
  CRM_INVALID_CLIENT_REQUEST: "Не хватает requestId, clientId или актуального expectedRevision.",
};

function throwDatabaseError(error: { message?: string } | null) {
  if (!error) return;
  const code = error.message?.match(/CRM_[A-Z_]+/)?.[0] || "DATABASE_ERROR";
  throw new CrmError(code, messages[code] || "Не удалось сохранить карточку клиента. Перечитайте карточку перед повтором; не создавайте дубликат.");
}

/** SQL repeats validation and authorization; these checks also reject accidental broad payloads. */
export function validateClientChanges(raw: unknown, creating = false): ClientChanges {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new CrmError("CRM_INVALID_CLIENT_FIELDS", messages.CRM_INVALID_CLIENT_FIELDS);
  const limits: Record<ClientField, number> = { name: 500, contact_person: 500, email: 254, phone: 100,
    telegram: 200, inn: 12, kpp: 9, ogrn: 15, legal_address: 2000, director_name: 500, director_post: 250 };
  const entries = Object.entries(raw);
  if (!entries.length || entries.some(([key]) => !CLIENT_WRITABLE_FIELDS.includes(key as ClientField))) {
    throw new CrmError("CRM_INVALID_CLIENT_FIELDS", messages.CRM_INVALID_CLIENT_FIELDS);
  }
  const result: ClientChanges = {};
  for (const [key, value] of entries) {
    const field = key as ClientField;
    if (value === null && field !== "name") { result[field] = null; continue; }
    if (typeof value !== "string" || !value.trim() || value.trim().length > limits[field] || /[\x00-\x1f\x7f]/.test(value)) {
      throw new CrmError("CRM_INVALID_CLIENT_FIELDS", `${messages.CRM_INVALID_CLIENT_FIELDS} Поле: ${field}.`);
    }
    const text = value.trim();
    const formats = { inn: /^\d{10}(\d{2})?$/, kpp: /^\d{9}$/, ogrn: /^\d{13}(\d{2})?$/ };
    if (field in formats && !formats[field as keyof typeof formats].test(text)) {
      throw new CrmError("CRM_INVALID_CLIENT_FIELDS", `Проверьте формат ${field}. Значение не сохранено.`);
    }
    if (field === "email" && (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(text))) {
      throw new CrmError("CRM_INVALID_CLIENT_FIELDS", "Укажите один email без имени и списка адресов.");
    }
    result[field] = text;
  }
  if (creating && !result.name) throw new CrmError("CRM_INVALID_CLIENT_FIELDS", messages.CRM_INVALID_CLIENT_FIELDS);
  return result;
}

export class CrmClientService {
  constructor(private db: SupabaseClient) {}

  async getClient(clientId: string) {
    const { data, error } = await this.db.from("clients").select(CLIENT_CARD_FIELDS).eq("id", clientId).maybeSingle();
    throwDatabaseError(error);
    if (!data) throw new CrmError("CRM_CLIENT_NOT_FOUND", messages.CRM_CLIENT_NOT_FOUND);
    return { client: data, saved: true, sent: false };
  }

  async createClient(requestId: string, raw: unknown, allowSharedEmail = false) {
    const fields = validateClientChanges(raw, true);
    const { data, error } = await this.db.rpc("crm_save_client", {
      p_request_id: requestId, p_client_id: null, p_expected_revision: null,
      p_changes: fields, p_allow_shared_email: allowSharedEmail,
    });
    throwDatabaseError(error);
    return data;
  }

  async updateClient(requestId: string, clientId: string, expectedRevision: number, raw: unknown, allowSharedEmail = false) {
    const fields = validateClientChanges(raw);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
      throw new CrmError("CRM_INVALID_CLIENT_REQUEST", messages.CRM_INVALID_CLIENT_REQUEST);
    }
    const { data, error } = await this.db.rpc("crm_save_client", {
      p_request_id: requestId, p_client_id: clientId, p_expected_revision: expectedRevision,
      p_changes: fields, p_allow_shared_email: allowSharedEmail,
    });
    throwDatabaseError(error);
    return data;
  }
}

export async function runClientTool<T>(ctx: ToolContext, action: (service: CrmClientService) => Promise<T>) {
  try {
    const db = createUserDatabase(ctx);
    await requireAdmin(db, ctx.getUserId());
    const result = await action(new CrmClientService(db));
    return { structuredContent: result, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const result = error instanceof CrmError ? { code: error.code, message: error.message }
      : { code: "INTERNAL_ERROR", message: "Сохранение карточки не подтверждено. Проверьте карточку; не создавайте дубликат." };
    return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
}
