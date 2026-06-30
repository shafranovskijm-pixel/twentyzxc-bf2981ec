# Вкладка «Продажи» с конструктором коммерческих предложений

Новая вкладка в админ-сайдбаре `/admin` с конструктором КП: чек-боксы услуг, авто-сумма, редактирование на лету, поля клиента, экспорт в светлый PDF и отправка на email через существующий SMTP. Каталог услуг = переменные, можно добавлять/удалять.

## 1. База данных

Таблицы (миграция):

```
proposals
  id, created_by, client_name, client_org, client_email, client_phone,
  intro_text, footer_text, discount_percent, valid_until,
  number (NNN/YYYY через next_tz_number-аналог), status (draft|sent|accepted|rejected),
  total_amount, created_at, updated_at

proposal_items
  id, proposal_id, service_key, title, description, price, qty, sort_order, included(bool)

proposal_services_catalog
  id, key, title, description, default_price, category, sort_order, is_default(bool)
```

GRANT + RLS — только `admin` (через `has_role`). Сидим каталог:
- **Лицензия под ключ** — 35 000
- **Разработка сайта для ОО** — 35 000
- **Документы для сайта ОО** — 25 000
- **Документы для подачи на лицензию** — 35 000
- Лендинг, Корпоративный сайт, E-commerce, Веб-приложение, Реклама, НМО (35 000), ФРДО — цены из текущих страниц сайта

## 2. Сайдбар

Добавить пункт «Продажи» (icon `Wallet`/`FileSignature`) в `AdminSidebar.tsx`, рядом с Документами.

## 3. UI вкладки (тёмная тема админки)

`src/components/admin/SalesProposalsTab.tsx` — список КП (поиск, статус-фильтр, sticky actions). Кнопка «Новое КП» → диалог.

`src/components/admin/proposals/ProposalEditor.tsx` — двух-колоночный редактор:

**Левая колонка — параметры:**
- Поля клиента: ФИО, организация, email, телефон
- Вступительный текст (textarea, с дефолтом)
- Каталог услуг: список с чек-боксами, inline-редактирование `title` / `description` / `price` / `qty`
- Кнопка «+ Добавить услугу» (произвольная) и «Управление каталогом» (CRUD `proposal_services_catalog`)
- Скидка %, срок действия КП

**Правая колонка — live-превью КП** в светлом стиле (белый фон, золотые акценты `#d4be37`, тёмный текст `#15171e`) — это же будет рендериться в PDF. Авто-пересчёт суммы со скидкой.

Действия в шапке редактора: Сохранить черновик · Скачать PDF · Отправить на email.

## 4. Дизайн КП (светлый PDF)

`src/lib/proposal-template.ts` — HTML-шаблон:
- Шапка: логотип/название «24ZXC», номер КП, дата, золотая разделительная линия
- Блок «Кому»: реквизиты клиента
- Заголовок «Коммерческое предложение» (большой, тонкий, gold-accent подчерк)
- Вступительный абзац
- Таблица услуг: №, Наименование + описание (мелким), Кол-во, Цена, Сумма
- Итог: подытог → скидка → ИТОГО (золотая плашка)
- Срок действия, контакты, подпись
- Декор: тонкие золотые угловые линии, монограмма водяным знаком

Рендер в PDF через существующий `html2canvas` + `jsPDF` стек (как в `document-pdf.ts`, scale 1.2, 200ms стабилизация — по проектной памяти).

## 5. Отправка email

Через существующий `send-document-email` edge-function: тема `Коммерческое предложение №…`, тело — короткое сопроводительное письмо, PDF в Base64 attachment. После отправки → `status='sent'`, telegram-уведомление через `ZXC_BOT_TOKEN`.

## 6. Технические детали

- Нумерация КП по аналогии с `next_tz_number()` — отдельная RPC `next_proposal_number()` и таблица `proposal_counters(year, last_number)`. Формат `NNN/YYYY`.
- Маршрутизация: внутри `/admin`, новая вкладка через существующий механизм табов в `Admin.tsx`.
- Каталог по умолчанию засеян миграцией; пользователь может редактировать/удалять/добавлять записи в каталоге — они появляются как чек-боксы во всех новых КП.
- Padding-bottom `pb-20` для FloatingAIChat (по правилам проекта).

## Файлы

**Новые:**
- `supabase/migrations/*_proposals.sql`
- `src/components/admin/SalesProposalsTab.tsx`
- `src/components/admin/proposals/ProposalEditor.tsx`
- `src/components/admin/proposals/ProposalPreview.tsx` (light theme)
- `src/components/admin/proposals/ServicesCatalogDialog.tsx`
- `src/lib/proposal-template.ts`
- `src/lib/proposal-pdf.ts`

**Изменяю:**
- `src/components/admin/AdminSidebar.tsx` — пункт «Продажи»
- `src/pages/Admin.tsx` — роутинг таба
