import { describe, expect, it, vi } from "vitest";
import { CrmFrdoDocumentsService, runFrdoDocumentsTool } from "../lib/mcp/frdo-documents-service";
import { FRDO_TEMPLATES } from "../../supabase/functions/_shared/crm-frdo/catalog";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

const deliveryId = "11111111-1111-4111-8111-111111111111", clientId = "22222222-2222-4222-8222-222222222222";
const entry = FRDO_TEMPLATES[0];
const reference = { templateId: entry.id, revision: entry.revision, sha256: entry.sha256 };
const metadata = { ...reference, filename: entry.fileName, label: entry.label, size: entry.size, contentType: entry.contentType };
const result = { deliveryId, clientId, recipient: "test@example.invalid", subject: "Тест", body: "Тестовое письмо", state: "prepared", messageId: `<crm-frdo-${deliveryId}@24zxc.ru>`,
  templates: [metadata], attachments: [{ ...metadata, path: "private-worker-path" }], smtpAccepted: false, recipientDeliveryConfirmed: false, retryAllowed: false,
  downloads: [{ templateId: entry.id, revision: entry.revision, filename: entry.fileName, url: `https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/sign/contracts/crm-frdo-email/${deliveryId}/${entry.id}-r${entry.revision}-${entry.sha256}.${entry.fileName.split(".").pop()}?token=synthetic`, expiresInSeconds: 600 }] };
function mock(value: unknown = result) {
  const invoke = vi.fn().mockResolvedValue({ data: value, error: null });
  return { invoke, db: { functions: { invoke } } as unknown as SupabaseClient };
}
const input = { requestId: deliveryId, clientId, expectedClientRevision: 4, expectedInn: "0000000000", templates: [reference] };

describe("FRDO package MCP service", () => {
  it("lists eight fixed originals, including source Office formats and dated samples", () => {
    const m = mock(); const output = new CrmFrdoDocumentsService(m.db).listTemplates();
    expect(output.templates).toHaveLength(8);
    expect(output.templates.filter(t => t.contentType.includes("spreadsheet")).length).toBe(4);
    expect(output).toMatchObject({ saved: false, sent: false });
    expect(m.invoke).not.toHaveBeenCalled();
  });
  it("checks the selected original without returning arbitrary worker fields", async () => {
    const m = mock({ template: { ...metadata, url: "https://evil.invalid/", privateNote: "SECRET" }, verified: true, rawToken: "SECRET" });
    const output = await new CrmFrdoDocumentsService(m.db).getTemplate(entry.id, entry.revision);
    expect(m.invoke).toHaveBeenCalledWith("crm-frdo-email", { body: { action: "getTemplate", templateId: entry.id, revision: entry.revision } });
    expect(output.template.url).toBe(entry.url);
    expect(JSON.stringify(output)).not.toContain("SECRET");
  });
  it("prepares an exact organization and file manifest without sending", async () => {
    const m = mock({ ...result, frdo_password: "SECRET", request: { hidden: "SECRET" } });
    const output = await new CrmFrdoDocumentsService(m.db).preparePackage(input);
    expect(m.invoke).toHaveBeenCalledWith("crm-frdo-email", { body: { action: "prepare", ...input } });
    expect(output.smtpAccepted).toBe(false);
    expect(output.attachments).toHaveLength(1);
    expect(JSON.stringify(output)).not.toMatch(/SECRET|private-worker-path/);
    expect(output.downloads[0].expiresInSeconds).toBe(600);
  });
  it.each([
    { ...input, expectedClientRevision: 0 }, { ...input, expectedInn: undefined }, { ...input, templates: [] },
    { ...input, templates: [reference, reference] }, { ...input, templates: [{ ...reference, sha256: "0".repeat(64) }] },
    { ...input, templates: [{ ...reference, templateId: "https://evil.invalid/" }] },
    { ...input, subject: "Subject\nHeader: injected" }, { ...input, recipient: "a@example.invalid,b@example.invalid" },
  ])("rejects missing identity, guessed files and unsafe mail fields before any invocation %#", async value => {
    const m = mock(); await expect(new CrmFrdoDocumentsService(m.db).preparePackage(value)).rejects.toBeInstanceOf(Error);
    expect(m.invoke).not.toHaveBeenCalled();
  });
  it("checks server correlation and rejects unregistered links/changed manifests", async () => {
    for (const altered of [
      { ...result, clientId: deliveryId }, { ...result, smtpAccepted: true },
      { ...result, templates: [{ ...metadata, sha256: "0".repeat(64) }] },
      { ...result, downloads: [{ ...result.downloads[0], url: "https://evil.invalid/?token=private" }] },
      { ...result, downloads: [{ ...result.downloads[0], url: `https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/sign/contracts/wrong/test?token=private` }] },
    ]) {
      await expect(new CrmFrdoDocumentsService(mock(altered).db).preparePackage(input)).rejects.toBeInstanceOf(Error);
    }
  });
  it("routes send/status separately, preserving uncertain outcomes and immutable selection", async () => {
    const m = mock({ ...result, state: "unknown" }); const api = new CrmFrdoDocumentsService(m.db);
    expect(await api.sendPackage(deliveryId, result.recipient)).toMatchObject({ state: "unknown", smtpAccepted: false, retryAllowed: false });
    expect(m.invoke).toHaveBeenLastCalledWith("crm-frdo-email", { body: { action: "send", deliveryId, expectedRecipient: result.recipient } });
    await api.getDelivery(deliveryId);
    expect(m.invoke).toHaveBeenLastCalledWith("crm-frdo-email", { body: { action: "status", deliveryId } });
  });
  it("does not construct or call the backend for an unauthenticated context", async () => {
    const action = vi.fn(); const output = await runFrdoDocumentsTool({ isAuthenticated: () => false } as ToolContext, action);
    expect(output).toMatchObject({ isError: true }); expect(action).not.toHaveBeenCalled();
    expect(output.content[0].text).toContain("UNAUTHORIZED");
  });
  it("never repeats transport bodies or unknown error codes", async () => {
    const m = mock(); m.invoke.mockRejectedValue({ code: "CRM_SECRET_VALUE", message: "password=SECRET", context: "TOKEN" });
    try { await new CrmFrdoDocumentsService(m.db).getDelivery(deliveryId); } catch (error) {
      expect((error as Error).message).not.toMatch(/SECRET|TOKEN|password/); return;
    }
    throw new Error("Expected a sanitized failure");
  });
});
