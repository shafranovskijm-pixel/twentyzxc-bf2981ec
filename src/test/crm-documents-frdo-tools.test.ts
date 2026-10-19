import { describe, expect, it } from "vitest";
import { z } from "zod";
import { crmTools } from "../lib/mcp";

const clientId = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";
function tool(name: string) {
  const found = crmTools.find(item => item.name === name);
  if (!found) throw new Error(`Missing public tool: ${name}`);
  return found;
}
function schema(name: string) { return z.object(tool(name).inputSchema as z.ZodRawShape).strict(); }
const command = { requestId, clientId, expectedRevision: 7, expectedInn: "0000000000" };

describe("public FRDO MCP boundary", () => {
  it("distinguishes a local comparison from a credential write and external login", () => {
    for (const name of ["crm_get_frdo_access_status", "crm_compare_frdo_access"]) {
      expect(tool(name).annotations).toMatchObject({ readOnlyHint: true, openWorldHint: false });
    }
    expect(tool("crm_update_frdo_access").annotations).toMatchObject({ readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false });
    expect(tool("crm_compare_frdo_access").description).toContain("не выполняет вход");
  });
  it("requires exact card identity and revision for writes without trimming credentials", () => {
    const parse = schema("crm_update_frdo_access");
    expect(parse.parse({ ...command, changes: { login: "  synthetic login  ", passwordDpo: " synthetic DPO ", passwordPo: null } }))
      .toMatchObject({ changes: { login: "  synthetic login  ", passwordDpo: " synthetic DPO ", passwordPo: null } });
    expect(parse.safeParse({ ...command, expectedInn: undefined, changes: { login: "synthetic" } }).success).toBe(false);
    expect(parse.safeParse({ ...command, expectedRevision: undefined, changes: { login: "synthetic" } }).success).toBe(false);
    expect(parse.safeParse({ ...command, changes: {} }).success).toBe(false);
    expect(parse.safeParse({ ...command, changes: { password: "ambiguous DPO/PO" } }).success).toBe(false);
    expect(parse.safeParse({ ...command, expectedInn: null, changes: { passwordPo: "synthetic PO" } }).success).toBe(true);
  });
  it("compares supplied fields only and reserves null for deliberate clearing", () => {
    const parse = schema("crm_compare_frdo_access");
    const identity = { clientId, expectedInn: null };
    expect(parse.parse({ ...identity, credentials: { passwordPo: " exact synthetic value " } }))
      .toEqual({ ...identity, credentials: { passwordPo: " exact synthetic value " } });
    for (const credentials of [{}, { passwordDpo: null }, { login: "\u00a0" }, { passwordPo: "a\nb" }, { passwordDpo: "a".repeat(4097) }]) {
      expect(parse.safeParse({ ...identity, credentials }).success).toBe(false);
    }
  });
  it("keeps credentials outside the generic client patch", () => {
    const parse = schema("crm_update_client");
    expect(parse.safeParse({ requestId, clientId, expectedRevision: 7, changes: { frdo_password: "synthetic" } }).success).toBe(false);
    expect(parse.safeParse({ requestId, clientId, expectedRevision: 7, changes: { passwordDpo: "synthetic" } }).success).toBe(false);
  });
});
