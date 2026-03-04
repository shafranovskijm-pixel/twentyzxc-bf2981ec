import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Diamond, Sparkles, icons } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
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

          {/* Promotion cards grid */}
          <div className={`grid gap-8 ${promotions.length >= 2 ? 'md:grid-cols-2' : ''}`}>
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="relative luxury-card rounded-sm p-8 md:p-10 border border-primary/20 hover:border-primary/40 transition-all group"
              >
                {/* Glow behind card */}
                <div className="absolute inset-0 rounded-sm bg-primary/3 blur-xl -z-10 group-hover:bg-primary/5 transition-colors" />

                {/* Corner decorations */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-primary/25" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-primary/25" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-primary/25" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-primary/25" />

                <div className="flex flex-col items-center text-center gap-6">
                  {/* Icon */}
                  {promo.icon && (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl scale-150" />
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                        <DynamicIcon name={promo.icon} className="w-9 h-9 text-primary" />
                      </div>
                    </div>
                  )}

                  {/* Badge */}
                  {promo.badge && (
                    <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/15 text-sm px-4 py-1">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {promo.badge}
                    </Badge>
                  )}

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-display font-bold">{promo.title}</h3>

                  {/* Description */}
                  {promo.description && (
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {promo.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-center gap-3">
                    {promo.old_price && (
                      <span className="text-lg text-muted-foreground line-through">{promo.old_price}</span>
                    )}
                    {promo.price && (
                      <span className="text-3xl md:text-4xl font-display font-bold gradient-gold-text gold-glow-text">
                        {promo.price}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="divider-gold w-24 mx-auto" />

                  {/* CTA */}
                  <Button
                    variant="hero"
                    size="default"
                    onClick={() => {
                      const contactSection = document.getElementById("contact");
                      if (contactSection) {
                        contactSection.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    Оставить заявку
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionSection;
