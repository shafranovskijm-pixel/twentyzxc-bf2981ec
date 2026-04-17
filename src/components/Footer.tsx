import { Mail, Phone, Send, Copy, ExternalLink, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAchievements } from "@/contexts/AchievementsContext";
import heroSunset from "@/assets/hero-tropical-sunset.jpg";
import palmLeaf from "@/assets/palm-leaf.png";

// Tiny palm leaf SVG for divider accent
const PalmAccent = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2c-1 3-3 5-6 6 2 1 4 3 5 5-1-1-3-2-5-2 1 2 2 5 2 8 1-3 2-5 4-7 0 2-1 4-2 5 2-1 4-3 5-5-1 0-2 0-3 1 1-2 2-4 2-7-2 1-3 3-4 5 0-3 1-6 2-9z" />
  </svg>
);

const Footer = () => {
  const { toast } = useToast();
  const { unlockAchievement } = useAchievements();

  const handleSocialClick = () => {
    unlockAchievement('social');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано!",
      description: `${label} скопирован в буфер обмена`,
    });
  };

  return (
    <footer className="relative border-t border-amber-500/20 overflow-hidden">
      {/* Tropical sunset background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroSunset}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-full h-full object-cover opacity-50"
        />
        {/* Dark wash for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background/90" />
        {/* Warm vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, hsl(var(--background) / 0.7) 100%)",
          }}
        />
      </div>

      {/* Decorative palm leaves */}
      <img
        src={palmLeaf}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="hidden md:block absolute -top-4 -left-12 w-44 h-44 opacity-30 -rotate-[20deg] palm-sway pointer-events-none select-none z-[1]"
      />
      <img
        src={palmLeaf}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="hidden md:block absolute -bottom-8 -right-10 w-48 h-48 opacity-30 rotate-[160deg] scale-x-[-1] palm-sway pointer-events-none select-none z-[1]"
        style={{ animationDelay: "3s" }}
      />

      {/* Main Footer Content */}
      <div className="relative z-10 py-16">
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
                  {/* Telegram */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-10 h-10 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
                        <Send className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4" side="top">
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-primary">Telegram</div>
                        <div className="flex items-center justify-between gap-2 p-2 rounded bg-secondary/50">
                          <span className="text-sm">@Aliencorso</span>
                          <button 
                            onClick={() => copyToClipboard("@Aliencorso", "Telegram")}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <Button 
                          variant="hero" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            handleSocialClick();
                            window.open("https://t.me/Aliencorso", "_blank");
                          }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Открыть Telegram
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Email */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-10 h-10 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
                        <Mail className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4" side="top">
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-primary">Email</div>
                        <div className="flex items-center justify-between gap-2 p-2 rounded bg-secondary/50">
                          <span className="text-sm">24@24zxc.ru</span>
                          <button 
                            onClick={() => copyToClipboard("24@24zxc.ru", "Email")}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <Button 
                          variant="hero" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            handleSocialClick();
                            window.location.href = "mailto:24@24zxc.ru";
                          }}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Написать письмо
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Phone */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-10 h-10 rounded-sm border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
                        <Phone className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4" side="top">
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-primary">Телефон</div>
                        <div className="flex items-center justify-between gap-2 p-2 rounded bg-secondary/50">
                          <span className="text-sm">+7 914 721-34-24</span>
                          <button 
                            onClick={() => copyToClipboard("+79147213424", "Телефон")}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <Button 
                          variant="hero" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            handleSocialClick();
                            window.location.href = "tel:+79147213424";
                          }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Позвонить
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Links grid */}
              <div className="grid grid-cols-2 gap-8 backdrop-blur-md bg-background/30 rounded-lg p-6 -m-2">
                <div>
                  <h4 className="text-sm font-semibold tracking-widest uppercase text-primary mb-6">Сообщество</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li><Link to="/reviews" className="hover:text-foreground transition-colors">Отзывы</Link></li>
                    <li><Link to="/playground" className="hover:text-foreground transition-colors">Конструктор сайтов</Link></li>
                    <li><Link to="/templates" className="hover:text-foreground transition-colors">Каталог шаблонов</Link></li>
                    <li><a href="#" className="hover:text-foreground transition-colors">Синтагма</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold tracking-widest uppercase text-primary mb-6">Компания</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li><Link to="/about" className="hover:text-foreground transition-colors">О нас</Link></li>
                    <li><Link to="/portfolio" className="hover:text-foreground transition-colors">Портфолио</Link></li>
                    <li><a href="#contact" className="hover:text-foreground transition-colors">Контакты</a></li>
                    <li><Link to="/policy" className="hover:text-foreground transition-colors">Политика</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="divider-gold mb-8" />

            {/* Bottom */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <PalmAccent className="w-3.5 h-3.5 text-amber-500/80" />
                <span>© 2024 24ZXC. Все права защищены.</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Премиум решения по всей России</span>
                <Link to="/admin" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" title="Админ-панель">
                  <Lock className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
