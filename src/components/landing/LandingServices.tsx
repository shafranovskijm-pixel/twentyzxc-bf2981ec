import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { WEB_SERVICES, EDU_SERVICES, type LandingService } from "./landing-data";

const ServiceRow = ({ service }: { service: LandingService }) => {
  const Icon = service.icon;
  return (
    <Link
      to={service.href}
      className="landing-card-accent group flex items-start gap-4 p-6 border rounded-md bg-card transition-colors"
    >
      <span className="landing-gold-chip landing-eyebrow mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-medium">{service.title}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{service.price}</span>
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{service.description}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:[color:hsl(var(--gold))] transition-colors" />
    </Link>
  );
};

const LandingServices = () => (
  <section id="webdev" className="border-b border-border bg-background">
    <div className="container px-4 py-16 md:py-24">
      <div className="grid lg:grid-cols-[280px_1fr] gap-10 lg:gap-16">
        <div>
          <p className="landing-eyebrow text-xs tracking-[0.28em] uppercase mb-3">Услуги</p>
          <span className="landing-accent-rule mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
            Разработка и сопровождение
          </h2>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Прозрачные условия, фиксированные сметы и договор на каждый этап работ.
          </p>
        </div>

        <div className="space-y-10">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Веб-разработка</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {WEB_SERVICES.map((s) => <ServiceRow key={s.title} service={s} />)}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Образовательным организациям и реклама</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {EDU_SERVICES.map((s) => <ServiceRow key={s.title} service={s} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default LandingServices;