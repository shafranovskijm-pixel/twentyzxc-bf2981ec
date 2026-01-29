import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { useCountUp } from "@/hooks/use-count-up";
import { Mail, Phone, MapPin, Diamond, Sparkles, Target, Zap, Shield, Award, TrendingUp } from "lucide-react";

const StatItem = ({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) => {
  const { ref, displayValue } = useCountUp({ end: value, duration: 2000, suffix });
  
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-display font-bold gradient-gold-text mb-2">
        {displayValue}
      </div>
      <div className="text-muted-foreground text-sm uppercase tracking-widest">{label}</div>
    </div>
  );
};

const About = () => {
  const principles = [
    {
      icon: Target,
      title: "Точность",
      description: "Каждая деталь продумана до мелочей. Мы не идём на компромиссы в качестве."
    },
    {
      icon: Zap,
      title: "Скорость",
      description: "Быстрая разработка без потери качества. Время — ваш главный ресурс."
    },
    {
      icon: Shield,
      title: "Надёжность",
      description: "Проверенные технологии и решения, которые работают годами."
    },
    {
      icon: Sparkles,
      title: "Эстетика",
      description: "Красота в каждом пикселе. Ваш бренд заслуживает лучшего."
    }
  ];

  const expertise = [
    { icon: Award, title: "Веб-разработка", desc: "Сайты любой сложности" },
    { icon: TrendingUp, title: "Продвижение", desc: "SEO, контекст, таргет" },
    { icon: Diamond, title: "Брендинг", desc: "Фирменный стиль и дизайн" }
  ];

  const requisites = [
    { label: "Наименование", value: "ИП Шафрановский Максим Михайлович" },
    { label: "ОГРНИП", value: "324253600042754" },
    { label: "ИНН", value: "253615392404" },
    { label: "Дата регистрации", value: "08 мая 2024 г." },
    { label: "Основной вид деятельности", value: "63.11 — Деятельность по обработке данных, предоставление услуг по размещению информации" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(45_80%_55%/0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(45_80%_55%/0.08),transparent_50%)]" />
        
        {/* Floating elements */}
        <div className="absolute top-40 left-10 w-32 h-32 border border-primary/10 rotate-45 animate-float opacity-30" />
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-primary/20 rotate-12 animate-float opacity-20" style={{ animationDelay: '2s' }} />
        
        <div className="container px-4 relative z-10">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <Diamond className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm tracking-widest uppercase">О компании</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-tight">
              Создаём <span className="gradient-gold-text">цифровое</span><br />
              превосходство
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Мы — команда, которая превращает идеи в премиальные digital-продукты. 
              Каждый проект — это искусство.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative">
        <div className="container px-4">
          <div className="luxury-card rounded-lg p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <StatItem value={150} suffix="+" label="Проектов" />
              <StatItem value={98} suffix="%" label="Довольных клиентов" />
              <StatItem value={5} suffix="+" label="Лет опыта" />
              <StatItem value={24} suffix="/7" label="Поддержка" />
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-secondary/30" />
        
        <div className="container px-4 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <span className="text-primary text-sm tracking-[0.3em] uppercase mb-4 block">Философия</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Принципы, которые <span className="gradient-gold-text">определяют нас</span>
            </h2>
            <div className="divider-gold w-24 mx-auto mt-6" />
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {principles.map((item, index) => (
              <AnimatedSection key={item.title} delay={index * 0.1}>
                <div className="luxury-card p-8 rounded-lg h-full text-center group hover:border-primary/40 transition-all duration-500">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-3 gradient-gold-text">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection direction="left">
              <span className="text-primary text-sm tracking-[0.3em] uppercase mb-4 block">Экспертиза</span>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                Полный цикл <span className="gradient-gold-text">digital-услуг</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                От идеи до реализации — мы сопровождаем ваш проект на каждом этапе. 
                Наша команда объединяет экспертизу в разработке, дизайне и маркетинге 
                для создания продуктов, которые работают.
              </p>
              <div className="space-y-4">
                {expertise.map((item, index) => (
                  <div key={item.title} className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors group">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            
            <AnimatedSection direction="right" delay={0.2}>
              <div className="relative">
                {/* Decorative card stack */}
                <div className="absolute -top-4 -left-4 w-full h-full rounded-lg border border-primary/20 bg-card/50" />
                <div className="absolute -top-2 -left-2 w-full h-full rounded-lg border border-primary/30 bg-card/70" />
                <div className="relative luxury-card rounded-lg p-10">
                  <div className="text-center">
                    <div className="text-8xl font-display font-bold gradient-gold-text mb-4">ZXC</div>
                    <div className="divider-gold mb-6" />
                    <p className="text-muted-foreground uppercase tracking-[0.2em] text-sm">Premium Digital Solutions</p>
                  </div>
                  
                  <div className="mt-10 pt-8 border-t border-border">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-display font-bold text-primary">01</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Анализ</div>
                      </div>
                      <div>
                        <div className="text-2xl font-display font-bold text-primary">02</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Дизайн</div>
                      </div>
                      <div>
                        <div className="text-2xl font-display font-bold text-primary">03</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Запуск</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(45_80%_55%/0.1),transparent_70%)]" />
        
        <div className="container px-4 relative z-10">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Готовы создать что-то <span className="gradient-gold-text">выдающееся</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Расскажите о вашем проекте, и мы предложим лучшее решение
            </p>
            <a 
              href="/#contact" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-sm hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Обсудить проект
            </a>
          </AnimatedSection>
        </div>
      </section>

      {/* Requisites Section */}
      <section className="py-20 relative">
        <div className="container px-4">
          <AnimatedSection className="text-center mb-12">
            <span className="text-primary text-sm tracking-[0.3em] uppercase mb-4 block">Юридическая информация</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Реквизиты</h2>
            <div className="divider-gold w-24 mx-auto" />
          </AnimatedSection>
          
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="luxury-card p-8 md:p-10 rounded-lg">
                <div className="space-y-5">
                  {requisites.map((item, index) => (
                    <div 
                      key={item.label} 
                      className="flex flex-col sm:flex-row sm:items-start gap-2 pb-5 border-b border-border/50 last:border-0 last:pb-0"
                    >
                      <span className="text-muted-foreground text-sm min-w-[200px] uppercase tracking-wider">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="divider-gold my-8" />
                
                {/* Contact Info */}
                <div className="grid sm:grid-cols-3 gap-6">
                  <a 
                    href="mailto:shafranovskij.m@gmail.com" 
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm">shafranovskij.m@gmail.com</span>
                  </a>
                  <a 
                    href="tel:89147213424" 
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm">+7 (914) 721-34-24</span>
                  </a>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm">Приморский край, г. Владивосток</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
