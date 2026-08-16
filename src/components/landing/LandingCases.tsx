import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { LANDING_CASES } from "./landing-data";

const LandingCases = () => (
  <section id="cases" className="border-b border-border bg-background">
    <div className="container px-4 py-16 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="landing-eyebrow text-xs tracking-[0.28em] uppercase mb-3">Кейсы</p>
          <span className="landing-accent-rule mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
            Задача, решение и результат
          </h2>
        </div>
        <Link
          to="/portfolio"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          Все проекты <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid gap-4">
        {LANDING_CASES.map((c) => (
          <a
            key={c.title}
            href={c.url}
            {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="landing-card-accent group rounded-lg border bg-card p-6 transition-colors hover:bg-secondary/40 md:p-8"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <span className="landing-gold-chip inline-flex rounded px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]">
                  {c.label}
                </span>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-xl font-semibold text-foreground md:text-2xl">{c.title}</h3>
                  <span className="text-sm text-muted-foreground">{c.subtitle}</span>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>

            <div className="mt-6 grid gap-5 border-t border-border pt-6 md:grid-cols-2 md:gap-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Задача</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{c.challenge}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Что сделали</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{c.solution}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex max-w-3xl items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 landing-eyebrow" />
                <span><strong className="font-medium text-foreground">Результат:</strong> {c.result}</span>
              </p>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <span key={t} className="landing-gold-chip text-[11px] px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
);

export default LandingCases;
