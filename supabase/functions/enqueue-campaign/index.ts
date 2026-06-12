import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PER_DAY = 20;
const INTERVAL_MIN = 10;
const WINDOW_START_HOUR = 10; // MSK
const WINDOW_END_HOUR = 18;
const MSK_OFFSET = 3 * 60; // minutes

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function renderBody(subject: string, body: string, lead: any) {
  const s = subject.replace(/\{org\}/g, lead.name || "");
  const b = body.replace(/\{org\}/g, lead.name || "").replace(/\{contact\}/g, lead.contact_person || "");
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;white-space:pre-wrap;color:#1a1a1a;font-size:15px;line-height:1.55;">${escapeHtml(b).replace(/\n/g, "<br/>")}</div>`;
  return { subject: s, html };
}

// Returns next available slot >= "after", inside MSK window 10..18, with at most PER_DAY per MSK day
function pickSlots(count: number, perDayUsage: Map<string, number>, after: Date): Date[] {
  const slots: Date[] = [];
  let cursor = new Date(after.getTime());
  while (slots.length < count) {
    // convert to MSK
    const msk = new Date(cursor.getTime() + MSK_OFFSET * 60_000);
    const hour = msk.getUTCHours();
    const dayKey = msk.toISOString().slice(0, 10);
    if (hour < WINDOW_START_HOUR) {
      msk.setUTCHours(WINDOW_START_HOUR, 0, 0, 0);
      cursor = new Date(msk.getTime() - MSK_OFFSET * 60_000);
      continue;
    }
    if (hour >= WINDOW_END_HOUR) {
      // move to next day 10:00 MSK
      msk.setUTCDate(msk.getUTCDate() + 1);
      msk.setUTCHours(WINDOW_START_HOUR, 0, 0, 0);
      cursor = new Date(msk.getTime() - MSK_OFFSET * 60_000);
      continue;
    }
    const used = perDayUsage.get(dayKey) ?? 0;
    if (used >= PER_DAY) {
      msk.setUTCDate(msk.getUTCDate() + 1);
      msk.setUTCHours(WINDOW_START_HOUR, 0, 0, 0);
      cursor = new Date(msk.getTime() - MSK_OFFSET * 60_000);
      continue;
    }
    slots.push(new Date(cursor.getTime()));
    perDayUsage.set(dayKey, used + 1);
    cursor = new Date(cursor.getTime() + INTERVAL_MIN * 60_000);
  }
  return slots;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { lead_ids, subject, body, mode } = await req.json();
    if (!subject || !body) return new Response(JSON.stringify({ error: "subject/body required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch leads
    let q = admin.from("sales_leads").select("id,name,email,contact_person,status").eq("user_id", user.id).not("email", "is", null);
    if (Array.isArray(lead_ids) && lead_ids.length > 0) {
      q = q.in("id", lead_ids);
    } else if (mode === "auto_new") {
      q = q.eq("status", "new").limit(PER_DAY);
    } else {
      return new Response(JSON.stringify({ error: "no leads" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: leads, error: leadErr } = await q;
    if (leadErr) throw leadErr;
    if (!leads || !leads.length) return new Response(JSON.stringify({ error: "Нет подходящих лидов с email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Filter already-queued
    const { data: existing } = await admin.from("email_campaign_queue")
      .select("lead_id,scheduled_at,status")
      .eq("created_by", user.id)
      .in("status", ["queued", "sending", "sent"]);
    const alreadyEmailed = new Set((existing ?? []).map(r => r.lead_id));
    const candidates = leads.filter(l => l.email && !alreadyEmailed.has(l.id));
    if (!candidates.length) return new Response(JSON.stringify({ error: "Все эти лиды уже в очереди или получили письмо" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Count current usage per day from existing queue (queued + sent today and future)
    const perDayUsage = new Map<string, number>();
    for (const r of existing ?? []) {
      const d = new Date(r.scheduled_at as string);
      const msk = new Date(d.getTime() + MSK_OFFSET * 60_000);
      const key = msk.toISOString().slice(0, 10);
      perDayUsage.set(key, (perDayUsage.get(key) ?? 0) + 1);
    }

    const start = new Date(Date.now() + 60_000); // +1 min
    const slots = pickSlots(candidates.length, perDayUsage, start);

    const rows = candidates.map((l, i) => {
      const { subject: sub, html } = renderBody(subject, body, l);
      return {
        lead_id: l.id,
        email: l.email,
        subject: sub,
        body_html: html,
        scheduled_at: slots[i].toISOString(),
        status: "queued",
        created_by: user.id,
      };
    });

    const { error: insErr } = await admin.from("email_campaign_queue").insert(rows);
    if (insErr) throw insErr;

    return new Response(JSON.stringify({
      success: true,
      queued: rows.length,
      first_at: rows[0].scheduled_at,
      last_at: rows[rows.length - 1].scheduled_at,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("enqueue-campaign error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});