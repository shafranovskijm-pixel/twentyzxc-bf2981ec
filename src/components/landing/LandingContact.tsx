import { useState } from "react";
import { z } from "zod";
import { Loader2, Send, CheckCircle, Clock, MapPin, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendToTelegram } from "@/lib/telegram";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Введите ваше имя").max(100, "Имя слишком длинное"),
  email: z.string().trim().email("Введите корректный email").max(255, "Email слишком длинный"),
  phone: z.string().trim().max(50).optional(),
  message: z.string().trim().min(1, "Введите сообщение").max(2000, "Сообщение слишком длинное"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const LandingContact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const res = await sendToTelegram({ type: "contact", ...result.data });
    setIsSubmitting(false);

    if (res.success) {
      setIsSubmitted(true);
      toast({ title: "Заявка отправлена", description: "Мы свяжемся с вами в ближайшее время." });
      setTimeout(() => {
        setFormData({ name: "", email: "", phone: "", message: "" });
        setIsSubmitted(false);
      }, 4000);
    } else {
      toast({
        title: "Ошибка отправки",
        description: "Попробуйте ещё раз или напишите нам напрямую.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="contact" className="bg-background">
      <div className="container px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-[320px_1fr] gap-10 lg:gap-16">
          <div>
            <p className="text-xs tracking-[0.28em] uppercase text-muted-foreground mb-4">Контакты</p>
            <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight mb-4">
              Обсудим ваш проект
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Расскажите о задаче — предложим решение, сроки и стоимость.
            </p>

            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3"><Clock className="w-4 h-4" /> Ответ в течение 24 часов</li>
              <li className="flex items-center gap-3"><MapPin className="w-4 h-4" /> Работаем по всей России</li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                <a href="mailto:24@24zxc.ru" className="hover:text-foreground transition-colors">24@24zxc.ru</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4" />
                <a href="tel:+79147213424" className="hover:text-foreground transition-colors">+7 914 721-34-24</a>
              </li>
            </ul>
          </div>

          <div className="border border-border rounded-md bg-card p-6 md:p-8">
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <CheckCircle className="w-10 h-10 mb-4 text-foreground/70" />
                <h3 className="text-lg font-medium mb-1">Спасибо за заявку!</h3>
                <p className="text-sm text-muted-foreground">Мы свяжемся с вами в ближайшее время</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя *</Label>
                    <Input id="name" name="name" placeholder="Как к вам обращаться" value={formData.name} onChange={handleChange} className={errors.name ? "border-destructive" : ""} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+7 (___) ___-__-__" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" placeholder="email@example.com" value={formData.email} onChange={handleChange} className={errors.email ? "border-destructive" : ""} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Сообщение *</Label>
                  <Textarea id="message" name="message" rows={5} placeholder="Опишите вашу задачу или проект" value={formData.message} onChange={handleChange} className={errors.message ? "border-destructive" : ""} />
                  {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Отправка...</>) : (<><Send className="w-4 h-4" /> Отправить заявку</>)}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingContact;