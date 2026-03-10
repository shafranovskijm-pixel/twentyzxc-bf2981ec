import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  FileCheck,
  UserCheck,
  Globe,
  Building2,
  Send,
  Mail,
  CheckCircle2,
  ClipboardList,
  BookOpen,
  ShieldCheck,
  HelpCircle,
  Loader2,
  ExternalLink,
  FileText,
  Download,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendToTelegram } from "@/lib/telegram";
import AnimatedSection from "@/components/AnimatedSection";
import { FloatingParticles, GradientGlows, SectionDivider } from "@/components/decorations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const steps = [
  {
    icon: FileCheck,
    title: "Подготовка документов",
    desc: "Лицензия на образовательную деятельность с приложением о ДПО, устав организации",
  },
  {
    icon: UserCheck,
    title: "Регистрация сотрудника",
    desc: "Регистрация ответственного лица на Портале НМФО (edu.rosminzdrav.ru)",
  },
  {
    icon: Globe,
    title: "Подача заявки",
    desc: "Заполнение заявки на открытие личного кабинета организации (org.edu.rosminzdrav.ru)",
  },
  {
    icon: Building2,
    title: "Данные организации",
    desc: "Заполнение ИНН, КПП, юридического адреса, сведений о лицензии",
  },
  {
    icon: ClipboardList,
    title: "Ответственное лицо",
    desc: "Добавление данных ответственного сотрудника: ФИО, СНИЛС, должность, email",
  },
  {
    icon: Mail,
    title: "Отправка оригиналов",
    desc: "Отправка пакета документов почтой в РНИМУ им. Пирогова для верификации",
  },
  {
    icon: BookOpen,
    title: "Паспорта ДПП",
    desc: "Подготовка и подача паспортов программ ДПО для включения в реестр Портала",
  },
];

const includes = [
  "Подготовка полного пакета документов для регистрации",
  "Подача заявки на открытие личного кабинета",
  "Сопровождение до получения доступа к ЛК организации",
  "Помощь с заполнением паспортов программ ДПП",
  "Консультации по требованиям портала НМО",
  "Настройка личного кабинета организации",
];

const faq = [
  {
    q: "Что такое Портал НМО и зачем нужна регистрация?",
    a: "Портал непрерывного медицинского и фармацевтического образования (edu.rosminzdrav.ru) — это государственная информационная система. Регистрация необходима для включения ваших образовательных программ повышения квалификации в официальный реестр и выдачи удостоверений, признаваемых для аккредитации медицинских работников.",
  },
  {
    q: "Какие документы нужны для регистрации?",
    a: "Лицензия на образовательную деятельность с приложением о праве реализации ДПО, устав организации, данные ответственного лица (ФИО, СНИЛС, должность, email), ИНН и КПП организации. Мы поможем подготовить весь пакет.",
  },
  {
    q: "Сколько времени занимает процесс регистрации?",
    a: "Подготовка и подача документов занимает 3-5 рабочих дней. После отправки оригиналов почтой верификация на стороне РНИМУ им. Пирогова может занять до 30 рабочих дней.",
  },
  {
    q: "Можно ли включить программы ДПП после открытия ЛК?",
    a: "Да, после получения доступа к личному кабинету организации можно подавать паспорта программ ДПП для включения в список Портала. Мы помогаем с заполнением паспортов по рекомендациям портала.",
  },
  {
    q: "Что если у нас нет приложения к лицензии о ДПО?",
    a: "Для регистрации на Портале НМО необходимо приложение к лицензии, подтверждающее право реализации программ дополнительного профессионального образования. Мы также оказываем услуги по лицензированию образовательной деятельности.",
  },
];

const NmoPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    organization: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({ title: "Ошибка", description: "Заполните обязательные поля", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await sendToTelegram({
        type: "contact",
        service: "Регистрация на Портале НМО",
        name: formData.name,
        email: formData.email || "не указан",
        phone: formData.phone,
        company: formData.organization,
        message: formData.message,
      });
      if (result.success) {
        toast({ title: "Заявка отправлена!", description: "Мы свяжемся с вами в ближайшее время" });
        setFormData({ name: "", phone: "", email: "", organization: "", message: "" });
      } else {
        toast({ title: "Ошибка", description: "Не удалось отправить заявку", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка", description: "Попробуйте позже", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Helmet>
        <title>Регистрация на Портале НМО — подготовка документов | 24ZXC</title>
        <meta name="description" content="Регистрация образовательной организации на Портале НМО (edu.rosminzdrav.ru). Подготовка документов, подача заявки, сопровождение. 35 000 ₽ под ключ." />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-24">
        <FloatingParticles count={20} />
        <GradientGlows />

        {/* Hero */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          </div>
          <div className="container relative z-10 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <AnimatedSection>
                <Badge className="bg-primary/10 text-primary border-primary/30 mb-6 text-sm px-4 py-1.5">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Портал НМО
                </Badge>
                <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
                  Регистрация на{" "}
                  <span className="gradient-gold-text">Портале НМО</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Полное сопровождение регистрации образовательной организации на Портале непрерывного медицинского образования — от подготовки документов до получения личного кабинета
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="luxury-card px-8 py-4 rounded-sm">
                    <span className="text-3xl md:text-4xl font-display font-bold gradient-gold-text gold-glow-text">
                      35 000 ₽
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">под ключ</p>
                  </div>
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={() => document.getElementById("nmo-form")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Оставить заявку
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <SectionDivider variant="diamond" />

        {/* Steps */}
        <section className="py-20 bg-secondary/30">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <AnimatedSection>
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                    Этапы <span className="gradient-gold-text">регистрации</span>
                  </h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    Процесс регистрации на Портале НМО включает несколько обязательных этапов
                  </p>
                </div>
              </AnimatedSection>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <AnimatedSection key={i} delay={i * 100} direction="left">
                    <div className="luxury-card rounded-sm p-5 flex items-start gap-4 border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-mono text-primary/60">0{i + 1}</span>
                          <h3 className="font-display font-semibold">{step.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SectionDivider variant="ornate" />

        {/* What's included */}
        <section className="py-20">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <AnimatedSection>
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                    Что <span className="gradient-gold-text">входит в услугу</span>
                  </h2>
                </div>
              </AnimatedSection>
              <div className="grid md:grid-cols-2 gap-4">
                {includes.map((item, i) => (
                  <AnimatedSection key={i} delay={i * 80}>
                    <div className="flex items-start gap-3 p-4 luxury-card rounded-sm border border-border/50">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Reference docs */}
        <section className="py-16 bg-secondary/30">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <AnimatedSection>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-display font-bold mb-2">Справочные материалы</h2>
                  <p className="text-sm text-muted-foreground">Официальные документы и инструкции портала НМО</p>
                </div>
              </AnimatedSection>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { title: "Инструкция по работе в ЛК", file: "/docs/nmo/instruction.pdf" },
                  { title: "Порядок включения ДПП", file: "/docs/nmo/poryadok-dpp.pdf" },
                  { title: "Рекомендации по ДПП", file: "/docs/nmo/recomendacii-dpp.pdf" },
                ].map((doc, i) => (
                  <AnimatedSection key={i} delay={i * 100}>
                    <a
                      href={doc.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 luxury-card rounded-sm border border-border/50 hover:border-primary/30 transition-colors group"
                    >
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm flex-1">{doc.title}</span>
                      <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="container px-4">
            <div className="max-w-3xl mx-auto">
              <AnimatedSection>
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                    <span className="gradient-gold-text">Частые вопросы</span>
                  </h2>
                </div>
              </AnimatedSection>
              <Accordion type="single" collapsible className="space-y-3">
                {faq.map((item, i) => (
                  <AnimatedSection key={i} delay={i * 80}>
                    <AccordionItem value={`faq-${i}`} className="luxury-card rounded-sm border border-border/50 px-5">
                      <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">
                        <span className="flex items-center gap-3 text-left">
                          <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                          {item.q}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4 pl-7">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  </AnimatedSection>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Form */}
        <section id="nmo-form" className="py-20 bg-secondary/30">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto">
              <AnimatedSection>
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                    Оставить <span className="gradient-gold-text">заявку</span>
                  </h2>
                  <p className="text-muted-foreground">Заполните форму и мы свяжемся с вами для уточнения деталей</p>
                </div>
              </AnimatedSection>
              <AnimatedSection delay={100}>
                <Card className="luxury-card border-border/50">
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Имя *</label>
                          <input
                            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ваше имя"
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Телефон *</label>
                          <input
                            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+7 (999) 123-45-67"
                            maxLength={20}
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="email@example.com"
                            maxLength={255}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Организация</label>
                          <input
                            className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                            placeholder="Название организации"
                            maxLength={200}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Сообщение</label>
                        <textarea
                          className="w-full px-3 py-2 bg-background border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Дополнительная информация..."
                          maxLength={1000}
                        />
                      </div>
                      <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Отправить заявку
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default NmoPage;
