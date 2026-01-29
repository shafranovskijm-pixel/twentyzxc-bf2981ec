import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileCheck, 
  Shield, 
  Clock, 
  CheckCircle2, 
  FileText,
  Building2,
  GraduationCap,
  Send,
  Scale,
  ClipboardList,
  Users,
  BookOpen,
  Award
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const LicensingPage = () => {
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
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 right-10 w-32 h-32 border border-primary/10 rotate-45 animate-float" />
        <div className="absolute top-1/3 left-5 w-20 h-20 border border-primary/5 rotate-12 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border border-primary/10 -rotate-12 animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-40 left-0 w-64 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-60 right-0 w-48 h-[1px] bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
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
            
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Лицензирование <span className="gradient-gold-text">образовательной деятельности</span>
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
          <section className="mb-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
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
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, title: "Легальная работа", desc: "Официальный статус" },
                  { icon: FileText, title: "Выдача документов", desc: "Дипломы и сертификаты" },
                  { icon: Users, title: "Доверие клиентов", desc: "Повышение репутации" },
                  { icon: Scale, title: "Соответствие", desc: "Требованиям закона" },
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

          {/* Stages */}
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
                  <Card key={i} className="luxury-card border-0">
                    <CardContent className="p-6 flex items-center gap-6">
                      <div className="text-4xl font-display font-bold gradient-gold-text">
                        {stage.num}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">{stage.title}</h4>
                        <p className="text-muted-foreground">{stage.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="mb-24">
            <h2 className="text-3xl font-display font-semibold text-center mb-12">
              <span className="gradient-gold-text">Стоимость</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="luxury-card border-0 hover:glow-subtle transition-all duration-500">
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

              <Card className="luxury-card border-primary/30 hover:glow-subtle transition-all duration-500 relative">
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
                  q: "Кому нужна образовательная лицензия?",
                  a: "Всем организациям, осуществляющим образовательную деятельность: учебным центрам, ДПО, онлайн-школам, автошколам и др."
                },
                {
                  q: "Сколько времени занимает получение?",
                  a: "В среднем процесс занимает от 2 до 4 месяцев в зависимости от готовности документов и загруженности органов."
                },
                {
                  q: "Какие документы нужны?",
                  a: "Учредительные документы, правоустанавливающие на помещение, образовательные программы, сведения о педагогах и материально-техническом обеспечении."
                },
                {
                  q: "Можно ли работать без лицензии?",
                  a: "Нет, ведение образовательной деятельности без лицензии влечёт административную и уголовную ответственность."
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

export default LicensingPage;
