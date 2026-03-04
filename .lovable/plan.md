

# Исправление авторизации для отзывов (403 Forbidden)

## Проблема

При нажатии "Войти через Google" на странице отзывов открывается `oauth.lovable.app` и возвращает **403 Forbidden**. Причина: Google OAuth не настроен для этого проекта в Lovable Cloud.

## Решение

### 1. Включить Google OAuth через настройки аутентификации

Использовать инструмент `configure-auth` для включения Google-провайдера в проекте. Это добавит необходимую конфигурацию в `supabase/config.toml` и разрешит OAuth-авторизацию.

### 2. Добавить redirect URL в список разрешённых

Убедиться, что как preview URL (`https://id-preview--c2afa16d-2c40-4a1e-9579-ec1baa3f79f0.lovable.app`), так и production URL (`https://twentyzxc.lovable.app` и `https://24zxc.ru`) находятся в списке разрешённых redirect-адресов.

### 3. Обновить GoogleAuthButton (если потребуется)

Текущий код использует `lovable.auth.signInWithOAuth("google")` — это правильный подход для Lovable Cloud. Возможно потребуется скорректировать `redirect_uri`, чтобы он правильно работал и в preview, и в production.

## Технические детали

| Действие | Описание |
|---|---|
| Настройка auth | Включить Google OAuth provider через configure-auth |
| `supabase/config.toml` | Автоматически обновится после настройки |
| `src/components/reviews/GoogleAuthButton.tsx` | Возможная корректировка redirect_uri |

Без включения Google OAuth на уровне проекта авторизация работать не будет -- это не проблема кода, а конфигурации.

