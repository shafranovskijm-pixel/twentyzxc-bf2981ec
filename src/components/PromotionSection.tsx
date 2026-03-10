import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Diamond, Sparkles, Lock, Check, icons } from "lucide-react";
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

const keyVariants: Array<'gold' | 'silver' | 'bronze' | 'emerald'> = ['gold', 'silver', 'bronze', 'emerald'];

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

    // Use the key and scroll to contact
    useKey(keyId);
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className="relative luxury-card rounded-sm border-l-2 border-primary/40 border-t border-r border-b border-t-primary/15 border-r-primary/15 border-b-primary/15 hover:border-l-primary/70 hover:border-t-primary/25 hover:border-r-primary/25 hover:border-b-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.08)] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 rounded-sm bg-primary/0 group-hover:bg-primary/[0.02] transition-colors duration-300" />

      {/* 3D Key */}
      {!collected && (
         <button
          onClick={handleTakeKey}
          className="absolute top-3 right-3 w-12 h-16 z-20 cursor-pointer hover:scale-110 transition-transform"
          title="Забрать ключ сотрудничества"
        >
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
          <ServiceKey3D variant={variant} isHovered={isHovered} className="w-full h-full relative z-10" />
        </button>
      )}

      {/* Collected badge */}
      {collected && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-sm bg-primary/10 border border-primary/30 text-primary text-xs z-20">
          <Check className="w-3 h-3" />
          Ключ собран
        </div>
      )}

      <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-8">
        <div className="flex flex-col items-center gap-3 shrink-0">
          {promo.icon && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-lg scale-150" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <DynamicIcon name={promo.icon} className="w-7 h-7 text-primary" />
              </div>
            </div>
          )}
          {promo.badge && (
            <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/15 text-xs px-3 py-0.5">
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
    <section id="promotions" className="py-32 relative overflow-hidden bg-secondary/30">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <Diamond className="w-5 h-5 text-primary" />
              <span className="text-sm tracking-[0.2em] uppercase text-primary">Специальное предложение</span>
              <Diamond className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 gold-glow-text">
              <span className="gradient-gold-text">Акции</span>
            </h2>
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
