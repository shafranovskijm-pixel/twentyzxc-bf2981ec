import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Megaphone, BarChart3, ArrowRight, Diamond } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";

const platforms = [
  { 
    icon: Target, 
    name: "Яндекс.Директ", 
    tags: ["Поиск", "РСЯ", "Ретаргетинг"] 
  },
  { 
    icon: Megaphone, 
    name: "Таргет", 
    tags: ["VK", "Telegram", "MyTarget"] 
  },
  { 
    icon: BarChart3, 
    name: "Google Ads", 
    tags: ["Поиск", "КМС", "YouTube"] 
  },
];

const AdvertisingSection = () => {
  return (
    <section id="advertising" className="py-32 relative overflow-hidden bg-secondary/30">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
      
      <div className="container relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-4 mb-6">
              <Diamond className="w-5 h-5 text-primary" />
              <span className="text-sm tracking-[0.2em] uppercase text-primary">Реклама</span>
              <Diamond className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Привлекаем
              <span className="gradient-gold-text"> клиентов</span>
            </h2>
          </div>

          {/* Compact Platform Row */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16">
            {platforms.map((platform) => (
              <div 
                key={platform.name}
                className="flex items-center gap-3 px-6 py-4 luxury-card rounded-sm group hover:border-primary/40 transition-all"
              >
                <div className="w-10 h-10 rounded-full border border-primary/40 flex items-center justify-center text-primary group-hover:border-primary transition-colors">
                  <platform.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-sm">{platform.name}</span>
                  <div className="flex gap-1.5 mt-1">
                    {platform.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0 border-border text-muted-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats - Inline */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16">
            <AnimatedStat value={500} suffix="+" label="кампаний" />
            <AnimatedStat value={30} suffix="%" label="рост конверсии" />
            <AnimatedStat value={5} suffix="M+" label="бюджет" />
            <AnimatedStat value={100} suffix="+" label="клиентов" />
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Получить аудит
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const AnimatedStat = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { ref, displayValue } = useCountUp({ end: value, suffix, duration: 2000 });
  
  return (
    <div ref={ref} className="text-center">
      <span className="text-3xl md:text-4xl font-display font-bold gradient-gold-text">
        {displayValue}
      </span>
      <span className="text-sm text-muted-foreground ml-2">{label}</span>
    </div>
  );
};

export default AdvertisingSection;