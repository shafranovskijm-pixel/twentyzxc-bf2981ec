import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Simple rate limiter to prevent flood attacks
const recentRequests = new Map<string, number>();
const RATE_LIMIT_MS = 2000;

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, timestamp] of recentRequests) {
    if (now - timestamp > RATE_LIMIT_MS * 10) {
      recentRequests.delete(key);
    }
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  try {
    const BOT_TOKEN = Deno.env.get("ZXC_BOT_TOKEN")!;
    const OWNER_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate webhook secret token (set via Telegram setWebhook API's secret_token param)
    // Uses BOT_TOKEN itself as the secret for simplicity - you can change this
    // by setting a custom secret_token when calling setWebhook and storing it as TELEGRAM_WEBHOOK_SECRET
    const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") || BOT_TOKEN;
    const receivedToken = req.headers.get("X-Telegram-Bot-Api-Secret-Token");

    if (receivedToken !== webhookSecret) {
      return new Response("Unauthorized", { status: 403 });
    }

    // Rate limiting by IP
    cleanupOldEntries();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const lastReq = recentRequests.get(ip) || 0;
    if (Date.now() - lastReq < RATE_LIMIT_MS) {
      return new Response("OK", { status: 200 });
    }
    recentRequests.set(ip, Date.now());

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const update = await req.json();
    const message = update?.message;

    if (!message) {
      return new Response("OK", { status: 200 });
    }

    // Validate basic Telegram message structure
    if (!message.chat?.id || typeof message.chat.id !== "number") {
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;
    const text = (message.text || "").trim();
    const from = message.from || {};

    // Limit text length to prevent abuse
    if (text.length > 500) {
      return new Response("OK", { status: 200 });
    }

    const sendMessage = async (targetChatId: number, msg: string) => {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: targetChatId, text: msg, parse_mode: "HTML" }),
      });
    };

    if (text === "/start") {
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

      await sendMessage(chatId, "👋 Привет! Вы подписались на уведомления от <b>ZXC.ru</b>.\n\nЧтобы привязать ваш сайт из конструктора, отправьте:\n<code>/link ваш-slug</code>\n\nНапишите /stop чтобы отписаться.");

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
    } else if (text.startsWith("/link ")) {
      const slug = text.replace("/link ", "").trim().toLowerCase().slice(0, 100);

      if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
        await sendMessage(chatId, "❌ Укажите корректный slug проекта.\nПример: <code>/link my-site</code>");
        return new Response("OK", { status: 200 });
      }

      const { data: project, error } = await supabase
        .from("playground_projects")
        .select("id, title, telegram_chat_id")
        .eq("slug", slug)
        .single();

      if (error || !project) {
        await sendMessage(chatId, `❌ Проект не найден.\nПроверьте slug и попробуйте снова.`);
        return new Response("OK", { status: 200 });
      }

      await supabase
        .from("playground_projects")
        .update({ telegram_chat_id: chatId } as any)
        .eq("id", project.id);

      await sendMessage(chatId, `✅ Telegram привязан к проекту <b>${escapeHtml(project.title)}</b>!\n\nТеперь вы будете получать заявки с вашего сайта.`);

      const name = [from.first_name, from.last_name].filter(Boolean).join(" ");
      const username = from.username ? ` (@${from.username})` : "";
      await sendMessage(
        Number(OWNER_CHAT_ID),
        `🔗 Привязка Telegram к проекту\n\n👤 ${name}${username}\n📂 Проект: <b>${escapeHtml(project.title)}</b>\n🆔 Chat ID: <code>${chatId}</code>`
      );
    } else if (text.startsWith("/unlink")) {
      const slug = text.replace("/unlink", "").trim().toLowerCase().slice(0, 100);

      if (!slug) {
        const { data: projects } = await supabase
          .from("playground_projects")
          .select("id, title")
          .eq("telegram_chat_id", chatId);

        if (!projects || projects.length === 0) {
          await sendMessage(chatId, "ℹ️ У вас нет привязанных проектов.");
          return new Response("OK", { status: 200 });
        }

        await supabase
          .from("playground_projects")
          .update({ telegram_chat_id: null } as any)
          .eq("telegram_chat_id", chatId);

        const titles = projects.map(p => `• ${escapeHtml(p.title)}`).join("\n");
        await sendMessage(chatId, `✅ Telegram отвязан от всех проектов:\n${titles}\n\nВы больше не будете получать заявки.`);
      } else {
        if (!/^[a-z0-9-]+$/.test(slug)) {
          await sendMessage(chatId, "❌ Некорректный slug.");
          return new Response("OK", { status: 200 });
        }

        const { data: project, error } = await supabase
          .from("playground_projects")
          .select("id, title, telegram_chat_id")
          .eq("slug", slug)
          .single();

        if (error || !project) {
          await sendMessage(chatId, `❌ Проект не найден.`);
          return new Response("OK", { status: 200 });
        }

        if (project.telegram_chat_id !== chatId) {
          await sendMessage(chatId, `⚠️ Этот проект не привязан к вашему Telegram.`);
          return new Response("OK", { status: 200 });
        }

        await supabase
          .from("playground_projects")
          .update({ telegram_chat_id: null } as any)
          .eq("id", project.id);

        await sendMessage(chatId, `✅ Telegram отвязан от проекта <b>${escapeHtml(project.title)}</b>.\n\nВы больше не будете получать заявки с этого сайта.`);
      }
    } else {
      const name = [from.first_name, from.last_name].filter(Boolean).join(" ");
      const username = from.username ? ` (@${from.username})` : "";

      // Save as lead
      if (text) {
        await supabase.from("leads").insert({
          source: "telegram",
          name: name || (from.username ? `@${from.username}` : null),
          message: text,
          telegram_chat_id: chatId,
          status: "new",
        });
      }

      await sendMessage(
        Number(OWNER_CHAT_ID),
        `💬 Сообщение от ${name}${username}\n🆔 <code>${chatId}</code>\n\n${escapeHtml(text)}`
      );
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("OK", { status: 200 });
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}