import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractEmail(raw: string): string {
  const m = raw.match(/<([^>]+)>/);
  return m ? m[1] : raw.trim();
}
function extractName(raw: string): string | null {
  const m = raw.match(/^(.+?)\s*<[^>]+>$/);
  return m ? m[1].replace(/^"|"$/g, "").trim() : null;
}
function mimeEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 30) {
    chunks.push(`=?UTF-8?B?${base64Encode(bytes.slice(i, i + 30))}?=`);
  }
  return chunks.join("\r\n ");
}

const enc = new TextEncoder();
const dec = new TextDecoder();

async function readResp(conn: Deno.Conn, ms = 15000): Promise<string> {
  let out = "";
  const buf = new Uint8Array(8192);
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    const readP = conn.read(buf);
    const timeoutP = new Promise<null>((r) => setTimeout(() => r(null), remaining));
    const n = await Promise.race([readP, timeoutP]);
    if (n === null) throw new Error(`SMTP read timeout after ${ms}ms. Got: ${JSON.stringify(out)}`);
    if (n === 0) break;
    out += dec.decode(buf.subarray(0, n as number));
    const lines = out.trim().split(/\r?\n/);
    if (/^\d{3} /.test(lines[lines.length - 1])) break;
  }
  return out.trim();
}

async function cmd(conn: Deno.Conn, line: string, expect: string, ms = 15000): Promise<string> {
  await conn.write(enc.encode(line + "\r\n"));
  const resp = await readResp(conn, ms);
  if (!resp.startsWith(expect)) {
    const safe = /^[A-Za-z0-9+/=]+$/.test(line) ? "***" : line;
    throw new Error(`SMTP "${safe}" expected ${expect}, got: ${resp}`);
  }
  return resp;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let conn: Deno.Conn | null = null;
  try {
    const { to, subject, html, pdfBase64, pdfFilename, attachments } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const host = Deno.env.get("SMTP_HOST")!;
    const port = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const user = Deno.env.get("SMTP_USER")!;
    const pass = Deno.env.get("SMTP_PASS")!;
    const smtpFrom = Deno.env.get("SMTP_FROM") || user;

    if (!host || !user || !pass) {
      return new Response(
        JSON.stringify({ success: false, error: "SMTP not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fromEmail = extractEmail(smtpFrom);
    const fromName = extractName(smtpFrom) || Deno.env.get("SMTP_FROM_NAME") || "Sintagma";
    const useImplicitTls = port === 465;

    const attList: { filename: string; base64: string; contentType?: string }[] = Array.isArray(attachments)
      ? attachments.filter((a: any) => a && a.base64 && a.filename)
      : (pdfBase64 && pdfFilename
        ? [{ filename: pdfFilename, base64: pdfBase64, contentType: "application/pdf" }]
        : []);

    const recipients = to.split(/[,;]\s*/).map((e: string) => extractEmail(e.trim())).filter(Boolean);

    console.log(`SMTP ${host}:${port} tls=${useImplicitTls ? "implicit" : "starttls"} to=${recipients.join(",")}`);

    if (useImplicitTls) {
      conn = await Deno.connectTls({ hostname: host, port });
    } else {
      conn = await Deno.connect({ hostname: host, port });
    }

    const greeting = await readResp(conn, 10000);
    if (!greeting.startsWith("220")) throw new Error(`Bad greeting: ${greeting}`);

    let ehloName = "sintagma.local";
    try {
      const ip = (await (await fetch("https://api.ipify.org?format=json")).json()).ip;
      if (ip) ehloName = `[${ip}]`;
    } catch {}

    await cmd(conn, `EHLO ${ehloName}`, "250");

    if (!useImplicitTls) {
      await cmd(conn, "STARTTLS", "220");
      conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: host });
      await cmd(conn, `EHLO ${ehloName}`, "250");
    }

    await cmd(conn, "AUTH LOGIN", "334");
    await cmd(conn, base64Encode(enc.encode(user)), "334");
    await cmd(conn, base64Encode(enc.encode(pass)), "235");

    await cmd(conn, `MAIL FROM:<${fromEmail}>`, "250");
    for (const r of recipients) {
      await cmd(conn, `RCPT TO:<${r}>`, "250");
    }
    await cmd(conn, "DATA", "354");

    const boundary = `----=_Part_${Date.now()}`;
    const encodedSubject = mimeEncode(subject);
    const encodedFrom = `${mimeEncode(fromName)} <${fromEmail}>`;
    const htmlB64 = base64Encode(enc.encode(html));
    const htmlChunked = htmlB64.match(/.{1,76}/g)?.join("\r\n") || htmlB64;

    let message: string;
    if (attList.length > 0) {
      const parts: string[] = [
        `From: ${encodedFrom}`,
        `To: ${recipients.map((r) => `<${r}>`).join(", ")}`,
        `Subject: ${encodedSubject}`,
        `Date: ${new Date().toUTCString()}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset="UTF-8"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        htmlChunked,
      ];
      for (const a of attList) {
        const chunked = a.base64.match(/.{1,76}/g)?.join("\r\n") || a.base64;
        const encName = mimeEncode(a.filename);
        const ct = a.contentType || "application/octet-stream";
        parts.push(
          `--${boundary}`,
          `Content-Type: ${ct}; name="${encName}"`,
          `Content-Transfer-Encoding: base64`,
          `Content-Disposition: attachment; filename="${encName}"`,
          ``,
          chunked,
        );
      }
      parts.push(`--${boundary}--`);
      message = parts.join("\r\n");
    } else {
      message = [
        `From: ${encodedFrom}`,
        `To: ${recipients.map((r) => `<${r}>`).join(", ")}`,
        `Subject: ${encodedSubject}`,
        `Date: ${new Date().toUTCString()}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset="UTF-8"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        htmlChunked,
      ].join("\r\n");
    }

    // Dot-stuffing
    message = message.replace(/\r?\n\./g, "\r\n..");

    await conn.write(enc.encode(message + "\r\n.\r\n"));
    // Большие вложения (PDF договора+счёта) timeweb принимает медленно —
    // ждём финальный "250 OK" до 3 минут.
    const dataResp = await readResp(conn, 180000);
    if (!dataResp.startsWith("250")) throw new Error(`DATA end failed: ${dataResp}`);

    try { await cmd(conn, "QUIT", "221", 3000); } catch {}

    console.log("Email sent OK");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Email send error:", error?.message || error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } finally {
    try { conn?.close(); } catch {}
  }
});