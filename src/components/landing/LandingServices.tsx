import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { EDU_SERVICES, WEB_SERVICES, type LandingService } from "./landing-data";

const ServiceCard = ({ service }: { service: LandingService }) => {
  const Icon = service.icon;

  return (
    <Link
      to={service.href}
      className="landing-card-accent group flex min-h-40 flex-col rounded-md border bg-card p-5 transition-colors hover:bg-secondary/40"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="landing-gold-chip flex h-9 w-9 items-center justify-center rounded-md">
          <Icon className="h-4 w-4" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
      <h3 className="mt-5 font-medium text-foreground">{service.title}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
      <p className="mt-4 text-sm font-semibold landing-eyebrow">{service.price}</p>
    </Link>
  );
};

const ServiceGroup = ({ title, services }: { title: string; services: LandingService[] }) => (
  <div>
    <h3 className="mb-4 text-sm font-medium text-muted-foreground">{title}</h3>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {services.map((service) => <ServiceCard key={service.title} service={service} />)}
    </div>
  </div>
);

const LandingServices = () => (
  <section id="services" className="scroll-mt-20 border-b border-border bg-background">
    <span id="prices" className="block scroll-mt-20" />
    <div className="container px-4 py-16 md:py-20">
      <div className="mb-10 grid gap-5 lg:grid-cols-[280px_1fr] lg:gap-16">
        <div>
          <p className="landing-eyebrow mb-3 text-xs uppercase tracking-[0.24em]">Услуги и цены</p>
          <span className="landing-accent-rule" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-semibold tracking-tight md:text-4xl">
            Понятный результат и цена до старта
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Начинаем с задачи, согласовываем состав работ и закрепляем смету. Если проект нестандартный —
            сначала бесплатно оценим объём.
          </p>
        </div>
      </div>

      <div className="space-y-9">
        <ServiceGroup title="Сайты и продвижение" services={WEB_SERVICES} />
        <ServiceGroup title="Образовательным организациям" services={EDU_SERVICES} />
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-md border border-border bg-secondary/35 p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Нужны несколько услуг? Соберём единый план, смету и договор.
        </p>
        <Link to="/#contact" className="inline-flex items-center gap-1 font-semibold text-foreground">
          Получить расчёт <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </section>
);

export default LandingServices;
