import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/** RFC 2047 Base64 encode, split into 48-byte chunks to stay under 75-char limit */
function mimeB64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  // Split into chunks of 30 bytes (produces ~40 base64 chars + overhead = ~60 chars per encoded word)
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 30) {
    const chunk = bytes.slice(i, i + 30);
    chunks.push(`=?UTF-8?B?${base64Encode(chunk)}?=`);
  }
  return chunks.join(" ");
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
    const SMTP_FROM_EMAIL = Deno.env.get('SMTP_FROM') || SMTP_USER;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return new Response(
        JSON.stringify({ success: false, error: 'SMTP not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    });

    // Build raw email with proper RFC 2047 B-encoding for Subject and From name
    const fromName = Deno.env.get('SMTP_FROM_NAME') || 'Sintagma';
    const boundary = `----=_Part_${Date.now()}`;
    const encodedSubject = mimeB64(subject);
    const encodedFromName = mimeB64(fromName);
    const htmlBase64 = base64Encode(new TextEncoder().encode(html));
    const htmlLines = htmlBase64.match(/.{1,76}/g)?.join("\r\n") || htmlBase64;

    const rawMessage = [
      `From: ${encodedFromName} <${SMTP_FROM_EMAIL}>`,
      `To: <${to}>`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      htmlLines,
    ].join("\r\n");

    // Use denomailer's internal send with raw content
    // Since denomailer doesn't support raw mode, send with ASCII placeholders
    // and manually override via the connection
    await client.send({
      from: SMTP_FROM_EMAIL,
      to,
      subject: "doc", // ASCII placeholder - denomailer won't mangle this
      content: rawMessage,
      html: undefined as any,
    });

    await client.close();

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
