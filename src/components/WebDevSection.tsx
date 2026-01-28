import { Button } from "@/components/ui/button";
import { Code2, Layers, Zap, Shield, ArrowRight, ExternalLink } from "lucide-react";

const WebDevSection = () => {
  return (
    <section id="webdev" className="py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Code2 className="w-4 h-4" />
              Веб-разработка
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Создаём <span className="gradient-text">современные</span> сайты
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              От лендингов до сложных веб-приложений. Чистый код, красивый дизайн, быстрая загрузка
            </p>
          </div>

          {/* Main content grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left - Syntagma project */}
            <div className="glass-card rounded-3xl p-8 relative group hover:border-primary/50 transition-all duration-500">
              <div className="absolute top-4 right-4 px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                Флагманский проект
              </div>
              
              <div className="mb-6">
                <h3 className="text-3xl font-bold mb-2 gradient-text">Синтагма</h3>
                <p className="text-muted-foreground">
                  Наш основной проект — платформа для создания современных веб-решений с использованием передовых технологий
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <FeatureItem icon={<Zap />} text="Молниеносная скорость загрузки" />
                <FeatureItem icon={<Layers />} text="Модульная архитектура" />
                <FeatureItem icon={<Shield />} text="Безопасность на всех уровнях" />
              </div>

              <Button variant="hero" className="w-full sm:w-auto">
                Узнать больше
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

            {/* Right - Services */}
            <div className="space-y-6">
              <ServiceCard 
                title="Лендинги"
                description="Продающие одностраничники с высокой конверсией"
                price="от 15 000 ₽"
              />
              <ServiceCard 
                title="Корпоративные сайты"
                description="Многостраничные сайты для бизнеса"
                price="от 50 000 ₽"
              />
              <ServiceCard 
                title="Интернет-магазины"
                description="E-commerce решения любой сложности"
                price="от 100 000 ₽"
              />
              <ServiceCard 
                title="Веб-приложения"
                description="SPA, PWA и сложные веб-системы"
                price="индивидуально"
              />
            </div>
          </div>

          {/* Tech stack */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Технологии</p>
            <div className="flex flex-wrap justify-center gap-4">
              {['React', 'TypeScript', 'Node.js', 'Tailwind', 'Next.js', 'PostgreSQL'].map((tech) => (
                <span 
                  key={tech}
                  className="px-4 py-2 rounded-lg bg-secondary/50 text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </div>
    <span className="text-foreground">{text}</span>
  </div>
);

const ServiceCard = ({ title, description, price }: { title: string; description: string; price: string }) => (
  <div className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group cursor-pointer">
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold text-primary">{price}</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-2" />
      </div>
    </div>
  </div>
);

export default WebDevSection;
