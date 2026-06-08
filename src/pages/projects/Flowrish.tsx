import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import TitleParticles from "@/components/TitleParticles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ExternalLink, 
  ShoppingBag, 
  Users, 
  Gift, 
  Calendar,
  Palette,
  Timer,
  Smartphone,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import flowrishScreenshot from "@/assets/projects/flowrish-screenshot.jpg";

const holidays = [
  { name: "Новый год", icon: "🎄", date: "31 декабря" },
  { name: "14 февраля", icon: "💝", date: "День влюблённых" },
  { name: "8 марта", icon: "🌷", date: "Международный женский день" },
  { name: "День выпускника", icon: "🎓", date: "Июнь" },
  { name: "1 сентября", icon: "📚", date: "День знаний" },
  { name: "День учителя", icon: "🍎", date: "5 октября" },
  { name: "День матери", icon: "💐", date: "Последнее воскресенье ноября" },
];

const features = [
  {
    icon: ShoppingBag,
    title: "Интернет-магазин",
    description: "Полноценный каталог товаров с корзиной, оформлением заказов и интеграцией с платёжными системами"
  },
  {
    icon: Settings,
    title: "Административная панель",
    description: "Удобный интерфейс для добавления, редактирования и управления товарами, категориями и заказами"
  },
  {
    icon: Users,
    title: "Учёт клиентов",
    description: "CRM-система для ведения базы клиентов, истории покупок и персональных предложений"
  },
  {
    icon: Gift,
    title: "Бонусная система",
    description: "Гибкая настройка бонусов, скидок и акций для постоянных покупателей"
  },
  {
    icon: Palette,
    title: "Праздничные темы",
    description: "Автоматическая смена визуального оформления сайта под праздники — 7 уникальных тем"
  },
  {
    icon: Timer,
    title: "Таймер событий",
    description: "Автоматическое переключение тем по таймеру к приближающимся праздникам"
  },
  {
    icon: Smartphone,
    title: "Мобильное приложение",
    description: "Приложение для сотрудников магазина: управление заказами и учёт на ходу"
  },
];

const Flowrish = () => {
  return (
    <>
      <Helmet>
        <title>Flowrish — Интернет-магазин цветов | 24ZXC</title>
        <meta name="description" content="Кейс: разработка интернет-магазина цветов Flowrish. PWA-приложение с каталогом, корзиной и сезонными темами." />
        <link rel="canonical" href="https://24zxc.ru/projects/flowrish" />
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
          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            {/* Screenshot */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative luxury-card rounded-sm overflow-hidden">
                <img 
                  src={flowrishScreenshot} 
                  alt="Flowrish — интернет-магазин цветов" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <Badge variant="outline" className="border-primary/50 text-primary bg-background/80">
                    Интернет-магазин
                  </Badge>
                  <Button variant="ghost" size="sm" asChild className="bg-background/80">
                    <a href="https://shafranovskijm-pixel-celebrate-shop-craft-352f.twc1.net/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Открыть сайт
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Info */}
            <div>
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                E-commerce
              </Badge>
              
              {/* Title with particles */}
              <div className="relative inline-block mb-4">
                <TitleParticles />
                <h1 className="text-4xl md:text-5xl font-display font-bold relative z-10 py-4 px-2">
                  Магазин <span className="gradient-gold-text">«Flowrish»</span>
                </h1>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Уссурийск
              </p>
              
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Полноценный интернет-магазин цветов и подарков с продвинутой административной панелью. 
                Уникальная особенность — автоматическая смена визуального оформления сайта под праздники 
                с помощью встроенного таймера. Реализована система учёта клиентов и гибкая бонусная программа.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {["web", "CRM", "ads", "E-commerce", "мобильное приложение"].map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="luxury-card p-6 rounded-sm">
                <div className="text-sm text-muted-foreground mb-2">Стоимость обслуживания</div>
                <div className="text-2xl font-display font-bold gradient-gold-text">15 000 ₽/мес</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-20">
            <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              Реализованный функционал
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div 
                  key={i} 
                  className="luxury-card p-6 rounded-sm group hover:border-primary/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-sm border border-border group-hover:border-primary/40 flex items-center justify-center mb-4 transition-colors">
                    <feature.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Holiday Themes */}
          <div className="mb-20">
            <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              Праздничные темы оформления
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Сайт автоматически меняет визуальное оформление к приближающимся праздникам. 
              Таймер отслеживает даты и заблаговременно переключает тему, создавая праздничную атмосферу для покупателей.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {holidays.map((holiday, i) => (
                <div 
                  key={i} 
                  className="luxury-card p-4 rounded-sm text-center group hover:border-primary/40 transition-colors"
                >
                  <div className="text-3xl mb-2">{holiday.icon}</div>
                  <div className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                    {holiday.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {holiday.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="luxury-card p-12 rounded-sm max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                Хотите <span className="gradient-gold-text">такой же</span> магазин?
              </h3>
              <p className="text-muted-foreground mb-8">
                Создадим интернет-магазин с вашими уникальными функциями
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#contact">Обсудить проект</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://shafranovskijm-pixel-celebrate-shop-craft-352f.twc1.net/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Посмотреть сайт
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default Flowrish;
