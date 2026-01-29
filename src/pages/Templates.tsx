import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Diamond, ExternalLink, ArrowRight, Sparkles, Layers, ShoppingBag, Monitor } from "lucide-react";
import { Link } from "react-router-dom";

interface Template {
  id: string;
  name: string;
  description: string;
  price: string;
  tags: string[];
  gradient: string;
  accentColor: string;
  features: string[];
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  templates: Template[];
}

const categories: Category[] = [
  {
    id: "landing",
    name: "Лендинги",
    icon: <Sparkles className="w-5 h-5" />,
    description: "Одностраничные сайты для продвижения продуктов и услуг",
    templates: [
      {
        id: "landing-1",
        name: "Noir Elegance",
        description: "Минималистичный лендинг с драматичными контрастами и анимированными переходами",
        price: "от 45 000 ₽",
        tags: ["Минимализм", "Анимации", "Dark Mode"],
        gradient: "from-zinc-900 via-neutral-800 to-zinc-900",
        accentColor: "bg-amber-500",
        features: ["Parallax эффекты", "Микроанимации", "Форма заявки"]
      },
      {
        id: "landing-2",
        name: "Golden Prestige",
        description: "Премиальный лендинг с золотыми акцентами и эффектами свечения",
        price: "от 55 000 ₽",
        tags: ["Премиум", "Золото", "Glassmorphism"],
        gradient: "from-yellow-900/30 via-amber-800/20 to-yellow-900/30",
        accentColor: "bg-yellow-500",
        features: ["3D эффекты", "Видео-фон", "Калькулятор"]
      },
      {
        id: "landing-3",
        name: "Crystal Vision",
        description: "Футуристичный дизайн со стеклянными элементами и неоновыми акцентами",
        price: "от 65 000 ₽",
        tags: ["Футуризм", "Неон", "Glass UI"],
        gradient: "from-purple-900/40 via-indigo-900/30 to-purple-900/40",
        accentColor: "bg-purple-500",
        features: ["Интерактивные элементы", "Custom курсор", "Звуковые эффекты"]
      }
    ]
  },
  {
    id: "corporate",
    name: "Корпоративные",
    icon: <Layers className="w-5 h-5" />,
    description: "Многостраничные сайты для бизнеса и компаний",
    templates: [
      {
        id: "corp-1",
        name: "Executive Suite",
        description: "Строгий корпоративный стиль с акцентом на доверие и профессионализм",
        price: "от 120 000 ₽",
        tags: ["Бизнес", "Многостраничный", "SEO"],
        gradient: "from-slate-900 via-slate-800 to-slate-900",
        accentColor: "bg-blue-500",
        features: ["CMS панель", "Блог", "Мультиязычность"]
      },
      {
        id: "corp-2",
        name: "Marble & Gold",
        description: "Роскошный дизайн с текстурами мрамора и золотыми элементами",
        price: "от 150 000 ₽",
        tags: ["Люкс", "Текстуры", "Анимации"],
        gradient: "from-stone-900 via-stone-800 to-stone-900",
        accentColor: "bg-amber-400",
        features: ["Портфолио галерея", "Команда", "Вакансии"]
      },
      {
        id: "corp-3",
        name: "Tech Horizon",
        description: "Современный технологичный стиль для IT-компаний и стартапов",
        price: "от 180 000 ₽",
        tags: ["Tech", "Gradient", "Interactive"],
        gradient: "from-cyan-900/30 via-teal-900/20 to-cyan-900/30",
        accentColor: "bg-teal-400",
        features: ["Интеграция API", "Демо продукта", "Документация"]
      }
    ]
  },
  {
    id: "ecommerce",
    name: "Интернет-магазины",
    icon: <ShoppingBag className="w-5 h-5" />,
    description: "E-commerce решения для продажи товаров онлайн",
    templates: [
      {
        id: "shop-1",
        name: "Luxe Boutique",
        description: "Элитный магазин для fashion и luxury брендов",
        price: "от 250 000 ₽",
        tags: ["Fashion", "Luxury", "Каталог"],
        gradient: "from-rose-900/30 via-pink-900/20 to-rose-900/30",
        accentColor: "bg-rose-400",
        features: ["Фильтры товаров", "Wishlist", "Quick View"]
      },
      {
        id: "shop-2",
        name: "Artisan Market",
        description: "Стильный маркетплейс для handmade и дизайнерских товаров",
        price: "от 300 000 ₽",
        tags: ["Маркетплейс", "Handmade", "Мультивендор"],
        gradient: "from-orange-900/30 via-amber-900/20 to-orange-900/30",
        accentColor: "bg-orange-400",
        features: ["Кабинет продавца", "Отзывы", "Рейтинги"]
      },
      {
        id: "shop-3",
        name: "Premium Gallery",
        description: "Галерейный формат для эксклюзивных товаров и коллекций",
        price: "от 350 000 ₽",
        tags: ["Галерея", "Premium", "Анимации"],
        gradient: "from-emerald-900/30 via-green-900/20 to-emerald-900/30",
        accentColor: "bg-emerald-400",
        features: ["AR примерка", "360° просмотр", "Персонализация"]
      }
    ]
  },
  {
    id: "webapp",
    name: "Веб-приложения",
    icon: <Monitor className="w-5 h-5" />,
    description: "Сложные интерактивные веб-приложения и SaaS платформы",
    templates: [
      {
        id: "app-1",
        name: "Dashboard Pro",
        description: "Профессиональная панель управления с аналитикой и графиками",
        price: "от 400 000 ₽",
        tags: ["Dashboard", "Analytics", "Charts"],
        gradient: "from-blue-900/30 via-indigo-900/20 to-blue-900/30",
        accentColor: "bg-blue-400",
        features: ["Realtime данные", "Экспорт отчётов", "Уведомления"]
      },
      {
        id: "app-2",
        name: "CRM Elite",
        description: "CRM-система премиум класса для управления клиентами",
        price: "от 500 000 ₽",
        tags: ["CRM", "Автоматизация", "Интеграции"],
        gradient: "from-violet-900/30 via-purple-900/20 to-violet-900/30",
        accentColor: "bg-violet-400",
        features: ["Воронка продаж", "Email рассылки", "Задачи"]
      },
      {
        id: "app-3",
        name: "Platform X",
        description: "Масштабируемая SaaS платформа с подпиской и биллингом",
        price: "от 700 000 ₽",
        tags: ["SaaS", "Подписки", "API"],
        gradient: "from-fuchsia-900/30 via-pink-900/20 to-fuchsia-900/30",
        accentColor: "bg-fuchsia-400",
        features: ["Stripe интеграция", "Мультитенантность", "White label"]
      }
    ]
  }
];

const Templates = () => {
  const [activeCategory, setActiveCategory] = useState<string>("landing");

  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(45_80%_55%/0.08),transparent_60%)]" />
        
        <div className="container px-4 relative z-10">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
              <Diamond className="w-5 h-5 text-primary" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Каталог <span className="gradient-gold-text">шаблонов</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Премиальные шаблоны сайтов класса люкс. Современный дизайн, продуманная UX и безупречное качество кода
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="pb-8 sticky top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-sm text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-16">
        <div className="container px-4">
          {currentCategory && (
            <>
              <AnimatedSection className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">{currentCategory.name}</h2>
                <p className="text-muted-foreground">{currentCategory.description}</p>
              </AnimatedSection>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentCategory.templates.map((template, index) => (
                  <AnimatedSection key={template.id} delay={index * 0.1}>
                    <TemplateCard template={template} />
                  </AnimatedSection>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container px-4">
          <AnimatedSection>
            <div className="luxury-card rounded-sm p-12 text-center max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Нужен уникальный дизайн?
              </h3>
              <p className="text-muted-foreground mb-8">
                Создадим индивидуальный проект с нуля под ваши требования и фирменный стиль
              </p>
              <Link to="/#contact">
                <Button variant="hero" size="lg">
                  Обсудить проект
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

interface TemplateCardProps {
  template: Template;
}

const TemplateCard = ({ template }: TemplateCardProps) => (
  <div className="group luxury-card rounded-sm overflow-hidden">
    {/* Preview Area */}
    <div className={`aspect-[4/3] bg-gradient-to-br ${template.gradient} relative overflow-hidden`}>
      {/* Decorative elements to simulate a website */}
      <div className="absolute inset-4 border border-white/10 rounded-sm">
        {/* Header bar */}
        <div className="h-8 border-b border-white/10 flex items-center px-3 gap-2">
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="w-2 h-2 rounded-full bg-white/20" />
          <div className="flex-1" />
          <div className="w-16 h-2 rounded bg-white/10" />
        </div>
        
        {/* Content simulation */}
        <div className="p-4 space-y-3">
          <div className={`w-8 h-8 rounded ${template.accentColor} opacity-80`} />
          <div className="w-3/4 h-3 rounded bg-white/20" />
          <div className="w-1/2 h-3 rounded bg-white/10" />
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="aspect-square rounded bg-white/5" />
            <div className="aspect-square rounded bg-white/5" />
            <div className="aspect-square rounded bg-white/5" />
          </div>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Button variant="hero" size="sm">
          Подробнее
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Glow effect */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 ${template.accentColor} opacity-20 blur-3xl`} />
    </div>

    {/* Info */}
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h3 className="text-lg font-display font-semibold group-hover:text-primary transition-colors">
          {template.name}
        </h3>
        <span className="text-primary font-semibold text-sm whitespace-nowrap shimmer">
          {template.price}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {template.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {template.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Features */}
      <div className="pt-4 border-t border-border">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {template.features.map((feature) => (
            <span key={feature} className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-primary" />
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Templates;
