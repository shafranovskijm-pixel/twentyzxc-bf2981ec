

# План: Максимальное улучшение демо-превью шаблонов

## Обзор текущего состояния

Сейчас превью шаблонов содержат базовую структуру с минимальными интерактивными элементами. Улучшим их до уровня полноценных интерактивных демо-сайтов с:
- Продвинутыми анимациями появления
- Particle-эффектами и декоративными элементами
- Hover-эффектами и микроанимациями
- Интерактивными элементами (табы, модалки, счётчики)
- Мобильной адаптацией с переключателем устройств

---

## 1. Улучшение базового превью-контейнера

### TemplatePreview.tsx
- Переключатель устройств (Desktop / Tablet / Mobile)
- Полноэкранный режим просмотра
- Индикатор адаптивности
- Floating частицы на фоне

---

## 2. Landing Preview — Noir Elegance / Golden Prestige / Crystal Vision

### Новые секции и эффекты:
- **Hero**: Анимированный gradient background с движением, particle-система, typing-эффект в заголовке
- **Floating cursor**: Кастомный анимированный курсор (для Crystal Vision)
- **Video placeholder**: Mock видео-секция с play-кнопкой и hover-эффектом
- **Testimonials carousel**: Автоматическая карусель отзывов
- **Pricing cards**: 3D-tilt эффект при наведении
- **FAQ accordion**: Работающие аккордеоны
- **Animated counters**: Счётчики с анимацией при скролле (500+ проектов и т.д.)
- **Contact form**: Интерактивная форма с валидацией
- **Smooth scroll**: Плавная навигация по секциям
- **Parallax images**: Параллакс-эффект на изображениях
- **Reveal animations**: Появление элементов при скролле

---

## 3. Corporate Preview — Executive Suite / Marble & Gold / Tech Horizon

### Новые секции и эффекты:
- **Mega menu**: Hover-меню с подкатегориями
- **Team grid**: Карточки команды с flip-эффектом
- **Company timeline**: Интерактивная временная шкала истории
- **Services tabs**: Работающие табы услуг
- **Client logos carousel**: Бесконечная карусель логотипов клиентов
- **Case studies grid**: Hover-эффект с overlay и reveal текста
- **News/Blog section**: Grid статей с hover-анимацией
- **Office locations map**: Placeholder карты с маркерами
- **Animated charts**: SVG-графики в about-секции
- **Footer mega**: Расширенный футер с колонками

---

## 4. E-commerce Preview — Luxe Boutique / Artisan Market / Premium Gallery

### Новые секции и эффекты:
- **Product quick view modal**: Модальное окно при клике на товар
- **Cart drawer**: Slide-in корзина справа
- **Wishlist hearts**: Анимированные сердечки с пульсацией
- **Product filters sidebar**: Работающие чекбоксы фильтров
- **Size/Color selectors**: Интерактивные кнопки выбора
- **Image zoom**: Hover-увеличение изображения товара
- **Product carousel**: Slider с точками навигации
- **Trust badges**: Анимированные иконки гарантий
- **Reviews with stars**: Интерактивный рейтинг
- **Recently viewed**: Секция просмотренных товаров
- **Promo banner**: Countdown таймер акции
- **Search overlay**: Полноэкранный поиск

---

## 5. Web App Preview — Dashboard Pro / CRM Elite / Platform X

### Новые секции и эффекты:
- **Live chart animations**: Recharts с анимацией данных
- **Draggable widgets**: Подвижные карточки (mock)
- **Notification dropdown**: Popup уведомлений
- **User dropdown menu**: Меню профиля
- **Data table sorting**: Сортировка колонок таблицы
- **Progress bars**: Анимированные прогресс-бары
- **Kanban preview**: Доска задач с колонками
- **Calendar widget**: Мини-календарь с выделенными датами
- **Sparkline charts**: Мини-графики в карточках
- **Theme switcher**: Переключатель светлой/тёмной темы (mock)
- **Breadcrumbs**: Навигационные хлебные крошки
- **Command palette**: Ctrl+K поиск (mock overlay)

---

## 6. Общие улучшения для всех превью

### Анимации:
- Framer Motion для входных анимаций секций
- Stagger-эффект для списков
- Scale/rotate при hover на карточках
- Shimmer-эффект на loading-элементах
- Gradient animation на кнопках

### Декоративные элементы:
- Floating particles (из существующего компонента)
- Gradient glows (из существующего компонента)
- Geometric shapes
- Noise texture overlay
- Grid pattern background

### Интерактивность:
- Working tabs с контентом
- Collapsible sections
- Modal dialogs
- Toast notifications (показ при действиях)
- Tooltip на иконках

---

## Технические детали

### Новые файлы:
```text
src/components/templates/previews/
├── shared/
│   ├── PreviewParticles.tsx
│   ├── AnimatedCounter.tsx
│   ├── PreviewModal.tsx
│   ├── DeviceSwitcher.tsx
│   ├── ParallaxImage.tsx
│   └── GradientBackground.tsx
├── sections/
│   ├── HeroAnimated.tsx
│   ├── TestimonialsCarousel.tsx
│   ├── PricingCards.tsx
│   ├── FAQAccordion.tsx
│   └── ContactFormPreview.tsx
├── LandingPreview.tsx (расширенный)
├── CorporatePreview.tsx (расширенный)
├── EcommercePreview.tsx (расширенный)
└── WebAppPreview.tsx (расширенный)
```

### Изменяемые файлы:
- `src/pages/TemplatePreview.tsx` — добавление DeviceSwitcher
- `src/components/templates/previews/LandingPreview.tsx` — полная переработка
- `src/components/templates/previews/CorporatePreview.tsx` — полная переработка
- `src/components/templates/previews/EcommercePreview.tsx` — полная переработка
- `src/components/templates/previews/WebAppPreview.tsx` — полная переработка

### Используемые технологии:
- Framer Motion (уже установлен)
- Embla Carousel (уже установлен)
- Recharts (уже установлен)
- Radix UI Accordion/Tabs/Dialog (уже установлены)

---

## Визуальная схема улучшений

```text
┌─────────────────────────────────────────────────────────────┐
│  FLOATING TOOLBAR                                           │
│  ← Назад │ Template Name │ [Desktop] [Tablet] [Mobile] │ ✕ │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ ░░░░░ PARTICLES ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HERO with Gradient Animation                            │ │
│ │ ╔═══════════════════════════════════════════════════╗   │ │
│ │ ║  Animated typing: "Создаём будущее_"              ║   │ │
│ │ ║  Particle burst on CTA click                      ║   │ │
│ │ ╚═══════════════════════════════════════════════════╝   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ STATS with Animated Counters                            │ │
│ │ [ 500+ ]  [ 98% ]  [ 15 ]  [ 24/7 ]                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FEATURES with 3D Tilt Cards                             │ │
│ │ ┌───────┐ ┌───────┐ ┌───────┐                           │ │
│ │ │ HOVER │ │ TILT  │ │ GLOW  │                           │ │
│ │ └───────┘ └───────┘ └───────┘                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ TESTIMONIALS Carousel                                    │ │
│ │ ← "Отличная работа!" ● ○ ○ →                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PRICING with Hover Effects                               │ │
│ │ ┌─────┐ ┌─────────┐ ┌─────┐                             │ │
│ │ │Basic│ │ PRO ★   │ │Enter│                             │ │
│ │ └─────┘ └─────────┘ └─────┘                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FAQ Accordion (working)                                  │ │
│ │ ▼ Вопрос 1                                              │ │
│ │   Ответ на вопрос...                                    │ │
│ │ ► Вопрос 2                                              │ │
│ │ ► Вопрос 3                                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ░░░░░ GRADIENT GLOWS ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────────────────────────┘
```

---

## Ожидаемый результат

После реализации каждое демо будет выглядеть как полноценный работающий сайт с:
- 10+ интерактивных элементов
- Плавными анимациями при скролле
- Hover-эффектами на всех кликабельных элементах
- Работающими UI-компонентами (табы, аккордеоны, модалки)
- Адаптивным переключателем устройств
- Премиальным визуальным оформлением с particle-эффектами и градиентами

