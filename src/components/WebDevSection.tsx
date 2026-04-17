import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code2, Layers, Zap, ArrowUpRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import webdevTropicalBg from "@/assets/webdev-tropical-bg.jpg";
import cardBgLanding from "@/assets/card-bg-landing.jpg";
import cardBgCorporate from "@/assets/card-bg-corporate.jpg";
import cardBgEcommerce from "@/assets/card-bg-ecommerce.jpg";
import cardBgWebapp from "@/assets/card-bg-webapp.jpg";
import { useInventory } from "@/contexts/InventoryContext";
import { useAchievements } from "@/contexts/AchievementsContext";
import { ServiceKey3D } from "@/components/game/ServiceKey3D";

// Tiny palm accent
const PalmAccent = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2c-1 3-3 5-6 6 2 1 4 3 5 5-1-1-3-2-5-2 1 2 2 5 2 8 1-3 2-5 4-7 0 2-1 4-2 5 2-1 4-3 5-5-1 0-2 0-3 1 1-2 2-4 2-7-2 1-3 3-4 5 0-3 1-6 2-9z" />
  </svg>
);

// Syntagma card — modern minimalist style aligned with sintagma.com.ru
const SyntagmaCard = () => {
  const { unlockAchievement } = useAchievements();
  const [hasHovered, setHasHovered] = useState(false);

  const handleMouseEnter = () => {
    if (!hasHovered) {
      setHasHovered(true);
      unlockAchievement('syntagma_gates');
    }
  };

  return (
    <div
      className="tropical-card warm-card-glow p-8 md:p-12 mb-16 relative group"
      onMouseEnter={handleMouseEnter}
    >
      <div className="relative z-10">
        {/* Logo block: Σ mark + brand */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <div className="syntagma-logo-mark">Σ</div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-syntagma-brand text-base text-foreground/95">СИНТАГМА</span>
            <span className="w-1 h-1 rounded-full bg-[hsl(var(--syntagma-accent))]" />
            <span className="text-sm text-muted-foreground font-sans">Облачная LMS-платформа</span>
          </div>
        </div>

        {/* Headline — modern serif */}
        <h3 className="font-syntagma text-4xl md:text-5xl font-semibold leading-[1.1] mb-5 text-foreground/95 max-w-2xl">
          Обучение и документы<br />в одной системе
        </h3>
        <div className="syntagma-accent-line mb-8" />

        <p className="text-muted-foreground max-w-2xl mb-10 leading-relaxed font-sans">
          Облачная LMS-платформа для автоматизации образовательных процессов. Разработка любых решений с использованием облачных технологий для компаний любого размера.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <FeatureItem icon={<Zap />} title="Автоматизация" desc="Ключевых бизнес-процессов" />
          <FeatureItem icon={<Layers />} title="Облачные решения" desc="Масштабируемая инфраструктура" />
          <FeatureItem icon={<Code2 />} title="Интеграции" desc="Moodle, ФРДО, API" />
        </div>

        <a href="https://синтагма.рф" target="_blank" rel="noopener noreferrer" className="syntagma-pill">
          Подробнее о проекте
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

const WebDevSection = () => {
  return (
    <section id="webdev" className="py-32 relative overflow-hidden">
      {/* Painted tropical background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={webdevTropicalBg}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/45 to-background/80" />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, hsl(var(--background) / 0.7) 100%)",
          }}
        />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <PalmAccent className="w-5 h-5 text-amber-500/70" />
                <span className="text-sm tracking-[0.3em] uppercase text-primary italic font-display">Веб-разработка</span>
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
          <SyntagmaCard />

          {/* Services grid — no corner brackets, soft tropical cards */}
          <div className="relative overflow-visible">
            <div id="service-keys" className="grid md:grid-cols-2 gap-6 overflow-visible">
              <ServiceCard
                title="Лендинги"
                price="от 15 000 ₽"
                description="Продающие страницы с высокой конверсией"
                href="/services/landing"
                number="01"
                keyId="landing"
                keyVariant="gold"
                bgImage={cardBgLanding}
              />
              <ServiceCard
                title="Корпоративные сайты"
                price="от 50 000 ₽"
                description="Многостраничные решения для бизнеса"
                href="/services/corporate"
                number="02"
                keyId="corporate"
                keyVariant="silver"
                bgImage={cardBgCorporate}
              />
              <ServiceCard
                title="Интернет-магазины"
                price="от 100 000 ₽"
                description="E-commerce платформы любой сложности"
                href="/services/ecommerce"
                number="03"
                keyId="ecommerce"
                keyVariant="bronze"
                bgImage={cardBgEcommerce}
              />
              <ServiceCard
                title="Веб-приложения"
                price="индивидуально"
                description="SPA, PWA, сложные системы"
                href="/services/webapp"
                number="04"
                keyId="webapp"
                keyVariant="emerald"
                bgImage={cardBgWebapp}
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
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-primary shadow-[inset_0_1px_0_hsl(45_70%_70%/0.15)] shrink-0">
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
  keyVariant = 'gold',
  bgImage,
}: {
  title: string;
  price: string;
  description: string;
  href: string;
  number: string;
  keyId?: string;
  keyVariant?: 'gold' | 'silver' | 'bronze' | 'emerald';
  bgImage?: string;
}) => {
  const { addKey, isKeyCollected } = useInventory();
  const [isHovered, setIsHovered] = useState(false);
  const isCollected = keyId ? isKeyCollected(keyId) : false;

  const handleTakeKey = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!keyId || isCollected) return;

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
      className="relative tropical-card warm-card-glow p-8 md:p-10 group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* AI-painted tropical background */}
      {bgImage && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={bgImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={1024}
            height={768}
            className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/70 to-background/90" />
        </div>
      )}
      {/* 3D Key — clickable */}
      {keyId && !isCollected && (
        <button
          onClick={handleTakeKey}
          className="absolute bottom-4 right-4 w-16 h-20 z-20 cursor-pointer hover:scale-110 transition-transform"
        >
          <div className="absolute inset-0 bg-amber-500/25 rounded-full blur-xl" />
          <ServiceKey3D variant={keyVariant} isHovered={isHovered} className="w-full h-full relative z-10" />
        </button>
      )}

      {/* Collected badge */}
      {keyId && isCollected && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 text-primary text-xs z-20">
          <Check className="w-3 h-3" />
          Собран
        </div>
      )}

      {/* Background number */}
      <div className="absolute top-4 left-4 text-7xl font-display font-bold text-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:text-amber-500/[0.10]">
        {number}
      </div>

      <div className="relative z-10 flex items-start justify-between mb-4">
        <h4 className="text-xl font-display font-semibold group-hover:text-primary transition-colors">{title}</h4>
        <span className="text-primary text-sm font-medium shimmer">{price}</span>
      </div>
      <p className="relative z-10 text-muted-foreground text-sm mb-6">{description}</p>

      <div className="relative z-10 flex items-center justify-between gap-4">
        <Link
          to={href}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors"
        >
          <span>Подробнее</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
        </Link>
      </div>
    </div>
  );
};

export default WebDevSection;
