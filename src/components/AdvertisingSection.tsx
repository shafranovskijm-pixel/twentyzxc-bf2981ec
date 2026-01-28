import { Button } from "@/components/ui/button";
import { Megaphone, Target, TrendingUp, BarChart3, Search, Users, ArrowRight } from "lucide-react";

const AdvertisingSection = () => {
  return (
    <section id="advertising" className="py-24 relative overflow-hidden bg-secondary/30">
      {/* Background effects */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Megaphone className="w-4 h-4" />
              Реклама
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Привлекаем <span className="gradient-text">клиентов</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Профессиональная настройка и ведение рекламных кампаний. Максимум результата при оптимальном бюджете
            </p>
          </div>

          {/* Services grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <AdCard 
              icon={<Search className="w-6 h-6" />}
              title="Яндекс.Директ"
              description="Контекстная реклама в поиске и РСЯ. Точное попадание в целевую аудиторию"
              features={["Поисковые кампании", "РСЯ", "Ретаргетинг"]}
            />
            <AdCard 
              icon={<Target className="w-6 h-6" />}
              title="Таргетированная реклама"
              description="Реклама в социальных сетях с точной настройкой на вашу аудиторию"
              features={["VK Реклама", "Telegram Ads", "MyTarget"]}
            />
            <AdCard 
              icon={<BarChart3 className="w-6 h-6" />}
              title="Google Ads"
              description="Контекстная и медийная реклама в Google для международных проектов"
              features={["Поиск", "КМС", "YouTube"]}
            />
          </div>

          {/* Stats */}
          <div className="glass-card rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <StatItem value="500+" label="Рекламных кампаний" />
              <StatItem value="30%" label="Средний рост конверсии" />
              <StatItem value="5M+" label="Рекламного бюджета" />
              <StatItem value="100+" label="Довольных клиентов" />
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button variant="hero" size="lg">
              Получить аудит рекламы
              <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Бесплатный анализ текущих рекламных кампаний
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

interface AdCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

const AdCard = ({ icon, title, description, features }: AdCardProps) => (
  <div className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 group">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm mb-4">{description}</p>
    <div className="flex flex-wrap gap-2">
      {features.map((feature) => (
        <span key={feature} className="px-3 py-1 rounded-full bg-secondary text-xs font-medium">
          {feature}
        </span>
      ))}
    </div>
  </div>
);

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

export default AdvertisingSection;
