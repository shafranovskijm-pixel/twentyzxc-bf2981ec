import { ChevronDown } from "lucide-react";
import { LANDING_FAQS } from "./landing-data";

const LandingFaq = () => (
  <section className="border-b border-border bg-background">
    <div className="container px-4 py-16 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
        <div>
          <p className="landing-eyebrow mb-3 text-xs uppercase tracking-[0.24em]">Коротко о работе</p>
          <span className="landing-accent-rule mb-4" />
          <h2 className="text-3xl font-display font-semibold tracking-tight">Частые вопросы</h2>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {LANDING_FAQS.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-medium text-foreground">
                {faq.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="max-w-2xl pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default LandingFaq;
