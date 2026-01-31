import { Button } from "@/components/ui/button";
import { Code2, Layers, Zap, ArrowUpRight, Diamond, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

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
              <Button variant="heroOutline" size="lg">
                Все проекты
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Syntagma feature */}
          <div className="luxury-card rounded-sm p-12 mb-16 relative group transition-all duration-500 overflow-hidden">
            {/* Animated gates */}
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
              {/* Left gate */}
              <div 
                className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-card via-card to-card/95 transition-transform duration-[2000ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-full origin-left"
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
                className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-card via-card to-card/95 transition-transform duration-[2000ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-full origin-right"
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
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 group-hover:opacity-0">
                <div className="relative">
                  <Diamond className="w-8 h-8 text-primary/50 animate-pulse" />
                  <div className="absolute inset-0 w-8 h-8 bg-primary/20 blur-xl" />
                </div>
              </div>
              
              {/* Closed gates text */}
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 group-hover:opacity-0">
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
            <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-300">
              <span className="text-xs tracking-[0.3em] uppercase text-primary mb-4 block">Flagship Project</span>
              <h3 className="text-4xl md:text-5xl font-display font-bold mb-6 relative inline-block">
                <span className="gradient-gold-text">Синтагма</span>
                <span className="absolute inset-0 gradient-gold-text shimmer">Синтагма</span>
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
          <div className="relative">
            {/* Corner ornaments */}
            <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-primary/30" />
            <div className="absolute -top-4 -right-4 w-8 h-8 border-r-2 border-t-2 border-primary/30" />
            <div className="absolute -bottom-4 -left-4 w-8 h-8 border-l-2 border-b-2 border-primary/30" />
            <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-primary/30" />
            
            {/* Center cross ornament */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <Diamond className="w-4 h-4 text-primary/50" />
            </div>
            
            <div className="grid md:grid-cols-2">
              <ServiceCard 
                title="Лендинги"
                price="от 15 000 ₽"
                description="Продающие страницы с высокой конверсией"
                href="/services/landing"
                number="01"
                keyId="landing"
              />
              <ServiceCard 
                title="Корпоративные сайты"
                price="от 50 000 ₽"
                description="Многостраничные решения для бизнеса"
                href="/services/corporate"
                number="02"
                keyId="corporate"
              />
              <ServiceCard 
                title="Интернет-магазины"
                price="от 100 000 ₽"
                description="E-commerce платформы любой сложности"
                href="/services/ecommerce"
                number="03"
                keyId="ecommerce"
              />
              <ServiceCard 
                title="Веб-приложения"
                price="индивидуально"
                description="SPA, PWA, сложные системы"
                href="/services/webapp"
                number="04"
                keyId="webapp"
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
  keyId
}: { 
  title: string; 
  price: string; 
  description: string; 
  href: string;
  number: string;
  keyId?: string;
}) => (
  <div className="relative bg-card p-10 group transition-all duration-500 block border border-border/30 hover:border-primary/30 overflow-hidden">
    {/* Background number */}
    <div className="absolute top-4 right-4 text-7xl font-display font-bold text-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:text-primary/10">
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
      
      {keyId && (
        <a 
          href={`#contact`}
          onClick={(e) => {
            e.preventDefault();
            // Navigate to contact with key parameter
            const contactSection = document.getElementById('contact');
            if (contactSection) {
              contactSection.scrollIntoView({ behavior: 'smooth' });
              // Dispatch custom event with key info
              window.dispatchEvent(new CustomEvent('selectKey', { detail: { keyId } }));
            }
          }}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-sm border border-primary/30 text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <KeyRound className="w-3 h-3" />
          Взять ключ
        </a>
      )}
    </div>
  </div>
);

export default WebDevSection;