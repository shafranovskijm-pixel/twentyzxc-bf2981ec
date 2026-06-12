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

    // Recover stuck "sending" rows older than 3 minutes (worker died mid-send)
    const stuckCutoff = new Date(Date.now() - 3 * 60_000).toISOString();
    const { data: stuck } = await admin
      .from("email_campaign_queue")
      .update({ status: "queued" })
      .eq("status", "sending")
      .lt("updated_at", stuckCutoff)
      .select("id");
    if (stuck?.length) console.log(`Recovered ${stuck.length} stuck sending rows`);

    // Pick up to 3 due items
    const { data: due, error } = await admin
      .from("email_campaign_queue")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1); // 1 per tick to avoid 150s worker timeout when SMTP is slow
    if (error) throw error;
    if (!due || !due.length) {
      return new Response(JSON.stringify({ processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sent = 0, failed = 0;
    for (const item of due) {
      console.log(`Processing ${item.id} -> ${item.email}`);
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
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 45_000); // hard 45s timeout
        const r = await fetch(`${SUPABASE_URL}/functions/v1/send-document-email`, {
          method: "POST",
          signal: ctrl.signal,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SERVICE_KEY}`,
            "apikey": SERVICE_KEY,
          },
          body: JSON.stringify({ to: item.email, subject: item.subject, html: item.body_html }),
        }).finally(() => clearTimeout(timer));
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
        console.log(`Sent ${item.email}`);
      } catch (e) {
        const msg = String((e as Error).message || e);
        console.error(`Failed ${item.email}: ${msg}`);
        const attempts = (item.attempts ?? 0) + 1;
        const retry = attempts < 2;
        await admin.from("email_campaign_queue")
          .update({
            status: retry ? "queued" : "failed",
            error: msg,
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