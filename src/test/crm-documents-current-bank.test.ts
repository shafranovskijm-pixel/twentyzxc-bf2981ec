import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CrmDocumentsService } from "../lib/mcp/service";
import { renderDocument } from "../../supabase/functions/_shared/crm-documents/render";
import { assertCurrentBankText, type CurrentBankPolicy } from "../../supabase/functions/_shared/current-bank-requisites";
import { signatureFixture } from "./fixtures/custom-contract-signatures";

// Synthetic bank details, never used to save or send a real document.
const oldAccount = "40900000000000000001";
const policy: CurrentBankPolicy = { issuer_inn: "000000000001", company_bank_account: "40800000000000000002",
  company_bank_bik: "000000002", company_bank_corr: "30100000000000000003", company_bank_name: "ООО «Тестовый банк»",
  revision: 2, retired_accounts: [oldAccount] };
const company = { ...signatureFixture.company, company_inn: policy.issuer_inn,
  company_bank_account: policy.company_bank_account, company_bank_bik: policy.company_bank_bik,
  company_bank_corr: policy.company_bank_corr, company_bank_name: policy.company_bank_name };
const client = { ...signatureFixture.client, inn: "0000000000" };
const input = { type: "invoice" as const, clientId: "11111111-1111-4111-8111-111111111111", date: "2026-10-12",
  number: "TEST-BANK", services: [{ name: "Тестовая услуга", price: 3000, qty: 1 }] };
const context = { company, client, bankPolicy: policy, assetOrigin: "https://24zxc.ru" };

describe("confirmed issuer payment details", () => {
  it("uses the full pinned tuple in the invoice and records the policy version", () => {
    const rendered = renderDocument(input, context);
    expect(rendered.html).toContain(policy.company_bank_account);
    expect(rendered.html).not.toContain(oldAccount);
    expect(rendered.metadata.companyBankPolicyRevision).toBe(2);
  });
  it.each([
    { company_bank_account: oldAccount },
    { company_bank_bik: "000000001" },
    { company_bank_corr: "30100000000000000001" },
    { company_bank_name: "Другой банк" },
  ])("rejects a stale or mixed issuer tuple before generating a document: %s", change => {
    expect(() => renderDocument(input, { ...context, company: { ...company, ...change } })).toThrow();
  });
  it("detects the retired account with spaces, table tags and numeric entities", () => {
    for (const text of ["40900 000 0 0000 0000001", "<td>4090000000</td><td>0000000001</td>", "&#52;0900000000000000001"]) {
      expect(() => assertCurrentBankText(text, policy)).toThrow("старый расчётный счёт");
    }
  });
  it("rejects an old account pasted into the body of a custom template", () => {
    expect(() => renderDocument({ ...input, type: "contract", template: "custom", subject: "Тест", deadline: "30 дней",
      paymentTerms: "100%", customContract: { title: "Тестовый договор", body: `Оплатить на р/с ${oldAccount}` } }, context)).toThrow("старый расчётный счёт");
  });
  it("updates only bank fields in a new revision; the original snapshot is unchanged", async () => {
    const originalCompany = { ...company, company_bank_account: oldAccount, company_bank_name: "Прежний банк" };
    const original = renderDocument(input, { ...context, company: originalCompany, bankPolicy: null });
    const previous = { source: "api", input, snapshot: { metadata: original.metadata, contract_id: null } };
    const originalJson = JSON.stringify(previous);
    const rpc = vi.fn(async (name: string, _args?: unknown) => ({ data: name === "crm_get_company_bank_policy" ? policy : { documentId: "saved", revision: 2 }, error: null }));
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "maybeSingle"]) builder[method] = () => builder;
    builder.then = (resolve: (result: unknown) => unknown) => Promise.resolve({ data: previous, error: null }).then(resolve);
    const db = { from: () => builder, rpc } as unknown as SupabaseClient;
    await new CrmDocumentsService(db).revise("22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333", 1, { date: input.date });
    const payload = rpc.mock.calls.find(([name]) => name === "crm_save_document")?.[1] as { p_payload: { html_content: string; metadata: Record<string, unknown> } };
    expect(payload.p_payload.html_content).toContain(policy.company_bank_account);
    expect(payload.p_payload.html_content).not.toContain(oldAccount);
    expect(payload.p_payload.metadata.companySnapshot).toEqual(company);
    expect(payload.p_payload.metadata.companyBankPolicyRevision).toBe(2);
    expect(JSON.stringify(previous)).toBe(originalJson);
  });
  it("does not replace a different issuer's bank details", () => {
    const other = { ...company, company_inn: "000000000004", company_bank_account: "40700000000000000005" };
    const rendered = renderDocument(input, { ...context, company: other });
    expect(rendered.html).toContain(other.company_bank_account);
    expect(rendered.metadata.companyBankPolicyRevision).toBeUndefined();
  });
  it("replays a successful custom revision after account rotation without rerendering the obsolete body", async () => {
    const custom = { ...input, type: "contract" as const, template: "custom" as const, subject: "Тест", deadline: "30 дней",
      paymentTerms: "100%", customContract: { title: "Тестовый договор", body: `Оплатить на р/с ${oldAccount}` } };
    const oldCompany = { ...company, company_bank_account: oldAccount };
    const rendered = renderDocument(custom, { ...context, company: oldCompany, bankPolicy: null });
    const previous = { source: "api", input: custom, snapshot: { metadata: rendered.metadata, contract_id: null } };
    const savedPayload = { html_content: rendered.html, metadata: rendered.metadata };
    const from = (table: string) => {
      const builder: Record<string, unknown> = {};
      for (const method of ["select", "eq", "maybeSingle"]) builder[method] = () => builder;
      builder.then = (resolve: (result: unknown) => unknown) => Promise.resolve({ data: table === "crm_document_revisions" ? previous
        : { request: { input: custom, payload: savedPayload }, result: { documentId: "saved", revision: 2 } }, error: null }).then(resolve);
      return builder;
    };
    const rpc = vi.fn(async (_name: string, _args?: unknown) => ({ data: { documentId: "saved", revision: 2, replayed: true }, error: null }));
    const result = await new CrmDocumentsService({ from, rpc } as unknown as SupabaseClient).revise(
      "22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333", 1, { date: custom.date });
    expect(result).toMatchObject({ replayed: true, sent: false });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("crm_save_document", expect.objectContaining({ p_payload: savedPayload }));
  });
});
