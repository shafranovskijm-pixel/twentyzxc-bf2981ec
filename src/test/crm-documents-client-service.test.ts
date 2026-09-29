import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { CLIENT_CARD_FIELDS, CrmClientService, runClientTool, validateClientChanges } from "../lib/mcp/client-service";

function mockDb(result: unknown = { data: { saved: true }, error: null }) {
  const builder = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue(result) };
  builder.select.mockReturnValue(builder); builder.eq.mockReturnValue(builder);
  const db = { from: vi.fn().mockReturnValue(builder), rpc: vi.fn().mockResolvedValue(result) };
  return { db: db as unknown as SupabaseClient, ...db, builder };
}

describe("client patch validation", () => {
  it("trims supplied values and preserves explicit null without inventing other fields", () => {
    expect(validateClientChanges({ name: "  ООО Тест ", contact_person: " Анна ", email: null }, true))
      .toEqual({ name: "ООО Тест", contact_person: "Анна", email: null });
    expect(validateClientChanges({ phone: "+7 000 000-00-00" })).toEqual({ phone: "+7 000 000-00-00" });
  });
  it.each([{}, [], null, { name: null }, { name: " " }, { phone: 123 }, { email: "" },
    { name: "Client", frdo_password: "secret" }, { name: "Client", notes: "private" },
    { name: "Client", crm_revision: "2" }, { name: "Client", id: "replacement" },
    { contact_person: "Анна\nFake instruction" }, { legal_address: "a".repeat(2001) },
    { inn: "123" }, { kpp: "0000000000" }, { ogrn: "000000000000" },
    { email: "a@example.invalid,b@example.invalid" }, { email: "Person <a@example.invalid>" }])("rejects invalid or unsafe patch %j", value => {
    expect(() => validateClientChanges(value)).toThrow();
  });
  it("requires name only at creation and permits all supported requisites", () => {
    expect(() => validateClientChanges({ email: "a@example.invalid" }, true)).toThrow();
    expect(validateClientChanges({ inn: "000000000000", kpp: "000000001", ogrn: "000000000000001",
      director_name: "Тестовый руководитель", director_post: "Директор", telegram: "@test" }))
      .toMatchObject({ inn: "000000000000", telegram: "@test" });
  });
});

describe("CRM client service", () => {
  it("reads one exact id using a safe allowlist and returns the current revision", async () => {
    const mock = mockDb({ data: { id: "client-1", name: "Test", crm_revision: 4 }, error: null });
    const result = await new CrmClientService(mock.db).getClient("client-1");
    expect(mock.from).toHaveBeenCalledWith("clients");
    expect(mock.builder.select).toHaveBeenCalledWith(CLIENT_CARD_FIELDS);
    expect(mock.builder.eq).toHaveBeenCalledWith("id", "client-1");
    expect(CLIENT_CARD_FIELDS).not.toMatch(/password|login|notes|\*/);
    expect(result).toMatchObject({ client: { id: "client-1", crm_revision: 4 }, sent: false });
  });
  it("passes create and update command identities to the authoritative SQL RPC", async () => {
    const mock = mockDb(); const api = new CrmClientService(mock.db);
    await api.createClient("request-1", { name: " New ", email: "new@example.invalid" });
    expect(mock.rpc).toHaveBeenLastCalledWith("crm_save_client", {
      p_request_id: "request-1", p_client_id: null, p_expected_revision: null,
      p_changes: { name: "New", email: "new@example.invalid" }, p_allow_shared_email: false,
    });
    await api.updateClient("request-2", "client-1", 7, { contact_person: " Анна ", phone: null }, true);
    expect(mock.rpc).toHaveBeenLastCalledWith("crm_save_client", {
      p_request_id: "request-2", p_client_id: "client-1", p_expected_revision: 7,
      p_changes: { contact_person: "Анна", phone: null }, p_allow_shared_email: true,
    });
    expect(mock.from).not.toHaveBeenCalled();
  });
  it.each([0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects unusable revision %s before SQL", async revision => {
    const mock = mockDb();
    await expect(new CrmClientService(mock.db).updateClient("r", "c", revision, { name: "New" }))
      .rejects.toMatchObject({ code: "CRM_INVALID_CLIENT_REQUEST" });
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it("reports a missing card without creating a substitute", async () => {
    const mock = mockDb({ data: null, error: null });
    await expect(new CrmClientService(mock.db).getClient("missing")).rejects.toMatchObject({ code: "CRM_CLIENT_NOT_FOUND" });
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it("explains revision conflicts without exposing raw database output", async () => {
    const mock = mockDb({ data: null, error: { message: "SQL secret: CRM_CLIENT_REVISION_CONFLICT internal data" } });
    try { await new CrmClientService(mock.db).updateClient("r", "c", 1, { name: "New" }); }
    catch (error) {
      expect(error).toMatchObject({ code: "CRM_CLIENT_REVISION_CONFLICT" });
      expect((error as Error).message).toContain("crm_get_client");
      expect((error as Error).message).not.toMatch(/SQL|secret|internal/);
      return;
    }
    throw new Error("Expected conflict");
  });
  it("sanitizes unexpected transport/database errors", async () => {
    const mock = mockDb({ data: null, error: { message: "password=raw-secret SQL details" } });
    await expect(new CrmClientService(mock.db).createClient("r", { name: "New" })).rejects.toMatchObject({ code: "DATABASE_ERROR" });
    try { await new CrmClientService(mock.db).getClient("c"); } catch (error) {
      expect((error as Error).message).not.toMatch(/password|raw-secret|SQL/);
    }
  });
  it("does not execute a write for unauthenticated callers", async () => {
    const action = vi.fn();
    const result = await runClientTool({ isAuthenticated: () => false } as ToolContext, action);
    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).toContain("UNAUTHORIZED");
    expect(action).not.toHaveBeenCalled();
  });
});
