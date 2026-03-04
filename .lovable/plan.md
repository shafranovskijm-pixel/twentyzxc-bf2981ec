

## Проблемы

**1. Сессия не сохраняется между перезагрузками** — В preview-среде Lovable каждое обновление кода перезагружает iframe. Supabase-клиент настроен с `persistSession: true`, но проблема в том, что `useAdminAuth` не обрабатывает ситуацию, когда запрос к `user_roles` зависает или возвращает ошибку — `isLoading` может остаться `true` навсегда. Также race condition: и `onAuthStateChange`, и `getSession` вызывают одни и те же setter'ы параллельно.

**2. Изменения не видны сразу** — `value` column is `jsonb`. При чтении в `useSiteSettings`, значения из БД приходят как JSON (строки обёрнуты в кавычки: `"\"text\""`). При записи значение уже строка, PostgREST сохраняет её как JSON string. При чтении `typeof row.value === "string"` может не срабатывать корректно для jsonb — значение может быть уже parsed. Также `useEffect` с `settings` заполняет state только через `if (settings.key)` — если значение пустая строка `""`, условие false и поле не обновится.

## План

### 1. Исправить race condition и зависание в `use-admin-auth.tsx`

- Убрать дублирование логики `getSession` — использовать только `onAuthStateChange` для установки состояния
- `getSession` только для первоначального trigger'а (Supabase v2 рекомендует такой паттерн)
- Добавить `try/catch` вокруг запроса к `user_roles`, чтобы ошибка не оставляла `isLoading = true`
- Добавить `setTimeout` fallback: если за 5 секунд `isLoading` не стал false — принудительно ставить false

### 2. Исправить чтение jsonb в `use-site-settings.tsx`

- При чтении `value` из jsonb: если значение строка в JSON (`"text"`), оно приходит как JS string — это ок. Но нужно убрать `as any` кастинг и использовать правильные типы
- Убедиться что `updateSetting` и `updateMultiple` не double-encode значения

### 3. Исправить загрузку settings в `Admin.tsx`

- Заменить `if (settings.key)` на `if (settings.key !== undefined)` чтобы пустые строки тоже подхватывались
- Добавить `isError` handling для `useSiteSettings` — показывать ошибку вместо бесконечного спиннера

### Файлы для изменения
- `src/hooks/use-admin-auth.tsx` — исправить race condition и таймаут
- `src/hooks/use-site-settings.tsx` — error handling
- `src/pages/Admin.tsx` — исправить условия загрузки settings + fallback при ошибке

