import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShoppingCart, 
  CreditCard, 
  Package, 
  CheckCircle2, 
  Send,
  Truck,
  BarChart3,
  Shield,
  Loader2
} from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendToTelegram } from "@/lib/telegram";

const EcommercePage = () => {
  const { toast } = useToast();
  
  // Calculator state
  const [options, setOptions] = useState({
    design: "template",
    products: 100,
    payments: true,
    delivery: false,
    crm: false,
    warehouse: false,
    analytics: false,
    seo: false,
    urgency: "normal"
  });

  const price = useMemo(() => {
    let total = 100000;
    
    if (options.design === "unique") total += 50000;
    if (options.design === "premium") total += 100000;
    if (options.products > 100) total += Math.floor((options.products - 100) / 100) * 10000;
    if (options.payments) total += 20000;
    if (options.delivery) total += 25000;
    if (options.crm) total += 40000;
    if (options.warehouse) total += 35000;
    if (options.analytics) total += 15000;
    if (options.seo) total += 20000;
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await sendToTelegram({
      type: 'brief',
      service: 'Интернет-магазин',
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      description: formData.description,
      budget: formData.budget,
      deadline: formData.deadline,
    });
    
    setIsSubmitting(false);
    
    if (result.success) {
      toast({
        title: "Бриф отправлен!",
        description: "Мы свяжемся с вами в ближайшее время",
      });
      setFormData({ name: "", phone: "", email: "", company: "", description: "", budget: "", deadline: "" });
    } else {
      toast({
        title: "Ошибка отправки",
        description: "Попробуйте ещё раз или свяжитесь с нами другим способом",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Интернет-магазины — Разработка e-commerce | 24ZXC</title>
        <meta name="description" content="Создание интернет-магазинов с каталогом, корзиной и оплатой. Полная интеграция с CRM и службами доставки." />
        <link rel="canonical" href="https://24zxc.ru/services/ecommerce" />
        <meta property="og:title" content="Интернет-магазины — Разработка e-commerce | 24ZXC" />
        <meta property="og:description" content="Создание интернет-магазинов с каталогом, корзиной и оплатой. Полная интеграция с CRM и службами доставки." />
        <meta property="og:url" content="https://24zxc.ru/services/ecommerce" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({"@context":"https://schema.org","@type":"Service","name":"Разработка интернет-магазинов","provider":{"@type":"Organization","name":"24ZXC","url":"https://24zxc.ru/"},"areaServed":"RU","description":"E-commerce платформы с каталогом, корзиной, оплатой и интеграциями.","offers":{"@type":"Offer","priceCurrency":"RUB","price":"100000"}})}</script>
      </Helmet>
      <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Glowing orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-primary/5 rounded-full blur-[90px]" />
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 right-10 w-32 h-32 border border-primary/10 rotate-45 animate-float" />
        <div className="absolute top-[45%] left-6 w-20 h-20 border border-primary/5 rotate-[20deg] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/6 w-14 h-14 border border-primary/10 rotate-45 animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-3/4 left-1/4 w-8 h-8 bg-primary/10 rotate-45 animate-float" style={{ animationDelay: '3s' }} />
        
        {/* Diamond accents */}
        <div className="absolute top-[18%] left-[18%] w-3 h-3 bg-primary/20 rotate-45" />
        <div className="absolute top-[50%] right-[12%] w-2 h-2 bg-primary/30 rotate-45" />
        <div className="absolute bottom-[35%] left-[6%] w-2 h-2 bg-primary/20 rotate-45" />
        <div className="absolute top-[75%] right-[20%] w-2 h-2 bg-primary/15 rotate-45" />
        
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
        <div className="absolute top-[35%] left-0 w-28 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-[65%] right-0 w-36 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <Header />
      
      <main className="pt-32 pb-24 relative z-10">
        <div className="container px-4">
          {/* Hero */}
          <div className="text-center mb-20 relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              <ShoppingCart className="w-3 h-3 mr-1" />
              Веб-разработка
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-gold-text">Интернет-магазины</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              E-commerce платформы любой сложности
            </p>
            
            <div className="text-3xl font-display font-bold relative inline-block">
              <span className="gradient-gold-text">от 100 000 ₽</span>
              <span className="absolute inset-0 gradient-gold-text shimmer">от 100 000 ₽</span>
            </div>
          </div>

          {/* Features */}
          <section className="mb-24">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: CreditCard, title: "Онлайн-оплата", desc: "Все платёжные системы" },
                { icon: Truck, title: "Доставка", desc: "Интеграция со службами" },
                { icon: Package, title: "Склад", desc: "Учёт остатков" },
                { icon: BarChart3, title: "Аналитика", desc: "Отчёты и статистика" },
              ].map((item, i) => (
                <Card key={i} className="luxury-card border-0 group hover:border-primary/30 transition-all duration-500">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 relative icon-glow group-hover:bg-primary/20 transition-colors">
                      <item.icon className="w-6 h-6 text-primary relative z-10" />
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
                        { value: "unique", label: "Уникальный", price: "+50 000 ₽" },
                        { value: "premium", label: "Премиум", price: "+100 000 ₽" }
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

                  {/* Products */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">
                      Количество товаров: {options.products}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="100"
                      value={options.products}
                      onChange={(e) => setOptions({ ...options, products: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>100 товаров</span>
                      <span>1000+ товаров</span>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium mb-3 block">Функционал</label>
                    {[
                      { key: "payments", label: "Онлайн-оплата", price: "+20 000 ₽" },
                      { key: "delivery", label: "Интеграция доставки", price: "+25 000 ₽" },
                      { key: "crm", label: "CRM-система", price: "+40 000 ₽" },
                      { key: "warehouse", label: "Складской учёт", price: "+35 000 ₽" },
                      { key: "analytics", label: "Аналитика продаж", price: "+15 000 ₽" },
                      { key: "seo", label: "SEO-оптимизация", price: "+20 000 ₽" },
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
                    "Полная документация",
                    "Обучение работе с магазином",
                    "Загрузка первых 100 товаров",
                    "Техподдержка 90 дней"
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
                      <label className="text-sm font-medium mb-2 block">Компания</label>
                      <input
                        type="text"
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
                      placeholder="Что продаёте? Сколько товаров? Какие интеграции нужны? Есть ли примеры магазинов, которые нравятся?"
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
                  
                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Отправить бриф
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default EcommercePage;
