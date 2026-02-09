import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ExternalLink, 
  Bot,
  Users,
  BarChart3,
  FileText,
  Settings,
  Search,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import chmulevascreenshot from "@/assets/projects/chmuleva-screenshot.jpg";

const features = [
  {
    icon: Users,
    title: "Личный кабинет клиента",
    description: "Клиенты могут отслеживать подобранные объекты, сохранять избранное и получать персональные предложения"
  },
  {
    icon: Bot,
    title: "ИИ-помощник для блога",
    description: "Интеллектуальный ассистент помогает создавать SEO-оптимизированные статьи о недвижимости Дальнего Востока"
  },
  {
    icon: BarChart3,
    title: "Статистика посещений",
    description: "Детальная аналитика посетителей сайта: география, источники трафика, популярные объекты"
  },
  {
    icon: MessageSquare,
    title: "Система сбора заявок",
    description: "Умные формы захвата с квалификацией лидов, интеграция с CRM и уведомления в Telegram"
  },
  {
    icon: Settings,
    title: "Панель управления",
    description: "Удобный интерфейс для добавления объектов, редактирования контента и настройки сайта"
  },
  {
    icon: Search,
    title: "SEO-оптимизация",
    description: "Продвижение в поисковых системах: семантическое ядро, мета-теги, микроразметка Schema.org"
  },
];

const benefits = [
  { value: "500+", label: "Объектов в базе" },
  { value: "1000+", label: "Посетителей в месяц" },
  { value: "50+", label: "Заявок ежемесячно" },
  { value: "24/7", label: "Работа сайта" },
];

const Chmuleva = () => {
  return (
    <>
      <Helmet>
        <title>Чмулёва — Сайт для психолога | 24ZXC</title>
        <meta name="description" content="Кейс: создание сайта для психолога Чмулёвой. Продающий лендинг с формой записи и интеграцией с соцсетями." />
        <link rel="canonical" href="https://24zxc.ru/projects/chmuleva" />
      </Helmet>
      <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
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
                  src={chmulevascreenshot} 
                  alt="Анна Чмулева — сайт риелтора" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <Badge variant="outline" className="border-primary/50 text-primary bg-background/80">
                    Персональный сайт
                  </Badge>
                  <Button variant="ghost" size="sm" asChild className="bg-background/80">
                    <a href="https://xn----7sbfldrqgb2aseye2d.xn--p1ai/" target="_blank" rel="noopener noreferrer">
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
                Недвижимость
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                <span className="gradient-gold-text">Анна Чмулева</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                Эксперт по недвижимости
              </p>
              <p className="text-muted-foreground mb-6">
                Дальний Восток
              </p>
              
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Персональный сайт эксперта по недвижимости с расширенным функционалом: личный кабинет для клиентов, 
                ИИ-помощник для создания контента блога, детальная статистика посещений и умная система сбора заявок 
                с интеграцией CRM.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {["web", "дизайн", "SEO", "AI", "CRM"].map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="luxury-card p-4 rounded-sm text-center">
                    <div className="text-xl font-display font-bold gradient-gold-text">{benefit.value}</div>
                    <div className="text-xs text-muted-foreground">{benefit.label}</div>
                  </div>
                ))}
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

          {/* AI Section */}
          <div className="mb-20">
            <div className="luxury-card p-8 md:p-12 rounded-sm">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                    Искусственный интеллект
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                    ИИ-помощник для <span className="gradient-gold-text">контента</span>
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Интегрированный AI-ассистент помогает создавать уникальный контент для блога о недвижимости. 
                    Генерация статей, описаний объектов и SEO-текстов с учётом специфики рынка Дальнего Востока.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Генерация SEO-статей для блога
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Описания объектов недвижимости
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Анализ конкурентов и трендов рынка
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg blur-xl" />
                  <div className="relative bg-card border border-border rounded-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">AI Ассистент</div>
                        <div className="text-xs text-muted-foreground">Генерация контента</div>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="bg-muted/50 rounded p-3">
                        Напиши статью о преимуществах покупки квартиры во Владивостоке...
                      </div>
                      <div className="bg-primary/10 rounded p-3 text-primary">
                        Владивосток — один из самых перспективных городов Дальнего Востока для инвестиций в недвижимость...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="luxury-card p-12 rounded-sm max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                Хотите <span className="gradient-gold-text">такой же</span> сайт?
              </h3>
              <p className="text-muted-foreground mb-8">
                Создадим персональный сайт с ИИ-функционалом под ваш бизнес
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#contact">Обсудить проект</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://xn----7sbfldrqgb2aseye2d.xn--p1ai/" target="_blank" rel="noopener noreferrer">
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

export default Chmuleva;
