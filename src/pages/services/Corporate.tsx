import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  FileText, 
  Users, 
  CheckCircle2, 
  Send,
  Globe,
  Shield,
  Layers
} from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

const CorporatePage = () => {
  const { toast } = useToast();
  
  // Calculator state
  const [options, setOptions] = useState({
    design: "template", // template, unique, premium
    pages: 5,
    cms: true,
    multilang: false,
    blog: false,
    catalog: false,
    seo: false,
    urgency: "normal"
  });

  const price = useMemo(() => {
    let total = 50000;
    
    if (options.design === "unique") total += 30000;
    if (options.design === "premium") total += 70000;
    if (options.pages > 5) total += (options.pages - 5) * 4000;
    if (options.cms) total += 15000;
    if (options.multilang) total += 25000;
    if (options.blog) total += 20000;
    if (options.catalog) total += 30000;
    if (options.seo) total += 15000;
    if (options.urgency === "fast") total *= 1.3;
    
    return Math.round(total);
  }, [options]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    description: "",
    budget: "",
    deadline: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Заявка отправлена",
      description: "Мы свяжемся с вами в ближайшее время",
    });
    setFormData({ name: "", phone: "", email: "", company: "", description: "", budget: "", deadline: "" });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Glowing orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 right-10 w-32 h-32 border border-primary/10 rotate-45 animate-float" />
        <div className="absolute top-1/3 left-8 w-24 h-24 border border-primary/5 rotate-12 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 right-1/5 w-16 h-16 border border-primary/10 rotate-[30deg] animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-2/3 left-1/5 w-10 h-10 bg-primary/10 rotate-45 animate-float" style={{ animationDelay: '3s' }} />
        
        {/* Diamond accents */}
        <div className="absolute top-[25%] left-[12%] w-3 h-3 bg-primary/20 rotate-45" />
        <div className="absolute top-[55%] right-[8%] w-2 h-2 bg-primary/30 rotate-45" />
        <div className="absolute bottom-[25%] left-[5%] w-2 h-2 bg-primary/20 rotate-45" />
        
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        
        {/* Corner ornaments */}
        <svg className="absolute top-20 left-4 w-24 h-24 text-primary/10" viewBox="0 0 100 100" fill="none" stroke="currentColor">
          <path d="M0 50 L50 0 M0 70 L70 0 M0 90 L90 0" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-20 right-4 w-24 h-24 text-primary/10 rotate-180" viewBox="0 0 100 100" fill="none" stroke="currentColor">
          <path d="M0 50 L50 0 M0 70 L70 0 M0 90 L90 0" strokeWidth="1" />
        </svg>
        
        {/* Decorative lines */}
        <div className="absolute top-[40%] left-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-[70%] right-0 w-40 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <Header />
      
      <main className="pt-32 pb-24 relative z-10">
        <div className="container px-4">
          {/* Hero */}
          <div className="text-center mb-20 relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              <Building2 className="w-3 h-3 mr-1" />
              Веб-разработка
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-gold-text">Корпоративные сайты</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              Многостраничные решения для бизнеса
            </p>
            
            <div className="text-3xl font-display font-bold gradient-gold-text">
              от 50 000 ₽
            </div>
          </div>

          {/* Features */}
          <section className="mb-24">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Globe, title: "Представительность", desc: "Имидж компании" },
                { icon: FileText, title: "Контент", desc: "Любое количество страниц" },
                { icon: Shield, title: "Надёжность", desc: "Защита данных" },
                { icon: Layers, title: "Масштабируемость", desc: "Рост вместе с бизнесом" },
              ].map((item, i) => (
                <Card key={i} className="luxury-card border-0">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Calculator */}
          <section className="mb-24">
            <h2 className="text-3xl font-display font-semibold text-center mb-12">
              <span className="gradient-gold-text">Калькулятор</span> стоимости
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              <Card className="luxury-card border-0">
                <CardContent className="p-8 space-y-6">
                  {/* Design type */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Дизайн</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "template", label: "Шаблонный", price: "+0 ₽" },
                        { value: "unique", label: "Уникальный", price: "+30 000 ₽" },
                        { value: "premium", label: "Премиум", price: "+70 000 ₽" }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setOptions({ ...options, design: opt.value })}
                          className={`p-4 rounded-sm border transition-all ${
                            options.design === opt.value 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pages */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">
                      Количество страниц: {options.pages}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={options.pages}
                      onChange={(e) => setOptions({ ...options, pages: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>5 страниц</span>
                      <span>30 страниц</span>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium mb-3 block">Функционал</label>
                    {[
                      { key: "cms", label: "Система управления (CMS)", price: "+15 000 ₽" },
                      { key: "multilang", label: "Мультиязычность", price: "+25 000 ₽" },
                      { key: "blog", label: "Блог / Новости", price: "+20 000 ₽" },
                      { key: "catalog", label: "Каталог услуг", price: "+30 000 ₽" },
                      { key: "seo", label: "SEO-оптимизация", price: "+15 000 ₽" },
                    ].map(opt => (
                      <label key={opt.key} className="flex items-center justify-between p-3 rounded-sm border border-border hover:border-primary/50 cursor-pointer transition-all">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={options[opt.key as keyof typeof options] as boolean}
                            onChange={(e) => setOptions({ ...options, [opt.key]: e.target.checked })}
                            className="w-4 h-4 accent-primary"
                          />
                          <span>{opt.label}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{opt.price}</span>
                      </label>
                    ))}
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Сроки</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "normal", label: "Стандартные", price: "×1" },
                        { value: "fast", label: "Срочно", price: "×1.3" }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setOptions({ ...options, urgency: opt.value })}
                          className={`p-4 rounded-sm border transition-all ${
                            options.urgency === opt.value 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Price display */}
              <div className="flex flex-col justify-center">
                <Card className="luxury-card border-primary/30">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground mb-2">Предварительная стоимость</p>
                    <div className="text-5xl font-display font-bold gradient-gold-text mb-4">
                      {price.toLocaleString('ru-RU')} ₽
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      Точная стоимость после обсуждения деталей
                    </p>
                    <Button variant="hero" size="lg" className="w-full" asChild>
                      <a href="#brief">Заполнить бриф</a>
                    </Button>
                  </CardContent>
                </Card>

                <div className="mt-8 space-y-3">
                  {[
                    "Бесплатные правки в рамках ТЗ",
                    "Адаптив под все устройства",
                    "Обучение работе с сайтом",
                    "Техподдержка 60 дней"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Brief Form */}
          <section id="brief" className="max-w-2xl mx-auto">
            <Card className="luxury-card border-0">
              <CardContent className="p-8 md:p-12">
                <h2 className="text-2xl font-display font-semibold text-center mb-2">
                  Заполнить <span className="gradient-gold-text">бриф</span>
                </h2>
                <p className="text-muted-foreground text-center mb-8">
                  Расскажите о вашем проекте
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
                  
                  <div className="grid md:grid-cols-2 gap-6">
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
                      <label className="text-sm font-medium mb-2 block">Компания *</label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors"
                        placeholder="Название компании"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Опишите проект *</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors resize-none"
                      placeholder="Чем занимается компания? Какие разделы нужны на сайте? Есть ли примеры сайтов, которые нравятся?"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Бюджет</label>
                      <input
                        type="text"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors"
                        placeholder="Примерный бюджет"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Сроки</label>
                      <input
                        type="text"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors"
                        placeholder="Когда нужен результат?"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Отправить бриф
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

export default CorporatePage;
