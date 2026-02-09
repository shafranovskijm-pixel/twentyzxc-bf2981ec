import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  // Brief-specific fields
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
    lines.push(`📧 <b>Email:</b> ${escapeHtml(data.email)}`);
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
    lines.push(`📧 <b>Email:</b> ${escapeHtml(data.email)}`);
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
  lines.push(`🕐 <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</i>`);
  
  return lines.join('\n');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }
    if (!TELEGRAM_CHAT_ID) {
      throw new Error('TELEGRAM_CHAT_ID is not configured');
    }

    const data: ContactFormData = await req.json();
    
    // Validate required fields
    if (!data.name || !data.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = formatMessage(data);

    const telegramResponse = await fetch(
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

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', telegramResult);
      throw new Error(`Telegram API error: ${telegramResult.description || 'Unknown error'}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending telegram message:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
