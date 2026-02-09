import { useRef, useState } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

interface TiltCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

const TiltCard = ({ icon: Icon, title, description, index }: TiltCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [containerRef, isInView] = useInView<HTMLDivElement>({ threshold: 0.3 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate tilt (max 15 degrees)
    const tiltX = (mouseY / (rect.height / 2)) * -15;
    const tiltY = (mouseX / (rect.width / 2)) * 15;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "transition-all duration-700",
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative h-full perspective-1000"
        style={{ perspective: "1000px" }}
      >
        <div
          className={cn(
            "luxury-card p-8 rounded-lg h-full text-center transition-all duration-300 relative overflow-hidden",
            isHovered && "border-primary/50"
          )}
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${isHovered ? '20px' : '0px'})`,
            boxShadow: isHovered 
              ? '0 25px 50px -12px hsl(45 80% 55% / 0.25), 0 0 60px hsl(45 80% 55% / 0.15)' 
              : 'none',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Glow effect on hover */}
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-radial from-primary/10 to-transparent transition-opacity duration-500",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          />
          
          {/* Icon with pulsing glow */}
          <div className="relative z-10">
            <div 
              className={cn(
                "w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 transition-all duration-500 relative",
                isHovered && "bg-primary/20 scale-110"
              )}
            >
              {/* Pulse rings */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-full bg-primary/20 transition-opacity duration-300",
                  isHovered ? "opacity-100 animate-ping" : "opacity-0"
                )}
                style={{ animationDuration: '1.5s' }}
              />
              <div 
                className={cn(
                  "absolute -inset-2 rounded-full bg-primary/10 transition-opacity duration-300",
                  isHovered ? "opacity-100 animate-ping" : "opacity-0"
                )}
                style={{ animationDuration: '2s', animationDelay: '0.5s' }}
              />
              <Icon className={cn(
                "w-8 h-8 text-primary transition-all duration-300 relative z-10",
                isHovered && "scale-110"
              )} />
            </div>
          </div>
          
          <h3 className="text-xl font-display font-semibold mb-3 gradient-gold-text relative z-10">
            {title}
          </h3>
          <p className="text-muted-foreground leading-relaxed text-sm relative z-10">
            {description}
          </p>
          
          {/* Corner accents */}
          <div className={cn(
            "absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/0 transition-all duration-500",
            isHovered && "border-primary/50"
          )} />
          <div className={cn(
            "absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary/0 transition-all duration-500",
            isHovered && "border-primary/50"
          )} />
        </div>
      </div>
    </div>
  );
};

export default TiltCard;
