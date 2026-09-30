import { describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import { CLIENT_FILE_MIME, validateClientFileBytes } from "../lib/mcp/client-file-format";
import { clientFileName, downloadChatFile, CrmClientFilesService } from "../lib/mcp/client-files-service";
import type { SupabaseClient } from "@supabase/supabase-js";

const mainType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
const file = { download_url: "https://files.oaiusercontent.com/file-word?secret=private", file_id: "file-word", file_name: "Договор.docx", mime_type: "application/octet-stream" };
const input = { clientId: "22222222-2222-4222-8222-222222222222", requestId: "33333333-3333-4333-8333-333333333333", file };
async function docx(manifest = `<Types><Override PartName="/word/document.xml" ContentType="${mainType}"/></Types>`, extra?: string) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", manifest);
  zip.file("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>');
  if (extra) zip.file(extra, "binary payload");
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
function legacyDoc(name = "WordDocument") {
  const bytes = new Uint8Array(1536); const view = new DataView(bytes.buffer);
  bytes.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  view.setUint16(26, 3, true); view.setUint16(28, 0xfffe, true); view.setUint16(30, 9, true);
  view.setUint32(44, 1, true); view.setUint32(48, 1, true); view.setUint32(68, 0xfffffffe, true);
  for (let i = 0; i < 109; i++) view.setUint32(76 + i * 4, i ? 0xffffffff : 0, true);
  for (let i = 0; i < 128; i++) view.setUint32(512 + i * 4, i === 0 ? 0xfffffffd : 0xfffffffe, true);
  for (let i = 0; i < name.length; i++) view.setUint16(1024 + i * 2, name.charCodeAt(i), true);
  view.setUint16(1088, (name.length + 1) * 2, true); view.setUint8(1090, 2); view.setUint32(1144, 1, true);
  return bytes;
}

describe("original Word identification without expanding document contents", () => {
  it.each(["Договор.docx", "Копия.DOC", "Акт.PDF"])("accepts supported original filename %s", fileName => {
    expect(clientFileName({ ...input, fileName })).toBe(fileName);
  });
  it.each(["../original.docx", "x.docm", "x.zip", "x.rtf", "x.xlsx", "x.docx.exe", ".docx", "a\\x.doc"])("rejects unsupported name %s", fileName => {
    expect(() => clientFileName({ ...input, fileName })).toThrow();
  });
  it("accepts compressed DOCX unchanged, including binary MIME from ChatGPT", async () => {
    const bytes = await docx(); const network = vi.fn().mockResolvedValue(new Response(new Uint8Array(bytes).buffer));
    expect(await downloadChatFile(file, "docx", network)).toEqual(bytes);
    expect(network).toHaveBeenCalledWith(new URL(file.download_url), expect.objectContaining({ redirect: "error" }));
  });
  it("rejects a conflicting specific MIME before downloading", async () => {
    const network = vi.fn();
    await expect(downloadChatFile({ ...file, mime_type: "application/pdf" }, "docx", network)).rejects.toMatchObject({ code: "FILE_TYPE_MISMATCH" });
    expect(network).not.toHaveBeenCalled();
  });
  it("recognizes a Word OLE directory, rejects generic OLE and cycles", async () => {
    await expect(validateClientFileBytes(legacyDoc(), "doc")).resolves.toBeUndefined();
    await expect(validateClientFileBytes(legacyDoc("Workbook"), "doc")).rejects.toMatchObject({ code: "INVALID_DOC" });
    const cycle = legacyDoc(); new DataView(cycle.buffer).setUint32(516, 1, true);
    await expect(validateClientFileBytes(cycle, "doc")).rejects.toMatchObject({ code: "INVALID_DOC" });
  });
  it("rejects DOCX renamed to DOC and PDF renamed to DOCX", async () => {
    await expect(validateClientFileBytes(await docx(), "doc")).rejects.toMatchObject({ code: "INVALID_DOC" });
    await expect(validateClientFileBytes(new TextEncoder().encode("%PDF-1.7\n%%EOF"), "docx")).rejects.toMatchObject({ code: "INVALID_DOCX" });
  });
  it.each([
    `<Types><Override PartName="/word/document.xml" ContentType="application/vnd.ms-word.document.macroEnabled.main+xml"/></Types>`,
    `<Types><Override PartName="/xl/workbook.xml" ContentType="${mainType}"/></Types>`,
    `<!DOCTYPE x [<!ENTITY x SYSTEM 'file:///private'>]><Types/>`,
  ])("rejects mismatched or active content-type manifest", async manifest => {
    await expect(validateClientFileBytes(await docx(manifest), "docx")).rejects.toMatchObject({ code: "INVALID_DOCX" });
  });
  it("rejects a hidden VBA project in a renamed DOCM", async () => {
    await expect(validateClientFileBytes(await docx(undefined, "word/vbaProject.bin"), "docx")).rejects.toMatchObject({ code: "INVALID_DOCX" });
  });
  it("rejects generic ZIP and truncated archives", async () => {
    const zip = await new JSZip().file("x.txt", "ordinary archive").generateAsync({ type: "uint8array" });
    await expect(validateClientFileBytes(zip, "docx")).rejects.toMatchObject({ code: "INVALID_DOCX" });
    const bytes = await docx();
    await expect(validateClientFileBytes(bytes.subarray(0, bytes.length - 1), "docx")).rejects.toMatchObject({ code: "INVALID_DOCX" });
  });
  it("rejects a manifest bomb before inflation and bounds falsely declared output", async () => {
    const bytes = await docx("x".repeat(600 * 1024));
    await expect(validateClientFileBytes(bytes, "docx")).rejects.toMatchObject({ code: "INVALID_DOCX" });
    const view = new DataView(bytes.buffer);
    for (let p = 0; p < bytes.length - 46; p++) {
      if (view.getUint32(p, true) === 0x02014b50) { view.setUint32(p + 24, 10, true); break; }
    }
    await expect(validateClientFileBytes(bytes, "docx")).rejects.toMatchObject({ code: "INVALID_DOCX" });
  });
});

describe("Word file archive writes", () => {
  it.each(["doc", "docx"] as const)("stores original .%s with canonical MIME and immutable request path", async extension => {
    const bytes = extension === "doc" ? legacyDoc() : await docx();
    const results = [{ id: input.clientId }, null];
    const upload = vi.fn().mockResolvedValue({ error: null });
    const rpc = vi.fn().mockResolvedValue({ data: { file: { id: "saved", content_type: CLIENT_FILE_MIME[extension] }, replayed: false }, error: null });
    const db = {
      from: () => {
        const data = results.shift(); const chain: Record<string, unknown> = {};
        for (const method of ["select", "eq", "maybeSingle"]) chain[method] = () => chain;
        chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error: null }).then(resolve);
        return chain;
      }, storage: { from: () => ({ upload }) }, rpc,
    } as unknown as SupabaseClient;
    const result = await new CrmClientFilesService(db, "actor", vi.fn().mockResolvedValue(new Response(new Uint8Array(bytes).buffer))).importFile({ ...input, fileName: `Договор.${extension}` });
    expect(upload).toHaveBeenCalledWith(`${input.clientId}/${input.requestId}.${extension}`, bytes, { contentType: CLIENT_FILE_MIME[extension], upsert: false });
    expect(rpc).toHaveBeenCalledWith("crm_register_client_file", expect.objectContaining({ p_file_name: `Договор.${extension}`, p_file_size: bytes.length }));
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("private");
    expect(result).toMatchObject({ status: "saved", kind: "original_word", sent: false });
  });
});
