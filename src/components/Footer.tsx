import { Mail, Phone, Send, Diamond } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Top section */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Brand */}
            <div>
              <a href="#" className="text-3xl font-display font-bold gradient-gold-text mb-6 inline-block">
                24ZXC
              </a>
              <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
                Премиальные цифровые решения для бизнеса. Веб-разработка, реклама и полный спектр услуг.
              </p>
              <div className="flex gap-3">
                <SocialLink href="https://t.me/your_telegram" icon={<Send className="w-4 h-4" />} />
                <SocialLink href="mailto:info@24zxc.ru" icon={<Mail className="w-4 h-4" />} />
                <SocialLink href="tel:+7XXXXXXXXXX" icon={<Phone className="w-4 h-4" />} />
              </div>
            </div>

            {/* Links grid */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-semibold tracking-widest uppercase text-primary mb-6">Услуги</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><a href="#webdev" className="hover:text-foreground transition-colors">Веб-разработка</a></li>
                  <li><a href="#advertising" className="hover:text-foreground transition-colors">Реклама</a></li>
                  <li><a href="#services" className="hover:text-foreground transition-colors">Каталог услуг</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Синтагма</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold tracking-widest uppercase text-primary mb-6">Компания</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">О нас</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Портфолио</a></li>
                  <li><a href="#contact" className="hover:text-foreground transition-colors">Контакты</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Политика</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="divider-gold mb-8" />

          {/* Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Diamond className="w-3 h-3 text-primary" />
              <span>© 2024 24ZXC. Все права защищены.</span>
            </div>
            <div>Премиум решения по всей России</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ href, icon }: { href: string; icon: React.ReactNode }) => (
  <a 
    href={href} 
    className="w-10 h-10 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
  >
    {icon}
  </a>
);

export default Footer;