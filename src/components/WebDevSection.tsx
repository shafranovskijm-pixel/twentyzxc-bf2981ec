import { Button } from "@/components/ui/button";
import { Code2, Layers, Zap, ArrowUpRight, Diamond } from "lucide-react";

const WebDevSection = () => {
  return (
    <section id="webdev" className="py-32 relative overflow-hidden">
      {/* Decorative corner */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l border-t border-primary/20" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-primary/20" />
      
      <div className="container relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <Diamond className="w-5 h-5 text-primary" />
                <span className="text-sm tracking-[0.2em] uppercase text-primary">Веб-разработка</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
                Создаём
                <br />
                <span className="gradient-gold-text">исключительные</span>
                <br />
                сайты
              </h2>
            </div>
            <div className="lg:pt-16">
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                От элегантных лендингов до сложных веб-приложений. Каждый проект — это синергия технологий и эстетики, созданная с вниманием к каждой детали.
              </p>
              <Button variant="heroOutline" size="lg">
                Все проекты
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Syntagma feature */}
          <div className="luxury-card rounded-sm p-12 mb-16 relative group transition-all duration-500">
            <div className="absolute top-8 right-8 text-8xl font-display font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
              S
            </div>
            
            <div className="relative z-10">
              <span className="text-xs tracking-[0.3em] uppercase text-primary mb-4 block">Flagship Project</span>
              <h3 className="text-4xl md:text-5xl font-display font-bold mb-6 gradient-gold-text">
                Синтагма
              </h3>
              <p className="text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                Наша флагманская платформа для создания современных веб-решений. Передовые технологии, безупречная архитектура, масштабируемость без компромиссов.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-10">
                <FeatureItem icon={<Zap />} title="Скорость" desc="Мгновенная загрузка" />
                <FeatureItem icon={<Layers />} title="Модульность" desc="Гибкая архитектура" />
                <FeatureItem icon={<Code2 />} title="Качество" desc="Чистый код" />
              </div>

              <Button variant="hero">
                Подробнее о проекте
              </Button>
            </div>
          </div>

          {/* Services grid */}
          <div className="grid md:grid-cols-2 gap-px bg-border">
            <ServiceCard 
              title="Лендинги"
              price="от 15 000 ₽"
              description="Продающие страницы с высокой конверсией"
            />
            <ServiceCard 
              title="Корпоративные сайты"
              price="от 50 000 ₽"
              description="Многостраничные решения для бизнеса"
            />
            <ServiceCard 
              title="Интернет-магазины"
              price="от 100 000 ₽"
              description="E-commerce платформы любой сложности"
            />
            <ServiceCard 
              title="Веб-приложения"
              price="индивидуально"
              description="SPA, PWA, сложные системы"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex items-start gap-4">
    <div className="w-12 h-12 rounded-sm border border-primary/30 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-sm text-muted-foreground">{desc}</div>
    </div>
  </div>
);

const ServiceCard = ({ title, price, description }: { title: string; price: string; description: string }) => (
  <div className="bg-card p-10 group cursor-pointer hover:bg-secondary/50 transition-all duration-300">
    <div className="flex items-start justify-between mb-4">
      <h4 className="text-xl font-display font-semibold group-hover:text-primary transition-colors">{title}</h4>
      <span className="text-primary text-sm font-medium">{price}</span>
    </div>
    <p className="text-muted-foreground text-sm mb-6">{description}</p>
    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
      <span>Подробнее</span>
      <ArrowUpRight className="w-4 h-4" />
    </div>
  </div>
);

export default WebDevSection;