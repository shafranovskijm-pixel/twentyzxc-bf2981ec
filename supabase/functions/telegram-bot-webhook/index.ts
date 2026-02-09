import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  try {
    const BOT_TOKEN = Deno.env.get("ZXC_BOT_TOKEN")!;
    const OWNER_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const update = await req.json();
    const message = update?.message;

    if (!message) {
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;
    const text = (message.text || "").trim();
    const from = message.from || {};

    const sendMessage = async (targetChatId: number, msg: string) => {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: targetChatId, text: msg, parse_mode: "HTML" }),
      });
    };

    if (text === "/start") {
      // Upsert user
      await supabase.from("telegram_bot_users").upsert(
        {
          chat_id: chatId,
          username: from.username || null,
          first_name: from.first_name || null,
          last_name: from.last_name || null,
          is_active: true,
        },
        { onConflict: "chat_id" }
      );

      await sendMessage(chatId, "👋 Привет! Вы подписались на уведомления от <b>ZXC.ru</b>.\n\nНапишите /stop чтобы отписаться.");

      // Notify owner
      const name = [from.first_name, from.last_name].filter(Boolean).join(" ");
      const username = from.username ? ` (@${from.username})` : "";
      await sendMessage(
        Number(OWNER_CHAT_ID),
        `🆕 Новый подписчик бота!\n\n👤 ${name}${username}\n🆔 Chat ID: <code>${chatId}</code>`
      );
    } else if (text === "/stop") {
      await supabase
        .from("telegram_bot_users")
        .update({ is_active: false })
        .eq("chat_id", chatId);

      await sendMessage(chatId, "👋 Вы отписались от уведомлений. Напишите /start чтобы подписаться снова.");
    } else {
      // Forward message to owner
      const name = [from.first_name, from.last_name].filter(Boolean).join(" ");
      const username = from.username ? ` (@${from.username})` : "";
      await sendMessage(
        Number(OWNER_CHAT_ID),
        `💬 Сообщение от ${name}${username}\n🆔 <code>${chatId}</code>\n\n${text}`
      );
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("OK", { status: 200 });
  }
});
