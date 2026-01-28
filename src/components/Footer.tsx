import { Mail, Phone, Send } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <a href="#" className="text-2xl font-bold gradient-text mb-4 inline-block">
                24ZXC
              </a>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Цифровые решения для вашего бизнеса. Веб-разработка, реклама и полный спектр услуг.
              </p>
              <div className="flex gap-4">
                <a href="https://t.me/your_telegram" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Send className="w-5 h-5" />
                </a>
                <a href="mailto:info@24zxc.ru" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="tel:+7XXXXXXXXXX" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Услуги</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#webdev" className="hover:text-foreground transition-colors">Веб-разработка</a></li>
                <li><a href="#advertising" className="hover:text-foreground transition-colors">Реклама</a></li>
                <li><a href="#services" className="hover:text-foreground transition-colors">Каталог услуг</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Проект Синтагма</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Информация</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">О нас</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Портфолио</a></li>
                <li><a href="#contact" className="hover:text-foreground transition-colors">Контакты</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Политика конфиденциальности</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>© 2024 24ZXC. Все права защищены.</div>
            <div>Работаем по всей России</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
