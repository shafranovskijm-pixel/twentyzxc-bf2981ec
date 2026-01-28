import { Button } from "@/components/ui/button";
import { Megaphone, Target, BarChart3, ArrowRight, Diamond } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";

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
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-4 mb-6">
              <Diamond className="w-5 h-5 text-primary" />
              <span className="text-sm tracking-[0.2em] uppercase text-primary">Реклама</span>
              <Diamond className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Привлекаем
              <span className="gradient-gold-text"> клиентов</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Стратегическая настройка рекламных кампаний с фокусом на результат
            </p>
          </div>

          {/* Services */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <AdCard 
              icon={<Target className="w-8 h-8" />}
              title="Яндекс.Директ"
              features={["Поисковые кампании", "РСЯ", "Ретаргетинг", "Аналитика"]}
            />
            <AdCard 
              icon={<Megaphone className="w-8 h-8" />}
              title="Таргет"
              features={["VK Реклама", "Telegram Ads", "MyTarget", "Look-alike"]}
            />
            <AdCard 
              icon={<BarChart3 className="w-8 h-8" />}
              title="Google Ads"
              features={["Поиск", "КМС", "YouTube", "Ремаркетинг"]}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <AnimatedStatBlock value={500} suffix="+" label="Кампаний запущено" />
            <AnimatedStatBlock value={30} suffix="%" label="Рост конверсии" />
            <AnimatedStatBlock value={5} suffix="M+" label="Рекламный бюджет" />
            <AnimatedStatBlock value={100} suffix="+" label="Клиентов" />
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-muted-foreground mb-6">Бесплатный аудит текущих рекламных кампаний</p>
            <Button variant="hero" size="xl">
              Получить аудит
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

interface AdCardProps {
  icon: React.ReactNode;
  title: string;
  features: string[];
}

const AdCard = ({ icon, title, features }: AdCardProps) => (
  <div className="luxury-card rounded-sm p-10 group transition-all duration-500 text-center">
    <div className="w-20 h-20 rounded-full border-2 border-primary/40 flex items-center justify-center text-primary mx-auto mb-8 group-hover:border-primary group-hover:shadow-[0_0_30px_hsl(45_80%_55%/0.2)] transition-all duration-500">
      {icon}
    </div>
    <h3 className="text-2xl font-display font-semibold mb-6">{title}</h3>
    <ul className="space-y-3">
      {features.map((feature) => (
        <li key={feature} className="text-muted-foreground text-sm flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

const AnimatedStatBlock = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { ref, displayValue } = useCountUp({ end: value, suffix, duration: 2000 });
  
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-5xl font-display font-bold gradient-gold-text mb-2">
        {displayValue}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

export default AdvertisingSection;