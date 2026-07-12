import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

type Attachment = { filename: string; base64: string; contentType?: string };

async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
  pdfBase64?: string;
  pdfFilename?: string;
  attachments?: Attachment[];
}) {
  const { to, subject, html, pdfBase64, pdfFilename, attachments } = payload;

  if (!to || !subject || !html) {
    throw new Error("Missing required fields: to, subject, html");
  }

  const host = Deno.env.get("SMTP_HOST")!;
  const port = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const user = Deno.env.get("SMTP_USER")!;
  const pass = Deno.env.get("SMTP_PASS")!;
  const smtpFrom = Deno.env.get("SMTP_FROM") || user;

  if (!host || !user || !pass) {
    throw new Error("SMTP not configured");
  }

  const fromEmail = extractEmail(smtpFrom);
  const fromName = extractName(smtpFrom) || Deno.env.get("SMTP_FROM_NAME") || "Sintagma";
  const useImplicitTls = port === 465;

  const attList: Attachment[] = Array.isArray(attachments)
    ? attachments.filter((a: any) => a && a.base64 && a.filename)
    : (pdfBase64 && pdfFilename
      ? [{ filename: pdfFilename, base64: pdfBase64, contentType: "application/pdf" }]
      : []);

  const recipients = to.split(/[,;]\s*/).map((e: string) => extractEmail(e.trim())).filter(Boolean);

  console.log(`SMTP ${host}:${port} tls=${useImplicitTls ? "implicit" : "starttls"} to=${recipients.join(",")} attachments=${attList.length}`);

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: useImplicitTls,
      auth: { username: user, password: pass },
    },
    pool: false,
    debug: { log: false, allowUnsecure: false, encodeLB: false, noStartTLS: false },
  });

  try {
    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to: recipients,
      subject,
      html,
      attachments: attList.map((a) => ({
        filename: a.filename,
        content: a.base64,
        encoding: "base64",
        contentType: a.contentType || "application/octet-stream",
      })),
    });
    console.log("Email sent OK");
  } finally {
    try { await client.close(); } catch {}
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { to, subject, html, async: sendAsync } = payload;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (sendAsync) {
      EdgeRuntime.waitUntil(
        sendEmail(payload).catch((error) => {
          console.error("Async email send error:", error?.message || error);
        }),
      );

      return new Response(
        JSON.stringify({ success: true, queued: true }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await sendEmail(payload);

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
  }
});