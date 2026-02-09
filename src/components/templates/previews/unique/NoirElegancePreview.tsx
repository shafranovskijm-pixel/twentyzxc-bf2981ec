import { useState, useEffect, useCallback } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, Play, Star, Quote, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TypewriterText, ScrollReveal, StaggerContainer, StaggerItem, AnimatedCounter } from "../shared";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import useEmblaCarousel from "embla-carousel-react";
import { ImageWithFallback } from "../../ImageWithFallback";
import noirHeroImage from "@/assets/templates/noir-elegance-hero.jpg";
import noirProjectImage from "@/assets/templates/noir-elegance-project-1.jpg";

const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/template-images`;

interface NoirElegancePreviewProps {
  template: Template;
}

export const NoirElegancePreview = ({ template }: NoirElegancePreviewProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const testimonials = [
    { text: "Абсолютное совершенство в каждой детали. Элегантность, которая говорит сама за себя.", author: "Александра В.", role: "Арт-директор" },
    { text: "Минимализм высшего уровня. Именно то, что нужно для премиального бренда.", author: "Михаил К.", role: "CEO" },
    { text: "Чёрно-белая эстетика передаёт суть нашей философии безупречно.", author: "Елена С.", role: "Brand Manager" },
  ];

  const features = [
    { num: "01", title: "Минималистичный дизайн", desc: "Чистые линии и продуманные пробелы создают атмосферу утончённой роскоши" },
    { num: "02", title: "Контрастная типографика", desc: "Изысканные шрифты Serif в сочетании с минималистичными Sans-serif" },
    { num: "03", title: "Плавные анимации", desc: "Элегантные переходы и микровзаимодействия при каждом действии" },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      {/* Subtle grid lines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white" />
        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-white" />
      </div>

      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto px-8 py-6 flex items-center justify-between">
          <motion.div 
            className="text-2xl font-light tracking-[0.3em] uppercase"
            whileHover={{ letterSpacing: "0.4em" }}
            transition={{ duration: 0.3 }}
          >
            Noir
          </motion.div>
          
          <nav className="hidden md:flex items-center gap-12">
            {["Проекты", "Услуги", "О нас", "Контакты"].map((item, i) => (
              <motion.a 
                key={item}
                href="#"
                className="text-sm tracking-widest uppercase text-white/60 hover:text-white transition-colors relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {item}
                <span className="absolute -bottom-2 left-0 w-0 h-px bg-amber-500 group-hover:w-full transition-all duration-500" />
              </motion.a>
            ))}
          </nav>

          <motion.button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {menuOpen ? <X /> : <Menu />}
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <nav className="flex flex-col items-center gap-8">
              {["Проекты", "Услуги", "О нас", "Контакты"].map((item, i) => (
                <motion.a
                  key={item}
                  href="#"
                  className="text-3xl font-light tracking-widest uppercase"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setMenuOpen(false)}
                >
                  {item}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative pt-20">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={noirHeroImage} 
            alt="Noir Elegance Hero" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>

        <div className="container mx-auto px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-xl">
              <motion.div
                className="text-amber-500 text-sm tracking-[0.5em] uppercase mb-8"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Студия дизайна
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-7xl lg:text-8xl font-extralight leading-[0.9] mb-8"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              >
                <TypewriterText 
                  texts={["Элегантность", "Минимализм", "Совершенство"]} 
                  typingSpeed={100}
                  deletingSpeed={50}
                  pauseDuration={3000}
                />
                <br />
                <span className="text-white/30">в деталях</span>
              </motion.h1>

              <motion.p 
                className="text-lg text-white/40 max-w-xl mb-12 font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Создаём визуальные решения, которые говорят громче слов. 
                Каждый пиксель продуман до совершенства.
              </motion.p>

              <motion.div
                className="flex items-center gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-amber-500 hover:text-black rounded-none px-8 py-6 text-sm tracking-widest uppercase transition-all duration-500"
                >
                  Начать проект
                  <ArrowRight className="ml-3 w-4 h-4" />
                </Button>
                <button className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
                  <div className="w-12 h-12 border border-white/20 group-hover:border-amber-500 rounded-full flex items-center justify-center transition-colors">
                    <Play className="w-4 h-4 ml-0.5" />
                  </div>
                  <span className="text-sm tracking-widest uppercase">Showreel</span>
                </button>
              </motion.div>
            </div>

            {/* Project showcase image */}
            <motion.div 
              className="hidden lg:block relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <div className="aspect-square rounded-sm overflow-hidden border border-white/10">
                <img 
                  src={noirProjectImage} 
                  alt="Featured Project" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 p-4 bg-black border border-white/10">
                <div className="text-amber-500 text-xs tracking-widest uppercase">Проект</div>
                <div className="text-white font-light">Identity Design</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs tracking-widest uppercase text-white/30">Scroll</span>
          <ChevronDown className="w-5 h-5 text-white/30" />
        </motion.div>

        {/* Side decoration */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-6 z-10">
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-amber-500 to-transparent" />
          <span className="text-xs tracking-widest uppercase text-white/30 rotate-90 whitespace-nowrap">Est. 2024</span>
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 border-y border-white/10">
        <div className="container mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-white/10">
            {[
              { value: 150, suffix: "+", label: "Проектов" },
              { value: 12, suffix: "", label: "Лет опыта" },
              { value: 98, suffix: "%", label: "Клиентов довольны" },
              { value: 47, suffix: "+", label: "Наград" },
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.15}>
                <div className="text-center md:px-8">
                  <div className="text-5xl md:text-6xl font-extralight text-amber-500 mb-3">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2} />
                  </div>
                  <div className="text-sm tracking-widest uppercase text-white/40">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32">
        <div className="container mx-auto px-8">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
              <h2 className="text-4xl md:text-5xl font-extralight">
                Наш <span className="text-amber-500">подход</span>
              </h2>
              <p className="text-white/40 max-w-md font-light">
                Три принципа, которые определяют каждый наш проект
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-px bg-white/10">
            {features.map((feature, i) => (
              <ScrollReveal key={i} delay={i * 0.2}>
                <motion.div 
                  className="bg-black p-10 md:p-12 group cursor-pointer h-full"
                  whileHover={{ backgroundColor: "rgba(245, 158, 11, 0.05)" }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-6xl font-extralight text-white/10 group-hover:text-amber-500/20 transition-colors duration-500">
                    {feature.num}
                  </span>
                  <h3 className="text-xl font-light mt-6 mb-4 group-hover:text-amber-500 transition-colors duration-500">
                    {feature.title}
                  </h3>
                  <p className="text-white/40 font-light text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                  <ArrowRight className="w-5 h-5 mt-8 text-white/20 group-hover:text-amber-500 group-hover:translate-x-2 transition-all duration-500" />
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-white/[0.02]">
        <div className="container mx-auto px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extralight mb-4">
                Отзывы <span className="text-amber-500">клиентов</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="max-w-4xl mx-auto">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {testimonials.map((t, i) => (
                  <div key={i} className="flex-[0_0_100%] min-w-0 px-4">
                    <div className="text-center py-12">
                      <Quote className="w-12 h-12 text-amber-500/20 mx-auto mb-8" />
                      <p className="text-2xl md:text-3xl font-extralight text-white/80 mb-10 leading-relaxed italic">
                        "{t.text}"
                      </p>
                      <div className="text-amber-500 text-sm tracking-widest uppercase mb-2">{t.author}</div>
                      <div className="text-white/30 text-sm">{t.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center gap-3 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`w-8 h-px transition-all duration-500 ${
                    i === currentSlide ? "bg-amber-500 w-12" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32">
        <div className="container mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-extralight sticky top-32">
                Часто задаваемые
                <br />
                <span className="text-amber-500">вопросы</span>
              </h2>
            </ScrollReveal>
            
            <ScrollReveal delay={0.2}>
              <Accordion type="single" collapsible className="space-y-4">
                {[
                  { q: "Какие сроки разработки проекта?", a: "Типичный проект занимает от 2 до 6 недель в зависимости от сложности и объёма работ." },
                  { q: "Работаете ли вы с международными клиентами?", a: "Да, мы работаем с клиентами по всему миру. Коммуникация ведётся на русском и английском языках." },
                  { q: "Что входит в базовый пакет услуг?", a: "Концепция, дизайн, анимации, адаптивная вёрстка, базовая SEO-оптимизация и техническая поддержка." },
                  { q: "Как происходит оплата?", a: "50% предоплата для начала работы, оставшиеся 50% после сдачи проекта. Возможна рассрочка." },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-b border-white/10 pb-4">
                    <AccordionTrigger className="text-left font-light text-lg hover:text-amber-500 transition-colors">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-white/50 font-light pt-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 border-t border-white/10">
        <div className="container mx-auto px-8 text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-extralight mb-8">
              Готовы начать <span className="text-amber-500">проект</span>?
            </h2>
            <p className="text-white/40 max-w-xl mx-auto mb-12 font-light">
              Свяжитесь с нами, чтобы обсудить вашу идею. Первая консультация бесплатно.
            </p>
            <Button 
              size="lg" 
              className="bg-amber-500 text-black hover:bg-white rounded-none px-12 py-6 text-sm tracking-widest uppercase transition-all duration-500"
            >
              Связаться с нами
              <ArrowRight className="ml-3 w-4 h-4" />
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-2xl font-light tracking-[0.3em] uppercase">Noir</div>
            <div className="text-white/30 text-sm">© 2024 Noir Elegance. Все права защищены.</div>
            <div className="flex gap-6">
              {["Instagram", "Behance", "Dribbble"].map((social) => (
                <a key={social} href="#" className="text-sm text-white/30 hover:text-amber-500 transition-colors">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
