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
    expect(crmTools.map(tool => tool.name)).toHaveLength(12);
    expect(crmTools.some(tool => /import/.test(tool.name))).toBe(false);
    for (const tool of crmTools) expect(tool.annotations?.readOnlyHint).toBe(!/create|revise|save_client|prepare_document_email|send_document_email/.test(tool.name));
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
  it("refuses to reinterpret unstructured legacy HTML as a structured source", async () => {
    const fake = mockDb([{ source: "legacy", input: null, snapshot: {} }]);
    await expect(new CrmDocumentsService(fake.db).revise(requestId, documentId, 1, { date: "2026-10-01" })).rejects.toMatchObject({ code: "LEGACY_REQUIRES_ADOPTION" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("date revision preserves issuer/client snapshots and the previous contract link", async () => {
    const rawClient = { name: client.name, inn: client.inn, kpp: "", ogrn: "", address: client.legal_address, director_name: client.director_name, director_post: client.director_post };
    const rendered = renderDocument(input, { client: rawClient, company, assetOrigin: "https://24zxc.ru" });
    const fake = mockDb([{ source: "api", input, snapshot: { metadata: rendered.metadata, contract_id: contractId } }]);
    await new CrmDocumentsService(fake.db).revise(requestId, documentId, 1, { date: "2026-10-01" });
    expect(fake.from).toHaveBeenCalledTimes(1); // No fresh site_settings can silently replace the issuer.
    const payload = fake.rpc.mock.calls[0][1];
    expect(payload).toMatchObject({ p_document_id: documentId, p_expected_revision: 1, p_payload: { doc_date: "2026-10-01", contract_id: contractId, metadata: { companySnapshot: company } } });
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
