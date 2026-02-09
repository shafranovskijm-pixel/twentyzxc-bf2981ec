
# План: Максимальная уникальность и расширение контента демо-превью

## Анализ текущего состояния

### Уникальные превью (8 из 12 шаблонов):
| Шаблон | Файл | Строк кода | Секций |
|--------|------|------------|--------|
| Noir Elegance | NoirElegancePreview.tsx | ~389 | 6 |
| Golden Prestige | GoldenPrestigePreview.tsx | ~433 | 7 |
| Crystal Vision | CrystalVisionPreview.tsx | — | 5 |
| Executive Suite | ExecutiveSuitePreview.tsx | ~413 | 7 |
| Marble & Gold | MarbleGoldPreview.tsx | ~320 | 6 |
| Luxe Boutique | LuxeBoutiquePreview.tsx | ~390 | 6 |
| Dashboard Pro | DashboardProPreview.tsx | ~416 | 5 |
| CRM Elite | CRMElitePreview.tsx | ~360 | 5 |

### Шаблоны БЕЗ уникальных превью (используют generic):
| Шаблон | Категория | Текущее превью |
|--------|-----------|----------------|
| **Tech Horizon** | Корпоративные | CorporatePreview |
| **Artisan Market** | E-commerce | EcommercePreview |
| **Premium Gallery** | E-commerce | EcommercePreview |
| **Platform X** | Веб-приложения | WebAppPreview |

---

## Часть 1: Создание 4 недостающих уникальных превью

### 1.1 TechHorizonPreview.tsx (~500 строк)
**Визуальный стиль**: Cyan/teal градиенты, tech-эстетика, терминальный код

**Уникальные секции (10 шт)**:
1. **Hero с терминалом** — анимация печатающегося кода в терминале
2. **API Sandbox** — интерактивные mock-запросы с JSON-ответами
3. **Live Status Page** — индикаторы статуса сервисов (uptime 99.9%)
4. **Code Snippets** — примеры кода с подсветкой синтаксиса и кнопкой "Copy"
5. **Integrations Grid** — логотипы интеграций (GitHub, Slack, Jira и т.д.)
6. **Changelog** — лента обновлений с версиями и датами
7. **Pricing Table** — 3 тарифа с toggle Monthly/Annual
8. **Documentation Preview** — mock поиска по документации
9. **Metrics Dashboard** — карточки метрик API (requests, latency)
10. **Footer** — ссылки на docs, GitHub, Discord

### 1.2 ArtisanMarketPreview.tsx (~450 строк)
**Визуальный стиль**: Тёплые оранжевые/терракотовые тона, handmade эстетика

**Уникальные секции (9 шт)**:
1. **Hero** — карусель товаров ручной работы с "hand-drawn" декоративными элементами
2. **Categories Carousel** — горизонтальный скролл категорий мастеров
3. **Featured Artisans** — карточки мастеров с рейтингом и количеством продаж
4. **Product Grid** — товары с badge "Handmade" и информацией о мастере
5. **Seller Dashboard Mock** — превью кабинета продавца с графиками продаж
6. **Reviews with Photos** — отзывы покупателей с фото товаров
7. **Trust Badges** — "Гарантия качества", "Проверенные мастера"
8. **Chat Widget** — виджет чата покупатель-продавец
9. **Footer** — тёплый стиль с social links

### 1.3 PremiumGalleryPreview.tsx (~480 строк)
**Визуальный стиль**: Изумрудные акценты, галерейный минимализм

**Уникальные секции (10 шт)**:
1. **Hero** — большое изображение товара с эффектом parallax
2. **AR Badge Section** — демонстрация AR-возможностей с анимированной иконкой
3. **360° Viewer Mock** — слайдер "вращения" товара (имитация)
4. **Virtual Showroom** — сетка товаров в "галерейном" формате с lightbox
5. **Personalization** — секция "Рекомендации для вас" на основе предпочтений
6. **Live Consultation CTA** — CTA для видео-консультации с экспертом
7. **Size Guide Modal** — интерактивная таблица размеров
8. **Shipping Calculator** — расчёт доставки по городам
9. **Recently Viewed** — блок просмотренных товаров
10. **Luxury Footer** — минималистичный премиальный футер

### 1.4 PlatformXPreview.tsx (~520 строк)
**Визуальный стиль**: Fuchsia/pink градиенты, SaaS-эстетика

**Уникальные секции (11 шт)**:
1. **Hero** — "Launch your SaaS in days" с animated gradient
2. **Pricing Table** — 3 тарифа с toggle Monthly/Annual и сравнение фич
3. **Feature Comparison Table** — подробная таблица сравнения планов
4. **Multi-tenant Architecture Demo** — визуализация архитектуры
5. **Billing Dashboard Mock** — интерфейс управления подписками
6. **White Label Preview** — демо кастомизации под бренд клиента
7. **API Keys Management** — mock интерфейса управления API-ключами
8. **Integrations** — Stripe, Zapier, Webhooks карточки
9. **Testimonials Carousel** — отзывы SaaS-founders
10. **Usage Analytics** — графики использования платформы
11. **CTA** — "Start your 14-day trial"

---

## Часть 2: Расширение контента существующих превью

### 2.1 NoirElegancePreview (+4 секции, итого 10)
**Добавить:**
- **Portfolio Gallery** — 6 кейсов с hover lightbox эффектом
- **Instagram Feed** — сетка 6 фото с hover-эффектами
- **Awards Section** — награды и премии с анимированными иконками
- **Partners Carousel** — бесконечная карусель логотипов партнёров

### 2.2 GoldenPrestigePreview (+3 секции, итого 10)
**Добавить:**
- **Blog Preview** — 3 последних статьи с hover-эффектами
- **Map Section** — placeholder карты с анимированными маркерами офисов
- **Booking Widget** — интерактивная форма записи на консультацию

### 2.3 CrystalVisionPreview (+3 секции, итого 8)
**Добавить:**
- **Interactive Product Demo** — интерактивный элемент демонстрации продукта
- **Custom Cursor Demo** — показ кастомного светящегося курсора
- **Sound Toggle** — визуальный индикатор звукового сопровождения

### 2.4 ExecutiveSuitePreview (+3 секции, итого 10)
**Добавить:**
- **Careers Section** — открытые вакансии с кнопкой откликнуться
- **ESG Section** — устойчивое развитие и социальная ответственность
- **Annual Report** — скачиваемый PDF годового отчёта (mock кнопка)

### 2.5 MarbleGoldPreview (+3 секции, итого 9)
**Добавить:**
- **Blog/Journal** — 3 статьи о дизайне с минималистичными карточками
- **Awards Showcase** — витрина наград с анимацией
- **Process Timeline** — этапы работы с клиентом

### 2.6 LuxeBoutiquePreview (+4 секции, итого 10)
**Добавить:**
- **Recently Viewed** — секция просмотренных товаров
- **Stock Indicator** — "Осталось 3 шт" на карточках товаров
- **Size Guide Modal** — интерактивная таблица размеров
- **Loyalty Program** — блок о бонусной программе

### 2.7 DashboardProPreview (+3 секции, итого 8)
**Добавить:**
- **Keyboard Shortcuts Modal** — модалка горячих клавиш (?)
- **Settings Page Preview** — превью страницы настроек
- **Activity Feed** — лента последней активности пользователей

### 2.8 CRMElitePreview (+3 секции, итого 8)
**Добавить:**
- **Email Templates Preview** — превью шаблонов писем
- **Pipeline Kanban Board** — drag-drop доска сделок (visual mock)
- **Reports Export** — кнопка экспорта с анимацией

---

## Часть 3: Новые shared-компоненты

### Создать в `src/components/templates/previews/shared/`:

| Компонент | Описание | Строк |
|-----------|----------|-------|
| **CodeBlock.tsx** | Блок кода с подсветкой синтаксиса, Copy button, Language badge | ~100 |
| **PricingToggle.tsx** | Monthly/Annual переключатель с animated price change | ~70 |
| **StatusIndicator.tsx** | Realtime-style статус (Online, Maintenance), uptime % | ~60 |
| **MapPlaceholder.tsx** | Placeholder карты с анимированными маркерами | ~120 |
| **StockBadge.tsx** | "Осталось N шт", "Высокий спрос" badge | ~50 |
| **SizeGuideModal.tsx** | Таблица размеров в модальном окне | ~130 |
| **ARBadge.tsx** | "Попробуйте в AR" badge с анимированной иконкой | ~60 |
| **Viewer360.tsx** | Mock 360° просмотра со слайдером | ~100 |
| **KeyboardShortcuts.tsx** | Модалка с горячими клавишами | ~90 |
| **ActivityFeed.tsx** | Лента активности с аватарами | ~80 |

---

## Часть 4: Технический план реализации

### Файлы для создания:
```text
src/components/templates/previews/unique/
├── TechHorizonPreview.tsx      (~500 строк)
├── ArtisanMarketPreview.tsx    (~450 строк)
├── PremiumGalleryPreview.tsx   (~480 строк)
└── PlatformXPreview.tsx        (~520 строк)

src/components/templates/previews/shared/
├── CodeBlock.tsx               (~100 строк)
├── PricingToggle.tsx           (~70 строк)
├── StatusIndicator.tsx         (~60 строк)
├── MapPlaceholder.tsx          (~120 строк)
├── StockBadge.tsx              (~50 строк)
├── SizeGuideModal.tsx          (~130 строк)
├── ARBadge.tsx                 (~60 строк)
├── Viewer360.tsx               (~100 строк)
├── KeyboardShortcuts.tsx       (~90 строк)
└── ActivityFeed.tsx            (~80 строк)
```

### Файлы для изменения:
1. **src/components/templates/previews/unique/index.ts** — добавить экспорт 4 новых превью
2. **src/components/templates/previews/shared/index.ts** — добавить экспорт 10 новых компонентов
3. **src/pages/TemplatePreview.tsx** — добавить case для 4 новых шаблонов
4. **src/components/templates/previews/unique/NoirElegancePreview.tsx** — добавить 4 секции
5. **src/components/templates/previews/unique/GoldenPrestigePreview.tsx** — добавить 3 секции
6. **src/components/templates/previews/unique/ExecutiveSuitePreview.tsx** — добавить 3 секции
7. **src/components/templates/previews/unique/LuxeBoutiquePreview.tsx** — добавить 4 секции
8. **src/components/templates/previews/unique/DashboardProPreview.tsx** — добавить 3 секции
9. **src/components/templates/previews/unique/CRMElitePreview.tsx** — добавить 3 секции
10. **src/components/templates/previews/unique/MarbleGoldPreview.tsx** — добавить 3 секции

---

## Визуализация прироста контента

```text
Шаблон              Секции до   Секции после   Прирост
────────────────────────────────────────────────────────
Noir Elegance            6           10         +67%
Golden Prestige          7           10         +43%
Crystal Vision           5            8         +60%
Executive Suite          7           10         +43%
Marble & Gold            6            9         +50%
Tech Horizon             0           10         NEW
Luxe Boutique            6           10         +67%
Artisan Market           0            9         NEW
Premium Gallery          0           10         NEW
Dashboard Pro            5            8         +60%
CRM Elite                5            8         +60%
Platform X               0           11         NEW
────────────────────────────────────────────────────────
ИТОГО секций:           47          113        +140%
```

---

## Порядок реализации

**Фаза 1: Новые shared-компоненты** (основа для всех превью)
1. Создать 10 новых shared-компонентов
2. Обновить index.ts для экспорта

**Фаза 2: 4 новых уникальных превью**
3. TechHorizonPreview
4. ArtisanMarketPreview  
5. PremiumGalleryPreview
6. PlatformXPreview
7. Обновить unique/index.ts и TemplatePreview.tsx

**Фаза 3: Расширение существующих превью**
8. NoirElegancePreview (+4 секции)
9. GoldenPrestigePreview (+3 секции)
10. ExecutiveSuitePreview (+3 секции)
11. LuxeBoutiquePreview (+4 секции)
12. DashboardProPreview (+3 секции)
13. CRMElitePreview (+3 секции)
14. MarbleGoldPreview (+3 секции)

---

## Ожидаемый результат

- **12 шаблонов** — каждый с уникальным превью
- **113 секций контента** суммарно (было 47)
- **23 shared-компонента** (было 13)
- Каждое демо — полноценный интерактивный сайт
- Уникальный визуальный стиль для каждой категории
