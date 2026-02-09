import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  CheckCircle2, 
  FileText,
  Building2,
  GraduationCap,
  Send,
  Scale,
  Users,
  BookOpen,
  Award,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendToTelegram } from "@/lib/telegram";

const LicensingPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    organization: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните обязательные поля",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await sendToTelegram({
        type: 'contact',
        service: 'Лицензирование образовательной деятельности',
        name: formData.name,
        email: formData.email || 'не указан',
        phone: formData.phone,
        company: formData.organization,
        message: formData.message
      });

      if (result.success) {
        toast({
          title: "Заявка отправлена",
          description: "Мы свяжемся с вами в ближайшее время",
        });
        setFormData({ name: "", phone: "", email: "", organization: "", message: "" });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Ошибка отправки",
        description: "Попробуйте ещё раз или свяжитесь с нами напрямую",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Лицензирование образовательной деятельности | 24ZXC</title>
        <meta name="description" content="Помощь в получении образовательной лицензии. Подготовка документов, сопровождение в Рособрнадзоре и полная поддержка." />
        <link rel="canonical" href="https://24zxc.ru/licensing" />
      </Helmet>
      <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Glowing orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '3s' }} />
        
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 right-10 w-32 h-32 border border-primary/10 rotate-45 animate-float" />
        <div className="absolute top-1/3 left-5 w-20 h-20 border border-primary/5 rotate-12 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border border-primary/10 -rotate-12 animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[60%] left-1/4 w-24 h-24 border border-primary/8 rotate-[30deg] animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[15%] left-1/3 w-12 h-12 border border-primary/15 -rotate-[20deg] animate-float" style={{ animationDelay: '3s' }} />
        
        {/* Decorative lines */}
        <div className="absolute top-40 left-0 w-64 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-60 right-0 w-48 h-[1px] bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-[70%] left-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        
        {/* Diagonal lines SVG */}
        <svg className="absolute top-20 right-20 w-40 h-40 text-primary/5" viewBox="0 0 100 100">
          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="0.5" />
          <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" />
          <line x1="40" y1="100" x2="100" y2="40" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        
        {/* Corner ornament */}
        <svg className="absolute top-32 left-8 w-16 h-16 text-primary/20" viewBox="0 0 50 50">
          <path d="M0 25 L25 0 L25 10 L10 25 L25 25 L25 50 L0 25" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        
        {/* Small diamonds */}
        <div className="absolute top-1/2 left-20 w-3 h-3 bg-primary/20 rotate-45" />
        <div className="absolute top-[60%] right-32 w-2 h-2 bg-primary/15 rotate-45" />
        <div className="absolute top-[80%] left-1/3 w-2 h-2 bg-primary/10 rotate-45" />
        <div className="absolute top-[25%] right-1/4 w-2 h-2 bg-primary/15 rotate-45" />
        
        {/* Animated circles */}
        <div className="absolute top-[40%] right-16 w-6 h-6 border border-primary/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-[30%] left-16 w-4 h-4 border border-primary/15 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>

      <Header />
      
      <main className="pt-32 pb-24 relative z-10">
        <div className="container px-4">
          {/* Hero */}
          <div className="text-center mb-20 relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              <Award className="w-3 h-3 mr-1" />
              Для образовательных организаций
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 animate-fade-in">
              Лицензирование{" "}
              <span className="relative inline-block">
                <span className="gradient-gold-text">образовательной деятельности</span>
                <span className="shimmer absolute inset-0 gradient-gold-text" aria-hidden="true">образовательной деятельности</span>
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Полное сопровождение получения образовательной лицензии. 
              От подготовки документов до успешного прохождения проверки.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <a href="#contact-form">Получить консультацию</a>
              </Button>
              <Button variant="heroOutline" size="lg" asChild>
                <a href="#stages">Этапы работы</a>
              </Button>
            </div>
          </div>

          {/* What is licensing */}
          <AnimatedSection>
            <section className="mb-24">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <AnimatedSection delay={100} direction="right">
                  <div>
                    <h2 className="text-3xl font-display font-semibold mb-6">
                      Зачем нужна <span className="gradient-gold-text">лицензия</span>?
                    </h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Образовательная лицензия — обязательный документ для организаций, 
                      осуществляющих образовательную деятельность. Без неё невозможно 
                      легально обучать и выдавать документы об образовании.
                    </p>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Лицензия подтверждает соответствие организации требованиям 
                      законодательства и даёт право на ведение образовательной деятельности.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline" className="border-primary/30">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        Учебные центры
                      </Badge>
                      <Badge variant="outline" className="border-primary/30">
                        <Building2 className="w-3 h-3 mr-1" />
                        ДПО
                      </Badge>
                      <Badge variant="outline" className="border-primary/30">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Онлайн-школы
                      </Badge>
                    </div>
                  </div>
                </AnimatedSection>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, title: "Легальная работа", desc: "Официальный статус" },
                    { icon: FileText, title: "Выдача документов", desc: "Дипломы и сертификаты" },
                    { icon: Users, title: "Доверие клиентов", desc: "Повышение репутации" },
                    { icon: Scale, title: "Соответствие", desc: "Требованиям закона" },
                  ].map((item, i) => (
                    <AnimatedSection key={i} delay={200 + i * 100} direction="scale">
                      <Card className="luxury-card border-0 hover:glow-subtle transition-all duration-500">
                        <CardContent className="p-6">
                          <item.icon className="w-8 h-8 text-primary mb-3" />
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </CardContent>
                      </Card>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* Services */}
          <AnimatedSection>
            <section className="mb-24">
              <h2 className="text-3xl font-display font-semibold text-center mb-12">
                Что <span className="gradient-gold-text">включено</span>
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Подготовка документов",
                    items: [
                      "Анализ требований",
                      "Разработка программ",
                      "Оформление заявления",
                      "Подготовка справок"
                    ]
                  },
                  {
                    title: "Сопровождение",
                    items: [
                      "Подача в Рособрнадзор",
                      "Взаимодействие с органами",
                      "Устранение замечаний",
                      "Получение лицензии"
                    ]
                  },
                  {
                    title: "После получения",
                    items: [
                      "Консультации по работе",
                      "Помощь с проверками",
                      "Переоформление",
                      "Внесение изменений"
                    ]
                  }
                ].map((service, i) => (
                  <AnimatedSection key={i} delay={i * 150} direction="up">
                    <Card className="luxury-card border-0 hover:glow-subtle transition-all duration-500 group h-full">
                      <CardContent className="p-8">
                        <h3 className="text-xl font-display font-semibold mb-6 gradient-gold-text group-hover:scale-105 transition-transform">
                          {service.title}
                        </h3>
                        <ul className="space-y-3">
                          {service.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-3 text-muted-foreground">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>
            </section>
          </AnimatedSection>

          {/* Stages */}
          <AnimatedSection>
            <section id="stages" className="mb-24">
              <h2 className="text-3xl font-display font-semibold text-center mb-12">
                Этапы <span className="gradient-gold-text">работы</span>
              </h2>
              
              <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                  {[
                    { num: "01", title: "Консультация", desc: "Анализируем вашу ситуацию и определяем требования" },
                    { num: "02", title: "Подготовка", desc: "Разрабатываем программы и готовим пакет документов" },
                    { num: "03", title: "Подача", desc: "Подаём заявление и сопровождаем процесс рассмотрения" },
                    { num: "04", title: "Получение", desc: "Получаем лицензию и передаём вам с инструкциями" },
                  ].map((stage, i) => (
                    <AnimatedSection key={i} delay={i * 150} direction="left">
                      <Card className="luxury-card border-0 hover:glow-subtle transition-all duration-500 hover:translate-x-2">
                        <CardContent className="p-6 flex items-center gap-6">
                          <div className="relative">
                            <div className="text-4xl font-display font-bold gradient-gold-text">
                              {stage.num}
                            </div>
                            <div className="absolute inset-0 text-4xl font-display font-bold shimmer gradient-gold-text" aria-hidden="true">
                              {stage.num}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg mb-1">{stage.title}</h4>
                            <p className="text-muted-foreground">{stage.desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            </section>
          </AnimatedSection>

          {/* Pricing */}
          <AnimatedSection>
            <section className="mb-24">
              <h2 className="text-3xl font-display font-semibold text-center mb-12">
                <span className="gradient-gold-text">Стоимость</span>
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <AnimatedSection delay={100} direction="right">
                  <Card className="luxury-card border-0 hover:glow-subtle transition-all duration-500 h-full">
                    <CardContent className="p-8">
                      <h3 className="text-xl font-display font-semibold mb-2">Консультация</h3>
                      <p className="text-muted-foreground mb-6">Первичный анализ</p>
                      <div className="text-4xl font-display font-bold gradient-gold-text mb-6">
                        Бесплатно
                      </div>
                      <ul className="space-y-3 mb-8">
                        {[
                          "Анализ вашей ситуации",
                          "Определение требований",
                          "Оценка сроков",
                          "Расчёт стоимости"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <Button variant="heroOutline" className="w-full" asChild>
                        <a href="#contact-form">Записаться</a>
                      </Button>
                    </CardContent>
                  </Card>
                </AnimatedSection>

                <AnimatedSection delay={200} direction="left">
                  <Card className="luxury-card border-primary/30 hover:glow-subtle transition-all duration-500 relative h-full">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Под ключ</Badge>
                    </div>
                    <CardContent className="p-8">
                      <h3 className="text-xl font-display font-semibold mb-2">Полное сопровождение</h3>
                      <p className="text-muted-foreground mb-6">От заявки до лицензии</p>
                      <div className="text-4xl font-display font-bold gradient-gold-text mb-6">
                        от 50 000 ₽
                      </div>
                      <ul className="space-y-3 mb-8">
                        {[
                          "Подготовка всех документов",
                          "Разработка программ",
                          "Подача и сопровождение",
                          "Получение лицензии",
                          "Консультации после"
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <Button variant="hero" className="w-full" asChild>
                        <a href="#contact-form">Заказать</a>
                      </Button>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </div>
            </section>
          </AnimatedSection>

          {/* FAQ */}
          <AnimatedSection>
            <section className="mb-24">
              <h2 className="text-3xl font-display font-semibold text-center mb-12">
                Частые <span className="gradient-gold-text">вопросы</span>
              </h2>
              
              <div className="max-w-3xl mx-auto space-y-6">
                {[
                  {
                    q: "Кому нужна образовательная лицензия?",
                    a: "Всем организациям, осуществляющим образовательную деятельность: учебным центрам, ДПО, онлайн-школам, автошколам и др."
                  },
                  {
                    q: "Сколько времени занимает получение?",
                    a: "Мы работаем быстро — подготовка документов занимает 10-15 рабочих дней. Общий срок зависит от скорости рассмотрения в Рособрнадзоре."
                  },
                  {
                    q: "Какие документы нужны?",
                    a: "Учредительные документы, правоустанавливающие на помещение, образовательные программы, сведения о педагогах и материально-техническом обеспечении."
                  },
                  {
                    q: "Можно ли работать без лицензии?",
                    a: "Можно, но без выдачи документов об образовании. Если вы планируете выдавать дипломы, сертификаты или удостоверения — лицензия обязательна."
                  }
                ].map((faq, i) => (
                  <AnimatedSection key={i} delay={i * 100} direction="up">
                    <Card className="luxury-card border-0 hover:glow-subtle transition-all duration-300">
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-2">{faq.q}</h4>
                        <p className="text-muted-foreground">{faq.a}</p>
                      </CardContent>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>
            </section>
          </AnimatedSection>

          {/* Contact Form */}
          <AnimatedSection direction="scale">
            <section id="contact-form" className="max-w-2xl mx-auto">
              <Card className="luxury-card border-0">
                <CardContent className="p-8 md:p-12">
                  <h2 className="text-2xl font-display font-semibold text-center mb-2">
                    Получить <span className="gradient-gold-text">консультацию</span>
                  </h2>
                <p className="text-muted-foreground text-center mb-8">
                  Оставьте заявку и мы свяжемся с вами
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Имя *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors"
                        placeholder="Ваше имя"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Телефон *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors"
                        placeholder="+7 (___) ___-__-__"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Организация</label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors"
                      placeholder="Название вашей организации"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Сообщение</label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors resize-none"
                      placeholder="Опишите вашу задачу..."
                    />
                  </div>
                  
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {isSubmitting ? "Отправка..." : "Отправить заявку"}
                  </Button>
                </form>
                </CardContent>
              </Card>
            </section>
          </AnimatedSection>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default LicensingPage;
