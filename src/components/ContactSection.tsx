import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle, Send, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-secondary/30">
      {/* Background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4" />
              Контакты
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Готовы <span className="gradient-text">начать?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Обсудим ваш проект и подберём оптимальное решение. Первая консультация — бесплатно
            </p>
          </div>

          {/* Contact cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <ContactCard 
              icon={<Phone className="w-6 h-6" />}
              title="Телефон"
              value="+7 (XXX) XXX-XX-XX"
              action="Позвонить"
              href="tel:+7XXXXXXXXXX"
            />
            <ContactCard 
              icon={<Mail className="w-6 h-6" />}
              title="Email"
              value="info@24zxc.ru"
              action="Написать"
              href="mailto:info@24zxc.ru"
            />
            <ContactCard 
              icon={<Send className="w-6 h-6" />}
              title="Telegram"
              value="@your_telegram"
              action="Открыть"
              href="https://t.me/your_telegram"
            />
          </div>

          {/* Main CTA */}
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Расскажите о вашем проекте
            </h3>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Заполните заявку, и мы свяжемся с вами в течение 24 часов для обсуждения деталей
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl">
                Оставить заявку
                <Send className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Ответ в течение 24ч</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Работаем по всей России</span>
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
  action: string;
  href: string;
}

const ContactCard = ({ icon, title, value, action, href }: ContactCardProps) => (
  <a 
    href={href}
    className="glass-card rounded-2xl p-6 text-center hover:border-primary/50 transition-all duration-300 group block"
  >
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="text-sm text-muted-foreground mb-1">{title}</div>
    <div className="font-semibold mb-3">{value}</div>
    <span className="text-sm text-primary group-hover:underline">{action}</span>
  </a>
);

export default ContactSection;
