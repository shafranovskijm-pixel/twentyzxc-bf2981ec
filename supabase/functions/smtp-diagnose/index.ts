import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const enc = new TextEncoder();
const dec = new TextDecoder();

type Step = { name: string; ms: number; ok: boolean; detail?: string };

async function readResp(conn: Deno.TlsConn, timeoutMs = 15_000): Promise<string> {
  let result = "";
  const buf = new Uint8Array(4096);
  const deadline = Date.now() + timeoutMs;
  while (true) {
    if (Date.now() > deadline) throw new Error(`read timeout after ${timeoutMs}ms (got: ${JSON.stringify(result)})`);
    const readP = conn.read(buf);
    const timeoutP = new Promise<null>((_, rj) => setTimeout(() => rj(new Error(`read timeout, partial=${JSON.stringify(result)}`)), deadline - Date.now()));
    const n = await Promise.race([readP, timeoutP]) as number | null;
    if (n === null) break;
    result += dec.decode(buf.subarray(0, n));
    const lines = result.trim().split("\r\n");
    const last = lines[lines.length - 1];
    if (/^\d{3} /.test(last)) break;
  }
  return result.trim();
}

async function cmd(conn: Deno.TlsConn, line: string, timeoutMs = 15_000): Promise<string> {
  await conn.write(enc.encode(line + "\r\n"));
  return await readResp(conn, timeoutMs);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const steps: Step[] = [];
  const track = async <T,>(name: string, fn: () => Promise<T>, timeoutMs = 15_000): Promise<T> => {
    const t0 = Date.now();
    try {
      const v = await Promise.race([
        fn(),
        new Promise<T>((_, rj) => setTimeout(() => rj(new Error(`step "${name}" timed out after ${timeoutMs}ms`)), timeoutMs)),
      ]);
      steps.push({ name, ms: Date.now() - t0, ok: true });
      return v;
    } catch (e) {
      steps.push({ name, ms: Date.now() - t0, ok: false, detail: String((e as Error).message || e) });
      throw e;
    }
  };

  let conn: Deno.TlsConn | null = null;
  try {
    const { to } = await req.json().catch(() => ({ to: "" }));
    if (!to) return new Response(JSON.stringify({ error: "to required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const host = Deno.env.get("SMTP_HOST")!;
    const port = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const user = Deno.env.get("SMTP_USER")!;
    const pass = Deno.env.get("SMTP_PASS")!;
    const fromRaw = Deno.env.get("SMTP_FROM") || user;
    const fromEmail = (fromRaw.match(/<([^>]+)>/)?.[1] || fromRaw).trim();

    conn = await track("connect_tls", () => Deno.connectTls({ hostname: host, port }), 10_000);
    const greeting = await track("greeting", () => readResp(conn!, 10_000), 10_000);
    const ehlo = await track("ehlo", () => cmd(conn!, "EHLO lovable.dev", 10_000), 12_000);
    await track("auth_login", () => cmd(conn!, "AUTH LOGIN", 10_000), 12_000);
    await track("auth_user", () => cmd(conn!, base64Encode(enc.encode(user)), 10_000), 12_000);
    const authResp = await track("auth_pass", () => cmd(conn!, base64Encode(enc.encode(pass)), 15_000), 17_000);
    if (!authResp.startsWith("235")) throw new Error(`AUTH failed: ${authResp}`);
    const mfResp = await track("mail_from", () => cmd(conn!, `MAIL FROM:<${fromEmail}>`, 10_000), 12_000);
    if (!mfResp.startsWith("250")) throw new Error(`MAIL FROM failed: ${mfResp}`);
    const rcptResp = await track("rcpt_to", () => cmd(conn!, `RCPT TO:<${to}>`, 15_000), 17_000);
    if (!rcptResp.startsWith("250")) throw new Error(`RCPT TO failed: ${rcptResp}`);
    const dataResp = await track("data", () => cmd(conn!, "DATA", 10_000), 12_000);
    if (!dataResp.startsWith("354")) throw new Error(`DATA failed: ${dataResp}`);

    const body = [
      `From: <${fromEmail}>`,
      `To: <${to}>`,
      `Subject: =?UTF-8?B?${base64Encode(enc.encode("SMTP диагностика — тест"))}?=`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      base64Encode(enc.encode("Это тестовое письмо для проверки работоспособности SMTP.\nЕсли вы его получили — отправка работает корректно.")),
    ].join("\r\n");

    const sendResp = await track("send_body", async () => {
      await conn!.write(enc.encode(body + "\r\n.\r\n"));
      return await readResp(conn!, 30_000);
    }, 35_000);
    if (!sendResp.startsWith("250")) throw new Error(`send body failed: ${sendResp}`);
    await cmd(conn!, "QUIT", 5_000).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      to,
      smtp: { host, port, user: fromEmail },
      greeting,
      ehlo_first_line: ehlo.split("\r\n")[0],
      steps,
    }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      error: String((e as Error).message || e),
      steps,
      hint: steps.length > 0
        ? `Зависло на шаге "${steps[steps.length - 1].name}" (${steps[steps.length - 1].ms}ms). Проверь у timeweb лимиты/блокировку SMTP.`
        : "Не удалось установить соединение с SMTP.",
    }, null, 2), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } finally {
    try { conn?.close(); } catch {}
  }
});