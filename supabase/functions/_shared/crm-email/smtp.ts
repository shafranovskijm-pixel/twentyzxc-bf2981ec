/** SMTP transport. An accepted response is not proof of delivery to the recipient. */
export type EmailAttachment = { filename: string; base64: string; contentType?: string };
export type SmtpEmail = { to: string; subject: string; html: string; attachments: EmailAttachment[]; messageId: string; replyTo?: string };
export type SmtpOutcome = "failed" | "unknown";

export class SmtpDeliveryError extends Error {
  constructor(public readonly outcome: SmtpOutcome, public readonly code: string) {
    super(code);
    this.name = "SmtpDeliveryError";
  }
}

export interface SmtpConnection {
  read(buffer: Uint8Array): Promise<number | null>;
  write(buffer: Uint8Array): Promise<number>;
  close(): void;
}
export interface SmtpConfig { host: string; port: number; user: string; pass: string; from: string; fromName: string }
export interface SmtpDependencies {
  config: SmtpConfig;
  connect(options: { hostname: string; port: number; tls: boolean }): Promise<SmtpConnection>;
  startTls(connection: SmtpConnection, hostname: string): Promise<SmtpConnection>;
  commandTimeoutMs?: number;
  acceptanceTimeoutMs?: number;
  totalTimeoutMs?: number;
}

const encoder = new TextEncoder();
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
function invalid(code = "SMTP_INVALID_INPUT"): never { throw new SmtpDeliveryError("failed", code); }
function header(value: unknown, max: number): asserts value is string {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) invalid();
}

/** One bare ASCII mailbox; recipient lists and header/display-name syntax are deliberately excluded. */
export function validateEmailAddress(value: unknown): string {
  header(value, 254);
  const email = value.trim();
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?$/.test(email)) invalid("SMTP_INVALID_RECIPIENT");
  const [local, domain] = email.split("@");
  if (local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..") ||
      !domain.includes(".") || domain.split(".").some(label => !label || label.length > 63 || label.startsWith("-") || label.endsWith("-"))) invalid("SMTP_INVALID_RECIPIENT");
  return email;
}

/** Compatibility parser for the CRM UI's existing To + CC field. */
export function parseLegacyRecipients(value: unknown): string[] {
  header(value, 3000);
  const recipients = value.split(/[,;]/).map(part => {
    const text = part.trim();
    const match = text.match(/^[^<>]*<([^<>]+)>$/);
    return validateEmailAddress(match ? match[1].trim() : text);
  });
  if (!recipients.length || recipients.length > 10) invalid("SMTP_INVALID_RECIPIENT");
  return [...new Set(recipients)];
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
function mimeEncode(value: string): string {
  // Split at Unicode code points, never in the middle of a UTF-8 character.
  const words: string[] = [];
  let chunk = "";
  for (const char of value) {
    if (encoder.encode(chunk + char).length > 30) { words.push(`=?UTF-8?B?${base64(encoder.encode(chunk))}?=`); chunk = ""; }
    chunk += char;
  }
  if (chunk) words.push(`=?UTF-8?B?${base64(encoder.encode(chunk))}?=`);
  return words.join("\r\n ");
}
function wrapBase64(value: string): string { return value.match(/.{1,76}/g)?.join("\r\n") || ""; }
function messageId(value: string): string {
  header(value, 250);
  const id = value.startsWith("<") && value.endsWith(">") ? value.slice(1, -1) : value;
  if (!/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/.test(id)) invalid("SMTP_INVALID_MESSAGE_ID");
  return `<${id}>`;
}
export function validateSmtpEmail(input: SmtpEmail): void {
  validateEmailAddress(input.to);
  if (input.replyTo !== undefined) validateEmailAddress(input.replyTo);
  header(input.subject, 500);
  messageId(input.messageId);
  if (typeof input.html !== "string" || !input.html || encoder.encode(input.html).length > MAX_HTML_BYTES) invalid();
  if (!Array.isArray(input.attachments) || input.attachments.length > 10) invalid();
  let bytes = 0;
  for (const attachment of input.attachments) {
    if (!attachment || typeof attachment !== "object") invalid();
    header(attachment.filename, 255);
    if (/[<>"\\/]/.test(attachment.filename)) invalid("SMTP_INVALID_ATTACHMENT");
    const type = attachment.contentType || "application/octet-stream";
    if (!/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/.test(type)) invalid("SMTP_INVALID_ATTACHMENT");
    if (typeof attachment.base64 !== "string" || !attachment.base64 || attachment.base64.length > Math.ceil(MAX_ATTACHMENT_BYTES / 3) * 4 ||
        attachment.base64.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(attachment.base64)) invalid("SMTP_INVALID_ATTACHMENT");
    const paddingAt = attachment.base64.indexOf("=");
    if (paddingAt >= 0 && !["=", "=="].includes(attachment.base64.slice(paddingAt))) invalid("SMTP_INVALID_ATTACHMENT");
    bytes += attachment.base64.length * 3 / 4 - (attachment.base64.endsWith("==") ? 2 : attachment.base64.endsWith("=") ? 1 : 0);
    if (bytes > MAX_ATTACHMENT_BYTES) invalid("SMTP_ATTACHMENTS_TOO_LARGE");
  }
}

function runtimeDependencies(): SmtpDependencies {
  const runtime = (globalThis as unknown as { Deno: {
    env: { get(name: string): string | undefined };
    connect(options: { hostname: string; port: number }): Promise<SmtpConnection>;
    connectTls(options: { hostname: string; port: number }): Promise<SmtpConnection>;
    startTls(connection: SmtpConnection, options: { hostname: string }): Promise<SmtpConnection>;
  } }).Deno;
  const user = runtime.env.get("SMTP_USER") || "";
  return {
    config: { host: runtime.env.get("SMTP_HOST") || "", port: Number(runtime.env.get("SMTP_PORT") || "587"), user,
      pass: runtime.env.get("SMTP_PASS") || "", from: runtime.env.get("SMTP_FROM") || user, fromName: runtime.env.get("SMTP_FROM_NAME") || "Sintagma" },
    connect: options => options.tls ? runtime.connectTls(options) : runtime.connect(options),
    startTls: (connection, hostname) => runtime.startTls(connection, { hostname }),
  };
}

export async function sendSmtpEmail(input: SmtpEmail, dependencies?: SmtpDependencies): Promise<{ receipt: string }> {
  return sendSmtpEmailToRecipients(input, [validateEmailAddress(input.to)], dependencies);
}

/** Legacy callers may have CC recipients. New document deliveries use sendSmtpEmail. */
export async function sendSmtpEmailToRecipients(input: SmtpEmail, recipients: string[], dependencies?: SmtpDependencies): Promise<{ receipt: string }> {
  validateSmtpEmail(input);
  if (!recipients.length || recipients.length > 10) invalid("SMTP_INVALID_RECIPIENT");
  recipients = [...new Set(recipients.map(validateEmailAddress))];
  const deps = dependencies || runtimeDependencies();
  const cfg = deps.config;
  if (!cfg.host || !cfg.user || !cfg.pass || !Number.isInteger(cfg.port) || cfg.port < 1 || cfg.port > 65535) invalid("SMTP_NOT_CONFIGURED");
  header(cfg.host, 253);
  header(cfg.from, 500);
  const sender = cfg.from.match(/^([^<>]*)<([^<>]+)>$/);
  const from = validateEmailAddress(sender ? sender[2].trim() : cfg.from);
  const fromName = sender?.[1].trim().replace(/^"|"$/g, "") || cfg.fromName;
  header(fromName, 200);
  let connection: SmtpConnection | undefined;
  let outcome: SmtpOutcome = "failed";
  const deadline = Date.now() + (deps.totalTimeoutMs ?? 40_000);
  const commandTimeout = deps.commandTimeoutMs ?? 10_000;
  const acceptanceTimeout = deps.acceptanceTimeoutMs ?? 20_000;
  let phase = "CONNECT";
  const bounded = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    const remaining = Math.min(ms, deadline - Date.now());
    if (remaining <= 0) { promise.catch(() => {}); throw new SmtpDeliveryError(outcome, `SMTP_TIMEOUT_${phase}`); }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([promise, new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new SmtpDeliveryError(outcome, `SMTP_TIMEOUT_${phase}`)), remaining);
      })]);
    } finally { if (timer !== undefined) clearTimeout(timer); }
  };
  const write = async (text: string) => {
    const bytes = encoder.encode(text);
    let offset = 0;
    while (offset < bytes.length) {
      const length = await bounded(connection!.write(bytes.subarray(offset, Math.min(offset + 65_536, bytes.length))), commandTimeout);
      if (!Number.isInteger(length) || length <= 0 || length > bytes.length - offset) throw new SmtpDeliveryError(outcome, `SMTP_CONNECTION_${phase}`);
      offset += length;
    }
  };
  let buffered = "";
  const read = async (ms = commandTimeout): Promise<{ code: number; text: string }> => {
    const responseDeadline = Math.min(deadline, Date.now() + ms);
    const lines: string[] = [];
    let code: number | undefined;
    let size = 0;
    while (true) {
      let end = buffered.indexOf("\r\n");
      while (end < 0) {
        const bytes = new Uint8Array(8192);
        const length = await bounded(connection!.read(bytes), responseDeadline - Date.now());
        if (!length) throw new SmtpDeliveryError(outcome, `SMTP_CONNECTION_${phase}`);
        buffered += new TextDecoder().decode(bytes.subarray(0, length));
        if (buffered.length > 65_536) throw new SmtpDeliveryError(outcome, "SMTP_INVALID_RESPONSE");
        end = buffered.indexOf("\r\n");
      }
      const line = buffered.slice(0, end);
      buffered = buffered.slice(end + 2);
      size += line.length;
      const match = line.match(/^(\d{3})([ -])(.*)$/);
      if (!match || size > 65_536 || (code !== undefined && code !== Number(match[1]))) throw new SmtpDeliveryError(outcome, "SMTP_INVALID_RESPONSE");
      code = Number(match[1]);
      lines.push(line);
      if (match[2] === " ") return { code, text: lines.join("\n") };
    }
  };
  const expect = async (expected: number[], ms?: number): Promise<string> => {
    const response = await read(ms);
    if (!expected.includes(response.code)) {
      // A complete SMTP rejection is definitive, including rejection after DATA.
      const rejected = response.code >= 400 && response.code <= 599;
      throw new SmtpDeliveryError(rejected ? "failed" : outcome, `SMTP_REJECTED_${phase}_${response.code}`);
    }
    return response.text;
  };
  const command = async (stage: string, text: string, codes: number[]) => {
    phase = stage;
    await write(text + "\r\n");
    return expect(codes);
  };
  try {
    let connectionExpired = false;
    const pendingConnection = deps.connect({ hostname: cfg.host, port: cfg.port, tls: cfg.port === 465 });
    pendingConnection.then(value => { if (connectionExpired) try { value.close(); } catch { /* already closed */ } }, () => {});
    try { connection = await bounded(pendingConnection, commandTimeout); } catch (error) { connectionExpired = true; throw error; }
    phase = "GREETING";
    await expect([220]);
    await command("EHLO", "EHLO 24zxc.ru", [250]);
    if (cfg.port !== 465) {
      await command("STARTTLS", "STARTTLS", [220]);
      phase = "TLS";
      const rawConnection = connection;
      const pendingTls = deps.startTls(rawConnection, cfg.host);
      let tlsExpired = false;
      pendingTls.then(value => { if (tlsExpired) try { value.close(); } catch { /* already closed */ } }, () => {});
      try { connection = await bounded(pendingTls, commandTimeout); } catch (error) { tlsExpired = true; throw error; }
      buffered = "";
      await command("EHLO", "EHLO 24zxc.ru", [250]);
    }
    await command("AUTH", "AUTH LOGIN", [334]);
    await command("AUTH", base64(encoder.encode(cfg.user)), [334]);
    await command("AUTH", base64(encoder.encode(cfg.pass)), [235]);
    await command("MAIL", `MAIL FROM:<${from}>`, [250]);
    for (const recipient of recipients) await command("RECIPIENT", `RCPT TO:<${recipient}>`, [250, 251]);
    await command("DATA", "DATA", [354]);
    phase = "BODY";
    outcome = "unknown"; // Never automatically retry a possibly submitted message.
    const boundary = `crm_${crypto.randomUUID().replace(/-/g, "")}`;
    const headers = [`From: ${mimeEncode(fromName)} <${from}>`, `To: ${recipients.map(to => `<${to}>`).join(",\r\n ")}`,
      `Subject: ${mimeEncode(input.subject)}`, `Date: ${new Date().toUTCString()}`, `Message-ID: ${messageId(input.messageId)}`, "MIME-Version: 1.0"];
    if (input.replyTo) headers.push(`Reply-To: <${validateEmailAddress(input.replyTo)}>`);
    const html = wrapBase64(base64(encoder.encode(input.html)));
    if (input.attachments.length) {
      headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      await write(headers.join("\r\n") + "\r\n\r\n");
      await write(`--${boundary}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${html}\r\n`);
      for (const attachment of input.attachments) {
        const filename = mimeEncode(attachment.filename);
        await write(`--${boundary}\r\nContent-Type: ${attachment.contentType || "application/octet-stream"}; name="${filename}"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename="${filename}"\r\n\r\n`);
        await write(wrapBase64(attachment.base64) + "\r\n");
      }
      await write(`--${boundary}--\r\n`);
    } else {
      headers.push('Content-Type: text/html; charset="UTF-8"', "Content-Transfer-Encoding: base64");
      await write(headers.join("\r\n") + "\r\n\r\n" + html + "\r\n");
    }
    await write(".\r\n");
    phase = "ACCEPTANCE";
    const receipt = (await expect([250], acceptanceTimeout)).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 500);
    // 250 after the terminating dot is the success boundary; QUIT cannot undo it.
    try { await command("QUIT", "QUIT", [221]); } catch { /* accepted already */ }
    return { receipt };
  } catch (error) {
    if (error instanceof SmtpDeliveryError) throw error;
    throw new SmtpDeliveryError(outcome, `SMTP_CONNECTION_${phase}`);
  } finally { try { connection?.close(); } catch { /* already closed */ } }
}
