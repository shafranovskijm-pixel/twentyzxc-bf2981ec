import { ArrowUpRight } from "lucide-react";
import { LANDING_CASES } from "./landing-data";

const LandingCases = () => (
  <section id="cases" className="border-b border-border bg-secondary/40">
    <div className="container px-4 py-16 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="landing-eyebrow text-xs tracking-[0.28em] uppercase mb-3">Кейсы</p>
          <span className="landing-accent-rule mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
            Реальные проекты и метрики
          </h2>
        </div>
        <a
          href="/portfolio"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          Все проекты <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      <div className="border border-border rounded-md overflow-hidden bg-card">
        {LANDING_CASES.map((c) => (
          <a
            key={c.title}
            href={c.url}
            {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group grid md:grid-cols-[130px_1fr_auto] gap-4 md:gap-8 items-start p-6 border-b border-border last:border-b-0 hover:bg-secondary/60 transition-colors"
          >
            <div>
              <div className="landing-eyebrow text-2xl font-display font-semibold tracking-tight">{c.metric}</div>
              <div className="text-xs text-muted-foreground">{c.metricLabel}</div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-medium">{c.title}</span>
                <span className="text-sm text-muted-foreground">{c.subtitle}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{c.result}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <span key={t} className="landing-gold-chip text-[11px] px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>
        ))}
      </div>
    </div>
  </section>
);

export default LandingCases;