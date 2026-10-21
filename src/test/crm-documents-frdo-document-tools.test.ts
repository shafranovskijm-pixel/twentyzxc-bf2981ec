import { describe, expect, it } from "vitest";
import { z } from "zod";
import { crmTools } from "../lib/mcp";

const id = "11111111-1111-4111-8111-111111111111";
const hash = "a".repeat(64);
const file = { file_id: "file-local-synthetic", download_url: "https://files.oaiusercontent.com/synthetic" };
function tool(name: string) { return crmTools.find(item => item.name === name)!; }
function schema(name: string) { return z.object(tool(name).inputSchema as z.ZodRawShape).strict(); }

describe("FRDO originals and PDF marks public boundary", () => {
  it("separates preparation, outside sending and read-only status", () => {
    expect(tool("crm_prepare_frdo_package").annotations).toMatchObject({ readOnlyHint: false, openWorldHint: false, idempotentHint: true });
    expect(tool("crm_send_frdo_package").annotations).toMatchObject({ readOnlyHint: false, openWorldHint: true, idempotentHint: true });
    expect(tool("crm_get_frdo_package_delivery").annotations).toMatchObject({ readOnlyHint: true, openWorldHint: false });
    expect(tool("crm_send_frdo_package").description).toContain("ПОСЛЕ отдельного подтверждения");
    const command = { requestId: id, clientId: id, expectedClientRevision: 3, expectedInn: null, templates: [{ templateId: "prikaz", revision: 1, sha256: hash }] };
    const parse = schema("crm_prepare_frdo_package");
    expect(parse.safeParse(command).success).toBe(true);
    for (const patch of [{ expectedInn: undefined }, { expectedClientRevision: undefined }, { templates: [] }, { recipient: "a@example.test\r\nBcc: b@example.test" }, { templates: [{ ...command.templates[0], url: "https://arbitrary.invalid/a.docx" }] }]) {
      expect(parse.safeParse({ ...command, ...patch }).success).toBe(false);
    }
  });
  it("accepts a native attachment and requires source/image hashes plus exact placement", () => {
    for (const name of ["crm_inspect_pdf_for_signing", "crm_apply_company_marks_to_pdf"]) {
      expect((tool(name) as unknown as { _meta: object })._meta).toEqual({ "openai/fileParams": ["file"] });
    }
    expect(tool("crm_inspect_pdf_for_signing").annotations?.readOnlyHint).toBe(true);
    expect(tool("crm_apply_company_marks_to_pdf").annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false, openWorldHint: false });
    const command = { requestId: id, file, expectedSourceSha256: hash, expectedAssetHashes: { signature: hash }, placements: [{ assetId: "signature", pageNumber: 1, x: 20, y: 30, width: 125, height: 50 }] };
    const parse = schema("crm_apply_company_marks_to_pdf");
    expect(parse.safeParse(command).success).toBe(true);
    for (const patch of [{ expectedSourceSha256: undefined }, { expectedAssetHashes: undefined }, { placements: [] }, { file: { ...file, token: "forbidden" } }, { expectedAssetHashes: { clientSignature: hash } }, { placements: [{ ...command.placements[0], pageNumber: 0 }] }, { placements: [{ ...command.placements[0], x: Infinity }] }, { placements: [{ ...command.placements[0], height: -1 }] }]) {
      expect(parse.safeParse({ ...command, ...patch }).success).toBe(false);
    }
  });
});
