

## План: Дашборд с KPI + Воронка продаж + Уведомления + История взаимодействий

### 1. Новый раздел «Дашборд» (главный экран)

Добавляем раздел `dashboard` в сайдбар как первый пункт. Компонент `DashboardTab.tsx` показывает:

- **KPI-карточки**: общая выручка (сумма оплаченных), активные договоры, новые лиды за месяц, конверсия лидов (converted / total)
- **Графики** (recharts): выручка по месяцам (bar chart), динамика лидов (line chart)
- **Список срочных дел**: просроченные оплаты + задачи на сегодня — кликабельные, ведут в соответствующие разделы

Данные берутся из существующих таблиц `contracts`, `leads`, `tasks` — новых таблиц не нужно.

### 2. Воронка продаж

Визуальная воронка внутри дашборда или отдельным блоком:

```text
┌─────────────────────────────┐
│  Новые лиды          (12)   │  100%
├───────────────────────┤
│  Связались       (8)   │  67%
├─────────────────┤
│  Договор      (5)  │  42%
├───────────┤
│  Оплата (3) │  25%
└───────────┘
```

Считается из таблиц `leads` (статусы new → contacted → converted) и `contracts` (payment_status = оплачено). Горизонтальные полосы с процентами, анимация через framer-motion.

### 3. Таблица `client_interactions` для истории

**Миграция БД:**
```sql
CREATE TABLE client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL DEFAULT 'note', -- call, email, meeting, note
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage interactions" ON client_interactions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

В `ClientsTab.tsx` — при раскрытии карточки клиента показываем таймлайн: звонки, письма, заметки с возможностью добавить новую запись (тип + текст).

### 4. Панель уведомлений

Компонент `NotificationsPanel.tsx` — иконка колокольчика в хедере админки с выпадающим списком:

- Просроченные оплаты (из `contracts` где `paid_until < now()`)
- Задачи на сегодня (из `tasks` где `task_date = today`)
- Новые лиды за последние 24ч (из `leads`)
- Истекающие договоры (paid_until в ближайшие 7 дней)

Счетчик непрочитанных на иконке. Данные из существующих таблиц, без новых таблиц.

### Файлы для изменения/создания

| Файл | Действие |
|---|---|
| Миграция SQL | Создать таблицу `client_interactions` |
| `src/components/admin/DashboardTab.tsx` | Новый — дашборд с KPI + воронка + графики |
| `src/components/admin/NotificationsPanel.tsx` | Новый — колокольчик с уведомлениями |
| `src/components/admin/ClientsTab.tsx` | Добавить блок истории взаимодействий |
| `src/components/admin/AdminSidebar.tsx` | Добавить пункт «Дашборд» первым |
| `src/pages/Admin.tsx` | Подключить DashboardTab, NotificationsPanel в хедер |

