import { motion } from "framer-motion";
import { Briefcase, Rocket, Image, Sparkles, GraduationCap, UtensilsCrossed, CalendarDays, TrendingUp, BarChart3, MessageSquareQuote, ListChecks, HelpCircle, Play, Type, MousePointerClick, Images, Menu, PanelBottom, Dumbbell, BookOpen, Camera, Code2, DollarSign, Users, Zap, Columns3, LayoutList, FileText, Share2, ChevronDown, Home, Heart, CreditCard, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaygroundBlock, BlockStyles } from "@/data/playground-effects";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  blocks: Omit<PlaygroundBlock, 'id'>[];
}

interface BlockExample {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  blocks: Omit<PlaygroundBlock, 'id'>[];
}

const ds: BlockStyles = {
  backgroundColor: 'transparent',
  textColor: '#ffffff',
  padding: '16px',
  fontSize: '16px',
  borderRadius: '8px',
  textAlign: 'center'
};

export const PAGE_TEMPLATES: Template[] = [
  // ===== 1. ВИЗИТКА — Тёмно-синий + серебристые акценты =====
  {
    id: 'business-card',
    name: 'Визитка',
    description: 'Личная страница с контактами',
    icon: <Briefcase className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Обо мне|#about\nПортфолио|#works\nКонтакт|#contact', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0d1b2a', padding: '16px 24px', borderRadius: '0px', textColor: '#94a3b8' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '24px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', animation: 'scale-in', styles: { ...ds, padding: '8px', borderRadius: '999px' } },
      { type: 'heading', content: 'Иван Иванов', anchorId: 'hero', animation: 'fade-in-up', styles: { ...ds, fontSize: '44px', padding: '16px 16px 4px', gradientText: 'linear-gradient(135deg, #e2e8f0, #ffffff)' } },
      { type: 'text', content: 'Веб-разработчик & UI-дизайнер', animation: 'fade-in-up', styles: { ...ds, fontSize: '18px', textColor: '#64748b', padding: '4px 16px' } },
      { type: 'divider', content: '', animation: 'fade-in', styles: { ...ds, padding: '16px' } },
      { type: 'text', content: 'Создаю современные веб-сайты и приложения с фокусом на пользовательский опыт, производительность и чистый код. 5+ лет коммерческой разработки.', anchorId: 'about', animation: 'fade-in-up', styles: { ...ds, fontSize: '15px', textColor: '#94a3b8', padding: '8px 48px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'columns', content: '⚛️ React|TypeScript, Next.js||🎨 Дизайн|Figma, UI/UX||☁️ Backend|Node.js, PostgreSQL', anchorId: 'works', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#1e293b', borderRadius: '12px', textColor: '#cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'socials', content: 'telegram|https://t.me/example\ninstagram|https://instagram.com/example\nvk|https://vk.com/example', animation: 'fade-in-up', styles: { ...ds, padding: '12px' } },
      { type: 'button', content: 'Связаться со мной', anchorId: 'contact', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, padding: '16px' } },
      { type: 'footer', content: '© 2026 Иван Иванов|ivan@mail.com|+7 (999) 000-00-00', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0a1628', padding: '24px', borderRadius: '0px', textColor: '#64748b' } }
    ]
  },

  // ===== 2. ЛЕНДИНГ — Чёрный + зелёный акцент =====
  {
    id: 'landing',
    name: 'Лендинг',
    description: 'Продающая страница продукта',
    icon: <Rocket className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Главная|#hero\nПреимущества|#features\nО продукте|#product\nCTA|#cta', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0a0a0a', padding: '16px 24px', borderRadius: '0px', textColor: '#a1a1aa' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '24px' } },
      { type: 'heading', content: 'Ваш идеальный продукт', anchorId: 'hero', animation: 'fade-in-up', styles: { ...ds, fontSize: '56px', padding: '24px 16px 8px', gradientText: 'linear-gradient(135deg, #22c55e, #4ade80, #86efac)' } },
      { type: 'text', content: 'Инновационное решение для современного бизнеса. Автоматизируйте рутину и сфокусируйтесь на росте.', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#71717a', padding: '8px 32px 24px' } },
      { type: 'button', content: 'Попробовать бесплатно →', animation: 'scale-bounce', hoverEffect: 'hover-lift', buttonStyle: 'gradient', styles: { ...ds, padding: '16px', fontSize: '18px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '20px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop', anchorId: 'product', animation: 'fade-in', hoverEffect: 'hover-scale', styles: { ...ds, padding: '16px 32px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(34,197,94,0.15)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'heading', content: 'Почему выбирают нас', anchorId: 'features', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'columns', content: '🚀 Быстрый старт|Настройка за 5 минут без программирования||🔒 Безопасность|Шифрование данных на всех уровнях||📱 Адаптивность|Работает на любых устройствах||📊 Аналитика|Подробные отчёты в реальном времени', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, padding: '20px', backgroundColor: '#111111', borderRadius: '12px', textColor: '#d4d4d8', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '10K+|Пользователей', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', textColor: '#22c55e' } },
      { type: 'counter', content: '99.8%|Uptime', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', textColor: '#22c55e' } },
      { type: 'counter', content: '24/7|Поддержка', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', textColor: '#22c55e' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'button', content: 'Начать бесплатно', anchorId: 'cta', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, padding: '16px', fontSize: '18px' } },
      { type: 'footer', content: '© 2026 Продукт. Все права защищены.|hello@product.com', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0a0a0a', padding: '24px', borderRadius: '0px', textColor: '#52525b' } }
    ]
  },

  // ===== 3. ПОРТФОЛИО — Тёмный + фиолетовый акцент =====
  {
    id: 'portfolio',
    name: 'Портфолио',
    description: 'Галерея работ с анимациями',
    icon: <Image className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Работы|#works\nО себе|#about\nКонтакт|#contact', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0f0f1a', padding: '16px 24px', borderRadius: '0px', textColor: '#9ca3af' } },
      { type: 'heading', content: 'Мои работы', anchorId: 'works', animation: 'fade-in-up', styles: { ...ds, fontSize: '48px', padding: '32px 16px 8px', gradientText: 'linear-gradient(135deg, #a855f7, #c084fc, #e879f9)' } },
      { type: 'text', content: 'Дизайн, разработка, продуктовое мышление', animation: 'fade-in', styles: { ...ds, fontSize: '18px', textColor: '#6b7280', padding: '4px 16px 24px' } },
      { type: 'gallery', content: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1559028012-481c04fa702d?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, padding: '16px', borderRadius: '12px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'columns', content: '🎨 UI/UX Дизайн|Figma, Sketch, прототипирование||💻 Разработка|React, TypeScript, Node.js||📱 Мобайл|React Native, Flutter', anchorId: 'about', animation: 'fade-in-up', styles: { ...ds, padding: '20px', backgroundColor: '#1a1a2e', borderRadius: '12px', textColor: '#c4b5fd', boxShadow: '0 4px 30px rgba(168,85,247,0.1)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'quote', content: 'Дизайн — это не то, как вещь выглядит, а то, как она работает.|Стив Джобс', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '24px 32px', textColor: '#a78bfa' } },
      { type: 'button', content: 'Обсудить проект', anchorId: 'contact', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, padding: '16px' } },
      { type: 'footer', content: '© 2026 Портфолио|portfolio@mail.com', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0a0a14', padding: '24px', borderRadius: '0px', textColor: '#4b5563' } }
    ]
  },

  // ===== 4. ПРОМО — Чёрный + красный акцент =====
  {
    id: 'promo',
    name: 'Промо',
    description: 'Яркий акцент на событии',
    icon: <Sparkles className="w-5 h-5" />,
    blocks: [
      { type: 'text', content: '🔥 СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ', animation: 'pulse', styles: { ...ds, fontSize: '14px', textColor: '#ef4444', padding: '32px 16px 8px' } },
      { type: 'heading', content: 'Чёрная пятница', animation: 'scale-bounce', styles: { ...ds, fontSize: '60px', padding: '8px 16px', gradientText: 'linear-gradient(135deg, #ffffff, #e5e5e5)' } },
      { type: 'heading', content: '-50%', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, fontSize: '96px', padding: '0 16px', gradientText: 'linear-gradient(135deg, #ef4444, #f97316, #ef4444)' } },
      { type: 'text', content: 'на все услуги по разработке сайтов', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#a1a1aa', padding: '8px 16px' } },
      { type: 'countdown', content: '2026-11-30T23:59:59|До конца акции', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '24px', fontSize: '20px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '8px' } },
      { type: 'columns', content: '🎨 Дизайн|от 15 000₽ ~~30 000₽~~||💻 Разработка|от 25 000₽ ~~50 000₽~~||📈 Маркетинг|от 10 000₽ ~~20 000₽~~', animation: 'fade-in-up', styles: { ...ds, padding: '20px', backgroundColor: '#1a1111', borderRadius: '12px', textColor: '#fca5a5', boxShadow: '0 4px 30px rgba(239,68,68,0.1)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'button', content: '🔥 Получить скидку', animation: 'scale-in', hoverEffect: 'hover-lift', buttonStyle: 'gradient', styles: { ...ds, fontSize: '20px', padding: '16px' } },
      { type: 'text', content: 'Осталось: 27 мест из 100', animation: 'fade-in', styles: { ...ds, fontSize: '14px', textColor: '#ef4444', padding: '16px' } }
    ]
  },

  // ===== 5. РЕЗЮМЕ — Тёмный + фиолетово-синий =====
  {
    id: 'resume',
    name: 'Резюме',
    description: 'Страница-резюме с навыками',
    icon: <GraduationCap className="w-5 h-5" />,
    blocks: [
      { type: 'heading', content: 'Алексей Смирнов', animation: 'fade-in-up', styles: { ...ds, fontSize: '44px', padding: '32px 16px 4px', gradientText: 'linear-gradient(135deg, #818cf8, #a5b4fc)' } },
      { type: 'text', content: 'Full-stack разработчик • 5 лет опыта', animation: 'fade-in-up', styles: { ...ds, fontSize: '18px', textColor: '#7c3aed', padding: '4px 16px 16px' } },
      { type: 'divider', content: '', animation: 'fade-in', styles: { ...ds, padding: '12px' } },
      { type: 'quote', content: 'Пишу код, который легко читать и приятно поддерживать.|Жизненное кредо', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px 32px', textColor: '#a5b4fc' } },
      { type: 'heading', content: 'Навыки', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '24px 16px 12px' } },
      { type: 'icon-text', content: '⚛️|React & TypeScript|Компоненты, хуки, Next.js, SSR', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#1e1b2e', padding: '16px', borderRadius: '12px', textColor: '#c4b5fd', boxShadow: '0 2px 15px rgba(124,58,237,0.15)' } },
      { type: 'icon-text', content: '🎨|Дизайн-системы|Tailwind CSS, Figma, Storybook', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#1e1b2e', padding: '16px', borderRadius: '12px', textColor: '#c4b5fd', boxShadow: '0 2px 15px rgba(124,58,237,0.15)' } },
      { type: 'icon-text', content: '🗄️|Backend|PostgreSQL, Supabase, Node.js, REST/GraphQL', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#1e1b2e', padding: '16px', borderRadius: '12px', textColor: '#c4b5fd', boxShadow: '0 2px 15px rgba(124,58,237,0.15)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Опыт', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '16px 16px 12px' } },
      { type: 'counter', content: '12|Завершённых проектов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#1e1b2e', borderRadius: '12px', textColor: '#a5b4fc' } },
      { type: 'counter', content: '5|Лет в разработке', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#1e1b2e', borderRadius: '12px', textColor: '#a5b4fc' } },
      { type: 'counter', content: '3|Компании в штате', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#1e1b2e', borderRadius: '12px', textColor: '#a5b4fc' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'button', content: 'Скачать PDF-резюме', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, padding: '16px' } }
    ]
  },

  // ===== 6. РЕСТОРАН — Тёплый коричневый + золото =====
  {
    id: 'restaurant',
    name: 'Ресторан',
    description: 'Меню и атмосфера заведения',
    icon: <UtensilsCrossed className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Ресторан|#hero\nМеню|#menu\nРезерв|#reserve', animation: 'fade-in', styles: { ...ds, backgroundColor: '#1a1510', padding: '16px 24px', borderRadius: '0px', textColor: '#a89070' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop', anchorId: 'hero', animation: 'fade-in', styles: { ...ds, padding: '0px', borderRadius: '0px' } },
      { type: 'heading', content: 'La Maison', animation: 'blur-in', styles: { ...ds, fontSize: '52px', padding: '32px 16px 4px', gradientText: 'linear-gradient(135deg, #c9a55a, #e8d5a0, #c9a55a)' } },
      { type: 'text', content: 'Французская кухня в сердце Москвы', animation: 'fade-in-up', styles: { ...ds, fontSize: '18px', textColor: '#a89070', padding: '4px 16px 16px' } },
      { type: 'quote', content: 'Каждое блюдо — это история, рассказанная вкусом.|Шеф-повар Пьер Дюбуа', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px 32px', textColor: '#c9a55a' } },
      { type: 'divider', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'heading', content: 'Наше меню', anchorId: 'menu', animation: 'fade-in-left', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'gallery', content: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop', animation: 'fade-in-up', hoverEffect: 'hover-scale', styles: { ...ds, padding: '16px' } },
      { type: 'accordion', content: '🥣 Супы|Крем-суп из тыквы — 450₽ • Буйабес — 780₽ • Луковый суп — 390₽\n🥩 Горячее|Утиная грудка — 1200₽ • Стейк рибай — 2400₽ • Лосось на гриле — 1100₽\n🍰 Десерты|Крем-брюле — 380₽ • Тирамису — 420₽ • Фондан — 490₽', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#2a1f14', borderRadius: '12px', textColor: '#d4b896', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'form', content: 'Забронировать столик|Ваше имя|Телефон|Дата и время|Забронировать', anchorId: 'reserve', animation: 'fade-in-up', styles: { ...ds, backgroundColor: '#2a1f14', padding: '24px', borderRadius: '12px', textColor: '#d4b896', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'footer', content: '© 2026 La Maison|reservation@lamaison.ru|+7 (495) 123-45-67', animation: 'fade-in', styles: { ...ds, backgroundColor: '#12100c', padding: '24px', borderRadius: '0px', textColor: '#6b5e4f' } }
    ]
  },

  // ===== 7. СОБЫТИЕ — Тёмный + голубой акцент =====
  {
    id: 'event',
    name: 'Событие',
    description: 'Анонс мероприятия',
    icon: <CalendarDays className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Конференция|#hero\nПрограмма|#program\nСпикеры|#speakers\nБилеты|#tickets', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0c1222', padding: '16px 24px', borderRadius: '0px', textColor: '#64748b' } },
      { type: 'text', content: '📅 15 марта 2026 • Москва, Экспоцентр', animation: 'fade-in', styles: { ...ds, fontSize: '14px', textColor: '#38bdf8', padding: '32px 16px 8px' } },
      { type: 'heading', content: 'Frontend Conf 2026', anchorId: 'hero', animation: 'scale-bounce', styles: { ...ds, fontSize: '52px', padding: '8px 16px', gradientText: 'linear-gradient(135deg, #38bdf8, #818cf8)' } },
      { type: 'text', content: 'Главная конференция для фронтенд-разработчиков России', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#64748b', padding: '8px 16px 24px' } },
      { type: 'counter', content: '24|Спикера', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#131c33', borderRadius: '12px', textColor: '#38bdf8', boxShadow: '0 2px 15px rgba(56,189,248,0.1)' } },
      { type: 'counter', content: '1000+|Участников', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#131c33', borderRadius: '12px', textColor: '#38bdf8', boxShadow: '0 2px 15px rgba(56,189,248,0.1)' } },
      { type: 'counter', content: '8|Часов контента', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#131c33', borderRadius: '12px', textColor: '#38bdf8', boxShadow: '0 2px 15px rgba(56,189,248,0.1)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Программа', anchorId: 'program', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'accordion', content: '10:00 — Открытие и keynote|Дмитрий Абрамов — «Будущее фронтенда в 2026»\n11:30 — React Server Components|Практика и подводные камни\n13:00 — Перерыв и нетворкинг|Обед, общение, стенды партнёров\n14:30 — AI в разработке|Как GPT-5 меняет процесс кодирования\n16:00 — Воркшопы|3 параллельных практических занятия\n18:00 — After-party|Живая музыка и напитки', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#131c33', borderRadius: '12px', textColor: '#94a3b8', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Спикеры', anchorId: 'speakers', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'columns', content: '🎤 Дмитрий А.|Lead разработчик, Яндекс||🎤 Мария К.|Senior Frontend, VK||🎤 Алексей С.|CTO, Тинькофф||🎤 Ольга П.|DevRel, Google', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#131c33', borderRadius: '12px', textColor: '#94a3b8', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'button', content: 'Купить билет — от 5 000₽', anchorId: 'tickets', animation: 'scale-bounce', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '18px', padding: '16px' } },
      { type: 'footer', content: '© 2026 Frontend Conf|info@frontendconf.ru', animation: 'fade-in', styles: { ...ds, backgroundColor: '#080e1a', padding: '24px', borderRadius: '0px', textColor: '#374151' } }
    ]
  },

  // ===== 8. СТАРТАП — Чёрный + индиго акцент =====
  {
    id: 'startup',
    name: 'Стартап',
    description: 'Презентация с метриками',
    icon: <TrendingUp className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Главная|#hero\nМетрики|#metrics\nВозможности|#features\nОтзывы|#reviews', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0a0a12', padding: '16px 24px', borderRadius: '0px', textColor: '#6b7280' } },
      { type: 'heading', content: 'CloudSync', anchorId: 'hero', animation: 'fade-in-up', styles: { ...ds, fontSize: '52px', padding: '48px 16px 4px', gradientText: 'linear-gradient(135deg, #6366f1, #818cf8, #a5b4fc)' } },
      { type: 'text', content: 'Синхронизация данных нового поколения', animation: 'fade-in-up', styles: { ...ds, fontSize: '22px', textColor: '#6b7280', padding: '4px 16px 24px' } },
      { type: 'button', content: 'Начать бесплатно →', animation: 'scale-bounce', hoverEffect: 'hover-lift', buttonStyle: 'gradient', styles: { ...ds, fontSize: '18px', padding: '16px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '20px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop', animation: 'fade-in', hoverEffect: 'hover-scale', styles: { ...ds, padding: '16px 32px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(99,102,241,0.15)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '50K+|Пользователей', anchorId: 'metrics', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#12121f', borderRadius: '12px', textColor: '#818cf8' } },
      { type: 'counter', content: '99.9%|Uptime', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#12121f', borderRadius: '12px', textColor: '#818cf8' } },
      { type: 'counter', content: '3x|Быстрее аналогов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#12121f', borderRadius: '12px', textColor: '#818cf8' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Возможности', anchorId: 'features', animation: 'fade-in-left', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'icon-text', content: '🚀|Мгновенная синхронизация|Данные обновляются в реальном времени на всех устройствах', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#12121f', padding: '20px', borderRadius: '12px', textColor: '#a5b4fc', boxShadow: '0 2px 15px rgba(99,102,241,0.1)' } },
      { type: 'icon-text', content: '🔒|Шифрование E2E|Военный уровень защиты ваших данных', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#12121f', padding: '20px', borderRadius: '12px', textColor: '#a5b4fc', boxShadow: '0 2px 15px rgba(99,102,241,0.1)' } },
      { type: 'icon-text', content: '⚡|API & Интеграции|Подключайтесь к 200+ сервисам', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#12121f', padding: '20px', borderRadius: '12px', textColor: '#a5b4fc', boxShadow: '0 2px 15px rgba(99,102,241,0.1)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'quote', content: 'CloudSync изменил то, как наша команда работает с данными. Рекомендую всем!|Анна Петрова, CEO TechVentures', anchorId: 'reviews', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '24px 32px', textColor: '#818cf8' } },
      { type: 'footer', content: '© 2026 CloudSync|support@cloudsync.io|+7 (800) 123-45-67', animation: 'fade-in', styles: { ...ds, backgroundColor: '#07070f', padding: '24px', borderRadius: '0px', textColor: '#374151' } }
    ]
  },

  // ===== 9. ФИТНЕС — Тёмный + оранжевый акцент =====
  {
    id: 'fitness',
    name: 'Фитнес-клуб',
    description: 'Зал с расписанием и CTA',
    icon: <Dumbbell className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Главная|#hero\nРасписание|#schedule\nТренеры|#trainers\nЗапись|#cta', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0a0a0a', padding: '16px 24px', borderRadius: '0px', textColor: '#737373' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop', anchorId: 'hero', animation: 'fade-in', styles: { ...ds, padding: '0px', borderRadius: '0px' } },
      { type: 'heading', content: 'POWER GYM', animation: 'scale-bounce', styles: { ...ds, fontSize: '56px', padding: '32px 16px 8px', gradientText: 'linear-gradient(135deg, #f97316, #fb923c, #fdba74)' } },
      { type: 'text', content: 'Тренируйся с лучшими. Результат гарантирован.', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#737373', padding: '4px 16px 24px' } },
      { type: 'button', content: '🔥 Записаться на тренировку', animation: 'scale-in', hoverEffect: 'hover-lift', buttonStyle: 'gradient', styles: { ...ds, fontSize: '18px', padding: '16px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '500+|Клиентов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#1a1208', borderRadius: '12px', textColor: '#f97316' } },
      { type: 'counter', content: '20|Тренеров', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#1a1208', borderRadius: '12px', textColor: '#f97316' } },
      { type: 'counter', content: '15|Программ', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#1a1208', borderRadius: '12px', textColor: '#f97316' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Расписание', anchorId: 'schedule', animation: 'fade-in-left', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'tabs', content: 'Пн-Ср-Пт|🏋️ 10:00 — Силовая\n🥊 12:00 — Бокс\n💃 18:00 — Танцы\n🏃 20:00 — Кардио||Вт-Чт|🧘 9:00 — Йога\n🏋️ 11:00 — Кроссфит\n🥊 17:00 — Бокс\n💃 19:00 — Зумба||Сб-Вс|🧘 10:00 — Йога\n🏃 12:00 — Кардио\n🏋️ 14:00 — Открытая тренировка', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#141414', borderRadius: '12px', textColor: '#d4d4d4', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Наши тренеры', anchorId: 'trainers', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'columns', content: '💪 Дмитрий|Силовые тренировки, 10 лет||🧘 Ольга|Йога и растяжка, 8 лет||🥊 Артём|Бокс и кроссфит, 6 лет', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#141414', borderRadius: '12px', textColor: '#d4d4d4', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'button', content: 'Первая тренировка бесплатно', anchorId: 'cta', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '18px', padding: '16px' } },
      { type: 'footer', content: '© 2026 Power Gym|gym@powergym.ru|+7 (999) 888-77-66', animation: 'fade-in', styles: { ...ds, backgroundColor: '#050505', padding: '24px', borderRadius: '0px', textColor: '#525252' } }
    ]
  },

  // ===== 10. ОНЛАЙН-КУРС — Тёмный + бирюзовый =====
  {
    id: 'online-course',
    name: 'Онлайн-курс',
    description: 'Лендинг обучения',
    icon: <BookOpen className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Программа|#program\nОтзывы|#reviews\nЗаписаться|#cta', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0f1729', padding: '16px 24px', borderRadius: '0px', textColor: '#64748b' } },
      { type: 'text', content: '🎓 ОНЛАЙН-КУРС • СТАРТ 15 ЯНВАРЯ', animation: 'fade-in', styles: { ...ds, fontSize: '14px', textColor: '#06b6d4', padding: '32px 16px 8px' } },
      { type: 'heading', content: 'Веб-разработка с нуля до PRO', animation: 'fade-in-up', styles: { ...ds, fontSize: '48px', padding: '8px 16px', gradientText: 'linear-gradient(135deg, #06b6d4, #22d3ee, #67e8f9)' } },
      { type: 'text', content: 'За 3 месяца вы освоите HTML, CSS, JavaScript и React. Гарантия трудоустройства.', animation: 'fade-in-up', styles: { ...ds, fontSize: '18px', textColor: '#64748b', padding: '8px 32px 24px' } },
      { type: 'button', content: 'Начать обучение →', animation: 'scale-bounce', hoverEffect: 'hover-lift', buttonStyle: 'gradient', styles: { ...ds, fontSize: '18px', padding: '16px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '1200+|Выпускников', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#0c1f2e', borderRadius: '12px', textColor: '#06b6d4' } },
      { type: 'counter', content: '94%|Трудоустройство', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#0c1f2e', borderRadius: '12px', textColor: '#06b6d4' } },
      { type: 'counter', content: '4.9★|Средний рейтинг', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#0c1f2e', borderRadius: '12px', textColor: '#06b6d4' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Программа курса', anchorId: 'program', animation: 'fade-in-left', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'accordion', content: '📘 Модуль 1: HTML & CSS|Семантическая вёрстка, Flexbox, Grid, адаптивность, анимации — 3 недели\n⚡ Модуль 2: JavaScript|Переменные, функции, DOM, события, async/await, ES6+ — 4 недели\n⚛️ Модуль 3: React|Компоненты, хуки, роутинг, API-интеграция, TypeScript — 4 недели\n🚀 Модуль 4: Проект|Разработка полноценного приложения для портфолио — 2 недели', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#0c1f2e', borderRadius: '12px', textColor: '#94a3b8', boxShadow: '0 4px 20px rgba(6,182,212,0.1)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Отзывы', anchorId: 'reviews', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'quote', content: 'Через 4 месяца после окончания курса я нашёл работу Junior-разработчиком с зарплатой 120к.|Андрей С., выпускник', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px 32px', textColor: '#22d3ee' } },
      { type: 'quote', content: 'Лучший курс по фронтенду на русском языке. Всё чётко, по делу, с практикой.|Мария К., выпускница', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px 32px', textColor: '#22d3ee' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'button', content: 'Записаться — 29 900₽', anchorId: 'cta', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '20px', padding: '16px' } },
      { type: 'footer', content: '© 2026 WebSchool|info@webschool.ru', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0a1220', padding: '24px', borderRadius: '0px', textColor: '#374151' } }
    ]
  },

  // ===== 11. ФОТОГРАФ — Чистый чёрный + минимализм =====
  {
    id: 'photographer',
    name: 'Фотограф',
    description: 'Минималистичное портфолио',
    icon: <Camera className="w-5 h-5" />,
    blocks: [
      { type: 'heading', content: 'Анна Волкова', animation: 'blur-in', styles: { ...ds, fontSize: '48px', padding: '48px 16px 4px', textColor: '#ffffff' } },
      { type: 'text', content: 'Фотограф • Москва', animation: 'fade-in-up', styles: { ...ds, fontSize: '16px', textColor: '#525252', padding: '4px 16px 32px' } },
      { type: 'gallery', content: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=500&fit=crop\nhttps://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=500&fit=crop\nhttps://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=500&fit=crop\nhttps://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=500&fit=crop\nhttps://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=500&fit=crop\nhttps://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=500&fit=crop', animation: 'fade-in', hoverEffect: 'hover-brightness', styles: { ...ds, padding: '8px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '24px' } },
      { type: 'gallery', content: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400&h=500&fit=crop\nhttps://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=500&fit=crop\nhttps://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop', animation: 'fade-in', hoverEffect: 'hover-brightness', styles: { ...ds, padding: '8px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'quote', content: 'Фотография — это искусство замечать.|Эллиот Эрвитт', animation: 'fade-in-up', styles: { ...ds, padding: '24px 48px', textColor: '#404040' } },
      { type: 'socials', content: 'telegram|https://t.me/example\ninstagram|https://instagram.com/example', animation: 'fade-in', styles: { ...ds, padding: '12px' } },
      { type: 'button', content: 'Забронировать съёмку', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, padding: '16px' } }
    ]
  },

  // ===== 12. IT-АГЕНТСТВО — Тёмный + зелёный акцент =====
  {
    id: 'it-agency',
    name: 'IT-агентство',
    description: 'Технологичный лендинг',
    icon: <Code2 className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Услуги|#services\nКейсы|#cases\nМетрики|#metrics\nЗаявка|#contact', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0a0f1a', padding: '16px 24px', borderRadius: '0px', textColor: '#6b7280' } },
      { type: 'heading', content: '{ DevStudio }', animation: 'fade-in-up', styles: { ...ds, fontSize: '52px', padding: '48px 16px 4px', gradientText: 'linear-gradient(135deg, #10b981, #34d399, #6ee7b7)' } },
      { type: 'text', content: 'Полный цикл разработки: от идеи до продакшена', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#6b7280', padding: '4px 16px 24px' } },
      { type: 'button', content: 'Обсудить проект →', animation: 'scale-bounce', hoverEffect: 'hover-lift', buttonStyle: 'gradient', styles: { ...ds, fontSize: '18px', padding: '16px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '200+|Проектов', anchorId: 'metrics', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#0f1a15', borderRadius: '12px', textColor: '#10b981' } },
      { type: 'counter', content: '50+|Клиентов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#0f1a15', borderRadius: '12px', textColor: '#10b981' } },
      { type: 'counter', content: '8 лет|На рынке', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px', backgroundColor: '#0f1a15', borderRadius: '12px', textColor: '#10b981' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Наши услуги', anchorId: 'services', animation: 'fade-in-left', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'icon-text', content: '🎨|UI/UX Дизайн|Исследование, прототипирование, дизайн-системы', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#0f1a15', padding: '20px', borderRadius: '12px', textColor: '#a7f3d0', boxShadow: '0 2px 15px rgba(16,185,129,0.1)' } },
      { type: 'icon-text', content: '💻|Веб-разработка|React, TypeScript, Node.js, высоконагруженные системы', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#0f1a15', padding: '20px', borderRadius: '12px', textColor: '#a7f3d0', boxShadow: '0 2px 15px rgba(16,185,129,0.1)' } },
      { type: 'icon-text', content: '📱|Мобильные приложения|React Native, Flutter, нативная разработка', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#0f1a15', padding: '20px', borderRadius: '12px', textColor: '#a7f3d0', boxShadow: '0 2px 15px rgba(16,185,129,0.1)' } },
      { type: 'icon-text', content: '📈|SEO и маркетинг|Продвижение, аналитика, контекстная реклама', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#0f1a15', padding: '20px', borderRadius: '12px', textColor: '#a7f3d0', boxShadow: '0 2px 15px rgba(16,185,129,0.1)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Кейсы', anchorId: 'cases', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'columns', content: '🏦 Финтех|CRM для банка — рост конверсии на 40%||🛒 E-commerce|Маркетплейс — 50K заказов/мес||🏥 Медтех|Телемедицина — 100K пользователей', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#0f1a15', borderRadius: '12px', textColor: '#a7f3d0', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'form', content: 'Обсудить проект|Ваше имя|Email или телефон|Опишите задачу|Отправить заявку', anchorId: 'contact', animation: 'fade-in-up', styles: { ...ds, backgroundColor: '#0f1a15', padding: '24px', borderRadius: '12px', textColor: '#a7f3d0', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'footer', content: '© 2026 DevStudio|hello@devstudio.ru|+7 (495) 000-00-00', animation: 'fade-in', styles: { ...ds, backgroundColor: '#060b14', padding: '24px', borderRadius: '0px', textColor: '#374151' } }
    ]
  },

  // ===== 13. НЕДВИЖИМОСТЬ — Тёмно-серый + янтарный =====
  {
    id: 'real-estate',
    name: 'Недвижимость',
    description: 'Объект с галереей',
    icon: <Home className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Объект|#object\nГалерея|#gallery\nХарактеристики|#specs\nЗаявка|#form', animation: 'fade-in', styles: { ...ds, backgroundColor: '#111318', padding: '16px 24px', borderRadius: '0px', textColor: '#6b7280' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=400&fit=crop', anchorId: 'object', animation: 'fade-in', styles: { ...ds, padding: '0px', borderRadius: '0px' } },
      { type: 'heading', content: 'ЖК «Панорама»', animation: 'fade-in-up', styles: { ...ds, fontSize: '48px', padding: '32px 16px 8px', gradientText: 'linear-gradient(135deg, #f59e0b, #fbbf24, #fcd34d)' } },
      { type: 'text', content: 'Премиальные квартиры с видом на парк в центре Москвы', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#9ca3af', padding: '4px 16px 24px' } },
      { type: 'counter', content: 'от 8.5 млн ₽|Стоимость', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px', fontSize: '24px', textColor: '#f59e0b' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'gallery', content: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop\nhttps://images.unsplash.com/photo-1600566753086-00f18f6b0049?w=400&h=300&fit=crop', anchorId: 'gallery', animation: 'fade-in', hoverEffect: 'hover-scale', styles: { ...ds, padding: '16px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'heading', content: 'Характеристики', anchorId: 'specs', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'columns', content: '📐 от 45 м²|Площадь квартир||🏢 25 этажей|Монолитный каркас||🌳 Парк 5 га|В пешей доступности||🚗 Паркинг|2 уровня, подземный', animation: 'fade-in-up', styles: { ...ds, padding: '20px', backgroundColor: '#1a1c22', borderRadius: '12px', textColor: '#d4d4d8', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'icon-text', content: '🏗️|Срок сдачи: Q4 2026|Ход строительства — 78%', animation: 'fade-in-up', styles: { ...ds, backgroundColor: '#1a1c22', padding: '16px', borderRadius: '12px', textColor: '#fbbf24', boxShadow: '0 2px 15px rgba(245,158,11,0.1)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'form', content: 'Запишитесь на просмотр|Имя|Телефон|Удобное время для звонка|Записаться', anchorId: 'form', animation: 'fade-in-up', styles: { ...ds, backgroundColor: '#1a1c22', padding: '24px', borderRadius: '12px', textColor: '#d4d4d8', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'footer', content: '© 2026 ЖК Панорама|info@panorama.ru|+7 (495) 000-00-00', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0c0d10', padding: '24px', borderRadius: '0px', textColor: '#4b5563' } }
    ]
  },

  // ===== 14. СВАДЬБА — Тёмный розовый + нежные акценты =====
  {
    id: 'wedding',
    name: 'Свадьба',
    description: 'Приглашение с таймером',
    icon: <Heart className="w-5 h-5" />,
    blocks: [
      { type: 'text', content: '💍', animation: 'scale-bounce', styles: { ...ds, fontSize: '48px', padding: '48px 16px 0' } },
      { type: 'heading', content: 'Алексей & Мария', animation: 'blur-in', styles: { ...ds, fontSize: '52px', padding: '8px 16px', gradientText: 'linear-gradient(135deg, #f9a8d4, #fda4af, #fecdd3)' } },
      { type: 'text', content: '15 сентября 2026 • Москва', animation: 'fade-in-up', styles: { ...ds, fontSize: '18px', textColor: '#9d7ca0', padding: '4px 16px' } },
      { type: 'text', content: 'Мы приглашаем вас разделить с нами этот особенный день', animation: 'fade-in-up', styles: { ...ds, fontSize: '16px', textColor: '#7a6b7d', padding: '4px 32px 16px' } },
      { type: 'countdown', content: '2026-09-15T15:00:00|До свадьбы', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '24px', fontSize: '20px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop', animation: 'fade-in', hoverEffect: 'hover-scale', styles: { ...ds, padding: '16px 32px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(249,168,212,0.15)' } },
      { type: 'divider', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'heading', content: 'Программа дня', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'accordion', content: '15:00 — Церемония 💒|Ресторан «Усадьба», зал «Белый». Просим прибыть к 14:45\n16:00 — Фуршет 🥂|Встречаем гостей на открытой террасе с видом на сад\n17:00 — Банкет 🍽️|Праздничный ужин, тосты и первый танец\n21:00 — Вечерняя программа 🎶|Живая музыка, танцы и сюрпризы', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#261a22', borderRadius: '12px', textColor: '#d4a0b8', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'form', content: 'Подтвердите присутствие|Ваше имя|Количество гостей|Пожелания|Подтвердить ❤️|hide-message', animation: 'fade-in-up', styles: { ...ds, backgroundColor: '#261a22', padding: '24px', borderRadius: '12px', textColor: '#d4a0b8', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'text', content: 'С любовью, Алексей & Мария ❤️', animation: 'fade-in', styles: { ...ds, fontSize: '16px', textColor: '#9d7ca0', padding: '16px' } }
    ]
  },

  // ===== 15. SAAS / ТАРИФЫ — Тёмный + фиолетово-синий =====
  {
    id: 'saas-pricing',
    name: 'SaaS / Тарифы',
    description: 'Лендинг с ценами',
    icon: <CreditCard className="w-5 h-5" />,
    blocks: [
      { type: 'navbar', content: 'Главная|#hero\nФичи|#features\nТарифы|#pricing\nFAQ|#faq', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0b0f19', padding: '16px 24px', borderRadius: '0px', textColor: '#6b7280' } },
      { type: 'heading', content: 'TaskFlow', anchorId: 'hero', animation: 'fade-in-up', styles: { ...ds, fontSize: '52px', padding: '48px 16px 4px', gradientText: 'linear-gradient(135deg, #818cf8, #a78bfa, #c4b5fd)' } },
      { type: 'text', content: 'Управление задачами для продуктивных команд. Быстро, просто, эффективно.', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#6b7280', padding: '4px 32px 24px' } },
      { type: 'button', content: 'Попробовать бесплатно →', animation: 'scale-bounce', hoverEffect: 'hover-lift', buttonStyle: 'gradient', styles: { ...ds, fontSize: '18px', padding: '16px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '20px' } },
      { type: 'heading', content: 'Возможности', anchorId: 'features', animation: 'fade-in-left', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'icon-text', content: '📋|Канбан-доски|Визуальное управление задачами с drag & drop', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#111827', padding: '20px', borderRadius: '12px', textColor: '#c4b5fd', boxShadow: '0 2px 15px rgba(129,140,248,0.1)' } },
      { type: 'icon-text', content: '⏱️|Трекинг времени|Встроенный таймер для каждой задачи', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#111827', padding: '20px', borderRadius: '12px', textColor: '#c4b5fd', boxShadow: '0 2px 15px rgba(129,140,248,0.1)' } },
      { type: 'icon-text', content: '📊|Аналитика|Отчёты по продуктивности команды в реальном времени', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#111827', padding: '20px', borderRadius: '12px', textColor: '#c4b5fd', boxShadow: '0 2px 15px rgba(129,140,248,0.1)' } },
      { type: 'icon-text', content: '🔗|Интеграции|Slack, Notion, GitHub, Figma и 100+ сервисов', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#111827', padding: '20px', borderRadius: '12px', textColor: '#c4b5fd', boxShadow: '0 2px 15px rgba(129,140,248,0.1)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'heading', content: 'Тарифы', anchorId: 'pricing', animation: 'fade-in-left', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'tabs', content: 'Free|✅ 3 проекта\n✅ 5 пользователей\n✅ Базовая аналитика\n\n0₽/мес||Pro|✅ Безлимит проектов\n✅ 50 пользователей\n✅ Расширенная аналитика\n✅ Интеграции\n✅ Приоритетная поддержка\n\n990₽/мес||Enterprise|✅ Всё из Pro\n✅ SSO авторизация\n✅ SLA 99.9%\n✅ Персональный менеджер\n✅ Кастомные доработки\n\nПо запросу', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#111827', borderRadius: '12px', textColor: '#c4b5fd', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'heading', content: 'Частые вопросы', anchorId: 'faq', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'accordion', content: 'Есть ли бесплатный период?|Да, тариф Free доступен без ограничений по времени. Переходите на Pro когда будете готовы.\nМожно ли перейти на другой тариф?|Да, вы можете сменить тариф в любой момент. Разница будет пересчитана автоматически.\nКакие способы оплаты?|Банковские карты Visa/MC/МИР, безналичный расчёт для юрлиц, СБП.\nЕсть ли возврат денег?|Да, полный возврат в течение 14 дней после оплаты без вопросов.', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#111827', borderRadius: '12px', textColor: '#94a3b8', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '12px' } },
      { type: 'button', content: 'Начать бесплатно', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '18px', padding: '16px' } },
      { type: 'footer', content: '© 2026 TaskFlow|support@taskflow.io', animation: 'fade-in', styles: { ...ds, backgroundColor: '#070a12', padding: '24px', borderRadius: '0px', textColor: '#374151' } }
    ]
  }
];

export const BLOCK_EXAMPLES: BlockExample[] = [
  // === НАВИГАЦИЯ ===
  {
    id: 'navbar-example',
    name: 'Меню навигации',
    description: 'Стандартное',
    icon: <Menu className="w-4 h-4" />,
    blocks: [
      { type: 'navbar', content: 'Главная|#hero\nО нас|#about\nУслуги|#services\nПортфолио|#portfolio\nКонтакты|#contacts', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0e1015', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'navbar-example-2',
    name: 'Меню минимал',
    description: 'Минималистичное',
    icon: <Menu className="w-4 h-4" />,
    blocks: [
      { type: 'navbar', content: 'Главная|#home\nУслуги|#services\nКонтакт|#contact', animation: 'fade-in', styles: { ...ds, backgroundColor: 'transparent', padding: '12px 16px', borderRadius: '0px' } }
    ]
  },
  {
    id: 'navbar-example-3',
    name: 'Меню с логотипом',
    description: 'С названием бренда',
    icon: <Menu className="w-4 h-4" />,
    blocks: [
      { type: 'navbar', content: '✦ BRAND|#hero\nО нас|#about\nПроекты|#projects\nБлог|#blog\nСвязаться|#contact', animation: 'fade-in', styles: { ...ds, backgroundColor: '#111111', padding: '18px 28px', borderRadius: '0px' } }
    ]
  },
  // === ФУТЕР ===
  {
    id: 'footer-example',
    name: 'Футер стандарт',
    description: 'Подвал сайта',
    icon: <PanelBottom className="w-4 h-4" />,
    blocks: [
      { type: 'footer', content: '© 2026 Компания. Все права защищены.|hello@company.com|+7 (999) 123-45-67', animation: 'fade-in', styles: { ...ds, backgroundColor: '#111111', padding: '24px', borderRadius: '0px' } }
    ]
  },
  {
    id: 'footer-example-2',
    name: 'Футер расширенный',
    description: 'С соцсетями и меню',
    icon: <PanelBottom className="w-4 h-4" />,
    blocks: [
      { type: 'footer', content: '© 2026 Studio Pro. Дизайн и разработка.|info@studiopro.ru|+7 (800) 555-00-11', animation: 'fade-in', styles: { ...ds, backgroundColor: '#0a0a0a', padding: '32px', borderRadius: '0px' } },
      { type: 'socials' as const, content: 'telegram|https://t.me/example\ninstagram|https://instagram.com/example\nvk|https://vk.com/example', animation: 'fade-in', styles: { ...ds, padding: '8px' } }
    ]
  },
  {
    id: 'footer-example-3',
    name: 'Футер минимал',
    description: 'Только копирайт',
    icon: <PanelBottom className="w-4 h-4" />,
    blocks: [
      { type: 'footer', content: '© 2026 Brand', animation: 'fade-in', styles: { ...ds, backgroundColor: 'transparent', padding: '16px', borderRadius: '0px', fontSize: '12px' } }
    ]
  },
  // === КОЛОНКИ ===
  {
    id: 'three-steps',
    name: 'Колонки "3 шага"',
    description: 'Процесс из 3 шагов',
    icon: <Columns3 className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Как мы работаем', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'card', content: '01\nОбсуждение\nВыясняем ваши цели, задачи и пожелания', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'card', content: '02\nРазработка\nСоздаём дизайн и программируем решение', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'card', content: '03\nЗапуск\nТестируем, запускаем и обеспечиваем поддержку', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'three-steps-2',
    name: 'Колонки иконки',
    description: 'Преимущества с иконками',
    icon: <Columns3 className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Наши преимущества', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'card', content: '⚡\nБыстро\nРезультат за 7 дней', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } },
      { type: 'card', content: '🎯\nТочно\nПопадаем в цель с первого раза', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } },
      { type: 'card', content: '🛡️\nНадёжно\nГарантия 12 месяцев', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } }
    ]
  },
  {
    id: 'three-steps-3',
    name: 'Колонки карточки',
    description: 'Услуги в карточках',
    icon: <Columns3 className="w-4 h-4" />,
    blocks: [
      { type: 'card', content: '🎨 Дизайн\nСоздаём уникальный визуальный стиль для вашего бренда', animation: 'fade-in-left', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '28px', borderRadius: '16px', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'card', content: '💻 Разработка\nСовременные технологии и чистый код', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '28px', borderRadius: '16px', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'card', content: '📈 Продвижение\nSEO, реклама и аналитика для роста', animation: 'fade-in-right', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '28px', borderRadius: '16px', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  // === ГЕРОЙ-ЗАГОЛОВОК ===
  {
    id: 'hero-title',
    name: 'Герой классический',
    description: 'Заголовок + подпись',
    icon: <Type className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Создаём будущее', animation: 'scale-bounce', styles: { ...ds, fontSize: '56px', padding: '32px 16px 8px' } },
      { type: 'text', content: 'Инновационные решения для вашего бизнеса', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#888888', padding: '8px 16px' } }
    ]
  },
  {
    id: 'hero-title-2',
    name: 'Герой жирный',
    description: 'Большой акцентный',
    icon: <Type className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'ДЕЛАЕМ\nНЕВОЗМОЖНОЕ', animation: 'blur-in', styles: { ...ds, fontSize: '72px', padding: '48px 16px 12px' } },
      { type: 'text', content: 'Мы меняем правила игры', animation: 'fade-in-up', styles: { ...ds, fontSize: '18px', textColor: '#d4a855', padding: '4px 16px' } }
    ]
  },
  {
    id: 'hero-title-3',
    name: 'Герой градиент',
    description: 'С градиентным текстом',
    icon: <Type className="w-4 h-4" />,
    blocks: [
      { type: 'text', content: '— СТУДИЯ ДИЗАЙНА —', animation: 'fade-in', styles: { ...ds, fontSize: '12px', textColor: '#d4a855', padding: '24px 16px 8px' } },
      { type: 'heading', content: 'Цифровое искусство', animation: 'fade-in-up', styles: { ...ds, fontSize: '52px', padding: '4px 16px', gradientText: 'linear-gradient(135deg, #d4a855 0%, #ffffff 50%, #d4a855 100%)' } },
      { type: 'text', content: 'Превращаем идеи в визуальные шедевры', animation: 'fade-in-up', styles: { ...ds, fontSize: '18px', textColor: '#666666', padding: '8px 16px' } }
    ]
  },
  // === ПРЕИМУЩЕСТВА ===
  {
    id: 'features-list',
    name: 'Преимущества эмодзи',
    description: 'Список с эмодзи',
    icon: <ListChecks className="w-4 h-4" />,
    blocks: [
      { type: 'list', content: '✅ Быстрая загрузка страниц\n🎯 Адаптивный дизайн\n🔐 Защита данных\n💬 Поддержка 24/7\n📈 SEO оптимизация', animation: 'fade-in-up', styles: { ...ds, padding: '16px 32px', textAlign: 'left', backgroundColor: '#141418', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'features-list-2',
    name: 'Преимущества иконки',
    description: 'Карточки с описанием',
    icon: <ListChecks className="w-4 h-4" />,
    blocks: [
      { type: 'icon-text', content: '🚀|Скорость|Загрузка менее 1 секунды', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } },
      { type: 'icon-text', content: '🎨|Дизайн|Уникальный стиль под ваш бренд', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } },
      { type: 'icon-text', content: '📱|Адаптивность|Идеально на любом экране', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } }
    ]
  },
  {
    id: 'features-list-3',
    name: 'Преимущества числа',
    description: 'Нумерованный список',
    icon: <ListChecks className="w-4 h-4" />,
    blocks: [
      { type: 'list', content: '1. Анализ бизнеса и конкурентов\n2. Разработка стратегии продвижения\n3. Создание уникального контента\n4. Настройка рекламных кампаний\n5. Ежемесячная аналитика и отчёты', animation: 'fade-in-up', styles: { ...ds, padding: '16px 32px', textAlign: 'left', backgroundColor: '#141418', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  // === FAQ ===
  {
    id: 'faq-card',
    name: 'FAQ стоимость',
    description: 'Вопрос о цене',
    icon: <HelpCircle className="w-4 h-4" />,
    blocks: [
      { type: 'card', content: '❓ Сколько стоит разработка?\n\nСтоимость зависит от сложности проекта. Базовый лендинг — от 30 000₽, интернет-магазин — от 80 000₽. Точную стоимость рассчитаем после обсуждения задачи.', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '24px', textAlign: 'left', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'faq-card-2',
    name: 'FAQ сроки',
    description: 'Вопрос о сроках',
    icon: <HelpCircle className="w-4 h-4" />,
    blocks: [
      { type: 'card', content: '⏰ Сколько времени занимает разработка?\n\nЛендинг — 5-10 рабочих дней. Корпоративный сайт — 2-4 недели. Интернет-магазин — 4-8 недель. Точные сроки зависят от объёма задач.', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '24px', textAlign: 'left', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'faq-card-3',
    name: 'FAQ гарантии',
    description: 'Вопрос о гарантиях',
    icon: <HelpCircle className="w-4 h-4" />,
    blocks: [
      { type: 'card', content: '🛡️ Какие гарантии вы даёте?\n\nГарантия 12 месяцев на все работы. Бесплатное исправление багов. Техническая поддержка включена. Договор и полный пакет документов.', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '24px', textAlign: 'left', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  // === ВИДЕО ===
  {
    id: 'youtube-video',
    name: 'Видео стандарт',
    description: 'Встроенный плеер',
    icon: <Play className="w-4 h-4" />,
    blocks: [
      { type: 'video', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', animation: 'fade-in', styles: { ...ds, padding: '16px', borderRadius: '12px' } }
    ]
  },
  {
    id: 'youtube-video-2',
    name: 'Видео с заголовком',
    description: 'Заголовок + плеер',
    icon: <Play className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Смотрите видео', animation: 'fade-in-up', styles: { ...ds, fontSize: '28px', padding: '16px 16px 4px' } },
      { type: 'text', content: 'Узнайте больше о нашем продукте за 2 минуты', animation: 'fade-in', styles: { ...ds, fontSize: '14px', textColor: '#888888', padding: '4px 16px 12px' } },
      { type: 'video', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', animation: 'fade-in', styles: { ...ds, padding: '16px', borderRadius: '12px' } }
    ]
  },
  {
    id: 'youtube-video-3',
    name: 'Видео мини',
    description: 'Компактный плеер',
    icon: <Play className="w-4 h-4" />,
    blocks: [
      { type: 'video', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', animation: 'fade-in', styles: { ...ds, padding: '8px', borderRadius: '8px' } }
    ]
  },
  // === СТАТИСТИКА ===
  {
    id: 'stats-row',
    name: 'Статистика 3',
    description: '3 счётчика',
    icon: <BarChart3 className="w-4 h-4" />,
    blocks: [
      { type: 'counter', content: '150+|Клиентов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '98%|Довольных', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '5 лет|На рынке', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } }
    ]
  },
  {
    id: 'stats-row-2',
    name: 'Статистика 4',
    description: '4 счётчика в ряд',
    icon: <BarChart3 className="w-4 h-4" />,
    blocks: [
      { type: 'counter', content: '500+|Проектов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px' } },
      { type: 'counter', content: '120+|Клиентов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px' } },
      { type: 'counter', content: '15|Сотрудников', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px' } },
      { type: 'counter', content: '24/7|Поддержка', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px' } }
    ]
  },
  {
    id: 'stats-row-3',
    name: 'Статистика с заголовком',
    description: 'Заголовок + счётчики',
    icon: <BarChart3 className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Наши результаты', animation: 'fade-in-up', styles: { ...ds, fontSize: '28px', padding: '16px 16px 8px' } },
      { type: 'counter', content: '1 000+|Довольных клиентов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '99.5%|Успешных проектов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '10 лет|Опыта работы', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } }
    ]
  },
  // === ТАЙМЕР ===
  {
    id: 'promo-timer',
    name: 'Таймер классика',
    description: 'Обратный отсчёт',
    icon: <Zap className="w-4 h-4" />,
    blocks: [
      { type: 'text', content: '🔥 АКЦИЯ', animation: 'pulse', styles: { ...ds, fontSize: '14px', textColor: '#d4a855', padding: '16px 16px 4px' } },
      { type: 'heading', content: 'Скидка заканчивается', animation: 'scale-bounce', styles: { ...ds, fontSize: '36px', padding: '4px 16px' } },
      { type: 'counter', content: '23:59:59|До конца акции', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, fontSize: '24px', padding: '16px' } },
      { type: 'button', content: 'Успеть купить', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '18px', padding: '16px' } }
    ]
  },
  {
    id: 'promo-timer-2',
    name: 'Таймер агрессивный',
    description: 'Яркий и срочный',
    icon: <Zap className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: '⚠️ ПОСЛЕДНИЙ ШАНС', animation: 'pulse', styles: { ...ds, fontSize: '42px', textColor: '#ef4444', padding: '16px' } },
      { type: 'heading', content: '-70%', animation: 'scale-bounce', styles: { ...ds, fontSize: '80px', textColor: '#d4a855', padding: '8px 16px' } },
      { type: 'countdown', content: '2026-12-31T23:59:59|До конца распродажи', animation: 'blur-in', styles: { ...ds, padding: '16px' } },
      { type: 'button', content: 'ЗАБРАТЬ СКИДКУ', animation: 'scale-bounce', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '20px', padding: '16px' } }
    ]
  },
  {
    id: 'promo-timer-3',
    name: 'Таймер мягкий',
    description: 'Спокойный стиль',
    icon: <Zap className="w-4 h-4" />,
    blocks: [
      { type: 'text', content: 'Специальное предложение', animation: 'fade-in', styles: { ...ds, fontSize: '14px', textColor: '#888888', padding: '16px 16px 4px' } },
      { type: 'heading', content: 'Скидка 20% на первый заказ', animation: 'fade-in-up', styles: { ...ds, fontSize: '28px', padding: '4px 16px 12px' } },
      { type: 'countdown', content: '2026-06-30T23:59:59|Действует до', animation: 'fade-in', styles: { ...ds, padding: '12px' } },
      { type: 'button', content: 'Воспользоваться', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, padding: '16px' } }
    ]
  },
  // === ОТЗЫВ ===
  {
    id: 'testimonial',
    name: 'Отзыв короткий',
    description: 'Цитата с эффектом',
    icon: <MessageSquareQuote className="w-4 h-4" />,
    blocks: [
      { type: 'quote', content: 'Лучшая команда, с которой я работал. Результат превзошёл ожидания!|Мария К., CEO StartupX', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '24px 32px' } }
    ]
  },
  {
    id: 'testimonial-2',
    name: 'Отзыв развёрнутый',
    description: 'Подробный отзыв',
    icon: <MessageSquareQuote className="w-4 h-4" />,
    blocks: [
      { type: 'quote', content: 'Обратились за разработкой интернет-магазина. Ребята сделали всё качественно и в срок. Особенно порадовала адаптивная вёрстка и скорость загрузки. Рекомендую!|Андрей С., владелец магазина «ТехноМир»', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '24px 32px', backgroundColor: '#141418', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'testimonial-3',
    name: 'Отзыв с оценкой',
    description: 'Звёзды + цитата',
    icon: <MessageSquareQuote className="w-4 h-4" />,
    blocks: [
      { type: 'text', content: '⭐⭐⭐⭐⭐', animation: 'fade-in', styles: { ...ds, fontSize: '24px', padding: '16px 16px 4px' } },
      { type: 'quote', content: 'Сайт выглядит потрясающе! Заказы выросли на 40% после запуска.|Елена В., основатель бренда «Bloom»', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '8px 32px 24px' } }
    ]
  },
  // === ГАЛЕРЕЯ 2 ===
  {
    id: 'gallery-two',
    name: 'Галерея пейзажи',
    description: '2 изображения',
    icon: <Images className="w-4 h-4" />,
    blocks: [
      { type: 'image', content: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', animation: 'fade-in-left', hoverEffect: 'hover-lift', styles: { ...ds, padding: '8px', borderRadius: '12px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', animation: 'fade-in-right', hoverEffect: 'hover-lift', styles: { ...ds, padding: '8px', borderRadius: '12px' } }
    ]
  },
  {
    id: 'gallery-two-2',
    name: 'Галерея бизнес',
    description: '2 бизнес-фото',
    icon: <Images className="w-4 h-4" />,
    blocks: [
      { type: 'image', content: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop', animation: 'fade-in-left', hoverEffect: 'hover-lift', styles: { ...ds, padding: '8px', borderRadius: '12px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop', animation: 'fade-in-right', hoverEffect: 'hover-lift', styles: { ...ds, padding: '8px', borderRadius: '12px' } }
    ]
  },
  {
    id: 'gallery-two-3',
    name: 'Галерея архитектура',
    description: '2 фото зданий',
    icon: <Images className="w-4 h-4" />,
    blocks: [
      { type: 'image', content: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop', animation: 'fade-in-left', hoverEffect: 'hover-scale', styles: { ...ds, padding: '8px', borderRadius: '12px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&h=400&fit=crop', animation: 'fade-in-right', hoverEffect: 'hover-scale', styles: { ...ds, padding: '8px', borderRadius: '12px' } }
    ]
  },
  // === ГАЛЕРЕЯ 6 ===
  {
    id: 'gallery-six',
    name: 'Галерея природа',
    description: '6 фото природы',
    icon: <Images className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Галерея', animation: 'fade-in-up', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=300&fit=crop', animation: 'fade-in-left', hoverEffect: 'hover-scale', styles: { ...ds, padding: '4px', borderRadius: '8px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop', animation: 'fade-in-right', hoverEffect: 'hover-scale', styles: { ...ds, padding: '4px', borderRadius: '8px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=300&fit=crop', animation: 'fade-in-left', hoverEffect: 'hover-scale', styles: { ...ds, padding: '4px', borderRadius: '8px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop', animation: 'fade-in-right', hoverEffect: 'hover-scale', styles: { ...ds, padding: '4px', borderRadius: '8px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop', animation: 'fade-in-left', hoverEffect: 'hover-scale', styles: { ...ds, padding: '4px', borderRadius: '8px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop', animation: 'fade-in-right', hoverEffect: 'hover-scale', styles: { ...ds, padding: '4px', borderRadius: '8px' } }
    ]
  },
  {
    id: 'gallery-six-2',
    name: 'Галерея продукты',
    description: '6 фото продуктов',
    icon: <Images className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Наши продукты', animation: 'fade-in-up', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, padding: '4px', borderRadius: '8px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, padding: '4px', borderRadius: '8px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, padding: '4px', borderRadius: '8px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, padding: '4px', borderRadius: '8px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=300&fit=crop', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, padding: '4px', borderRadius: '8px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, padding: '4px', borderRadius: '8px' } }
    ]
  },
  {
    id: 'gallery-six-3',
    name: 'Галерея минимал',
    description: '6 фото без рамок',
    icon: <Images className="w-4 h-4" />,
    blocks: [
      { type: 'image', content: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop', animation: 'fade-in', styles: { ...ds, padding: '2px', borderRadius: '4px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&h=300&fit=crop', animation: 'fade-in', styles: { ...ds, padding: '2px', borderRadius: '4px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=300&fit=crop', animation: 'fade-in', styles: { ...ds, padding: '2px', borderRadius: '4px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop', animation: 'fade-in', styles: { ...ds, padding: '2px', borderRadius: '4px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=300&fit=crop', animation: 'fade-in', styles: { ...ds, padding: '2px', borderRadius: '4px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1579547621706-1a9c79d5c9f1?w=400&h=300&fit=crop', animation: 'fade-in', styles: { ...ds, padding: '2px', borderRadius: '4px' } }
    ]
  },
  // === CTA ===
  {
    id: 'cta-section',
    name: 'CTA стандарт',
    description: 'Заголовок + кнопка',
    icon: <MousePointerClick className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Готовы начать?', animation: 'fade-in-up', styles: { ...ds, fontSize: '36px', padding: '24px 16px 8px' } },
      { type: 'text', content: 'Оставьте заявку и мы свяжемся с вами в течение часа', animation: 'fade-in-up', styles: { ...ds, fontSize: '16px', textColor: '#888888', padding: '8px 16px 16px' } },
      { type: 'button', content: 'Оставить заявку', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '18px', padding: '16px' } }
    ]
  },
  {
    id: 'cta-section-2',
    name: 'CTA с иконкой',
    description: 'Эмодзи + призыв',
    icon: <MousePointerClick className="w-4 h-4" />,
    blocks: [
      { type: 'text', content: '🚀', animation: 'scale-bounce', styles: { ...ds, fontSize: '48px', padding: '24px 16px 8px' } },
      { type: 'heading', content: 'Запустите проект сегодня', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '4px 16px' } },
      { type: 'button', content: 'Начать сейчас', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '18px', padding: '16px' } }
    ]
  },
  {
    id: 'cta-section-3',
    name: 'CTA двойная кнопка',
    description: 'Две кнопки действий',
    icon: <MousePointerClick className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Выберите подходящий вариант', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '24px 16px 8px' } },
      { type: 'text', content: 'Бесплатная консультация или сразу к делу', animation: 'fade-in', styles: { ...ds, fontSize: '16px', textColor: '#888888', padding: '8px 16px 16px' } },
      { type: 'button', content: 'Получить консультацию', animation: 'fade-in-left', hoverEffect: 'hover-lift', styles: { ...ds, padding: '12px' } },
      { type: 'button', content: 'Заказать проект', animation: 'fade-in-right', hoverEffect: 'hover-lift', buttonStyle: 'outline', styles: { ...ds, padding: '12px' } }
    ]
  },
  // === ЦЕНОВАЯ КАРТОЧКА ===
  {
    id: 'pricing-card',
    name: 'Тариф Премиум',
    description: 'Премиум план',
    icon: <DollarSign className="w-4 h-4" />,
    blocks: [
      { type: 'card', content: '⭐ Премиум\n\n4 990₽ / мес\n\n✅ Безлимитные проекты\n✅ Приоритетная поддержка\n✅ Индивидуальный дизайн\n✅ SEO-оптимизация\n✅ Аналитика', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '32px 24px', textAlign: 'center', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', borderColor: 'rgba(212,168,85,0.3)' } },
      { type: 'button', content: 'Выбрать тариф', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, padding: '12px' } }
    ]
  },
  {
    id: 'pricing-card-2',
    name: 'Тариф Базовый',
    description: 'Стартовый план',
    icon: <DollarSign className="w-4 h-4" />,
    blocks: [
      { type: 'card', content: '🟢 Базовый\n\n990₽ / мес\n\n✅ 3 проекта\n✅ Базовая поддержка\n✅ Шаблонный дизайн\n❌ SEO\n❌ Аналитика', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '32px 24px', textAlign: 'center', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'button', content: 'Начать бесплатно', animation: 'scale-in', hoverEffect: 'hover-lift', buttonStyle: 'outline', styles: { ...ds, padding: '12px' } }
    ]
  },
  {
    id: 'pricing-card-3',
    name: 'Тариф Про',
    description: 'Профессиональный',
    icon: <DollarSign className="w-4 h-4" />,
    blocks: [
      { type: 'card', content: '🔥 Про\n\n2 490₽ / мес\n\n✅ 10 проектов\n✅ Приоритетная поддержка\n✅ Кастомный дизайн\n✅ SEO-оптимизация\n❌ Аналитика', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '32px 24px', textAlign: 'center', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } },
      { type: 'button', content: 'Выбрать Про', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, padding: '12px' } }
    ]
  },
  // === КОМАНДА ===
  {
    id: 'team-section',
    name: 'Команда 3 чел.',
    description: '3 члена команды',
    icon: <Users className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Наша команда', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'card', content: '👤 Алексей Иванов\nCEO & Основатель', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } },
      { type: 'card', content: '👤 Мария Петрова\nCTO & Архитектор', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } },
      { type: 'card', content: '👤 Дмитрий Козлов\nLead Designer', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } }
    ]
  },
  {
    id: 'team-section-2',
    name: 'Команда 2 чел.',
    description: 'Пара основателей',
    icon: <Users className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Основатели', animation: 'fade-in-up', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'card', content: '👨‍💻 Павел Морозов\nCEO — 10 лет в IT', animation: 'fade-in-left', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } },
      { type: 'card', content: '👩‍🎨 Ольга Белова\nArt Director — Дизайн с душой', animation: 'fade-in-right', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } }
    ]
  },
  {
    id: 'team-section-3',
    name: 'Команда описание',
    description: 'С развёрнутым описанием',
    icon: <Users className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Кто стоит за проектом', animation: 'fade-in-up', styles: { ...ds, fontSize: '28px', padding: '16px' } },
      { type: 'text', content: 'Мы — команда профессионалов с 15-летним опытом в разработке и дизайне. Каждый проект — это наша гордость.', animation: 'fade-in-up', styles: { ...ds, fontSize: '16px', textColor: '#888888', padding: '4px 24px 16px' } },
      { type: 'card', content: '👤 Иван Сидоров — Разработка\n👤 Анна Крылова — Дизайн\n👤 Сергей Попов — Маркетинг\n👤 Юлия Новак — Контент', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#141418', padding: '24px', borderRadius: '12px', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  // === ФОРМА ===
  {
    id: 'form-example',
    name: 'Форма полная',
    description: 'Имя + контакт + сообщение',
    icon: <FileText className="w-4 h-4" />,
    blocks: [
      { type: 'form' as const, content: 'Оставьте заявку|Имя|Телефон или Email|Сообщение|Отправить', animation: 'fade-in-up', styles: { ...ds, backgroundColor: '#141418', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'form-example-2',
    name: 'Форма минимал',
    description: 'Только email + кнопка',
    icon: <FileText className="w-4 h-4" />,
    blocks: [
      { type: 'form' as const, content: 'Подпишитесь на рассылку|Email|Подписаться', animation: 'fade-in-up', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'form-example-3',
    name: 'Форма звонок',
    description: 'Обратный звонок',
    icon: <FileText className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: '📞 Перезвоним за 30 секунд', animation: 'fade-in-up', styles: { ...ds, fontSize: '24px', padding: '16px 16px 8px' } },
      { type: 'form' as const, content: 'Закажите звонок|Ваше имя|Номер телефона|Позвоните мне', animation: 'fade-in-up', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  // === СОЦСЕТИ ===
  {
    id: 'socials-example',
    name: 'Соцсети 3 ссылки',
    description: 'Telegram, Insta, VK',
    icon: <Share2 className="w-4 h-4" />,
    blocks: [
      { type: 'socials' as const, content: 'telegram|https://t.me/example\ninstagram|https://instagram.com/example\nvk|https://vk.com/example', animation: 'fade-in-up', styles: { ...ds, padding: '16px' } }
    ]
  },
  {
    id: 'socials-example-2',
    name: 'Соцсети 5 ссылок',
    description: 'Все платформы',
    icon: <Share2 className="w-4 h-4" />,
    blocks: [
      { type: 'socials' as const, content: 'telegram|https://t.me/example\ninstagram|https://instagram.com/example\nvk|https://vk.com/example\nyoutube|https://youtube.com/example\ntiktok|https://tiktok.com/@example', animation: 'fade-in-up', styles: { ...ds, padding: '16px' } }
    ]
  },
  {
    id: 'socials-example-3',
    name: 'Соцсети с заголовком',
    description: 'Заголовок + иконки',
    icon: <Share2 className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Мы в соцсетях', animation: 'fade-in-up', styles: { ...ds, fontSize: '24px', padding: '16px 16px 8px' } },
      { type: 'text', content: 'Подписывайтесь, чтобы быть в курсе новостей', animation: 'fade-in', styles: { ...ds, fontSize: '14px', textColor: '#888888', padding: '4px 16px 12px' } },
      { type: 'socials' as const, content: 'telegram|https://t.me/example\ninstagram|https://instagram.com/example\nvk|https://vk.com/example', animation: 'fade-in-up', styles: { ...ds, padding: '8px' } }
    ]
  },
  // === НОВЫЕ: АККОРДЕОН, ТАБЫ, КОМАНДА, КАК ЭТО РАБОТАЕТ ===
  {
    id: 'faq-accordion',
    name: 'FAQ аккордеон',
    description: 'Вопросы-ответы',
    icon: <HelpCircle className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Часто задаваемые вопросы', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'accordion', content: 'Как оформить заказ?|Выберите услугу, заполните форму и мы свяжемся с вами в течение часа\nСколько стоит?|Стоимость зависит от объёма задач. Базовый пакет — от 30 000₽\nКакие сроки выполнения?|Средний срок — 2-4 недели в зависимости от сложности\nЕсть ли гарантия?|Да, мы предоставляем гарантию 12 месяцев на все работы\nКак происходит оплата?|50% предоплата, 50% после сдачи проекта', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#141418', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'tabs-content',
    name: 'Табы с контентом',
    description: 'Переключаемые вкладки',
    icon: <Layers className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Наши услуги', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'tabs', content: 'Дизайн|🎨 UI/UX дизайн, прототипирование, фирменный стиль и брендинг. Создаём уникальные визуальные решения.||Разработка|💻 Фронтенд и бэкенд разработка. React, TypeScript, Node.js. Современный стек технологий.||Маркетинг|📈 SEO продвижение, контекстная реклама, аналитика. Привлекаем целевых клиентов.', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#141418', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'team-cards',
    name: 'Карточки команды',
    description: 'Фото + имена',
    icon: <Users className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Наша команда', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'columns', content: '👨‍💻 Алексей|CEO & Founder||👩‍🎨 Мария|Lead Designer||🧑‍💻 Дмитрий|Senior Developer', animation: 'fade-in-up', styles: { ...ds, padding: '16px', backgroundColor: '#141418', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' } }
    ]
  },
  {
    id: 'how-it-works',
    name: 'Как это работает',
    description: '3 шага с иконками',
    icon: <Zap className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Как это работает', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'icon-text', content: '1️⃣|Оставьте заявку|Заполните форму или напишите нам в мессенджер', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } },
      { type: 'icon-text', content: '2️⃣|Обсуждаем детали|Созвон, ТЗ, утверждение макетов и сроков', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } },
      { type: 'icon-text', content: '3️⃣|Получаете результат|Готовый проект с документацией и поддержкой', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#141418', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 15px rgba(0,0,0,0.2)' } }
    ]
  }
];

type SubGroup = { name: string; ids: string[] };
const BLOCK_EXAMPLE_CATEGORIES: { name: string; icon: React.ReactNode; groups: SubGroup[] }[] = [
  {
    name: 'Структура сайта',
    icon: <LayoutList className="w-4 h-4" />,
    groups: [
      { name: 'Меню навигации', ids: ['navbar-example', 'navbar-example-2', 'navbar-example-3'] },
      { name: 'Футер', ids: ['footer-example', 'footer-example-2', 'footer-example-3'] },
      { name: 'Колонки "3 шага"', ids: ['three-steps', 'three-steps-2', 'three-steps-3'] },
    ]
  },
  {
    name: 'Контент',
    icon: <Type className="w-4 h-4" />,
    groups: [
      { name: 'Герой-заголовок', ids: ['hero-title', 'hero-title-2', 'hero-title-3'] },
      { name: 'Преимущества', ids: ['features-list', 'features-list-2', 'features-list-3'] },
      { name: 'FAQ карточка', ids: ['faq-card', 'faq-card-2', 'faq-card-3'] },
      { name: 'YouTube видео', ids: ['youtube-video', 'youtube-video-2', 'youtube-video-3'] },
    ]
  },
  {
    name: 'Статистика и акции',
    icon: <BarChart3 className="w-4 h-4" />,
    groups: [
      { name: 'Статистика', ids: ['stats-row', 'stats-row-2', 'stats-row-3'] },
      { name: 'Таймер акции', ids: ['promo-timer', 'promo-timer-2', 'promo-timer-3'] },
      { name: 'Отзыв клиента', ids: ['testimonial', 'testimonial-2', 'testimonial-3'] },
    ]
  },
  {
    name: 'Визуал и галереи',
    icon: <Images className="w-4 h-4" />,
    groups: [
      { name: 'Галерея 2 фото', ids: ['gallery-two', 'gallery-two-2', 'gallery-two-3'] },
      { name: 'Галерея 6 фото', ids: ['gallery-six', 'gallery-six-2', 'gallery-six-3'] },
      { name: 'CTA секция', ids: ['cta-section', 'cta-section-2', 'cta-section-3'] },
    ]
  },
  {
    name: 'Бизнес',
    icon: <DollarSign className="w-4 h-4" />,
    groups: [
      { name: 'Ценовая карточка', ids: ['pricing-card', 'pricing-card-2', 'pricing-card-3'] },
      { name: 'Команда', ids: ['team-section', 'team-section-2', 'team-section-3'] },
      { name: 'Форма заявки', ids: ['form-example', 'form-example-2', 'form-example-3'] },
      { name: 'Соцсети', ids: ['socials-example', 'socials-example-2', 'socials-example-3'] },
    ]
  },
  {
    name: 'Новые блоки',
    icon: <Sparkles className="w-4 h-4" />,
    groups: [
      { name: 'FAQ аккордеон', ids: ['faq-accordion'] },
      { name: 'Табы с контентом', ids: ['tabs-content'] },
      { name: 'Карточки команды', ids: ['team-cards'] },
      { name: 'Как это работает', ids: ['how-it-works'] },
    ]
  }
];

/* Separate components for page templates and block examples */

interface PageTemplatesListProps {
  onSelectTemplate: (blocks: Omit<PlaygroundBlock, 'id'>[]) => void;
}

export const PageTemplatesList = ({ onSelectTemplate }: PageTemplatesListProps) => (
  <div className="grid grid-cols-2 gap-2">
    {PAGE_TEMPLATES.map((template, index) => (
      <motion.div
        key={template.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
      >
        <Button
          variant="outline"
          className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1 hover:border-primary/50 hover:bg-primary/5"
          onClick={() => onSelectTemplate(template.blocks)}
        >
          <span className="text-primary">{template.icon}</span>
          <span className="text-xs font-medium">{template.name}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            {template.description}
          </span>
        </Button>
      </motion.div>
    ))}
  </div>
);

interface BlockExamplesListProps {
  onAddBlocks: (blocks: Omit<PlaygroundBlock, 'id'>[]) => void;
}

const examplesMap = new Map(BLOCK_EXAMPLES.map(e => [e.id, e]));

export const BlockExamplesList = ({ onAddBlocks }: BlockExamplesListProps) => (
  <Accordion type="multiple" className="space-y-0">
    {BLOCK_EXAMPLE_CATEGORIES.map((cat) => (
      <AccordionItem key={cat.name} value={cat.name} className="border-b-0">
        <AccordionTrigger className="py-2 px-1 text-xs font-medium hover:no-underline gap-2 [&[data-state=open]>svg]:rotate-180">
          <span className="flex items-center gap-2">
            <span className="text-primary">{cat.icon}</span>
            {cat.name}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-2 pt-0">
          <Accordion type="multiple" className="space-y-0 pl-2">
            {cat.groups.map((group) => (
              <AccordionItem key={group.name} value={group.name} className="border-b-0">
                <AccordionTrigger className="py-1.5 px-1 text-[11px] font-medium hover:no-underline gap-2 text-muted-foreground hover:text-foreground [&[data-state=open]>svg]:rotate-180">
                  {group.name}
                </AccordionTrigger>
                <AccordionContent className="pb-1.5 pt-0">
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.ids.map((id) => {
                      const example = examplesMap.get(id);
                      if (!example) return null;
                      return (
                        <Button
                          key={example.id}
                          variant="outline"
                          className="w-full h-auto py-2 px-2 flex flex-col items-center gap-0.5 hover:border-primary/50 hover:bg-primary/5"
                          onClick={() => onAddBlocks(example.blocks)}
                        >
                          <span className="text-primary">{example.icon}</span>
                          <span className="text-[11px] font-medium">{example.name}</span>
                          <span className="text-[9px] text-muted-foreground leading-tight">
                            {example.description}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

/* Legacy combined component for backward compatibility */
interface ProjectTemplatesProps {
  onSelectTemplate: (blocks: Omit<PlaygroundBlock, 'id'>[]) => void;
  onAddBlocks?: (blocks: Omit<PlaygroundBlock, 'id'>[]) => void;
}

export const ProjectTemplates = ({ onSelectTemplate, onAddBlocks }: ProjectTemplatesProps) => {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Начать с шаблона</h3>
        <PageTemplatesList onSelectTemplate={onSelectTemplate} />
      </div>
      {onAddBlocks && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Готовые примеры</h3>
          <BlockExamplesList onAddBlocks={onAddBlocks} />
        </div>
      )}
    </div>
  );
};
