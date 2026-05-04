# План: фавикон, тексты и деплой на Timeweb Cloud

## 1. Генерация новой иконки «24»

Сгенерирую квадратную иконку 512×512 через Lovable AI (Nano banana pro) с промптом:

> Premium minimalist app icon, large bold golden number "24" centered on dark navy background (#15171e), gold gradient (#d4be37 to #f5d76e), subtle glow, sharp clean serif/display font, luxury brand feel, square 1:1, no extra text or symbols, flat icon style suitable for favicon

После генерации:
- Сохраню в `public/favicon.png` (заменит и старый огромный 630KB favicon.png, и .ico)
- Удалю старый `public/favicon.ico` (он сейчас отдаёт ошибку `ERR_ABORTED`)
- Обновлю `index.html`: `<link rel="icon" type="image/png" href="/favicon.png" />`
- Также обновлю `apple-touch-icon` и `og:image` при необходимости

Если иконка получится не очень — перегенерируем 1-2 раза до приемлемого результата.

## 2. Удаление «Под пальмами»

Заменю в двух местах:

**`src/components/HeroSection.tsx`** (строка 58):
```diff
- Под ключ · Под пальмами
+ Под ключ · Премиум-разработка
```

**`src/pages/Index.tsx`** (строка 11, SEO title):
```diff
- "24ZXC — Под ключ. Под пальмами. Сайты, реклама, приложения"
+ "24ZXC — Под ключ. Сайты, реклама, веб-приложения"
```

Проверю также `index.html` мета-теги — там «под пальмами» нет, но title там захардкожен старый — обновлю его тоже для консистентности.

## 3. Подготовка к деплою на Timeweb Cloud App Platform

### Что нужно сделать в Lovable:

**Шаг 1. Подключить проект к GitHub**
- В Lovable: **Connectors → GitHub → Connect project**
- Авторизовать Lovable GitHub App
- Создать новый репозиторий (например `24zxc-site`)
- После этого код будет автоматически синхронизироваться с GitHub в обе стороны

### Что нужно сделать в Timeweb Cloud:

**Шаг 2. Создать App Platform приложение**
1. Зайти в Timeweb Cloud → **App Platform** → кнопка **Добавить**
2. Выбрать **GitHub** как источник
3. Авторизовать Timeweb для доступа к репозиторию
4. Выбрать только что созданный репозиторий `24zxc-site`
5. Настройки сборки:
   - **Тип**: Frontend / Static Site
   - **Framework**: Vite (или вручную)
   - **Build command**: `npm install && npm run build`
   - **Output directory**: `dist`
   - **Node version**: 20.x

**Шаг 3. Переменные окружения**
В Timeweb во вкладке «Переменные» добавить:
```
VITE_SUPABASE_URL=<значение из .env>
VITE_SUPABASE_PUBLISHABLE_KEY=<значение из .env>
VITE_SUPABASE_PROJECT_ID=veedztdijmscebgadzyx
```
(Я подскажу точные значения, когда дойдём до этого шага.)

**Шаг 4. Привязать домен 24zxc.ru к Timeweb**
1. В Timeweb → App Platform → ваш проект → вкладка «Домены» → **Добавить домен** → `24zxc.ru` и `www.24zxc.ru`
2. Timeweb выдаст A-запись (новый IP сервера Timeweb — он отличается от Lovable `185.158.133.1`)
3. У DNS-провайдера домена `24zxc.ru` (это `timeweb.ru` по NS-записи — у вас уже там) поменять A-запись `@` и `www` на новый IP от Timeweb
4. Timeweb автоматически выпустит SSL (Let's Encrypt)
5. Подождать 5–60 минут пропагации DNS

**Шаг 5. После успешного деплоя**
- Отвязать `24zxc.ru` от Lovable в **Project Settings → Domains** (чтобы не было конфликта)
- Опубликованный `twentyzxc.lovable.app` останется как резервная копия

### Файлы для деплоя в проекте

Создам два вспомогательных файла:

**`public/_redirects`** (на случай, если понадобится для SPA-роутинга на других хостингах — Timeweb обычно сам справляется):
```
/*    /index.html   200
```

**`README.deploy.md`** — короткая шпаргалка с командами и настройками Timeweb для будущих обновлений.

## 4. Что нужно от вас перед стартом деплоя

После того как я внесу изменения в код:

1. **Подключите GitHub в Lovable** (Connectors → GitHub) — без этого Timeweb не сможет вытянуть код. Подскажите, как только сделаете, я дам следующий шаг.
2. **Скиньте мне точные значения VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY из вашего `.env`** — или я подскажу, где их взять (Cloud → API).
3. **Решение по домену**: переключаем `24zxc.ru` на Timeweb сразу или сначала тестируем на временном поддомене Timeweb (он даст что-то вроде `xxx.twc1.net`)?

## Технические детали

- **Стек**: Vite + React 18 + TypeScript — поддерживается Timeweb App Platform нативно
- **Backend**: остаётся Lovable Cloud (Supabase) — Timeweb хостит только фронт
- **Edge Functions**: продолжают работать через Supabase, не зависят от хостинга фронта
- **Цена Timeweb App Platform**: статический сайт ~150₽/мес
- **Преимущество**: российский IP → Яндекс.Браузер без VPN откроет сайт без проблем

## Порядок выполнения

После одобрения этого плана:
1. Сразу генерирую иконку и правлю тексты (10 минут)
2. Создаю вспомогательные файлы для деплоя
3. Жду от вас подключения GitHub
4. Помогаю настроить Timeweb по шагам