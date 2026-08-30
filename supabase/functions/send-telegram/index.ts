import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getNotificationSettings } from "../_shared/notification-settings.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFormData {
  type: 'contact' | 'brief';
  service?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  projectType?: string;
  description?: string;
  features?: string;
  integrations?: string;
  users?: string;
  budget?: string;
  deadline?: string;
  pages?: string;
  products?: string;
  payment?: string;
  delivery?: string;
  attribution?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_landing?: string;
  };
}

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

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const formatMessage = (data: ContactFormData): string => {
  const lines: string[] = [];
  
  if (data.type === 'contact') {
    lines.push('📩 <b>Новая заявка с сайта</b>');
    lines.push('');
    if (data.service) lines.push(`🔑 <b>Услуга:</b> ${escapeHtml(data.service)}`);
    lines.push(`👤 <b>Имя:</b> ${escapeHtml(data.name)}`);
    if (data.email) lines.push(`📧 <b>Email:</b> ${escapeHtml(data.email)}`);
    if (data.phone) lines.push(`📱 <b>Телефон:</b> ${escapeHtml(data.phone)}`);
    if (data.message) {
      lines.push('');
      lines.push(`💬 <b>Сообщение:</b>`);
      lines.push(escapeHtml(data.message));
    }
  } else {
    lines.push('📋 <b>Новый бриф</b>');
    lines.push('');
    if (data.service) lines.push(`🏷 <b>Услуга:</b> ${escapeHtml(data.service)}`);
    lines.push(`👤 <b>Имя:</b> ${escapeHtml(data.name)}`);
    if (data.email) lines.push(`📧 <b>Email:</b> ${escapeHtml(data.email)}`);
    if (data.phone) lines.push(`📱 <b>Телефон:</b> ${escapeHtml(data.phone)}`);
    if (data.company) lines.push(`🏢 <b>Компания:</b> ${escapeHtml(data.company)}`);
    
    if (data.projectType) {
      lines.push('');
      lines.push(`📁 <b>Тип проекта:</b> ${escapeHtml(data.projectType)}`);
    }
    
    if (data.description) {
      lines.push('');
      lines.push(`📝 <b>Описание:</b>`);
      lines.push(escapeHtml(data.description));
    }
    
    if (data.features) {
      lines.push('');
      lines.push(`⚙️ <b>Функционал:</b>`);
      lines.push(escapeHtml(data.features));
    }
    
    if (data.pages) lines.push(`📄 <b>Страницы:</b> ${escapeHtml(data.pages)}`);
    if (data.products) lines.push(`📦 <b>Товары:</b> ${escapeHtml(data.products)}`);
    if (data.integrations) lines.push(`🔗 <b>Интеграции:</b> ${escapeHtml(data.integrations)}`);
    if (data.payment) lines.push(`💳 <b>Оплата:</b> ${escapeHtml(data.payment)}`);
    if (data.delivery) lines.push(`🚚 <b>Доставка:</b> ${escapeHtml(data.delivery)}`);
    if (data.users) lines.push(`👥 <b>Нагрузка:</b> ${escapeHtml(data.users)}`);
    if (data.budget) lines.push(`💰 <b>Бюджет:</b> ${escapeHtml(data.budget)}`);
    if (data.deadline) lines.push(`⏰ <b>Сроки:</b> ${escapeHtml(data.deadline)}`);
  }
  
  lines.push('');
  if (data.attribution?.utm_source) {
    lines.push(`📊 <b>Источник:</b> ${escapeHtml(data.attribution.utm_source)}`);
    if (data.attribution.utm_campaign) {
      lines.push(`📣 <b>Кампания:</b> ${escapeHtml(data.attribution.utm_campaign)}`);
    }
    if (data.attribution.utm_content) {
      lines.push(`🧭 <b>Страница:</b> ${escapeHtml(data.attribution.utm_content)}`);
    }
  }
  lines.push('');
  lines.push(`🕐 <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</i>`);
  
  return lines.join('\n');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    cleanupOldEntries();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const lastSubmit = recentSubmissions.get(ip) || 0;
    if (Date.now() - lastSubmit < RATE_LIMIT_MS) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please wait before submitting again' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    recentSubmissions.set(ip, Date.now());

    const data: ContactFormData = await req.json();
    const phoneMirroredIntoEmail = Boolean(
      data.phone && data.email && data.phone === data.email,
    );
    const normalizedData: ContactFormData = {
      ...data,
      email: phoneMirroredIntoEmail ? "" : data.email?.trim() || "",
      phone: data.phone?.trim() || "",
    };
    
    // Validate required fields
    if (!normalizedData.name || (!normalizedData.email && !normalizedData.phone)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Name and a contact are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input length validation
    if (
      normalizedData.name.length > 200 ||
      normalizedData.email?.length > 255 ||
      normalizedData.phone?.length > 100
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'Input too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = formatMessage(normalizedData);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const leadMessage = [
      normalizedData.service ? `Услуга: ${normalizedData.service}` : "",
      normalizedData.message || "",
      normalizedData.company ? `Компания: ${normalizedData.company}` : "",
      normalizedData.projectType ? `Тип проекта: ${normalizedData.projectType}` : "",
      normalizedData.description ? `Описание: ${normalizedData.description}` : "",
      normalizedData.features ? `Функционал: ${normalizedData.features}` : "",
      normalizedData.pages ? `Страницы: ${normalizedData.pages}` : "",
      normalizedData.products ? `Товары: ${normalizedData.products}` : "",
      normalizedData.integrations ? `Интеграции: ${normalizedData.integrations}` : "",
      normalizedData.payment ? `Оплата: ${normalizedData.payment}` : "",
      normalizedData.delivery ? `Доставка: ${normalizedData.delivery}` : "",
      normalizedData.users ? `Нагрузка: ${normalizedData.users}` : "",
      normalizedData.budget ? `Бюджет: ${normalizedData.budget}` : "",
      normalizedData.deadline ? `Сроки: ${normalizedData.deadline}` : "",
      normalizedData.attribution?.utm_campaign
        ? `Кампания: ${normalizedData.attribution.utm_campaign}`
        : "",
      normalizedData.attribution?.utm_content
        ? `Страница: ${normalizedData.attribution.utm_content}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { error: leadError } = await supabase.from("leads").insert({
      source: normalizedData.attribution?.utm_source
        ? `24zxc.ru/${normalizedData.attribution.utm_source}`
        : "24zxc.ru",
      name: normalizedData.name,
      phone: normalizedData.phone || null,
      email: normalizedData.email || null,
      message: leadMessage || null,
      status: "new",
    });

    if (leadError) {
      console.error("Lead persistence error:", leadError);
      return new Response(
        JSON.stringify({ success: false, saved: false, error: "Lead could not be saved" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifSettings = await getNotificationSettings(supabase);
    if (!notifSettings.leads) {
      console.log("Lead notifications disabled in settings");
      return new Response(
        JSON.stringify({ success: true, saved: true, delivered: false, reason: 'disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const TELEGRAM_BOT_TOKEN = Deno.env.get('ZXC_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram configuration; lead saved without notification');
      return new Response(
        JSON.stringify({ success: true, saved: true, delivered: false, reason: 'telegram_not_configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let telegramResponse: Response;
    try {
      telegramResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );
    } catch (error) {
      console.error('Telegram transport error after lead persistence:', error);
      return new Response(
        JSON.stringify({ success: true, saved: true, delivered: false, reason: 'telegram_transport_error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!telegramResponse.ok) {
      console.error('Telegram API error after lead persistence:', {
        status: telegramResponse.status,
        statusText: telegramResponse.statusText,
      });
      return new Response(
        JSON.stringify({ success: true, saved: true, delivered: false, reason: 'telegram_error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, saved: true, delivered: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending telegram message:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to send message. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
