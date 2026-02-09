

# Интеграция Telegram бота @zxc_ru_bot

## Архитектура

Бот будет работать через webhook: Telegram отправляет обновления на наш backend, а мы обрабатываем их и отвечаем пользователю.

```text
Пользователь нажимает /start
        |
        v
Telegram API --webhook--> Edge Function (telegram-bot-webhook)
        |
        v
  Сохраняем chat_id в таблицу telegram_bot_users
        |
        v
  Отправляем приветственное сообщение пользователю
  + уведомляем владельца (TELEGRAM_CHAT_ID) о новом подписчике
```

## Что будет сделано

### 1. Сохранить токен бота
Новый секрет `ZXC_BOT_TOKEN` с переданным токеном (отдельно от существующего `TELEGRAM_BOT_TOKEN`, который используется для форм обратной связи).

### 2. Таблица `telegram_bot_users`
Хранит всех пользователей, нажавших /start:
- `id` (uuid)
- `chat_id` (bigint, уникальный) -- Telegram chat ID
- `username` (text) -- @username если есть
- `first_name`, `last_name` (text)
- `created_at` (timestamp)
- `is_active` (boolean, default true) -- для /stop

RLS: публичный SELECT/INSERT (webhook работает без авторизации), UPDATE только для edge function.

### 3. Edge Function `telegram-bot-webhook`
Обрабатывает входящие сообщения от Telegram:
- `/start` -- сохраняет пользователя в БД, отправляет приветствие, уведомляет владельца
- `/stop` -- помечает `is_active = false`
- Любое другое сообщение -- пересылает владельцу с указанием chat_id отправителя

JWT отключен (Telegram шлёт запросы напрямую). Защита через секретный путь webhook.

### 4. Регистрация webhook
После деплоя edge function -- вызов Telegram API `setWebhook` для привязки URL.

### 5. Edge Function `send-bot-message`
Позволяет отправлять сообщения пользователям бота:
- Принимает `chat_id` и `text`
- Отправляет через Telegram Bot API
- Можно вызывать из админки или других edge functions

---

## Техническая часть

### Новые файлы
- `supabase/functions/telegram-bot-webhook/index.ts` -- обработка webhook
- `supabase/functions/send-bot-message/index.ts` -- отправка сообщений пользователям

### Миграция SQL
```sql
CREATE TABLE telegram_bot_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint UNIQUE NOT NULL,
  username text,
  first_name text,
  last_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
-- RLS policies for webhook access
```

### Секреты
- `ZXC_BOT_TOKEN` -- токен бота @zxc_ru_bot

### Конфигурация (config.toml)
```toml
[functions.telegram-bot-webhook]
verify_jwt = false

[functions.send-bot-message]
verify_jwt = false
```

### Регистрация webhook
После деплоя вызываем:
```
POST https://api.telegram.org/bot<TOKEN>/setWebhook
body: { url: "https://veedztdijmscebgadzyx.supabase.co/functions/v1/telegram-bot-webhook" }
```

