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
  ArrowRight,
  Diamond
} from "lucide-react";

const services = [
  { icon: Building2, title: "Недвижимость", desc: "Покупка • Продажа • Аренда" },
  { icon: Car, title: "Авто", desc: "Подбор • Оформление • Страхование" },
  { icon: Briefcase, title: "Бизнес", desc: "Консалтинг • Бухгалтерия • Юристы" },
  { icon: Wrench, title: "Ремонт", desc: "Техника • Авто • Помещения" },
  { icon: Camera, title: "Продакшн", desc: "Фото • Видео • Монтаж" },
  { icon: GraduationCap, title: "Образование", desc: "Курсы • Репетиторы • Школы" },
  { icon: Heart, title: "Здоровье", desc: "Медицина • Красота • Фитнес" },
  { icon: Scale, title: "Юридические", desc: "Консультации • Документы" },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-32 relative overflow-hidden">
      <div className="container relative z-10 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-20">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <Diamond className="w-5 h-5 text-primary" />
                <span className="text-sm tracking-[0.2em] uppercase text-primary">Каталог</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-bold">
                Все услуги
                <br />
                <span className="gradient-gold-text">в одном месте</span>
              </h2>
            </div>
            <p className="text-muted-foreground max-w-md md:text-right">
              Расширяющийся каталог услуг и направлений. Всё, что нужно вашему бизнесу и жизни.
            </p>
          </div>

          {/* Services grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border mb-16">
            {services.map((service, index) => (
              <ServiceCard 
                key={service.title}
                icon={service.icon}
                title={service.title}
                description={service.desc}
                index={index + 1}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="luxury-card rounded-sm p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-display font-semibold mb-2">
                Не нашли нужное?
              </h3>
              <p className="text-muted-foreground">
                Свяжитесь с нами — подберём решение для вашей задачи
              </p>
            </div>
            <Button variant="hero" size="lg">
              Связаться
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
  index: number;
}

const ServiceCard = ({ icon: Icon, title, description, index }: ServiceCardProps) => (
  <div className="bg-card p-8 group cursor-pointer hover:bg-secondary/50 transition-all duration-300 relative">
    <span className="absolute top-4 right-4 text-xs text-muted-foreground/30 font-mono">
      {String(index).padStart(2, '0')}
    </span>
    
    <div className="w-14 h-14 rounded-sm border border-primary/20 flex items-center justify-center text-primary mb-6 group-hover:border-primary/50 transition-colors">
      <Icon className="w-6 h-6" />
    </div>
    
    <h4 className="text-lg font-display font-semibold mb-2 group-hover:text-primary transition-colors">
      {title}
    </h4>
    <p className="text-sm text-muted-foreground">
      {description}
    </p>
  </div>
);

export default ServicesSection;