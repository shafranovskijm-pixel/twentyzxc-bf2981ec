import { createClient } from "npm:@supabase/supabase-js@2.93.3";
import { sendSmtpEmail } from "../_shared/crm-email/smtp.ts";
import { sha256 } from "../_shared/crm-email/delivery.ts";
import { MAX_FRDO_FILE_BYTES } from "../_shared/crm-frdo/catalog.ts";
import { createFrdoEmailHandler, frdoDatabaseError, FrdoOperationError } from "../_shared/crm-frdo/delivery.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const userKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
export const handler = createFrdoEmailHandler({
  user(authorization) {
    const db = createClient(url, userKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    return {
      async authenticate(token) {
        const { data, error } = await db.auth.getUser(token);
        return error ? null : data.user?.id || null;
      },
      async isAdmin(actor) {
        const { data, error } = await db.rpc("has_role", { _user_id: actor, _role: "admin" });
        return !error && data === true;
      },
      async prepare(args) {
        const { data, error } = await db.rpc("crm_prepare_frdo_email", args);
        if (error) frdoDatabaseError(error);
        return data;
      },
      async findDelivery(id, actor) {
        const { data, error } = await db.from("crm_frdo_email_deliveries").select("*").eq("id", id).eq("actor_id", actor).maybeSingle();
        if (error || !data) throw new FrdoOperationError("CRM_DELIVERY_NOT_FOUND");
        return data;
      },
      async signDownload(path, filename) {
        const { data, error } = await db.storage.from("contracts").createSignedUrl(path, 600, { download: filename });
        return !error && data ? data.signedUrl : null;
      },
    };
  },
  // This factory is called only after the exact user JWT and admin role passed.
  worker() {
    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
    const rpc = async (name: string, args: Record<string, unknown>) => {
      const { data, error } = await db.rpc(name, args);
      if (error) frdoDatabaseError(error);
      return data;
    };
    const download = async (path: string) => {
      const { data, error } = await db.storage.from("contracts").download(path);
      if (error || !data || data.size > MAX_FRDO_FILE_BYTES) throw new FrdoOperationError("CRM_FRDO_STORAGE_FAILED");
      return new Uint8Array(await data.arrayBuffer());
    };
    return {
      async upload(path, bytes, contentType) {
        const { error } = await db.storage.from("contracts").upload(path, bytes, { contentType, upsert: false });
        if (error) {
          // A concurrent retry may have uploaded this same immutable object.
          const existing = await download(path);
          if (existing.length !== bytes.length || await sha256(existing) !== await sha256(bytes)) throw new FrdoOperationError("CRM_FRDO_STORAGE_FAILED");
        }
      },
      download,
      finalize: (id, actor, attachments) => rpc("crm_finalize_frdo_email", { p_delivery_id: id, p_actor_id: actor, p_attachments: attachments }),
      claim: (id, actor) => rpc("crm_claim_frdo_email", { p_delivery_id: id, p_actor_id: actor }),
      finish: (id, actor, state, receipt, error) => rpc("crm_finish_frdo_email", { p_delivery_id: id, p_actor_id: actor, p_state: state, p_receipt: receipt, p_error: error }),
      send: sendSmtpEmail,
    };
  },
  isSignedDownload(value, path) {
    try {
      const signed = new URL(value); const base = new URL(url);
      return signed.origin === base.origin && !signed.username && !signed.password && !signed.hash
        && decodeURIComponent(signed.pathname) === `/storage/v1/object/sign/contracts/${path}` && !!signed.searchParams.get("token");
    } catch { return false; }
  },
});
Deno.serve(handler);
