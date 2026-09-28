import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CrmRenewalService, RENEWAL_CLIENT_FIELDS, RENEWAL_CONTRACT_FIELDS, RENEWAL_DOCUMENT_FIELDS,
  runRenewalTool, selectRenewalContracts } from "../lib/mcp/renewal-service";

const asOf = "2026-09-29";
function contract(id: string, overrides: Record<string, unknown> = {}) {
  return { id, client_name: "Тестовая организация", contract_number: `TEST-${id}`, contract_date: "2025-10-01",
    contract_type: "ФИС ФРДО", amount: 24000, amount_extra: 3500,
    paid_until: "2026-09-30", service_start: "2025-10-01", service_end: "2026-09-30",
    service_no_deadline: false, is_archived: false, is_one_time: false, ...overrides };
}
const client = { id: "client-1", name: "Тестовая организация", inn: "0000000000", email: "qa@example.invalid" };
function document(overrides: Record<string, unknown> = {}) {
  return { id: "doc-1", doc_type: "contract", doc_number: "TEST-1", doc_date: "2025-10-01",
    contract_id: "c1", client_id: "client-1", client_name: client.name, client_inn: client.inn,
    total_amount: 24000, revision: 1, services: [{ name: "Исходная тестовая услуга", qty: 1, price: 24000 }], ...overrides };
}
function mockDb(results: { data: unknown[] | null; error?: { message: string } }[]) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const db = { from: vi.fn((table: string) => {
    const result = results.shift() ?? { data: [] };
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "in", "order", "range"]) {
      builder[method] = (...args: unknown[]) => { calls.push({ table, method, args }); return builder; };
    }
    builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null, ...result }).then(resolve);
    return builder;
  }), rpc: vi.fn(), functions: { invoke: vi.fn() } };
  return { db: db as unknown as SupabaseClient, calls, from: db.from, rpc: db.rpc, invoke: db.functions.invoke };
}

describe("renewal date selection", () => {
  it("includes calendar boundaries and uses service_end before paid_until", () => {
    const result = selectRenewalContracts([
      contract("today", { service_end: asOf }),
      contract("last", { service_end: "2026-10-29" }),
      contract("outside", { service_end: "2026-10-30" }),
      contract("expired", { service_end: "2026-09-28" }),
      contract("paid_only", { service_end: null, paid_until: "2026-10-02" }),
      contract("service_precedence", { service_end: "2027-01-01", paid_until: asOf }),
    ], { asOf });
    expect(result.eligible.map(item => item.contract.id)).toEqual(["today", "paid_only", "last"]);
    expect(result.eligible[1].expiry).toMatchObject({ source: "paid_until", daysRemaining: 3 });
    expect(result.filter.usedDefaultDaysAhead).toBe(true);
  });
  it("does not fabricate an annual expiry and excludes archived, one-off and indefinite contracts", () => {
    const result = selectRenewalContracts([
      contract("undated", { service_end: null, paid_until: null, contract_date: "2025-09-30" }),
      contract("invalid", { service_end: "2026-02-30", paid_until: asOf }),
      contract("archived", { is_archived: true }), contract("once", { is_one_time: true }),
      contract("forever", { service_no_deadline: true }),
      contract("unrelated", { contract_type: "Разработка сайта" }),
    ], { asOf });
    expect(result.eligible).toEqual([]);
    expect(result.withoutUsableTerm.map(item => item.id)).toEqual(["undated", "invalid"]);
  });
  it("uses an explicit past window and leap-day calendar arithmetic", () => {
    const result = selectRenewalContracts([
      contract("leap", { service_end: "2028-02-29" }), contract("past", { service_end: "2028-02-27" }),
      contract("older", { service_end: "2028-02-26" }),
    ], { asOf: "2028-02-28", daysAhead: 1, expiredDaysBack: 1 });
    expect(result.eligible.map(item => [item.contract.id, item.expiry.daysRemaining])).toEqual([["past", -1], ["leap", 1]]);
  });
});

describe("read-only renewal options", () => {
  it("returns sourced prices/conditions, missing new terms and explicit review before sending", async () => {
    const fake = mockDb([{ data: [contract("c1")] }, { data: [client] }, { data: [document()] }]);
    const result = await new CrmRenewalService(fake.db).listRenewalCandidates({ asOf });
    expect(result).toMatchObject({ status: "options_for_review", saved: false, sent: false,
      window: { from: asOf, through: "2026-10-29", daysAhead: 30, usedDefaultDaysAhead: true }, totalCandidates: 1, hasMore: false });
    expect(result.candidates[0]).toMatchObject({
      contractId: "c1", previousAmounts: { amount: 24000, amountExtra: 3500, newPriceConfirmed: false },
      client: { email: client.email }, clientLink: { clientId: client.id, status: "unique_exact_name" },
      review: { newPeriod: null, newPrice: null, structuredServicesMissing: false },
      sourceDocuments: [{ documentId: "doc-1", clientLinkVerified: true, services: document().services }],
    });
    expect(result.nextStep).toContain("спросите, отправлять ли");
    expect(fake.rpc).not.toHaveBeenCalled();
    expect(fake.invoke).not.toHaveBeenCalled();
    for (const fields of [RENEWAL_CLIENT_FIELDS, RENEWAL_CONTRACT_FIELDS, RENEWAL_DOCUMENT_FIELDS]) {
      expect(fields).not.toMatch(/\*|password|login|notes|html|metadata/);
    }
  });
  it("does not choose a namesake or claim an unlinked legacy document belongs to that client", async () => {
    const fake = mockDb([{ data: [contract("c1")] },
      { data: [client, { ...client, id: "client-2", inn: "1111111111", email: "other@example.invalid" }] },
      { data: [document({ client_id: null })] }]);
    const candidate = (await new CrmRenewalService(fake.db).listRenewalCandidates({ asOf })).candidates[0];
    expect(candidate.client).toBeNull();
    expect(candidate.clientLink).toMatchObject({ status: "ambiguous_name", clientId: null });
    expect(candidate.clientChoices).toHaveLength(2);
    expect(candidate.clientChoices[0]).not.toHaveProperty("email");
    expect(candidate.sourceDocuments[0].clientLinkVerified).toBe(false);
    expect(candidate.review).toMatchObject({ clientSelectionNeeded: true, emailMissing: true, structuredServicesMissing: true });
  });
  it("reports missing client/email and rejects malformed legacy service lines as structured input", async () => {
    const fake = mockDb([{ data: [contract("c1")] }, { data: [] },
      { data: [document({ services: [{ name: "Price unknown", qty: 1, price: "24000" }] })] }]);
    const candidate = (await new CrmRenewalService(fake.db).listRenewalCandidates({ asOf })).candidates[0];
    expect(candidate.clientLink.status).toBe("not_found");
    expect(candidate.review).toMatchObject({ clientSelectionNeeded: true, emailMissing: true, structuredServicesMissing: true });
    expect(candidate.sourceDocuments[0].services).toBeNull();
  });
  it("flags a possible already-issued renewal without asserting or recreating it", async () => {
    const fake = mockDb([{ data: [contract("c1"), contract("new", { contract_date: "2026-10-01",
      service_start: "2026-10-01", service_end: "2027-09-30" })] }, { data: [client] }, { data: [] }]);
    const candidate = (await new CrmRenewalService(fake.db).listRenewalCandidates({ asOf })).candidates[0];
    expect(candidate.possibleNewerContracts).toMatchObject([{ contractId: "new" }]);
    expect(candidate.review.possibleExistingRenewal).toBe(true);
  });
  it("paginates candidate options after filtering and only loads those client names and contract documents", async () => {
    const fake = mockDb([{ data: [contract("a"), contract("b", { client_name: "Second" }), contract("c")] },
      { data: [] }, { data: [] }]);
    const result = await new CrmRenewalService(fake.db).listRenewalCandidates({ asOf, offset: 1, limit: 1, daysAhead: 2 });
    expect(result).toMatchObject({ totalCandidates: 3, offset: 1, limit: 1, hasMore: true, window: { usedDefaultDaysAhead: false } });
    expect(result.candidates.map(item => item.contractId)).toEqual(["b"]);
    expect(fake.calls).toContainEqual({ table: "clients", method: "in", args: ["name", ["Second"]] });
    expect(fake.calls).toContainEqual({ table: "generated_documents", method: "in", args: ["contract_id", ["b"]] });
  });
  it("reads past a full database page so an eligible contract is not silently hidden", async () => {
    const firstPage = Array.from({ length: 500 }, (_, index) => contract(`old-${index}`, { service_end: "2020-01-01" }));
    const fake = mockDb([{ data: firstPage }, { data: [contract("c1")] }, { data: [client] }, { data: [] }]);
    const result = await new CrmRenewalService(fake.db).listRenewalCandidates({ asOf });
    expect(result.candidates.map(item => item.contractId)).toEqual(["c1"]);
    expect(fake.calls).toContainEqual({ table: "contracts", method: "range", args: [500, 999] });
  });
  it("reports undated coverage and skips unrelated reads when the window has no options", async () => {
    const fake = mockDb([{ data: [contract("missing", { service_end: null, paid_until: null })] }]);
    const result = await new CrmRenewalService(fake.db).listRenewalCandidates({ asOf });
    expect(result).toMatchObject({ totalCandidates: 0, candidates: [], recordsWithoutUsableTerm: { count: 1 } });
    expect(fake.from).toHaveBeenCalledExactlyOnceWith("contracts");
  });
  it.each([{ asOf: "2026-02-30" }, { asOf, daysAhead: -1 }, { asOf, daysAhead: 1.5 },
    { asOf, expiredDaysBack: 400 }, { asOf, limit: 101 }, { asOf, offset: -1 }])("rejects invalid input without querying: %j", async input => {
    const fake = mockDb([]);
    await expect(new CrmRenewalService(fake.db).listRenewalCandidates(input)).rejects.toMatchObject({ code: "INVALID_RENEWAL_SEARCH" });
    expect(fake.from).not.toHaveBeenCalled();
  });
  it("redacts database errors instead of exposing SQL or credentials", async () => {
    const fake = mockDb([{ data: null, error: { message: "raw SQL password=private" } }]);
    await expect(new CrmRenewalService(fake.db).listRenewalCandidates({ asOf })).rejects.toMatchObject({ code: "DATABASE_ERROR" });
  });
  it("requires an authenticated CRM connection before querying", async () => {
    const result = await runRenewalTool({ isAuthenticated: () => false } as never, { asOf });
    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).toContain("UNAUTHORIZED");
  });
});
