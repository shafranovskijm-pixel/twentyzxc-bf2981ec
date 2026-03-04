import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    const SMTP_FROM = Deno.env.get('SMTP_FROM') || SMTP_USER;

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

    await client.send({
      from: SMTP_FROM,
      to,
      subject,
      html,
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
