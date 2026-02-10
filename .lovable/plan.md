
# Админка для управления SEO и настройками сайта

## Что будет сделано

### Новая таблица `site_settings` в базе данных

Универсальная таблица "ключ-значение" для хранения настроек сайта:

| key | value (jsonb) |
|---|---|
| `seo_keywords` | `["веб-разработка", "24zxc", ...]` |
| `seo_description` | `"24ZXC — веб-разработка..."` |
| `seo_title` | `"24ZXC — Веб-разработка..."` |
| `og_title` | `"24ZXC — Веб-разработка..."` |
| `og_description` | `"Цифровые решения..."` |
| `contact_email` | `"info@24zxc.ru"` |
| `contact_phone` | `"+7..."` |
| `contact_telegram` | `"@24zxc"` |

RLS: чтение -- всем, запись -- только admin.

### Новая страница `/admin`

Доступна только авторизованным админам (используется существующий `useAdminAuth`). Включает:

1. **SEO-настройки** -- редактирование keywords (добавление/удаление тегами), title, description
2. **OG-теги** -- заголовок и описание для соцсетей
3. **Контактные данные** -- email, телефон, Telegram (используются в футере и на странице контактов)

### Интеграция

- `index.html` останется со статичными значениями (для SSR/краулеров)
- Helmet на главной странице будет подтягивать keywords из БД, если они заданы
- Хук `useSiteSettings()` для получения настроек из БД

## Технические детали

### Новые файлы
- `src/pages/Admin.tsx` -- страница админки с табами (SEO, Контакты)
- `src/hooks/use-site-settings.tsx` -- хук для CRUD настроек

### Изменяемые файлы
- `src/App.tsx` -- добавить роут `/admin`
- `src/pages/Index.tsx` -- подтягивать keywords из БД через Helmet

### Миграция БД

```sql
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Чтение для всех
CREATE POLICY "Site settings readable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

-- Запись только для админов
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Начальные данные
INSERT INTO public.site_settings (key, value) VALUES
  ('seo_keywords', '"веб-разработка, создание сайтов, реклама яндекс директ, таргетированная реклама, 24zxc, конструктор сайтов, шаблоны сайтов, лендинг под ключ, сайт для бизнеса, фис фрдо, лицензия на образовательную деятельность, сайт для образовательной организации"'),
  ('seo_title', '"24ZXC — Веб-разработка, реклама и услуги для бизнеса"'),
  ('seo_description', '"Создаём современные сайты, настраиваем рекламу в Яндекс Директ и соцсетях. Полный спектр цифровых услуг для вашего бизнеса."'),
  ('contact_email', '"info@24zxc.ru"'),
  ('contact_telegram', '"@24zxc"');
```

### UI админки

Страница с двумя секциями:
- **SEO**: поле keywords с возможностью добавлять/удалять слова как теги (Badge + крестик), поля title и description
- **Контакты**: email, телефон, Telegram

Вход через существующий `useAdminAuth` -- если не админ, показываем диалог входа. Кнопка "Сохранить" для каждой секции.
