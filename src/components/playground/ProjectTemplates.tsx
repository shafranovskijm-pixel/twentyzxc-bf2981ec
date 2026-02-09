import { motion } from "framer-motion";
import { Briefcase, Rocket, Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaygroundBlock, BlockStyles } from "@/data/playground-effects";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  blocks: Omit<PlaygroundBlock, 'id'>[];
}

const defaultStyles: BlockStyles = {
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
      {
        type: 'heading',
        content: 'Иван Иванов',
        animation: 'fade-in-up',
        styles: { ...defaultStyles, fontSize: '48px', padding: '32px 16px 8px' }
      },
      {
        type: 'text',
        content: 'Веб-разработчик & Дизайнер',
        animation: 'fade-in-up',
        hoverEffect: 'hover-glow',
        styles: { ...defaultStyles, fontSize: '20px', textColor: '#d4a855', padding: '8px 16px' }
      },
      {
        type: 'divider',
        content: '',
        animation: 'fade-in',
        styles: { ...defaultStyles, padding: '24px 16px' }
      },
      {
        type: 'text',
        content: 'Создаю современные веб-сайты и приложения с фокусом на пользовательский опыт и производительность.',
        animation: 'fade-in-up',
        styles: { ...defaultStyles, fontSize: '16px', textColor: '#888888', padding: '8px 48px' }
      },
      {
        type: 'spacer',
        content: '',
        styles: { ...defaultStyles, padding: '16px' }
      },
      {
        type: 'button',
        content: 'Связаться',
        animation: 'scale-in',
        hoverEffect: 'hover-lift',
        styles: { ...defaultStyles, padding: '16px' }
      }
    ]
  },
  {
    id: 'landing',
    name: 'Лендинг',
    description: 'Продающая страница продукта',
    icon: <Rocket className="w-5 h-5" />,
    blocks: [
      {
        type: 'heading',
        content: 'Ваш идеальный продукт',
        animation: 'fade-in-up',
        styles: { ...defaultStyles, fontSize: '56px', padding: '48px 16px 16px' }
      },
      {
        type: 'text',
        content: 'Инновационное решение для современного бизнеса',
        animation: 'fade-in-up',
        styles: { ...defaultStyles, fontSize: '24px', textColor: '#888888', padding: '8px 16px 24px' }
      },
      {
        type: 'button',
        content: 'Попробовать бесплатно',
        animation: 'scale-bounce',
        hoverEffect: 'hover-lift',
        styles: { ...defaultStyles, padding: '16px', fontSize: '18px' }
      },
      {
        type: 'spacer',
        content: '',
        styles: { ...defaultStyles, padding: '32px' }
      },
      {
        type: 'image',
        content: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop',
        animation: 'fade-in',
        hoverEffect: 'hover-scale',
        styles: { ...defaultStyles, padding: '16px', borderRadius: '16px' }
      },
      {
        type: 'divider',
        content: '',
        styles: { ...defaultStyles, padding: '32px 16px' }
      },
      {
        type: 'heading',
        content: 'Почему выбирают нас',
        animation: 'fade-in-up',
        styles: { ...defaultStyles, fontSize: '32px', padding: '16px' }
      },
      {
        type: 'card',
        content: '✨ Быстрый старт за 5 минут\n🔒 Безопасность данных\n📱 Работает на любых устройствах',
        animation: 'fade-in-up',
        hoverEffect: 'hover-glow',
        styles: { ...defaultStyles, backgroundColor: '#1a1a1a', padding: '24px', textAlign: 'left' }
      }
    ]
  },
  {
    id: 'portfolio',
    name: 'Портфолио',
    description: 'Галерея работ с анимациями',
    icon: <Image className="w-5 h-5" />,
    blocks: [
      {
        type: 'heading',
        content: 'Мои работы',
        animation: 'fade-in-up',
        styles: { ...defaultStyles, fontSize: '48px', padding: '32px 16px 8px' }
      },
      {
        type: 'text',
        content: 'Избранные проекты и кейсы',
        animation: 'fade-in',
        styles: { ...defaultStyles, fontSize: '18px', textColor: '#888888', padding: '8px 16px 32px' }
      },
      {
        type: 'image',
        content: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
        animation: 'fade-in-left',
        hoverEffect: 'hover-lift',
        styles: { ...defaultStyles, padding: '8px', borderRadius: '12px' }
      },
      {
        type: 'card',
        content: 'Корпоративный сайт\nРедизайн и разработка',
        animation: 'fade-in-right',
        hoverEffect: 'hover-glow',
        styles: { ...defaultStyles, backgroundColor: '#1a1a1a', padding: '16px', textAlign: 'left' }
      },
      {
        type: 'image',
        content: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
        animation: 'fade-in-left',
        hoverEffect: 'hover-lift',
        styles: { ...defaultStyles, padding: '8px', borderRadius: '12px' }
      },
      {
        type: 'card',
        content: 'E-commerce платформа\nМагазин с интеграцией оплаты',
        animation: 'fade-in-right',
        hoverEffect: 'hover-glow',
        styles: { ...defaultStyles, backgroundColor: '#1a1a1a', padding: '16px', textAlign: 'left' }
      }
    ]
  },
  {
    id: 'promo',
    name: 'Промо',
    description: 'Яркий акцент на событии',
    icon: <Sparkles className="w-5 h-5" />,
    blocks: [
      {
        type: 'text',
        content: '🎉 СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ',
        animation: 'pulse',
        styles: { ...defaultStyles, fontSize: '14px', textColor: '#d4a855', padding: '24px 16px 8px' }
      },
      {
        type: 'heading',
        content: 'Чёрная пятница',
        animation: 'scale-bounce',
        styles: { ...defaultStyles, fontSize: '64px', padding: '8px 16px' }
      },
      {
        type: 'heading',
        content: '-50%',
        animation: 'blur-in',
        hoverEffect: 'hover-glow',
        styles: { ...defaultStyles, fontSize: '96px', textColor: '#d4a855', padding: '8px 16px' }
      },
      {
        type: 'text',
        content: 'на все услуги до 30 ноября',
        animation: 'fade-in-up',
        styles: { ...defaultStyles, fontSize: '20px', textColor: '#888888', padding: '8px 16px 32px' }
      },
      {
        type: 'button',
        content: 'Получить скидку',
        animation: 'scale-in',
        hoverEffect: 'hover-lift',
        styles: { ...defaultStyles, fontSize: '20px', padding: '16px' }
      },
      {
        type: 'spacer',
        content: '',
        styles: { ...defaultStyles, padding: '24px' }
      },
      {
        type: 'text',
        content: 'Осталось: 127 мест',
        animation: 'fade-in',
        styles: { ...defaultStyles, fontSize: '14px', textColor: '#666666', padding: '8px 16px' }
      }
    ]
  }
];

interface ProjectTemplatesProps {
  onSelectTemplate: (blocks: Omit<PlaygroundBlock, 'id'>[]) => void;
}

export const ProjectTemplates = ({ onSelectTemplate }: ProjectTemplatesProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Начать с шаблона</h3>
      <div className="grid grid-cols-2 gap-2">
        {PAGE_TEMPLATES.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
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
  );
};
