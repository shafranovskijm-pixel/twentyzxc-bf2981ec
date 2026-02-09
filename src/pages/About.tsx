import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCountUp } from "@/hooks/use-count-up";
import { Target, Zap, Shield, Sparkles } from "lucide-react";

// New components
import AboutHero from "@/components/about/AboutHero";
import TimelineSection from "@/components/about/TimelineSection";
import TiltCard from "@/components/about/TiltCard";
import ProcessFlow from "@/components/about/ProcessFlow";
import EnhancedCTA from "@/components/about/EnhancedCTA";
import CollapsibleRequisites from "@/components/about/CollapsibleRequisites";
import AnimatedSection from "@/components/AnimatedSection";

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

  return (
    <>
      <Helmet>
        <title>О компании 24ZXC — Веб-студия полного цикла</title>
        <meta name="description" content="Команда 24ZXC: веб-разработка, реклама и цифровые решения. Узнайте о нашем подходе, принципах работы и опыте." />
        <link rel="canonical" href="https://24zxc.ru/about" />
      </Helmet>
      <div className="min-h-screen bg-background">
      <Header />
      
      {/* Animated Hero Section */}
      <AboutHero />

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

      {/* Timeline Section */}
      <TimelineSection />

      {/* Philosophy Section with TiltCards */}
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
              <TiltCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Process Flow Section */}
      <ProcessFlow />

      {/* Enhanced CTA Section */}
      <EnhancedCTA />

      {/* Collapsible Requisites Section */}
      <CollapsibleRequisites />

      <Footer />
    </div>
    </>
  );
};

export default About;
