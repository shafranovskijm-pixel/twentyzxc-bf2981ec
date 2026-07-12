import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1] : raw.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  let outboundIp = "unknown";
  const attemptTimeMsk = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });

  try {
    const { to } = await req.json().catch(() => ({ to: "" }));
    if (!to) {
      return new Response(JSON.stringify({ error: "to required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const ipResp = await fetch("https://api.ipify.org?format=json");
      outboundIp = (await ipResp.json()).ip || "unknown";
    } catch {}

    const host = Deno.env.get("SMTP_HOST")!;
    const port = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const user = Deno.env.get("SMTP_USER")!;
    const pass = Deno.env.get("SMTP_PASS")!;
    const fromRaw = Deno.env.get("SMTP_FROM") || user;
    const fromEmail = extractEmail(fromRaw);

    if (!host || !user || !pass) {
      return new Response(
        JSON.stringify({ success: false, error: "SMTP not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Choose TLS mode per port:
    //  465 -> implicit TLS
    //  587/25/2525 -> STARTTLS
    const useImplicitTls = port === 465;

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: useImplicitTls,
        auth: { username: user, password: pass },
      },
      debug: { log: true, allowUnsecure: false, encodeLB: true, noStartTLS: false },
      client: { warning: "ignore" },
    });

    await client.send({
      from: fromEmail,
      to,
      subject: "SMTP диагностика — тест",
      content: "Это тестовое письмо для проверки работоспособности SMTP.\nЕсли вы его получили — отправка работает корректно.",
    });
    await client.close();

    return new Response(
      JSON.stringify({
        success: true,
        to,
        outbound_ip: outboundIp,
        attempt_time_msk: attemptTimeMsk,
        smtp: { host, port, user: fromEmail, tls: useImplicitTls ? "implicit" : "starttls" },
        duration_ms: Date.now() - started,
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const errMsg = String((e as Error).message || e);
    return new Response(
      JSON.stringify({
        success: false,
        error: errMsg,
        outbound_ip: outboundIp,
        attempt_time_msk: attemptTimeMsk,
        duration_ms: Date.now() - started,
        hint: "Если ошибка сохраняется — проверить в Timeweb, что SMTP не заблокирован для внешних клиентов, и что порт/пароль указаны верно.",
      }, null, 2),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});