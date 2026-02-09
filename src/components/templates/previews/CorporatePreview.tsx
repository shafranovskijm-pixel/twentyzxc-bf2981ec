import { useState } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, Globe, Award, ChevronRight, Mail, Phone, MapPin, Briefcase, Target, TrendingUp, Calendar, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter, PreviewParticles, ScrollReveal, StaggerContainer, StaggerItem, TiltCard, LogoCarousel, VideoPlaceholder } from "./shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useCallback } from "react";

interface CorporatePreviewProps {
  template: Template;
}

export const CorporatePreview = ({ template }: CorporatePreviewProps) => {
  const accentClass = template.accentColor.replace('bg-', '');
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  
  // Auto-scroll logos
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 3000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  const services = [
    { title: "Консалтинг", desc: "Стратегический и операционный консалтинг для оптимизации бизнес-процессов", icon: Briefcase },
    { title: "Аналитика", desc: "Глубокий анализ данных и разработка actionable инсайтов", icon: TrendingUp },
    { title: "Трансформация", desc: "Цифровая трансформация и внедрение инновационных технологий", icon: Target },
  ];

  const team = [
    { name: "Александр Петров", role: "CEO", exp: "15+ лет" },
    { name: "Мария Иванова", role: "CFO", exp: "12+ лет" },
    { name: "Дмитрий Сидоров", role: "CTO", exp: "10+ лет" },
    { name: "Елена Козлова", role: "CMO", exp: "8+ лет" },
  ];

  const timeline = [
    { year: "2010", title: "Основание компании", desc: "Старт с командой из 5 человек" },
    { year: "2015", title: "Международная экспансия", desc: "Открытие офисов в 5 странах" },
    { year: "2020", title: "Цифровая трансформация", desc: "Запуск собственной SaaS-платформы" },
    { year: "2024", title: "Лидерство в отрасли", desc: "500+ клиентов по всему миру" },
  ];

  const news = [
    { date: "15 янв 2024", title: "Компания вошла в топ-10 консалтинговых фирм", tag: "Новость" },
    { date: "10 янв 2024", title: "Открытие нового офиса в Дубае", tag: "Расширение" },
    { date: "05 янв 2024", title: "Партнёрство с Microsoft", tag: "Партнёрство" },
  ];

  const megaMenuItems = {
    "Услуги": ["Консалтинг", "Аналитика", "Трансформация", "Аутсорсинг", "Обучение"],
    "О компании": ["История", "Миссия", "Команда", "Карьера", "Контакты"],
    "Проекты": ["Кейсы", "Отрасли", "Клиенты", "Отзывы"],
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${template.gradient} relative`}>
      <PreviewParticles count={30} color="rgba(255,255,255,0.3)" />

      {/* Header with Mega Menu */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className={`w-10 h-10 rounded-lg ${template.accentColor} flex items-center justify-center`}>
              <Building2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-bold text-lg text-white block leading-tight">Corporation</span>
              <span className="text-xs text-white/40">Since 2010</span>
            </div>
          </motion.div>

          {/* Mega Menu Navigation */}
          <nav className="hidden lg:flex items-center gap-1 relative">
            {Object.entries(megaMenuItems).map(([item, subItems]) => (
              <div 
                key={item}
                className="relative"
                onMouseEnter={() => setActiveNavItem(item)}
                onMouseLeave={() => setActiveNavItem(null)}
              >
                <button className="px-4 py-2 text-white/70 hover:text-white transition-colors text-sm font-medium flex items-center gap-1">
                  {item}
                  <ChevronDown className="w-3 h-3" />
                </button>
                <AnimatePresence>
                  {activeNavItem === item && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-48 py-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl"
                    >
                      {subItems.map((sub) => (
                        <a 
                          key={sub}
                          href="#"
                          className="block px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-colors"
                        >
                          {sub}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {["Карьера", "Контакты"].map((item) => (
              <a key={item} href="#" className="px-4 py-2 text-white/70 hover:text-white transition-colors text-sm font-medium">
                {item}
              </a>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button className={`${template.accentColor} text-black hover:opacity-90`}>
              Связаться
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <ScrollReveal>
                <div className="text-white/40 uppercase tracking-widest text-sm mb-4">
                  Лидер отрасли
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Строим <span className={`text-${accentClass}`}>надёжное</span> будущее
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={0.4}>
                <p className="text-lg text-white/60 mb-8">
                  Мы помогаем бизнесу расти и развиваться, предоставляя комплексные решения 
                  для достижения стратегических целей
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.6}>
                <div className="flex flex-wrap gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className={`${template.accentColor} text-black hover:opacity-90`}>
                      Узнать больше
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Наши проекты
                  </Button>
                </div>
              </ScrollReveal>
            </div>
            <ScrollReveal direction="right" delay={0.4}>
              <div className="relative">
                <motion.div 
                  className="aspect-[4/3] rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  {/* Animated chart mockup */}
                  <div className="absolute inset-0 p-8 flex items-end gap-2">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <motion.div
                        key={i}
                        className={`flex-1 rounded-t-md ${template.accentColor}`}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                      />
                    ))}
                  </div>
                  <div className="absolute top-4 left-4">
                    <div className="text-white/40 text-sm mb-1">Рост выручки</div>
                    <div className="text-white text-2xl font-bold">+247%</div>
                  </div>
                </motion.div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-6">
          <StaggerContainer className="grid lg:grid-cols-4 gap-8" staggerDelay={0.15}>
            {[
              { icon: Building2, value: 15, suffix: "+", label: "Лет на рынке" },
              { icon: Users, value: 500, suffix: "+", label: "Сотрудников" },
              { icon: Globe, value: 30, suffix: "+", label: "Стран присутствия" },
              { icon: Award, value: 100, suffix: "+", label: "Наград и премий" },
            ].map(({ icon: Icon, value, suffix, label }, i) => (
              <StaggerItem key={i}>
                <motion.div 
                  className="text-center p-6 rounded-xl hover:bg-white/5 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <Icon className={`w-8 h-8 text-${accentClass} mx-auto mb-4`} />
                  <div className="text-4xl font-bold text-white mb-2">
                    <AnimatedCounter value={value} suffix={suffix} duration={2} />
                  </div>
                  <div className="text-white/50">{label}</div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Services with Tabs */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="text-white/40 uppercase tracking-widest text-sm mb-2">Наши услуги</div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Что мы предлагаем</h2>
              </div>
            </div>
          </ScrollReveal>

          <Tabs defaultValue="0" className="w-full">
            <ScrollReveal delay={0.2}>
              <TabsList className="w-full md:w-auto bg-white/5 border border-white/10 p-1 rounded-xl mb-8">
                {services.map((s, i) => (
                  <TabsTrigger 
                    key={i} 
                    value={String(i)}
                    className="data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white rounded-lg px-6"
                  >
                    {s.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollReveal>
            
            {services.map((service, i) => (
              <TabsContent key={i} value={String(i)}>
                <motion.div 
                  className="grid md:grid-cols-2 gap-8 items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <service.icon className={`w-16 h-16 text-${accentClass} mb-6`} />
                    <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
                    <p className="text-white/60 mb-6">{service.desc}</p>
                    <ul className="space-y-3">
                      {["Комплексный анализ", "Разработка стратегии", "Внедрение решений", "Сопровождение"].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-white/70">
                          <ChevronRight className={`w-4 h-4 text-${accentClass}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="aspect-square rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                    <div className={`absolute inset-4 rounded-xl border border-${accentClass}/30`} />
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-white/40 uppercase tracking-widest text-sm mb-2">Наша история</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Путь к успеху</h2>
            </div>
          </ScrollReveal>

          <div className="max-w-4xl mx-auto relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 hidden md:block" />
            
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <ScrollReveal key={i} direction={i % 2 === 0 ? "left" : "right"} delay={i * 0.15}>
                  <div className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                    <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : ""}`}>
                      <div className={`text-${accentClass} font-bold text-2xl mb-2`}>{item.year}</div>
                      <h4 className="text-xl font-semibold text-white mb-2">{item.title}</h4>
                      <p className="text-white/60">{item.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${template.accentColor} relative z-10 hidden md:block`}>
                      <div className={`absolute inset-0 rounded-full ${template.accentColor} animate-ping opacity-30`} />
                    </div>
                    <div className="flex-1" />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team with flip cards */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="text-white/40 uppercase tracking-widest text-sm mb-2">Наша команда</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Эксперты своего дела</h2>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
            {team.map((member, i) => (
              <StaggerItem key={i}>
                <motion.div 
                  className="group perspective-1000"
                  whileHover={{ y: -10 }}
                >
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 group-hover:bg-white/5 transition-colors" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h4 className="font-semibold text-white text-lg">{member.name}</h4>
                      <p className={`text-${accentClass}`}>{member.role}</p>
                      <p className="text-white/50 text-sm mt-1">{member.exp} опыта</p>
                    </div>
                    {/* Hover overlay */}
                    <motion.div 
                      className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="text-center p-6">
                        <p className="text-white/70 mb-4">Эксперт в стратегическом развитии и управлении</p>
                        <Button size="sm" variant="outline" className="border-white/20 text-white">
                          Профиль
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Clients Carousel */}
      <section className="py-16 border-y border-white/10 bg-white/5">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-8">
              <div className="text-white/40 text-sm">Нам доверяют</div>
            </div>
          </ScrollReveal>
          
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
                <div key={i} className="flex-[0_0_150px] min-w-0">
                  <div className="h-16 rounded-lg bg-white/10 flex items-center justify-center text-white/30 font-bold">
                    LOGO {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* News */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="text-white/40 uppercase tracking-widest text-sm mb-2">Новости</div>
                <h2 className="text-3xl font-bold text-white">Последние события</h2>
              </div>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Все новости
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-3 gap-6" staggerDelay={0.15}>
            {news.map((item, i) => (
              <StaggerItem key={i}>
                <TiltCard>
                  <motion.div 
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer h-full"
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${template.accentColor} text-black`}>
                        {item.tag}
                      </span>
                      <span className="text-white/40 text-sm">{item.date}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-4">{item.title}</h4>
                    <a href="#" className={`text-${accentClass} text-sm flex items-center gap-1 hover:underline`}>
                      Читать далее
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </motion.div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 bg-white/5 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            <ScrollReveal>
              <div>
                <div className="text-white/40 uppercase tracking-widest text-sm mb-2">Контакты</div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Свяжитесь с нами</h2>
                <div className="space-y-6">
                  {[
                    { icon: Mail, text: "info@corporation.com" },
                    { icon: Phone, text: "+7 (495) 123-45-67" },
                    { icon: MapPin, text: "Москва, ул. Примерная, 123" },
                  ].map(({ icon: Icon, text }) => (
                    <motion.div 
                      key={text} 
                      className="flex items-center gap-4"
                      whileHover={{ x: 5 }}
                    >
                      <div className={`w-12 h-12 rounded-lg ${template.accentColor} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-black" />
                      </div>
                      <span className="text-white/70">{text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="p-8 rounded-2xl bg-black/30 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6">Напишите нам</h3>
                <form className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Ваше имя" 
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none"
                  />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none"
                  />
                  <textarea 
                    placeholder="Сообщение" 
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none resize-none"
                  />
                  <Button className={`w-full ${template.accentColor} text-black hover:opacity-90`}>
                    Отправить
                  </Button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 border-y border-white/10">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-8">
              <h3 className="text-white/50 text-sm uppercase tracking-widest">Наши партнёры</h3>
            </div>
          </ScrollReveal>
          <LogoCarousel accentColor={accentClass.split("-")[0]} />
        </div>
      </section>

      {/* Video Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="text-white/40 uppercase tracking-widest text-sm mb-2">О компании</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Узнайте больше о нас</h2>
            </div>
          </ScrollReveal>
          <div className="max-w-4xl mx-auto">
            <ScrollReveal delay={0.2}>
              <VideoPlaceholder 
                accentColor={template.accentColor} 
                title="Презентация компании"
                duration="3:45"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg ${template.accentColor} flex items-center justify-center`}>
                  <Building2 className="w-5 h-5 text-black" />
                </div>
                <span className="font-bold text-white">Corporation</span>
              </div>
              <p className="text-white/50 text-sm">
                Лидер в области бизнес-консалтинга и стратегического развития
              </p>
            </div>
            {[
              { title: "Услуги", links: ["Консалтинг", "Аналитика", "Трансформация"] },
              { title: "Компания", links: ["О нас", "Команда", "Карьера"] },
              { title: "Контакты", links: ["Москва", "Санкт-Петербург", "Казань"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/40 text-sm">© 2024 Corporation. Все права защищены.</div>
            <div className="flex gap-4">
              {["Политика конфиденциальности", "Условия использования"].map((link) => (
                <a key={link} href="#" className="text-white/40 hover:text-white text-sm transition-colors">{link}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
