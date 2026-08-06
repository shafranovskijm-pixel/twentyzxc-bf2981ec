import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getNotificationSettings } from "../_shared/notification-settings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const BOT_TOKEN = Deno.env.get("ZXC_BOT_TOKEN");
    const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing bot config" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all pending reminders where send_at <= now
    const { data: reminders, error } = await supabase
      .from("scheduled_reminders")
      .select("*")
      .eq("status", "pending")
      .lte("send_at", new Date().toISOString())
      .limit(50);

    if (error) {
      throw error;
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notifSettings = await getNotificationSettings(supabase);
    if (!notifSettings.tasks) {
      console.log("Task reminders disabled in settings");
      return new Response(
        JSON.stringify({ success: true, sent: 0, skipped: reminders.length, reason: "disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    for (const reminder of reminders) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: Number(CHAT_ID),
            text: reminder.message,
            parse_mode: "HTML",
          }),
        });

        if (res.ok) {
          await supabase
            .from("scheduled_reminders")
            .update({ status: "sent" })
            .eq("id", reminder.id);
          sent++;
        } else {
          const err = await res.json();
          console.error("Telegram error for reminder", reminder.id, err);
          await supabase
            .from("scheduled_reminders")
            .update({ status: "failed" })
            .eq("id", reminder.id);
        }
      } catch (e) {
        console.error("Error sending reminder", reminder.id, e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, total: reminders.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-scheduled-reminders error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
