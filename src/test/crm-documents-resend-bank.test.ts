import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  documents: {} as Record<string, Record<string, unknown> | undefined>,
  storedFile: null as { file_path: string; file_name: string } | null,
  invoke: vi.fn(), download: vi.fn(), generate: vi.fn(), base64: vi.fn(), from: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: state.from, functions: { invoke: state.invoke }, storage: { from: () => ({ download: state.download }) },
} }));
vi.mock("../lib/document-pdf", () => ({ generatePdfBlob: state.generate, blobToBase64: state.base64 }));
import { resendContractEmail } from "../lib/resend-contract";

const options = { contractId: "TEST-ID", contractNumber: "TEST/26", clientName: "TEST CLIENT", email: "test@example.invalid", includeInvoice: true };
const document = (kind: string) => ({ id: `TEST-${kind}`, doc_type: kind, doc_number: `TEST-${kind}/26`, doc_date: "2026-10-12", html_content: `CURRENT ${kind} HTML`, client_name: options.clientName, contract_id: options.contractId, created_at: "2026-10-12" });

beforeEach(() => {
  vi.clearAllMocks();
  state.documents = { contract: document("contract"), invoice: document("invoice") };
  state.storedFile = { file_path: "TEST/old-bank.pdf", file_name: "TEST-archived.pdf" };
  state.invoke.mockResolvedValue({ data: { success: true, status: "accepted" }, error: null });
  state.generate.mockImplementation(async html => ({ source: html }));
  state.base64.mockImplementation(async blob => blob.source || "ARCHIVED PDF");
  state.download.mockResolvedValue({ data: { source: "ARCHIVED PDF" }, error: null });
  state.from.mockImplementation(table => {
    let kind: string | undefined;
    const query = {
      select: () => query, order: () => query, ilike: () => query,
      eq: (field: string, value: string) => { if (field === "doc_type") kind = value; return query; },
      limit: async () => ({ data: table === "generated_documents" ? (state.documents[kind!] ? [state.documents[kind!]] : []) : (state.storedFile ? [state.storedFile] : []), error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
    };
    return query;
  });
});

describe("contract resend uses current source and exposes bank guard failures", () => {
  it("renders both latest HTML versions rather than attaching an older archived PDF", async () => {
    await resendContractEmail(options);
    expect(state.generate.mock.calls.map(call => call[0])).toEqual(["CURRENT contract HTML", "CURRENT invoice HTML"]);
    expect(state.download).not.toHaveBeenCalled();
    expect(state.from.mock.calls.map(call => call[0])).not.toContain("contract_files");
    expect(state.invoke.mock.calls[0][1].body.attachments.map((attachment: { base64: string }) => attachment.base64)).toEqual(["CURRENT contract HTML", "CURRENT invoice HTML"]);
  });

  it("does not fall back to an old PDF if rendering the newer version fails", async () => {
    state.generate.mockRejectedValueOnce(new Error("Cannot render current source"));
    await expect(resendContractEmail(options)).rejects.toThrow("Cannot render current source");
    expect(state.download).not.toHaveBeenCalled();
    expect(state.invoke).not.toHaveBeenCalled();
  });

  it("supports uploaded legacy PDF when no editable source exists, subject to the server guard", async () => {
    state.documents = {};
    await resendContractEmail({ ...options, includeInvoice: false });
    expect(state.generate).not.toHaveBeenCalled();
    expect(state.download).toHaveBeenCalledWith("TEST/old-bank.pdf");
    expect(state.invoke.mock.calls[0][1].body.attachments[0].base64).toBe("ARCHIVED PDF");
  });

  it("shows actionable bank warning from a non-2xx edge response", async () => {
    state.invoke.mockResolvedValue({ data: null, error: { message: "Edge Function returned a non-2xx status", context: new Response(JSON.stringify({ code: "CRM_COMPANY_BANK_ACCOUNT_RETIRED", error: "Старый счёт: создайте новую версию с актуальными реквизитами." }), { status: 409 }) } });
    await expect(resendContractEmail(options)).rejects.toThrow("Старый счёт: создайте новую версию с актуальными реквизитами.");
    expect(state.from.mock.calls.map(call => call[0])).not.toContain("clients");
  });
});
