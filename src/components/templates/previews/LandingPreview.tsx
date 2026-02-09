import { useState } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, CheckCircle, Play, ChevronDown, Quote, Sparkles, Zap, Shield, Clock, MessageCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AnimatedCounter, 
  PreviewParticles, 
  FloatingOrbs,
  TiltCard, 
  TypewriterText, 
  ScrollReveal, 
  StaggerContainer, 
  StaggerItem 
} from "./shared";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useCallback } from "react";

interface LandingPreviewProps {
  template: Template;
}

export const LandingPreview = ({ template }: LandingPreviewProps) => {
  const accentClass = template.accentColor.replace('bg-', '');
  const [activeTab, setActiveTab] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-scroll carousel
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  // Track current slide
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const testimonials = [
    { text: "Превосходное качество работы! Сайт превзошёл все ожидания.", author: "Александр М.", role: "CEO, TechCorp" },
    { text: "Очень профессиональный подход и внимание к деталям.", author: "Елена К.", role: "Основатель, Startup X" },
    { text: "Рекомендую всем, кто ценит качество и скорость.", author: "Дмитрий С.", role: "Директор, MediaGroup" },
  ];

  const pricingPlans = [
    { name: "Базовый", price: "45 000", features: ["Лендинг до 5 экранов", "Адаптивный дизайн", "SEO-оптимизация", "Форма заявки"], popular: false },
    { name: "Профи", price: "75 000", features: ["Лендинг до 10 экранов", "Анимации и эффекты", "Интеграция CRM", "A/B тестирование", "Аналитика"], popular: true },
    { name: "Премиум", price: "120 000", features: ["Безлимитные экраны", "3D-элементы", "Видео-фон", "Мультиязычность", "Поддержка 3 мес."], popular: false },
  ];

  const faqs = [
    { q: "Какие сроки разработки лендинга?", a: "Стандартный срок — 7-14 дней в зависимости от сложности проекта. Срочные заказы выполняем за 3-5 дней." },
    { q: "Что входит в стоимость?", a: "Дизайн, верстка, адаптив, базовая SEO-оптимизация, форма заявки с отправкой на email или в Telegram." },
    { q: "Можно ли вносить правки после сдачи?", a: "Да, 2 раунда правок включены в стоимость. Дополнительные изменения оплачиваются отдельно." },
    { q: "Предоставляете ли вы хостинг?", a: "Мы можем разместить ваш сайт на нашем хостинге или помочь с настройкой на вашем сервере." },
  ];

  const features = [
    { icon: Zap, title: "Быстрая загрузка", desc: "Оптимизация производительности для максимальной скорости" },
    { icon: Shield, title: "Безопасность", desc: "SSL-сертификат и защита от атак включены" },
    { icon: Sparkles, title: "Анимации", desc: "Плавные переходы и микровзаимодействия" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({ name: "", email: "", message: "" });
    }, 2000);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${template.gradient} relative overflow-hidden`}>
      {/* Background effects */}
      <PreviewParticles color={template.accentColor.includes("amber") ? "rgba(245, 158, 11, 0.4)" : template.accentColor.includes("purple") ? "rgba(168, 85, 247, 0.4)" : "rgba(234, 179, 8, 0.4)"} />
      <FloatingOrbs accentColor={accentClass.split("-")[0]} />

      {/* Header */}
      <motion.header 
        className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <div className={`w-10 h-10 rounded-xl ${template.accentColor} flex items-center justify-center`}>
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl text-white">Brand</span>
          </motion.div>
          <nav className="hidden md:flex items-center gap-8">
            {["Главная", "О нас", "Услуги", "Отзывы", "Контакты"].map((item, i) => (
              <motion.a 
                key={item} 
                href="#" 
                className="text-white/70 hover:text-white transition-colors text-sm relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                {item}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-${accentClass} group-hover:w-full transition-all duration-300`} />
              </motion.a>
            ))}
          </nav>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button size="sm" className={`${template.accentColor} text-black hover:opacity-90`}>
              Связаться
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="py-24 md:py-32 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <ScrollReveal delay={0.2}>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8`}>
                <Star className={`w-4 h-4 text-${accentClass}`} />
                <span className="text-sm text-white/70">Премиальный сервис</span>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.4}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Создаём{" "}
                <span className={`text-${accentClass}`}>
                  <TypewriterText 
                    texts={["будущее", "качество", "успех", "результат"]} 
                    typingSpeed={80}
                    deletingSpeed={40}
                    pauseDuration={2500}
                  />
                </span>
                <br />вместе с вами
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.6}>
              <p className="text-xl text-white/60 mb-10 max-w-2xl">
                Мы помогаем компаниям достигать новых высот с помощью инновационных решений и экспертного подхода
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.8}>
              <div className="flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className={`${template.accentColor} text-black hover:opacity-90 group`}>
                    Начать сейчас
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 group">
                    <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Смотреть видео
                  </Button>
                </motion.div>
              </div>
            </ScrollReveal>

            {/* Scroll indicator */}
            <motion.div 
              className="mt-16 flex items-center gap-2 text-white/40"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-5 h-5" />
              <span className="text-sm">Листайте вниз</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats with animated counters */}
      <section className="py-16 border-y border-white/10 bg-white/5 relative">
        <div className="container mx-auto px-6">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8" staggerDelay={0.15}>
            {[
              { value: 500, suffix: "+", label: "Проектов" },
              { value: 98, suffix: "%", label: "Довольных клиентов" },
              { value: 15, suffix: "", label: "Лет опыта" },
              { value: 24, suffix: "/7", label: "Поддержка" },
            ].map((stat, i) => (
              <StaggerItem key={i}>
                <div className="text-center">
                  <div className={`text-3xl md:text-5xl font-bold text-${accentClass} mb-2`}>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2.5} />
                  </div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features with tilt cards */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Почему выбирают нас</h2>
              <p className="text-white/50 max-w-2xl mx-auto">
                Мы предлагаем комплексные решения для вашего бизнеса
              </p>
            </div>
          </ScrollReveal>
          
          <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.2}>
            {features.map((feature, i) => (
              <StaggerItem key={i}>
                <TiltCard 
                  className="group"
                  glowColor={template.accentColor.includes("amber") ? "rgba(245, 158, 11, 0.2)" : "rgba(168, 85, 247, 0.2)"}
                >
                  <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 h-full">
                    <motion.div 
                      className={`w-14 h-14 rounded-xl ${template.accentColor} flex items-center justify-center mb-6`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="w-7 h-7 text-black" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-white/50">{feature.desc}</p>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Video Section Placeholder */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="relative aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden bg-black/50 border border-white/10 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
              >
                <div className={`w-20 h-20 rounded-full ${template.accentColor} flex items-center justify-center shadow-lg shadow-${accentClass}/30`}>
                  <Play className="w-8 h-8 text-black ml-1" />
                </div>
              </motion.div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${template.accentColor}`}
                    initial={{ width: "0%" }}
                    whileInView={{ width: "35%" }}
                    transition={{ duration: 2, delay: 0.5 }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-white/40 text-sm">
                  <span>1:24</span>
                  <span>4:00</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-24 bg-white/5 border-y border-white/10 relative">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Отзывы клиентов</h2>
            </div>
          </ScrollReveal>

          <div className="max-w-3xl mx-auto">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {testimonials.map((t, i) => (
                  <div key={i} className="flex-[0_0_100%] min-w-0 px-4">
                    <div className="text-center py-8">
                      <Quote className={`w-12 h-12 text-${accentClass}/30 mx-auto mb-6`} />
                      <p className="text-xl md:text-2xl text-white/80 mb-8 italic">"{t.text}"</p>
                      <div className="flex items-center justify-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${template.accentColor}`} />
                        <div className="text-left">
                          <div className="text-white font-medium">{t.author}</div>
                          <div className="text-white/50 text-sm">{t.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Carousel dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentSlide ? `${template.accentColor} w-6` : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Тарифы</h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Выберите подходящий план для вашего проекта
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" staggerDelay={0.15}>
            {pricingPlans.map((plan, i) => (
              <StaggerItem key={i}>
                <TiltCard className="h-full">
                  <motion.div 
                    className={`p-8 rounded-2xl border h-full flex flex-col ${
                      plan.popular 
                        ? `bg-${accentClass}/10 border-${accentClass}/50` 
                        : "bg-white/5 border-white/10"
                    }`}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {plan.popular && (
                      <div className={`${template.accentColor} text-black text-xs font-medium px-3 py-1 rounded-full self-start mb-4`}>
                        Популярный
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className={`text-4xl font-bold text-${accentClass}`}>{plan.price}</span>
                      <span className="text-white/50"> ₽</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-3 text-white/70">
                          <CheckCircle className={`w-5 h-5 text-${accentClass} flex-shrink-0`} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.popular ? `${template.accentColor} text-black` : "bg-white/10 text-white hover:bg-white/20"}`}
                    >
                      Выбрать
                    </Button>
                  </motion.div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Частые вопросы</h2>
            </div>
          </ScrollReveal>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <AccordionItem 
                    value={`item-${i}`}
                    className="border border-white/10 rounded-xl px-6 bg-white/5 data-[state=open]:border-white/20"
                  >
                    <AccordionTrigger className="text-white hover:no-underline py-5">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-white/60 pb-5">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                </ScrollReveal>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Свяжитесь с нами</h2>
                <p className="text-white/50">Оставьте заявку и мы свяжемся с вами в течение 24 часов</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Имя</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none transition-colors"
                      placeholder="Ваше имя"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Email</label>
                    <input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Сообщение</label>
                  <textarea 
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none resize-none transition-colors"
                    placeholder="Расскажите о вашем проекте..."
                  />
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    type="submit" 
                    className={`w-full ${template.accentColor} text-black hover:opacity-90 py-6 text-lg`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <motion.div 
                        className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <>
                        Отправить заявку
                        <Send className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${template.accentColor} flex items-center justify-center`}>
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <span className="font-semibold text-white">Brand</span>
            </div>
            <div className="flex gap-6">
              {["Instagram", "Telegram", "WhatsApp"].map((s) => (
                <a key={s} href="#" className="text-white/40 hover:text-white transition-colors text-sm">{s}</a>
              ))}
            </div>
            <div className="text-white/40 text-sm">© 2024 Brand. Все права защищены.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
