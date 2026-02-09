import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code2, Layers, Zap, ArrowUpRight, Diamond, KeyRound, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useInventory } from "@/contexts/InventoryContext";
import { ServiceKey3D } from "@/components/game/ServiceKey3D";

// Spark particle component
const Spark = ({ delay, direction }: { delay: number; direction: 'left' | 'right' | 'up' | 'down' | 'random' }) => {
  const getAnimation = () => {
    const baseX = direction === 'left' ? -150 : direction === 'right' ? 150 : (Math.random() - 0.5) * 300;
    const baseY = direction === 'up' ? -100 : direction === 'down' ? 100 : (Math.random() - 0.5) * 200;
    return {
      '--tx': `${baseX}px`,
      '--ty': `${baseY}px`,
    } as React.CSSProperties;
  };
  
  return (
    <div 
      className="absolute w-1 h-1 bg-primary rounded-full opacity-0 group-hover:animate-spark"
      style={{
        left: '50%',
        top: '50%',
        animationDelay: `${delay}ms`,
        ...getAnimation(),
      }}
    />
  );
};

const WebDevSection = () => {
  return (
    <section id="webdev" className="py-32 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Glowing orbs */}
        <div className="absolute top-20 -right-32 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 right-[5%] w-24 h-24 border border-primary/10 rotate-45 animate-float" />
        <div className="absolute bottom-1/3 left-[8%] w-16 h-16 border border-primary/5 rotate-12 animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[60%] right-[15%] w-12 h-12 border border-primary/10 rotate-[30deg] animate-float" style={{ animationDelay: '5s' }} />
        
        {/* Diamond accents */}
        <div className="absolute top-[15%] left-[12%] w-3 h-3 bg-primary/20 rotate-45" />
        <div className="absolute top-[45%] right-[8%] w-2 h-2 bg-primary/30 rotate-45" />
        <div className="absolute bottom-[20%] left-[5%] w-2 h-2 bg-primary/20 rotate-45" />
        <div className="absolute top-[75%] right-[25%] w-2 h-2 bg-primary/15 rotate-45" />
        
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        
        {/* Decorative lines */}
        <div className="absolute top-[30%] left-0 w-20 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute top-[70%] right-0 w-28 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        {/* Corner ornaments */}
        <svg className="absolute top-8 right-8 w-16 h-16 text-primary/10" viewBox="0 0 100 100" fill="none" stroke="currentColor">
          <path d="M100 50 L50 100 M100 30 L30 100 M100 10 L10 100" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-8 left-8 w-16 h-16 text-primary/10" viewBox="0 0 100 100" fill="none" stroke="currentColor">
          <path d="M0 50 L50 0 M0 70 L70 0 M0 90 L90 0" strokeWidth="1" />
        </svg>
      </div>
      
      {/* Decorative corner borders */}
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
              <Link to="/portfolio">
                <Button variant="heroOutline" size="lg">
                  Все проекты
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Syntagma feature */}
          <div className="luxury-card rounded-sm p-12 mb-16 relative group transition-all duration-500 overflow-hidden">
            {/* Sparks container */}
            <div className="absolute inset-0 z-30 pointer-events-none overflow-visible">
              {/* Center sparks - fly in all directions */}
              {[...Array(24)].map((_, i) => (
                <Spark key={i} delay={i * 80} direction="random" />
              ))}
            </div>
            
            {/* Animated gates */}
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
              {/* Left gate */}
              <div 
                className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-card via-card to-card/95 transition-transform duration-[3500ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-full origin-left"
                style={{
                  boxShadow: 'inset -20px 0 40px -20px hsl(45 80% 55% / 0.1)',
                }}
              >
                {/* Left gate ornament */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                  <Diamond className="w-4 h-4 text-primary/30" />
                  <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                </div>
                {/* Gate edge line */}
                <div className="absolute right-0 top-0 w-[2px] h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
              </div>
              
              {/* Right gate */}
              <div 
                className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-card via-card to-card/95 transition-transform duration-[3500ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full origin-right"
                style={{
                  boxShadow: 'inset 20px 0 40px -20px hsl(45 80% 55% / 0.1)',
                }}
              >
                {/* Right gate ornament */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                  <Diamond className="w-4 h-4 text-primary/30" />
                  <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                </div>
                {/* Gate edge line */}
                <div className="absolute left-0 top-0 w-[2px] h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
              </div>
              
              {/* Center ornament (visible before opening) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 group-hover:opacity-0">
                <div className="relative">
                  <Diamond className="w-8 h-8 text-primary/50 animate-pulse" />
                  <div className="absolute inset-0 w-8 h-8 bg-primary/20 blur-xl" />
                </div>
              </div>
              
              {/* Closed gates text */}
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-700 group-hover:opacity-0">
                <div className="text-center">
                  <span className="text-xs tracking-[0.3em] uppercase text-primary/60 mb-2 block">Наведите курсор</span>
                  <span className="text-2xl md:text-3xl font-display font-bold gradient-gold-text">Синтагма</span>
                </div>
              </div>
            </div>
            
            {/* Background S - revealed content */}
            <div className="absolute top-8 right-8 text-8xl font-display font-bold text-primary/5 group-hover:text-primary/10 transition-colors duration-700 delay-300">
              S
            </div>
            
            {/* Content (revealed when gates open) */}
            <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 delay-500">
              <span className="text-xs tracking-[0.3em] uppercase text-primary mb-4 block">Flagship Project</span>
              <h3 className="text-4xl md:text-5xl font-display font-bold mb-6 relative inline-block">
                <span className="gradient-gold-text">Синтагма</span>
                <span className="absolute inset-0 gradient-gold-text shimmer">Синтагма</span>
              </h3>
              <p className="text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                Облачная LMS-платформа для автоматизации образовательных процессов. Разработка любых решений с использованием облачных технологий для компаний любого размера.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-10">
                <FeatureItem icon={<Zap />} title="Автоматизация" desc="Ключевых бизнес-процессов" />
                <FeatureItem icon={<Layers />} title="Облачные решения" desc="Масштабируемая инфраструктура" />
                <FeatureItem icon={<Code2 />} title="Интеграции" desc="Moodle, ФРДО, API" />
              </div>

              <a 
                href="https://синтагма.рф" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-8 py-3 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(45_80%_55%/0.3)]"
              >
                Подробнее о проекте
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Services grid */}
          <div className="relative overflow-visible">
            {/* Corner ornaments */}
            <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-primary/30" />
            <div className="absolute -top-4 -right-4 w-8 h-8 border-r-2 border-t-2 border-primary/30" />
            <div className="absolute -bottom-4 -left-4 w-8 h-8 border-l-2 border-b-2 border-primary/30" />
            <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-primary/30" />
            
            {/* Center cross ornament */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <Diamond className="w-4 h-4 text-primary/50" />
            </div>
            
            <div className="grid md:grid-cols-2 overflow-visible">
              <ServiceCard 
                title="Лендинги"
                price="от 15 000 ₽"
                description="Продающие страницы с высокой конверсией"
                href="/services/landing"
                number="01"
                keyId="landing"
                keyVariant="gold"
              />
              <ServiceCard 
                title="Корпоративные сайты"
                price="от 50 000 ₽"
                description="Многостраничные решения для бизнеса"
                href="/services/corporate"
                number="02"
                keyId="corporate"
                keyVariant="silver"
              />
              <ServiceCard 
                title="Интернет-магазины"
                price="от 100 000 ₽"
                description="E-commerce платформы любой сложности"
                href="/services/ecommerce"
                number="03"
                keyId="ecommerce"
                keyVariant="bronze"
              />
              <ServiceCard 
                title="Веб-приложения"
                price="индивидуально"
                description="SPA, PWA, сложные системы"
                href="/services/webapp"
                number="04"
                keyId="webapp"
                keyVariant="emerald"
              />
            </div>
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

const ServiceCard = ({ 
  title, 
  price, 
  description, 
  href, 
  number,
  keyId,
  keyVariant = 'gold'
}: { 
  title: string; 
  price: string; 
  description: string; 
  href: string;
  number: string;
  keyId?: string;
  keyVariant?: 'gold' | 'silver' | 'bronze' | 'emerald';
}) => {
  const { addKey, isKeyCollected } = useInventory();
  const [isHovered, setIsHovered] = useState(false);
  const isCollected = keyId ? isKeyCollected(keyId) : false;

  const handleTakeKey = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!keyId || isCollected) return;
    
    // Get button position for flying animation
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const startPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    
    addKey(keyId, title, startPosition);
  };

  return (
    <div 
      className="relative bg-card p-10 group transition-all duration-500 block border border-border/30 hover:border-primary/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Key - clickable */}
      {keyId && !isCollected && (
        <button 
          onClick={handleTakeKey}
          className="absolute bottom-4 right-4 w-16 h-20 z-20 cursor-pointer hover:scale-110 transition-transform"
        >
          {/* Glow effect behind the key */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
          <ServiceKey3D variant={keyVariant} isHovered={isHovered} className="w-full h-full relative z-10" />
        </button>
      )}
      
      {/* Collected badge */}
      {keyId && isCollected && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-sm bg-primary/10 border border-primary/30 text-primary text-xs z-20">
          <Check className="w-3 h-3" />
          Собран
        </div>
      )}
      
      {/* Background number */}
      <div className="absolute top-4 left-4 text-7xl font-display font-bold text-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:text-primary/10">
        {number}
      </div>
      
      {/* Decorative corner lines */}
      <div className="absolute top-0 left-0 w-12 h-[1px] bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 left-0 w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 right-0 w-12 h-[1px] bg-gradient-to-l from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 right-0 w-[1px] h-12 bg-gradient-to-t from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500"
        style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />
      
      <div className="relative z-10 flex items-start justify-between mb-4">
        <h4 className="text-xl font-display font-semibold group-hover:text-primary transition-colors">{title}</h4>
        <span className="text-primary text-sm font-medium shimmer">{price}</span>
      </div>
      <p className="relative z-10 text-muted-foreground text-sm mb-6">{description}</p>
      
      <div className="relative z-10 flex items-center justify-between gap-4">
        <Link 
          to={href}
          className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors"
        >
          <span>Подробнее</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
        </Link>
        
      </div>
    </div>
  );
};

export default WebDevSection;