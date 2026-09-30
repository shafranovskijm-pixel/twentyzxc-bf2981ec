import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CrmClientFilesService, downloadChatPdf, clientPdfName, validateChatFileUrl, MAX_CLIENT_PDF_BYTES, runClientFilesTool } from "../lib/mcp/client-files-service";

const actorId = "11111111-1111-4111-8111-111111111111";
const clientId = "22222222-2222-4222-8222-222222222222";
const requestId = "33333333-3333-4333-8333-333333333333";
const file = { download_url: "https://files.oaiusercontent.com/file-test?token=private", file_id: "file-test", file_name: "Исходный договор.pdf", mime_type: "application/pdf" };
const bytes = new TextEncoder().encode("%PDF-1.7\nSynthetic PDF bytes for transfer tests only\n%%EOF\n");
const input = { clientId, requestId, file };
const saved = { id: "saved-file", client_id: clientId, file_name: file.file_name, request_id: requestId, actor_id: actorId, source_file_id: file.file_id, description: null, file_path: `${clientId}/${requestId}.pdf` };
const fetcher = () => vi.fn<typeof fetch>().mockResolvedValue(new Response(bytes));
function dbMock(results: unknown[] = [{ id: clientId }, null]) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const storage = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    download: vi.fn().mockResolvedValue({ data: new Blob([bytes]), error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://storage.example.invalid/private-pdf" }, error: null }),
  };
  const db = {
    from: vi.fn((table: string) => {
      const value = results.shift(); const builder: Record<string, unknown> = {};
      for (const method of ["select", "eq", "order", "limit", "maybeSingle"]) builder[method] = (...args: unknown[]) => { calls.push({ table, method, args }); return builder; };
      builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve({ data: value, error: null }).then(resolve);
      return builder;
    }),
    storage: { from: vi.fn(() => storage) },
    rpc: vi.fn().mockResolvedValue({ data: { file: { id: saved.id, client_id: clientId }, replayed: false }, error: null }),
  };
  return { db: db as unknown as SupabaseClient, calls, storage, rpc: db.rpc };
}

describe("original PDF transfer boundary", () => {
  it.each(["http://files.oaiusercontent.com/f", "https://localhost/f", "https://127.0.0.1/f", "https://files.oaiusercontent.com.evil.example/f", "https://anything.blob.core.windows.net/f", "https://user:pass@files.oaiusercontent.com/f", "https://files.oaiusercontent.com:444/f", "data:application/pdf;base64,abc", "http://sdmntprpolandcentral.oaiusercontent.com/f", "https://sdmntprpolandcentral.oaiusercontent.com.evil.example/f", "https://oaiusercontent.com/f", "https://evil-oaiusercontent.com/f", "https://files.evil-oaiusercontent.com/f", "https://sdmntprpolandcentral.blob.core.windows.net/f", "https://sdmntprpolandcentral.oaiusercontent.com@evil.example/f", "https://sdmntprpolandcentral.oaiusercontent.com:444/f", "https://sdmntprpolandcentral.oaiusercontent.com/f#fragment", "https://192.168.1.1/f", "https://[::1]/f", "https://user.example/f"])("rejects unsupported source %s", source => {
    expect(() => validateChatFileUrl(source)).toThrow();
  });
  it.each(["files.oaiusercontent.com", "sdmntprpolandcentral.oaiusercontent.com", "sdmntprgermanywestcentral.oaiusercontent.com", "sub.region.oaiusercontent.com"])("accepts the documented file-host family: %s", async host => {
    const network = fetcher();
    const nativeFile = { ...file, download_url: `https://${host}/original.pdf?sig=private` };
    expect(await downloadChatPdf(nativeFile, network)).toEqual(bytes);
    expect(network).toHaveBeenCalledWith(new URL(nativeFile.download_url), expect.objectContaining({ redirect: "error", signal: expect.any(AbortSignal) }));
  });
  it("never follows a redirect returned by an allowed host, including a target in its query", async () => {
    const network = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { Location: "https://127.0.0.1/private" } }));
    const redirectingFile = { ...file, download_url: "https://sdmntprpolandcentral.oaiusercontent.com/file?redirect=https%3A%2F%2F127.0.0.1%2Fprivate" };
    await expect(downloadChatPdf(redirectingFile, network)).rejects.toMatchObject({ code: "FILE_DOWNLOAD_FAILED" });
    expect(network).toHaveBeenCalledTimes(1);
    expect(network).toHaveBeenCalledWith(new URL(redirectingFile.download_url), expect.objectContaining({ redirect: "error" }));
  });
  it("passes signed query privately, with redirects forbidden and a timeout", async () => {
    const network = fetcher();
    expect(await downloadChatPdf(file, network)).toEqual(bytes);
    expect(network).toHaveBeenCalledWith(new URL(file.download_url), expect.objectContaining({ redirect: "error", signal: expect.any(AbortSignal) }));
  });
  it("redacts download failures and never falls back to redirect-following", async () => {
    const network = vi.fn().mockRejectedValue(new Error("private-token=secret-123"));
    await expect(downloadChatPdf(file, network)).rejects.toMatchObject({ code: "FILE_DOWNLOAD_FAILED" });
    expect(network).toHaveBeenCalledTimes(1);
  });
  it("rejects oversized chunked body without trusting content length", async () => {
    const network = vi.fn().mockResolvedValue(new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_CLIENT_PDF_BYTES + 1)); controller.close(); } })));
    await expect(downloadChatPdf(file, network)).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });
  it.each(["<html>not a PDF</html>", "%PDF-1.7\ntruncated"])("rejects incomplete or non-PDF bytes", async content => {
    await expect(downloadChatPdf(file, vi.fn().mockResolvedValue(new Response(content)))).rejects.toMatchObject({ code: "INVALID_PDF" });
  });
  it.each(["../contract.pdf", "folder\\contract.pdf", "bad\nname.pdf", "contract.docx"])("rejects unsafe name %s", fileName => {
    expect(() => clientPdfName({ ...input, fileName })).toThrow();
  });
  it("requires auth before opening database or remote source", async () => {
    const result = await runClientFilesTool({ isAuthenticated: () => false } as never, async () => { throw new Error("must not call"); });
    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).toContain("UNAUTHORIZED");
  });
});

describe("client PDF persistence and idempotency", () => {
  it("normalizes UUID case to the same path used by PostgreSQL registration", async () => {
    const fake = dbMock();
    const id = "ABCDEF12-ABCD-4ABC-8ABC-ABCDEF123456";
    await new CrmClientFilesService(fake.db, actorId, fetcher()).importPdf({ ...input, requestId: id });
    expect(fake.storage.upload).toHaveBeenCalledWith(`${clientId}/${id.toLowerCase()}.pdf`, bytes, { contentType: "application/pdf", upsert: false });
  });
  it("persists unchanged original bytes and registers stable client ID, without URLs or credentials", async () => {
    const fake = dbMock(); const network = fetcher();
    const result = await new CrmClientFilesService(fake.db, actorId, network).importPdf(input);
    expect(fake.storage.upload).toHaveBeenCalledWith(`${clientId}/${requestId}.pdf`, bytes, { contentType: "application/pdf", upsert: false });
    expect(fake.rpc).toHaveBeenCalledWith("crm_register_client_file", expect.objectContaining({ p_client_id: clientId, p_request_id: requestId, p_file_name: file.file_name, p_file_size: bytes.length, p_sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(JSON.stringify(fake.rpc.mock.calls)).not.toContain("private");
    expect(result).toMatchObject({ status: "saved", sent: false, kind: "original_pdf" });
    expect(fake.calls.filter(c => c.method === "select").map(c => c.args[0])).not.toContain("*");
  });
  it("replays a committed request without requiring an expired source URL", async () => {
    const fake = dbMock([{ id: clientId }, saved]); const network = fetcher();
    const result = await new CrmClientFilesService(fake.db, actorId, network).importPdf({ ...input, file: { ...file, download_url: "expired" } });
    expect(result).toMatchObject({ replayed: true, file: { id: saved.id } });
    expect(network).not.toHaveBeenCalled(); expect(fake.storage.upload).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("source_file_id"); expect(JSON.stringify(result)).not.toContain("actor_id");
  });
  it.each([{ actor_id: "other" }, { client_id: "other" }, { source_file_id: "other" }, { file_name: "other.pdf" }, { description: "other" }])("rejects reused request with different operation %j", async difference => {
    const fake = dbMock([{ id: clientId }, { ...saved, ...difference }]); const network = fetcher();
    await expect(new CrmClientFilesService(fake.db, actorId, network).importPdf(input)).rejects.toMatchObject({ code: "CRM_REQUEST_CONFLICT" });
    expect(network).not.toHaveBeenCalled();
  });
  it("resumes after storage succeeded but DB save response was lost, verifying original hash", async () => {
    const fake = dbMock(); fake.storage.upload.mockResolvedValue({ error: { message: "already exists" } });
    const result = await new CrmClientFilesService(fake.db, actorId, fetcher()).importPdf(input);
    expect(fake.storage.download).toHaveBeenCalledWith(`${clientId}/${requestId}.pdf`);
    expect(result).toMatchObject({ status: "saved" });
  });
  it("does not overwrite a conflicting uploaded object", async () => {
    const fake = dbMock(); fake.storage.upload.mockResolvedValue({ error: { message: "already exists" } });
    fake.storage.download.mockResolvedValue({ data: new Blob(["different bytes"]), error: null });
    await expect(new CrmClientFilesService(fake.db, actorId, fetcher()).importPdf(input)).rejects.toMatchObject({ code: "FILE_UPLOAD_UNCONFIRMED" });
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("never reports saved without the CRM row ID", async () => {
    const fake = dbMock(); fake.rpc.mockResolvedValue({ data: {}, error: null });
    await expect(new CrmClientFilesService(fake.db, actorId, fetcher()).importPdf(input)).rejects.toMatchObject({ code: "FILE_SAVE_UNCONFIRMED" });
  });
  it("rejects missing client before any download or upload", async () => {
    const fake = dbMock([null]); const network = fetcher();
    await expect(new CrmClientFilesService(fake.db, actorId, network).importPdf(input)).rejects.toMatchObject({ code: "CLIENT_NOT_FOUND" });
    expect(network).not.toHaveBeenCalled(); expect(fake.storage.upload).not.toHaveBeenCalled();
  });
  it("checks both file and client IDs before producing a private signed URL", async () => {
    const fake = dbMock([{ id: clientId }, null]);
    await expect(new CrmClientFilesService(fake.db, actorId).get("other-file", clientId)).rejects.toMatchObject({ code: "FILE_NOT_FOUND" });
    expect(fake.calls).toContainEqual({ table: "client_files", method: "eq", args: ["client_id", clientId] });
    expect(fake.storage.createSignedUrl).not.toHaveBeenCalled();
  });
});
