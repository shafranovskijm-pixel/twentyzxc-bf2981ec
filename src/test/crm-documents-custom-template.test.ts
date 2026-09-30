import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CrmDocumentsService } from "../lib/mcp/service";
import { CrmServiceTemplatesService } from "../lib/mcp/service-templates-service";
import { getCustomContractTokens } from "../lib/custom-contract-template";
import { renderDocument } from "../../supabase/functions/_shared/crm-documents/render";

const clientId = "11111111-1111-4111-8111-111111111111";
const templateId = "22222222-2222-4222-8222-222222222222";
const requestId = "33333333-3333-4333-8333-333333333333";
const documentId = "44444444-4444-4444-8444-444444444444";
const content = { title: "Договор {{contract.number}}", body: "# Предмет\nЗаказчик: {{client.name}}. {{custom.scope}}\n\n{{services.table}}\n\nСтоимость {{total.amount}} ₽." };
const source = { type: "contract" as const, clientId, date: "2026-09-30", number: "TEST-CUSTOM/2026", template: "custom" as const,
  services: [{ name: "Тестовая услуга", qty: 1, price: 1200 }], subject: "Тестовая услуга", deadline: "30 дней", paymentTerms: "100% предоплата",
  serviceTemplate: { id: templateId, revision: 1 }, templateVariables: { scope: "<script>alert(1)</script>" } };
const client = { id: clientId, name: "Тестовый заказчик", inn: "0000000000", kpp: "", ogrn: "", legal_address: "Тестовый адрес", director_name: "Тестовый директор", director_post: "Директор" };
const company = { company_name: "Тестовый исполнитель", company_short_name: "Тест", company_inn: "000000000000", company_kpp: "", company_ogrn: "",
  company_legal_address: "Тестовый адрес", company_actual_address: "", company_bank_account: "00000000000000000000", company_bank_bik: "000000000",
  company_bank_corr: "00000000000000000000", company_bank_name: "Тестовый банк", company_director_name: "Тестовый исполнитель", company_director_post: "Директор", company_phone: "", company_email: "" };
function dbWithRows(rows: unknown[]) {
  const rpc = vi.fn().mockResolvedValue({ data: { documentId, revision: 1, replayed: false }, error: null });
  const from = vi.fn((_table: string) => {
    const value = rows.shift();
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "in", "maybeSingle", "order", "limit"]) builder[method] = () => builder;
    builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: value, error: null }).then(resolve);
    return builder;
  });
  return { db: { from, rpc } as unknown as SupabaseClient, rpc, from };
}
const settings = Object.entries(company).map(([key, value]) => ({ key, value }));

describe("custom service contracts", () => {
  it("inspects known placeholders before saving a reusable template", () => {
    expect(getCustomContractTokens(content).requiredCustomVariables).toEqual(["scope"]);
    expect(() => getCustomContractTokens({ ...content, body: "{{unknown.field}}" })).toThrow("неизвестная переменная");
    expect(() => getCustomContractTokens({ ...content, body: "{{services.table}} extra" })).toThrow("отдельную строку");
  });
  it("saves template versions through one RPC and never puts client values in them", async () => {
    const fake = dbWithRows([]);
    await new CrmServiceTemplatesService(fake.db).save({ requestId, name: "Тестовая услуга", description: "", content, isArchived: false });
    expect(fake.rpc).toHaveBeenCalledWith("crm_save_service_template", expect.objectContaining({
      p_template_id: null, p_expected_revision: null, p_content: content,
    }));
    expect(JSON.stringify(fake.rpc.mock.calls[0][1])).not.toContain("<script>");
  });
  it("materializes a pinned version, escapes variable values, and saves only through the CRM document RPC", async () => {
    const fake = dbWithRows([null, { id: templateId, is_archived: false }, { content }, client, settings]);
    const result = await new CrmDocumentsService(fake.db).create(requestId, source);
    const command = fake.rpc.mock.calls[0][1];
    expect(result).toMatchObject({ status: "saved", sent: false });
    expect(command.p_input.serviceTemplate).toEqual(source.serviceTemplate);
    expect(command.p_input.customContract).toEqual({ ...content, variables: source.templateVariables });
    expect(command.p_input.templateVariables).toBeUndefined();
    expect(command.p_payload.metadata.contractSubType).toBe("custom");
    expect(command.p_payload.html_content).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(command.p_payload.html_content).not.toContain("<script>");
    expect(command.p_payload.html_content).toContain("Тестовый заказчик");
    expect(fake.rpc).toHaveBeenCalledOnce();
  });
  it("rejects a missing variable or an archived template before saving", async () => {
    const missing = dbWithRows([{ id: templateId, is_archived: false }, { content }, client, settings]);
    await expect(new CrmDocumentsService(missing.db).preview({ ...source, templateVariables: {} })).rejects.toThrow("custom.scope");
    expect(missing.rpc).not.toHaveBeenCalled();
    const archived = dbWithRows([{ id: templateId, is_archived: true }]);
    await expect(new CrmDocumentsService(archived.db).preview(source)).rejects.toMatchObject({ code: "CRM_SERVICE_TEMPLATE_ARCHIVED" });
    expect(archived.rpc).not.toHaveBeenCalled();
  });
  it("replays a saved command without rereading a changed template and rejects changed variables", async () => {
    const resolved = { ...source, customContract: { ...content, variables: source.templateVariables } } as Record<string, unknown>;
    delete resolved.templateVariables;
    const payload = { metadata: { documentInput: resolved }, html_content: "saved" };
    const previous = { request: { input: resolved, payload }, result: { documentId, revision: 1 } };
    const same = dbWithRows([previous]);
    same.rpc.mockResolvedValueOnce({ data: { documentId, revision: 1, replayed: true }, error: null });
    expect(await new CrmDocumentsService(same.db).create(requestId, source)).toMatchObject({ replayed: true });
    expect(same.from).toHaveBeenCalledTimes(1);
    const different = dbWithRows([previous]);
    await expect(new CrmDocumentsService(different.db).create(requestId, { ...source, templateVariables: { scope: "changed" } })).rejects.toMatchObject({ code: "CRM_REQUEST_ID_CONFLICT" });
    expect(different.rpc).not.toHaveBeenCalled();
  });
  it("revises only the document copy and clears its link to the shared template", async () => {
    const resolved = { ...source, customContract: { ...content, variables: source.templateVariables } } as Record<string, unknown>;
    delete resolved.templateVariables;
    const snapshot = renderDocument(resolved as never, { client: { ...client, address: client.legal_address }, company, assetOrigin: "https://24zxc.ru" });
    const fake = dbWithRows([{ source: "api", input: resolved, snapshot: { metadata: snapshot.metadata, contract_id: templateId } }]);
    await new CrmDocumentsService(fake.db).revise(requestId, documentId, 1, { customContract: { title: content.title, body: "Новый согласованный текст", variables: {} } });
    expect(fake.rpc.mock.calls[0][1].p_input.serviceTemplate).toBeUndefined();
    expect(fake.rpc.mock.calls[0][1].p_input.customContract.body).toBe("Новый согласованный текст");
    expect(fake.rpc.mock.calls[0][0]).toBe("crm_save_document");
  });
});
