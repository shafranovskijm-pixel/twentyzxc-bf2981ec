import { useState, useEffect } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star, Crown, Diamond, Award, ChevronDown, Check, Phone, Mail, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { TypewriterText, ScrollReveal, StaggerContainer, StaggerItem, AnimatedCounter, TiltCard, VideoPlaceholder } from "../shared";
import useEmblaCarousel from "embla-carousel-react";
import { ImageWithFallback, imageSizes } from "../../ImageWithFallback";

// Local images
import service1 from "@/assets/templates/golden-prestige/service-1.jpg";
import service2 from "@/assets/templates/golden-prestige/service-2.jpg";
import service3 from "@/assets/templates/golden-prestige/service-3.jpg";

const serviceImages = [service1, service2, service3];

interface GoldenPrestigePreviewProps {
  template: Template;
}

export const GoldenPrestigePreview = ({ template }: GoldenPrestigePreviewProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [calculatorValue, setCalculatorValue] = useState(3);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const services = [
    { icon: Crown, title: "VIP Консьерж", desc: "Персональный менеджер 24/7", price: "от 50 000 ₽" },
    { icon: Diamond, title: "Premium Сервис", desc: "Эксклюзивные привилегии", price: "от 100 000 ₽" },
    { icon: Award, title: "Elite Package", desc: "Максимальный уровень сервиса", price: "от 200 000 ₽" },
  ];

  const pricingTiers = [
    { name: "Gold", price: 150000, features: ["Базовый функционал", "Email поддержка", "5 пользователей", "Аналитика"] },
    { name: "Platinum", price: 300000, features: ["Всё из Gold", "Приоритетная поддержка", "25 пользователей", "API доступ", "Кастомизация"], popular: true },
    { name: "Diamond", price: 500000, features: ["Всё из Platinum", "Личный менеджер", "Безлимит пользователей", "SLA 99.9%", "Интеграции", "White-label"] },
  ];

  const calculatedPrice = calculatorValue * 45000;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950/30 via-stone-950 to-stone-950 text-white relative overflow-hidden">
      {/* Gold particle overlay */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />

      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 border-b border-amber-500/20 bg-stone-950/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Crown className="w-6 h-6 text-stone-900" />
            </div>
            <div>
              <span className="font-bold text-xl bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">PRESTIGE</span>
              <div className="text-[10px] tracking-[0.3em] text-amber-500/60">LUXURY BRAND</div>
            </div>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-8">
            {["Главная", "Услуги", "Тарифы", "О нас", "Контакты"].map((item, i) => (
              <motion.a 
                key={item}
                href="#"
                className="text-sm text-white/70 hover:text-amber-400 transition-colors relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button className="bg-gradient-to-r from-amber-400 to-amber-600 text-stone-900 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/30">
              <Phone className="w-4 h-4 mr-2" />
              Консультация
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <ScrollReveal>
                <motion.div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 mb-8"
                  whileHover={{ scale: 1.05 }}
                >
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400">Premium Experience</span>
                </motion.div>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                  <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                    <TypewriterText 
                      texts={["Роскошь", "Престиж", "Успех"]} 
                      typingSpeed={100}
                      deletingSpeed={50}
                      pauseDuration={2500}
                    />
                  </span>
                  <br />
                  <span className="text-white/90">в каждой детали</span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={0.4}>
                <p className="text-xl text-white/60 mb-10 max-w-lg">
                  Эксклюзивные решения для тех, кто ценит качество и не идёт на компромиссы
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.6}>
                <div className="flex flex-wrap gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="bg-gradient-to-r from-amber-400 to-amber-600 text-stone-900 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/30 px-8">
                      Начать сейчас
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                      <Play className="w-5 h-5 mr-2" />
                      Видео-обзор
                    </Button>
                  </motion.div>
                </div>
              </ScrollReveal>

              {/* Trust badges */}
              <ScrollReveal delay={0.8}>
                <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10">
                  {[
                    { value: 500, suffix: "+", label: "Клиентов" },
                    { value: 15, suffix: "", label: "Лет опыта" },
                    { value: 99, suffix: "%", label: "Довольны" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-amber-400">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2} />
                      </div>
                      <div className="text-xs text-white/40">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            {/* Video placeholder with gold border */}
            <ScrollReveal direction="right" delay={0.4}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 to-amber-600/20 blur-xl rounded-3xl" />
                <VideoPlaceholder 
                  duration="2:45"
                  title="Узнайте больше о нашем сервисе"
                  accentColor="bg-gradient-to-r from-amber-400 to-amber-600"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-amber-500/50" />
        </motion.div>
      </section>

      {/* Services Section */}
      <section className="py-24 border-y border-amber-500/10">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Наши <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">услуги</span>
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Выберите уровень сервиса, соответствующий вашим ожиданиям
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.15}>
            {services.map((service, i) => (
              <StaggerItem key={i}>
                <TiltCard glowColor="rgba(245, 158, 11, 0.15)">
                  <motion.div 
                    className="rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 h-full overflow-hidden"
                    whileHover={{ y: -8 }}
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <ImageWithFallback 
                        src={serviceImages[i]}
                        alt={service.title}
                        aspectRatio="video"
                        sizes={imageSizes.card}
                      />
                    </div>
                    <div className="p-8">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
                        <service.icon className="w-8 h-8 text-stone-900" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">{service.title}</h3>
                      <p className="text-white/50 mb-6">{service.desc}</p>
                      <div className="text-amber-400 font-bold text-lg">{service.price}</div>
                    </div>
                  </motion.div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Калькулятор <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">стоимости</span>
              </h2>
              <p className="text-white/50 mb-8">
                Рассчитайте стоимость вашего проекта онлайн. Просто укажите количество экранов.
              </p>
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-white/60 mb-3 block">Количество экранов: {calculatorValue}</label>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={calculatorValue}
                    onChange={(e) => setCalculatorValue(Number(e.target.value))}
                    className="w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-amber-400 [&::-webkit-slider-thumb]:to-amber-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/50"
                  />
                </div>
                <div className="flex items-center justify-between p-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-white/70">Ориентировочная стоимость:</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                    {calculatedPrice.toLocaleString()} ₽
                  </span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={0.3}>
              <div className="grid grid-cols-2 gap-4">
                {["✓ Дизайн", "✓ Адаптив", "✓ Анимации", "✓ SEO", "✓ Хостинг", "✓ Поддержка"].map((item, i) => (
                  <motion.div
                    key={i}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 text-white/70"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(245, 158, 11, 0.1)" }}
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-b from-amber-500/5 to-transparent">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Тарифные <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">планы</span>
              </h2>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" staggerDelay={0.15}>
            {pricingTiers.map((tier, i) => (
              <StaggerItem key={i}>
                <motion.div 
                  className={`p-8 rounded-2xl h-full flex flex-col ${
                    tier.popular 
                      ? "bg-gradient-to-b from-amber-500/20 to-amber-600/10 border-2 border-amber-500" 
                      : "bg-white/5 border border-white/10"
                  }`}
                  whileHover={{ y: -8 }}
                >
                  {tier.popular && (
                    <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-stone-900 text-xs font-bold px-4 py-1 rounded-full self-start mb-4">
                      ПОПУЛЯРНЫЙ
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold mb-2 ${tier.popular ? "text-amber-400" : "text-white"}`}>{tier.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{tier.price.toLocaleString()}</span>
                    <span className="text-white/50"> ₽</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {tier.features.map((feature, fi) => (
                      <li key={fi} className="flex items-center gap-3 text-white/70">
                        <Check className={`w-5 h-5 ${tier.popular ? "text-amber-400" : "text-white/40"}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      tier.popular 
                        ? "bg-gradient-to-r from-amber-400 to-amber-600 text-stone-900 hover:from-amber-300 hover:to-amber-500" 
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    Выбрать план
                  </Button>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="relative p-12 md:p-20 rounded-3xl overflow-hidden text-center">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-600/20" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1)_0%,transparent_70%)]" />
              <div className="relative z-10">
                <Crown className="w-16 h-16 text-amber-400 mx-auto mb-8" />
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Готовы к <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">премиум</span> опыту?
                </h2>
                <p className="text-white/60 max-w-xl mx-auto mb-10">
                  Свяжитесь с нами сегодня и получите бесплатную консультацию
                </p>
                <Button size="lg" className="bg-gradient-to-r from-amber-400 to-amber-600 text-stone-900 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/30 px-12">
                  Получить консультацию
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-amber-500/10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-amber-400" />
                <span className="font-bold text-lg text-amber-400">PRESTIGE</span>
              </div>
              <p className="text-white/40 text-sm">Премиальные решения для бизнеса</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Услуги</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li>VIP Консьерж</li>
                <li>Premium Сервис</li>
                <li>Elite Package</li>
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
                  <Phone className="w-4 h-4 text-amber-400" />
                  +7 (800) 123-45-67
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  info@prestige.ru
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/30 text-sm">
            © 2024 Golden Prestige. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
};
