

# Telegram-уведомления для клиентов конструктора

## Идея

Каждый пользователь конструктора сможет подключить свой Telegram через бота @zxc_ru_bot и получать заявки с сайта, который он построил. При этом ваши (владельца) заявки с основного сайта им приходить НЕ будут.

## Как это будет работать

```text
Клиент конструктора                     Посетитель его сайта
        |                                       |
  Нажимает "Подключить Telegram"         Заполняет форму на
  в конструкторе                         опубликованном сайте
        |                                       |
  Переходит в @zxc_ru_bot               Edge Function получает
  и нажимает /start                     заявку + slug проекта
        |                                       |
  Вводит код привязки                    Находит chat_id владельца
  (например: /link my-site)              проекта по slug
        |                                       |
  chat_id сохраняется в                  Отправляет уведомление
  playground_projects                    ТОЛЬКО ему
```

## Что будет сделано

### 1. Новый блок "Форма заявки" в конструкторе
Добавляется новый тип блока `form` в список блоков конструктора. При просмотре опубликованного сайта форма отображает поля: имя, телефон/email, сообщение. При отправке данные идут в Edge Function.

### 2. Привязка Telegram к проекту
- В таблицу `playground_projects` добавляется колонка `telegram_chat_id` (bigint, nullable)
- Бот @zxc_ru_bot получает команду `/link <slug>` -- она привязывает chat_id пользователя к конкретному проекту
- Бот проверяет, что проект с таким slug существует

### 3. Переделка кнопки "Подключить Telegram"
Кнопка в конструкторе меняет текст и инструкции:
- Объясняет, что это для получения заявок с ВАШЕГО сайта
- Показывает QR / ссылку на бота
- Инструкция: "нажмите /start, затем отправьте `/link ваш-slug`"
- Если проект уже сохранён, подставляет slug автоматически

### 4. Edge Function `playground-form-submit`
Новая функция, которая:
- Принимает данные формы + slug проекта
- Ищет `telegram_chat_id` в `playground_projects` по slug
- Если chat_id есть -- отправляет уведомление через ZXC_BOT_TOKEN
- Ваши заявки с основного сайта идут через отдельную функцию `send-telegram` с TELEGRAM_BOT_TOKEN -- они никак не пересекаются

### 5. Обновление webhook бота
В `telegram-bot-webhook` добавляется обработка команды `/link <slug>`:
- Проверяет, что проект существует
- Записывает chat_id в `playground_projects.telegram_chat_id`
- Отвечает пользователю подтверждением

### 6. Рендер формы в PlaygroundView
На опубликованном сайте блок `form` отображается как контактная форма с полями и кнопкой отправки. При сабмите вызывается `playground-form-submit`.

---

## Техническая часть

### Миграция SQL
```sql
ALTER TABLE playground_projects 
ADD COLUMN telegram_chat_id bigint;
```

### Новые/изменённые файлы
- `src/data/playground-effects.ts` -- добавить тип `form` в PlaygroundBlock
- `src/components/playground/BlockEditor.tsx` -- настройки блока формы (placeholder полей)
- `src/components/playground/Canvas.tsx` -- рендер формы в редакторе
- `src/pages/PlaygroundView.tsx` -- рендер рабочей формы + отправка
- `src/components/playground/TelegramConnectButton.tsx` -- переделка UI и инструкций
- `supabase/functions/telegram-bot-webhook/index.ts` -- команда `/link`
- `supabase/functions/playground-form-submit/index.ts` -- новая функция обработки заявок

### Разделение потоков уведомлений
- Заявки с основного сайта (zxc.ru): `send-telegram` + `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (только вам)
- Заявки с конструктора: `playground-form-submit` + `ZXC_BOT_TOKEN` + `playground_projects.telegram_chat_id` (клиенту-владельцу сайта)

