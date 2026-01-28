import { Button } from "@/components/ui/button";
import { Mail, Phone, Send, MapPin, Clock, Diamond, ArrowUpRight } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-32 relative overflow-hidden bg-secondary/30">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-primary/30 to-transparent" />
      
      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
              <Diamond className="w-5 h-5 text-primary" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Начнём
              <span className="gradient-gold-text"> сотрудничество</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Первая консультация бесплатно
            </p>
          </div>

          {/* Contact grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <ContactCard 
              icon={<Phone className="w-6 h-6" />}
              title="Телефон"
              value="+7 (XXX) XXX-XX-XX"
              href="tel:+7XXXXXXXXXX"
            />
            <ContactCard 
              icon={<Mail className="w-6 h-6" />}
              title="Email"
              value="info@24zxc.ru"
              href="mailto:info@24zxc.ru"
            />
            <ContactCard 
              icon={<Send className="w-6 h-6" />}
              title="Telegram"
              value="@your_telegram"
              href="https://t.me/your_telegram"
            />
          </div>

          {/* Main CTA */}
          <div className="luxury-card rounded-sm p-12 md:p-16 text-center">
            <h3 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Обсудим ваш проект
            </h3>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
              Расскажите о задаче, и мы предложим оптимальное решение. Ответ в течение 24 часов.
            </p>
            
            <Button variant="hero" size="xl" className="mb-10">
              Оставить заявку
              <ArrowUpRight className="w-5 h-5" />
            </Button>

            <div className="divider-gold mb-10" />

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary" />
                <span>Ответ 24ч</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Вся Россия</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface ContactCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  href: string;
}

const ContactCard = ({ icon, title, value, href }: ContactCardProps) => (
  <a 
    href={href}
    className="luxury-card rounded-sm p-8 text-center group block transition-all duration-500"
  >
    <div className="w-16 h-16 rounded-full border border-primary/20 flex items-center justify-center text-primary mx-auto mb-6 group-hover:border-primary/50 group-hover:glow-subtle transition-all">
      {icon}
    </div>
    <div className="text-xs tracking-widest uppercase text-muted-foreground mb-2">{title}</div>
    <div className="font-semibold group-hover:text-primary transition-colors">{value}</div>
  </a>
);

export default ContactSection;