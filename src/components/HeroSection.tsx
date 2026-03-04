import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Decorative corner elements */}
      <div className="absolute top-20 left-20 w-px h-40 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
      <div className="absolute top-40 left-20 w-20 h-px bg-gradient-to-r from-primary/30 to-transparent" />
      <div className="absolute top-20 left-20 w-3 h-3 border border-primary/30 rotate-45" />
      
      <div className="absolute bottom-20 right-20 w-px h-40 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-40 right-20 w-20 h-px bg-gradient-to-l from-primary/30 to-transparent" />
      <div className="absolute bottom-20 right-20 w-3 h-3 border border-primary/30 rotate-45" />

      {/* Additional corner ornaments */}
      <div className="absolute top-20 right-20 w-16 h-16 border-t border-r border-primary/15" />
      <div className="absolute bottom-20 left-20 w-16 h-16 border-b border-l border-primary/15" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full border border-primary/10 animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full border border-primary/5 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full bg-primary/5 blur-2xl animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-24 h-24 rounded-full bg-primary/8 blur-xl animate-float" style={{ animationDelay: '1s' }} />
      

      {/* Decorative diamonds scattered */}
      <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-primary/20 rotate-45" />
      <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-primary/15 rotate-45" />
      <div className="absolute bottom-[30%] left-[15%] w-2.5 h-2.5 border border-primary/20 rotate-45" />
      <div className="absolute bottom-[20%] right-[10%] w-2 h-2 border border-primary/15 rotate-45" />

      {/* Horizontal gold lines */}
      <div className="absolute top-[30%] left-0 w-32 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      <div className="absolute bottom-[35%] right-0 w-40 h-px bg-gradient-to-l from-transparent via-primary/15 to-transparent" />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <div className="inline-flex items-center gap-3 mb-8 animate-fade-in">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
            <span className="text-sm tracking-[0.3em] uppercase text-primary font-light">Premium Digital Solutions</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
          </div>

          {/* Main heading with golden glow */}
          <h1 className="mb-8 animate-fade-in relative" style={{ animationDelay: '0.1s' }}>
            {/* Glow layer behind text */}
            <span className="absolute inset-0 flex items-center justify-center text-6xl md:text-8xl lg:text-9xl font-display font-bold text-primary/30 blur-2xl" aria-hidden="true">
              24ZXC
            </span>
            <span className="block text-6xl md:text-8xl lg:text-9xl font-display font-bold tracking-tight relative">
              <span className="gradient-gold-text gold-glow-text">24ZXC</span>
              <span className="absolute inset-0 gradient-gold-text shimmer">24ZXC</span>
            </span>
          </h1>

          {/* Divider */}
          <div className="divider-gold w-48 mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }} />
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-light tracking-wide animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Эксклюзивные цифровые решения
          </p>
          
          <p className="text-base text-muted-foreground/70 max-w-xl mx-auto mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Веб-разработка премиум-класса, стратегическая реклама и полный спектр бизнес-услуг
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Button variant="hero" size="xl" asChild>
              <a href="#contact">
                <Sparkles className="w-5 h-5" />
                Начать проект
              </a>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/portfolio">
                Портфолио
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Bottom services preview */}
        <div className="mt-24 grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <ServiceStat number="01" label="Веб-разработка" />
          <ServiceStat number="02" label="Реклама" />
          <ServiceStat number="03" label="Услуги" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-transparent" />
        </div>
      </div>
    </section>
  );
};

const ServiceStat = ({ number, label }: { number: string; label: string }) => (
  <div className="text-center group cursor-pointer">
    <div className="text-3xl font-display font-bold text-primary/40 group-hover:text-primary transition-colors mb-2">
      {number}
    </div>
    <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors tracking-wide">
      {label}
    </div>
    <div className="h-px w-0 group-hover:w-full bg-primary/30 mx-auto mt-3 transition-all duration-500" />
  </div>
);

export default HeroSection;
