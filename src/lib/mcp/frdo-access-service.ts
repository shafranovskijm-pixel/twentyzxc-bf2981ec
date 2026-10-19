import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { CrmError, createUserDatabase, requireAdmin } from "./service";

export const FRDO_CREDENTIAL_FIELDS = ["login", "passwordDpo", "passwordPo"] as const;
export type FrdoCredentialField = typeof FRDO_CREDENTIAL_FIELDS[number];
export type FrdoCredentials = Partial<Record<FrdoCredentialField, string | null>>;
export type FrdoComparison = "match" | "different" | "not_set";
export interface FrdoClient { id: string; name: string; inn: string | null; crm_revision: number }
export interface FrdoPresence { loginSet: boolean; passwordDpoSet: boolean; passwordPoSet: boolean }
export type FrdoStatusResult = {
  client: FrdoClient; presence: FrdoPresence; status: "read"; saved: false; sent: false; replayed: false;
};
export type FrdoCompareResult = FrdoStatusResult & { comparison: Partial<Record<FrdoCredentialField, FrdoComparison>> };
export type FrdoSaveResult = {
  client: FrdoClient; presence: FrdoPresence; changedFields: FrdoCredentialField[];
  status: "saved"; saved: true; sent: false; replayed: boolean;
};

const messages: Record<string, string> = {
  UNAUTHORIZED: "Подключите учётную запись CRM.",
  FORBIDDEN: "Работа с доступом ФИС ФРДО разрешена только администратору CRM.",
  NOT_CONFIGURED: "Не настроено подключение к CRM.",
  CRM_ADMIN_REQUIRED: "Работа с доступом ФИС ФРДО разрешена только администратору CRM.",
  CRM_CLIENT_NOT_FOUND: "Карточка клиента не найдена. Сначала выберите существующую карточку.",
  CRM_FRDO_IDENTITY_MISMATCH: "ИНН выбранной карточки не совпадает с ожидаемым. Перечитайте карточку и уточните клиента; доступ не изменён.",
  CRM_CLIENT_REVISION_CONFLICT: "Карточка уже изменилась. Перечитайте её актуальную версию и согласуйте изменение перед повтором.",
  CRM_INVALID_FRDO_CREDENTIALS: "Передайте только login, passwordDpo или passwordPo. Значения должны быть непустыми строками без управляющих символов; null допустим только для явной очистки при сохранении.",
  CRM_INVALID_FRDO_REQUEST: "Нужны точный clientId, ожидаемый ИНН (10 или 12 цифр либо null), а при сохранении — requestId и положительный expectedRevision.",
  CRM_REQUEST_ID_CONFLICT: "Этот requestId уже использован для другой операции. Проверьте результат; повторяйте прежнюю команду с прежними данными.",
  CRM_FRDO_DATABASE_ERROR: "Операция с доступом ФИС ФРДО не подтверждена. Перечитайте статус; повтор сохранения выполняйте с прежними requestId и данными.",
  CRM_FRDO_RESULT_UNCONFIRMED: "CRM не подтвердила ожидаемый результат. Перечитайте статус; не создавайте новую команду для обхода ошибки.",
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function hasControls(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 32 || code >= 127 && code <= 159) return true;
  }
  return false;
}
const owns = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key);
function knownCode(value: unknown): value is string { return typeof value === "string" && owns(messages, value); }
function fail(code: string): never { throw new CrmError(code, messages[code]); }
function safeError(error: unknown, fallback = "CRM_FRDO_DATABASE_ERROR"): CrmError {
  // Never trust an existing CrmError's message: it may contain a transport body.
  let code = fallback;
  if (error && typeof error === "object") {
    const reported = error as { code?: unknown; message?: unknown };
    if (knownCode(reported.code)) code = reported.code;
    else if (typeof reported.message === "string") {
      const token = reported.message.match(/\bCRM_[A-Z_]+\b/)?.[0];
      if (knownCode(token)) code = token;
    }
  }
  return new CrmError(code, messages[code]);
}
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function validInn(value: unknown): value is string | null { return value === null || typeof value === "string" && /^\d{10}(\d{2})?$/.test(value); }
function checkedClientId(value: unknown): string {
  if (typeof value !== "string" || !uuid.test(value)) fail("CRM_INVALID_FRDO_REQUEST");
  return value.toLowerCase();
}
function expectedInn(value: unknown): string | null {
  if (!validInn(value)) fail("CRM_INVALID_FRDO_REQUEST");
  return value;
}

/** No trim or normalization: surrounding spaces can be part of a credential. */
export function validateFrdoCredentials(raw: unknown, allowNull = false): FrdoCredentials {
  if (!record(raw) || ![Object.prototype, null].includes(Object.getPrototypeOf(raw))) fail("CRM_INVALID_FRDO_CREDENTIALS");
  const keys = Reflect.ownKeys(raw);
  if (!keys.length || keys.some(key => typeof key !== "string" || !FRDO_CREDENTIAL_FIELDS.includes(key as FrdoCredentialField))) fail("CRM_INVALID_FRDO_CREDENTIALS");
  const result: FrdoCredentials = {};
  for (const key of keys as FrdoCredentialField[]) {
    const descriptor = Object.getOwnPropertyDescriptor(raw, key);
    if (!descriptor || !owns(descriptor, "value") || !descriptor.enumerable) fail("CRM_INVALID_FRDO_CREDENTIALS");
    const value: unknown = descriptor.value;
    if (value === null && allowNull) { result[key] = null; continue; }
    if (typeof value !== "string" || !value.trim() || value.length > (key === "login" ? 500 : 4096) || hasControls(value)) fail("CRM_INVALID_FRDO_CREDENTIALS");
    result[key] = value;
  }
  return result;
}

function maskedSnapshot(raw: unknown, clientId: string, assertedInn?: string | null): { client: FrdoClient; presence: FrdoPresence; source: Record<string, unknown> } {
  if (!record(raw) || !record(raw.client) || !record(raw.presence)) fail("CRM_FRDO_RESULT_UNCONFIRMED");
  const client = raw.client;
  const presence = raw.presence;
  if (typeof client.id !== "string" || client.id.toLowerCase() !== clientId || !uuid.test(client.id) ||
      typeof client.name !== "string" || !client.name.trim() || client.name.length > 500 || hasControls(client.name) ||
      !validInn(client.inn) || !Number.isSafeInteger(client.crm_revision) || (client.crm_revision as number) < 1 ||
      typeof presence.loginSet !== "boolean" || typeof presence.passwordDpoSet !== "boolean" || typeof presence.passwordPoSet !== "boolean" ||
      assertedInn !== undefined && client.inn !== assertedInn) fail("CRM_FRDO_RESULT_UNCONFIRMED");
  return {
    client: { id: client.id.toLowerCase(), name: client.name, inn: client.inn, crm_revision: client.crm_revision as number },
    presence: { loginSet: presence.loginSet, passwordDpoSet: presence.passwordDpoSet, passwordPoSet: presence.passwordPoSet },
    source: raw,
  };
}
function readResult(raw: unknown, clientId: string, assertedInn?: string | null): FrdoStatusResult {
  const { client, presence, source } = maskedSnapshot(raw, clientId, assertedInn);
  if (source.status !== "read" || source.saved !== false || source.sent !== false || source.replayed !== false) fail("CRM_FRDO_RESULT_UNCONFIRMED");
  return { client, presence, status: "read", saved: false, sent: false, replayed: false };
}

export class CrmFrdoAccessService {
  constructor(private db: SupabaseClient) {}

  private async rpc(name: string, parameters: Record<string, unknown>): Promise<unknown> {
    try {
      const { data, error } = await this.db.rpc(name, parameters);
      if (error) throw safeError(error);
      return data;
    } catch (error) { throw safeError(error); }
  }

  async getStatus(clientId: string): Promise<FrdoStatusResult> {
    const id = checkedClientId(clientId);
    return readResult(await this.rpc("crm_get_frdo_access_status", { p_client_id: id }), id);
  }

  async compare(clientId: string, expectedClientInn: string | null, raw: unknown): Promise<FrdoCompareResult> {
    const id = checkedClientId(clientId);
    const inn = expectedInn(expectedClientInn);
    const credentials = validateFrdoCredentials(raw);
    const data = await this.rpc("crm_compare_frdo_access", { p_client_id: id, p_expected_inn: inn, p_credentials: credentials });
    const result = readResult(data, id, inn);
    if (!record(data) || !record(data.comparison)) fail("CRM_FRDO_RESULT_UNCONFIRMED");
    const comparison: Partial<Record<FrdoCredentialField, FrdoComparison>> = {};
    for (const field of Object.keys(credentials) as FrdoCredentialField[]) {
      const value = data.comparison[field];
      if (!owns(data.comparison, field) || !["match", "different", "not_set"].includes(value as string)) fail("CRM_FRDO_RESULT_UNCONFIRMED");
      comparison[field] = value as FrdoComparison;
    }
    return { ...result, comparison };
  }

  async save(requestId: string, clientId: string, expectedRevision: number, expectedClientInn: string | null, raw: unknown): Promise<FrdoSaveResult> {
    const id = checkedClientId(clientId);
    if (typeof requestId !== "string" || !uuid.test(requestId) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) fail("CRM_INVALID_FRDO_REQUEST");
    const inn = expectedInn(expectedClientInn);
    const changes = validateFrdoCredentials(raw, true);
    const data = await this.rpc("crm_save_frdo_access", { p_request_id: requestId.toLowerCase(), p_client_id: id,
      p_expected_revision: expectedRevision, p_expected_inn: inn, p_changes: changes });
    const { client, presence, source } = maskedSnapshot(data, id, inn);
    if (source.status !== "saved" || source.saved !== true || source.sent !== false || typeof source.replayed !== "boolean" ||
        !Array.isArray(source.changedFields) || source.changedFields.some(field => typeof field !== "string" || !owns(changes, field)) ||
        new Set(source.changedFields).size !== source.changedFields.length) fail("CRM_FRDO_RESULT_UNCONFIRMED");
    if (client.crm_revision !== expectedRevision + (source.changedFields.length ? 1 : 0)) fail("CRM_FRDO_RESULT_UNCONFIRMED");
    return { client, presence, changedFields: [...source.changedFields] as FrdoCredentialField[], status: "saved", saved: true, sent: false, replayed: source.replayed };
  }
}

export async function runFrdoAccessTool<T>(ctx: ToolContext, action: (service: CrmFrdoAccessService) => Promise<T>) {
  try {
    const db = createUserDatabase(ctx);
    await requireAdmin(db, ctx.getUserId());
    const result = await action(new CrmFrdoAccessService(db));
    return { structuredContent: result, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const safe = safeError(error);
    const result = { code: safe.code, message: safe.message };
    return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
}
