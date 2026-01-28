import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Code2, 
  Cpu, 
  Cloud, 
  CheckCircle2, 
  Send,
  Zap,
  Shield,
  Database
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const WebAppPage = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    projectType: "",
    description: "",
    features: "",
    integrations: "",
    users: "",
    budget: "",
    deadline: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Заявка отправлена",
      description: "Мы свяжемся с вами в ближайшее время",
    });
    setFormData({ 
      name: "", phone: "", email: "", company: "", projectType: "",
      description: "", features: "", integrations: "", users: "", budget: "", deadline: "" 
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Glowing orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 right-10 w-32 h-32 border border-primary/10 rotate-45 animate-float" />
        <div className="absolute top-[55%] left-4 w-24 h-24 border border-primary/5 rotate-[15deg] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[20%] right-[15%] w-16 h-16 border border-primary/10 rotate-[60deg] animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[70%] left-[20%] w-10 h-10 bg-primary/10 rotate-45 animate-float" style={{ animationDelay: '3s' }} />
        
        {/* Diamond accents */}
        <div className="absolute top-[22%] left-[10%] w-3 h-3 bg-primary/20 rotate-45" />
        <div className="absolute top-[48%] right-[6%] w-2 h-2 bg-primary/30 rotate-45" />
        <div className="absolute bottom-[40%] left-[4%] w-2 h-2 bg-primary/20 rotate-45" />
        <div className="absolute top-[80%] right-[25%] w-2 h-2 bg-primary/15 rotate-45" />
        
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
        <div className="absolute top-[30%] left-0 w-24 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-[60%] right-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <Header />
      
      <main className="pt-32 pb-24 relative z-10">
        <div className="container px-4">
          {/* Hero */}
          <div className="text-center mb-20 relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              <Code2 className="w-3 h-3 mr-1" />
              Веб-разработка
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-gold-text">Веб-приложения</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              SPA, PWA, сложные системы
            </p>
            
            <div className="text-3xl font-display font-bold gradient-gold-text">
              индивидуально
            </div>
          </div>

          {/* Features */}
          <section className="mb-24">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Zap, title: "Производительность", desc: "Мгновенный отклик" },
                { icon: Cloud, title: "Облачные решения", desc: "Масштабируемость" },
                { icon: Shield, title: "Безопасность", desc: "Защита данных" },
                { icon: Database, title: "Интеграции", desc: "Любые API и сервисы" },
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

          {/* What we build */}
          <section className="mb-24">
            <h2 className="text-3xl font-display font-semibold text-center mb-12">
              Что мы <span className="gradient-gold-text">разрабатываем</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  title: "SPA приложения",
                  items: [
                    "Личные кабинеты",
                    "Админ-панели",
                    "Дашборды",
                    "CRM-системы"
                  ]
                },
                {
                  title: "PWA приложения",
                  items: [
                    "Работа офлайн",
                    "Push-уведомления",
                    "Установка на устройство",
                    "Мобильный опыт"
                  ]
                },
                {
                  title: "Сложные системы",
                  items: [
                    "ERP-системы",
                    "Маркетплейсы",
                    "Сервисы бронирования",
                    "Образовательные платформы"
                  ]
                }
              ].map((category, i) => (
                <Card key={i} className="luxury-card border-0">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-display font-semibold mb-6 gradient-gold-text">
                      {category.title}
                    </h3>
                    <ul className="space-y-3">
                      {category.items.map((item, j) => (
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

          {/* Tech stack */}
          <section className="mb-24">
            <h2 className="text-3xl font-display font-semibold text-center mb-12">
              <span className="gradient-gold-text">Технологии</span>
            </h2>
            
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              {[
                "React", "TypeScript", "Node.js", "PostgreSQL", 
                "Supabase", "Next.js", "Tailwind CSS", "Docker",
                "REST API", "GraphQL", "WebSocket", "Redis"
              ].map((tech, i) => (
                <Badge key={i} variant="outline" className="border-primary/30 text-foreground px-4 py-2">
                  {tech}
                </Badge>
              ))}
            </div>
          </section>

          {/* Brief Form */}
          <section id="brief" className="max-w-3xl mx-auto">
            <Card className="luxury-card border-0">
              <CardContent className="p-8 md:p-12">
                <h2 className="text-2xl font-display font-semibold text-center mb-2">
                  Заполнить <span className="gradient-gold-text">бриф</span>
                </h2>
                <p className="text-muted-foreground text-center mb-8">
                  Расскажите о вашем проекте подробнее
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
                    <label className="text-sm font-medium mb-2 block">Тип проекта *</label>
                    <select
                      required
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">Выберите тип</option>
                      <option value="spa">SPA-приложение (личный кабинет, админка)</option>
                      <option value="pwa">PWA-приложение (мобильный опыт)</option>
                      <option value="crm">CRM/ERP система</option>
                      <option value="marketplace">Маркетплейс / Агрегатор</option>
                      <option value="lms">Образовательная платформа (LMS)</option>
                      <option value="booking">Сервис бронирования</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Описание проекта *</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors resize-none"
                      placeholder="Опишите идею проекта, какую задачу он должен решать?"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Основной функционал</label>
                    <textarea
                      rows={3}
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors resize-none"
                      placeholder="Перечислите основные функции, которые должны быть в приложении"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Интеграции</label>
                      <input
                        type="text"
                        value={formData.integrations}
                        onChange={(e) => setFormData({ ...formData, integrations: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors"
                        placeholder="1С, CRM, платёжные системы..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ожидаемая нагрузка</label>
                      <input
                        type="text"
                        value={formData.users}
                        onChange={(e) => setFormData({ ...formData, users: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-sm focus:border-primary focus:outline-none transition-colors"
                        placeholder="Сколько пользователей ожидается?"
                      />
                    </div>
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

export default WebAppPage;
