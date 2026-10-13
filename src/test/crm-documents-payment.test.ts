import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { crmTools } from "../lib/mcp";
import { CrmPaymentService, runPaymentTool, validatePaymentChange, type PaymentSnapshot, type SetPaymentStatusInput } from "../lib/mcp/payment-service";

vi.mock("@supabase/supabase-js", async importOriginal => ({
  ...await importOriginal<typeof import("@supabase/supabase-js")>(), createClient: vi.fn(),
}));

const clientId = "11111111-1111-4111-8111-111111111111";
const contractId = "22222222-2222-4222-8222-222222222222";
const invoiceId = "33333333-3333-4333-8333-333333333333";
const requestId = "44444444-4444-4444-8444-444444444444";
const target = { clientId, contractId, invoiceId };
const input: SetPaymentStatusInput = { ...target, requestId, expectedRevision: 0,
  expectedSourceRevision: "discounted-invoice-source-revision", status: "partial", paidAmount: 5500.55 };

function payment(changes: Partial<PaymentSnapshot> = {}): PaymentSnapshot {
  return { ...target, targetId: invoiceId, scope: "invoice", amountDue: 10000, paidAmount: 5500.55,
    remainingAmount: 4499.45, paymentStatus: "partial", paymentRevision: 1, sourceRevision: input.expectedSourceRevision,
    paidOn: null, confirmationSource: "user_report", reason: null, amountKnown: true,
    linkedInvoices: [], history: [{ requestId, paymentRevision: 1, paidAmount: 5500.55 }], ...changes };
}

function mockDb(responses: unknown[]) {
  const db = { rpc: vi.fn().mockImplementation(async () => responses.shift()), from: vi.fn(), functions: { invoke: vi.fn() } };
  return { db: db as unknown as SupabaseClient, ...db };
}
function success(data: unknown) { return { data, error: null }; }

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("CRM payment command validation", () => {
  it("keeps cumulative kopecks and never invents an unknown payment date or bank evidence", () => {
    expect(validatePaymentChange(input)).toEqual({ ...input, paidOn: null, confirmationSource: "user_report", reason: null });
    expect(validatePaymentChange({ ...input, status: "paid", paidAmount: undefined })).toMatchObject({ paidAmount: null, paidOn: null });
    expect(validatePaymentChange({ ...input, status: "unpaid", paidAmount: undefined })).toMatchObject({ paidAmount: null });
  });
  it.each([
    { clientId: "a-name" }, { invoiceId: "number-123" }, { contractId: null, invoiceId: null },
    { requestId: "repeat-name" }, { expectedRevision: -1 }, { expectedRevision: 0.5 },
    { expectedRevision: Number.MAX_SAFE_INTEGER + 1 }, { expectedSourceRevision: "" },
    { status: "confirmed" }, { paidAmount: -1 }, { paidAmount: 1.001 }, { paidAmount: NaN },
    { paidAmount: Infinity }, { paidAmount: "5500" }, { paidAmount: null }, { paidAmount: 0 },
    { status: "unpaid", paidAmount: 1 }, { paidOn: "2026-02-30" }, { paidOn: "today" },
    { paidOn: "2026-10-13T00:00:00Z" }, { confirmationSource: "bank_verified" },
    { confirmationSource: "bank_document", reason: " " }, { reason: "x".repeat(2001) }, { reason: "secret\u0000text" },
  ])("rejects invalid command %j before any database write", async changes => {
    const mock = mockDb([]);
    await expect(new CrmPaymentService(mock.db).setPaymentStatus({ ...input, ...changes } as SetPaymentStatusInput)).rejects.toThrow();
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it("distinguishes a provided bank document from online bank verification", () => {
    expect(validatePaymentChange({ ...input, confirmationSource: "bank_document", reason: " Платёжное поручение №45 от 12.10.2026 ", paidOn: "2026-10-12" }))
      .toMatchObject({ confirmationSource: "bank_document", reason: "Платёжное поручение №45 от 12.10.2026", paidOn: "2026-10-12" });
  });
});

describe("payment persistence and verification", () => {
  it("reads an exact client/contract/invoice without reading private client fields", async () => {
    const mock = mockDb([success(payment())]);
    const result = await new CrmPaymentService(mock.db).getPaymentStatus(target);
    expect(mock.rpc).toHaveBeenCalledExactlyOnceWith("crm_get_payment_status", {
      p_client_id: clientId, p_contract_id: contractId, p_invoice_id: invoiceId,
    });
    expect(result).toMatchObject({ payment: { amountDue: 10000, paidAmount: 5500.55, remainingAmount: 4499.45 }, bankVerified: false, sent: false });
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("preserves unknown legacy receipts and the need to choose a specific invoice", async () => {
    const unknown = payment({ invoiceId: null, targetId: contractId, scope: "contract", paymentStatus: null,
      paidAmount: null, remainingAmount: null, amountKnown: false, paymentRevision: 0,
      legacyStatus: "Оплачен", requiresInvoiceSelection: true, linkedInvoices: [{ invoiceId }, { invoiceId: requestId }] });
    const result = await new CrmPaymentService(mockDb([success(unknown)]).db).getPaymentStatus({ clientId, contractId });
    expect(result.payment).toMatchObject({ paymentStatus: null, paidAmount: null, remainingAmount: null,
      legacyStatus: "Оплачен", requiresInvoiceSelection: true });
  });
  it("sends cumulative amount once through the atomic RPC then verifies the persisted discounted balance", async () => {
    const saved = payment();
    const mock = mockDb([success({ saved: true, replayed: false, payment: saved }), success(saved)]);
    const result = await new CrmPaymentService(mock.db).setPaymentStatus(input);
    expect(mock.rpc.mock.calls).toEqual([
      ["crm_set_payment_status", { p_request_id: requestId, p_client_id: clientId, p_contract_id: contractId,
        p_invoice_id: invoiceId, p_expected_revision: 0, p_expected_source_revision: input.expectedSourceRevision,
        p_status: "partial", p_paid_amount: 5500.55, p_paid_on: null, p_confirmation_source: "user_report", p_reason: null }],
      ["crm_get_payment_status", { p_client_id: clientId, p_contract_id: contractId, p_invoice_id: invoiceId }],
    ]);
    expect(result).toMatchObject({ saved: true, verified: true, replayed: false, requestId,
      payment: { paidAmount: 5500.55, remainingAmount: 4499.45 }, bankVerified: false, sent: false });
    expect(mock.from).not.toHaveBeenCalled();
    expect(mock.functions.invoke).not.toHaveBeenCalled();
  });
  it("returns a verified replay without turning the same request into another receipt", async () => {
    const saved = payment();
    const mock = mockDb([success({ saved: true, replayed: true, payment: saved }), success(saved)]);
    expect(await new CrmPaymentService(mock.db).setPaymentStatus(input)).toMatchObject({ replayed: true, verified: true });
    expect(mock.rpc.mock.calls.filter(([name]) => name === "crm_set_payment_status")).toHaveLength(1);
    expect(mock.rpc.mock.calls[0][1]).toMatchObject({ p_request_id: requestId, p_paid_amount: 5500.55 });
  });
  it("lets SQL derive full payment from the saved discounted amount without changing document data", async () => {
    const full = payment({ paymentStatus: "paid", paidAmount: 10000, remainingAmount: 0 });
    const mock = mockDb([success({ saved: true, replayed: false, payment: full }), success(full)]);
    const result = await new CrmPaymentService(mock.db).setPaymentStatus({ ...input, status: "paid", paidAmount: undefined });
    expect(mock.rpc.mock.calls[0][1]).toMatchObject({ p_status: "paid", p_paid_amount: null, p_paid_on: null });
    expect(Object.keys(mock.rpc.mock.calls[0][1]).join(" ")).not.toMatch(/html|signature|service_period|paid_until|document_date|discount/);
    expect(result.payment).toMatchObject({ paidAmount: 10000, remainingAmount: 0 });
  });
  it("does not call a successful write verified when the required read fails", async () => {
    const mock = mockDb([success({ saved: true, replayed: false, payment: payment() }),
      { data: null, error: { message: "SQL password=private" } }]);
    await expect(new CrmPaymentService(mock.db).setPaymentStatus(input)).rejects.toMatchObject({ code: "CRM_PAYMENT_VERIFICATION_FAILED" });
    expect(mock.rpc).toHaveBeenCalledTimes(2);
  });
  it.each([
    { paymentRevision: 2 }, { paidAmount: 6000, remainingAmount: 4000 }, { sourceRevision: "new-source" },
    { paidOn: "2026-10-13" }, { confirmationSource: "bank_document", reason: "new evidence" },
  ] as Partial<PaymentSnapshot>[])("does not conceal a concurrent change after saving or replay: %j", async changes => {
    const mock = mockDb([success({ saved: true, replayed: true, payment: payment() }), success(payment(changes))]);
    await expect(new CrmPaymentService(mock.db).setPaymentStatus(input)).rejects.toMatchObject({ code: "CRM_PAYMENT_VERIFICATION_CONFLICT" });
    expect(mock.rpc).toHaveBeenCalledTimes(2);
  });
  it.each([null, {}, { saved: false, replayed: false, payment: payment() },
    { saved: true, replayed: false, payment: payment({ clientId: requestId }) },
    { saved: true, replayed: false, payment: payment({ invoiceId: requestId }) },
    { saved: true, replayed: false, payment: payment({ paidAmount: undefined }) },
    { saved: true, replayed: false, payment: payment({ amountDue: NaN }) },
  ])("does not claim success from a malformed or mismatched SQL result: %j", async data => {
    const mock = mockDb([success(data)]);
    await expect(new CrmPaymentService(mock.db).setPaymentStatus(input)).rejects.toMatchObject({ code: "CRM_PAYMENT_VERIFICATION_FAILED" });
  });
  it.each(["CRM_PAYMENT_REVISION_CONFLICT", "CRM_PAYMENT_SOURCE_CONFLICT", "CRM_PAYMENT_INVOICE_REQUIRED", "CRM_REQUEST_ID_CONFLICT"])(
    "sanitizes %s and never retries with a new revision/request", async code => {
      const mock = mockDb([{ data: null, error: { message: `SQL credentials private: ${code}` } }]);
      try { await new CrmPaymentService(mock.db).setPaymentStatus(input); }
      catch (error) {
        expect(error).toMatchObject({ code });
        expect((error as Error).message).not.toMatch(/SQL|credentials|private/);
        expect(mock.rpc).toHaveBeenCalledTimes(1);
        return;
      }
      throw new Error("Expected a sanitized conflict");
    });
  it("does not expose an arbitrary database message or a secret embedded in a made-up error code", async () => {
    const mock = mockDb([{ data: null, error: { message: "SQL CRM_PRIVATE_PASSWORD_IS_SECRET" } }]);
    await expect(new CrmPaymentService(mock.db).getPaymentStatus(target)).rejects.toMatchObject({ code: "CRM_PAYMENT_DATABASE_ERROR" });
  });
});

describe("ChatGPT payment authorization boundary", () => {
  const context = { isAuthenticated: () => true, getUserId: () => clientId, getToken: () => "verified-user-jwt" } as ToolContext;
  function configure(db: SupabaseClient) {
    vi.stubEnv("SUPABASE_URL", "https://unit-test.supabase.invalid");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "publishable-test-key");
    vi.mocked(createClient).mockReturnValue(db as unknown as ReturnType<typeof createClient>);
  }
  it("does not execute payment logic for an unauthenticated caller", async () => {
    const action = vi.fn();
    const result = await runPaymentTool({ isAuthenticated: () => false } as ToolContext, action);
    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).toContain("UNAUTHORIZED");
    expect(action).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });
  it("checks the caller's admin role and blocks a non-admin before the payment action", async () => {
    const mock = mockDb([success(false)]); configure(mock.db);
    const action = vi.fn();
    const result = await runPaymentTool(context, action);
    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).toContain("FORBIDDEN");
    expect(mock.rpc).toHaveBeenCalledExactlyOnceWith("has_role", { _user_id: clientId, _role: "admin" });
    expect(action).not.toHaveBeenCalled();
  });
  it("uses the caller JWT and public key, then returns the verified saved result through MCP", async () => {
    const saved = payment();
    const mock = mockDb([success(true), success({ saved: true, replayed: false, payment: saved }), success(saved)]); configure(mock.db);
    const result = await runPaymentTool(context, api => api.setPaymentStatus(input));
    expect(createClient).toHaveBeenCalledWith("https://unit-test.supabase.invalid", "publishable-test-key", {
      global: { headers: { Authorization: "Bearer verified-user-jwt" } }, auth: { persistSession: false, autoRefreshToken: false },
    });
    expect(result).toMatchObject({ structuredContent: { saved: true, verified: true, bankVerified: false } });
    expect(JSON.parse(result.content[0].text)).toMatchObject({ payment: { paidAmount: 5500.55 }, sent: false });
  });
  it("redacts unexpected transport exceptions", async () => {
    const mock = mockDb([success(true)]); configure(mock.db);
    const result = await runPaymentTool(context, async () => { throw new Error("raw SQL secret token"); });
    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).not.toMatch(/raw SQL|secret token/);
  });
  it("advertises real payment tools, explicit exact-selection and cumulative/retry semantics", () => {
    const read = crmTools.find(tool => tool.name === "crm_get_payment_status")!;
    const write = crmTools.find(tool => tool.name === "crm_set_payment_status")!;
    expect(read.annotations).toMatchObject({ readOnlyHint: true });
    expect(write.annotations).toMatchObject({ readOnlyHint: false, idempotentHint: true, openWorldHint: false });
    expect(read.description).toContain("нескольких договорах");
    for (const required of ["expectedSourceRevision", "НЕ новое поступление", "тот же requestId", "user_report", "bank_document", "null", "HTML/PDF", "paid_until"]) {
      expect(write.description).toContain(required);
    }
  });
});
