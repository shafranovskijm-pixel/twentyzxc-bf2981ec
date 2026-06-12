import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Pick up to 3 due items
    const { data: due, error } = await admin
      .from("email_campaign_queue")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(3);
    if (error) throw error;
    if (!due || !due.length) {
      return new Response(JSON.stringify({ processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sent = 0, failed = 0;
    for (const item of due) {
      // Lock by setting status=sending
      const { data: lock } = await admin
        .from("email_campaign_queue")
        .update({ status: "sending", attempts: (item.attempts ?? 0) + 1 })
        .eq("id", item.id)
        .eq("status", "queued")
        .select("id")
        .maybeSingle();
      if (!lock) continue;

      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/send-document-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_KEY}`,
            "apikey": SERVICE_KEY,
          },
          body: JSON.stringify({ to: item.email, subject: item.subject, html: item.body_html }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j?.success === false) throw new Error(j?.error || `HTTP ${r.status}`);

        await admin.from("email_campaign_queue")
          .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
          .eq("id", item.id);

        if (item.lead_id) {
          await admin.from("sales_leads")
            .update({ status: "emailed", last_email_sent_at: new Date().toISOString() })
            .eq("id", item.lead_id);
        }
        sent++;
      } catch (e) {
        const attempts = (item.attempts ?? 0) + 1;
        const retry = attempts < 2;
        await admin.from("email_campaign_queue")
          .update({
            status: retry ? "queued" : "failed",
            error: String((e as Error).message || e),
            scheduled_at: retry ? new Date(Date.now() + 60 * 60_000).toISOString() : item.scheduled_at,
          })
          .eq("id", item.id);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed: due.length, sent, failed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("process-email-queue error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});