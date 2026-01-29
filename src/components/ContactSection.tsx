import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Send, MapPin, Clock, Diamond, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Введите ваше имя").max(100, "Имя слишком длинное"),
  email: z.string().trim().email("Введите корректный email").max(255, "Email слишком длинный"),
  phone: z.string().trim().optional(),
  message: z.string().trim().min(1, "Введите сообщение").max(2000, "Сообщение слишком длинное"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission (replace with actual API call)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast({
      title: "Заявка отправлена!",
      description: "Мы свяжемся с вами в ближайшее время.",
    });

    // Reset form after delay
    setTimeout(() => {
      setFormData({ name: "", email: "", phone: "", message: "" });
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section id="contact" className="py-32 relative overflow-hidden bg-secondary/30">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-primary/30 to-transparent" />
      
      <div className="container relative z-10 px-4">
        <div className="max-w-5xl mx-auto">
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
              value="+7 (914) 721-34-24"
              href="tel:+79147213424"
            />
            <ContactCard 
              icon={<Mail className="w-6 h-6" />}
              title="Email"
              value="shafranovskij.m@gmail.com"
              href="mailto:shafranovskij.m@gmail.com"
            />
            <ContactCard 
              icon={<Send className="w-6 h-6" />}
              title="Telegram"
              value="@zxc24support"
              href="https://t.me/zxc24support"
            />
          </div>

          {/* Contact Form */}
          <div className="luxury-card rounded-sm p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left side - info */}
              <div>
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                  Обсудим ваш проект
                </h3>
                <p className="text-muted-foreground mb-8">
                  Расскажите о задаче, и мы предложим оптимальное решение. Ответ в течение 24 часов.
                </p>
                
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Ответ в течение 24 часов</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Работаем по всей России</span>
                  </div>
                </div>
              </div>

              {/* Right side - form */}
              <div>
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Спасибо за заявку!</h4>
                    <p className="text-muted-foreground">Мы свяжемся с вами в ближайшее время</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name">Имя *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Как к вам обращаться"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Телефон</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+7 (___) ___-__-__"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Сообщение *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Опишите вашу задачу или проект"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        className={errors.message ? "border-destructive" : ""}
                      />
                      {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                    </div>

                    <Button 
                      type="submit" 
                      variant="hero" 
                      size="lg" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Отправить заявку
                        </>
                      )}
                    </Button>
                  </form>
                )}
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
