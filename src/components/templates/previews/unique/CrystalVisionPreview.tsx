import { useState, useEffect, useRef } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Sparkles, Hexagon, Circle, Triangle, Play, Volume2, VolumeX, ChevronDown, Star } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { TypewriterText, ScrollReveal, StaggerContainer, StaggerItem, AnimatedCounter, TiltCard } from "../shared";

interface CrystalVisionPreviewProps {
  template: Template;
}

export const CrystalVisionPreview = ({ template }: CrystalVisionPreviewProps) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [soundEnabled, setSoundEnabled] = useState(false);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { stiffness: 500, damping: 50 });
  const springY = useSpring(cursorY, { stiffness: 500, damping: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursorX, cursorY]);

  const features = [
    { icon: Zap, title: "Молниеносная скорость", desc: "Оптимизировано для максимальной производительности", color: "from-purple-500 to-pink-500" },
    { icon: Sparkles, title: "Визуальные эффекты", desc: "Захватывающие анимации и particle-системы", color: "from-cyan-500 to-blue-500" },
    { icon: Hexagon, title: "Модульная архитектура", desc: "Гибкая структура для любых задач", color: "from-green-500 to-emerald-500" },
  ];

  const techStack = [
    { name: "React", icon: "⚛️" },
    { name: "Three.js", icon: "🎮" },
    { name: "Framer", icon: "🎨" },
    { name: "TypeScript", icon: "📘" },
    { name: "Tailwind", icon: "🌊" },
    { name: "WebGL", icon: "🔮" },
  ];

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white relative overflow-hidden"
    >
      {/* Custom cursor */}
      <motion.div
        className="fixed w-6 h-6 rounded-full pointer-events-none z-[100] mix-blend-difference hidden lg:block"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <div className="w-full h-full bg-white rounded-full" />
        <motion.div 
          className="absolute inset-0 rounded-full border-2 border-purple-500"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Cursor glow effect */}
      <motion.div
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0 opacity-20 blur-3xl hidden lg:block"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)",
        }}
      />

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(168,85,247,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168,85,247,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Floating shapes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed pointer-events-none z-0"
          style={{
            left: `${20 + i * 15}%`,
            top: `${10 + (i % 3) * 30}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {i % 3 === 0 && <Hexagon className="w-12 h-12 text-purple-500/20" />}
          {i % 3 === 1 && <Circle className="w-8 h-8 text-cyan-500/20" />}
          {i % 3 === 2 && <Triangle className="w-10 h-10 text-pink-500/20" />}
        </motion.div>
      ))}

      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 border-b border-purple-500/20 bg-slate-950/50 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <motion.div 
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="font-bold text-xl">Crystal<span className="text-purple-400">Vision</span></span>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-8">
            {["Главная", "Технологии", "Проекты", "Контакты"].map((item, i) => (
              <motion.a 
                key={item}
                href="#"
                className="text-sm text-white/60 hover:text-purple-400 transition-colors relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onMouseEnter={() => soundEnabled && new Audio("/hover.mp3").play?.()}
              >
                {item}
                <motion.span 
                  className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-purple-500/50 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </motion.button>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-0">
              Начать
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative pt-20">
        <div className="container mx-auto px-6 text-center">
          <ScrollReveal>
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-8"
              animate={{ boxShadow: ["0 0 20px rgba(168,85,247,0.2)", "0 0 40px rgba(168,85,247,0.4)", "0 0 20px rgba(168,85,247,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400">Футуристичный дизайн нового поколения</span>
            </motion.div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                <TypewriterText 
                  texts={["Будущее", "Технологии", "Инновации"]} 
                  typingSpeed={100}
                  deletingSpeed={50}
                  pauseDuration={2500}
                />
              </span>
              <br />
              <span className="text-white/90">уже здесь</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <p className="text-xl text-white/50 max-w-2xl mx-auto mb-12">
              Погрузитесь в мир интерактивных технологий с неоновыми акцентами и захватывающими визуальными эффектами
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.6}>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-0 px-8 py-6 text-lg relative overflow-hidden group">
                  <span className="relative z-10 flex items-center">
                    Исследовать
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="border-purple-500/30 text-white hover:bg-purple-500/10 px-8 py-6 text-lg">
                  <Play className="w-5 h-5 mr-2" />
                  Демо
                </Button>
              </motion.div>
            </div>
          </ScrollReveal>

          {/* Tech stack floating badges */}
          <ScrollReveal delay={0.8}>
            <div className="flex flex-wrap justify-center gap-4 mt-16">
              {techStack.map((tech, i) => (
                <motion.div
                  key={tech.name}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 text-sm text-white/60"
                  whileHover={{ scale: 1.1, borderColor: "rgba(168,85,247,0.5)" }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                >
                  <span>{tech.icon}</span>
                  <span>{tech.name}</span>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs text-white/30 uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-5 h-5 text-purple-500/50" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Технологии</span> будущего
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">
                Используем передовые инструменты для создания впечатляющих цифровых продуктов
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.2}>
            {features.map((feature, i) => (
              <StaggerItem key={i}>
                <TiltCard 
                  className="h-full"
                  glowColor={i === 0 ? "rgba(168,85,247,0.2)" : i === 1 ? "rgba(6,182,212,0.2)" : "rgba(16,185,129,0.2)"}
                >
                  <motion.div 
                    className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-500 h-full group"
                    whileHover={{ y: -8 }}
                  >
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-white/50">{feature.desc}</p>
                  </motion.div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="relative p-12 md:p-20 rounded-3xl overflow-hidden">
              {/* Animated border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 p-px">
                <div className="w-full h-full rounded-3xl bg-slate-950" />
              </div>
              
              <div className="relative z-10 text-center">
                <motion.div
                  className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <motion.div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-12 h-12 text-purple-400" />
                  </motion.div>
                </motion.div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Попробуйте <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">интерактив</span>
                </h2>
                <p className="text-white/50 max-w-xl mx-auto mb-10">
                  Двигайте курсор по экрану и наблюдайте за эффектами в реальном времени
                </p>

                <div className="flex justify-center gap-4 text-sm text-white/40">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span>Кастомный курсор</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500" />
                    <span>Glow эффект</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span>Particle trails</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-purple-500/20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { value: 99, suffix: "%", label: "Производительность" },
              { value: 60, suffix: "fps", label: "Плавность анимаций" },
              { value: 100, suffix: "+", label: "Эффектов" },
              { value: 24, suffix: "/7", label: "Поддержка" },
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.15}>
                <motion.div 
                  className="text-center p-6"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2} />
                  </div>
                  <div className="text-white/40">{stat.label}</div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              Готовы к <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">будущему</span>?
            </h2>
            <p className="text-white/50 max-w-xl mx-auto mb-12">
              Создайте впечатляющий цифровой продукт с нашей командой
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-400 hover:via-pink-400 hover:to-cyan-400 text-white border-0 px-12 py-6 text-lg">
                Связаться с нами
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-purple-500/20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-lg">CrystalVision</span>
            </div>
            <div className="text-white/30 text-sm">© 2024 Crystal Vision. Все права защищены.</div>
            <div className="flex gap-6">
              {["Twitter", "Discord", "GitHub"].map((social) => (
                <a key={social} href="#" className="text-sm text-white/30 hover:text-purple-400 transition-colors">
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
