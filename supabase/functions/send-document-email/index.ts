import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailAuthorizationError, authorizeLegacyEmail, requestBearer } from "../_shared/crm-email/legacy-auth.ts";
import { parseLegacyRecipients, sendSmtpEmailToRecipients, SmtpDeliveryError, validateSmtpEmail, type SmtpEmail } from "../_shared/crm-email/smtp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const limit = 24 * 1024 * 1024;
  if (Number(request.headers.get("content-length")) > limit || !request.body) throw new SmtpDeliveryError("failed", "SMTP_INVALID_INPUT");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.length;
      if (size > limit) { await reader.cancel(); throw new SmtpDeliveryError("failed", "SMTP_INVALID_INPUT"); }
      chunks.push(item.value);
    }
  } finally { reader.releaseLock(); }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  try {
    const value = JSON.parse(new TextDecoder().decode(buffer));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new SmtpDeliveryError("failed", "SMTP_INVALID_INPUT"); }
}

serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);
  try {
    const token = requestBearer(request);
    const url = Deno.env.get("SUPABASE_URL");
    const publicKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !publicKey) return json({ success: false, error: "Email authorization is not configured" }, 503);
    const database = createClient(url, publicKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const payload = await readPayload(request);
    const recipients = parseLegacyRecipients(payload.to);
    const attachments = Array.isArray(payload.attachments) ? payload.attachments :
      payload.pdfBase64 && payload.pdfFilename ? [{ filename: payload.pdfFilename, base64: payload.pdfBase64, contentType: "application/pdf" }] : [];
    const email: SmtpEmail = {
      to: recipients[0], subject: payload.subject as string, html: payload.html as string,
      attachments, messageId: `${crypto.randomUUID()}@24zxc.ru`,
    };
    validateSmtpEmail(email);
    await authorizeLegacyEmail(token, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), database, recipients);
    // Existing callers may supply async:true, but 202 never proved submission.
    // Respond only after SMTP accepts the message; queued is no longer reported as sent.
    const { receipt } = await sendSmtpEmailToRecipients(email, recipients);
    return json({ success: true, status: "accepted", receipt, messageId: email.messageId });
  } catch (error) {
    if (error instanceof EmailAuthorizationError) return json({ success: false, error: error.message }, error.status);
    if (error instanceof SmtpDeliveryError) {
      const inputError = error.code.startsWith("SMTP_INVALID_") || error.code === "SMTP_ATTACHMENTS_TOO_LARGE";
      return json({ success: false, error: error.code, outcome: error.outcome }, inputError ? 400 : 502);
    }
    // Never expose credentials, provider errors, message contents, or client data.
    return json({ success: false, error: "Email request failed" }, 500);
  }
});
