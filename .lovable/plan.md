

# Ассистент продаж + прогноз поступлений

## Что будет сделано

Под календарём планера появится **AI-ассистент продаж** — интерактивный чат-модуль, который:

1. **Анализирует клиентскую базу** — берёт данных из таблиц `clients`, `contracts`, `tasks` и задаёт уточняющие вопросы (кто действующий, кто нет, какие оплаты ожидаются, что ещё можно продать).

2. **Прогноз поступлений** — визуальный блок с 3 колонками: «Эта неделя», «Этот месяц», «Следующий месяц». Рассчитывается на основе `contracts.paid_until`, `contracts.amount`, статусов оплаты. AI уточняет прогноз через вопросы.

3. **Сохранение заметок** — ответы и решения сохраняются в поле `notes` клиента/договора или в отдельную таблицу `sales_notes`.

4. **Импорт лидов из Telegram** — входящие сообщения бота (заявки с сайта, сообщения) сохраняются как лиды, которые можно конвертировать в клиента одним кликом.

## Архитектура

### 1. Новая таблица `sales_notes` (миграция)
```sql
CREATE TABLE public.sales_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  note_type text DEFAULT 'general', -- general, upsell, payment, status
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.sales_notes ENABLE ROW LEVEL SECURITY;
-- RLS: только admin
```

### 2. Новая таблица `leads` (миграция)
```sql
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text DEFAULT 'telegram',
  name text,
  phone text,
  email text,
  message text,
  telegram_chat_id bigint,
  status text DEFAULT 'new', -- new, contacted, converted, rejected
  converted_client_id uuid REFERENCES public.clients(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- RLS: только admin
```

### 3. Edge Function `sales-assistant`
- Использует Lovable AI (gemini-3-flash-preview)
- Получает системный промпт с данными о клиентах, договорах, оплатах
- Задаёт структурированные вопросы, сохраняет ответы в `sales_notes`
- Рассчитывает прогноз поступлений

### 4. Обновление Telegram-бота
- В `telegram-bot-webhook` добавить сохранение входящих сообщений (не команд) в таблицу `leads`
- Каждое сообщение от незарегистрированного пользователя = потенциальный лид

### 5. Новый компонент `SalesAssistant.tsx`
- Встраивается в `PlannerTab.tsx` под календарём
- Содержит:
  - **Прогноз поступлений** — 3 карточки с суммами (неделя/месяц/след. месяц)
  - **AI-чат** — стриминговый диалог с ассистентом
  - **Лиды из Telegram** — список новых лидов с кнопкой «→ Клиент»

### 6. Компонент `LeadsPanel.tsx`
- Таблица лидов с фильтром по статусу
- Кнопка «Конвертировать в клиента» — создаёт запись в `clients` и открывает карточку

## Файлы

| Действие | Файл |
|----------|------|
| Создать | `src/components/admin/SalesAssistant.tsx` |
| Создать | `src/components/admin/LeadsPanel.tsx` |
| Создать | `supabase/functions/sales-assistant/index.ts` |
| Изменить | `src/components/admin/PlannerTab.tsx` — добавить SalesAssistant под календарём |
| Изменить | `supabase/functions/telegram-bot-webhook/index.ts` — сохранять сообщения как лиды |
| Миграция | Создать таблицы `sales_notes` и `leads` с RLS |

