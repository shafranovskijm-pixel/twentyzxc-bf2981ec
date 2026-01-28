import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileCheck, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  Building2,
  GraduationCap,
  Send,
  Scale,
  ExternalLink
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const FrdoPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    organization: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Заявка отправлена",
      description: "Мы свяжемся с вами в ближайшее время",
    });
    setFormData({ name: "", phone: "", email: "", organization: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Top-right glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        
        {/* Bottom-left glow */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 right-10 w-32 h-32 border border-primary/10 rotate-45 animate-float" />
        <div className="absolute top-1/3 left-5 w-20 h-20 border border-primary/5 rotate-12 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border border-primary/10 -rotate-12 animate-float" style={{ animationDelay: '4s' }} />
        
        {/* Decorative lines */}
        <div className="absolute top-40 left-0 w-64 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-60 right-0 w-48 h-[1px] bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
        
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        
        {/* Diagonal lines */}
        <svg className="absolute top-20 right-20 w-40 h-40 text-primary/5" viewBox="0 0 100 100">
          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="0.5" />
          <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" />
          <line x1="40" y1="100" x2="100" y2="40" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        
        {/* Corner ornament top-left */}
        <svg className="absolute top-32 left-8 w-16 h-16 text-primary/20" viewBox="0 0 50 50">
          <path d="M0 25 L25 0 L25 10 L10 25 L25 25 L25 50 L0 25" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        
        {/* Small diamonds */}
        <div className="absolute top-1/2 left-20 w-3 h-3 bg-primary/20 rotate-45" />
        <div className="absolute top-[60%] right-32 w-2 h-2 bg-primary/15 rotate-45" />
        <div className="absolute top-[80%] left-1/3 w-2 h-2 bg-primary/10 rotate-45" />
      </div>

      <Header />
      
      <main className="pt-32 pb-24 relative z-10">
        <div className="container px-4">
          {/* Hero */}
          <div className="text-center mb-20 relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              <FileCheck className="w-3 h-3 mr-1" />
              Для образовательных организаций
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Выгрузка в <span className="gradient-gold-text">ФИС ФРДО</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Регистрация документов об образовании в Федеральном реестре. 
              Полное сопровождение и техническая поддержка для учебных центров.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <a href="#contact-form">Оставить заявку</a>
              </Button>
              <Button variant="heroOutline" size="lg" asChild>
                <a href="#pricing">Узнать цены</a>
              </Button>
            </div>
          </div>

          {/* What is FRDO */}
          <section className="mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-display font-semibold mb-6">
                  Что такое <span className="gradient-gold-text">ФИС ФРДО</span>?
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  ФИС ФРДО — Федеральная информационная система «Федеральный реестр сведений 
                  о документах об образовании и (или) о квалификации, документах об обучении».
                </p>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Все образовательные организации обязаны вносить данные о выданных документах 
                  в единую государственную базу. Это позволяет работодателям проверять подлинность 
                  дипломов и сертификатов.
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
                    <FileText className="w-3 h-3 mr-1" />
                    ВУЗы и ССУЗы
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, title: "Защита от подделок", desc: "Единая база для проверки" },
                  { icon: Clock, title: "Сроки внесения", desc: "60 дней после выдачи" },
                  { icon: AlertTriangle, title: "Штрафы", desc: "До 150 000 ₽ за документ" },
                  { icon: CheckCircle2, title: "Обязательно", desc: "Для всех организаций" },
                ].map((item, i) => (
                  <Card key={i} className="luxury-card border-0">
                    <CardContent className="p-6">
                      <item.icon className="w-8 h-8 text-primary mb-3" />
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="mb-24">
            <h2 className="text-3xl font-display font-semibold text-center mb-12">
              Наши <span className="gradient-gold-text">услуги</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Регистрация в системе",
                  items: [
                    "Настройка ЭЦП организации",
                    "Регистрация в ФИС ФРДО",
                    "Обучение работе с системой",
                    "Подключение к нашему каналу"
                  ]
                },
                {
                  title: "Выгрузка документов",
                  items: [
                    "Подготовка данных",
                    "Внесение в реестр",
                    "Проверка корректности",
                    "Исправление ошибок"
                  ]
                },
                {
                  title: "Поддержка",
                  items: [
                    "Ежемесячное сопровождение",
                    "Техническая поддержка",
                    "Консультации по требованиям",
                    "Обновления под изменения законов"
                  ]
                }
              ].map((service, i) => (
                <Card key={i} className="luxury-card border-0 hover:glow-subtle transition-all duration-500">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-display font-semibold mb-6 gradient-gold-text">
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
              ))}
            </div>
          </section>

          {/* Legal Basis */}
          <section className="mb-24">
            <Card className="luxury-card border-primary/20">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Scale className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-semibold mb-4">
                      Юридическое <span className="gradient-gold-text">обоснование</span>
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Передача персональных данных в ФИС ФРДО осуществляется на основании 
                      <strong className="text-foreground"> ФЗ-273 «Об образовании»</strong> (статьи 98, 107) 
                      и <strong className="text-foreground">ФЗ-152 «О персональных данных»</strong> (статья 6).
                    </p>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Согласно официальному письму Рособрнадзора № Уа-718/07-4080 от 24.07.2020, 
                      обработка персональных данных при внесении сведений в реестр ФРДО 
                      осуществляется в соответствии с законодательством и не требует 
                      дополнительного согласия субъекта.
                    </p>
                    <Button variant="heroOutline" size="sm" asChild>
                      <a href="/docs/rosobrnadzor-legal.pdf" target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        Письмо Рособрнадзора
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Pricing */}
          <section id="pricing" className="mb-24">
            <h2 className="text-3xl font-display font-semibold text-center mb-12">
              <span className="gradient-gold-text">Тарифы</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="luxury-card border-0 hover:glow-subtle transition-all duration-500">
                <CardContent className="p-8">
                  <h3 className="text-xl font-display font-semibold mb-2">Разовая настройка</h3>
                  <p className="text-muted-foreground mb-6">Регистрация и обучение</p>
                  <div className="text-4xl font-display font-bold gradient-gold-text mb-6">
                    от 3 500 ₽
                  </div>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Регистрация в ФИС ФРДО",
                      "Настройка рабочего места",
                      "Обучение сотрудников",
                      "Первая выгрузка документов"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="heroOutline" className="w-full" asChild>
                    <a href="#contact-form">Заказать</a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="luxury-card border-primary/30 hover:glow-subtle transition-all duration-500 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Популярный</Badge>
                </div>
                <CardContent className="p-8">
                  <h3 className="text-xl font-display font-semibold mb-2">Ежемесячная поддержка</h3>
                  <p className="text-muted-foreground mb-6">Полное сопровождение</p>
                  <div className="text-4xl font-display font-bold gradient-gold-text mb-6">
                    24 000 ₽/год
                  </div>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Все выгрузки за период",
                      "Техническая поддержка",
                      "Консультации по требованиям",
                      "Исправление ошибок",
                      "Приоритетная помощь"
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
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-24">
            <h2 className="text-3xl font-display font-semibold text-center mb-12">
              Частые <span className="gradient-gold-text">вопросы</span>
            </h2>
            
            <div className="max-w-3xl mx-auto space-y-6">
              {[
                {
                  q: "Какие организации обязаны вносить данные в ФРДО?",
                  a: "Все образовательные учреждения: школы, ВУЗы, ССУЗы и центры дополнительного профессионального образования."
                },
                {
                  q: "В какие сроки нужно вносить данные?",
                  a: "Сведения о выданных документах необходимо внести в течение 60 дней с момента выдачи."
                },
                {
                  q: "Какие штрафы предусмотрены за невнесение?",
                  a: "От 10 000 до 15 000 ₽ для должностных лиц и от 100 000 до 150 000 ₽ для организации за каждый невнесённый документ."
                },
                {
                  q: "Какие документы вносятся в реестр?",
                  a: "Аттестаты, дипломы о СПО и ВПО, сертификаты специалистов, удостоверения и дипломы о ДПО."
                }
              ].map((faq, i) => (
                <Card key={i} className="luxury-card border-0">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-2">{faq.q}</h4>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          <section id="contact-form" className="max-w-2xl mx-auto">
            <Card className="luxury-card border-0">
              <CardContent className="p-8 md:p-12">
                <h2 className="text-2xl font-display font-semibold text-center mb-2">
                  Оставить <span className="gradient-gold-text">заявку</span>
                </h2>
                <p className="text-muted-foreground text-center mb-8">
                  Мы свяжемся с вами для обсуждения деталей
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
                  
                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Отправить заявку
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FrdoPage;
