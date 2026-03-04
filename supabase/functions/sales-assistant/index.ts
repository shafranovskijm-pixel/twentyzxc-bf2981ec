import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { messages, action } = await req.json();

    // If action is "save_note", save to sales_notes
    if (action === "save_note") {
      const { client_id, content, note_type } = await req.json().catch(() => ({}));
      if (content) {
        await supabase.from("sales_notes").insert({ client_id, content, note_type: note_type || "general" });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch context data for the AI
    const [clientsRes, contractsRes, leadsRes, notesRes] = await Promise.all([
      supabase.from("clients").select("id, name, service_type, email, phone, notes, payment_date").order("name"),
      supabase.from("contracts").select("id, client_name, contract_number, amount, amount_extra, payment_status, paid_until, contract_type, is_archived, notes").order("contract_number", { ascending: false }),
      supabase.from("leads").select("*").eq("status", "new").order("created_at", { ascending: false }).limit(20),
      supabase.from("sales_notes").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    const clients = clientsRes.data || [];
    const contracts = contractsRes.data || [];
    const leads = leadsRes.data || [];
    const notes = notesRes.data || [];

    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `Ты — AI-ассистент по продажам компании Синтагма. Твоя задача — помогать управлять клиентской базой, прогнозировать поступления и находить возможности для допродаж.

ТЕКУЩАЯ ДАТА: ${today}

КЛИЕНТЫ (${clients.length}):
${clients.map(c => `- ${c.name} | Услуга: ${c.service_type || "не указана"} | Email: ${c.email || "—"} | Тел: ${c.phone || "—"} | Заметки: ${c.notes || "—"} | Дата оплаты: ${c.payment_date || "—"}`).join("\n")}

ДОГОВОРЫ (${contracts.length}):
${contracts.map(c => `- №${c.contract_number || "—"} | ${c.client_name} | Тип: ${c.contract_type || "—"} | Сумма: ${c.amount || 0}₽ | Доп: ${c.amount_extra || 0}₽ | Статус: ${c.payment_status || "—"} | Оплачено до: ${c.paid_until || "—"} | Архив: ${c.is_archived ? "Да" : "Нет"} | Заметки: ${c.notes || "—"}`).join("\n")}

НОВЫЕ ЛИДЫ (${leads.length}):
${leads.map(l => `- ${l.name || "Аноним"} | ${l.message || "—"} | Источник: ${l.source} | ${l.created_at}`).join("\n")}

ЗАМЕТКИ ПО ПРОДАЖАМ (последние ${notes.length}):
${notes.map(n => `- [${n.note_type}] ${n.content} (${n.created_at})`).join("\n")}

ПРАВИЛА:
1. Отвечай на русском языке, кратко и по делу
2. При расчёте прогноза поступлений используй данные из договоров: сумму (amount + amount_extra), дату "оплачено до" (paid_until), статус оплаты
3. Если видишь клиентов без договоров или с истёкшей оплатой — предлагай действия по допродаже
4. Для прогноза: контракты где paid_until < текущая дата = просрочка, paid_until в ближайшие 30 дней = ожидаемая оплата
5. Задавай уточняющие вопросы, если не хватает данных
6. Используй форматирование markdown для читабельности
7. При анализе группируй информацию: действующие клиенты, просроченные, потенциальные допродажи`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages || []),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов, попробуйте позже." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Требуется пополнение баланса AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Ошибка AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sales-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
