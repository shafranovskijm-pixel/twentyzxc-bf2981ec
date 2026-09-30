import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { CUSTOM_CONTRACT_TOKENS, CustomContractTemplateError, getCustomContractTokens } from "../custom-contract-template";
import { CrmError, createUserDatabase, requireAdmin } from "./service";

const FIELDS = "id,name,description,revision,is_archived,created_at,updated_at";
function fail(error: { message?: string } | null) {
  if (error) {
    const code = error.message?.match(/CRM_[A-Z_]+/)?.[0] || "CRM_SERVICE_TEMPLATE_DATABASE_ERROR";
    const messages: Record<string, string> = {
      CRM_SERVICE_TEMPLATE_REVISION_CONFLICT: "Шаблон уже изменён. Перечитайте его и согласуйте новую версию.",
      CRM_SERVICE_TEMPLATE_NOT_FOUND: "Шаблон или выбранная версия не найдены.",
      CRM_SERVICE_TEMPLATE_ARCHIVED: "Шаблон в архиве. Выберите действующий шаблон.",
      CRM_REQUEST_ID_CONFLICT: "Этот requestId уже использован для другой операции. Проверьте сохранённый результат.",
    };
    throw new CrmError(code, messages[code] || "Сохранение шаблона не подтверждено. Проверьте данные и версию; при повторе используйте прежний requestId.");
  }
}

export interface SaveServiceTemplateInput {
  requestId: string;
  templateId?: string;
  expectedRevision?: number;
  name: string;
  description: string;
  content: { title: string; body: string };
  isArchived: boolean;
}

/** Templates never contain per-client variable values. Every revision is immutable. */
export class CrmServiceTemplatesService {
  constructor(private db: SupabaseClient) {}

  async list(query = "", includeArchived = false, limit = 25) {
    if (typeof query !== "string" || query.length > 200 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
      throw new CrmError("CRM_INVALID_TEMPLATE_QUERY", "Укажите строку поиска до 200 символов и лимит 1–50.");
    }
    let builder = this.db.from("crm_service_templates").select(FIELDS);
    if (!includeArchived) builder = builder.eq("is_archived", false);
    if (query.trim()) builder = builder.ilike("name", `%${query.trim().replace(/[\\%_]/g, value => `\\${value}`)}%`);
    const { data, error } = await builder.order("name").order("id").limit(limit);
    fail(error);
    return { templates: data || [], possiblyMore: (data?.length || 0) === limit };
  }

  async get(templateId: string, revision?: number) {
    if (revision !== undefined && (!Number.isSafeInteger(revision) || revision < 1)) {
      throw new CrmError("CRM_INVALID_TEMPLATE_REVISION", "Укажите положительный номер версии шаблона.");
    }
    const { data: current, error } = await this.db.from("crm_service_templates").select(FIELDS).eq("id", templateId).maybeSingle();
    fail(error);
    if (!current) throw new CrmError("CRM_SERVICE_TEMPLATE_NOT_FOUND", "Шаблон не найден.");
    const selectedRevision = revision ?? current.revision;
    const { data: version, error: versionError } = await this.db.from("crm_service_template_versions")
      .select("template_id,revision,name,description,content,created_at").eq("template_id", templateId).eq("revision", selectedRevision).maybeSingle();
    fail(versionError);
    if (!version) throw new CrmError("CRM_SERVICE_TEMPLATE_NOT_FOUND", "Выбранная версия шаблона не найдена.");
    const content = version.content as { title: string; body: string };
    const variables = getCustomContractTokens(content);
    return { template: { id: current.id as string, name: version.name as string, description: version.description as string,
      revision: selectedRevision as number, currentRevision: current.revision as number, isArchived: current.is_archived as boolean,
      content, createdAt: current.created_at as string, updatedAt: version.created_at as string },
      ...variables, availableTokens: CUSTOM_CONTRACT_TOKENS };
  }

  async save(input: SaveServiceTemplateInput) {
    if (Boolean(input.templateId) !== (input.expectedRevision !== undefined)
      || (input.expectedRevision !== undefined && (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1))) {
      throw new CrmError("CRM_INVALID_TEMPLATE_REVISION", "Для новой версии укажите ID шаблона и его текущую expectedRevision; для нового шаблона оба поля пропустите.");
    }
    if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 500
      || typeof input.description !== "string" || input.description.length > 2000 || typeof input.isArchived !== "boolean") {
      throw new CrmError("CRM_INVALID_SERVICE_TEMPLATE", "Проверьте название шаблона (до 500 символов), описание (до 2000) и признак архива.");
    }
    getCustomContractTokens(input.content);
    const { data, error } = await this.db.rpc("crm_save_service_template", {
      p_request_id: input.requestId, p_template_id: input.templateId ?? null, p_expected_revision: input.expectedRevision ?? null,
      p_name: input.name.trim(), p_description: input.description.trim(),
      p_content: { title: input.content.title.trim(), body: input.content.body }, p_is_archived: input.isArchived,
    });
    fail(error);
    return { ...data, saved: true, sent: false };
  }
}

export async function runServiceTemplateTool<T>(ctx: ToolContext, action: (service: CrmServiceTemplatesService) => Promise<T>) {
  try {
    const db = createUserDatabase(ctx);
    await requireAdmin(db, ctx.getUserId());
    const result = await action(new CrmServiceTemplatesService(db));
    return { structuredContent: result, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const result = error instanceof CustomContractTemplateError
      ? { code: "INVALID_SERVICE_TEMPLATE", message: "Уточните текст шаблона.", issues: [{ field: error.field, message: error.message }] }
      : error instanceof CrmError ? { code: error.code, message: error.message }
      : { code: "INTERNAL_ERROR", message: "Операция с шаблоном не подтверждена. Проверьте сохранённую версию." };
    return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
}
