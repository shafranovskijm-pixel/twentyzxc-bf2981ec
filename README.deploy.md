# Деплой 24ZXC на Timeweb Cloud App Platform

## Требования
- Аккаунт Timeweb Cloud
- Подключённый GitHub-репозиторий проекта

## Настройки сборки в Timeweb App Platform

| Параметр | Значение |
|---|---|
| Тип | Frontend (Static Site) |
| Framework | Vite |
| Build command | `npm install && npm run build` |
| Output directory | `dist` |
| Node version | 20.x |

## Переменные окружения

```
VITE_SUPABASE_URL=https://veedztdijmscebgadzyx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<из .env проекта Lovable>
VITE_SUPABASE_PROJECT_ID=veedztdijmscebgadzyx
```

## Привязка домена 24zxc.ru
1. Timeweb App Platform → ваш проект → Домены → Добавить `24zxc.ru` и `www.24zxc.ru`
2. Получить новый IP от Timeweb
3. Изменить A-запись `@` и `www` в DNS-провайдере
4. Подождать 5–60 минут пропагации DNS
5. SSL Timeweb выпустит автоматически

## После успешного деплоя
- Отвязать `24zxc.ru` от Lovable (Project Settings → Domains)
- `twentyzxc.lovable.app` остаётся как резервная копия

## Преимущество
Российский IP → Яндекс.Браузер открывает сайт без VPN.
