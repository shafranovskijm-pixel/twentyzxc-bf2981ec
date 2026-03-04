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

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function readResponse(conn: Deno.TlsConn): Promise<string> {
  let result = "";
  const buf = new Uint8Array(4096);
  // Read until we get a complete response (line starting with "XXX " not "XXX-")
  while (true) {
    const n = await conn.read(buf);
    if (n === null) break;
    result += decoder.decode(buf.subarray(0, n));
    // Check if last line is a final response (code + space)
    const lines = result.split("\r\n").filter(l => l.length > 0);
    if (lines.length > 0) {
      const last = lines[lines.length - 1];
      // Final line has format "250 OK" (space after code), continuation has "250-..."
      if (/^\d{3} /.test(last) || result.endsWith("\r\n")) {
        // Check the actual last non-empty line
        const finalLine = lines[lines.length - 1];
        if (/^\d{3} /.test(finalLine)) break;
      }
    }
    // Safety: if we've been reading for a while and have data, check if it's complete
    if (result.includes("\r\n") && /^\d{3} /m.test(result)) {
      // Has at least one final response line
      const allLines = result.trim().split("\r\n");
      const lastLine = allLines[allLines.length - 1];
      if (/^\d{3} /.test(lastLine)) break;
    }
  }
  return result.trim();
}

async function writeLine(conn: Deno.TlsConn, line: string): Promise<void> {
  await conn.write(encoder.encode(line + "\r\n"));
}

async function command(conn: Deno.TlsConn, cmd: string): Promise<string> {
  await writeLine(conn, cmd);
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
    const fromEmail = Deno.env.get('SMTP_FROM') || user;
    const fromName = Deno.env.get('SMTP_FROM_NAME') || 'Sintagma';

    if (!host || !user || !pass) {
      return new Response(
        JSON.stringify({ success: false, error: 'SMTP not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Connecting to ${host}:${port}...`);
    conn = await Deno.connectTls({ hostname: host, port });

    // Read greeting
    const greeting = await readResponse(conn);
    console.log("Greeting:", greeting);

    // EHLO
    const ehlo = await command(conn, `EHLO lovable.dev`);
    console.log("EHLO:", ehlo.substring(0, 100));

    // AUTH LOGIN
    const authStart = await command(conn, "AUTH LOGIN");
    console.log("AUTH:", authStart);
    
    const userResp = await command(conn, base64Encode(encoder.encode(user)));
    console.log("USER:", userResp);
    
    const passResp = await command(conn, base64Encode(encoder.encode(pass)));
    console.log("PASS:", passResp);
    
    if (!passResp.startsWith("235")) {
      throw new Error(`SMTP auth failed: ${passResp}`);
    }

    // MAIL FROM
    const mailFrom = await command(conn, `MAIL FROM:<${fromEmail}>`);
    console.log("MAIL FROM:", mailFrom);

    // RCPT TO
    const rcptTo = await command(conn, `RCPT TO:<${to}>`);
    console.log("RCPT TO:", rcptTo);

    // DATA
    const dataResp = await command(conn, "DATA");
    console.log("DATA:", dataResp);

    // Build MIME message
    const encodedSubject = mimeEncode(subject);
    const encodedFrom = `${mimeEncode(fromName)} <${fromEmail}>`;
    const htmlB64 = base64Encode(encoder.encode(html));
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
      ``,
      `.`,  // End of message
    ].join("\r\n");

    const endResp = await command(conn, message);
    console.log("Message sent:", endResp);

    // QUIT
    await command(conn, "QUIT");

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
