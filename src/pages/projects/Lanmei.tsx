import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ExternalLink, 
  Palette,
  Globe,
  Megaphone,
  Share2,
  Package,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import lanmeiscreenshot from "@/assets/projects/lanmei-screenshot.jpg";

const services = [
  {
    icon: Palette,
    title: "Брендинг и айдентика",
    description: "Разработка логотипа, фирменного стиля и брендбука. Создание узнаваемого образа компании на рынке импорта"
  },
  {
    icon: Globe,
    title: "Продающий сайт",
    description: "Разработка современного сайта с каталогом товаров, калькулятором доставки и формами заявок"
  },
  {
    icon: Megaphone,
    title: "Рекламные кампании",
    description: "Настройка и ведение контекстной рекламы в Яндекс Директ, таргетированной рекламы в соцсетях"
  },
  {
    icon: Share2,
    title: "SMM-продвижение",
    description: "Ведение социальных сетей: создание контента, работа с аудиторией, увеличение охватов"
  },
  {
    icon: TrendingUp,
    title: "SEO-оптимизация",
    description: "Поисковое продвижение сайта: семантическое ядро, оптимизация страниц, наращивание ссылочной массы"
  },
  {
    icon: Package,
    title: "Каталог товаров",
    description: "Структурированный каталог с категориями, фильтрами и возможностью оформления оптовых заказов"
  },
];


const Lanmei = () => {
  return (
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
                  src={lanmeiscreenshot} 
                  alt="Lanmei — экспорт из Китая" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <Badge variant="outline" className="border-primary/50 text-primary bg-background/80">
                    Комплексный брендинг
                  </Badge>
                  <Button variant="ghost" size="sm" asChild className="bg-background/80">
                    <a href="https://lanmei.ru/" target="_blank" rel="noopener noreferrer">
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
                Импорт/Экспорт
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                <span className="gradient-gold-text">Lanmei</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Экспорт товаров из Китая
              </p>
              
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Комплексный брендинг для компании по закупкам и доставке товаров из Китая. Проект включает 
                разработку фирменного стиля, создание продающего сайта с каталогом, настройку рекламных 
                кампаний и полноценное ведение социальных сетей.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {["web", "ads", "SEO", "SMM", "брендинг"].map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="luxury-card p-6 rounded-sm">
                <div className="text-sm text-muted-foreground mb-2">Стоимость обслуживания</div>
                <div className="text-2xl font-display font-bold gradient-gold-text">35 000 ₽/год</div>
              </div>
            </div>
          </div>


          {/* Services Grid */}
          <div className="mb-20">
            <h2 className="text-2xl font-display font-semibold mb-8 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary" />
              Что было сделано
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, i) => (
                <div 
                  key={i} 
                  className="luxury-card p-6 rounded-sm group hover:border-primary/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-sm border border-border group-hover:border-primary/40 flex items-center justify-center mb-4 transition-colors">
                    <service.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Branding Section */}
          <div className="mb-20">
            <div className="luxury-card p-8 md:p-12 rounded-sm">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                    Фирменный стиль
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                    Комплексный <span className="gradient-gold-text">брендинг</span>
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Разработали полноценную айдентику компании: от логотипа до оформления социальных сетей. 
                    Фирменный стиль отражает надёжность и профессионализм в сфере международной торговли.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Логотип и фирменные цвета
                    </li>
                    <li className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Типографика и паттерны
                    </li>
                    <li className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Шаблоны для соцсетей
                    </li>
                    <li className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Презентации и коммерческие предложения
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg blur-xl" />
                  <div className="relative grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-sm p-6 flex items-center justify-center">
                      <div className="text-4xl font-display font-bold gradient-gold-text">Lm</div>
                    </div>
                    <div className="bg-card border border-border rounded-sm p-6 space-y-2">
                      <div className="w-full h-3 bg-red-600 rounded" />
                      <div className="w-full h-3 bg-amber-500 rounded" />
                      <div className="w-full h-3 bg-neutral-800 rounded" />
                    </div>
                    <div className="col-span-2 bg-card border border-border rounded-sm p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600/20 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <div className="font-medium">Lanmei Export</div>
                          <div className="text-xs text-muted-foreground">Качество из Китая</div>
                        </div>
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
                Нужен <span className="gradient-gold-text">комплексный</span> маркетинг?
              </h3>
              <p className="text-muted-foreground mb-8">
                Создадим бренд и продвинем ваш бизнес в интернете
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg" asChild>
                  <a href="/#contact">Обсудить проект</a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://lanmei.ru/" target="_blank" rel="noopener noreferrer">
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
  );
};

export default Lanmei;
