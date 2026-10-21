import { beforeAll, describe, expect, it, vi } from "vitest";
import { FrdoCatalogError, type FrdoTemplate } from "../../supabase/functions/_shared/crm-frdo/catalog";
import { sha256 } from "../../supabase/functions/_shared/crm-email/delivery";
import { SmtpDeliveryError } from "../../supabase/functions/_shared/crm-email/smtp";
import {
  checkedFrdoDelivery, createFrdoEmailHandler, defaultFrdoBody, dispatchFrdoDelivery,
  frdoDatabaseError, FrdoOperationError, frdoStoragePath, prepareFrdoAttachments, publicFrdoDelivery,
  type FrdoDelivery, type FrdoDeliveryDependencies, type FrdoHandlerRuntime, type FrdoState,
} from "../../supabase/functions/_shared/crm-frdo/delivery";

const ID = "12345678-1234-4234-8234-123456789abc";
const ACTOR = "23456789-1234-4234-8234-123456789abc";
const CLIENT = "34567890-1234-4234-8234-123456789abc";
const OTHER = "45678901-1234-4234-8234-123456789abc";
const PDF = new TextEncoder().encode("%PDF-1.7\nsynthetic original, no customer data\n%%EOF");
const ZIP = new Uint8Array([0x50, 0x4b, 3, 4, 0, 0, 12, 23, 34]);
let catalog: FrdoTemplate[];
beforeAll(async () => {
  catalog = [
    { id: "prikaz-pdf", revision: 1, label: "Приказ", fileName: "Prikaz.pdf", contentType: "application/pdf", size: PDF.length, sha256: await sha256(PDF), url: "https://original.example/Prikaz.pdf" },
    { id: "dpo-template", revision: 1, label: "ДПО", fileName: "DPO.xlsx", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: ZIP.length, sha256: await sha256(ZIP), url: "https://original.example/DPO.xlsx" },
    { id: "terms", revision: 1, label: "Соглашение", fileName: "terms.pdf", contentType: "application/pdf", size: PDF.length, sha256: await sha256(PDF), url: "https://original.example/terms.pdf" },
  ];
});
function resolve(id: string, revision: number) {
  const item = catalog.find(item => item.id === id && item.revision === revision);
  if (!item) throw new FrdoCatalogError("CRM_FRDO_TEMPLATE_NOT_FOUND");
  return item;
}
function fixture(state: FrdoState = "prepared", ids = ["prikaz-pdf"]): FrdoDelivery {
  const items = ids.map(id => resolve(id, 1));
  return {
    id: ID, request_id: ID, actor_id: ACTOR, client_id: CLIENT, recipient: "customer@example.org",
    subject: "Приказ ФИС ФРДО — Тестовая организация", body: defaultFrdoBody(items), state,
    message_id: `<crm-frdo-${ID}@24zxc.ru>`,
    client_snapshot: { id: CLIENT, name: "Тестовая организация", inn: "1234567890", email: "customer@example.org", crm_revision: 7 },
    templates: items.map(item => ({ templateId: item.id, revision: item.revision, label: item.label, filename: item.fileName,
      sha256: item.sha256, size: item.size, contentType: item.contentType, ext: item.fileName.split(".").pop()!, sourceUrl: item.url })),
    attachments: state === "preparing" ? [] : items.map(item => ({ templateId: item.id, revision: item.revision,
      filename: item.fileName, path: frdoStoragePath(ID, item), sha256: item.sha256, size: item.size, contentType: item.contentType })),
  };
}
function setup(initial = fixture()) {
  let row = structuredClone(initial);
  const stored = new Map<string, Uint8Array>(row.attachments.map(file => [file.path, file.contentType === "application/pdf" ? PDF : ZIP]));
  const deps: FrdoDeliveryDependencies = {
    resolve,
    fetchTemplate: vi.fn(async ref => ref.id === "dpo-template" ? ZIP : PDF),
    upload: vi.fn(async (path, bytes) => { stored.set(path, bytes); }),
    download: vi.fn(async path => { const bytes = stored.get(path); if (!bytes) throw new Error("missing"); return bytes; }),
    finalize: vi.fn(async (_id, _actor, attachments) => { row = { ...row, attachments, state: "prepared" }; return row; }),
    claim: vi.fn(async () => {
      if (row.state !== "prepared") return { claimed: false, delivery: row };
      row = { ...row, state: "sending" }; return { claimed: true, delivery: row };
    }),
    finish: vi.fn(async (_id, _actor, state) => { row = { ...row, state }; return row; }),
    send: vi.fn(async () => ({ receipt: "250 2.0.0 queued synthetic" })),
  };
  const user = {
    authenticate: vi.fn(async () => ACTOR as string | null), isAdmin: vi.fn(async () => true),
    prepare: vi.fn(async (_args: Record<string, unknown>) => ({ delivery: row, replayed: false })),
    findDelivery: vi.fn(async () => row as unknown),
    signDownload: vi.fn(async (path: string, _filename: string) => `https://storage.example/storage/v1/object/sign/contracts/${path}?token=synthetic`),
  };
  const runtime: FrdoHandlerRuntime = {
    user: vi.fn(() => user), worker: vi.fn(() => deps), resolve, fetchTemplate: deps.fetchTemplate,
    isSignedDownload: (url, path) => url === `https://storage.example/storage/v1/object/sign/contracts/${path}?token=synthetic`,
  };
  const handler = createFrdoEmailHandler(runtime);
  return { deps, user, runtime, handler, stored, getRow: () => row, setRow: (value: FrdoDelivery) => { row = value; } };
}
const request = (input: unknown, authorization: string | null = "Bearer synthetic-token") => new Request("https://edge.example/crm-frdo-email", {
  method: "POST", headers: authorization ? { authorization, "content-type": "application/json" } : {}, body: typeof input === "string" ? input : JSON.stringify(input),
});
const prepareInput = () => ({ action: "prepare", requestId: ID, clientId: CLIENT, expectedClientRevision: 7, expectedInn: "1234567890",
  templates: [{ templateId: "prikaz-pdf", revision: 1, sha256: catalog[0].sha256 }] });
const sendInput = () => ({ action: "send", deliveryId: ID, expectedRecipient: "customer@example.org" });

describe("FRDO frozen original packages", () => {
  it("stores DOCX/PDF/XLSX originals at pinned immutable paths without conversion", async () => {
    const state = setup(fixture("preparing", ["prikaz-pdf", "dpo-template"]));
    const result = await prepareFrdoAttachments(state.getRow(), state.deps);
    expect(result.state).toBe("prepared");
    expect(result.attachments.map(file => file.filename)).toEqual(["Prikaz.pdf", "DPO.xlsx"]);
    expect(state.deps.upload).toHaveBeenCalledWith(frdoStoragePath(ID, catalog[1]), ZIP, catalog[1].contentType);
    expect(state.stored.get(result.attachments[0].path)).toEqual(PDF);
    expect(state.deps.send).not.toHaveBeenCalled();
  });
  it.each(["prepared", "sending", "smtp_accepted", "failed", "unknown"] as FrdoState[])("prepare replay in %s performs no storage, fetch or SMTP writes", async state => {
    const test = setup(fixture(state));
    expect((await prepareFrdoAttachments(test.getRow(), test.deps)).state).toBe(state);
    expect(test.deps.fetchTemplate).not.toHaveBeenCalled();
    expect(test.deps.upload).not.toHaveBeenCalled();
    expect(test.deps.finalize).not.toHaveBeenCalled();
    expect(test.deps.send).not.toHaveBeenCalled();
  });
  it("leaves preparation retryable with the same request when original download fails", async () => {
    const test = setup(fixture("preparing"));
    vi.mocked(test.deps.fetchTemplate).mockRejectedValueOnce(new Error("temporary origin error"));
    await expect(prepareFrdoAttachments(test.getRow(), test.deps)).rejects.toThrow();
    expect(test.getRow().state).toBe("preparing");
    expect(test.deps.finalize).not.toHaveBeenCalled();
    expect((await prepareFrdoAttachments(test.getRow(), test.deps)).state).toBe("prepared");
    expect(test.getRow().id).toBe(ID);
  });
  it.each(["same-sized modified bytes", "oversized file", "wrong magic"])("rejects %s before storage or SMTP", async kind => {
    const test = setup(fixture("preparing"));
    const bytes = kind === "oversized file" ? new Uint8Array(10 * 1024 * 1024 + 1) : PDF.slice();
    bytes[kind === "wrong magic" ? 0 : 10] ^= 1;
    vi.mocked(test.deps.fetchTemplate).mockResolvedValue(bytes);
    await expect(prepareFrdoAttachments(test.getRow(), test.deps)).rejects.toThrow("CRM_FRDO_ATTACHMENT_INTEGRITY_FAILED");
    expect(test.deps.upload).not.toHaveBeenCalled();
    expect(test.deps.send).not.toHaveBeenCalled();
  });
  it.each(["sourceUrl", "sha256", "filename", "contentType", "size", "ext"])("does not trust changed DB manifest %s", key => {
    const row = fixture();
    const raw = structuredClone(row) as unknown as { templates: Record<string, unknown>[] };
    raw.templates[0][key] = key === "size" ? 100 : "https://attacker.example/payload";
    expect(() => checkedFrdoDelivery(raw, resolve)).toThrow();
  });
  it.each(["path", "sha256", "revision", "filename", "contentType", "size"])("rejects changed attachment %s", key => {
    const raw = structuredClone(fixture()) as unknown as { attachments: Record<string, unknown>[] };
    raw.attachments[0][key] = key === "size" || key === "revision" ? 999 : "untrusted";
    expect(() => checkedFrdoDelivery(raw, resolve)).toThrow();
  });
  it("requires a complete bijection, fixed actor/id/message ID and no duplicate templates", () => {
    const missing = fixture(); missing.attachments = [];
    const duplicate = fixture(); duplicate.templates.push(duplicate.templates[0]);
    const wrongMessage = fixture(); wrongMessage.message_id = `<new-random-id@example.org>`;
    const wrongRequest = fixture(); wrongRequest.request_id = OTHER;
    const duplicateAttachment = fixture(); duplicateAttachment.attachments.push(duplicateAttachment.attachments[0]);
    for (const row of [missing, duplicate, wrongMessage, wrongRequest, duplicateAttachment]) expect(() => checkedFrdoDelivery(row, resolve)).toThrow();
    expect(() => checkedFrdoDelivery(fixture(), resolve, { actor: OTHER })).toThrow();
    expect(() => checkedFrdoDelivery(fixture(), resolve, { id: OTHER })).toThrow();
  });
  it("removes secrets and provider diagnostics from every public field", () => {
    const raw = Object.assign(fixture(), { error: "password=SECRET", receipt: { smtpResponse: "SECRET" }, access: "SECRET", client: { password: "SECRET" } });
    Object.assign(raw.client_snapshot, { password_dpo: "SECRET", frdo_login: "SECRET" });
    Object.assign(raw.templates[0], { password_po: "SECRET" });
    const result = publicFrdoDelivery(checkedFrdoDelivery(raw, resolve));
    const json = JSON.stringify(result);
    expect(json).not.toContain("SECRET");
    expect(json).not.toContain("sourceUrl"); expect(json).not.toContain("path");
    expect(json).not.toContain("client_snapshot"); expect(json).not.toContain("receipt");
    expect(result.recipientDeliveryConfirmed).toBe(false); expect(result.retryAllowed).toBe(false);
  });
});

describe("FRDO SMTP certainty and idempotency", () => {
  it("submits frozen bytes exactly once across concurrent/repeated sends with a stable Message-ID", async () => {
    const test = setup();
    const results = await Promise.all([dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps), dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps)]);
    expect(results.some(row => row.state === "smtp_accepted")).toBe(true);
    expect(test.deps.send).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(test.deps.send).mock.calls[0][0];
    expect(sent.messageId).toBe(`<crm-frdo-${ID}@24zxc.ru>`);
    expect(new Uint8Array(Buffer.from(sent.attachments[0].base64, "base64"))).toEqual(PDF);
    expect(sent.to).toBe("customer@example.org");
    await dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps);
    expect(test.deps.send).toHaveBeenCalledTimes(1);
  });
  it.each(["preparing", "sending", "smtp_accepted", "failed", "unknown"] as FrdoState[])("never resends a %s delivery", async state => {
    const test = setup(fixture(state));
    const result = await dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps);
    expect(result.state).toBe(state);
    expect(test.deps.download).not.toHaveBeenCalled(); expect(test.deps.send).not.toHaveBeenCalled();
  });
  it("checks immutable stored bytes again before opening SMTP", async () => {
    const test = setup(); const damaged = PDF.slice(); damaged[15] ^= 1;
    test.stored.set(test.getRow().attachments[0].path, damaged);
    expect((await dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps)).state).toBe("failed");
    expect(test.deps.send).not.toHaveBeenCalled();
    expect(test.deps.finish).toHaveBeenCalledWith(ID, ACTOR, "failed", null, "FRDO_DELIVERY_FAILED");
  });
  it.each([
    [new SmtpDeliveryError("failed", "SMTP_REJECTED"), "failed", "FRDO_SMTP_REJECTED"],
    [new SmtpDeliveryError("unknown", "SMTP_TIMEOUT"), "unknown", "FRDO_SMTP_UNKNOWN"],
    [new Error("connection closed after DATA; private provider details"), "unknown", "FRDO_SMTP_UNKNOWN"],
  ])("classifies transport uncertainty conservatively", async (error, expected, code) => {
    const test = setup(); vi.mocked(test.deps.send).mockRejectedValue(error);
    expect((await dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps)).state).toBe(expected);
    expect(test.deps.finish).toHaveBeenCalledWith(ID, ACTOR, expected, null, code);
    await dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps);
    expect(test.deps.send).toHaveBeenCalledTimes(1);
  });
  it("SMTP accepted plus failed journal write stays unknown and cannot resend", async () => {
    const test = setup();
    vi.mocked(test.deps.finish).mockRejectedValue(new Error("database failed with credentials=SECRET"));
    const result = await dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps);
    expect(result.state).toBe("unknown");
    expect(test.getRow().state).toBe("sending");
    expect(JSON.stringify(publicFrdoDelivery(result))).not.toContain("SECRET");
    await dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps);
    expect(test.deps.send).toHaveBeenCalledTimes(1);
  });
  it("persists uncertainty with no invented receipt after the acceptance journal attempt failed", async () => {
    const test = setup();
    vi.mocked(test.deps.finish).mockRejectedValueOnce(new Error("journal temporarily unavailable"));
    const result = await dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps);
    expect(result.state).toBe("unknown");
    expect(test.deps.finish).toHaveBeenLastCalledWith(ID, ACTOR, "unknown", null, "FRDO_SMTP_UNKNOWN");
    expect(test.getRow().state).toBe("unknown");
    await dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps);
    expect(test.deps.send).toHaveBeenCalledTimes(1);
  });
  it("does not invent a 250 receipt if a transport resolves with malformed acceptance", async () => {
    const test = setup(); vi.mocked(test.deps.send).mockResolvedValue({ receipt: "provider internal SECRET" });
    expect((await dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps)).state).toBe("unknown");
    expect(test.deps.finish).toHaveBeenCalledWith(ID, ACTOR, "unknown", null, "FRDO_SMTP_UNKNOWN");
  });
  it("rechecks recipient/actor from the claimed row before SMTP", async () => {
    const test = setup();
    vi.mocked(test.deps.claim).mockResolvedValue({ claimed: true, delivery: { ...fixture("sending"), recipient: "changed@example.org" } });
    await expect(dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps)).rejects.toThrow("CRM_RECIPIENT_CHANGED");
    expect(test.deps.send).not.toHaveBeenCalled();
    vi.mocked(test.deps.claim).mockResolvedValue({ claimed: true, delivery: { ...fixture("sending"), actor_id: OTHER } });
    await expect(dispatchFrdoDelivery(ID, ACTOR, "customer@example.org", test.deps)).rejects.toThrow();
    expect(test.deps.send).not.toHaveBeenCalled();
  });
  it("escapes caller plaintext instead of rendering it as HTML", async () => {
    const row = fixture(); row.body = "<img src=x onerror=alert(1)> & text\nsecond line";
    const test = setup(row); await dispatchFrdoDelivery(ID, ACTOR, row.recipient, test.deps);
    expect(vi.mocked(test.deps.send).mock.calls[0][0].html).toContain("&lt;img src=x onerror=alert(1)&gt; &amp; text\nsecond line");
  });
});

describe("FRDO authenticated edge boundary", () => {
  it("preflights and rejects non-POST without accessing auth, worker or SMTP", async () => {
    const test = setup();
    expect((await test.handler(new Request("https://edge.example", { method: "OPTIONS" }))).status).toBe(204);
    expect((await test.handler(new Request("https://edge.example"))).status).toBe(405);
    expect(test.runtime.user).not.toHaveBeenCalled(); expect(test.runtime.worker).not.toHaveBeenCalled();
  });
  it("requires exact verified JWT and then admin before parsing or privileged actions", async () => {
    const test = setup();
    expect((await test.handler(request("invalid JSON", null))).status).toBe(401);
    expect(test.runtime.user).not.toHaveBeenCalled();
    test.user.authenticate.mockResolvedValueOnce(null);
    expect((await test.handler(request("invalid JSON"))).status).toBe(401);
    expect(test.user.isAdmin).not.toHaveBeenCalled();
    test.user.isAdmin.mockResolvedValueOnce(false);
    expect((await test.handler(request("invalid JSON"))).status).toBe(403);
    expect(test.user.authenticate).toHaveBeenCalledWith("synthetic-token");
    expect(test.user.isAdmin).toHaveBeenCalledWith(ACTOR);
    expect(test.runtime.worker).not.toHaveBeenCalled(); expect(test.user.prepare).not.toHaveBeenCalled();
    expect(test.user.findDelivery).not.toHaveBeenCalled(); expect(test.deps.fetchTemplate).not.toHaveBeenCalled();
  });
  it("status reads own row and signs checked paths without a worker or write", async () => {
    const test = setup(fixture("smtp_accepted"));
    const result = await (await test.handler(request({ action: "status", deliveryId: ID }))).json();
    expect(test.user.findDelivery).toHaveBeenCalledWith(ID, ACTOR);
    expect(result.smtpAccepted).toBe(true); expect(result.recipientDeliveryConfirmed).toBe(false);
    expect(result.downloads[0]).toMatchObject({ templateId: "prikaz-pdf", revision: 1, filename: "Prikaz.pdf", expiresInSeconds: 600 });
    expect(test.runtime.worker).not.toHaveBeenCalled(); expect(test.user.prepare).not.toHaveBeenCalled();
  });
  it("omits malicious/unavailable signed links while preserving known SMTP result", async () => {
    const test = setup(fixture("smtp_accepted")); test.user.signDownload.mockResolvedValue("https://evil.example/customer-secret");
    const result = await (await test.handler(request({ action: "status", deliveryId: ID }))).json();
    expect(result.downloads).toEqual([]); expect(result.smtpAccepted).toBe(true);
    test.user.signDownload.mockRejectedValue(new Error("internal"));
    expect((await (await test.handler(request({ action: "status", deliveryId: ID }))).json()).smtpAccepted).toBe(true);
  });
  it("getTemplate verifies registered bytes and returns only canonical metadata, without persistence", async () => {
    const test = setup();
    const result = await (await test.handler(request({ action: "getTemplate", templateId: "prikaz-pdf", revision: 1 }))).json();
    expect(result).toEqual({ template: { templateId: "prikaz-pdf", revision: 1, label: "Приказ", filename: "Prikaz.pdf",
      contentType: "application/pdf", size: PDF.length, sha256: catalog[0].sha256, url: catalog[0].url }, verified: true, saved: false, sent: false });
    expect(test.runtime.worker).not.toHaveBeenCalled(); expect(test.user.findDelivery).not.toHaveBeenCalled();
    expect(test.user.prepare).not.toHaveBeenCalled();
  });
  it("getTemplate never returns a verified URL if registered bytes changed", async () => {
    const test = setup(); vi.mocked(test.deps.fetchTemplate).mockResolvedValue(ZIP);
    const response = await test.handler(request({ action: "getTemplate", templateId: "prikaz-pdf", revision: 1 }));
    expect(response.status).toBe(400); expect(await response.text()).not.toContain(catalog[0].url);
  });
  it("routes the complete client identity/revision, pinned refs and safe defaults to prepare", async () => {
    const test = setup(fixture("preparing"));
    const result = await (await test.handler(request(prepareInput()))).json();
    expect(test.user.prepare).toHaveBeenCalledWith({ p_request_id: ID, p_client_id: CLIENT, p_expected_client_revision: 7,
      p_expected_inn: "1234567890", p_templates: prepareInput().templates, p_recipient: null, p_subject: null, p_body: defaultFrdoBody([catalog[0]]) });
    expect(result.state).toBe("prepared"); expect(result.replayed).toBe(false);
    expect(test.runtime.worker).toHaveBeenCalledTimes(1); expect(test.deps.send).not.toHaveBeenCalled();
    expect(test.user.authenticate.mock.invocationCallOrder[0]).toBeLessThan(test.user.isAdmin.mock.invocationCallOrder[0]);
    expect(test.user.isAdmin.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(test.runtime.worker).mock.invocationCallOrder[0]);
  });
  it("preparation replay returns historical acceptance with replayed=true and no worker/fetch/SMTP", async () => {
    const test = setup(fixture("smtp_accepted"));
    test.user.prepare.mockResolvedValue({ delivery: test.getRow(), replayed: true });
    const result = await (await test.handler(request(prepareInput()))).json();
    expect(result.replayed).toBe(true); expect(result.smtpAccepted).toBe(true);
    expect(test.runtime.worker).not.toHaveBeenCalled(); expect(test.deps.fetchTemplate).not.toHaveBeenCalled();
    expect(test.deps.send).not.toHaveBeenCalled();
  });
  it("supports explicit expectedInn:null only when the frozen client really lacks an INN", async () => {
    const row = fixture(); row.client_snapshot.inn = null;
    const test = setup(row);
    expect((await test.handler(request({ ...prepareInput(), expectedInn: null }))).status).toBe(200);
    expect(test.user.prepare.mock.calls[0][0].p_expected_inn).toBeNull();
    expect((await test.handler(request(prepareInput()))).status).toBe(400);
  });
  it("canonicalizes the confirmed mailbox and subject while preserving body text", async () => {
    const row = fixture(); row.subject = "My subject"; row.body = "  line one\nline two\tend  ";
    const test = setup(row);
    const response = await test.handler(request({ ...prepareInput(), recipient: "Customer@Example.Org", subject: `  ${row.subject}  `, body: row.body }));
    expect(response.status).toBe(200);
    expect(test.user.prepare.mock.calls[0][0]).toMatchObject({ p_recipient: "customer@example.org", p_subject: row.subject, p_body: row.body });
    expect((await test.handler(request({ ...sendInput(), expectedRecipient: "Customer@Example.Org" }))).status).toBe(200);
  });
  it.each([
    { expectedInn: undefined }, { expectedInn: " 1234567890" }, { expectedInn: "123" },
    { expectedClientRevision: 0 }, { expectedClientRevision: 1.5 }, { expectedClientRevision: Number.MAX_SAFE_INTEGER + 1 },
    { requestId: "bad" }, { clientId: "bad" }, { subject: "x\r\nBcc: evil@example.org" }, { body: "\0bad" },
    { recipient: "a@example.org,b@example.org" }, { recipient: "Display <a@example.org>" }, { recipient: null },
    { templates: [] }, { templates: [{ templateId: "prikaz-pdf", revision: 99, sha256: "0".repeat(64) }] },
    { url: "https://attacker.example/file" }, { attachments: [{ base64: "SECRET" }] },
  ])("rejects invalid prepare before any database mutation: %j", async override => {
    const test = setup();
    expect((await test.handler(request({ ...prepareInput(), ...override }))).status).toBe(400);
    expect(test.user.prepare).not.toHaveBeenCalled(); expect(test.runtime.worker).not.toHaveBeenCalled();
  });
  it("rejects duplicates, caller SHA changes and arbitrary ref fields", async () => {
    const ref = prepareInput().templates[0];
    for (const templates of [[ref, ref], [{ ...ref, sha256: "0".repeat(64) }], [{ ...ref, url: "https://attacker.example" }]]) {
      const test = setup();
      expect((await test.handler(request({ ...prepareInput(), templates }))).status).toBe(400);
      expect(test.user.prepare).not.toHaveBeenCalled();
    }
  });
  it.each(["revision", "inn", "client", "request", "body", "templates"])("rejects mismatched prepared receipt %s before worker", async kind => {
    const test = setup(); const raw = fixture();
    if (kind === "revision") raw.client_snapshot.crm_revision++;
    if (kind === "inn") raw.client_snapshot.inn = null;
    if (kind === "client") raw.client_id = OTHER;
    if (kind === "request") { raw.id = OTHER; raw.request_id = OTHER; raw.message_id = `<crm-frdo-${OTHER}@24zxc.ru>`; raw.attachments[0].path = frdoStoragePath(OTHER, catalog[0]); }
    if (kind === "body") raw.body = "changed body";
    if (kind === "templates") raw.templates = [];
    test.user.prepare.mockResolvedValue({ delivery: raw, replayed: false });
    expect((await test.handler(request(prepareInput()))).status).toBe(400);
    expect(test.runtime.worker).not.toHaveBeenCalled();
  });
  it("requires exact recipient confirmation before obtaining worker credentials", async () => {
    const test = setup();
    const result = await test.handler(request({ ...sendInput(), expectedRecipient: "someone@example.org" }));
    expect((await result.json()).code).toBe("CRM_RECIPIENT_CHANGED");
    expect(test.runtime.worker).not.toHaveBeenCalled(); expect(test.deps.claim).not.toHaveBeenCalled();
  });
  it("rejects actionless/malformed/oversized inputs before writes", async () => {
    const test = setup();
    for (const input of [{}, { action: "delete" }, null, [], "{bad", { action: "status", deliveryId: ID, url: "arbitrary" }]) {
      expect((await test.handler(request(input))).status).toBe(400);
    }
    expect((await test.handler(request("x".repeat(64 * 1024 + 1)))).status).toBe(413);
    expect(test.runtime.worker).not.toHaveBeenCalled(); expect(test.user.prepare).not.toHaveBeenCalled();
  });
  it("only returns fixed allowlisted errors even when exceptions contain credentials", async () => {
    const test = setup();
    for (const error of [new Error("CRM_CLIENT_NOT_FOUND password=SECRET"), new FrdoOperationError("CRM_SECRET_PASSWORD"), new FrdoCatalogError("CRM_SECRET_PASSWORD")]) {
      test.user.findDelivery.mockRejectedValueOnce(error);
      const output = await (await test.handler(request({ action: "status", deliveryId: ID }))).text();
      expect(output).not.toContain("SECRET"); expect(output).not.toContain("password");
      expect(JSON.parse(output).code).toBe("CRM_FRDO_EMAIL_OPERATION_FAILED");
    }
    test.user.prepare.mockImplementationOnce(async () => frdoDatabaseError({ message: "CRM_CLIENT_INN_CONFLICT", details: "SECRET" }));
    expect((await (await test.handler(request(prepareInput()))).json()).code).toBe("CRM_CLIENT_INN_CONFLICT");
    test.user.prepare.mockImplementationOnce(async () => frdoDatabaseError({ message: "CRM_CLIENT_INN_CONFLICT SECRET" }));
    const response = await (await test.handler(request(prepareInput()))).text();
    expect(JSON.parse(response).code).toBe("CRM_DATABASE_ERROR"); expect(response).not.toContain("SECRET");
  });
});
