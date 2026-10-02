import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getNotificationSettings, getDismissedNotifications, isDismissed } from "../_shared/notification-settings.ts";
import { selectRenewalReminders, describeRenewalTerm } from "../_shared/renewal-reminders.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // 3. Recorded service terms within 14 days; a document date is not an expiry.
    const { data: allRenewalContracts, error: err3 } = await supabase
      .from("contracts")
      .select("id, client_name, contract_number, amount, contract_type, service_end, paid_until, is_archived, is_one_time, service_no_deadline")
      .eq("is_archived", false)
      .in("contract_type", ["Сайт", "ФРДО"]);

    if (err3) {
      console.error("Error fetching site contracts:", err3);
      throw err3;
    }

    const renewalReminders = selectRenewalReminders(allRenewalContracts || [], today);

    // 4. Service deadlines approaching (3 months, 2 months, 1 month)
    const { data: allClientsWithDeadline, error: err4 } = await supabase
      .from("clients")
      .select("id, name, service_deadline")
      .not("service_deadline", "is", null);

    if (err4) {
      console.error("Error fetching client deadlines:", err4);
      throw err4;
    }

    const serviceReminders: { id: string; name: string; deadline: string; daysLeft: number; label: string }[] = [];
    const todayMs = new Date(today).getTime();
    for (const cl of (allClientsWithDeadline || [])) {
      const dlMs = new Date(cl.service_deadline!).getTime();
      const diffDays = Math.round((dlMs - todayMs) / (1000 * 60 * 60 * 24));
      // Check for approximately 3 months (85-95 days), 2 months (55-65 days), 1 month (25-35 days)
      if (diffDays >= 85 && diffDays <= 95) {
        serviceReminders.push({ id: cl.id, name: cl.name, deadline: cl.service_deadline!, daysLeft: diffDays, label: "3 мес" });
      } else if (diffDays >= 55 && diffDays <= 65) {
        serviceReminders.push({ id: cl.id, name: cl.name, deadline: cl.service_deadline!, daysLeft: diffDays, label: "2 мес" });
      } else if (diffDays >= 25 && diffDays <= 35) {
        serviceReminders.push({ id: cl.id, name: cl.name, deadline: cl.service_deadline!, daysLeft: diffDays, label: "1 мес" });
      }
    }

    const notifSettings = await getNotificationSettings(supabase);
    const dismissedMap = await getDismissedNotifications(supabase);
    const overdueList = (notifSettings.overdue ? (overdue || []) : [])
      .filter((c) => !isDismissed(dismissedMap, `overdue:${c.id}`, String(c.paid_until)));
    const expiringList = (notifSettings.expiring ? (expiring || []) : [])
      .filter((c) => !isDismissed(dismissedMap, `expiring:${c.id}`, String(c.paid_until)));
    const renewalList = (notifSettings.renewals ? renewalReminders : []).filter((reminder) =>
      // Keep the existing per-year dismissal format, using the actual term's year.
      !isDismissed(dismissedMap, `renewals:${reminder.contract.id}`, reminder.expiryDate.slice(0, 4))
    );
    const serviceList = (notifSettings.deadlines ? serviceReminders : [])
      .filter((r) => !isDismissed(dismissedMap, `deadlines:${r.id}`, String(r.deadline)));

    const overdueCount = overdueList.length;
    const expiringCount = expiringList.length;
    const renewalCount = renewalList.length;
    const serviceReminderCount = serviceList.length;

    if (overdueCount === 0 && expiringCount === 0 && renewalCount === 0 && serviceReminderCount === 0 && !isTest) {
      console.log("No notifications needed");
      return new Response(
        JSON.stringify({ success: true, message: "No notifications needed", overdue: 0, expiring: 0, renewals: 0, serviceReminders: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message
    let text = isTest 
      ? `🔔 <b>Тестовый отчёт по оплатам</b>\n\n`
      : `📊 <b>Ежедневный отчёт по оплатам</b>\n\n`;

    if (isTest && overdueCount === 0 && expiringCount === 0 && renewalCount === 0 && serviceReminderCount === 0) {
      text += `✅ Нет просроченных, истекающих или требующих продления договоров.\n`;
      text += `📅 Напоминания активны для типов: Сайт, ФРДО, сроки услуг\n`;
    }

    if (overdueCount > 0) {
      text += `🔴 <b>Просрочено (${overdueCount}):</b>\n`;
      for (const c of overdueList) {
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
      text += `🔄 <b>Проверить продление в ближайшие 14 дней (${renewalCount}):</b>\n`;
      for (const reminder of renewalList) {
        const c = reminder.contract;
        const amt = c.amount ? `${Number(c.amount).toLocaleString("ru-RU")} ₽` : "—";
        const num = c.contract_number ? `№${c.contract_number}` : "";
        const type = c.contract_type || "";
        text += `  • ${c.client_name} ${num} [${type}] — ${amt} (${describeRenewalTerm(reminder)})\n`;
      }
      text += `\n`;
    }

    if (expiringCount > 0) {
      text += `🟡 <b>Истекает в ближайшие 3 дня (${expiringCount}):</b>\n`;
      for (const c of expiringList) {
        const amt = c.amount ? `${Number(c.amount).toLocaleString("ru-RU")} ₽` : "—";
        const num = c.contract_number ? `№${c.contract_number}` : "";
        const paidUntil = c.paid_until
          ? new Date(c.paid_until).toLocaleDateString("ru-RU")
          : "—";
        text += `  • ${c.client_name} ${num} — ${amt} (до ${paidUntil})\n`;
      }
    }

    if (serviceReminderCount > 0) {
      text += `\n📋 <b>Истекающие сроки услуг (${serviceReminderCount}):</b>\n`;
      for (const r of serviceList) {
        const emoji = r.label === "1 мес" ? "🔴" : r.label === "2 мес" ? "🟠" : "🟡";
        const dlStr = new Date(r.deadline).toLocaleDateString("ru-RU");
        text += `  ${emoji} Через ${r.label}: ${r.name} (до ${dlStr})\n`;
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

    console.log(`Notification sent: ${overdueCount} overdue, ${expiringCount} expiring, ${renewalCount} renewals, ${serviceReminderCount} service deadlines`);

    return new Response(
      JSON.stringify({ success: true, overdue: overdueCount, expiring: expiringCount, renewals: renewalCount, serviceReminders: serviceReminderCount }),
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
