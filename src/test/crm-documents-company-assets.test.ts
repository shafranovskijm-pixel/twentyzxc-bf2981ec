/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase fluent mocks and deliberately malformed boundary inputs. */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deflateSync } from "node:zlib";
import { PDFDict, PDFDocument, PDFName, PDFString, degrees } from "pdf-lib";
import {
  COMPANY_DOCUMENT_ASSETS, CrmCompanyAssetsService, companyAssetSha256, downloadCompanyAsset, runCompanyAssetsTool,
  type ApplyCompanyAssetsInput, type CompanyDocumentAsset,
} from "../lib/mcp/company-assets-service";

const actorId = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";
const artifactId = "33333333-3333-4333-8333-333333333333";
const nativeFile = { file_id: "file-synthetic-pdf", file_name: "Образец.pdf", mime_type: "application/pdf",
  download_url: "https://files.oaiusercontent.com/original.pdf?sig=PRIVATE_TOKEN" };
function signedLink(path: string, expires = 600) {
  const now = Math.floor(Date.now() / 1000);
  const token = [Buffer.from('{"alg":"HS256"}').toString("base64url"), Buffer.from(JSON.stringify({ iat: now, exp: now + expires })).toString("base64url"), "SYNTHETIC_SIGNATURE"].join(".");
  return `https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/sign/contracts/${path}?token=${token}`;
}
function png(red: number): Uint8Array {
  function crc(bytes: Buffer) {
    let value = 0xffffffff;
    for (const byte of bytes) { value ^= byte; for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (0xedb88320 & -(value & 1)); }
    return (value ^ 0xffffffff) >>> 0;
  }
  function chunk(type: string, data: Buffer) {
    const result = Buffer.alloc(12 + data.length); result.writeUInt32BE(data.length); result.write(type, 4); data.copy(result, 8);
    result.writeUInt32BE(crc(result.subarray(4, -4)), result.length - 4); return result;
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(2); header.writeUInt32BE(2, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.from([0, red, 0, 0, red, 0, 0, 0, red, 0, 0, red, 0, 0]))), chunk("IEND", Buffer.alloc(0))]);
}
async function sourcePdf(options: { rotated?: boolean; signed?: boolean; encrypted?: boolean; crop?: boolean; cropOutside?: boolean; invalidMedia?: boolean } = {}) {
  const doc = await PDFDocument.create(); doc.setCreationDate(new Date("2026-01-01T00:00:00Z")); doc.setModificationDate(new Date("2026-01-01T00:00:00Z"));
  const first = doc.addPage([300, 400]); first.drawText("SYNTHETIC ORIGINAL", { x: 30, y: 300 }); doc.addPage([200, 250]);
  if (options.rotated) first.setRotation(degrees(90));
  if (options.crop) first.setCropBox(10, 10, 280, 380);
  if (options.cropOutside) { first.setCropBox(0, 0, 300, 400); first.setMediaBox(0, 0, 100, 400); }
  if (options.invalidMedia) { first.setCropBox(0, 0, 300, 400); first.setMediaBox(0, 0, 20000, 400); }
  if (options.signed) {
    const field = doc.context.register(doc.context.obj({ FT: PDFName.of("Sig"), T: PDFString.of("SyntheticSignature") }));
    doc.catalog.set(PDFName.of("AcroForm"), doc.context.obj({ Fields: [field] }));
  }
  if (options.encrypted) doc.context.trailerInfo.Encrypt = doc.context.register(doc.context.obj({ Filter: PDFName.of("Standard") }));
  return doc.save();
}
function fakeDatabase() {
  const state: { row?: Record<string, any>; settings: unknown[]; error?: { message: string }; privateAllowed: boolean } = { privateAllowed: true, settings: [
    { key: "company_name", value: "Тестовый исполнитель" }, { key: "company_inn", value: "123456789012" },
  ] };
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const stored = new Map<string, Uint8Array>();
  const storage = {
    upload: vi.fn(async (path: string, bytes: Uint8Array, _options?: { contentType: string; upsert: boolean }) => { stored.set(path, Uint8Array.from(bytes)); return { error: null }; }),
    download: vi.fn(async (path: string) => ({ data: stored.has(path) ? new Blob([stored.get(path)! as BlobPart]) : null, error: null })),
    createSignedUrl: vi.fn(async (path: string, expires: number) => {
      return { data: { signedUrl: signedLink(path, expires) }, error: null };
    }),
  };
  const db = {
    from: vi.fn((table: string) => {
      const builder: any = {};
      for (const method of ["select", "eq", "in", "maybeSingle"]) builder[method] = (...args: unknown[]) => { calls.push({ table, method, args }); return builder; };
      builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === "site_settings" ? state.settings : state.row ?? null, error: state.error ?? null }).then(resolve);
      return builder;
    }),
    storage: { from: vi.fn((bucket: string) => { expect(bucket).toBe("contracts"); return storage; }) },
    rpc: vi.fn<(name: string, args?: any) => Promise<{ data: any; error: any }>>(async (name, args) => {
      if (name === "crm_check_signed_pdf_storage") return { data: state.privateAllowed, error: null };
      const request = args.p_request, artifact = args.p_artifact;
      const row = { id: artifactId, request_id: args.p_request_id, actor_id: actorId, request,
        source_file_id: request.sourceFileId, source_sha256: request.sourceSha256,
        output_sha256: artifact.sha256, output_size: artifact.size, storage_path: artifact.path,
        file_name: request.filename, page_count: artifact.pageCount, placements: request.placements,
        asset_hashes: request.assetHashes, created_at: "2026-10-21T00:00:00Z", secret_extra: "DO_NOT_RETURN" };
      state.row = row; return { data: { artifact: row, replayed: false }, error: null };
    }),
  };
  return { db: db as unknown as SupabaseClient, rpc: db.rpc, storage, stored, state, calls };
}
async function setup(options: Parameters<typeof sourcePdf>[0] = {}) {
  const source = await sourcePdf(options), signature = png(150), stamp = png(30);
  const assets: CompanyDocumentAsset[] = await Promise.all(COMPANY_DOCUMENT_ASSETS.map(async (item, index) => {
    const bytes = index ? stamp : signature;
    return { ...item, size: bytes.length, sha256: await companyAssetSha256(bytes), width: 2, height: 2 };
  }));
  const network = vi.fn<typeof fetch>(async input => {
    const url = String(input);
    if (url === assets[0].url) return new Response(Uint8Array.from(signature), { headers: { "content-type": "image/png" } });
    if (url === assets[1].url) return new Response(Uint8Array.from(stamp), { headers: { "content-type": "image/png" } });
    if (url === nativeFile.download_url) return new Response(Uint8Array.from(source), { headers: { "content-type": "application/pdf" } });
    throw new Error("UNEXPECTED NETWORK PRIVATE_TOKEN");
  });
  const fake = fakeDatabase();
  const api = new CrmCompanyAssetsService(fake.db, actorId, { fetcher: network, assets });
  const input: ApplyCompanyAssetsInput = { requestId, file: nativeFile, expectedSourceSha256: await companyAssetSha256(source),
    placements: [{ assetId: "signature", pageNumber: 1, x: 20, y: 20, width: 80, height: 30 },
      { assetId: "stamp", pageNumber: 2, x: 50, y: 60, width: 40, height: 40 }],
    expectedAssetHashes: Object.fromEntries(assets.map(asset => [asset.id, asset.sha256])) };
  return { api, input, source, signature, stamp, assets, network, ...fake };
}

describe("original company assets", () => {
  it("pins only the two original supplier PNGs and verifies bytes before reporting availability", async () => {
    expect(COMPANY_DOCUMENT_ASSETS.map(asset => asset.url)).toEqual(["https://24zxc.ru/images/signature.png", "https://24zxc.ru/images/stamp.png"]);
    const f = await setup(); f.state.settings.push({ key: "smtp_password", value: "DO_NOT_RETURN" });
    const result = await f.api.getAssets();
    expect(result).toMatchObject({ supplier: { name: "Тестовый исполнитель", inn: "123456789012" }, saved: false, sent: false, cryptographicSignature: false });
    expect(result.assets.every(asset => asset.role === "supplier")).toBe(true);
    expect(JSON.stringify(result)).not.toContain("DO_NOT_RETURN");
    expect(f.calls).toContainEqual({ table: "site_settings", method: "in", args: ["key", ["company_name", "company_inn"]] });
  });
  it.each(["image/jpeg", "text/html"])("rejects a substituted MIME %s", async mime => {
    const f = await setup();
    await expect(downloadCompanyAsset(f.assets[0], vi.fn().mockResolvedValue(new Response(Uint8Array.from(f.signature), { headers: { "content-type": mime } })))).rejects.toMatchObject({ code: "CRM_COMPANY_ASSET_INVALID" });
  });
  it("rejects changed bytes, dimensions, redirects and oversized chunks", async () => {
    const f = await setup();
    const wrongHash = { ...f.assets[0], sha256: "a".repeat(64) };
    await expect(downloadCompanyAsset(wrongHash, f.network)).rejects.toMatchObject({ code: "CRM_COMPANY_ASSET_CHANGED" });
    await expect(downloadCompanyAsset({ ...f.assets[0], width: 3 }, f.network)).rejects.toMatchObject({ code: "CRM_COMPANY_ASSET_CHANGED" });
    await expect(downloadCompanyAsset(f.assets[0], vi.fn().mockResolvedValue(new Response(null, { status: 302 })))).rejects.toMatchObject({ code: "CRM_COMPANY_ASSET_UNAVAILABLE" });
    await expect(downloadCompanyAsset(f.assets[0], vi.fn().mockResolvedValue(new Response(new Uint8Array(1024 * 1024 + 1), { headers: { "content-type": "image/png" } })))).rejects.toMatchObject({ code: "CRM_COMPANY_ASSET_INVALID" });
  });
  it("redacts network exceptions", async () => {
    const f = await setup();
    await expect(downloadCompanyAsset(f.assets[0], vi.fn().mockRejectedValue(new Error("secret-token")))).rejects.not.toThrow("secret-token");
  });
});

describe("explicit PDF inspection and application", () => {
  it("inspects actual PDF page sizes and source hash without storing or signing", async () => {
    const f = await setup();
    expect(await f.api.inspectPdf(nativeFile)).toMatchObject({ sourceFileId: nativeFile.file_id, sourceSha256: f.input.expectedSourceSha256,
      pageCount: 2, pages: [{ pageNumber: 1, width: 300, height: 400, rotation: 0 }, { pageNumber: 2, width: 200, height: 250, rotation: 0 }],
      hasDigitalSignatures: false, saved: false, sent: false });
    expect(f.storage.upload).not.toHaveBeenCalled(); expect(f.rpc).not.toHaveBeenCalled();
  });
  it("renders real synthetic PNGs onto selected pages, preserves the original and saves a new immutable PDF", async () => {
    const f = await setup(), original = Uint8Array.from(f.source);
    const result = await f.api.applyToPdf(f.input);
    expect(result).toMatchObject({ status: "saved", saved: true, sent: false, replayed: false, cryptographicSignature: false,
      artifact: { id: artifactId, sourceSha256: f.input.expectedSourceSha256, pageCount: 2, fileName: "Образец_подписан.pdf" }, expiresInSeconds: 600 });
    expect(f.source).toEqual(original);
    expect(f.rpc).toHaveBeenCalledWith("crm_register_signed_pdf", expect.objectContaining({ p_request_id: requestId,
      p_request: expect.objectContaining({ sourceFileId: nativeFile.file_id, sourceSha256: f.input.expectedSourceSha256, placements: f.input.placements }) }));
    const [path, output, uploadOptions] = f.storage.upload.mock.calls[0];
    expect(path).toMatch(new RegExp("^crm-signed-pdfs/" + actorId + "/" + requestId + "/[a-f0-9]{64}\\.pdf$"));
    expect(uploadOptions).toEqual({ contentType: "application/pdf", upsert: false });
    const resultPdf = await PDFDocument.load(output);
    expect(resultPdf.getPageCount()).toBe(2);
    for (const page of resultPdf.getPages()) {
      expect(page.node.Resources()?.lookup(PDFName.of("XObject"), PDFDict)?.keys()).toHaveLength(1);
    }
    expect(JSON.stringify(f.rpc.mock.calls)).not.toContain("PRIVATE_TOKEN");
    expect(JSON.stringify(result)).not.toContain("DO_NOT_RETURN");
    expect(JSON.stringify(result)).not.toContain("storage_path");
  });
  it("supports a signature alone without adding a stamp or requiring its hash", async () => {
    const f = await setup();
    f.input.placements = [f.input.placements[0]]; f.input.expectedAssetHashes = { signature: f.assets[0].sha256 };
    await f.api.applyToPdf(f.input);
    expect(f.network.mock.calls.filter(([url]) => String(url) === f.assets[1].url)).toHaveLength(0);
  });
  it.each([
    ["empty", []],
    ["outside", [{ assetId: "signature", pageNumber: 1, x: 280, y: 20, width: 80, height: 30 }]],
    ["missing page", [{ assetId: "signature", pageNumber: 3, x: 20, y: 20, width: 80, height: 30 }]],
    ["negative", [{ assetId: "signature", pageNumber: 1, x: -1, y: 20, width: 80, height: 30 }]],
    ["nonfinite", [{ assetId: "signature", pageNumber: 1, x: NaN, y: 20, width: 80, height: 30 }]],
    ["unknown asset", [{ assetId: "customer", pageNumber: 1, x: 20, y: 20, width: 80, height: 30 }]],
    ["arbitrary URL", [{ assetId: "signature", pageNumber: 1, x: 20, y: 20, width: 80, height: 30, url: "https://evil.invalid/mark" }]],
  ])("rejects %s positions without upload", async (_label, placements) => {
    const f = await setup();
    await expect(f.api.applyToPdf({ ...f.input, placements: placements as any,
      expectedAssetHashes: { signature: f.assets[0].sha256 } })).rejects.toThrow();
    expect(f.storage.upload).not.toHaveBeenCalled();
  });
  it.each(["rotated", "signed", "encrypted", "crop", "cropOutside", "invalidMedia"] as const)("rejects %s PDF before uploading an altered copy", async kind => {
    const f = await setup({ [kind]: true });
    if (kind === "signed") expect((await f.api.inspectPdf(nativeFile)).hasDigitalSignatures).toBe(true);
    await expect(f.api.applyToPdf(f.input)).rejects.toMatchObject({ code: {
      rotated: "CRM_PDF_ROTATION_UNSUPPORTED", signed: "CRM_PDF_DIGITAL_SIGNATURE_PRESENT",
      encrypted: "CRM_PDF_ENCRYPTED", crop: "CRM_PDF_PAGE_GEOMETRY",
      cropOutside: "CRM_PDF_PAGE_GEOMETRY", invalidMedia: "CRM_PDF_PAGE_GEOMETRY",
    }[kind] });
    expect(f.storage.upload).not.toHaveBeenCalled();
  });
  it("requires both inspected source SHA and matching original asset SHA", async () => {
    const f = await setup();
    await expect(f.api.applyToPdf({ ...f.input, expectedSourceSha256: "a".repeat(64) })).rejects.toMatchObject({ code: "CRM_PDF_SOURCE_CHANGED" });
    await expect(f.api.applyToPdf({ ...f.input, expectedAssetHashes: {} })).rejects.toMatchObject({ code: "CRM_COMPANY_ASSET_HASH_REQUIRED" });
    await expect(f.api.applyToPdf({ ...f.input, expectedAssetHashes: { signature: "a".repeat(64), stamp: f.assets[1].sha256 } })).rejects.toMatchObject({ code: "CRM_COMPANY_ASSET_CHANGED" });
    expect(f.storage.upload).not.toHaveBeenCalled();
  });
  it("rejects unsupported attachment origins and never persists their signed URLs", async () => {
    const f = await setup();
    await expect(f.api.applyToPdf({ ...f.input, file: { ...nativeFile, download_url: "https://127.0.0.1/private" } })).rejects.toMatchObject({ code: "UNSUPPORTED_FILE_ORIGIN" });
    expect(f.network).not.toHaveBeenCalled();
    expect(f.storage.upload).not.toHaveBeenCalled();
  });
});

describe("signed PDF persistence and bounded replay", () => {
  it("checks private storage before fetching or uploading the source", async () => {
    const f = await setup(); f.state.privateAllowed = false;
    await expect(f.api.applyToPdf(f.input)).rejects.toMatchObject({ code: "CRM_PRIVATE_STORAGE_REQUIRED" });
    expect(f.network).not.toHaveBeenCalled(); expect(f.storage.upload).not.toHaveBeenCalled();
    expect(f.rpc).toHaveBeenCalledWith("crm_check_signed_pdf_storage", {});
  });
  it("renders identical bytes deterministically without adding clock metadata", async () => {
    const f = await setup(); const first = await f.api.applyToPdf(f.input);
    f.state.row = undefined;
    const second = await f.api.applyToPdf({ ...f.input, requestId: "44444444-4444-4444-8444-444444444444" });
    expect(first.artifact.sha256).toBe(second.artifact.sha256);
    expect(f.storage.upload.mock.calls[0][1]).toEqual(f.storage.upload.mock.calls[1][1]);
  });
  it("replays exact metadata without re-downloading expired native attachments or adding duplicate files", async () => {
    const f = await setup(); await f.api.applyToPdf(f.input); f.network.mockClear(); f.storage.upload.mockClear(); f.rpc.mockClear();
    const result = await f.api.applyToPdf({ ...f.input, file: { ...nativeFile, download_url: "expired" } });
    expect(result).toMatchObject({ replayed: true, artifact: { id: artifactId } });
    expect(f.network).not.toHaveBeenCalled(); expect(f.storage.upload).not.toHaveBeenCalled(); expect(f.rpc).not.toHaveBeenCalled();
    expect(f.calls).toContainEqual({ table: "crm_signed_pdfs", method: "eq", args: ["actor_id", actorId] });
  });
  it.each(["sourceFileId", "sourceSha256", "filename", "placements", "assetHashes"])("rejects replay with changed %s", async key => {
    const f = await setup(); await f.api.applyToPdf(f.input);
    f.state.row!.request = { ...f.state.row!.request, [key]: "different" }; f.network.mockClear();
    await expect(f.api.applyToPdf(f.input)).rejects.toMatchObject({ code: "CRM_REQUEST_CONFLICT" });
    expect(f.network).not.toHaveBeenCalled();
  });
  it("does not report saved without a confirmed registration receipt", async () => {
    const f = await setup(); f.rpc.mockImplementation(async name => ({ data: name === "crm_check_signed_pdf_storage" ? true : {}, error: null }));
    await expect(f.api.applyToPdf(f.input)).rejects.toMatchObject({ code: "CRM_SIGNED_PDF_UNCONFIRMED" });
  });
  it("does not overwrite a conflicting uploaded object", async () => {
    const f = await setup(); f.storage.upload.mockResolvedValue({ error: { message: "exists" } } as any);
    f.storage.download.mockResolvedValue({ data: new Blob(["different"]), error: null });
    await expect(f.api.applyToPdf(f.input)).rejects.toMatchObject({ code: "CRM_SIGNED_PDF_UPLOAD_UNCONFIRMED" });
    expect(f.rpc.mock.calls.every(([name]) => name === "crm_check_signed_pdf_storage")).toBe(true);
  });
  it("resumes after an upload receipt was lost by checking the existing exact hash", async () => {
    const f = await setup();
    f.storage.upload.mockImplementation(async (path, bytes) => {
      f.stored.set(path, Uint8Array.from(bytes)); return { error: { message: "upload response lost" } } as any;
    });
    expect(await f.api.applyToPdf(f.input)).toMatchObject({ saved: true });
    expect(f.storage.download).toHaveBeenCalledTimes(1); expect(f.rpc).toHaveBeenCalledTimes(2);
  });
  it("fetches only own registered output with a ten-minute link and rejects path substitution", async () => {
    const f = await setup(); await f.api.applyToPdf(f.input);
    const result = await f.api.getSignedPdf(artifactId);
    expect(result).toMatchObject({ artifact: { id: artifactId }, expiresInSeconds: 600 });
    expect(f.storage.createSignedUrl).toHaveBeenCalledWith(f.state.row!.storage_path, 600);
    f.state.row!.storage_path = "other-client/file.pdf";
    await expect(f.api.getSignedPdf(artifactId)).rejects.toMatchObject({ code: "CRM_SIGNED_PDF_UNCONFIRMED" });
  });
  it.each(["foreign origin", "different path", "extra query", "expired", "long lifetime", "malformed token"])("rejects a substituted link: %s", async kind => {
    const f = await setup(); await f.api.applyToPdf(f.input);
    let link = signedLink(f.state.row!.storage_path);
    if (kind === "foreign origin") link = link.replace("veedztdijmscebgadzyx.supabase.co", "evil.invalid");
    if (kind === "different path") link = signedLink("other-private-file.pdf");
    if (kind === "extra query") link += "&download=other.pdf";
    if (kind === "expired") link = signedLink(f.state.row!.storage_path, -1);
    if (kind === "long lifetime") link = signedLink(f.state.row!.storage_path, 3600);
    if (kind === "malformed token") link = link.replace(/token=.*/, "token=invalid");
    f.storage.createSignedUrl.mockResolvedValue({ data: { signedUrl: link }, error: null });
    await expect(f.api.getSignedPdf(artifactId)).rejects.toMatchObject({ code: "CRM_SIGNED_PDF_LINK_FAILED" });
  });
  it("never exposes a forged CRM_ database error code", async () => {
    const f = await setup(); f.state.error = { message: "CRM_PRIVATE_TOKEN_DO_NOT_RETURN" };
    await expect(f.api.applyToPdf(f.input)).rejects.toMatchObject({ code: "CRM_SIGNED_PDF_DATABASE_ERROR" });
    await expect(f.api.applyToPdf(f.input)).rejects.not.toThrow("DO_NOT_RETURN");
  });
  it("does not claim failure to preserve metadata is success or expose raw database errors", async () => {
    const f = await setup(); f.state.error = { message: "SQL password=DO_NOT_RETURN" };
    await expect(f.api.applyToPdf(f.input)).rejects.not.toThrow("DO_NOT_RETURN");
    expect(f.network).not.toHaveBeenCalled();
  });
  it("requires authentication before accessing source bytes or storage", async () => {
    const action = vi.fn(); const result = await runCompanyAssetsTool({ isAuthenticated: () => false } as never, action);
    expect(result).toMatchObject({ isError: true }); expect(result.content[0].text).toContain("UNAUTHORIZED"); expect(action).not.toHaveBeenCalled();
  });
});

