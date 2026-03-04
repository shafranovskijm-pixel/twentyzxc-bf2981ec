import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      console.error("Missing ZXC_BOT_TOKEN or TELEGRAM_CHAT_ID");
      return new Response(
        JSON.stringify({ success: false, error: "Missing bot config" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date().toISOString().split("T")[0];

    // 1. Overdue contracts (paid_until < today AND not paid)
    const { data: overdue, error: err1 } = await supabase
      .from("contracts")
      .select("id, client_name, contract_number, paid_until, amount, payment_status")
      .eq("is_archived", false)
      .neq("payment_status", "оплачено")
      .lt("paid_until", today)
      .not("paid_until", "is", null);

    if (err1) {
      console.error("Error fetching overdue:", err1);
      throw err1;
    }

    // 2. Expiring in 3 days
    const in3days = new Date();
    in3days.setDate(in3days.getDate() + 3);
    const in3daysStr = in3days.toISOString().split("T")[0];

    const { data: expiring, error: err2 } = await supabase
      .from("contracts")
      .select("id, client_name, contract_number, paid_until, amount, payment_status")
      .eq("is_archived", false)
      .neq("payment_status", "оплачено")
      .gte("paid_until", today)
      .lte("paid_until", in3daysStr)
      .not("paid_until", "is", null);

    if (err2) {
      console.error("Error fetching expiring:", err2);
      throw err2;
    }

    const overdueCount = overdue?.length || 0;
    const expiringCount = expiring?.length || 0;

    if (overdueCount === 0 && expiringCount === 0) {
      console.log("No overdue or expiring contracts found");
      return new Response(
        JSON.stringify({ success: true, message: "No notifications needed", overdue: 0, expiring: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message
    let text = `📊 <b>Ежедневный отчёт по оплатам</b>\n\n`;

    if (overdueCount > 0) {
      text += `🔴 <b>Просрочено (${overdueCount}):</b>\n`;
      for (const c of overdue!) {
        const amt = c.amount ? `${Number(c.amount).toLocaleString("ru-RU")} ₽` : "—";
        const num = c.contract_number ? `№${c.contract_number}` : "";
        const paidUntil = c.paid_until
          ? new Date(c.paid_until).toLocaleDateString("ru-RU")
          : "—";
        text += `  • ${c.client_name} ${num} — ${amt} (до ${paidUntil})\n`;
      }
      text += `\n`;
    }

    if (expiringCount > 0) {
      text += `🟡 <b>Истекает в ближайшие 3 дня (${expiringCount}):</b>\n`;
      for (const c of expiring!) {
        const amt = c.amount ? `${Number(c.amount).toLocaleString("ru-RU")} ₽` : "—";
        const num = c.contract_number ? `№${c.contract_number}` : "";
        const paidUntil = c.paid_until
          ? new Date(c.paid_until).toLocaleDateString("ru-RU")
          : "—";
        text += `  • ${c.client_name} ${num} — ${amt} (до ${paidUntil})\n`;
      }
    }

    // Send to Telegram
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: Number(CHAT_ID),
        text,
        parse_mode: "HTML",
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Telegram API error:", result);
      throw new Error(result.description || "Telegram API error");
    }

    console.log(`Notification sent: ${overdueCount} overdue, ${expiringCount} expiring`);

    return new Response(
      JSON.stringify({ success: true, overdue: overdueCount, expiring: expiringCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-overdue error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
