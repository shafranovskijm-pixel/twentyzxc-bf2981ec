import { useEffect, useState } from "react";
import { Diamond } from "lucide-react";
import { cn } from "@/lib/utils";

const AboutHero = () => {
  const [lineVisible, setLineVisible] = useState(false);
  const [diamondVisible, setDiamondVisible] = useState(false);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Sequential animation
    const timers = [
      setTimeout(() => setLineVisible(true), 200),
      setTimeout(() => setDiamondVisible(true), 800),
      setTimeout(() => setBadgeVisible(true), 1200),
      setTimeout(() => setTitleVisible(true), 1600),
      setTimeout(() => setSubtitleVisible(true), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="pt-32 pb-24 relative overflow-hidden min-h-[80vh] flex items-center">
      {/* Parallax Background Elements */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(45_80%_55%/0.12),transparent_50%)]"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      />
      <div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(45_80%_55%/0.08),transparent_50%)]"
        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
      />
      
      {/* Large ZXC Background Logo with Shimmer */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      >
        <span className="text-[20rem] md:text-[30rem] font-display font-bold text-primary/[0.03] shimmer">
          ZXC
        </span>
      </div>
      
      {/* Floating Geometric Elements with Parallax */}
      <div 
        className="absolute top-40 left-10 w-32 h-32 border border-primary/10 rotate-45 animate-float opacity-30"
        style={{ transform: `translateY(${scrollY * 0.2}px) rotate(45deg)` }}
      />
      <div 
        className="absolute bottom-20 right-20 w-24 h-24 border border-primary/20 rotate-12 animate-float opacity-20"
        style={{ 
          animationDelay: '2s',
          transform: `translateY(${scrollY * -0.1}px) rotate(12deg)` 
        }}
      />
      <div 
        className="absolute top-1/3 right-1/4 w-16 h-16 border border-primary/15 rotate-[30deg] animate-float opacity-25"
        style={{ 
          animationDelay: '4s',
          transform: `translateY(${scrollY * 0.25}px) rotate(30deg)` 
        }}
      />
      
      <div className="container px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Vertical Line Animation */}
          <div className="flex justify-center mb-6">
            <div 
              className={cn(
                "w-px bg-gradient-to-b from-transparent via-primary to-transparent transition-all duration-1000 ease-out",
                lineVisible ? "h-16 opacity-100" : "h-0 opacity-0"
              )}
            />
          </div>
          
          {/* Diamond Icon */}
          <div 
            className={cn(
              "flex justify-center mb-8 transition-all duration-700",
              diamondVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center relative">
                <Diamond className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          
          {/* Badge */}
          <div 
            className={cn(
              "transition-all duration-700",
              badgeVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            )}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <span className="text-primary text-sm tracking-widest uppercase">О компании</span>
            </div>
          </div>
          
          {/* Title */}
          <h1 
            className={cn(
              "text-5xl md:text-7xl font-display font-bold mb-8 leading-tight transition-all duration-1000",
              titleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            Создаём <span className="gradient-gold-text">цифровое</span><br />
            превосходство
          </h1>
          
          {/* Subtitle */}
          <p 
            className={cn(
              "text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto transition-all duration-1000",
              subtitleVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            Мы — команда, которая превращает идеи в премиальные digital-продукты. 
            Каждый проект — это искусство.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
