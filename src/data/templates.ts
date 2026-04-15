import { Sparkles, Layers, ShoppingBag, Monitor } from "lucide-react";

export interface TemplateReview {
  text: string;
  author: string;
  role: string;
  rating: number;
  avatar?: string;
}

export interface TemplateFAQ {
  question: string;
  answer: string;
}

export interface TemplateScreenshot {
  id: string;
  title: string;
  description: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  price: string;
  tags: string[];
  gradient: string;
  accentColor: string;
  features: string[];
  highlights: string[];
  techStack: string[];
  deliveryTime: string;
  gallery: string[];
  // New fields
  reviews: TemplateReview[];
  faqs: TemplateFAQ[];
  screenshots: TemplateScreenshot[];
  popular?: boolean;
  isNew?: boolean;
  rating: number;
  ordersCount: number;
  uniqueStyle?: {
    primaryColor: string;
    secondaryColor: string;
    fontStyle: string;
    moodKeywords: string[];
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  templates: Template[];
}

// Common reviews that can be reused
const commonReviews: TemplateReview[] = [
  { text: "Превосходное качество работы! Сайт превзошёл все ожидания.", author: "Александр М.", role: "CEO, TechCorp", rating: 5 },
  { text: "Очень профессиональный подход и внимание к деталям.", author: "Елена К.", role: "Основатель, Startup X", rating: 5 },
  { text: "Рекомендую всем, кто ценит качество и скорость.", author: "Дмитрий С.", role: "Директор, MediaGroup", rating: 5 },
];

// Common FAQs
const commonFAQs: TemplateFAQ[] = [
  { question: "Какие сроки разработки?", answer: "Стандартный срок — от 7 дней в зависимости от сложности проекта. Срочные заказы выполняем за 3-5 дней с доплатой 30%." },
  { question: "Что входит в стоимость?", answer: "Дизайн, верстка, адаптив под все устройства, базовая SEO-оптимизация, форма заявки с отправкой на email или Telegram, 2 раунда правок." },
  { question: "Можно ли вносить правки после сдачи?", answer: "Да, 2 раунда правок включены в стоимость. Дополнительные изменения оплачиваются по часовой ставке." },
  { question: "Предоставляете ли вы хостинг?", answer: "Мы можем разместить ваш сайт на нашем хостинге за 500 ₽/мес или помочь с настройкой на вашем сервере бесплатно." },
  { question: "Есть ли поддержка после запуска?", answer: "Да, 30 дней бесплатной технической поддержки включены. Далее — по договорённости." },
];

// Common screenshots structure
const landingScreenshots: TemplateScreenshot[] = [
  { id: "hero", title: "Hero секция", description: "Главный экран с призывом к действию" },
  { id: "features", title: "Преимущества", description: "Блок с ключевыми особенностями" },
  { id: "testimonials", title: "Отзывы", description: "Карусель отзывов клиентов" },
  { id: "pricing", title: "Тарифы", description: "Блок с ценами и планами" },
  { id: "faq", title: "FAQ", description: "Часто задаваемые вопросы" },
  { id: "contact", title: "Контакты", description: "Форма обратной связи" },
];

const corporateScreenshots: TemplateScreenshot[] = [
  { id: "hero", title: "Главная", description: "Первый экран с ключевой информацией" },
  { id: "about", title: "О компании", description: "История и миссия компании" },
  { id: "services", title: "Услуги", description: "Перечень услуг с описанием" },
  { id: "team", title: "Команда", description: "Сотрудники и их роли" },
  { id: "portfolio", title: "Портфолио", description: "Кейсы и проекты" },
  { id: "contacts", title: "Контакты", description: "Карта и формы связи" },
];

const ecommerceScreenshots: TemplateScreenshot[] = [
  { id: "hero", title: "Главная", description: "Витрина с акциями и новинками" },
  { id: "catalog", title: "Каталог", description: "Сетка товаров с фильтрами" },
  { id: "product", title: "Карточка товара", description: "Детальная страница продукта" },
  { id: "cart", title: "Корзина", description: "Оформление заказа" },
  { id: "checkout", title: "Оплата", description: "Страница оплаты" },
  { id: "account", title: "Личный кабинет", description: "История заказов" },
];

const webappScreenshots: TemplateScreenshot[] = [
  { id: "dashboard", title: "Дашборд", description: "Главная панель с виджетами" },
  { id: "analytics", title: "Аналитика", description: "Графики и отчёты" },
  { id: "users", title: "Пользователи", description: "Управление пользователями" },
  { id: "settings", title: "Настройки", description: "Конфигурация системы" },
  { id: "notifications", title: "Уведомления", description: "Центр оповещений" },
  { id: "profile", title: "Профиль", description: "Личные данные" },
];

export const categories: Category[] = [
  {
    id: "landing",
    name: "Лендинги",
    icon: "Sparkles",
    description: "Одностраничные сайты для продвижения продуктов и услуг",
    templates: [
      {
        id: "noir-elegance",
        name: "Noir Elegance",
        description: "Минималистичный лендинг с драматичными контрастами и анимированными переходами",
        fullDescription: "Noir Elegance — это воплощение современного минимализма в веб-дизайне. Чёрно-белая палитра с акцентными золотыми элементами создаёт атмосферу утончённой роскоши. Каждая деталь продумана до мелочей: от микроанимаций при скролле до плавных переходов между секциями. Идеально подходит для премиальных брендов, архитектурных бюро и творческих студий.",
        price: "от 45 000 ₽",
        tags: ["Минимализм", "Анимации", "Dark Mode"],
        gradient: "from-zinc-900 via-neutral-800 to-zinc-900",
        accentColor: "bg-amber-500",
        features: ["Parallax эффекты", "Микроанимации", "Форма заявки"],
        highlights: [
          "Адаптивный дизайн для всех устройств",
          "SEO-оптимизация из коробки",
          "Интеграция с CRM-системами",
          "A/B тестирование элементов",
          "Аналитика конверсий"
        ],
        techStack: ["React", "Framer Motion", "Tailwind CSS", "TypeScript"],
        deliveryTime: "7-10 дней",
        gallery: [],
        reviews: [
          { text: "Элегантный минимализм в каждой детали. Наши клиенты в восторге!", author: "Виктория Н.", role: "Арт-директор, Studio K", rating: 5 },
          { text: "Идеальный баланс между простотой и функциональностью.", author: "Максим Р.", role: "Founder, DesignLab", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: commonFAQs,
        screenshots: landingScreenshots,
        popular: true,
        rating: 4.9,
        ordersCount: 47,
        uniqueStyle: {
          primaryColor: "#18181b",
          secondaryColor: "#f59e0b",
          fontStyle: "Serif elegance",
          moodKeywords: ["минимализм", "контраст", "чёрно-белый", "утончённость"]
        }
      },
      {
        id: "golden-prestige",
        name: "Golden Prestige",
        description: "Премиальный лендинг с золотыми акцентами и эффектами свечения",
        fullDescription: "Golden Prestige создан для тех, кто не боится заявить о своём статусе. Роскошные золотые градиенты, эффекты glassmorphism и продуманная типографика формируют визуальный язык успеха. Шаблон включает интерактивный калькулятор стоимости услуг и возможность интеграции видео-фона для максимального эффекта.",
        price: "от 55 000 ₽",
        tags: ["Премиум", "Золото", "Glassmorphism"],
        gradient: "from-yellow-900/30 via-amber-800/20 to-yellow-900/30",
        accentColor: "bg-yellow-500",
        features: ["3D эффекты", "Видео-фон", "Калькулятор"],
        highlights: [
          "Встроенный калькулятор услуг",
          "Поддержка видео-фона",
          "Анимированные счётчики",
          "Интерактивная карта",
          "Мультиязычность"
        ],
        techStack: ["React", "Three.js", "GSAP", "TypeScript"],
        deliveryTime: "10-14 дней",
        gallery: [],
        reviews: [
          { text: "Наш сайт стал визитной карточкой бренда. ROI превзошёл ожидания.", author: "Андрей К.", role: "CEO, Luxury Brand", rating: 5 },
          { text: "Золотая палитра идеально передаёт премиальность нашего сервиса.", author: "Ольга С.", role: "Marketing Director", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: commonFAQs,
        screenshots: landingScreenshots,
        rating: 4.8,
        ordersCount: 32,
        uniqueStyle: {
          primaryColor: "#78350f",
          secondaryColor: "#fbbf24",
          fontStyle: "Bold luxury",
          moodKeywords: ["роскошь", "золото", "премиум", "статус"]
        }
      },
      {
        id: "crystal-vision",
        name: "Crystal Vision",
        description: "Футуристичный дизайн со стеклянными элементами и неоновыми акцентами",
        fullDescription: "Crystal Vision переносит пользователя в мир будущего. Неоновые акценты, стеклянные интерфейсы и кастомный курсор создают уникальный интерактивный опыт. Звуковые эффекты при взаимодействии добавляют дополнительный уровень погружения. Идеален для tech-стартапов, игровых компаний и инновационных брендов.",
        price: "от 65 000 ₽",
        tags: ["Футуризм", "Неон", "Glass UI"],
        gradient: "from-purple-900/40 via-indigo-900/30 to-purple-900/40",
        accentColor: "bg-purple-500",
        features: ["Интерактивные элементы", "Custom курсор", "Звуковые эффекты"],
        highlights: [
          "Кастомный анимированный курсор",
          "Звуковое сопровождение UI",
          "Particle-эффекты",
          "Интерактивные 3D-элементы",
          "Темная/светлая тема"
        ],
        techStack: ["React", "Three.js", "Howler.js", "Framer Motion"],
        deliveryTime: "14-18 дней",
        gallery: [],
        reviews: [
          { text: "WOW-эффект гарантирован! Клиенты запоминают нас с первого взгляда.", author: "Игорь М.", role: "CTO, GameDev Studio", rating: 5 },
          { text: "Неоновый стиль идеально подошёл для нашего tech-стартапа.", author: "Анна Л.", role: "Co-founder, AI Corp", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: commonFAQs,
        screenshots: landingScreenshots,
        isNew: true,
        rating: 5.0,
        ordersCount: 18,
        uniqueStyle: {
          primaryColor: "#581c87",
          secondaryColor: "#a855f7",
          fontStyle: "Tech futuristic",
          moodKeywords: ["футуризм", "неон", "tech", "инновации"]
        }
      },
      {
        id: "nature-flow",
        name: "Nature Flow",
        description: "Органический лендинг с мягкими градиентами и природной эстетикой",
        fullDescription: "Nature Flow вдохновлён живой природой — мягкие зелёные градиенты, органические формы и плавные анимации создают ощущение гармонии. Идеален для велнес-центров, эко-брендов и натуральной косметики. Включает секции преимуществ, тарифы, отзывы и FAQ.",
        price: "от 35 000 ₽",
        tags: ["Природа", "Органика", "Велнес"],
        gradient: "from-green-900/40 via-emerald-800/20 to-green-900/40",
        accentColor: "bg-emerald-500",
        features: ["Parallax фон", "Форма заявки", "FAQ аккордеон"],
        highlights: ["Адаптивный дизайн", "SEO-оптимизация", "Форма обратной связи", "Карусель отзывов", "Блок тарифов"],
        techStack: ["React", "Framer Motion", "Tailwind CSS"],
        deliveryTime: "5-7 дней",
        gallery: [],
        reviews: commonReviews,
        faqs: commonFAQs,
        screenshots: landingScreenshots,
        isNew: true,
        rating: 4.9,
        ordersCount: 12,
        uniqueStyle: { primaryColor: "#065f46", secondaryColor: "#34d399", fontStyle: "Organic soft", moodKeywords: ["природа", "зелень", "экология", "гармония"] }
      },
      {
        id: "urban-pulse",
        name: "Urban Pulse",
        description: "Тёмный индустриальный лендинг с городской энергией",
        fullDescription: "Urban Pulse — мощный и контрастный лендинг для ресторанов, фитнес-клубов и ивент-агентств. Тёмная палитра с красными акцентами, жёсткая типографика и динамичные анимации передают ритм большого города.",
        price: "от 40 000 ₽",
        tags: ["Тёмный", "Город", "Ивент"],
        gradient: "from-zinc-900 via-red-900/20 to-zinc-900",
        accentColor: "bg-red-500",
        features: ["Видео-секция", "Меню/Расписание", "Контакт-форма"],
        highlights: ["Адаптивный дизайн", "Меню услуг", "Отзывы клиентов", "FAQ", "Карта проезда"],
        techStack: ["React", "Framer Motion", "Tailwind CSS"],
        deliveryTime: "5-7 дней",
        gallery: [],
        reviews: commonReviews,
        faqs: commonFAQs,
        screenshots: landingScreenshots,
        rating: 4.8,
        ordersCount: 8,
        uniqueStyle: { primaryColor: "#18181b", secondaryColor: "#ef4444", fontStyle: "Bold industrial", moodKeywords: ["город", "ритм", "энергия", "контраст"] }
      },
      {
        id: "clean-studio",
        name: "Clean Studio",
        description: "Воздушный светлый лендинг для салонов и студий",
        fullDescription: "Clean Studio — минимализм и чистота форм. Белые пространства, мягкие тени и пастельные акценты идеально подходят для салонов красоты, медицинских клиник и дизайн-студий. Каждая секция дышит и не перегружает восприятие.",
        price: "от 35 000 ₽",
        tags: ["Светлый", "Минимализм", "Красота"],
        gradient: "from-rose-50 via-white to-rose-50",
        accentColor: "bg-rose-400",
        features: ["Галерея работ", "Запись онлайн", "Прайс-лист"],
        highlights: ["Светлый дизайн", "Адаптив", "Форма записи", "Отзывы", "Акции"],
        techStack: ["React", "Framer Motion", "Tailwind CSS"],
        deliveryTime: "5-7 дней",
        gallery: [],
        reviews: commonReviews,
        faqs: commonFAQs,
        screenshots: landingScreenshots,
        rating: 4.9,
        ordersCount: 15,
        uniqueStyle: { primaryColor: "#ffffff", secondaryColor: "#fb7185", fontStyle: "Clean airy", moodKeywords: ["чистота", "свет", "минимализм", "нежность"] }
      },
      {
        id: "neon-drive",
        name: "Neon Drive",
        description: "Яркий неоновый лендинг для IT и маркетинга",
        fullDescription: "Neon Drive — дерзкий и яркий лендинг с неоновыми акцентами на тёмном фоне. Создан для IT-компаний, маркетинговых агентств и геймдев-студий. Анимированные неоновые рамки, градиентные кнопки и пульсирующие элементы привлекают и удерживают внимание.",
        price: "от 45 000 ₽",
        tags: ["Неон", "IT", "Маркетинг"],
        gradient: "from-slate-950 via-cyan-900/20 to-slate-950",
        accentColor: "bg-cyan-400",
        features: ["Неоновые эффекты", "Счётчики", "CTA анимации"],
        highlights: ["Glow-эффекты", "Адаптив", "Тарифы", "FAQ", "Форма заявки"],
        techStack: ["React", "Framer Motion", "Tailwind CSS"],
        deliveryTime: "7-10 дней",
        gallery: [],
        reviews: commonReviews,
        faqs: commonFAQs,
        screenshots: landingScreenshots,
        isNew: true,
        rating: 5.0,
        ordersCount: 6,
        uniqueStyle: { primaryColor: "#0f172a", secondaryColor: "#22d3ee", fontStyle: "Tech neon", moodKeywords: ["неон", "технологии", "яркость", "дерзость"] }
      },
      {
        id: "warm-craft",
        name: "Warm Craft",
        description: "Крафтовый лендинг с тёплой уютной эстетикой",
        fullDescription: "Warm Craft — это тёплые тона, крафтовые текстуры и уютная атмосфера. Идеальный выбор для кофеен, мастерских, фотографов и hand-made брендов. Мягкая типографика и тёплые оттенки создают ощущение домашнего уюта.",
        price: "от 35 000 ₽",
        tags: ["Крафт", "Тёплый", "Уют"],
        gradient: "from-amber-900/30 via-orange-800/20 to-amber-900/30",
        accentColor: "bg-amber-600",
        features: ["Галерея", "Меню/Прайс", "История бренда"],
        highlights: ["Тёплая палитра", "Адаптив", "Отзывы", "FAQ", "Контакты"],
        techStack: ["React", "Framer Motion", "Tailwind CSS"],
        deliveryTime: "5-7 дней",
        gallery: [],
        reviews: commonReviews,
        faqs: commonFAQs,
        screenshots: landingScreenshots,
        rating: 4.8,
        ordersCount: 10,
        uniqueStyle: { primaryColor: "#78350f", secondaryColor: "#d97706", fontStyle: "Warm handmade", moodKeywords: ["крафт", "уют", "тепло", "ручная работа"] }
      }
    ]
  },
  {
    id: "corporate",
    name: "Корпоративные",
    icon: "Layers",
    description: "Многостраничные сайты для бизнеса и компаний",
    templates: [
      {
        id: "executive-suite",
        name: "Executive Suite",
        description: "Строгий корпоративный стиль с акцентом на доверие и профессионализм",
        fullDescription: "Executive Suite — это классика корпоративного веб-дизайна, переосмысленная для современной эпохи. Чистые линии, сдержанная цветовая палитра и безупречная типографика создают образ надёжной и профессиональной компании. Встроенная CMS-панель позволяет легко управлять контентом без привлечения разработчиков.",
        price: "от 120 000 ₽",
        tags: ["Бизнес", "Многостраничный", "SEO"],
        gradient: "from-slate-900 via-slate-800 to-slate-900",
        accentColor: "bg-blue-500",
        features: ["CMS панель", "Блог", "Мультиязычность"],
        highlights: [
          "Панель управления контентом",
          "Интегрированный блог",
          "Страница вакансий",
          "Форма обратной связи",
          "Карта офисов"
        ],
        techStack: ["React", "Supabase", "Tailwind CSS", "MDX"],
        deliveryTime: "21-28 дней",
        gallery: [],
        reviews: [
          { text: "Профессиональный сайт, который вызывает доверие у клиентов.", author: "Сергей В.", role: "Директор, Consulting Group", rating: 5 },
          { text: "CMS настолько удобная, что мы сами обновляем контент.", author: "Марина П.", role: "HR Manager", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: [
          { question: "Сколько страниц входит в шаблон?", answer: "Базовый пакет включает 8 страниц: Главная, О компании, Услуги, Команда, Портфолио, Блог, Вакансии, Контакты. Дополнительные страницы — от 5000 ₽/шт." },
          ...commonFAQs.slice(1)
        ],
        screenshots: corporateScreenshots,
        popular: true,
        rating: 4.9,
        ordersCount: 89,
        uniqueStyle: {
          primaryColor: "#1e293b",
          secondaryColor: "#3b82f6",
          fontStyle: "Corporate professional",
          moodKeywords: ["бизнес", "доверие", "профессионализм", "надёжность"]
        }
      },
      {
        id: "marble-gold",
        name: "Marble & Gold",
        description: "Роскошный дизайн с текстурами мрамора и золотыми элементами",
        fullDescription: "Marble & Gold — выбор элитных брендов и luxury-сегмента. Текстуры натурального мрамора в сочетании с золотой фольгой создают ощущение физической осязаемости премиум-материалов. Галерея работ с hover-эффектами и анимированные переходы между страницами формируют незабываемое впечатление.",
        price: "от 150 000 ₽",
        tags: ["Люкс", "Текстуры", "Анимации"],
        gradient: "from-stone-900 via-stone-800 to-stone-900",
        accentColor: "bg-amber-400",
        features: ["Портфолио галерея", "Команда", "Вакансии"],
        highlights: [
          "Текстурные фоны высокого разрешения",
          "Галерея с lightbox",
          "Страница команды",
          "Раздел отзывов клиентов",
          "Интеграция соцсетей"
        ],
        techStack: ["React", "Framer Motion", "Supabase", "SCSS"],
        deliveryTime: "28-35 дней",
        gallery: [],
        reviews: [
          { text: "Сайт отражает премиальность нашего бренда на 100%.", author: "Екатерина Д.", role: "Owner, Luxury Interiors", rating: 5 },
          { text: "Текстуры мрамора создают эффект присутствия в настоящем шоуруме.", author: "Павел К.", role: "Art Director", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: commonFAQs,
        screenshots: corporateScreenshots,
        rating: 4.8,
        ordersCount: 34,
        uniqueStyle: {
          primaryColor: "#44403c",
          secondaryColor: "#fbbf24",
          fontStyle: "Luxury serif",
          moodKeywords: ["мрамор", "золото", "люкс", "элита"]
        }
      },
      {
        id: "tech-horizon",
        name: "Tech Horizon",
        description: "Современный технологичный стиль для IT-компаний и стартапов",
        fullDescription: "Tech Horizon разработан специально для технологических компаний и SaaS-продуктов. Динамичные градиенты, интерактивные демо продукта и встроенная документация помогают эффективно презентовать сложные технические решения. API-интеграции позволяют подключить любые внешние сервисы.",
        price: "от 180 000 ₽",
        tags: ["Tech", "Gradient", "Interactive"],
        gradient: "from-cyan-900/30 via-teal-900/20 to-cyan-900/30",
        accentColor: "bg-teal-400",
        features: ["Интеграция API", "Демо продукта", "Документация"],
        highlights: [
          "Интерактивное демо продукта",
          "Документация с поиском",
          "Страница статуса сервисов",
          "Changelog",
          "API-песочница"
        ],
        techStack: ["React", "TypeScript", "Supabase", "Prism.js"],
        deliveryTime: "35-42 дня",
        gallery: [],
        reviews: [
          { text: "Документация и API-песочница сократили нагрузку на саппорт на 40%.", author: "Дмитрий Н.", role: "CTO, SaaS Platform", rating: 5 },
          { text: "Лучший выбор для tech-продукта. Всё продумано до мелочей.", author: "Алексей М.", role: "Product Manager", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: [
          { question: "Можно ли интегрировать Swagger/OpenAPI?", answer: "Да, мы поддерживаем автоматическую генерацию документации из OpenAPI спецификации." },
          ...commonFAQs.slice(1)
        ],
        screenshots: corporateScreenshots,
        isNew: true,
        rating: 4.9,
        ordersCount: 23,
        uniqueStyle: {
          primaryColor: "#164e63",
          secondaryColor: "#2dd4bf",
          fontStyle: "Tech modern",
          moodKeywords: ["технологии", "SaaS", "стартап", "инновации"]
        }
      }
    ]
  },
  {
    id: "ecommerce",
    name: "Интернет-магазины",
    icon: "ShoppingBag",
    description: "E-commerce решения для продажи товаров онлайн",
    templates: [
      {
        id: "luxe-boutique",
        name: "Luxe Boutique",
        description: "Элитный магазин для fashion и luxury брендов",
        fullDescription: "Luxe Boutique — витрина для модных домов и luxury-ритейла. Минималистичный интерфейс не отвлекает от товаров, а продуманная навигация с фильтрами и wishlist-функционалом обеспечивает комфортный шопинг. Quick View позволяет просмотреть товар без перехода на отдельную страницу.",
        price: "от 250 000 ₽",
        tags: ["Fashion", "Luxury", "Каталог"],
        gradient: "from-rose-900/30 via-pink-900/20 to-rose-900/30",
        accentColor: "bg-rose-400",
        features: ["Фильтры товаров", "Wishlist", "Quick View"],
        highlights: [
          "Продвинутые фильтры товаров",
          "Список желаний",
          "Быстрый просмотр товара",
          "Сравнение товаров",
          "Уведомления о наличии"
        ],
        techStack: ["React", "Supabase", "Stripe", "Tailwind CSS"],
        deliveryTime: "42-56 дней",
        gallery: [],
        reviews: [
          { text: "Конверсия выросла на 35% после запуска нового магазина.", author: "Наталья С.", role: "E-commerce Director", rating: 5 },
          { text: "Клиенты отмечают удобство навигации и скорость работы.", author: "Игорь Т.", role: "Owner, Fashion Store", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: [
          { question: "Какие платёжные системы поддерживаются?", answer: "Stripe, YooKassa, CloudPayments, Тинькофф, Сбербанк и любые другие по запросу." },
          { question: "Есть ли интеграция с 1С?", answer: "Да, мы делаем двустороннюю синхронизацию товаров, остатков и заказов с 1С." },
          ...commonFAQs.slice(2)
        ],
        screenshots: ecommerceScreenshots,
        popular: true,
        rating: 4.9,
        ordersCount: 56,
        uniqueStyle: {
          primaryColor: "#881337",
          secondaryColor: "#fb7185",
          fontStyle: "Fashion elegant",
          moodKeywords: ["мода", "люкс", "fashion", "стиль"]
        }
      },
      {
        id: "artisan-market",
        name: "Artisan Market",
        description: "Стильный маркетплейс для handmade и дизайнерских товаров",
        fullDescription: "Artisan Market объединяет продавцов уникальных товаров на одной платформе. Мультивендорная архитектура позволяет каждому мастеру иметь собственный кабинет с аналитикой продаж. Система отзывов и рейтингов помогает покупателям находить лучших продавцов.",
        price: "от 300 000 ₽",
        tags: ["Маркетплейс", "Handmade", "Мультивендор"],
        gradient: "from-orange-900/30 via-amber-900/20 to-orange-900/30",
        accentColor: "bg-orange-400",
        features: ["Кабинет продавца", "Отзывы", "Рейтинги"],
        highlights: [
          "Личный кабинет продавца",
          "Система отзывов и рейтингов",
          "Чат покупатель-продавец",
          "Аналитика продаж",
          "Промокоды и скидки"
        ],
        techStack: ["React", "Supabase", "Stripe Connect", "Socket.io"],
        deliveryTime: "56-70 дней",
        gallery: [],
        reviews: [
          { text: "Лучшая платформа для нашего сообщества мастеров.", author: "Мария К.", role: "Founder, Craft Community", rating: 5 },
          { text: "Чат с покупателями значительно повысил лояльность.", author: "Артём В.", role: "Seller", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: [
          { question: "Как происходит расчёт с продавцами?", answer: "Через Stripe Connect с автоматическими выплатами раз в неделю. Комиссия настраивается индивидуально." },
          ...commonFAQs.slice(1)
        ],
        screenshots: ecommerceScreenshots,
        rating: 4.7,
        ordersCount: 21,
        uniqueStyle: {
          primaryColor: "#7c2d12",
          secondaryColor: "#fb923c",
          fontStyle: "Warm handcrafted",
          moodKeywords: ["хендмейд", "ремесло", "тёплый", "уникальный"]
        }
      },
      {
        id: "premium-gallery",
        name: "Premium Gallery",
        description: "Галерейный формат для эксклюзивных товаров и коллекций",
        fullDescription: "Premium Gallery превращает интернет-магазин в виртуальную галерею. AR-примерка позволяет увидеть товар в реальном пространстве, а 360° просмотр — рассмотреть каждую деталь. Персонализация витрины на основе предпочтений пользователя повышает конверсию.",
        price: "от 350 000 ₽",
        tags: ["Галерея", "Premium", "Анимации"],
        gradient: "from-emerald-900/30 via-green-900/20 to-emerald-900/30",
        accentColor: "bg-emerald-400",
        features: ["AR примерка", "360° просмотр", "Персонализация"],
        highlights: [
          "AR-примерка товаров",
          "360° просмотр продукта",
          "Персонализированные рекомендации",
          "Виртуальный шоурум",
          "Живые консультации"
        ],
        techStack: ["React", "Three.js", "AR.js", "Supabase", "WebRTC"],
        deliveryTime: "70-90 дней",
        gallery: [],
        reviews: [
          { text: "AR-функция увеличила время на сайте в 3 раза.", author: "Алексей П.", role: "CMO, Jewelry Brand", rating: 5 },
          { text: "Виртуальный шоурум — это будущее e-commerce.", author: "София М.", role: "Founder, Art Gallery", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: [
          { question: "Нужен ли специальный контент для AR?", answer: "Мы помогаем создать 3D-модели товаров для AR. Стоимость зависит от сложности объектов." },
          ...commonFAQs.slice(1)
        ],
        screenshots: ecommerceScreenshots,
        isNew: true,
        rating: 4.8,
        ordersCount: 12,
        uniqueStyle: {
          primaryColor: "#064e3b",
          secondaryColor: "#34d399",
          fontStyle: "Gallery minimal",
          moodKeywords: ["галерея", "AR", "премиум", "инновации"]
        }
      }
    ]
  },
  {
    id: "webapp",
    name: "Веб-приложения",
    icon: "Monitor",
    description: "Сложные интерактивные веб-приложения и SaaS платформы",
    templates: [
      {
        id: "dashboard-pro",
        name: "Dashboard Pro",
        description: "Профессиональная панель управления с аналитикой и графиками",
        fullDescription: "Dashboard Pro — мощный инструмент для визуализации данных и управления бизнес-процессами. Realtime-обновления, интерактивные графики и гибкая система виджетов позволяют настроить рабочее пространство под любые задачи. Экспорт отчётов в PDF и Excel упрощает документооборот.",
        price: "от 400 000 ₽",
        tags: ["Dashboard", "Analytics", "Charts"],
        gradient: "from-blue-900/30 via-indigo-900/20 to-blue-900/30",
        accentColor: "bg-blue-400",
        features: ["Realtime данные", "Экспорт отчётов", "Уведомления"],
        highlights: [
          "Realtime обновление данных",
          "Экспорт в PDF/Excel",
          "Push-уведомления",
          "Кастомизируемые виджеты",
          "Ролевой доступ"
        ],
        techStack: ["React", "Supabase Realtime", "Recharts", "React Query"],
        deliveryTime: "60-75 дней",
        gallery: [],
        reviews: [
          { text: "Дашборд заменил нам 5 разных инструментов.", author: "Владимир Г.", role: "Operations Director", rating: 5 },
          { text: "Realtime-обновления критически важны для нашего бизнеса.", author: "Антон С.", role: "CEO, Logistics", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: [
          { question: "Можно ли подключить внешние источники данных?", answer: "Да, мы интегрируемся с любыми API: Google Analytics, Яндекс.Метрика, CRM, ERP и другие." },
          { question: "Есть ли мобильная версия?", answer: "Да, дашборд полностью адаптивен. Также можем сделать PWA для установки на устройство." },
          ...commonFAQs.slice(2)
        ],
        screenshots: webappScreenshots,
        popular: true,
        rating: 4.9,
        ordersCount: 67,
        uniqueStyle: {
          primaryColor: "#1e3a8a",
          secondaryColor: "#60a5fa",
          fontStyle: "Data professional",
          moodKeywords: ["аналитика", "данные", "дашборд", "отчёты"]
        }
      },
      {
        id: "crm-elite",
        name: "CRM Elite",
        description: "CRM-система премиум класса для управления клиентами",
        fullDescription: "CRM Elite автоматизирует работу с клиентами на всех этапах воронки продаж. Визуальный конструктор воронок, интеграция с email-сервисами и система задач помогают команде продаж закрывать больше сделок. Детальная аналитика показывает узкие места и точки роста.",
        price: "от 500 000 ₽",
        tags: ["CRM", "Автоматизация", "Интеграции"],
        gradient: "from-violet-900/30 via-purple-900/20 to-violet-900/30",
        accentColor: "bg-violet-400",
        features: ["Воронка продаж", "Email рассылки", "Задачи"],
        highlights: [
          "Визуальная воронка продаж",
          "Email-маркетинг",
          "Система задач и напоминаний",
          "Интеграция с телефонией",
          "Отчёты по менеджерам"
        ],
        techStack: ["React", "Supabase", "SendGrid", "Twilio"],
        deliveryTime: "75-90 дней",
        gallery: [],
        reviews: [
          { text: "Продажи выросли на 45% за первый квартал использования.", author: "Роман Л.", role: "Sales Director", rating: 5 },
          { text: "Наконец-то CRM, которую менеджеры используют с удовольствием.", author: "Ирина К.", role: "Team Lead, Sales", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: [
          { question: "Есть ли интеграция с телефонией?", answer: "Да, поддерживаем Mango Office, Sipuni, Zadarma, МТТ и другие VoIP-провайдеры." },
          ...commonFAQs.slice(1)
        ],
        screenshots: webappScreenshots,
        rating: 4.8,
        ordersCount: 43,
        uniqueStyle: {
          primaryColor: "#5b21b6",
          secondaryColor: "#a78bfa",
          fontStyle: "CRM business",
          moodKeywords: ["CRM", "продажи", "воронка", "автоматизация"]
        }
      },
      {
        id: "platform-x",
        name: "Platform X",
        description: "Масштабируемая SaaS платформа с подпиской и биллингом",
        fullDescription: "Platform X — готовая основа для запуска собственного SaaS-продукта. Stripe-интеграция обеспечивает приём платежей и управление подписками. Мультитенантная архитектура позволяет обслуживать множество клиентов изолированно. White label опция даёт возможность перепродажи под собственным брендом.",
        price: "от 600 000 ₽",
        tags: ["SaaS", "Биллинг", "Multi-tenant"],
        gradient: "from-fuchsia-900/30 via-pink-900/20 to-fuchsia-900/30",
        accentColor: "bg-fuchsia-400",
        features: ["Подписки", "Stripe биллинг", "Multi-tenant"],
        highlights: [
          "Управление подписками",
          "Stripe биллинг",
          "Мультитенантность",
          "White label",
          "API для интеграций"
        ],
        techStack: ["React", "Supabase", "Stripe", "Next.js API Routes"],
        deliveryTime: "90-120 дней",
        gallery: [],
        reviews: [
          { text: "Запустили SaaS за 3 месяца вместо года. Экономия колоссальная.", author: "Денис М.", role: "Founder, SaaS Startup", rating: 5 },
          { text: "Биллинг работает как часы. Stripe интеграция безупречна.", author: "Кирилл Н.", role: "CTO", rating: 5 },
          ...commonReviews.slice(0, 1)
        ],
        faqs: [
          { question: "Подходит ли для B2B SaaS?", answer: "Да, шаблон включает корпоративные функции: роли, разрешения, аудит, SSO." },
          { question: "Можно ли добавить своё API?", answer: "Платформа построена API-first. Вы можете расширять функционал и подключать внешние сервисы." },
          ...commonFAQs.slice(2)
        ],
        screenshots: webappScreenshots,
        rating: 4.9,
        ordersCount: 28,
        uniqueStyle: {
          primaryColor: "#86198f",
          secondaryColor: "#e879f9",
          fontStyle: "SaaS modern",
          moodKeywords: ["SaaS", "подписка", "биллинг", "платформа"]
        }
      }
    ]
  }
];

export const getTemplateById = (id: string): Template | undefined => {
  for (const category of categories) {
    const template = category.templates.find(t => t.id === id);
    if (template) return template;
  }
  return undefined;
};

export const getCategoryByTemplateId = (id: string): Category | undefined => {
  for (const category of categories) {
    if (category.templates.some(t => t.id === id)) {
      return category;
    }
  }
  return undefined;
};

export const getSimilarTemplates = (templateId: string, limit: number = 3): Template[] => {
  const category = getCategoryByTemplateId(templateId);
  if (!category) return [];
  
  return category.templates
    .filter(t => t.id !== templateId)
    .slice(0, limit);
};

export const getAllTemplates = (): Template[] => {
  return categories.flatMap(c => c.templates);
};

export const getPopularTemplates = (limit: number = 6): Template[] => {
  return getAllTemplates()
    .sort((a, b) => b.ordersCount - a.ordersCount)
    .slice(0, limit);
};

export const getNewTemplates = (limit: number = 3): Template[] => {
  return getAllTemplates()
    .filter(t => t.isNew)
    .slice(0, limit);
};
