import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseHandler } from "@lovable.dev/mcp-js/stacks/supabase";
import mcp, { crmTools } from "../lib/mcp";
import { CLIENT_FIELDS, CrmDocumentsService, createUserDatabase, requireAdmin } from "../lib/mcp/service";
import { renderDocument } from "../../supabase/functions/_shared/crm-documents/render";

const clientId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const contractId = "33333333-3333-4333-8333-333333333333";
const requestId = "44444444-4444-4444-8444-444444444444";
const client = { id: clientId, name: "Тестовая организация", inn: "0000000000", kpp: "", ogrn: "", legal_address: "Тестовый адрес", director_name: "Тестовый руководитель", director_post: "Директор" };
const company = {
  company_name: "Тестовый исполнитель", company_short_name: "Тест", company_inn: "000000000000", company_kpp: "", company_ogrn: "",
  company_legal_address: "Тестовый адрес", company_actual_address: "", company_bank_account: "00000000000000000000", company_bank_bik: "000000000",
  company_bank_corr: "00000000000000000000", company_bank_name: "Тестовый банк", company_director_name: "Тестовый исполнитель", company_director_post: "Директор", company_phone: "", company_email: "",
};
const input = { type: "invoice" as const, clientId, date: "2026-09-28", number: "TEST/2026", services: [{ name: "Тестовая услуга", qty: 1, price: 3000 }] };

function mockDb(results: unknown[]) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const db = { from: vi.fn((table: string) => {
    const value = results.shift();
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "ilike", "in", "order", "limit", "maybeSingle"]) {
      builder[method] = (...args: unknown[]) => { calls.push({ table, method, args }); return builder; };
    }
    builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: value, error: null }).then(resolve);
    return builder;
  }), rpc: vi.fn().mockResolvedValue({ data: { documentId, revision: 1, contractId: null, replayed: false }, error: null }) };
  return { db: db as unknown as SupabaseClient, calls, rpc: db.rpc, from: db.from };
}

describe("CRM authorization and protocol boundary", () => {
  it("does not construct a database client for an unauthenticated context", () => {
    expect(() => createUserDatabase({ isAuthenticated: () => false } as never)).toThrow("Подключите");
  });
  it.each([false, null, "true"])("rejects non-admin role result %s", async value => {
    const db = { rpc: vi.fn().mockResolvedValue({ data: value, error: null }) } as never;
    await expect(requireAdmin(db, clientId)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("checks the verified user's admin role with no service-role bypass", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    await requireAdmin({ rpc } as never, clientId);
    expect(rpc).toHaveBeenCalledWith("has_role", { _user_id: clientId, _role: "admin" });
  });
  it("advertises only implemented operations, and marks writes as writes", () => {
    expect(crmTools.map(tool => tool.name)).toHaveLength(20);
    for (const tool of crmTools) expect(tool.annotations?.readOnlyHint).toBe(!/create|revise|update_client|import_client|save_client|prepare_document_email|send_document_email/.test(tool.name));
    for (const name of ["crm_import_client_pdf", "crm_import_client_file"]) {
      const fileTool = crmTools.find(tool => tool.name === name) as { _meta?: Record<string, unknown> };
      expect(fileTool._meta?.["openai/fileParams"]).toEqual(["file"]);
    }
    expect(crmTools.find(tool => tool.name === "crm_send_document_email")?.annotations?.openWorldHint).toBe(true);
  });
  it("protects the actual MCP HTTP route before any database access", async () => {
    const handler = createSupabaseHandler(mcp, { functionName: "mcp" });
    const response = await handler(new Request("https://test.example/functions/v1/mcp", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    }));
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("resource_metadata");
  });
});

describe("CRM queries and document persistence", () => {
  const representative = { name: "Сидоров Сергей Александрович", post: "Сотрудник управляющей организации", basis: "доверенности № TEST от 03.02.2025" };
  const representedContract = { ...input, type: "contract" as const, template: "frdo" as const, subject: "Услуги ФРДО", deadline: "12 месяцев", paymentTerms: "авансом 100%", clientRepresentative: representative };
  it("previews and saves an authorized employee without inventing a client director", async () => {
    const withoutDirector = { ...client, director_name: null, director_post: null };
    const settings = Object.entries(company).map(([key, value]) => ({ key, value }));
    const fake = mockDb([withoutDirector, settings, null, withoutDirector, settings]);
    const api = new CrmDocumentsService(fake.db);
    expect(await api.preview(representedContract)).toMatchObject({ status: "preview", saved: false, metadata: { clientRepresentative: representative, clientSnapshot: { director_name: "", director_post: "" } } });
    expect(fake.rpc).not.toHaveBeenCalled();
    await api.create(requestId, representedContract);
    const saved = fake.rpc.mock.calls[0][1];
    expect(saved.p_input.clientRepresentative).toEqual(representative);
    expect(saved.p_payload.metadata.clientSnapshot).toMatchObject({ director_name: "", director_post: "" });
    expect(saved.p_payload.html_content).toContain("на основании доверенности № TEST");
    expect(withoutDirector.director_name).toBeNull();
    expect(fake.rpc).toHaveBeenCalledOnce(); // Only the document RPC; no client write.
  });
  it.each(["inn", "legal_address"])("still requires client %s when a representative is supplied", async field => {
    const fake = mockDb([{ ...client, [field]: null, director_name: null, director_post: null }, Object.entries(company).map(([key, value]) => ({ key, value }))]);
    await expect(new CrmDocumentsService(fake.db).preview(representedContract)).rejects.toMatchObject({ code: "CLIENT_REQUISITES_MISSING" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("preserves the representative when revising dates and permits an explicit complete replacement", async () => {
    const ctx = { client: { ...client, address: client.legal_address, director_name: "", director_post: "" }, company, assetOrigin: "https://24zxc.ru" };
    const rendered = renderDocument(representedContract, ctx);
    const previous = { source: "api", input: representedContract, snapshot: { metadata: rendered.metadata, contract_id: contractId } };
    const fake = mockDb([previous, previous]);
    const api = new CrmDocumentsService(fake.db);
    await api.revise(requestId, documentId, 1, { date: "2026-10-01" });
    expect(fake.rpc.mock.calls[0][1].p_input.clientRepresentative).toEqual(representative);
    const replacement = { ...representative, basis: "доверенности № NEW от 30.09.2026" };
    await api.revise(requestId, documentId, 1, { clientRepresentative: replacement });
    expect(fake.rpc.mock.calls[1][1].p_payload.metadata.clientRepresentative).toEqual(replacement);
    expect(fake.rpc.mock.calls[1][1].p_payload.html_content).toContain("на основании доверенности № NEW");
    expect(fake.rpc.mock.calls[1][1].p_payload.metadata.clientSnapshot.director_name).toBe("");
    expect(fake.from).toHaveBeenCalledTimes(2); // Saved snapshots, no refresh that changes original parties.
  });
  it("saves email through exact client ID with expected old value and stable request ID", async () => {
    const fake = mockDb([]);
    await new CrmDocumentsService(fake.db).saveClientEmail(requestId, clientId, "client@example.invalid", null);
    expect(fake.rpc).toHaveBeenCalledExactlyOnceWith("crm_save_client_email", {
      p_request_id: requestId, p_client_id: clientId, p_email: "client@example.invalid", p_expected_email: null,
    });
    expect(fake.from).not.toHaveBeenCalled();
  });
  it("keeps preparation and external sending separate and forwards the reviewed recipient", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { state: "prepared" }, error: null });
    const api = new CrmDocumentsService({ functions: { invoke } } as unknown as SupabaseClient);
    const command = { requestId, clientId, documents: [{ documentId, revision: 2 }], subject: "Ваш счёт", body: "Добрый день, направляем счёт." };
    await api.prepareEmail(command);
    expect(invoke).toHaveBeenNthCalledWith(1, "crm-document-email", { body: { action: "prepare", ...command } });
    await api.sendEmail(requestId, "client@example.invalid");
    expect(invoke).toHaveBeenNthCalledWith(2, "crm-document-email", { body: { action: "send", deliveryId: requestId, expectedRecipient: "client@example.invalid" } });
  });
  it("does not turn an HTTP send failure into permission to resend", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: { context: new Response(JSON.stringify({ code: "CRM_RECIPIENT_CHANGED" })) } });
    const api = new CrmDocumentsService({ functions: { invoke } } as unknown as SupabaseClient);
    await expect(api.sendEmail(requestId, "client@example.invalid")).rejects.toMatchObject({ code: "CRM_RECIPIENT_CHANGED" });
    expect(invoke).toHaveBeenCalledOnce();
  });
  it("requests the global number candidate for the validated document date", async () => {
    const fake = mockDb([]);
    const candidate = { number: "043/2026", type: "invoice", date: "2026-09-28", reserved: false };
    fake.rpc.mockResolvedValueOnce({ data: candidate, error: null });
    expect(await new CrmDocumentsService(fake.db).suggestDocumentNumber("invoice", "2026-09-28")).toEqual(candidate);
    expect(fake.rpc).toHaveBeenCalledWith("crm_suggest_document_number", { p_doc_type: "invoice", p_doc_date: "2026-09-28" });
    expect(fake.from).not.toHaveBeenCalled();
  });
  it("rejects an impossible date before querying a number candidate", async () => {
    const fake = mockDb([]);
    await expect(new CrmDocumentsService(fake.db).suggestDocumentNumber("invoice", "2026-02-30")).rejects.toThrow("такой календарной даты");
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("never selects client passwords and escapes wildcard searches", async () => {
    const fake = mockDb([[{ id: clientId, name: "ООО_Тест" }]]);
    const result = await new CrmDocumentsService(fake.db).searchClients("ООО_%", "name", 10);
    expect(CLIENT_FIELDS).not.toMatch(/password|login|notes|\*/);
    expect(fake.calls.find(call => call.method === "ilike")?.args).toEqual(["name", "%ООО\\_\\%%"]);
    expect(result.clients).toHaveLength(1);
  });
  it("returns candidates rather than selecting the first namesake", async () => {
    const fake = mockDb([[{ id: clientId }, { id: documentId }]]);
    expect((await new CrmDocumentsService(fake.db).searchClients("Тест", "name", 10)).clients).toHaveLength(2);
  });
  it("refuses ambiguous legacy contract-to-client name matching", async () => {
    const fake = mockDb([client, [{ id: clientId }, { id: documentId }]]);
    await expect(new CrmDocumentsService(fake.db).listContracts(clientId)).rejects.toMatchObject({ code: "AMBIGUOUS_CLIENT" });
    expect(fake.from).toHaveBeenCalledTimes(2);
  });
  it("labels incomplete legacy document coverage explicitly", async () => {
    const fake = mockDb([client, []]);
    expect(await new CrmDocumentsService(fake.db).listDocuments(clientId)).toMatchObject({ documents: [], legacyDocumentsNotLinked: true });
    expect(fake.calls).toContainEqual({ table: "generated_documents", method: "eq", args: ["client_id", clientId] });
  });
  it("saves a discounted invoice as one transactional request with net total", async () => {
    const fake = mockDb([null, client, Object.entries(company).map(([key, value]) => ({ key, value }))]);
    const result = await new CrmDocumentsService(fake.db).create(requestId, { ...input, discount: { kind: "percent", value: 10 } });
    expect(fake.rpc).toHaveBeenCalledOnce();
    expect(fake.rpc.mock.calls[0][0]).toBe("crm_save_document");
    expect(fake.rpc.mock.calls[0][1]).toMatchObject({ p_request_id: requestId, p_document_id: null, p_payload: { total_amount: 2700, client_id: clientId } });
    expect(result).toMatchObject({ status: "saved", sent: false, artifactStatus: "html_only" });
  });
  it("does not save when company bank details are missing", async () => {
    const fake = mockDb([null, client, []]);
    await expect(new CrmDocumentsService(fake.db).create(requestId, input)).rejects.toMatchObject({ code: "COMPANY_REQUISITES_MISSING" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("saves an act for a configured sole proprietor without inventing a director", async () => {
    const proprietor = { ...company, company_name: "ИП Иванов Иван Иванович", company_short_name: "ИП Иванов И. И.", company_director_name: "", company_director_post: "" };
    const fake = mockDb([null, client, Object.entries(proprietor).map(([key, value]) => ({ key, value })), [{ id: clientId }], { id: contractId, contract_number: "TEST-CONTRACT", contract_date: "2026-01-01", is_archived: false }]);
    const result = await new CrmDocumentsService(fake.db).create(requestId, { ...input, type: "act", contractId });
    expect(result).toMatchObject({ status: "saved", sent: false });
    expect(fake.rpc.mock.calls[0][1].p_payload.metadata.companySnapshot).toMatchObject({ company_name: proprietor.company_name, company_director_name: "Иванов Иван Иванович", company_director_post: "ИП" });
    expect(fake.rpc.mock.calls[0][1].p_payload.metadata.companySourceSnapshot).toEqual(proprietor);
    expect(fake.rpc.mock.calls[0][1].p_payload.html_content).toContain("ИП __________ / Иванов Иван Иванович /");
    expect(proprietor.company_director_name).toBe("");
  });
  it("does not manufacture missing director details for an organization", async () => {
    const incompleteCompany = { ...company, company_name: "ООО Тест", company_director_name: "", company_director_post: "" };
    const fake = mockDb([null, client, Object.entries(incompleteCompany).map(([key, value]) => ({ key, value }))]);
    await expect(new CrmDocumentsService(fake.db).create(requestId, input)).rejects.toMatchObject({ code: "COMPANY_REQUISITES_MISSING" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("saves an invoice-based act with actual client identity and no invented representative or contract", async () => {
    const invoiceClient = { ...client, legal_address: null, director_name: null, director_post: null };
    const invoiceBasis = { source: "sintagma", sourceKind: "subscription_invoice", sourceId: documentId, organizationId: contractId, number: "TEST-INVOICE", date: "2026-09-01", amount: 3000, currency: "RUB", payerName: client.name, payerInn: client.inn };
    const fake = mockDb([null, invoiceClient, Object.entries(company).map(([key, value]) => ({ key, value }))]);
    const result = await new CrmDocumentsService(fake.db).create(requestId, { ...input, type: "act", invoiceBasis });
    expect(result).toMatchObject({ status: "saved", sent: false });
    expect(fake.from).toHaveBeenCalledTimes(3);
    const saved = fake.rpc.mock.calls[0][1];
    expect(saved.p_input.invoiceBasis).toEqual(invoiceBasis);
    expect(saved.p_payload.contract_id).toBe(null);
    expect(saved.p_payload.html_content).toContain("TEST-INVOICE");
    expect(saved.p_payload.html_content).not.toMatch(/на основании Устава|в лице директора|К Договору/);
  });
  it("does not save an invoice-based act while the actual client INN is missing", async () => {
    const invoiceBasis = { source: "sintagma", sourceKind: "subscription_invoice", sourceId: documentId, organizationId: contractId, number: "TEST-INVOICE", date: "2026-09-01", amount: 3000, currency: "RUB", payerName: client.name, payerInn: client.inn };
    const fake = mockDb([null, { ...client, inn: null }, Object.entries(company).map(([key, value]) => ({ key, value }))]);
    await expect(new CrmDocumentsService(fake.db).create(requestId, { ...input, type: "act", invoiceBasis })).rejects.toMatchObject({ code: "CLIENT_REQUISITES_MISSING", message: "В карточке клиента не заполнены: ИНН. Используйте подтверждённые реквизиты клиента." });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("refuses to reinterpret unstructured legacy HTML as a structured source", async () => {
    const fake = mockDb([{ source: "legacy", input: null, snapshot: {} }]);
    await expect(new CrmDocumentsService(fake.db).revise(requestId, documentId, 1, { date: "2026-10-01" })).rejects.toMatchObject({ code: "LEGACY_REQUIRES_ADOPTION" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("date revision preserves issuer/client snapshots and the previous contract link", async () => {
    const rawClient = { name: client.name, inn: client.inn, kpp: "", ogrn: "", address: client.legal_address, director_name: client.director_name, director_post: client.director_post };
    const sourceCompany = { ...company, company_director_name: "", company_director_post: "" };
    const rendered = renderDocument(input, { client: rawClient, company, companySourceSnapshot: sourceCompany, assetOrigin: "https://24zxc.ru" });
    const fake = mockDb([{ source: "api", input, snapshot: { metadata: rendered.metadata, contract_id: contractId } }]);
    await new CrmDocumentsService(fake.db).revise(requestId, documentId, 1, { date: "2026-10-01" });
    expect(fake.from).toHaveBeenCalledTimes(1); // No fresh site_settings can silently replace the issuer.
    const payload = fake.rpc.mock.calls[0][1];
    expect(payload).toMatchObject({ p_document_id: documentId, p_expected_revision: 1, p_payload: { doc_date: "2026-10-01", contract_id: contractId, metadata: { companySnapshot: company } } });
    expect(payload.p_payload.metadata.companySourceSnapshot).toEqual(sourceCompany);
  });
  it("keeps database conflicts explicit but redacts unexpected SQL errors", async () => {
    const fake = mockDb([null, client, Object.entries(company).map(([key, value]) => ({ key, value }))]);
    fake.rpc.mockResolvedValueOnce({ data: null, error: { message: "CRM_DOCUMENT_VERSION_CONFLICT" } });
    await expect(new CrmDocumentsService(fake.db).create(requestId, input)).rejects.toMatchObject({ code: "CRM_DOCUMENT_VERSION_CONFLICT" });
  });
  it("replays a saved command without re-reading changed or deleted client settings", async () => {
    const payload = { doc_number: "TEST/2026", html_content: "<p>Original snapshot</p>" };
    const fake = mockDb([{ request: { input, payload }, result: { documentId, revision: 1 } }]);
    fake.rpc.mockResolvedValueOnce({ data: { documentId, revision: 1, replayed: true }, error: null });
    expect(await new CrmDocumentsService(fake.db).create(requestId, input)).toMatchObject({ replayed: true });
    expect(fake.from).toHaveBeenCalledExactlyOnceWith("crm_document_api_requests");
    expect(fake.rpc.mock.calls[0][1]).toMatchObject({ p_input: input, p_payload: payload });
  });
  it("rejects identity changes even if called outside the MCP schema wrapper", async () => {
    const fake = mockDb([]);
    await expect(new CrmDocumentsService(fake.db).revise(requestId, documentId, 1, { clientId: documentId })).rejects.toMatchObject({ code: "INVALID_CHANGES" });
    expect(fake.from).not.toHaveBeenCalled();
  });
  it("requires an explicit period when revising a contract's stored service deadline", async () => {
    const fake = mockDb([{ source: "api", input: { ...input, type: "contract", deadline: "до 01.10.2026", servicePeriod: { end: "2026-10-01", noDeadline: false } }, snapshot: {} }]);
    await expect(new CrmDocumentsService(fake.db).revise(requestId, documentId, 1, { deadline: "до 01.11.2026" })).rejects.toMatchObject({ code: "SERVICE_PERIOD_REQUIRED" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
});
