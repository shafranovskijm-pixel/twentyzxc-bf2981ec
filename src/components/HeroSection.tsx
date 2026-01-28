import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Megaphone, Building2 } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Разработка • Реклама • Услуги</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="gradient-text">24ZXC</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Цифровые решения для вашего бизнеса
          </p>
          
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Веб-разработка, настройка рекламы, недвижимость и полный спектр услуг — всё в одном месте
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button variant="hero" size="xl">
              Начать проект
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl">
              Смотреть услуги
            </Button>
          </div>

          {/* Service cards preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <ServicePreviewCard 
              icon={<Code2 className="w-8 h-8" />}
              title="Веб-разработка"
              description="Сайты, приложения, проект Синтагма"
              delay="0.5s"
            />
            <ServicePreviewCard 
              icon={<Megaphone className="w-8 h-8" />}
              title="Реклама"
              description="Настройка и ведение рекламных кампаний"
              delay="0.6s"
            />
            <ServicePreviewCard 
              icon={<Building2 className="w-8 h-8" />}
              title="Услуги"
              description="Недвижимость и другие направления"
              delay="0.7s"
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-2.5 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

interface ServicePreviewCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}

const ServicePreviewCard = ({ icon, title, description, delay }: ServicePreviewCardProps) => (
  <div 
    className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:glow-soft cursor-pointer animate-fade-in group"
    style={{ animationDelay: delay }}
  >
    <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default HeroSection;
