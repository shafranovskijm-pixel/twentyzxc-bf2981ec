import { Sparkles, Layers, ShoppingBag, Monitor } from "lucide-react";

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
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  templates: Template[];
}

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
        gallery: []
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
        gallery: []
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
        gallery: []
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
        gallery: []
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
        gallery: []
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
        gallery: []
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
        gallery: []
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
        gallery: []
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
        gallery: []
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
        gallery: []
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
        gallery: []
      },
      {
        id: "platform-x",
        name: "Platform X",
        description: "Масштабируемая SaaS платформа с подпиской и биллингом",
        fullDescription: "Platform X — готовая основа для запуска собственного SaaS-продукта. Stripe-интеграция обеспечивает приём платежей и управление подписками. Мультитенантная архитектура позволяет обслуживать множество клиентов изолированно. White label опция даёт возможность перепродажи под собственным брендом.",
        price: "от 700 000 ₽",
        tags: ["SaaS", "Подписки", "API"],
        gradient: "from-fuchsia-900/30 via-pink-900/20 to-fuchsia-900/30",
        accentColor: "bg-fuchsia-400",
        features: ["Stripe интеграция", "Мультитенантность", "White label"],
        highlights: [
          "Биллинг через Stripe",
          "Мультитенантная архитектура",
          "White label решение",
          "REST API",
          "Webhooks"
        ],
        techStack: ["React", "Supabase", "Stripe", "Redis", "Docker"],
        deliveryTime: "90-120 дней",
        gallery: []
      }
    ]
  }
];

export const getAllTemplates = (): Template[] => {
  return categories.flatMap(category => category.templates);
};

export const getTemplateById = (id: string): Template | undefined => {
  return getAllTemplates().find(template => template.id === id);
};

export const getCategoryByTemplateId = (id: string): Category | undefined => {
  return categories.find(category => 
    category.templates.some(template => template.id === id)
  );
};
