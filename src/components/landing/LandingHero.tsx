import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const QUICK_OFFERS = [
  { title: "Лендинг под ключ", price: "от 15 000 ₽", href: "/services/landing" },
  { title: "Яндекс Директ", price: "от 20 000 ₽", href: "/#services" },
  { title: "ФИС ФРДО", price: "24 000 ₽/год", href: "/frdo" },
];

const LandingHero = () => (
  <section className="border-b border-border bg-background">
    <div className="container px-4 py-14 md:py-20 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16">
        <div className="max-w-4xl">
          <p className="landing-eyebrow mb-3 text-xs uppercase tracking-[0.24em]">
            Сайты · Яндекс Директ · автоматизация
          </p>
          <span className="landing-accent-rule mb-7" />

          <h1 className="mb-7 text-4xl font-display font-semibold leading-[1.04] tracking-tight md:text-6xl lg:text-7xl">
            Цифровые решения
            <span className="block text-muted-foreground">без лишней сложности</span>
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Создаём сайты, приводим заявки из Яндекса и автоматизируем работу учебных центров.
            Объём, сроки и стоимость фиксируем в договоре.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="landing-gold-btn inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
            >
              Открыть CRM
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/#contact"
              className="landing-card-accent inline-flex items-center gap-2 rounded-md border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Получить расчёт
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {["Цена и этапы в договоре", "Работаем по всей России", "Ответим в течение дня"].map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 landing-eyebrow" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-lg border border-border bg-secondary/35 p-5 md:p-6" aria-label="Популярные услуги">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Быстрый старт</p>
          <div className="mt-4 divide-y divide-border">
            {QUICK_OFFERS.map((offer) => (
              <Link
                key={offer.title}
                to={offer.href}
                className="group flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <span className="text-sm font-medium text-foreground">{offer.title}</span>
                <span className="whitespace-nowrap text-sm landing-eyebrow">{offer.price}</span>
              </Link>
            ))}
          </div>
          <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            Точную смету дадим после короткого брифа. Без скрытых обязательных доплат.
          </p>
        </aside>
      </div>
    </div>
  </section>
);

export default LandingHero;
