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

const formatMessage = (data: ContactFormData): string => {
  const lines: string[] = [];
  
  if (data.type === 'contact') {
    lines.push('📩 *Новая заявка с сайта*');
    lines.push('');
    if (data.service) lines.push(`🔑 *Услуга:* ${escapeMarkdown(data.service)}`);
    lines.push(`👤 *Имя:* ${escapeMarkdown(data.name)}`);
    lines.push(`📧 *Email:* ${escapeMarkdown(data.email)}`);
    if (data.phone) lines.push(`📱 *Телефон:* ${escapeMarkdown(data.phone)}`);
    if (data.message) {
      lines.push('');
      lines.push(`💬 *Сообщение:*`);
      lines.push(escapeMarkdown(data.message));
    }
  } else {
    lines.push('📋 *Новый бриф*');
    lines.push('');
    if (data.service) lines.push(`🏷 *Услуга:* ${escapeMarkdown(data.service)}`);
    lines.push(`👤 *Имя:* ${escapeMarkdown(data.name)}`);
    lines.push(`📧 *Email:* ${escapeMarkdown(data.email)}`);
    if (data.phone) lines.push(`📱 *Телефон:* ${escapeMarkdown(data.phone)}`);
    if (data.company) lines.push(`🏢 *Компания:* ${escapeMarkdown(data.company)}`);
    
    if (data.projectType) {
      lines.push('');
      lines.push(`📁 *Тип проекта:* ${escapeMarkdown(data.projectType)}`);
    }
    
    if (data.description) {
      lines.push('');
      lines.push(`📝 *Описание:*`);
      lines.push(escapeMarkdown(data.description));
    }
    
    if (data.features) {
      lines.push('');
      lines.push(`⚙️ *Функционал:*`);
      lines.push(escapeMarkdown(data.features));
    }
    
    if (data.pages) lines.push(`📄 *Страницы:* ${escapeMarkdown(data.pages)}`);
    if (data.products) lines.push(`📦 *Товары:* ${escapeMarkdown(data.products)}`);
    if (data.integrations) lines.push(`🔗 *Интеграции:* ${escapeMarkdown(data.integrations)}`);
    if (data.payment) lines.push(`💳 *Оплата:* ${escapeMarkdown(data.payment)}`);
    if (data.delivery) lines.push(`🚚 *Доставка:* ${escapeMarkdown(data.delivery)}`);
    if (data.users) lines.push(`👥 *Нагрузка:* ${escapeMarkdown(data.users)}`);
    if (data.budget) lines.push(`💰 *Бюджет:* ${escapeMarkdown(data.budget)}`);
    if (data.deadline) lines.push(`⏰ *Сроки:* ${escapeMarkdown(data.deadline)}`);
  }
  
  lines.push('');
  lines.push(`🕐 _${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}_`);
  
  return lines.join('\n');
};

const escapeMarkdown = (text: string): string => {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
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
          parse_mode: 'MarkdownV2',
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
