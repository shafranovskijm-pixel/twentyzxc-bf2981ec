import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const STATS = [
  { value: "10+", label: "лет в разработке" },
  { value: "120+", label: "запущенных проектов" },
  { value: "24 ч", label: "срок ответа на заявку" },
];

const LandingHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative border-b border-border bg-background">
      <div className="container px-4 pt-36 pb-16 md:pt-44 md:pb-24">
        <div className="max-w-4xl">
          <p className="landing-eyebrow text-xs tracking-[0.28em] uppercase mb-3">
            Сайты · Реклама · Веб-приложения · Образование
          </p>
          <span className="landing-accent-rule mb-8" />

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-display font-semibold leading-[1.05] tracking-tight mb-8 cursor-pointer"
            onClick={() => navigate("/admin")}
            title="24ZXC"
          >
            24<span className="landing-eyebrow">ZXC</span> — цифровые решения
            <span className="block text-muted-foreground">под ключ</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-10">
            Разрабатываем сайты и веб-приложения, ведём рекламу в Яндекс Директ и сопровождаем
            образовательные организации: ФИС ФРДО, лицензирование, НМО.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/#contact"
              className="landing-gold-btn inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md hover:opacity-90 transition-opacity"
            >
              Обсудить проект
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/portfolio"
              className="landing-card-accent inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-md border text-foreground hover:bg-secondary transition-colors"
            >
              Портфолио
            </Link>
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-1 sm:grid-cols-3 border-t border-border">
          {STATS.map((s) => (
            <div key={s.label} className="py-6 sm:py-8 sm:pr-8 border-b sm:border-b-0 sm:border-r last:border-r-0 border-border">
              <dt className="landing-eyebrow text-3xl md:text-4xl font-display font-semibold tracking-tight">{s.value}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default LandingHero;