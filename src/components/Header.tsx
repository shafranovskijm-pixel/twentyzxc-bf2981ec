import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/#services", label: "Услуги и цены" },
  { href: "/#cases", label: "Кейсы" },
  { href: "/#syntagma", label: "Синтагма" },
  { href: "/frdo", label: "Образованию" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container px-4">
        <div className="flex h-16 items-center justify-between gap-5">
          <Link
            to="/"
            className="inline-flex items-baseline gap-2 text-xl font-display font-semibold tracking-tight text-foreground"
            aria-label="24ZXC — на главную"
            onClick={() => setIsOpen(false)}
          >
            <span>24<span className="landing-eyebrow">ZXC</span></span>
            <span className="hidden text-[11px] font-sans font-normal tracking-normal text-muted-foreground sm:inline">
              цифровые решения
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Основная навигация">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href="tel:+79147213424"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              +7 914 721-34-24
            </a>
            <Link
              to="/#contact"
              className="landing-gold-btn inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            >
              Получить расчёт
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
            aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isOpen && (
          <nav id="mobile-navigation" className="border-t border-border py-3 lg:hidden" aria-label="Мобильная навигация">
            <div className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="border-b border-border py-3 text-base text-foreground last:border-b-0"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/#contact"
                className="landing-gold-btn mt-3 inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold"
                onClick={() => setIsOpen(false)}
              >
                Получить расчёт
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
