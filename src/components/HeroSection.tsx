import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, GraduationCap, Code2, Megaphone, AppWindow } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroSunset from "@/assets/hero-tropical-sunset.jpg";
import palmLeaf from "@/assets/palm-leaf.png";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Tropical sunset background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroSunset}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="w-full h-full object-cover opacity-70"
        />
        {/* Vignette top */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-transparent" />
        {/* Dark fade to bottom for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/20" />
        {/* Side warm glow vignette */}
        <div className="absolute inset-0 bg-radial-vignette" style={{
          background: "radial-gradient(ellipse at center, transparent 30%, hsl(var(--background) / 0.7) 100%)",
        }} />
      </div>

      {/* Palm leaf decorations — desktop only.
          Layout per spec: top-left palm sits between 24ZXC logo and edu menu (around top: 80px, smaller).
          Top-right and bottom-left removed. Bottom-right kept. */}
      <img
        src={palmLeaf}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="hidden md:block absolute top-20 left-4 lg:left-12 w-44 h-44 lg:w-52 lg:h-52 opacity-35 -rotate-[35deg] palm-sway pointer-events-none select-none z-[5]"
      />
      <img
        src={palmLeaf}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="hidden lg:block absolute bottom-8 -right-12 w-60 h-60 opacity-30 rotate-[160deg] scale-x-[-1] palm-sway pointer-events-none select-none"
        style={{ animationDelay: "4.5s" }}
      />

      {/* Floating orbs (kept, softened) */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full border border-primary/10 animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full border border-primary/5 animate-float" style={{ animationDelay: '2s' }} />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <div className="inline-flex items-center gap-3 mb-8 animate-fade-in">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/60" />
            <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-light">Под ключ · Под пальмами</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/60" />
          </div>

          {/* Main heading */}
          <h1
            className="mb-8 animate-fade-in relative cursor-pointer"
            style={{ animationDelay: '0.1s' }}
            onClick={() => navigate('/admin')}
            title="Админ-панель"
          >
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

          <p className="text-xl md:text-3xl font-display italic text-foreground/95 mb-4 tracking-wide animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Доверьте сайт, рекламу и приложения — <br className="hidden sm:block" /> а сами отдыхайте
          </p>

          <p className="text-base text-muted-foreground/80 max-w-xl mx-auto mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Веб-разработка, реклама в Яндекс Директ и веб-приложения премиум-класса. Полный цикл — от идеи до запуска и поддержки.
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

          {/* Education organisations CTA */}
          <div className="mt-6 flex justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Link
              to="/services/nmo"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-orange-500/10 backdrop-blur-sm text-sm text-foreground/90 hover:border-amber-400 hover:bg-amber-500/15 hover:shadow-[0_8px_24px_-8px_hsl(20_85%_55%/0.4)] transition-all duration-300 group"
            >
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>Образовательным организациям</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Bottom services pill navigation */}
        <div className="mt-16 flex flex-wrap justify-center gap-3 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <ServicePill icon={Code2} label="Веб-разработка" to="/templates" />
          <ServicePill icon={Megaphone} label="Реклама" to="/#advertising" />
          <ServicePill icon={AppWindow} label="Веб-приложения" to="/services/webapp" />
          <ServicePill icon={GraduationCap} label="Образование" to="/services/nmo" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-primary/60 to-transparent" />
        </div>
      </div>
    </section>
  );
};

const ServicePill = ({
  icon: Icon,
  label,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
}) => (
  <Link
    to={to}
    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-orange-500/10 backdrop-blur-sm text-sm text-foreground/90 hover:border-amber-400 hover:bg-amber-500/15 hover:shadow-[0_8px_24px_-8px_hsl(20_85%_55%/0.4)] transition-all duration-300 group"
  >
    <Icon className="w-4 h-4 text-primary" />
    <span>{label}</span>
    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
  </Link>
);

export default HeroSection;
