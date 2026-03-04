import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Diamond, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  old_price: string | null;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
}

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
        <div className="max-w-4xl mx-auto">
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

          {/* Promotion cards */}
          <div className="space-y-8">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="relative luxury-card rounded-sm p-8 md:p-12 text-center border border-primary/20 hover:border-primary/40 transition-all group"
              >
                {/* Glow behind card */}
                <div className="absolute inset-0 rounded-sm bg-primary/3 blur-xl -z-10 group-hover:bg-primary/5 transition-colors" />

                {/* Corner decorations */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-primary/25" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-primary/25" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-primary/25" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-primary/25" />

                {/* Badge */}
                {promo.badge && (
                  <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 hover:bg-primary/15 text-sm px-4 py-1">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {promo.badge}
                  </Badge>
                )}

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">{promo.title}</h3>

                {/* Description */}
                {promo.description && (
                  <p className="text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
                    {promo.description}
                  </p>
                )}

                {/* Price */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  {promo.old_price && (
                    <span className="text-xl text-muted-foreground line-through">{promo.old_price}</span>
                  )}
                  {promo.price && (
                    <span className="text-4xl md:text-5xl font-display font-bold gradient-gold-text gold-glow-text">
                      {promo.price}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className="divider-gold w-32 mx-auto mb-8" />

                {/* CTA */}
                <Button
                  variant="hero"
                  size="lg"
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
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionSection;
