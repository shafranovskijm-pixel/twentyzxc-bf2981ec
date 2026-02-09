import { useState, useEffect } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, Globe, Award, ChevronRight, Mail, Phone, MapPin, Briefcase, Target, TrendingUp, Calendar, Shield, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter, ScrollReveal, StaggerContainer, StaggerItem, TiltCard, VideoPlaceholder } from "../shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExecutiveSuitePreviewProps {
  template: Template;
}

export const ExecutiveSuitePreview = ({ template }: ExecutiveSuitePreviewProps) => {
  const [activeTab, setActiveTab] = useState("consulting");

  const services = [
    { id: "consulting", title: "Консалтинг", desc: "Стратегическое планирование и оптимизация бизнес-процессов для достижения ваших целей", icon: Briefcase, features: ["Аудит процессов", "Разработка стратегии", "Оптимизация структуры", "KPI система"] },
    { id: "analytics", title: "Аналитика", desc: "Глубокий анализ данных и построение actionable инсайтов для принятия решений", icon: TrendingUp, features: ["Big Data анализ", "Предиктивная аналитика", "Визуализация данных", "Отчётность"] },
    { id: "digital", title: "Цифровизация", desc: "Комплексная цифровая трансформация бизнеса с внедрением современных технологий", icon: Target, features: ["Автоматизация", "Cloud решения", "Интеграция систем", "Обучение"] },
  ];

  const team = [
    { name: "Александр Петров", role: "Генеральный директор", exp: "20+ лет опыта" },
    { name: "Мария Иванова", role: "Финансовый директор", exp: "15+ лет опыта" },
    { name: "Дмитрий Сидоров", role: "Технический директор", exp: "12+ лет опыта" },
    { name: "Елена Козлова", role: "Директор по развитию", exp: "10+ лет опыта" },
  ];

  const partners = ["Microsoft", "SAP", "Oracle", "Salesforce", "IBM", "AWS"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 border-b border-blue-500/10 bg-slate-950/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">EXECUTIVE</span>
              <div className="text-[10px] tracking-[0.2em] text-blue-400">SUITE</div>
            </div>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-8">
            {["О компании", "Услуги", "Проекты", "Команда", "Карьера", "Контакты"].map((item, i) => (
              <motion.a 
                key={item}
                href="#"
                className="text-sm text-white/60 hover:text-blue-400 transition-colors"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hidden md:flex">
              <Phone className="w-4 h-4 mr-2" />
              +7 (495) 123-45-67
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              Консультация
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-400">Надёжный партнёр с 2005 года</span>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  Строим <span className="text-blue-400">надёжное</span> будущее вашего бизнеса
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={0.4}>
                <p className="text-lg text-white/60 mb-8 max-w-lg">
                  Комплексный консалтинг и стратегическое сопровождение для компаний, 
                  которые стремятся к лидерству на рынке
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.6}>
                <div className="flex flex-wrap gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white px-8">
                      Начать проект
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                    Наши кейсы
                  </Button>
                </div>
              </ScrollReveal>

              {/* Trust indicators */}
              <ScrollReveal delay={0.8}>
                <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10">
                  {[
                    { value: 500, suffix: "+", label: "Проектов" },
                    { value: 18, suffix: "", label: "Лет опыта" },
                    { value: 150, suffix: "+", label: "Экспертов" },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div className="text-2xl font-bold text-blue-400">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2} />
                      </div>
                      <div className="text-xs text-white/40">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal direction="right" delay={0.4}>
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-500/10 blur-xl rounded-3xl" />
                <div className="relative aspect-[4/3] rounded-2xl bg-slate-800/50 border border-white/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                  {/* Chart visualization */}
                  <div className="absolute inset-0 p-8 flex items-end gap-3">
                    {[45, 62, 38, 75, 55, 82, 68, 90].map((h, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400"
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                      />
                    ))}
                  </div>
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div>
                      <div className="text-white/40 text-sm mb-1">Рост клиентов</div>
                      <div className="text-white text-3xl font-bold">+247%</div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      +18.5%
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-blue-500/10 bg-blue-500/5">
        <div className="container mx-auto px-6">
          <StaggerContainer className="grid md:grid-cols-4 gap-8" staggerDelay={0.1}>
            {[
              { icon: Building2, value: 18, suffix: "+", label: "Лет на рынке" },
              { icon: Users, value: 500, suffix: "+", label: "Реализованных проектов" },
              { icon: Globe, value: 30, suffix: "+", label: "Стран присутствия" },
              { icon: Award, value: 50, suffix: "+", label: "Профессиональных наград" },
            ].map(({ icon: Icon, value, suffix, label }, i) => (
              <StaggerItem key={i}>
                <motion.div 
                  className="text-center p-6 rounded-xl hover:bg-blue-500/5 transition-colors"
                  whileHover={{ y: -5 }}
                >
                  <Icon className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                  <div className="text-4xl font-bold text-white mb-2">
                    <AnimatedCounter value={value} suffix={suffix} duration={2} />
                  </div>
                  <div className="text-white/50 text-sm">{label}</div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Наши <span className="text-blue-400">услуги</span></h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Комплексные решения для развития вашего бизнеса
              </p>
            </div>
          </ScrollReveal>

          <Tabs defaultValue="consulting" className="w-full">
            <ScrollReveal delay={0.2}>
              <TabsList className="w-full max-w-md mx-auto bg-slate-800/50 border border-white/10 p-1 rounded-xl mb-12">
                {services.map((s) => (
                  <TabsTrigger 
                    key={s.id}
                    value={s.id}
                    className="data-[state=active]:bg-blue-600 text-white/60 data-[state=active]:text-white rounded-lg flex-1"
                  >
                    {s.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollReveal>

            {services.map((service) => (
              <TabsContent key={service.id} value={service.id}>
                <motion.div 
                  className="grid lg:grid-cols-2 gap-12 items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div>
                    <service.icon className="w-16 h-16 text-blue-400 mb-6" />
                    <h3 className="text-3xl font-bold text-white mb-4">{service.title}</h3>
                    <p className="text-white/60 mb-8 text-lg">{service.desc}</p>
                    <ul className="space-y-4 mb-8">
                      {service.features.map((feature, fi) => (
                        <li key={fi} className="flex items-center gap-3 text-white/70">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-blue-400" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                      Подробнее
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  <div className="aspect-square rounded-2xl bg-slate-800/50 border border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                    <div className="absolute inset-4 rounded-xl border border-blue-500/20" />
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Наша <span className="text-blue-400">команда</span></h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Эксперты с многолетним опытом в своих областях
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
            {team.map((member, i) => (
              <StaggerItem key={i}>
                <motion.div 
                  className="group"
                  whileHover={{ y: -8 }}
                >
                  <div className="aspect-[3/4] rounded-2xl bg-slate-800/50 border border-white/10 relative overflow-hidden mb-4 group-hover:border-blue-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h4 className="font-bold text-white text-lg">{member.name}</h4>
                      <p className="text-blue-400 text-sm">{member.role}</p>
                      <p className="text-white/40 text-xs mt-1">{member.exp}</p>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 border-y border-blue-500/10">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-8">
              <p className="text-white/40 text-sm uppercase tracking-widest">Наши партнёры</p>
            </div>
          </ScrollReveal>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {partners.map((partner, i) => (
              <motion.div
                key={partner}
                className="text-2xl font-bold text-white/20 hover:text-blue-400/50 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                {partner}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="relative p-12 md:p-20 rounded-3xl overflow-hidden text-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-400/20" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Готовы к <span className="text-blue-400">трансформации</span>?
                </h2>
                <p className="text-white/60 max-w-xl mx-auto mb-10">
                  Свяжитесь с нами для бесплатной консультации и оценки вашего проекта
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white px-8">
                    Получить консультацию
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                    <Phone className="w-4 h-4 mr-2" />
                    +7 (495) 123-45-67
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-blue-400" />
                <span className="font-bold text-lg">EXECUTIVE SUITE</span>
              </div>
              <p className="text-white/40 text-sm">Стратегический консалтинг для лидеров рынка</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Услуги</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li>Консалтинг</li>
                <li>Аналитика</li>
                <li>Цифровизация</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Компания</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li>О нас</li>
                <li>Команда</li>
                <li>Карьера</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Контакты</h4>
              <div className="space-y-2 text-white/50 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-400" />
                  +7 (495) 123-45-67
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  info@executive.ru
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Москва, Пресненская наб. 12
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/30 text-sm">
            © 2024 Executive Suite. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
};
