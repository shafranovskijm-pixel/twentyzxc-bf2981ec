import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Lock, Check, icons } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AnimatedSection from "@/components/AnimatedSection";
import { useInventory } from "@/contexts/InventoryContext";
import { ServiceKey3D } from "@/components/game/ServiceKey3D";
import { toast } from "sonner";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  old_price: string | null;
  badge: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const LucideIcon = (icons as Record<string, any>)[name];
  if (!LucideIcon) return null;
  return <LucideIcon className={className} />;
};

// Tiny palm leaf SVG accent
const PalmAccent = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2c-1 3-3 5-6 6 2 1 4 3 5 5-1-1-3-2-5-2 1 2 2 5 2 8 1-3 2-5 4-7 0 2-1 4-2 5 2-1 4-3 5-5-1 0-2 0-3 1 1-2 2-4 2-7-2 1-3 3-4 5 0-3 1-6 2-9z" />
  </svg>
);

const keyVariants: Array<'gold' | 'silver' | 'bronze' | 'emerald'> = ['gold', 'silver', 'bronze', 'emerald'];

const DEADLINE = new Date("2026-03-31T23:59:59+03:00").getTime();

function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, expired: diff <= 0 };
}

const CountdownTimer = () => {
  const { d, h, m, s, expired } = useCountdown(DEADLINE);
  if (expired) return null;

  const units = [
    { value: d, label: "дн" },
    { value: h, label: "ч" },
    { value: m, label: "мин" },
    { value: s, label: "сек" },
  ];

  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-1.5 md:gap-2">
          <div className="flex flex-col items-center min-w-[2.5rem] md:min-w-[3rem] py-1.5 px-1 rounded-2xl bg-gradient-to-b from-amber-500/15 to-orange-500/10 border border-amber-500/25">
            <span className="text-base md:text-lg font-display font-bold text-primary tabular-nums leading-none">
              {String(u.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{u.label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="text-primary/40 text-sm font-bold">:</span>
          )}
        </div>
      ))}
    </div>
  );
};

const PromoCard = ({ promo, index }: { promo: Promotion; index: number }) => {
  const { addKey, isKeyCollected, useKey } = useInventory();
  const [isHovered, setIsHovered] = useState(false);

  const keyId = `promo-${promo.id}`;
  const variant = keyVariants[index % keyVariants.length];
  const collected = isKeyCollected(keyId);

  const handleTakeKey = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (collected) return;

    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    addKey(keyId, `🤝 ${promo.title}`, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  const handleApply = () => {
    if (!collected) {
      toast("🔑 Соберите ключ сотрудничества на этой карточке!", {
        description: "Нажмите на 3D-ключ справа внизу",
      });
      return;
    }

    useKey(keyId);
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className="relative tropical-card warm-card-glow group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Key */}
      {!collected && (
         <button
          onClick={handleTakeKey}
          className="absolute top-3 right-3 w-12 h-16 z-20 cursor-pointer hover:scale-110 transition-transform"
          title="Забрать ключ сотрудничества"
        >
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl" />
          <ServiceKey3D variant={variant} isHovered={isHovered} className="w-full h-full relative z-10" />
        </button>
      )}

      {/* Collected badge */}
      {collected && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 text-primary text-xs z-20">
          <Check className="w-3 h-3" />
          Ключ собран
        </div>
      )}

      <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-8">
        <div className="flex flex-col items-center gap-3 shrink-0">
          {promo.icon && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-xl scale-150" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/25 via-amber-400/15 to-orange-500/10 border border-amber-500/30 flex items-center justify-center shadow-[inset_0_1px_0_hsl(45_70%_70%/0.15)]">
                <DynamicIcon name={promo.icon} className="w-7 h-7 text-primary" />
              </div>
            </div>
          )}
          {promo.badge && (
            <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-primary border-amber-500/30 hover:bg-amber-500/25 text-xs px-3 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 mr-1" />
              {promo.badge}
            </Badge>
          )}
        </div>

        <div className="flex-1 text-center md:text-left min-w-0">
          <h3 className="text-lg md:text-xl font-display font-bold mb-2">{promo.title}</h3>
          {promo.description && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
              {promo.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 shrink-0 mr-16">
          <div className="flex items-baseline gap-3">
            {promo.old_price && (
              <span className="text-base text-muted-foreground line-through">{promo.old_price}</span>
            )}
            {promo.price && (
              <span className="text-2xl md:text-3xl font-display font-bold gradient-gold-text gold-glow-text">
                {promo.price}
              </span>
            )}
          </div>
          <Button
            variant={collected ? "hero" : "heroOutline"}
            size="sm"
            onClick={handleApply}
            className="relative"
          >
            {!collected && <Lock className="w-3.5 h-3.5 mr-1.5" />}
            Оставить заявку
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const PromotionSection = () => {
  const { data: promotions = [] } = useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Promotion[];
    },
  });

  if (promotions.length === 0) return null;

  return (
    <section id="promotions" className="py-32 relative overflow-hidden">
      {/* Soft warm sunset wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <PalmAccent className="w-5 h-5 text-amber-500/70" />
              <span className="text-sm tracking-[0.3em] uppercase text-primary italic font-display">Специальное предложение</span>
              <PalmAccent className="w-5 h-5 text-amber-500/70 scale-x-[-1]" />
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 gold-glow-text">
              <span className="gradient-gold-text">Акции</span>
            </h2>
            <div className="flex flex-col items-center gap-2 mb-2">
              <span className="text-xs tracking-widest uppercase text-muted-foreground">Предложение действует до 31 марта</span>
              <CountdownTimer />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {promotions.map((promo, index) => (
              <AnimatedSection key={promo.id} delay={index * 150} direction="up">
                <PromoCard promo={promo} index={index} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionSection;
