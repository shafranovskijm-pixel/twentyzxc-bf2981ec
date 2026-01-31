import { useState, useRef, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface TechCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}

const TechCard = ({ icon: Icon, title, description, index = 0 }: TechCardProps) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const tiltX = (y - centerY) / 10;
    const tiltY = (centerX - x) / 10;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      className="relative group h-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
      }}
    >
      {/* Gradient border container */}
      <div
        className="absolute -inset-[1px] rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, hsl(45 80% 55% / 0.6), hsl(45 80% 45% / 0.2), hsl(45 80% 55% / 0.6))',
          backgroundSize: '200% 200%',
          animation: isHovered ? 'gradient-shift 3s ease infinite' : 'none',
        }}
      />
      
      {/* Main card */}
      <div
        className="relative h-full p-6 rounded-sm overflow-hidden transition-all duration-300"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          background: 'linear-gradient(135deg, hsl(0 0% 8% / 0.9), hsl(0 0% 5% / 0.95))',
          backdropFilter: 'blur(20px)',
          border: '1px solid hsl(0 0% 20% / 0.5)',
        }}
      >
        {/* Glass overlay */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, hsl(45 80% 55% / 0.05) 0%, transparent 50%, hsl(45 80% 55% / 0.03) 100%)',
          }}
        />
        
        {/* Scan line */}
        <div 
          className="absolute left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(45 80% 55% / 0.8), transparent)',
            animation: isHovered ? 'scan-line 2s ease-in-out infinite' : 'none',
            boxShadow: '0 0 10px hsl(45 80% 55% / 0.5)',
          }}
        />
        
        {/* Corner accents */}
        <svg className="absolute top-0 left-0 w-6 h-6 opacity-30 group-hover:opacity-70 transition-opacity">
          <path d="M 0 16 L 0 0 L 16 0" fill="none" stroke="hsl(45 80% 55%)" strokeWidth="1" />
        </svg>
        <svg className="absolute top-0 right-0 w-6 h-6 opacity-30 group-hover:opacity-70 transition-opacity">
          <path d="M 8 0 L 24 0 L 24 16" fill="none" stroke="hsl(45 80% 55%)" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-6 h-6 opacity-30 group-hover:opacity-70 transition-opacity">
          <path d="M 0 8 L 0 24 L 16 24" fill="none" stroke="hsl(45 80% 55%)" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-6 h-6 opacity-30 group-hover:opacity-70 transition-opacity">
          <path d="M 8 24 L 24 24 L 24 8" fill="none" stroke="hsl(45 80% 55%)" strokeWidth="1" />
        </svg>

        {/* Content */}
        <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
          {/* Icon container with glow */}
          <div 
            className="w-12 h-12 rounded-sm border border-border/50 flex items-center justify-center mb-4 transition-all duration-300 group-hover:border-primary/50"
            style={{
              background: 'linear-gradient(135deg, hsl(0 0% 12%), hsl(0 0% 8%))',
              boxShadow: isHovered ? '0 0 20px hsl(45 80% 55% / 0.2)' : 'none',
            }}
          >
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          </div>
          
          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(hsl(45 80% 55%) 1px, transparent 1px),
              linear-gradient(90deg, hsl(45 80% 55%) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes scan-line {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default TechCard;
