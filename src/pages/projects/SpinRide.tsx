import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import TitleParticles from "@/components/TitleParticles";
import TechCard from "@/components/TechCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ExternalLink, 
  ShoppingCart,
  Star,
  Palette,
  Search,
  Megaphone,
  Package,
  CheckCircle2,
  Snowflake,
  Sun,
  Smartphone,
  Camera
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Package,
    title: "Каталог 800+ позиций",
    description: "Полный ассортимент велосипедов и самокатов с детальными характеристиками, фото и ценами"
  },
  {
    icon: Smartphone,
    title: "PWA-приложение",
    description: "Устанавливается на телефон как приложение, работает офлайн и отправляет уведомления"
  },
  {
    icon: Camera,
    title: "Загрузка фото с телефона",
    description: "Менеджеры могут фотографировать товар на телефон и сразу загружать на сайт"
  },
  {
    icon: Star,
    title: "Система отзывов",
    description: "Покупатели могут оставлять отзывы с оценками, помогая другим сделать выбор"
  },
  {
    icon: Palette,
    title: "Сезонный дизайн",
    description: "Автоматическое переключение между зимней и летней темой оформления сайта"
  },
  {
    icon: Search,
    title: "SEO-оптимизация",
    description: "Продвижение в поисковых системах для привлечения органического трафика"
  },
  {
    icon: Megaphone,
    title: "Яндекс Директ",
    description: "Настройка и ведение рекламных кампаний с оптимизацией по конверсиям"
  },
  {
    icon: ShoppingCart,
    title: "Удобный заказ",
    description: "Корзина, оформление заказа и уведомления для покупателей и менеджеров"
  },
];

const highlights = [
  { label: "Товаров в каталоге", value: "800+" },
  { label: "Категорий товаров", value: "12" },
  { label: "Сезонных тем", value: "2" },
  { label: "PWA-приложение", value: "✓" },
];

const SpinRide = () => {
  return (
    <>
      <Helmet>
        <title>SpinRide — Интернет-магазин самокатов | 24ZXC</title>
        <meta name="description" content="Кейс: разработка интернет-магазина самокатов SpinRide. Каталог 800+ товаров, SEO-оптимизация и рекламные кампании." />
        <link rel="canonical" href="https://24zxc.ru/projects/spinride" />
      </Helmet>
      <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* Decorative corner lines */}
        <svg className="absolute top-24 left-8 w-32 h-32 opacity-20" viewBox="0 0 100 100">
          <path d="M 0 30 L 0 0 L 30 0" fill="none" stroke="hsl(45 80% 55%)" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-24 right-8 w-32 h-32 opacity-20" viewBox="0 0 100 100">
          <path d="M 100 70 L 100 100 L 70 100" fill="none" stroke="hsl(45 80% 55%)" strokeWidth="1" />
        </svg>
        {/* Floating particles */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
        <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-primary/50 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Header />
      
      <main className="pt-32 pb-24 relative z-10">
        <div className="container px-4">
          {/* Back button */}
          <Link 
            to="/portfolio" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Назад к портфолио
          </Link>

          {/* Hero */}
          <AnimatedSection className="mb-20">
            <div className="max-w-4xl">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                E-commerce
              </Badge>
              
              {/* Title with particles */}
              <div className="relative inline-block mb-4">
                <TitleParticles />
                <h1 className="text-4xl md:text-5xl font-display font-bold relative z-10 py-4 px-2">
                  <span className="gradient-gold-text">SpinRide</span> — велосипеды и самокаты
                </h1>
              </div>
              
              <p className="text-lg text-muted-foreground mb-6">
                Интернет-магазин с большим каталогом, отзывами и сезонным дизайном
              </p>
              
              <p className="text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                Современный интернет-магазин велосипедов и самокатов с каталогом более 800 позиций. 
                Покупатели могут оставлять отзывы, а уникальный сезонный дизайн автоматически меняется 
                между зимней и летней темой для создания актуальной атмосферы.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {["web", "E-commerce", "SEO", "ads", "отзывы", "сезонный дизайн"].map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="luxury-card px-6 py-3 rounded-sm">
                  <span className="text-sm text-muted-foreground mr-2">Обслуживание:</span>
                  <span className="text-xl font-display font-bold gradient-gold-text">10 000 ₽/мес</span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://spinride.ru/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Открыть сайт
                  </a>
                </Button>
              </div>
            </div>
          </AnimatedSection>

          {/* Stats */}
          <AnimatedSection className="mb-20" delay={100}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {highlights.map((item, i) => (
                <div key={i} className="luxury-card p-6 rounded-sm text-center">
                  <div className="text-2xl md:text-3xl font-display font-bold gradient-gold-text mb-1">
                    {item.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Features Grid */}
          <AnimatedSection className="mb-20" delay={100}>
            <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              Возможности магазина
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <AnimatedSection key={i} delay={150 + i * 100} direction="up">
                  <TechCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    index={i}
                  />
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>

          {/* Seasonal Design Section */}
          <AnimatedSection className="mb-20" delay={100} direction="scale">
            <div className="luxury-card p-8 md:p-12 rounded-sm">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                    Уникальная фича
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                    Сезонный <span className="gradient-gold-text">дизайн</span>
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Сайт автоматически меняет оформление в зависимости от сезона. 
                    Зимой — уютная снежная тема, летом — яркий солнечный дизайн. 
                    Это создает актуальную атмосферу и повышает вовлеченность покупателей.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Автоматическое переключение по календарю
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Уникальные графические элементы для каждого сезона
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      Сезонные акции и промо-материалы
                    </li>
                  </ul>
                </div>
                <div className="flex justify-center gap-6">
                  <div className="luxury-card p-6 rounded-sm text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mx-auto mb-3">
                      <Snowflake className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-sm font-medium">Зима</p>
                    <p className="text-xs text-muted-foreground">Ноябрь — Февраль</p>
                  </div>
                  <div className="luxury-card p-6 rounded-sm text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-3">
                      <Sun className="w-8 h-8 text-amber-400" />
                    </div>
                    <p className="text-sm font-medium">Лето</p>
                    <p className="text-xs text-muted-foreground">Март — Октябрь</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* What's included */}
          <AnimatedSection className="mb-20" delay={100}>
            <div className="luxury-card p-8 md:p-12 rounded-sm">
              <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-primary" />
                Что входит в обслуживание
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Хостинг и домен</span>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Техническая поддержка</span>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Обновление каталога</span>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">SEO-продвижение</span>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Рекламные кампании</span>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-medium">Итого</span>
                    <span className="font-semibold text-primary">10 000 ₽/мес</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* CTA */}
          <AnimatedSection className="text-center" delay={100} direction="up">
            <div className="luxury-card p-12 rounded-sm max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                Нужен <span className="gradient-gold-text">интернет-магазин</span>?
              </h3>
              <p className="text-muted-foreground mb-8">
                Создадим функциональный магазин с каталогом, корзиной и SEO-продвижением
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#contact">Обсудить проект</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/services/ecommerce">
                    Подробнее об E-commerce
                  </Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default SpinRide;
