import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { validateDocumentInput, validateIsoDate, DocumentValidationError, type DocumentInput } from "../../../supabase/functions/_shared/crm-documents/domain";
import { renderDocument } from "../../../supabase/functions/_shared/crm-documents/render";
import type { ClientRequisites, CompanyRequisites } from "../document-templates";
import { publicDelivery, type Delivery } from "../../../supabase/functions/_shared/crm-email/delivery";
import { normalizeCompanyRequisites } from "./company-requisites";
import { CustomContractTemplateError } from "../custom-contract-template";

// Explicit fields: clients also contains passwords, which must never reach MCP.
export const CLIENT_FIELDS = "id,name,inn,kpp,ogrn,legal_address,director_name,director_post,email,phone,contact_person,crm_revision";
export const DOCUMENT_FIELDS = "id,doc_type,doc_number,doc_date,client_id,client_name,client_inn,contract_id,total_amount,revision,updated_at";
const CONTRACT_FIELDS = "id,client_name,contract_number,contract_date,amount,contract_type,is_archived,service_start,service_end,service_no_deadline";
const COMPANY_KEYS = ["company_name", "company_short_name", "company_inn", "company_kpp", "company_ogrn", "company_legal_address", "company_actual_address", "company_bank_account", "company_bank_bik", "company_bank_corr", "company_bank_name", "company_director_name", "company_director_post", "company_phone", "company_email"];

export class CrmError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
function dbError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  // Do not expose raw SQL, credentials or internal records in tool errors.
  const known = error.message?.match(/CRM_[A-Z_]+/)?.[0];
  throw new CrmError(known || "DATABASE_ERROR", known || "Не удалось выполнить операцию с CRM.");
}
function jsonObject(value: unknown): Record<string, unknown> {
  if (typeof value === "string") { try { return jsonObject(JSON.parse(value)); } catch { return {}; } }
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function canonical(value: unknown): string {
  const ordered = (item: unknown): unknown => Array.isArray(item) ? item.map(ordered)
    : item && typeof item === "object" ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)).map(([key, part]) => [key, ordered(part)]))
    : item;
  return JSON.stringify(ordered(value));
}
export function createUserDatabase(ctx: ToolContext) {
  if (!ctx.isAuthenticated() || !ctx.getUserId() || !ctx.getToken()) throw new CrmError("UNAUTHORIZED", "Подключите учётную запись CRM.");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new CrmError("NOT_CONFIGURED", "Не настроено подключение к CRM.");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function requireAdmin(db: SupabaseClient, userId: string | undefined) {
  if (!userId) throw new CrmError("UNAUTHORIZED", "Требуется вход.");
  const { data, error } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || data !== true) throw new CrmError("FORBIDDEN", "Доступ к документам CRM разрешён администратору.");
}

/** One instance per call, using only the verified user's token and existing RLS. */
export class CrmDocumentsService {
  constructor(private db: SupabaseClient, private assetOrigin = "https://24zxc.ru") {}

  async saveClientEmail(requestId: string, clientId: string, email: string, expectedEmail: string | null) {
    const { data, error } = await this.db.rpc("crm_save_client_email", {
      p_request_id: requestId, p_client_id: clientId, p_email: email, p_expected_email: expectedEmail,
    });
    dbError(error);
    return data;
  }

  private async emailOperation(input: Record<string, unknown>) {
    const { data, error } = await this.db.functions.invoke("crm-document-email", { body: input });
    if (error) {
      let code: string | undefined;
      if (error.context instanceof Response) {
        try { code = (await error.context.json()).code; } catch { /* no raw transport errors */ }
      }
      throw new CrmError(code?.match(/^CRM_[A-Z_]+$/)?.[0] || "EMAIL_OPERATION_UNCONFIRMED",
        "Операция не подтверждена. Для отправки проверьте crm_get_email_delivery по deliveryId; не создавайте новую отправку для обхода ошибки.");
    }
    return data;
  }

  async prepareEmail(input: { requestId: string; clientId: string; documents: { documentId: string; revision: number }[]; recipient?: string; subject: string; body: string }) {
    return this.emailOperation({ action: "prepare", ...input });
  }

  async sendEmail(deliveryId: string, expectedRecipient: string) {
    return this.emailOperation({ action: "send", deliveryId, expectedRecipient });
  }

  async getEmailDelivery(deliveryId: string) {
    const { data, error } = await this.db.from("crm_email_deliveries")
      .select("id,actor_id,client_id,recipient,subject,body,state,message_id,documents,attachments,error,created_at,updated_at")
      .eq("id", deliveryId).maybeSingle();
    dbError(error);
    if (!data) throw new CrmError("DELIVERY_NOT_FOUND", "Отправка не найдена.");
    // Never return stored HTML, internal storage paths or raw SMTP responses.
    return { ...publicDelivery(data as unknown as Delivery), createdAt: data.created_at, updatedAt: data.updated_at };
  }

  async suggestDocumentNumber(type: "contract" | "invoice" | "act", date: string) {
    const { data, error } = await this.db.rpc("crm_suggest_document_number", {
      p_doc_type: type, p_doc_date: validateIsoDate(date),
    });
    dbError(error);
    return data;
  }

  async searchClients(query: string, field: "name" | "inn" | "email", limit: number) {
    // A single parameterized filter avoids PostgREST .or() expression injection.
    const value = query.trim().replace(/[\\%_]/g, char => `\\${char}`);
    let builder = this.db.from("clients").select(CLIENT_FIELDS);
    builder = field === "name" ? builder.ilike(field, `%${value}%`) : builder.eq(field, query.trim());
    const { data, error } = await builder.order("name").order("id").limit(limit);
    dbError(error);
    return { clients: data || [], limit, possiblyMore: (data?.length || 0) === limit };
  }

  async listContracts(clientId: string) {
    const client = await this.client(clientId);
    // Legacy contracts identify a client by name. Refuse ambiguous joins.
    const { data: matches, error: matchError } = await this.db.from("clients").select("id").eq("name", client.name).limit(2);
    dbError(matchError);
    if (matches?.length !== 1) throw new CrmError("AMBIGUOUS_CLIENT", "У клиентов совпадают названия; связь старых договоров требует уточнения.");
    const { data, error } = await this.db.from("contracts").select(CONTRACT_FIELDS).eq("client_name", client.name).order("contract_date", { ascending: false }).limit(50);
    dbError(error);
    return { contracts: data || [] };
  }

  async listDocuments(clientId: string, type?: string) {
    await this.client(clientId);
    let query = this.db.from("generated_documents").select(DOCUMENT_FIELDS).eq("client_id", clientId);
    if (type) query = query.eq("doc_type", type);
    const { data, error } = await query.order("created_at", { ascending: false }).order("id").limit(50);
    dbError(error);
    return { documents: data || [], scope: "linked_client_id", legacyDocumentsNotLinked: true };
  }

  async getDocument(documentId: string, includeHtml = false) {
    const columns: string = `${DOCUMENT_FIELDS},services,metadata${includeHtml ? ",html_content" : ""}`;
    const { data: row, error } = await this.db.from("generated_documents").select(columns).eq("id", documentId).maybeSingle();
    dbError(error);
    const data = row as unknown as Record<string, unknown> | null;
    if (!data) throw new CrmError("NOT_FOUND", "Документ не найден.");
    const metadata = jsonObject(data.metadata);
    // Do not emit arbitrary legacy metadata, which can contain unbounded data.
    return { document: { ...data, metadata: undefined, integration: {
      grossAmount: metadata.grossAmount ?? null, discountAmount: metadata.discountAmount ?? null,
      netAmount: metadata.netAmount ?? null, schemaVersion: metadata.schemaVersion ?? null,
      ...(jsonObject(metadata.documentInput).template === "custom" ? {
        customContract: jsonObject(jsonObject(metadata.documentInput).customContract),
        serviceTemplate: jsonObject(jsonObject(metadata.documentInput).serviceTemplate),
      } : {}),
    } }, artifactStatus: "saved_html", deliveryStatus: "query_by_delivery_id" };
  }

  private async client(id: string) {
    const { data, error } = await this.db.from("clients").select(CLIENT_FIELDS).eq("id", id).maybeSingle();
    dbError(error);
    if (!data) throw new CrmError("CLIENT_NOT_FOUND", "Клиент не найден.");
    return data;
  }

  private async context(input: DocumentInput) {
    const row = await this.client(input.clientId);
    const client: ClientRequisites = {
      name: row.name, inn: row.inn || "", kpp: row.kpp || "", ogrn: row.ogrn || "",
      address: row.legal_address || "", director_name: row.director_name || "", director_post: row.director_post || "",
    };
    const { data: settings, error } = await this.db.from("site_settings").select("key,value").in("key", COMPANY_KEYS);
    dbError(error);
    const configuredCompany = Object.fromEntries(COMPANY_KEYS.map(key => [key, ""])) as unknown as CompanyRequisites;
    for (const setting of settings || []) {
      if (typeof setting.value === "string") (configuredCompany as unknown as Record<string, string>)[setting.key] = setting.value;
    }
    const company = normalizeCompanyRequisites(configuredCompany);
    const required = input.type === "invoice"
      ? ["company_name", "company_inn", "company_bank_account", "company_bank_bik", "company_bank_name", "company_bank_corr", "company_director_name", "company_director_post"]
      : ["company_name", "company_inn", "company_legal_address", "company_director_name", "company_director_post"];
    const missing = required.filter(key => !(company as unknown as Record<string, string>)[key]?.trim());
    if (missing.length) throw new CrmError("COMPANY_REQUISITES_MISSING", `В настройках исполнителя отсутствуют: ${missing.join(", ")}.`);
    const needsClientRepresentative = input.type !== "invoice" && !(input.type === "act" && input.invoiceBasis);
    const clientFieldNames = { name: "название", inn: "ИНН", address: "адрес", director_name: "ФИО руководителя", director_post: "должность руководителя" };
    const clientFields: (keyof typeof clientFieldNames)[] = needsClientRepresentative
      ? input.clientRepresentative ? ["name", "inn", "address"] : ["name", "inn", "address", "director_name", "director_post"]
      : ["name", "inn"];
    const missingClient = clientFields.filter(key => !client[key]?.trim());
    if (missingClient.length) {
      throw new CrmError("CLIENT_REQUISITES_MISSING", `В карточке клиента не заполнены: ${missingClient.map(key => clientFieldNames[key]).join(", ")}. Используйте подтверждённые реквизиты клиента.`);
    }
    let linkedContract: { id: string; number: string; date: string } | undefined;
    if (input.contractId) {
      if (input.type === "contract") throw new CrmError("INVALID_CONTRACT_LINK", "Новый договор создаётся без ссылки на другой договор.");
      const { data: matches, error: matchError } = await this.db.from("clients").select("id").eq("name", row.name).limit(2);
      dbError(matchError);
      if (matches?.length !== 1) throw new CrmError("AMBIGUOUS_CLIENT", "Нельзя однозначно связать договор по названию клиента.");
      const { data: contract, error: contractError } = await this.db.from("contracts").select(CONTRACT_FIELDS).eq("id", input.contractId).eq("client_name", row.name).maybeSingle();
      dbError(contractError);
      if (!contract || contract.is_archived || !contract.contract_number || !contract.contract_date) throw new CrmError("INVALID_CONTRACT_LINK", "Выберите действующую запись договора этого клиента с номером и датой.");
      linkedContract = { id: contract.id, number: contract.contract_number, date: contract.contract_date };
    }
    return { client, company, companySourceSnapshot: configuredCompany, linkedContract, assetOrigin: this.assetOrigin };
  }

  private async materializeTemplate(input: DocumentInput): Promise<DocumentInput> {
    if (input.template !== "custom" || !input.serviceTemplate) return input;
    const ref = input.serviceTemplate;
    const { data: template, error } = await this.db.from("crm_service_templates")
      .select("id,is_archived").eq("id", ref.id).maybeSingle();
    dbError(error);
    if (!template) throw new CrmError("CRM_SERVICE_TEMPLATE_NOT_FOUND", "Шаблон услуги не найден.");
    if (template.is_archived) throw new CrmError("CRM_SERVICE_TEMPLATE_ARCHIVED", "Шаблон услуги находится в архиве.");
    const { data: version, error: versionError } = await this.db.from("crm_service_template_versions")
      .select("content").eq("template_id", ref.id).eq("revision", ref.revision).maybeSingle();
    dbError(versionError);
    if (!version?.content) throw new CrmError("CRM_SERVICE_TEMPLATE_VERSION_NOT_FOUND", "Версия шаблона не найдена.");
    const content = version.content as { title: string; body: string };
    if (input.customContract && (input.customContract.title !== content.title || input.customContract.body !== content.body)) {
      throw new CrmError("CRM_SERVICE_TEMPLATE_SNAPSHOT_MISMATCH", "Текст не совпадает с выбранной версией шаблона. Сохраните новую версию либо уберите ссылку на шаблон.");
    }
    const { templateVariables, ...rest } = input;
    return validateDocumentInput({ ...rest, customContract: {
      title: content.title, body: content.body,
      variables: input.customContract?.variables ?? templateVariables ?? {},
    } });
  }

  private replayInput(input: DocumentInput, original: unknown): DocumentInput {
    const stored = jsonObject(original);
    if (input.template !== "custom" || !input.serviceTemplate || input.customContract) return input;
    const storedInput = jsonObject(stored.input);
    const savedCustom = jsonObject(storedInput.customContract);
    const savedVariables = jsonObject(savedCustom.variables);
    const { templateVariables, ...rest } = input;
    const same = (left: unknown, right: unknown) => canonical(left) === canonical(right);
    if (!same(templateVariables ?? {}, savedVariables)) throw new CrmError("CRM_REQUEST_ID_CONFLICT", "Этот requestId уже использован с другими переменными шаблона.");
    const candidate = validateDocumentInput({ ...rest, customContract: savedCustom });
    // SQL also checks actor and exact command identity under a row lock.
    if (!same(candidate, storedInput)) throw new CrmError("CRM_REQUEST_ID_CONFLICT", "Этот requestId уже использован для другого документа.");
    return candidate;
  }

  async preview(raw: unknown, includeHtml = false) {
    const input = await this.materializeTemplate(validateDocumentInput(raw));
    const rendered = renderDocument(input, await this.context(input));
    return { status: "preview", input, totalAmount: rendered.totalAmount, metadata: rendered.metadata,
      ...(includeHtml ? { html: rendered.html } : {}), artifactStatus: "html_only", saved: false, sent: false };
  }

  async create(requestId: string, raw: unknown) {
    const checked = validateDocumentInput(raw);
    // A successful retry must not depend on changed/deleted client settings.
    // The SQL function remains authoritative for actor + command identity.
    const { data: previous, error: replayError } = await this.db.from("crm_document_api_requests")
      .select("request,result").eq("request_id", requestId).maybeSingle();
    dbError(replayError);
    if (previous?.result) {
      const input = this.replayInput(checked, previous.request);
      const { data, error } = await this.db.rpc("crm_save_document", {
        p_request_id: requestId, p_document_id: null, p_expected_revision: null,
        p_input: input, p_payload: jsonObject(previous.request).payload,
      });
      dbError(error);
      return { ...data, status: "saved", artifactStatus: "html_only", deliveryStatus: "not_requested", sent: false };
    }
    const input = await this.materializeTemplate(checked);
    const context = await this.context(input);
    const rendered = renderDocument(input, context);
    return this.save(requestId, null, null, input, rendered, context.client, input.contractId || null);
  }

  async revise(requestId: string, documentId: string, expectedRevision: number, changes: Record<string, unknown>) {
    const allowed = ["date", "services", "subject", "deadline", "paymentTerms", "discount", "servicePeriod", "clientRepresentative", "customContract"];
    if (!Object.keys(changes).length || Object.keys(changes).some(key => !allowed.includes(key))) {
      throw new CrmError("INVALID_CHANGES", "Изменять тип, номер, клиента или связь документа через правку нельзя.");
    }
    const { data: previous, error } = await this.db.from("crm_document_revisions").select("input,snapshot,source").eq("document_id", documentId).eq("revision", expectedRevision).maybeSingle();
    dbError(error);
    if (!previous?.input || previous.source !== "api") throw new CrmError("LEGACY_REQUIRES_ADOPTION", "Эта версия создана вне API. Сначала требуется явное сопоставление исходного документа и его реквизитов.");
    if (changes.deadline !== undefined && changes.deadline !== jsonObject(previous.input).deadline && jsonObject(previous.input).servicePeriod && changes.servicePeriod === undefined) {
      throw new CrmError("SERVICE_PERIOD_REQUIRED", "При изменении срока укажите соответствующий период услуг, чтобы текст и карточка договора не разошлись.");
    }
    const metadata = jsonObject(jsonObject(previous.snapshot).metadata);
    if (!metadata.clientSnapshot || !metadata.companySnapshot) throw new CrmError("SNAPSHOT_MISSING", "У версии нет зафиксированных реквизитов. Автоматическая правка остановлена.");
    const next = { ...jsonObject(previous.input), ...changes };
    if (changes.customContract !== undefined) delete next.serviceTemplate;
    if (next.discount === null) delete next.discount;
    const input = validateDocumentInput(next);
    const context = {
      client: metadata.clientSnapshot as ClientRequisites,
      company: metadata.companySnapshot as CompanyRequisites,
      companySourceSnapshot: metadata.companySourceSnapshot as CompanyRequisites | undefined,
      linkedContract: metadata.linkedContractSnapshot as { id: string; number: string; date: string } | undefined,
      assetOrigin: this.assetOrigin,
    };
    const rendered = renderDocument(input, context);
    const contractId = jsonObject(previous.snapshot).contract_id as string | null;
    return this.save(requestId, documentId, expectedRevision, input, rendered, context.client, contractId);
  }

  private async save(requestId: string, documentId: string | null, expectedRevision: number | null,
    input: DocumentInput, rendered: ReturnType<typeof renderDocument>, client: ClientRequisites, contractId: string | null) {
    const { data, error } = await this.db.rpc("crm_save_document", {
      p_request_id: requestId, p_document_id: documentId, p_expected_revision: expectedRevision,
      p_input: input,
      p_payload: {
        doc_type: input.type, doc_number: input.number, doc_date: input.date, client_id: input.clientId,
        client_name: client.name, client_inn: client.inn || null, contract_id: contractId,
        total_amount: rendered.totalAmount, services: rendered.services, html_content: rendered.html, metadata: rendered.metadata,
      },
    });
    dbError(error);
    return { ...data, status: "saved", artifactStatus: "html_only", deliveryStatus: "not_requested", sent: false };
  }
}

export async function runCrmTool<T>(ctx: ToolContext, action: (service: CrmDocumentsService) => Promise<T>) {
  try {
    const db = createUserDatabase(ctx);
    await requireAdmin(db, ctx.getUserId());
    const result = await action(new CrmDocumentsService(db));
    return { structuredContent: result, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const result = error instanceof DocumentValidationError
      ? { code: "INVALID_DOCUMENT", message: "Уточните поля документа.", issues: error.issues }
      : error instanceof CustomContractTemplateError
      ? { code: "INVALID_CUSTOM_CONTRACT", message: "Исправьте текст или переменные договора.", issues: [{ field: error.field, message: error.message }] }
      : error instanceof CrmError ? { code: error.code, message: error.message }
      : { code: "INTERNAL_ERROR", message: "Операция не выполнена. Требуется проверка серверного журнала." };
    return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
}
