import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1] : raw.trim();
}

const enc = new TextEncoder();
const dec = new TextDecoder();

async function readAll(conn: Deno.Conn, ms = 3000): Promise<string> {
  let out = "";
  const buf = new Uint8Array(4096);
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    const readP = conn.read(buf);
    const timeoutP = new Promise<null>((r) => setTimeout(() => r(null), remaining));
    const n = await Promise.race([readP, timeoutP]);
    if (n === null) break;
    if (n === 0) break;
    out += dec.decode(buf.subarray(0, n as number));
    // if last line matches "NNN "
    const lines = out.trim().split(/\r?\n/);
    if (/^\d{3} /.test(lines[lines.length - 1])) break;
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  let outboundIp = "unknown";
  const attemptTimeMsk = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
  const dialog: string[] = [];

  try {
    const { to } = await req.json().catch(() => ({ to: "" }));

    try {
      const ipResp = await fetch("https://api.ipify.org?format=json");
      outboundIp = (await ipResp.json()).ip || "unknown";
    } catch {}

    const host = Deno.env.get("SMTP_HOST")!;
    const port = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const user = Deno.env.get("SMTP_USER")!;
    const pass = Deno.env.get("SMTP_PASS")!;

    if (!host || !user || !pass) {
      return new Response(
        JSON.stringify({ success: false, error: "SMTP not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Raw diagnostic: connect, greet, EHLO — log everything.
    let conn: Deno.Conn;
    const useImplicitTls = port === 465;
    if (useImplicitTls) {
      conn = await Deno.connectTls({ hostname: host, port });
      dialog.push(`> [TLS connect ${host}:${port}]`);
    } else {
      conn = await Deno.connect({ hostname: host, port });
      dialog.push(`> [TCP connect ${host}:${port}]`);
    }

    const greeting = await readAll(conn, 5000);
    dialog.push(`< ${JSON.stringify(greeting)}`);

    // EHLO with our public IP as hostname (some servers reject bogus FQDNs)
    const ehloName = outboundIp !== "unknown" ? `[${outboundIp}]` : "sintagma.local";
    await conn.write(enc.encode(`EHLO ${ehloName}\r\n`));
    dialog.push(`> EHLO ${ehloName}`);
    const ehloResp = await readAll(conn, 5000);
    dialog.push(`< ${JSON.stringify(ehloResp)}`);

    try { conn.close(); } catch {}

    return new Response(
      JSON.stringify({
        success: true,
        outbound_ip: outboundIp,
        attempt_time_msk: attemptTimeMsk,
        smtp: { host, port, tls: useImplicitTls ? "implicit" : "plain-then-starttls" },
        dialog,
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
        dialog,
        outbound_ip: outboundIp,
        attempt_time_msk: attemptTimeMsk,
        duration_ms: Date.now() - started,
      }, null, 2),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});