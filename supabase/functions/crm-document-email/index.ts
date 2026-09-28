import { createClient } from "npm:@supabase/supabase-js@2.93.3";
import { renderDocumentPdf } from "../_shared/crm-email/pdf.ts";
import { sendSmtpEmail } from "../_shared/crm-email/smtp.ts";
import { dispatchDelivery, preparePdfAttachments, publicDelivery, sha256, type Delivery, type DeliveryDependencies } from "../_shared/crm-email/delivery.ts";

const cors = { "Access-Control-Allow-Origin": "https://24zxc.ru", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const uuid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
function fail(message: string): never { throw new Error(message); }

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ code: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const authorization = req.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ code: "UNAUTHORIZED" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const userDb = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await userDb.auth.getUser(authorization.slice(7));
    if (authError || !authData.user) return json({ code: "UNAUTHORIZED" }, 401);
    const actor = authData.user.id;
    const { data: admin, error: roleError } = await userDb.rpc("has_role", { _user_id: actor, _role: "admin" });
    if (roleError || admin !== true) return json({ code: "FORBIDDEN" }, 403);
    const raw = await req.text();
    if (raw.length > 30000) return json({ code: "REQUEST_TOO_LARGE" }, 413);
    const input = JSON.parse(raw);
    if (!input || typeof input !== "object" || !["prepare", "send"].includes(input.action)) return json({ code: "INVALID_INPUT" }, 400);
    const serviceDb = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
    const rpc = async (name: string, args: Record<string, unknown>) => {
      const { data, error } = await serviceDb.rpc(name, args);
      if (error) fail(error.message.match(/CRM_[A-Z_]+/)?.[0] || "CRM_DATABASE_ERROR");
      return data;
    };
    const deps: DeliveryDependencies = {
      render: renderDocumentPdf,
      upload: async (path, bytes) => {
        const { error } = await serviceDb.storage.from("contracts").upload(path, bytes, { contentType: "application/pdf", upsert: false });
        if (error) {
          // Identical concurrent preparations may have uploaded this immutable path.
          const { data, error: readError } = await serviceDb.storage.from("contracts").download(path);
          if (readError || !data || await sha256(new Uint8Array(await data.arrayBuffer())) !== await sha256(bytes)) fail("CRM_PDF_STORAGE_FAILED");
        }
      },
      download: async path => {
        const { data, error } = await serviceDb.storage.from("contracts").download(path);
        if (error || !data) fail("CRM_PDF_STORAGE_FAILED");
        return new Uint8Array(await data.arrayBuffer());
      },
      finalize: (id, owner, attachments) => rpc("crm_finalize_document_email", { p_delivery_id: id, p_actor_id: owner, p_attachments: attachments }),
      claim: (id, owner) => rpc("crm_claim_document_email", { p_delivery_id: id, p_actor_id: owner }),
      finish: (id, owner, state, receipt, error) => rpc("crm_finish_document_email", { p_delivery_id: id, p_actor_id: owner, p_state: state, p_receipt: receipt ? { smtpResponse: receipt } : null, p_error: error }),
      send: sendSmtpEmail,
    };
    let delivery: Delivery;
    if (input.action === "prepare") {
      if (!uuid(input.requestId) || !uuid(input.clientId) || !Array.isArray(input.documents) || input.documents.length < 1 || input.documents.length > 10 || input.documents.some((d: Record<string, unknown>) => !uuid(d.documentId) || !Number.isInteger(d.revision) || Number(d.revision) < 1)) return json({ code: "INVALID_INPUT" }, 400);
      const { data, error } = await userDb.rpc("crm_prepare_document_email", {
        p_request_id: input.requestId, p_client_id: input.clientId, p_documents: input.documents,
        p_recipient: input.recipient ?? null, p_subject: input.subject, p_body: input.body,
      });
      if (error) fail(error.message.match(/CRM_[A-Z_]+/)?.[0] || "CRM_DATABASE_ERROR");
      delivery = await preparePdfAttachments(data, deps);
    } else {
      if (!uuid(input.deliveryId) || typeof input.expectedRecipient !== "string") return json({ code: "INVALID_INPUT" }, 400);
      const { data, error } = await userDb.from("crm_email_deliveries").select("*").eq("id", input.deliveryId).eq("actor_id", actor).maybeSingle();
      if (error || !data) fail("CRM_DELIVERY_NOT_FOUND");
      if (data.recipient !== input.expectedRecipient) fail("CRM_RECIPIENT_CHANGED");
      delivery = await dispatchDelivery(input.deliveryId, actor, deps);
    }
    const result = publicDelivery(delivery);
    const downloads = [];
    for (const file of delivery.attachments || []) {
      const { data, error } = await userDb.storage.from("contracts").createSignedUrl(file.path, 600, { download: file.filename });
      if (!error && data) downloads.push({ filename: file.filename, url: data.signedUrl, expiresInSeconds: 600 });
    }
    return json({ ...result, downloads });
  } catch (error) {
    const code = error instanceof Error ? error.message.match(/^CRM_[A-Z_]+$/)?.[0] : null;
    return json({ code: code || "CRM_EMAIL_OPERATION_FAILED", message: "Операция не завершена. Проверьте состояние отправки по deliveryId; повтор команды отправки не отправит письмо повторно." }, 400);
  }
}
Deno.serve(handler);
