import { describe, expect, it, vi } from "vitest";
import { parseLegacyRecipients, sendSmtpEmail, sendSmtpEmailToRecipients, validateSmtpEmail, type SmtpConnection, type SmtpDependencies, type SmtpEmail } from "../../supabase/functions/_shared/crm-email/smtp";
import { authorizeLegacyEmail, requestBearer, type EmailAuthDatabase } from "../../supabase/functions/_shared/crm-email/legacy-auth";

const email: SmtpEmail = { to: "client@example.test", subject: "Документ № 1", html: "<p>Тестовый документ</p>", messageId: "delivery-1@24zxc.ru", attachments: [{ filename: "Счёт № 1.pdf", base64: "JVBERi0=", contentType: "application/pdf" }] };
const responses = () => ["220 greeting\r\n", "250-example.test\r\n250 AUTH LOGIN\r\n", "334 user\r\n", "334 password\r\n", "235 authenticated\r\n", "250 sender\r\n", "250 recipient\r\n", "354 go\r\n", "250 queued as test-receipt\r\n", "221 bye\r\n"];
function fake(responsesToRead: Array<string | null | "timeout"> = responses(), options: { failQuit?: boolean; failBody?: boolean; partialWrites?: boolean; port?: number } = {}) {
  const writes: string[] = [];
  const script = [...responsesToRead];
  let pending = "";
  const close = vi.fn();
  const connection: SmtpConnection = {
    close,
    async read(buffer) {
      if (!pending) {
        const next = script.shift();
        if (next === "timeout") return new Promise<number | null>(() => {});
        if (next === null || next === undefined) return null;
        pending = next;
      }
      const encoded = new TextEncoder().encode(pending);
      const length = Math.min(buffer.length, encoded.length);
      buffer.set(encoded.subarray(0, length));
      pending = new TextDecoder().decode(encoded.subarray(length));
      return length;
    },
    async write(buffer) {
      const length = options.partialWrites ? Math.min(7, buffer.length) : buffer.length;
      const text = new TextDecoder().decode(buffer.subarray(0, length));
      if (options.failQuit && text === "QUIT\r\n") throw new Error("secret provider detail");
      if (options.failBody && text.startsWith("From:")) throw new Error("secret provider detail");
      writes.push(text);
      return length;
    },
  };
  const connect = vi.fn(async () => connection);
  const startTls = vi.fn(async () => connection);
  const deps: SmtpDependencies = { config: { host: "smtp.example.test", port: options.port ?? 465, user: "sender@example.test", pass: "secret", from: "sender@example.test", fromName: "СИНТАГМА" }, connect, startTls, commandTimeoutMs: 30, acceptanceTimeoutMs: 10, totalTimeoutMs: 2000 };
  return { deps, writes, close, connect, startTls };
}

describe("SMTP acceptance boundary", () => {
  it("handles fragmented multiline replies and partial writes, preserving Message-ID and Cyrillic MIME headers", async () => {
    const source = responses();
    source.splice(0, 2, "220 greet", "ing\r\n", "250-example.test\r\n250-AUTH LOGIN\r\n250 ", "OK\r\n");
    const f = fake(source, { partialWrites: true });
    const subject = "Счёт для клиента. ".repeat(8);
    expect(await sendSmtpEmail({ ...email, subject }, f.deps)).toEqual({ receipt: "250 queued as test-receipt" });
    const written = f.writes.join("");
    expect(written).toContain("Message-ID: <delivery-1@24zxc.ru>\r\n");
    expect(written).toContain("\r\n.\r\nQUIT\r\n");
    const subjectHeader = written.match(/Subject: ([\s\S]*?)\r\nDate:/)![1];
    const decoded = [...subjectHeader.matchAll(/=\?UTF-8\?B\?([^?]+)\?=/g)].map(match => Buffer.from(match[1], "base64").toString("utf8")).join("");
    expect(decoded).toBe(subject);
    expect(decoded).not.toContain("�");
    expect(f.close).toHaveBeenCalledOnce();
  });
  it("requires STARTTLS before authentication on non-465 connections", async () => {
    const script = responses();
    script.splice(2, 0, "220 upgrade\r\n", "250 AUTH LOGIN\r\n");
    const f = fake(script, { port: 587 });
    await sendSmtpEmail(email, f.deps);
    expect(f.startTls).toHaveBeenCalledOnce();
    expect(f.writes.join("")).toContain("EHLO 24zxc.ru\r\nSTARTTLS\r\nEHLO 24zxc.ru\r\nAUTH LOGIN");
  });
  it("classifies a failure before DATA as safe to report failed without exposing provider details", async () => {
    const f = fake(["220 hi\r\n", "250 AUTH LOGIN\r\n", "535 password secret was rejected\r\n"]);
    await expect(sendSmtpEmail(email, f.deps)).rejects.toMatchObject({ outcome: "failed", code: "SMTP_REJECTED_AUTH_535", message: "SMTP_REJECTED_AUTH_535" });
    expect(f.writes.join("")).not.toContain("DATA\r\n");
  });
  it("classifies a greeting timeout before DATA as failed", async () => {
    const f = fake(["timeout"]);
    await expect(sendSmtpEmail(email, f.deps)).rejects.toMatchObject({ outcome: "failed", code: "SMTP_TIMEOUT_GREETING" });
    expect(f.close).toHaveBeenCalledOnce();
  });
  it("does not report a final response before CRLF completes it", async () => {
    const script = responses();
    script.splice(8, 2, "250 queued", "timeout");
    const f = fake(script);
    await expect(sendSmtpEmail(email, f.deps)).rejects.toMatchObject({ outcome: "unknown", code: "SMTP_TIMEOUT_ACCEPTANCE" });
  });
  it("classifies timeout after body submission as unknown, preventing an automatic duplicate", async () => {
    const script = responses();
    script.splice(8, 2, "timeout");
    const f = fake(script);
    await expect(sendSmtpEmail(email, f.deps)).rejects.toMatchObject({ outcome: "unknown", code: "SMTP_TIMEOUT_ACCEPTANCE" });
    expect(f.writes.join("")).toContain("\r\n.\r\n");
    expect(f.close).toHaveBeenCalledOnce();
  });
  it("treats a connection failure during body writing as unknown", async () => {
    const f = fake(responses(), { failBody: true });
    await expect(sendSmtpEmail(email, f.deps)).rejects.toMatchObject({ outcome: "unknown", code: "SMTP_CONNECTION_BODY" });
  });
  it("recognizes a complete DATA rejection as failed", async () => {
    const script = responses();
    script.splice(8, 2, "552 size rejected\r\n");
    await expect(sendSmtpEmail(email, fake(script).deps)).rejects.toMatchObject({ outcome: "failed", code: "SMTP_REJECTED_ACCEPTANCE_552" });
  });
  it("retains acceptance after 250 even when QUIT fails", async () => {
    const f = fake(responses(), { failQuit: true });
    expect(await sendSmtpEmail(email, f.deps)).toEqual({ receipt: "250 queued as test-receipt" });
    expect(f.close).toHaveBeenCalledOnce();
  });
  it("sends legacy CC recipients in one SMTP transaction", async () => {
    const script = responses();
    script.splice(7, 0, "251 will forward\r\n");
    const f = fake(script);
    await sendSmtpEmailToRecipients(email, [email.to, "copy@example.test"], f.deps);
    const written = f.writes.join("");
    expect(written).toContain("RCPT TO:<client@example.test>\r\nRCPT TO:<copy@example.test>\r\nDATA\r\n");
    expect(written).toContain("To: <client@example.test>,\r\n <copy@example.test>");
  });
});

describe("SMTP input boundary", () => {
  it.each([
    { to: "first@example.test,second@example.test" },
    { to: "client@example.test\r\nBcc: other@example.test" },
    { to: "client@example.test>" },
    { subject: "invoice\r\nBcc: other@example.test" },
    { messageId: "id@example.test\r\nBcc: other@example.test" },
    { attachments: [{ ...email.attachments[0], filename: "a.pdf\r\nInjected: true" }] },
    { attachments: [{ ...email.attachments[0], contentType: "application/pdf; name=other" }] },
    { attachments: [{ ...email.attachments[0], base64: "AAAA\r\n.\r\n" }] },
    { attachments: [{ ...email.attachments[0], base64: "A===" }] },
  ])("rejects malformed headers or attachment content before connecting: %j", async patch => {
    const f = fake();
    await expect(sendSmtpEmail({ ...email, ...patch }, f.deps)).rejects.toMatchObject({ outcome: "failed" });
    expect(f.connect).not.toHaveBeenCalled();
  });
  it("bounds attachment size before encoding or connecting", () => {
    expect(() => validateSmtpEmail({ ...email, attachments: [{ filename: "large.pdf", base64: "AAAA".repeat(5_242_881) }] })).toThrow("SMTP_INVALID_ATTACHMENT");
  });
  it("preserves the legacy recipient list syntax without permitting header injection", () => {
    expect(parseLegacyRecipients("Client <client@example.test>; copy@example.test")).toEqual(["client@example.test", "copy@example.test"]);
    expect(() => parseLegacyRecipients("client@example.test\r\nBcc: other@example.test")).toThrow();
  });
});

function authDb(options: { admin?: unknown; organization?: unknown; visible?: unknown; invalidToken?: boolean } = {}) {
  const getUser = vi.fn(async () => ({ data: { user: options.invalidToken ? null : { id: "verified-user" } }, error: options.invalidToken ? {} : null }));
  const rpc = vi.fn(async (_name: string, args: Record<string, unknown>) => ({ data: args._role === "admin" ? options.admin ?? false : options.organization ?? false, error: null }));
  const ilike = vi.fn(() => ({ limit: vi.fn(async () => ({ data: options.visible ?? [], error: null })) }));
  const from = vi.fn(() => ({ select: vi.fn(() => ({ ilike })) }));
  return { database: { auth: { getUser }, rpc, from } as EmailAuthDatabase, getUser, rpc, from, ilike };
}
describe("legacy mail authorization", () => {
  it("rejects an absent bearer before constructing an authenticated send", () => {
    expect(() => requestBearer(new Request("https://example.test"))).toThrow("Authentication required");
  });
  it("preserves the existing exact service-role campaign caller", async () => {
    const f = authDb();
    await authorizeLegacyEmail("server-key", "server-key", f.database, [email.to]);
    expect(f.getUser).not.toHaveBeenCalled();
    expect(f.rpc).not.toHaveBeenCalled();
  });
  it("rejects a forged token and does not trust decoded role claims", async () => {
    const f = authDb({ invalidToken: true, admin: true });
    await expect(authorizeLegacyEmail("forged-token", "server-key", f.database, [email.to])).rejects.toMatchObject({ status: 401 });
    expect(f.rpc).not.toHaveBeenCalled();
  });
  it("permits a verified administrator", async () => {
    const f = authDb({ admin: true });
    await authorizeLegacyEmail("user-token", "server-key", f.database, [email.to]);
    expect(f.getUser).toHaveBeenCalledWith("user-token");
    expect(f.rpc).toHaveBeenCalledWith("has_role", { _user_id: "verified-user", _role: "admin" });
  });
  it("rejects regular users even with an accessible lead", async () => {
    const f = authDb({ visible: [{ id: "lead" }] });
    await expect(authorizeLegacyEmail("user-token", undefined, f.database, [email.to])).rejects.toMatchObject({ status: 403 });
  });
  it("preserves organization sending only to a lead visible through caller RLS", async () => {
    const f = authDb({ organization: true, visible: [{ id: "lead" }] });
    await authorizeLegacyEmail("user-token", undefined, f.database, ["a_b%test@example.test"]);
    expect(f.from).toHaveBeenCalledWith("org_leads");
    expect(f.ilike).toHaveBeenCalledWith("email", "a\\_b\\%test@example.test");
  });
  it("rejects an organization recipient that belongs to another tenant or is absent", async () => {
    const f = authDb({ organization: true });
    await expect(authorizeLegacyEmail("user-token", undefined, f.database, [email.to])).rejects.toMatchObject({ status: 403 });
  });
});
