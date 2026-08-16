import { ArrowUpRight, Lock, Mail, Phone, Send } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-background">
    <div className="container px-4 py-12 md:py-16">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
        <div>
          <Link to="/" className="text-2xl font-display font-semibold tracking-tight text-foreground">
            24<span className="landing-eyebrow">ZXC</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Сайты, Яндекс Директ и цифровые процессы для бизнеса и образовательных организаций.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Услуги</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><Link to="/services/landing" className="hover:text-foreground">Лендинги</Link></li>
            <li><Link to="/services/corporate" className="hover:text-foreground">Корпоративные сайты</Link></li>
            <li><Link to="/services/webapp" className="hover:text-foreground">Веб-приложения</Link></li>
            <li><Link to="/#services" className="hover:text-foreground">Яндекс Директ</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Образованию</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><Link to="/frdo" className="hover:text-foreground">ФИС ФРДО</Link></li>
            <li><Link to="/licensing" className="hover:text-foreground">Лицензирование</Link></li>
            <li><Link to="/services/nmo" className="hover:text-foreground">НМО Портал</Link></li>
            <li>
              <a href="https://синтагма.рф" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                Синтагма <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Связаться</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <a href="tel:+79147213424" className="inline-flex items-center gap-2 hover:text-foreground">
                <Phone className="h-4 w-4" /> +7 914 721-34-24
              </a>
            </li>
            <li>
              <a href="mailto:24@24zxc.ru" className="inline-flex items-center gap-2 hover:text-foreground">
                <Mail className="h-4 w-4" /> 24@24zxc.ru
              </a>
            </li>
            <li>
              <a href="https://t.me/Aliencorso" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
                <Send className="h-4 w-4" /> Telegram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} 24ZXC. Работаем по договору.</span>
        <div className="flex items-center gap-4">
          <Link to="/policy" className="hover:text-foreground">Политика конфиденциальности</Link>
          <Link to="/admin" className="inline-flex items-center gap-1 hover:text-foreground" aria-label="Войти в CRM">
            <Lock className="h-3.5 w-3.5" /> CRM
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
