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

    // Support test mode
    let isTest = false;
    try { const body = await req.json(); isTest = body?.test === true; } catch {}
    
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

    // 3. Website contracts approaching 1-year anniversary (14 days before)
    // For "Сайт" contracts: remind 2 weeks before the contract_date anniversary
    const { data: allRenewalContracts, error: err3 } = await supabase
      .from("contracts")
      .select("id, client_name, contract_number, contract_date, amount, contract_type")
      .eq("is_archived", false)
      .in("contract_type", ["Сайт", "ФРДО"])
      .not("contract_date", "is", null);

    if (err3) {
      console.error("Error fetching site contracts:", err3);
      throw err3;
    }

    // Check which contracts have an anniversary within 14 days
    const renewalReminders = (allRenewalContracts || []).filter(c => {
      const contractDate = new Date(c.contract_date!);
      const todayDate = new Date(today);
      // Calculate next anniversary
      const nextAnniversary = new Date(contractDate);
      nextAnniversary.setFullYear(todayDate.getFullYear());
      // If anniversary already passed this year, check next year
      if (nextAnniversary < todayDate) {
        nextAnniversary.setFullYear(todayDate.getFullYear() + 1);
      }
      // Check if anniversary is exactly 14 days from now
      const diffMs = nextAnniversary.getTime() - todayDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 14;
    });

    const overdueCount = overdue?.length || 0;
    const expiringCount = expiring?.length || 0;
    const renewalCount = renewalReminders.length;

    if (overdueCount === 0 && expiringCount === 0 && renewalCount === 0 && !isTest) {
      console.log("No notifications needed");
      return new Response(
        JSON.stringify({ success: true, message: "No notifications needed", overdue: 0, expiring: 0, renewals: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message
    let text = isTest 
      ? `🔔 <b>Тестовый отчёт по оплатам</b>\n\n`
      : `📊 <b>Ежедневный отчёт по оплатам</b>\n\n`;

    if (isTest && overdueCount === 0 && expiringCount === 0 && renewalCount === 0) {
      text += `✅ Нет просроченных, истекающих или требующих продления договоров.\n`;
      text += `📅 Напоминания активны для типов: Сайт, ФРДО\n`;
    }

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

    if (renewalCount > 0) {
      text += `🔄 <b>Продление договоров через 2 недели (${renewalCount}):</b>\n`;
      for (const c of renewalReminders) {
        const todayDate = new Date(today);
        const contractDate = new Date(c.contract_date!);
        const nextAnniversary = new Date(contractDate);
        nextAnniversary.setFullYear(todayDate.getFullYear());
        if (nextAnniversary < todayDate) nextAnniversary.setFullYear(todayDate.getFullYear() + 1);
        const diffDays = Math.round((nextAnniversary.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const amt = c.amount ? `${Number(c.amount).toLocaleString("ru-RU")} ₽` : "—";
        const num = c.contract_number ? `№${c.contract_number}` : "";
        const type = c.contract_type || "";
        const contractDateStr = c.contract_date
          ? new Date(c.contract_date).toLocaleDateString("ru-RU")
          : "—";
        text += `  • ${c.client_name} ${num} [${type}] — ${amt} (договор от ${contractDateStr}, через ${diffDays} дн.)\n`;
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

    console.log(`Notification sent: ${overdueCount} overdue, ${expiringCount} expiring, ${renewalCount} renewals`);

    return new Response(
      JSON.stringify({ success: true, overdue: overdueCount, expiring: expiringCount, renewals: renewalCount }),
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
