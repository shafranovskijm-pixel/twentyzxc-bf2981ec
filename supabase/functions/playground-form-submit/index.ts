import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter
const recentSubmissions = new Map<string, number>();
const RATE_LIMIT_MS = 10000; // 10 seconds between submissions

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions) {
    if (now - timestamp > RATE_LIMIT_MS * 6) {
      recentSubmissions.delete(key);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    cleanupOldEntries();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const lastSubmit = recentSubmissions.get(ip) || 0;
    if (Date.now() - lastSubmit < RATE_LIMIT_MS) {
      return new Response(JSON.stringify({ error: "Please wait before submitting again" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    recentSubmissions.set(ip, Date.now());

    const { slug, name, contact, message } = await req.json();

    if (!slug || !name || !contact) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input length validation
    if (slug.length > 100 || name.length > 200 || contact.length > 255 || (message && message.length > 2000)) {
      return new Response(JSON.stringify({ error: "Input too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: project, error } = await supabase
      .from("playground_projects")
      .select("title, telegram_chat_id")
      .eq("slug", slug)
      .single();

    if (error || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!project.telegram_chat_id) {
      return new Response(
        JSON.stringify({ success: true, delivered: false, reason: "no_telegram" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BOT_TOKEN = Deno.env.get("ZXC_BOT_TOKEN")!;
    const text =
      `📬 Новая заявка с сайта!\n\n` +
      `🌐 Проект: <b>${escapeHtml(project.title)}</b>\n` +
      `👤 Имя: ${escapeHtml(name)}\n` +
      `📞 Контакт: ${escapeHtml(contact)}\n` +
      (message ? `💬 Сообщение: ${escapeHtml(message)}` : "");

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: project.telegram_chat_id,
        text,
        parse_mode: "HTML",
      }),
    });

    return new Response(
      JSON.stringify({ success: true, delivered: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("playground-form-submit error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
