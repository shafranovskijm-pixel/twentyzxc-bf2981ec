import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/** RFC 2047 Base64 encode for non-ASCII headers */
function mimeEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return `=?UTF-8?B?${base64Encode(bytes)}?=`;
}

/** Minimal raw SMTP client over TLS */
async function sendRawSMTP(opts: {
  host: string; port: number; user: string; pass: string;
  from: string; fromName: string; to: string; subject: string; html: string;
}) {
  const conn = await Deno.connectTls({ hostname: opts.host, port: opts.port });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function readLine(): Promise<string> {
    const buf = new Uint8Array(4096);
    let result = "";
    while (true) {
      const n = await conn.read(buf);
      if (n === null) break;
      result += decoder.decode(buf.subarray(0, n));
      if (result.includes("\r\n")) break;
    }
    return result.trim();
  }

  async function send(cmd: string): Promise<string> {
    await conn.write(encoder.encode(cmd + "\r\n"));
    return await readLine();
  }

  try {
    // Greeting
    await readLine();
    await send(`EHLO localhost`);
    // May have multi-line response
    await new Promise(r => setTimeout(r, 200));

    // AUTH LOGIN
    await send("AUTH LOGIN");
    await send(base64Encode(encoder.encode(opts.user)));
    const authResp = await send(base64Encode(encoder.encode(opts.pass)));
    if (!authResp.startsWith("235")) {
      throw new Error(`SMTP auth failed: ${authResp}`);
    }

    await send(`MAIL FROM:<${opts.from}>`);
    await send(`RCPT TO:<${opts.to}>`);
    await send("DATA");

    // Build raw MIME message with proper UTF-8 headers
    const boundary = `boundary_${Date.now()}`;
    const encodedFrom = `${mimeEncode(opts.fromName)} <${opts.from}>`;
    const encodedSubject = mimeEncode(opts.subject);

    const rawMessage = [
      `From: ${encodedFrom}`,
      `To: <${opts.to}>`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      `Date: ${new Date().toUTCString()}`,
      ``,
      base64Encode(encoder.encode(opts.html)).match(/.{1,76}/g)?.join("\r\n") || "",
      `.`,
    ].join("\r\n");

    const quitResp = await send(rawMessage);
    await send("QUIT");
    
    return quitResp;
  } finally {
    try { conn.close(); } catch {}
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SMTP_HOST = Deno.env.get('SMTP_HOST')!;
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const SMTP_USER = Deno.env.get('SMTP_USER')!;
    const SMTP_PASS = Deno.env.get('SMTP_PASS')!;
    const SMTP_FROM_NAME = Deno.env.get('SMTP_FROM_NAME') || 'Синтагма';
    const SMTP_FROM_EMAIL = Deno.env.get('SMTP_FROM') || SMTP_USER;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return new Response(
        JSON.stringify({ success: false, error: 'SMTP not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await sendRawSMTP({
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: SMTP_FROM_EMAIL,
      fromName: SMTP_FROM_NAME,
      to,
      subject,
      html,
    });

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
  }
});
