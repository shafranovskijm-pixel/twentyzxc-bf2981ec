import { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

// Particle component for background
const Particle = ({ delay }: { delay: number }) => {
  const randomX = Math.random() * 100;
  const randomY = Math.random() * 100;
  const size = Math.random() * 3 + 1;
  const duration = Math.random() * 3 + 4;
  
  return (
    <div 
      className="absolute rounded-full bg-primary/30 animate-pulse"
      style={{
        left: `${randomX}%`,
        top: `${randomY}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }}
    />
  );
};

const EnhancedCTA = () => {
  const [isHovered, setIsHovered] = useState<'discuss' | 'portfolio' | null>(null);
  const [sectionRef, isInView] = useInView<HTMLDivElement>({ threshold: 0.3 });
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 20 }, (_, i) => i));
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(45_80%_55%/0.12),transparent_70%)]" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((i) => (
          <Particle key={i} delay={i * 0.2} />
        ))}
      </div>
      
      <div className="container px-4 relative z-10">
        <div 
          className={cn(
            "text-center max-w-3xl mx-auto transition-all duration-700",
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
            Готовы создать что-то <span className="gradient-gold-text">выдающееся</span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Расскажите о вашем проекте, и мы предложим лучшее решение
          </p>
          
          {/* Two CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA */}
            <a 
              href="/#contact"
              onMouseEnter={() => setIsHovered('discuss')}
              onMouseLeave={() => setIsHovered(null)}
              className={cn(
                "relative group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-sm transition-all duration-300",
                "hover:shadow-[0_0_40px_hsl(45_80%_55%/0.5)]"
              )}
            >
              {/* Glow effect */}
              <div 
                className={cn(
                  "absolute inset-0 bg-primary/50 rounded-sm blur-xl transition-opacity duration-300",
                  isHovered === 'discuss' ? "opacity-100" : "opacity-0"
                )}
              />
              
              <Sparkles className={cn(
                "w-5 h-5 relative z-10 transition-transform duration-300",
                isHovered === 'discuss' && "rotate-12 scale-110"
              )} />
              <span className="relative z-10">Обсудить проект</span>
              
              {/* Spark particles on hover */}
              {isHovered === 'discuss' && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-primary-foreground rounded-full animate-spark"
                      style={{
                        '--tx': `${(Math.random() - 0.5) * 100}px`,
                        '--ty': `${(Math.random() - 0.5) * 60}px`,
                        left: '50%',
                        top: '50%',
                        animationDelay: `${i * 0.05}s`
                      } as React.CSSProperties}
                    />
                  ))}
                </>
              )}
            </a>
            
            {/* Secondary CTA */}
            <Link 
              to="/portfolio"
              onMouseEnter={() => setIsHovered('portfolio')}
              onMouseLeave={() => setIsHovered(null)}
              className={cn(
                "relative group inline-flex items-center gap-2 px-8 py-4 border border-primary/30 text-foreground font-semibold rounded-sm transition-all duration-300",
                "hover:border-primary/60 hover:bg-primary/5"
              )}
            >
              <span>Посмотреть портфолио</span>
              <ArrowRight className={cn(
                "w-5 h-5 transition-transform duration-300",
                isHovered === 'portfolio' && "translate-x-1"
              )} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedCTA;
