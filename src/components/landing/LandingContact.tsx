import { useState } from "react";
import { CheckCircle, Clock, Loader2, Mail, Phone, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendToTelegram } from "@/lib/telegram";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Введите ваше имя").max(100, "Имя слишком длинное"),
  contact: z.string().trim().min(5, "Укажите телефон или email").max(255, "Контакт слишком длинный"),
  service: z.string().trim().min(1),
  message: z.string().trim().max(2000, "Сообщение слишком длинное"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const INITIAL_FORM: ContactFormData = {
  name: "",
  contact: "",
  service: "Сайт под ключ",
  message: "",
};

const LandingContact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const setField = (field: keyof ContactFormData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = contactSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) fieldErrors[error.path[0] as keyof ContactFormData] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const contactIsEmail = result.data.contact.includes("@");
    setIsSubmitting(true);
    const response = await sendToTelegram({
      type: "contact",
      service: result.data.service,
      name: result.data.name,
      email: contactIsEmail ? result.data.contact : "",
      phone: contactIsEmail ? "" : result.data.contact,
      message: result.data.message,
    });
    setIsSubmitting(false);

    if (response.success) {
      setIsSubmitted(true);
      setFormData(INITIAL_FORM);
      toast({ title: "Заявка отправлена", description: "Свяжемся с вами в ближайшее время." });
    } else {
      toast({
        title: "Не удалось отправить заявку",
        description: "Напишите нам в Telegram или позвоните.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="contact" className="scroll-mt-20 bg-background">
      <div className="container px-4 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
          <div>
            <p className="landing-eyebrow mb-3 text-xs uppercase tracking-[0.24em]">Следующий шаг</p>
            <span className="landing-accent-rule mb-4" />
            <h2 className="text-3xl font-display font-semibold tracking-tight md:text-4xl">
              Получите план и расчёт
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Оставьте один контакт. Уточним задачу и предложим состав работ, срок и стоимость.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3"><Clock className="h-4 w-4" /> Ответим в течение дня</li>
              <li>
                <a href="tel:+79147213424" className="flex items-center gap-3 hover:text-foreground">
                  <Phone className="h-4 w-4" /> +7 914 721-34-24
                </a>
              </li>
              <li>
                <a href="mailto:24@24zxc.ru" className="flex items-center gap-3 hover:text-foreground">
                  <Mail className="h-4 w-4" /> 24@24zxc.ru
                </a>
              </li>
              <li>
                <a href="https://t.me/Aliencorso" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-foreground">
                  <Send className="h-4 w-4" /> Написать в Telegram
                </a>
              </li>
            </ul>
          </div>

          <div className="landing-card-accent rounded-md border bg-card p-6 md:p-8">
            {isSubmitted ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <CheckCircle className="h-10 w-10 landing-eyebrow" />
                <h3 className="mt-4 text-lg font-medium">Заявка отправлена</h3>
                <p className="mt-1 text-sm text-muted-foreground">Спасибо! Свяжемся с вами в ближайшее время.</p>
                <button type="button" onClick={() => setIsSubmitted(false)} className="mt-6 text-sm font-medium underline underline-offset-4">
                  Отправить ещё одну
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Имя *</Label>
                    <Input
                      id="contact-name"
                      autoComplete="name"
                      placeholder="Как к вам обращаться"
                      value={formData.name}
                      onChange={(event) => setField("name", event.target.value)}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-value">Телефон или email *</Label>
                    <Input
                      id="contact-value"
                      autoComplete="email"
                      placeholder="+7 900 000-00-00"
                      value={formData.contact}
                      onChange={(event) => setField("contact", event.target.value)}
                      className={errors.contact ? "border-destructive" : ""}
                    />
                    {errors.contact && <p className="text-sm text-destructive">{errors.contact}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-service">Что нужно</Label>
                  <select
                    id="contact-service"
                    value={formData.service}
                    onChange={(event) => setField("service", event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option>Сайт под ключ</option>
                    <option>Яндекс Директ</option>
                    <option>Веб-приложение / CRM</option>
                    <option>Мобильное приложение</option>
                    <option>ФИС ФРДО</option>
                    <option>Лицензирование</option>
                    <option>НМО Портал</option>
                    <option>Синтагма</option>
                    <option>Нужна консультация</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message">Коротко о задаче <span className="text-muted-foreground">(необязательно)</span></Label>
                  <Textarea
                    id="contact-message"
                    rows={4}
                    placeholder="Что хотите запустить или улучшить?"
                    value={formData.message}
                    onChange={(event) => setField("message", event.target.value)}
                    className={errors.message ? "border-destructive" : ""}
                  />
                  {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" size="lg" className="landing-gold-btn hover:opacity-90" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Отправка...</>
                    ) : (
                      <>Получить расчёт <Send className="h-4 w-4" /></>
                    )}
                  </Button>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Нажимая кнопку, вы соглашаетесь с <Link to="/policy" className="underline underline-offset-2">политикой</Link>.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingContact;
