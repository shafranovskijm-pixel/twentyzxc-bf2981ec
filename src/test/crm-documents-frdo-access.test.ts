import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { CrmFrdoAccessService, runFrdoAccessTool, validateFrdoCredentials } from "../lib/mcp/frdo-access-service";
import { CLIENT_FIELDS, CrmError } from "../lib/mcp/service";
import { CLIENT_CARD_FIELDS } from "../lib/mcp/client-service";

vi.mock("@supabase/supabase-js", async importOriginal => ({
  ...await importOriginal<typeof import("@supabase/supabase-js")>(), createClient: vi.fn(),
}));

const clientId = "11111111-1111-4111-8111-111111111111";
const requestId = "44444444-4444-4444-8444-444444444444";
const inn = "1234567890";
const privateValue = "FAKE-CREDENTIAL-MUST-NOT-LEAK";
function snapshot(changes: Record<string, unknown> = {}) {
  return { client: { id: clientId, name: "Тестовая организация", inn, crm_revision: 3 },
    presence: { loginSet: true, passwordDpoSet: true, passwordPoSet: false },
    status: "read", saved: false, sent: false, replayed: false, ...changes };
}
function saved(changes: Record<string, unknown> = {}) {
  return snapshot({ client: { id: clientId, name: "Тестовая организация", inn, crm_revision: 4 },
    status: "saved", saved: true, replayed: false, changedFields: ["passwordDpo"], ...changes });
}
function mockDb(data: unknown = snapshot(), error: unknown = null) {
  const db = { rpc: vi.fn().mockResolvedValue({ data, error }), from: vi.fn(), functions: { invoke: vi.fn() } };
  return { db: db as unknown as SupabaseClient, ...db };
}
const context = () => ({ isAuthenticated: () => true, getUserId: () => "verified-actor", getToken: () => "verified-user-token" }) as ToolContext;
function authenticatedDb() {
  vi.stubEnv("SUPABASE_URL", "https://project.example.invalid");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public-test-key");
  const fake = mockDb();
  fake.rpc.mockResolvedValue({ data: true, error: null });
  vi.mocked(createClient).mockReturnValue(fake.db as unknown as ReturnType<typeof createClient>);
  return fake;
}
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("FRDO credential validation", () => {
  it("preserves exact surrounding spaces and keeps DPO, PO and omitted fields distinct", () => {
    expect(validateFrdoCredentials({ login: "  user  ", passwordDpo: " dpo ", passwordPo: " po " }))
      .toEqual({ login: "  user  ", passwordDpo: " dpo ", passwordPo: " po " });
    expect(validateFrdoCredentials({ passwordPo: "separate-po" })).toEqual({ passwordPo: "separate-po" });
    expect(validateFrdoCredentials({ passwordDpo: null }, true)).toEqual({ passwordDpo: null });
    expect(() => validateFrdoCredentials({ passwordDpo: null })).toThrow();
  });
  it("accepts the documented boundaries without truncating credential values", () => {
    const values = { login: "l".repeat(500), passwordDpo: "d".repeat(4096), passwordPo: "p".repeat(4096) };
    expect(validateFrdoCredentials(values)).toEqual(values);
  });
  it.each([
    undefined, null, [], "text", 1, false, {}, new Date(), { login: undefined }, { login: 12 },
    { passwordPo: false }, { passwordDpo: {} }, { login: "" }, { login: " \t " }, { passwordPo: "\u00a0 " },
    { login: "line\nline" }, { passwordDpo: "secret\u0000value" }, { passwordPo: "secret\u007fvalue" },
    { passwordDpo: "secret\u0085value" }, { login: "l".repeat(501) }, { passwordDpo: "d".repeat(4097) },
    { passwordPo: "p".repeat(4097) }, { login: "user", password: "legacy" }, { frdo_password: "legacy" },
    { login: "user", crm_revision: 5 }, { login: "user", clientId }, { constructor: "override" },
  ].map(raw => ({ raw })))("rejects invalid or broad credential input before SQL (%#)", ({ raw }) => {
    expect(() => validateFrdoCredentials(raw)).toThrow();
    expect(() => validateFrdoCredentials(raw, true)).toThrow();
  });
  it("rejects accessors, inherited objects and symbol fields without reading a getter", () => {
    const getter = vi.fn(() => privateValue);
    const accessor = Object.defineProperty({}, "login", { get: getter, enumerable: true });
    expect(() => validateFrdoCredentials(accessor)).toThrow();
    expect(getter).not.toHaveBeenCalled();
    expect(() => validateFrdoCredentials(Object.assign(Object.create({ privateValue }), { login: "user" }))).toThrow();
    expect(() => validateFrdoCredentials({ login: "user", [Symbol("extra")]: privateValue })).toThrow();
  });
});

describe("FRDO RPC routing and safe responses", () => {
  it("reads only the exact client through the dedicated RPC and strips private RPC fields", async () => {
    const data = snapshot({ password: privateValue, error: privateValue });
    Object.assign(data.client, { frdo_login: privateValue, frdo_password_dpo: privateValue, notes: privateValue });
    Object.assign(data.presence, { raw: privateValue });
    const fake = mockDb(data);
    const result = await new CrmFrdoAccessService(fake.db).getStatus(clientId.toUpperCase());
    expect(fake.rpc).toHaveBeenCalledExactlyOnceWith("crm_get_frdo_access_status", { p_client_id: clientId });
    expect(result).toEqual(snapshot());
    expect(JSON.stringify(result)).not.toContain(privateValue);
    expect(fake.from).not.toHaveBeenCalled();
    expect(fake.functions.invoke).not.toHaveBeenCalled();
    expect(CLIENT_FIELDS).not.toMatch(/password|login|notes|\*/);
    expect(CLIENT_CARD_FIELDS).not.toMatch(/password|login|notes|\*/);
  });
  it("compares only supplied values and returns match flags without exposing any credentials", async () => {
    const fake = mockDb(snapshot({ comparison: { login: "match", passwordDpo: "different", passwordPo: "not_set", extra: privateValue }, raw: privateValue }));
    const result = await new CrmFrdoAccessService(fake.db).compare(clientId, inn, { passwordDpo: " dpo ", passwordPo: " po " });
    expect(fake.rpc).toHaveBeenCalledExactlyOnceWith("crm_compare_frdo_access", { p_client_id: clientId, p_expected_inn: inn,
      p_credentials: { passwordDpo: " dpo ", passwordPo: " po " } });
    expect(result.comparison).toEqual({ passwordDpo: "different", passwordPo: "not_set" });
    expect(JSON.stringify(result)).not.toMatch(/FAKE-CREDENTIAL| dpo | po /);
    expect(result).toMatchObject({ status: "read", saved: false, sent: false, replayed: false });
  });
  it("supports an explicit absent-INN assertion but never invents it when omitted", async () => {
    const absent = { id: clientId, name: "Без ИНН", inn: null, crm_revision: 3 };
    const fake = mockDb(snapshot({ client: absent, comparison: { login: "match" } }));
    expect(await new CrmFrdoAccessService(fake.db).compare(clientId, null, { login: "user" })).toMatchObject({ client: absent });
    expect(fake.rpc).toHaveBeenCalledWith("crm_compare_frdo_access", expect.objectContaining({ p_expected_inn: null }));
    fake.rpc.mockClear();
    await expect(new CrmFrdoAccessService(fake.db).compare(clientId, undefined as unknown as null, { login: "user" }))
      .rejects.toMatchObject({ code: "CRM_INVALID_FRDO_REQUEST" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("passes request identity, revision, exact values and explicit clearing to the atomic save", async () => {
    const fake = mockDb(saved({ changedFields: ["login", "passwordDpo", "passwordPo"], raw: privateValue }));
    const changes = { login: " user ", passwordDpo: " dpo ", passwordPo: null };
    const result = await new CrmFrdoAccessService(fake.db).save(requestId.toUpperCase(), clientId, 3, inn, changes);
    expect(fake.rpc).toHaveBeenCalledExactlyOnceWith("crm_save_frdo_access", { p_request_id: requestId, p_client_id: clientId,
      p_expected_revision: 3, p_expected_inn: inn, p_changes: changes });
    expect(result).toEqual(saved({ changedFields: ["login", "passwordDpo", "passwordPo"] }));
    expect(JSON.stringify(result)).not.toMatch(/FAKE-CREDENTIAL| user | dpo /);
    expect(fake.from).not.toHaveBeenCalled();
    expect(fake.functions.invoke).not.toHaveBeenCalled();
  });
  it("preserves a no-op revision and a replay snapshot without treating replay as a new write", async () => {
    const fake = mockDb(saved({ client: snapshot().client, changedFields: [], replayed: true }));
    const result = await new CrmFrdoAccessService(fake.db).save(requestId, clientId, 3, inn, { passwordDpo: "same" });
    expect(result).toMatchObject({ saved: true, replayed: true, changedFields: [], client: { crm_revision: 3 } });
    expect(fake.rpc).toHaveBeenCalledTimes(1);
  });
  it("reuses the supplied requestId and exact values on caller retry", async () => {
    const fake = mockDb(saved());
    const service = new CrmFrdoAccessService(fake.db);
    await service.save(requestId, clientId, 3, inn, { passwordDpo: " unchanged " });
    fake.rpc.mockResolvedValue({ data: saved({ replayed: true }), error: null });
    expect(await service.save(requestId, clientId, 3, inn, { passwordDpo: " unchanged " })).toMatchObject({ replayed: true });
    expect(fake.rpc.mock.calls[0]).toEqual(fake.rpc.mock.calls[1]);
  });
  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "3", null, undefined])("rejects an unusable revision before SQL (%#)", async revision => {
    const fake = mockDb(saved());
    await expect(new CrmFrdoAccessService(fake.db).save(requestId, clientId, revision as number, inn, { login: "user" }))
      .rejects.toMatchObject({ code: "CRM_INVALID_FRDO_REQUEST" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it.each(["", "123", " 1234567890", "1234567890 ", "12345678901", "abcdefghij", 1234567890, undefined])("rejects a missing or malformed INN assertion before SQL (%#)", async expected => {
    const fake = mockDb(); const service = new CrmFrdoAccessService(fake.db);
    await expect(service.compare(clientId, expected as string, { login: "user" })).rejects.toMatchObject({ code: "CRM_INVALID_FRDO_REQUEST" });
    await expect(service.save(requestId, clientId, 3, expected as string, { login: "user" })).rejects.toMatchObject({ code: "CRM_INVALID_FRDO_REQUEST" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("accepts a 12-digit INN exactly", async () => {
    const twelve = "123456789012";
    const fake = mockDb(snapshot({ client: { ...snapshot().client, inn: twelve }, comparison: { login: "different" } }));
    expect(await new CrmFrdoAccessService(fake.db).compare(clientId, twelve, { login: "user" })).toMatchObject({ client: { inn: twelve } });
  });
  it.each(["not-a-uuid", "", undefined])("rejects invalid client or command IDs before SQL (%#)", async invalid => {
    const fake = mockDb(); const service = new CrmFrdoAccessService(fake.db);
    await expect(service.getStatus(invalid)).rejects.toMatchObject({ code: "CRM_INVALID_FRDO_REQUEST" });
    await expect(service.save(invalid, clientId, 3, inn, { login: "user" })).rejects.toMatchObject({ code: "CRM_INVALID_FRDO_REQUEST" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("rejects comparison null before SQL instead of treating it as a clear command", async () => {
    const fake = mockDb();
    await expect(new CrmFrdoAccessService(fake.db).compare(clientId, inn, { login: null }))
      .rejects.toMatchObject({ code: "CRM_INVALID_FRDO_CREDENTIALS" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
});

describe("FRDO output and error confidentiality", () => {
  it.each([
    null, [], {}, snapshot({ client: null }), snapshot({ presence: {} }),
    snapshot({ client: { ...snapshot().client, id: requestId } }), snapshot({ client: { ...snapshot().client, crm_revision: 0 } }),
    snapshot({ client: { ...snapshot().client, inn: privateValue } }), snapshot({ client: { ...snapshot().client, name: "bad\nname" } }),
    snapshot({ presence: { ...snapshot().presence, passwordPoSet: privateValue } }), snapshot({ sent: true }), snapshot({ saved: true }),
  ].map(data => ({ data })))("refuses a malformed or mismatched status without echoing its body (%#)", async ({ data }) => {
    const fake = mockDb(data);
    await expect(new CrmFrdoAccessService(fake.db).getStatus(clientId)).rejects.toMatchObject({ code: "CRM_FRDO_RESULT_UNCONFIRMED" });
  });
  it.each([{}, { login: privateValue }, { login: true }])("rejects missing or invalid comparison flags (%#)", async comparison => {
    await expect(new CrmFrdoAccessService(mockDb(snapshot({ comparison })).db).compare(clientId, inn, { login: "user" }))
      .rejects.toMatchObject({ code: "CRM_FRDO_RESULT_UNCONFIRMED" });
  });
  it("rejects a mismatched or absent INN in an asserted comparison", async () => {
    const fake = mockDb(snapshot({ comparison: { login: "match" } }));
    await expect(new CrmFrdoAccessService(fake.db).compare(clientId, null, { login: "user" }))
      .rejects.toMatchObject({ code: "CRM_FRDO_RESULT_UNCONFIRMED" });
  });
  it.each([
    saved({ changedFields: [privateValue] }), saved({ changedFields: ["passwordDpo", "passwordDpo"] }),
    saved({ changedFields: ["passwordPo"] }), saved({ changedFields: null }), saved({ saved: false }),
    saved({ replayed: privateValue }), saved({ client: { ...snapshot().client, crm_revision: 2 } }),
    saved({ client: { ...snapshot().client, crm_revision: 3 } }), saved({ changedFields: [] }),
  ])("does not confirm malformed save flags, changed fields or revisions (%#)", async data => {
    await expect(new CrmFrdoAccessService(mockDb(data).db).save(requestId, clientId, 3, inn, { passwordDpo: "dpo" }))
      .rejects.toMatchObject({ code: "CRM_FRDO_RESULT_UNCONFIRMED" });
  });
  it("turns known SQL codes and unknown transport failures into fixed safe errors without logging", async () => {
    const logs = [vi.spyOn(console, "log"), vi.spyOn(console, "warn"), vi.spyOn(console, "error")];
    const fake = mockDb(null, { message: `SQL ${privateValue}: CRM_FRDO_IDENTITY_MISMATCH internal-record` });
    await expect(new CrmFrdoAccessService(fake.db).compare(clientId, inn, { login: "user" }))
      .rejects.toMatchObject({ code: "CRM_FRDO_IDENTITY_MISMATCH" });
    fake.rpc.mockRejectedValue(new Error(`SQL ${privateValue}`));
    try { await new CrmFrdoAccessService(fake.db).getStatus(clientId); }
    catch (error) {
      expect(error).toMatchObject({ code: "CRM_FRDO_DATABASE_ERROR" });
      expect((error as Error).message).not.toMatch(/FAKE-CREDENTIAL|SQL|internal-record/);
    }
    for (const log of logs) expect(log).not.toHaveBeenCalled();
  });
});

describe("FRDO caller authorization and safe tool wrapper", () => {
  it("performs no action or connection for an unauthenticated caller", async () => {
    const action = vi.fn();
    const result = await runFrdoAccessTool({ isAuthenticated: () => false } as ToolContext, action);
    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).toContain("UNAUTHORIZED");
    expect(action).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });
  it("rejects a missing verified token before opening a database connection", async () => {
    const action = vi.fn();
    const result = await runFrdoAccessTool({ ...context(), getToken: () => undefined } as ToolContext, action);
    expect(result).toMatchObject({ isError: true });
    expect(action).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });
  it("checks the verified user role before action and refuses non-admin access", async () => {
    const fake = authenticatedDb(); fake.rpc.mockResolvedValue({ data: false, error: null });
    const action = vi.fn();
    const result = await runFrdoAccessTool(context(), action);
    expect(fake.rpc).toHaveBeenCalledExactlyOnceWith("has_role", { _user_id: "verified-actor", _role: "admin" });
    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).toContain("FORBIDDEN");
    expect(action).not.toHaveBeenCalled();
  });
  it("uses the verified caller token and returns only the masked service result", async () => {
    const fake = authenticatedDb(); fake.rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: snapshot({ extra: privateValue }), error: null });
    const result = await runFrdoAccessTool(context(), service => service.getStatus(clientId));
    expect(createClient).toHaveBeenCalledWith("https://project.example.invalid", "public-test-key", expect.objectContaining({ global: { headers: { Authorization: "Bearer verified-user-token" } } }));
    expect(result).toMatchObject({ structuredContent: snapshot() });
    expect(JSON.stringify(result)).not.toContain(privateValue);
    expect(fake.rpc.mock.calls.map(call => call[0])).toEqual(["has_role", "crm_get_frdo_access_status"]);
  });
  it.each(["CRM_CLIENT_REVISION_CONFLICT", "UNKNOWN_CODE_WITH_PRIVATE_VALUE"]) ("does not echo a forged CrmError message or unknown code (%s)", async code => {
    authenticatedDb();
    const result = await runFrdoAccessTool(context(), async () => { throw new CrmError(code, `SQL ${privateValue} internal-record`); });
    expect(result).toMatchObject({ isError: true });
    expect(JSON.stringify(result)).not.toMatch(/FAKE-CREDENTIAL|SQL|internal-record|UNKNOWN_CODE/);
    expect(result.content[0].text).toContain(code === "CRM_CLIENT_REVISION_CONFLICT" ? code : "CRM_FRDO_DATABASE_ERROR");
  });
});
