import { useState, useEffect } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { Diamond, ArrowRight, Quote, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem, AnimatedCounter } from "../shared";
import { ImageWithFallback, AvatarWithFallback } from "../../ImageWithFallback";
import useEmblaCarousel from "embla-carousel-react";

// Local images
import portfolio1 from "@/assets/templates/marble-gold/portfolio-1.jpg";
import portfolio2 from "@/assets/templates/marble-gold/portfolio-2.jpg";
import portfolio3 from "@/assets/templates/marble-gold/portfolio-3.jpg";
import portfolio4 from "@/assets/templates/marble-gold/portfolio-4.jpg";
import portfolio5 from "@/assets/templates/marble-gold/portfolio-5.jpg";
import portfolio6 from "@/assets/templates/marble-gold/portfolio-6.jpg";
import team1 from "@/assets/templates/marble-gold/team-1.jpg";
import team2 from "@/assets/templates/marble-gold/team-2.jpg";
import team3 from "@/assets/templates/marble-gold/team-3.jpg";
import team4 from "@/assets/templates/marble-gold/team-4.jpg";

const portfolioImages = [portfolio1, portfolio2, portfolio3, portfolio4, portfolio5, portfolio6];
const teamImages = [team1, team2, team3, team4];

interface MarbleGoldPreviewProps {
  template: Template;
}

export const MarbleGoldPreview = ({ template }: MarbleGoldPreviewProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const portfolio = [
    { title: "Penthouse Azure", category: "Интерьер", year: "2024" },
    { title: "Villa Serenity", category: "Архитектура", year: "2023" },
    { title: "Boutique Hotel", category: "Гостиничный дизайн", year: "2023" },
    { title: "Private Yacht", category: "Морской дизайн", year: "2024" },
    { title: "Corporate HQ", category: "Офисы", year: "2024" },
    { title: "Art Gallery", category: "Культурные объекты", year: "2023" },
  ];

  const testimonials = [
    { text: "Работа с командой была исключительным опытом. Результат превзошёл все ожидания.", author: "Виктория А.", role: "Владелец Penthouse" },
    { text: "Мраморные текстуры и золотые акценты создали атмосферу подлинной роскоши.", author: "Сергей М.", role: "CEO, Luxury Corp" },
    { text: "Внимание к деталям и безупречное качество исполнения.", author: "Анна К.", role: "Арт-директор" },
  ];

  const team = [
    { name: "Елена Романова", role: "Главный дизайнер", exp: "18 лет" },
    { name: "Алексей Волков", role: "Архитектор", exp: "15 лет" },
    { name: "Мария Светлова", role: "Дизайнер интерьеров", exp: "12 лет" },
    { name: "Дмитрий Золотов", role: "Проект-менеджер", exp: "10 лет" },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-white relative overflow-hidden">
      {/* Marble texture overlay */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 Q25 10 50 5 T100 10 L100 0 Z' fill='%23fff' fill-opacity='0.1'/%3E%3Cpath d='M0 20 Q30 30 60 25 T100 30 L100 20 Z' fill='%23fff' fill-opacity='0.05'/%3E%3Cpath d='M0 40 Q40 50 80 45 T100 50 L100 40 Z' fill='%23fff' fill-opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Gold gradient overlays */}
      <div className="fixed top-0 left-0 w-1/3 h-screen bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
      <div className="fixed top-0 right-0 w-1/3 h-screen bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 border-b border-amber-500/10 bg-stone-950/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <Diamond className="w-8 h-8 text-amber-400" />
            <div>
              <span className="font-light text-xl tracking-widest">MARBLE</span>
              <span className="text-amber-400 font-light text-xl"> & </span>
              <span className="font-light text-xl tracking-widest">GOLD</span>
            </div>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-10">
            {["Портфолио", "Услуги", "О студии", "Команда", "Контакты"].map((item, i) => (
              <motion.a 
                key={item}
                href="#"
                className="text-sm text-white/50 hover:text-amber-400 transition-colors tracking-wider uppercase"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>

          <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 hover:from-amber-400 hover:to-amber-500">
            Консультация
          </Button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <ScrollReveal>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-amber-500 to-transparent" />
                <span className="text-amber-400 text-sm tracking-[0.3em] uppercase">Luxury Design Studio</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extralight leading-tight mb-8">
                Искусство
                <br />
                <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">роскошного</span>
                <br />
                дизайна
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <p className="text-xl text-white/40 max-w-xl mb-12 font-light leading-relaxed">
                Создаём уникальные интерьеры и архитектурные решения для тех, кто ценит подлинную роскошь и безупречное качество
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.6}>
              <div className="flex flex-wrap gap-6">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 hover:from-amber-400 hover:to-amber-500 px-8">
                    Наши проекты
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
                <Button size="lg" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                  О студии
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="w-px h-48 bg-gradient-to-b from-transparent via-amber-500/50 to-transparent" />
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-amber-500/10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: 250, suffix: "+", label: "Реализованных проектов" },
              { value: 18, suffix: "", label: "Лет безупречной работы" },
              { value: 45, suffix: "+", label: "Международных наград" },
              { value: 99, suffix: "%", label: "Довольных клиентов" },
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div>
                  <div className="text-5xl font-extralight text-amber-400 mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2} />
                  </div>
                  <div className="text-white/40 text-sm uppercase tracking-widest">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Gallery */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-16">
              <div>
                <div className="text-amber-400 text-sm tracking-[0.3em] uppercase mb-4">Избранные работы</div>
                <h2 className="text-4xl font-extralight">Портфолио</h2>
              </div>
              <a href="#" className="text-amber-400 flex items-center gap-2 hover:gap-3 transition-all">
                Все проекты <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
            {portfolio.map((project, i) => (
              <StaggerItem key={i}>
                <motion.div 
                  className="group cursor-pointer"
                  whileHover={{ y: -8 }}
                >
                  <div className="aspect-[4/5] rounded-lg overflow-hidden border border-white/5 relative mb-4 group-hover:border-amber-500/30 transition-all">
                    <ImageWithFallback
                      src={portfolioImages[i]}
                      alt={project.title}
                      className="w-full h-full"
                      aspectRatio="portrait"
                      fallbackGradient="from-stone-800 to-stone-900"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform">
                      <div className="text-amber-400 text-xs uppercase tracking-widest mb-2">{project.category}</div>
                      <h3 className="text-xl font-light">{project.title}</h3>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-stone-900/50">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-amber-400 text-sm tracking-[0.3em] uppercase mb-4">Наши эксперты</div>
              <h2 className="text-4xl font-extralight">Команда</h2>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.1}>
            {team.map((member, i) => (
              <StaggerItem key={i}>
                <motion.div className="text-center" whileHover={{ y: -8 }}>
                  <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border border-amber-500/20">
                    <ImageWithFallback
                      src={teamImages[i]}
                      alt={member.name}
                      className="w-full h-full rounded-full"
                      aspectRatio="square"
                      fallbackGradient="from-stone-800 to-stone-900"
                    />
                  </div>
                  <h4 className="text-lg font-light mb-1">{member.name}</h4>
                  <p className="text-amber-400 text-sm mb-1">{member.role}</p>
                  <p className="text-white/40 text-xs">{member.exp} опыта</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-amber-400 text-sm tracking-[0.3em] uppercase mb-4">Отзывы клиентов</div>
              <h2 className="text-4xl font-extralight">Что говорят о нас</h2>
            </div>
          </ScrollReveal>

          <div className="max-w-3xl mx-auto">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {testimonials.map((t, i) => (
                  <div key={i} className="flex-[0_0_100%] min-w-0 px-4">
                    <div className="text-center py-8">
                      <Quote className="w-12 h-12 text-amber-500/30 mx-auto mb-8" />
                      <p className="text-2xl font-extralight text-white/80 mb-10 leading-relaxed italic">
                        "{t.text}"
                      </p>
                      <div className="text-amber-400 text-sm tracking-widest uppercase mb-2">{t.author}</div>
                      <div className="text-white/40 text-sm">{t.role}</div>
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
                  className={`w-8 h-px transition-all ${i === currentSlide ? "bg-amber-500 w-12" : "bg-white/20"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-amber-500/10">
        <div className="container mx-auto px-6 text-center">
          <ScrollReveal>
            <Diamond className="w-16 h-16 text-amber-400 mx-auto mb-8" />
            <h2 className="text-4xl md:text-5xl font-extralight mb-6">
              Создадим <span className="text-amber-400">шедевр</span> вместе
            </h2>
            <p className="text-white/40 max-w-xl mx-auto mb-12 font-light">
              Свяжитесь с нами для обсуждения вашего проекта
            </p>
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 hover:from-amber-400 hover:to-amber-500 px-12">
              Связаться с нами
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-amber-500/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Diamond className="w-6 h-6 text-amber-400" />
              <span className="font-light tracking-widest">MARBLE & GOLD</span>
            </div>
            <div className="text-white/30 text-sm">© 2024 Marble & Gold. Все права защищены.</div>
            <div className="flex gap-6 text-white/40 text-sm">
              <a href="#" className="hover:text-amber-400 transition-colors">Instagram</a>
              <a href="#" className="hover:text-amber-400 transition-colors">Pinterest</a>
              <a href="#" className="hover:text-amber-400 transition-colors">Behance</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
