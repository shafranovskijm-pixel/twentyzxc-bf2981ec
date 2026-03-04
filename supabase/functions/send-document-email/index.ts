import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/** RFC 2047 B-encoding, chunked to stay under 75-char encoded words */
function mimeEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 30) {
    const chunk = bytes.slice(i, i + 30);
    chunks.push(`=?UTF-8?B?${base64Encode(chunk)}?=`);
  }
  return chunks.join("\r\n ");
}

/** Extract pure email from "Name <email>" or just "email" */
function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1] : raw.trim();
}

/** Extract display name from "Name <email>" */
function extractName(raw: string): string | null {
  const match = raw.match(/^(.+?)\s*<[^>]+>$/);
  return match ? match[1].replace(/^"|"$/g, '').trim() : null;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

async function readResponse(conn: Deno.TlsConn): Promise<string> {
  let result = "";
  const buf = new Uint8Array(4096);
  while (true) {
    const n = await conn.read(buf);
    if (n === null) break;
    result += dec.decode(buf.subarray(0, n));
    const lines = result.trim().split("\r\n");
    const lastLine = lines[lines.length - 1];
    if (/^\d{3} /.test(lastLine)) break;
  }
  return result.trim();
}

async function cmd(conn: Deno.TlsConn, line: string): Promise<string> {
  await conn.write(enc.encode(line + "\r\n"));
  return await readResponse(conn);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let conn: Deno.TlsConn | null = null;

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const host = Deno.env.get('SMTP_HOST')!;
    const port = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const user = Deno.env.get('SMTP_USER')!;
    const pass = Deno.env.get('SMTP_PASS')!;
    const smtpFrom = Deno.env.get('SMTP_FROM') || user;

    if (!host || !user || !pass) {
      return new Response(
        JSON.stringify({ success: false, error: 'SMTP not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse from: extract pure email and display name
    const fromEmail = extractEmail(smtpFrom);
    const fromName = extractName(smtpFrom) || Deno.env.get('SMTP_FROM_NAME') || 'Sintagma';

    console.log(`Connecting to ${host}:${port}, from=${fromEmail}, name=${fromName}`);
    conn = await Deno.connectTls({ hostname: host, port });

    const greeting = await readResponse(conn);
    console.log("SMTP greeting OK");

    let resp = await cmd(conn, "EHLO lovable.dev");
    if (!resp.startsWith("250")) throw new Error(`EHLO failed: ${resp}`);

    resp = await cmd(conn, "AUTH LOGIN");
    resp = await cmd(conn, base64Encode(enc.encode(user)));
    resp = await cmd(conn, base64Encode(enc.encode(pass)));
    if (!resp.startsWith("235")) throw new Error(`Auth failed: ${resp}`);
    console.log("SMTP auth OK");

    resp = await cmd(conn, `MAIL FROM:<${fromEmail}>`);
    if (!resp.startsWith("250")) throw new Error(`MAIL FROM failed: ${resp}`);

    resp = await cmd(conn, `RCPT TO:<${to}>`);
    if (!resp.startsWith("250")) throw new Error(`RCPT TO failed: ${resp}`);

    resp = await cmd(conn, "DATA");
    if (!resp.startsWith("354")) throw new Error(`DATA failed: ${resp}`);

    // Build MIME message with properly encoded UTF-8 headers
    const encodedSubject = mimeEncode(subject);
    const encodedFrom = `${mimeEncode(fromName)} <${fromEmail}>`;
    const htmlB64 = base64Encode(enc.encode(html));
    const htmlChunked = htmlB64.match(/.{1,76}/g)?.join("\r\n") || htmlB64;

    const message = [
      `From: ${encodedFrom}`,
      `To: <${to}>`,
      `Subject: ${encodedSubject}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      htmlChunked,
    ].join("\r\n");

    // Send message body, then "." on its own line to end
    await conn.write(enc.encode(message + "\r\n.\r\n"));
    resp = await readResponse(conn);
    console.log("Message sent:", resp);

    if (!resp.startsWith("250")) throw new Error(`Send failed: ${resp}`);

    await cmd(conn, "QUIT");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } finally {
    try { conn?.close(); } catch {}
  }
});
