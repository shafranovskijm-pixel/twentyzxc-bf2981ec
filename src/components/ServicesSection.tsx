import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Car, 
  Briefcase, 
  Wrench, 
  Camera, 
  GraduationCap,
  Heart,
  Scale,
  Truck,
  ShieldCheck,
  ArrowRight,
  Plus
} from "lucide-react";

const services = [
  { icon: Building2, title: "Недвижимость", description: "Покупка, продажа, аренда" },
  { icon: Car, title: "Авто", description: "Подбор, оформление, страхование" },
  { icon: Briefcase, title: "Бизнес-услуги", description: "Консалтинг, бухгалтерия" },
  { icon: Wrench, title: "Ремонт", description: "Техника, авто, помещения" },
  { icon: Camera, title: "Фото и видео", description: "Съёмка, монтаж, продакшн" },
  { icon: GraduationCap, title: "Образование", description: "Курсы, репетиторы" },
  { icon: Heart, title: "Здоровье", description: "Медицина, красота, фитнес" },
  { icon: Scale, title: "Юридические", description: "Консультации, документы" },
  { icon: Truck, title: "Грузоперевозки", description: "Доставка, логистика" },
  { icon: ShieldCheck, title: "Безопасность", description: "Охрана, видеонаблюдение" },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 relative overflow-hidden">
      <div className="container relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Building2 className="w-4 h-4" />
              Каталог услуг
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Все услуги в <span className="gradient-text">одном месте</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Широкий спектр услуг и направлений — находите нужное быстро и удобно
            </p>
          </div>

          {/* Services grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            {services.map((service, index) => (
              <ServiceCard 
                key={service.title}
                icon={service.icon}
                title={service.title}
                description={service.description}
                delay={index * 0.05}
              />
            ))}
            
            {/* Coming soon card */}
            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center text-center border-dashed opacity-60 hover:opacity-100 transition-opacity cursor-pointer min-h-[140px]">
              <Plus className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Ещё больше</span>
              <span className="text-xs text-muted-foreground/70">скоро</span>
            </div>
          </div>

          {/* SEO note */}
          <div className="glass-card rounded-2xl p-6 md:p-8 text-center">
            <h3 className="text-xl font-semibold mb-3">Полный каталог услуг</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Мы постоянно расширяем каталог услуг и направлений. Если не нашли нужное — свяжитесь с нами, и мы подберём решение
            </p>
            <Button variant="heroOutline" size="lg">
              Смотреть все услуги
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

interface ServiceCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay: number;
}

const ServiceCard = ({ icon: Icon, title, description, delay }: ServiceCardProps) => (
  <div 
    className="glass-card rounded-xl p-4 hover:border-primary/50 transition-all duration-300 group cursor-pointer text-center min-h-[140px] flex flex-col items-center justify-center animate-fade-in"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6" />
    </div>
    <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{title}</h4>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

export default ServicesSection;
