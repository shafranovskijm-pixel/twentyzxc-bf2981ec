import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1] : raw.trim();
}

function extractName(raw: string): string | null {
  const match = raw.match(/^(.+?)\s*<[^>]+>$/);
  return match ? match[1].replace(/^"|"$/g, "").trim() : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let client: SMTPClient | null = null;
  try {
    const { to, subject, html, pdfBase64, pdfFilename, attachments } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const host = Deno.env.get("SMTP_HOST")!;
    const port = parseInt(Deno.env.get("SMTP_PORT") || "465");
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

    console.log(`SMTP connect ${host}:${port} tls=${useImplicitTls ? "implicit" : "starttls"} from=${fromEmail}`);

    client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: useImplicitTls,
        auth: { username: user, password: pass },
      },
      client: { warning: "ignore" },
    });

    // Normalize attachments
    const attList: { filename: string; base64: string; contentType?: string }[] = Array.isArray(attachments)
      ? attachments.filter((a: any) => a && a.base64 && a.filename)
      : (pdfBase64 && pdfFilename
        ? [{ filename: pdfFilename, base64: pdfBase64, contentType: "application/pdf" }]
        : []);

    const recipients = to.split(/[,;]\s*/).map((e: string) => extractEmail(e.trim())).filter(Boolean);

    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to: recipients,
      subject,
      content: "auto",
      html,
      attachments: attList.map((a) => ({
        filename: a.filename,
        content: a.base64,
        encoding: "base64",
        contentType: a.contentType || "application/octet-stream",
      })),
    });

    await client.close();
    console.log("Email sent OK");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Email send error:", error?.message || error);
    try { await client?.close(); } catch {}
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Failed to send email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});