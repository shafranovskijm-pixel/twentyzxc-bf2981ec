import { motion } from "framer-motion";
import { Briefcase, Rocket, Image, Sparkles, GraduationCap, UtensilsCrossed, CalendarDays, TrendingUp, BarChart3, MessageSquareQuote, ListChecks, HelpCircle, Play, Type, MousePointerClick, Images, Menu, PanelBottom } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaygroundBlock, BlockStyles } from "@/data/playground-effects";

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
  {
    id: 'business-card',
    name: 'Визитка',
    description: 'Личная страница с контактами',
    icon: <Briefcase className="w-5 h-5" />,
    blocks: [
      { type: 'heading', content: 'Иван Иванов', animation: 'fade-in-up', styles: { ...ds, fontSize: '48px', padding: '32px 16px 8px' } },
      { type: 'text', content: 'Веб-разработчик & Дизайнер', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, fontSize: '20px', textColor: '#d4a855', padding: '8px 16px' } },
      { type: 'divider', content: '', animation: 'fade-in', styles: { ...ds, padding: '24px 16px' } },
      { type: 'text', content: 'Создаю современные веб-сайты и приложения с фокусом на пользовательский опыт и производительность.', animation: 'fade-in-up', styles: { ...ds, fontSize: '16px', textColor: '#888888', padding: '8px 48px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'button', content: 'Связаться', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, padding: '16px' } }
    ]
  },
  {
    id: 'landing',
    name: 'Лендинг',
    description: 'Продающая страница продукта',
    icon: <Rocket className="w-5 h-5" />,
    blocks: [
      { type: 'heading', content: 'Ваш идеальный продукт', animation: 'fade-in-up', styles: { ...ds, fontSize: '56px', padding: '48px 16px 16px' } },
      { type: 'text', content: 'Инновационное решение для современного бизнеса', animation: 'fade-in-up', styles: { ...ds, fontSize: '24px', textColor: '#888888', padding: '8px 16px 24px' } },
      { type: 'button', content: 'Попробовать бесплатно', animation: 'scale-bounce', hoverEffect: 'hover-lift', styles: { ...ds, padding: '16px', fontSize: '18px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '32px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop', animation: 'fade-in', hoverEffect: 'hover-scale', styles: { ...ds, padding: '16px', borderRadius: '16px' } },
      { type: 'divider', content: '', styles: { ...ds, padding: '32px 16px' } },
      { type: 'heading', content: 'Почему выбирают нас', animation: 'fade-in-up', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'card', content: '✨ Быстрый старт за 5 минут\n🔒 Безопасность данных\n📱 Работает на любых устройствах', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#1a1a1a', padding: '24px', textAlign: 'left' } }
    ]
  },
  {
    id: 'portfolio',
    name: 'Портфолио',
    description: 'Галерея работ с анимациями',
    icon: <Image className="w-5 h-5" />,
    blocks: [
      { type: 'heading', content: 'Мои работы', animation: 'fade-in-up', styles: { ...ds, fontSize: '48px', padding: '32px 16px 8px' } },
      { type: 'text', content: 'Избранные проекты и кейсы', animation: 'fade-in', styles: { ...ds, fontSize: '18px', textColor: '#888888', padding: '8px 16px 32px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', animation: 'fade-in-left', hoverEffect: 'hover-lift', styles: { ...ds, padding: '8px', borderRadius: '12px' } },
      { type: 'card', content: 'Корпоративный сайт\nРедизайн и разработка', animation: 'fade-in-right', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#1a1a1a', padding: '16px', textAlign: 'left' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', animation: 'fade-in-left', hoverEffect: 'hover-lift', styles: { ...ds, padding: '8px', borderRadius: '12px' } },
      { type: 'card', content: 'E-commerce платформа\nМагазин с интеграцией оплаты', animation: 'fade-in-right', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#1a1a1a', padding: '16px', textAlign: 'left' } }
    ]
  },
  {
    id: 'promo',
    name: 'Промо',
    description: 'Яркий акцент на событии',
    icon: <Sparkles className="w-5 h-5" />,
    blocks: [
      { type: 'text', content: '🎉 СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ', animation: 'pulse', styles: { ...ds, fontSize: '14px', textColor: '#d4a855', padding: '24px 16px 8px' } },
      { type: 'heading', content: 'Чёрная пятница', animation: 'scale-bounce', styles: { ...ds, fontSize: '64px', padding: '8px 16px' } },
      { type: 'heading', content: '-50%', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, fontSize: '96px', textColor: '#d4a855', padding: '8px 16px' } },
      { type: 'text', content: 'на все услуги до 30 ноября', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#888888', padding: '8px 16px 32px' } },
      { type: 'button', content: 'Получить скидку', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '20px', padding: '16px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '24px' } },
      { type: 'text', content: 'Осталось: 127 мест', animation: 'fade-in', styles: { ...ds, fontSize: '14px', textColor: '#666666', padding: '8px 16px' } }
    ]
  },
  // --- New templates ---
  {
    id: 'resume',
    name: 'Резюме',
    description: 'Страница-резюме с навыками',
    icon: <GraduationCap className="w-5 h-5" />,
    blocks: [
      { type: 'heading', content: 'Алексей Смирнов', animation: 'fade-in-up', styles: { ...ds, fontSize: '44px', padding: '32px 16px 4px' } },
      { type: 'text', content: 'Full-stack разработчик • 5 лет опыта', animation: 'fade-in-up', styles: { ...ds, fontSize: '18px', textColor: '#d4a855', padding: '4px 16px 16px' } },
      { type: 'divider', content: '', animation: 'fade-in', styles: { ...ds, padding: '16px' } },
      { type: 'quote', content: 'Пишу код, который легко читать и приятно поддерживать.|Жизненное кредо', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px 32px' } },
      { type: 'heading', content: 'Навыки', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '24px 16px 8px' } },
      { type: 'list', content: '⚛️ React, TypeScript, Next.js\n🎨 Tailwind CSS, Figma\n🗄️ PostgreSQL, Supabase\n☁️ Docker, CI/CD, AWS', animation: 'fade-in-up', styles: { ...ds, padding: '8px 32px', textAlign: 'left' } },
      { type: 'heading', content: 'Опыт', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '24px 16px 8px' } },
      { type: 'counter', content: '12|Завершённых проектов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '5|Лет в разработке', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'button', content: 'Скачать PDF', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, padding: '16px' } }
    ]
  },
  {
    id: 'restaurant',
    name: 'Ресторан',
    description: 'Меню и атмосфера заведения',
    icon: <UtensilsCrossed className="w-5 h-5" />,
    blocks: [
      { type: 'heading', content: 'La Maison', animation: 'blur-in', styles: { ...ds, fontSize: '52px', padding: '32px 16px 4px' } },
      { type: 'text', content: 'Французская кухня в сердце Москвы', animation: 'fade-in-up', styles: { ...ds, fontSize: '18px', textColor: '#888888', padding: '4px 16px 16px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop', animation: 'fade-in', hoverEffect: 'hover-scale', styles: { ...ds, padding: '16px', borderRadius: '16px' } },
      { type: 'quote', content: 'Каждое блюдо — это история, рассказанная вкусом.|Шеф-повар Пьер', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '24px 32px' } },
      { type: 'divider', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'heading', content: '🍽️ Меню', animation: 'fade-in-left', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'list', content: 'Крем-суп из тыквы — 450₽\nУтиная грудка с соусом — 1200₽\nТартар из лосося — 890₽\nКрем-брюле — 380₽', animation: 'fade-in-up', styles: { ...ds, padding: '8px 32px', textAlign: 'left', backgroundColor: '#1a1a1a', borderRadius: '12px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '16px' } },
      { type: 'button', content: 'Забронировать столик', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '18px', padding: '16px' } }
    ]
  },
  {
    id: 'event',
    name: 'Событие',
    description: 'Анонс мероприятия',
    icon: <CalendarDays className="w-5 h-5" />,
    blocks: [
      { type: 'text', content: '📅 15 марта 2026 • Москва', animation: 'fade-in', styles: { ...ds, fontSize: '14px', textColor: '#d4a855', padding: '24px 16px 8px' } },
      { type: 'heading', content: 'Frontend Conf', animation: 'scale-bounce', styles: { ...ds, fontSize: '56px', padding: '8px 16px' } },
      { type: 'text', content: 'Главная конференция для фронтенд-разработчиков', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#888888', padding: '8px 16px 24px' } },
      { type: 'counter', content: '24|Спикера', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px' } },
      { type: 'counter', content: '1000+|Участников', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px' } },
      { type: 'counter', content: '8|Часов контента', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px' } },
      { type: 'divider', content: '', styles: { ...ds, padding: '24px 16px' } },
      { type: 'heading', content: 'Программа', animation: 'fade-in-left', styles: { ...ds, fontSize: '28px', padding: '8px 16px' } },
      { type: 'list', content: '10:00 — Открытие и keynote\n11:00 — React Server Components\n13:00 — Перерыв и нетворкинг\n14:00 — Воркшопы\n17:00 — After-party', animation: 'fade-in-up', styles: { ...ds, padding: '8px 32px', textAlign: 'left' } },
      { type: 'video', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', animation: 'fade-in', styles: { ...ds, padding: '16px', borderRadius: '12px' } },
      { type: 'button', content: 'Купить билет', animation: 'scale-bounce', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '20px', padding: '16px' } }
    ]
  },
  {
    id: 'startup',
    name: 'Стартап',
    description: 'Презентация с метриками',
    icon: <TrendingUp className="w-5 h-5" />,
    blocks: [
      { type: 'heading', content: 'CloudSync', animation: 'fade-in-up', styles: { ...ds, fontSize: '52px', padding: '32px 16px 4px' } },
      { type: 'text', content: 'Синхронизация данных нового поколения', animation: 'fade-in-up', styles: { ...ds, fontSize: '22px', textColor: '#888888', padding: '4px 16px 24px' } },
      { type: 'button', content: 'Начать бесплатно', animation: 'scale-bounce', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '18px', padding: '16px' } },
      { type: 'spacer', content: '', styles: { ...ds, padding: '24px' } },
      { type: 'counter', content: '50K+|Пользователей', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px' } },
      { type: 'counter', content: '99.9%|Uptime', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px' } },
      { type: 'counter', content: '3x|Быстрее аналогов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '12px' } },
      { type: 'divider', content: '', styles: { ...ds, padding: '24px 16px' } },
      { type: 'heading', content: 'Возможности', animation: 'fade-in-left', styles: { ...ds, fontSize: '32px', padding: '16px' } },
      { type: 'card', content: '🚀 Мгновенная синхронизация\nДанные обновляются в реальном времени на всех устройствах', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#1a1a1a', padding: '24px', textAlign: 'left', borderRadius: '12px' } },
      { type: 'card', content: '🔒 Шифрование E2E\nВаши данные защищены военным уровнем шифрования', animation: 'fade-in-up', hoverEffect: 'hover-lift', styles: { ...ds, backgroundColor: '#1a1a1a', padding: '24px', textAlign: 'left', borderRadius: '12px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop', animation: 'fade-in', hoverEffect: 'hover-scale', styles: { ...ds, padding: '16px', borderRadius: '16px' } },
      { type: 'quote', content: 'CloudSync изменил то, как наша команда работает с данными.|CEO TechVentures', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '24px 32px' } }
    ]
  }
];

export const BLOCK_EXAMPLES: BlockExample[] = [
  {
    id: 'navbar-example',
    name: 'Меню навигации',
    description: 'Шапка с пунктами',
    icon: <Menu className="w-4 h-4" />,
    blocks: [
      { type: 'navbar', content: 'Главная\nО нас\nУслуги\nПортфолио\nКонтакты', animation: 'fade-in', styles: { ...ds, backgroundColor: '#1a1a1a', padding: '16px 24px', borderRadius: '12px' } }
    ]
  },
  {
    id: 'footer-example',
    name: 'Футер',
    description: 'Подвал сайта',
    icon: <PanelBottom className="w-4 h-4" />,
    blocks: [
      { type: 'footer', content: '© 2026 Компания. Все права защищены.|hello@company.com|+7 (999) 123-45-67', animation: 'fade-in', styles: { ...ds, backgroundColor: '#111111', padding: '24px', borderRadius: '0px' } }
    ]
  },
  {
    id: 'stats-row',
    name: 'Статистика',
    description: '3 счётчика',
    icon: <BarChart3 className="w-4 h-4" />,
    blocks: [
      { type: 'counter', content: '150+|Клиентов', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '98%|Довольных', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } },
      { type: 'counter', content: '5 лет|На рынке', animation: 'blur-in', hoverEffect: 'hover-glow', styles: { ...ds, padding: '16px' } }
    ]
  },
  {
    id: 'testimonial',
    name: 'Отзыв клиента',
    description: 'Цитата с эффектом',
    icon: <MessageSquareQuote className="w-4 h-4" />,
    blocks: [
      { type: 'quote', content: 'Лучшая команда, с которой я работал. Результат превзошёл ожидания!|Мария К., CEO StartupX', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, padding: '24px 32px' } }
    ]
  },
  {
    id: 'features-list',
    name: 'Преимущества',
    description: 'Список с эмодзи',
    icon: <ListChecks className="w-4 h-4" />,
    blocks: [
      { type: 'list', content: '✅ Быстрая загрузка страниц\n🎯 Адаптивный дизайн\n🔐 Защита данных\n💬 Поддержка 24/7\n📈 SEO оптимизация', animation: 'fade-in-up', styles: { ...ds, padding: '16px 32px', textAlign: 'left', backgroundColor: '#1a1a1a', borderRadius: '12px' } }
    ]
  },
  {
    id: 'faq-card',
    name: 'FAQ карточка',
    description: 'Вопрос и ответ',
    icon: <HelpCircle className="w-4 h-4" />,
    blocks: [
      { type: 'card', content: '❓ Сколько стоит разработка?\n\nСтоимость зависит от сложности проекта. Базовый лендинг — от 30 000₽, интернет-магазин — от 80 000₽. Точную стоимость рассчитаем после обсуждения задачи.', animation: 'fade-in-up', hoverEffect: 'hover-glow', styles: { ...ds, backgroundColor: '#1a1a1a', padding: '24px', textAlign: 'left', borderRadius: '12px' } }
    ]
  },
  {
    id: 'youtube-video',
    name: 'YouTube видео',
    description: 'Встроенный плеер',
    icon: <Play className="w-4 h-4" />,
    blocks: [
      { type: 'video', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', animation: 'fade-in', styles: { ...ds, padding: '16px', borderRadius: '12px' } }
    ]
  },
  {
    id: 'hero-title',
    name: 'Герой-заголовок',
    description: 'Заголовок + подпись',
    icon: <Type className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Создаём будущее', animation: 'scale-bounce', styles: { ...ds, fontSize: '56px', padding: '32px 16px 8px' } },
      { type: 'text', content: 'Инновационные решения для вашего бизнеса', animation: 'fade-in-up', styles: { ...ds, fontSize: '20px', textColor: '#888888', padding: '8px 16px' } }
    ]
  },
  {
    id: 'cta-section',
    name: 'CTA секция',
    description: 'Заголовок + текст + кнопка',
    icon: <MousePointerClick className="w-4 h-4" />,
    blocks: [
      { type: 'heading', content: 'Готовы начать?', animation: 'fade-in-up', styles: { ...ds, fontSize: '36px', padding: '24px 16px 8px' } },
      { type: 'text', content: 'Оставьте заявку и мы свяжемся с вами в течение часа', animation: 'fade-in-up', styles: { ...ds, fontSize: '16px', textColor: '#888888', padding: '8px 16px 16px' } },
      { type: 'button', content: 'Оставить заявку', animation: 'scale-in', hoverEffect: 'hover-lift', styles: { ...ds, fontSize: '18px', padding: '16px' } }
    ]
  },
  {
    id: 'gallery-two',
    name: 'Галерея',
    description: '2 изображения',
    icon: <Images className="w-4 h-4" />,
    blocks: [
      { type: 'image', content: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', animation: 'fade-in-left', hoverEffect: 'hover-lift', styles: { ...ds, padding: '8px', borderRadius: '12px' } },
      { type: 'image', content: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', animation: 'fade-in-right', hoverEffect: 'hover-lift', styles: { ...ds, padding: '8px', borderRadius: '12px' } }
    ]
  }
];

interface ProjectTemplatesProps {
  onSelectTemplate: (blocks: Omit<PlaygroundBlock, 'id'>[]) => void;
  onAddBlocks?: (blocks: Omit<PlaygroundBlock, 'id'>[]) => void;
}

export const ProjectTemplates = ({ onSelectTemplate, onAddBlocks }: ProjectTemplatesProps) => {
  return (
    <div className="space-y-5">
      {/* Templates */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Начать с шаблона</h3>
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
      </div>

      {/* Block Examples */}
      {onAddBlocks && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Готовые примеры</h3>
          <div className="grid grid-cols-2 gap-2">
            {BLOCK_EXAMPLES.map((example, index) => (
              <motion.div
                key={example.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Button
                  variant="outline"
                  className="w-full h-auto py-2.5 px-2.5 flex flex-col items-center gap-0.5 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => onAddBlocks(example.blocks)}
                >
                  <span className="text-primary">{example.icon}</span>
                  <span className="text-[11px] font-medium">{example.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {example.description}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
