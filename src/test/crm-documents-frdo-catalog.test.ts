import { describe, expect, it, vi } from "vitest";
import { FRDO_TEMPLATES, MAX_FRDO_FILE_BYTES, downloadFrdoTemplate, downloadFrdoTemplates, frdoSha256,
  getFrdoTemplate, publicFrdoTemplate, validateFrdoTemplateBytes } from "../../supabase/functions/_shared/crm-frdo/catalog";

describe("fixed existing FRDO originals", () => {
  it("registers exactly the eight UI originals at revision one with immutable metadata", () => {
    expect(FRDO_TEMPLATES.map(item => item.id)).toEqual(["instruktsiya", "prikaz", "prikaz-pdf", "terms", "dpo-template", "dpo-dated", "po-template", "po-dated"]);
    expect(FRDO_TEMPLATES.every(item => item.revision === 1 && item.size > 0 && item.size < MAX_FRDO_FILE_BYTES && /^[a-f0-9]{64}$/.test(item.sha256))).toBe(true);
    expect(Object.isFrozen(FRDO_TEMPLATES)).toBe(true); expect(FRDO_TEMPLATES.every(Object.isFrozen)).toBe(true);
    expect(getFrdoTemplate("prikaz-pdf").url).toBe("https://twentyzxc.lovable.app/__l5e/assets-v1/7c6be8ce-d17c-4d7a-b04c-63c0f37500a4/Prikaz_FRDO_podpisan.pdf");
    expect(getFrdoTemplate("dpo-dated").label).toContain("06.11.2023");
    expect(publicFrdoTemplate(getFrdoTemplate("prikaz"))).toEqual(getFrdoTemplate("prikaz"));
  });
  it("rejects unknown IDs, obsolete revisions and duplicate packages", async () => {
    expect(() => getFrdoTemplate("../private")).toThrow("CRM_FRDO_TEMPLATE_NOT_FOUND");
    expect(() => getFrdoTemplate("terms", 2)).toThrow("CRM_FRDO_TEMPLATE_NOT_FOUND");
    const network = vi.fn<typeof fetch>();
    await expect(downloadFrdoTemplates([], network)).rejects.toMatchObject({ code: "CRM_FRDO_INVALID_TEMPLATE_SET" });
    expect(network).not.toHaveBeenCalled();
  });
  it.each(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"])("verifies synthetic %s bytes with real SHA256", async contentType => {
    const bytes = contentType === "application/pdf" ? new TextEncoder().encode("%PDF-1.7\nSYNTHETIC\n%%EOF")
      : Uint8Array.from([0x50, 0x4b, 3, 4, 1, 2, 3, 4]);
    const item = { ...FRDO_TEMPLATES[0], contentType, size: bytes.length, sha256: await frdoSha256(bytes) };
    await expect(validateFrdoTemplateBytes(item, bytes)).resolves.toBeUndefined();
    await expect(validateFrdoTemplateBytes({ ...item, sha256: "a".repeat(64) }, bytes)).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_CONTENT_MISMATCH" });
    await expect(validateFrdoTemplateBytes({ ...item, size: bytes.length + 1 }, bytes)).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_CONTENT_MISMATCH" });
    await expect(validateFrdoTemplateBytes(item, new TextEncoder().encode("<html>substituted</html>"))).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_CONTENT_MISMATCH" });
  });
  it("resolves the fixed source internally and ignores a supplied URL override", async () => {
    const network = vi.fn<typeof fetch>().mockResolvedValue(new Response("<html>wrong bytes</html>", { headers: { "content-type": "application/pdf" } }));
    await expect(downloadFrdoTemplate({ id: "terms", revision: 1, url: "https://127.0.0.1/private" } as unknown as Parameters<typeof downloadFrdoTemplate>[0], network)).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_CONTENT_MISMATCH" });
    expect(network).toHaveBeenCalledWith(getFrdoTemplate("terms").url, expect.objectContaining({ redirect: "manual", credentials: "omit", signal: expect.any(AbortSignal) }));
    expect(network.mock.calls[0][0]).not.toContain("127.0.0.1");
  });
  it("allows legacy generic binary MIME only when exact content checks also pass", async () => {
    const network = vi.fn<typeof fetch>().mockResolvedValue(new Response("not an original", { headers: { "content-type": "application/octet-stream" } }));
    await expect(downloadFrdoTemplate({ id: "prikaz", revision: 1 }, network)).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_CONTENT_MISMATCH" });
    await expect(downloadFrdoTemplate({ id: "terms", revision: 1 }, vi.fn().mockResolvedValue(new Response("wrong", { headers: { "content-type": "application/octet-stream" } })))).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_MIME_MISMATCH" });
  });
  it.each(["text/html", "image/png", "application/zip"])("rejects unexpected MIME %s", async mime => {
    const network = vi.fn<typeof fetch>().mockResolvedValue(new Response("wrong", { headers: { "content-type": mime } }));
    await expect(downloadFrdoTemplate({ id: "prikaz", revision: 1 }, network)).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_MIME_MISMATCH" });
  });
  it("rejects redirects, HTTP failures, network errors and oversized chunked data", async () => {
    for (const response of [new Response(null, { status: 302 }), new Response(null, { status: 404 })]) {
      await expect(downloadFrdoTemplate({ id: "terms", revision: 1 }, vi.fn().mockResolvedValue(response))).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_UNAVAILABLE" });
    }
    await expect(downloadFrdoTemplate({ id: "terms", revision: 1 }, vi.fn().mockRejectedValue(new Error("PRIVATE_NETWORK_DETAIL")))).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_UNAVAILABLE" });
    const response = new Response(new Uint8Array(MAX_FRDO_FILE_BYTES + 1), { headers: { "content-type": "application/pdf" } });
    await expect(downloadFrdoTemplate({ id: "terms", revision: 1 }, vi.fn().mockResolvedValue(response))).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_TOO_LARGE" });
  });
  it("rejects malformed and excessive declared size before reading the body", async () => {
    for (const length of ["-1", "NaN", String(MAX_FRDO_FILE_BYTES + 1)]) {
      const response = new Response("x", { headers: { "content-type": "application/pdf", "content-length": length } });
      await expect(downloadFrdoTemplate({ id: "terms", revision: 1 }, vi.fn().mockResolvedValue(response))).rejects.toMatchObject({ code: "CRM_FRDO_TEMPLATE_TOO_LARGE" });
    }
  });
});

