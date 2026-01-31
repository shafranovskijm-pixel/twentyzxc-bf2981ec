import { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  size: number;
  opacity: number;
}

const TitleParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      const particleCount = 60;

      // Decoration positions around the title (relative to container)
      const decorPositions = [
        // Top line decorations
        { x: 5, y: 0 }, { x: 15, y: -5 }, { x: 25, y: 2 }, { x: 35, y: -3 },
        { x: 45, y: 1 }, { x: 55, y: -4 }, { x: 65, y: 0 }, { x: 75, y: -2 },
        { x: 85, y: 3 }, { x: 95, y: -1 },
        // Bottom decorations
        { x: 10, y: 105 }, { x: 20, y: 108 }, { x: 30, y: 103 }, { x: 40, y: 110 },
        { x: 50, y: 106 }, { x: 60, y: 102 }, { x: 70, y: 109 }, { x: 80, y: 104 },
        { x: 90, y: 107 },
        // Left side decorations
        { x: -5, y: 20 }, { x: -8, y: 40 }, { x: -3, y: 60 }, { x: -6, y: 80 },
        // Right side decorations  
        { x: 102, y: 25 }, { x: 105, y: 45 }, { x: 103, y: 65 }, { x: 106, y: 85 },
        // Corner flourishes
        { x: -2, y: -2 }, { x: 102, y: -2 }, { x: -2, y: 102 }, { x: 102, y: 102 },
        // Scattered around text
        { x: 12, y: 50 }, { x: 88, y: 50 }, { x: 50, y: 25 }, { x: 50, y: 75 },
      ];

      for (let i = 0; i < particleCount; i++) {
        // Random start position from edges
        const edge = Math.floor(Math.random() * 4);
        let startX, startY;
        
        switch (edge) {
          case 0: // Top
            startX = Math.random() * 120 - 10;
            startY = -50 - Math.random() * 50;
            break;
          case 1: // Right
            startX = 120 + Math.random() * 50;
            startY = Math.random() * 120 - 10;
            break;
          case 2: // Bottom
            startX = Math.random() * 120 - 10;
            startY = 150 + Math.random() * 50;
            break;
          default: // Left
            startX = -50 - Math.random() * 50;
            startY = Math.random() * 120 - 10;
        }

        // End position - either decoration position or random around text
        const useDecorPosition = i < decorPositions.length;
        const endPos = useDecorPosition 
          ? decorPositions[i]
          : { x: Math.random() * 100, y: Math.random() * 100 };

        newParticles.push({
          id: i,
          startX,
          startY,
          endX: endPos.x,
          endY: endPos.y,
          delay: Math.random() * 0.8,
          size: 2 + Math.random() * 4,
          opacity: 0.5 + Math.random() * 0.5,
        });
      }

      setParticles(newParticles);
      setTimeout(() => setIsAnimating(true), 100);
    };

    generateParticles();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, hsl(45 80% 55%) 0%, hsl(45 80% 45% / 0.5) 100%)`,
            boxShadow: `0 0 ${particle.size * 2}px hsl(45 80% 55% / 0.6)`,
            left: isAnimating ? `${particle.endX}%` : `${particle.startX}%`,
            top: isAnimating ? `${particle.endY}%` : `${particle.startY}%`,
            opacity: isAnimating ? particle.opacity : 0,
            transition: `all 1.2s cubic-bezier(0.23, 1, 0.32, 1) ${particle.delay}s`,
            transform: isAnimating ? 'scale(1)' : 'scale(0)',
          }}
        />
      ))}
      
      {/* Decorative lines */}
      <svg 
        className="absolute inset-0 w-full h-full overflow-visible"
        style={{ 
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 1s ease-out 0.5s'
        }}
      >
        {/* Top left corner */}
        <path
          d="M -5 20 L -5 0 L 20 0"
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth="1"
          className="animate-draw-line"
          style={{ 
            strokeDasharray: 50,
            strokeDashoffset: isAnimating ? 0 : 50,
            transition: 'stroke-dashoffset 1.5s ease-out 0.3s'
          }}
        />
        {/* Top right corner */}
        <path
          d="M 80% 0 L 100% 0 L 100% 20"
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth="1"
          style={{ 
            strokeDasharray: 50,
            strokeDashoffset: isAnimating ? 0 : 50,
            transition: 'stroke-dashoffset 1.5s ease-out 0.4s'
          }}
        />
        {/* Bottom left corner */}
        <path
          d="M -5 80% L -5 100% L 20 100%"
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth="1"
          style={{ 
            strokeDasharray: 50,
            strokeDashoffset: isAnimating ? 0 : 50,
            transition: 'stroke-dashoffset 1.5s ease-out 0.5s'
          }}
        />
        {/* Bottom right corner */}
        <path
          d="M 80% 100% L 100% 100% L 100% 80%"
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth="1"
          style={{ 
            strokeDasharray: 50,
            strokeDashoffset: isAnimating ? 0 : 50,
            transition: 'stroke-dashoffset 1.5s ease-out 0.6s'
          }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(45 80% 55% / 0.3)" />
            <stop offset="50%" stopColor="hsl(45 80% 55% / 0.8)" />
            <stop offset="100%" stopColor="hsl(45 80% 55% / 0.3)" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Shimmer line under title */}
      <div 
        className="absolute left-0 right-0 h-[1px] bottom-0"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(45 80% 55% / 0.5), transparent)',
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'all 1s ease-out 0.8s',
        }}
      />
    </div>
  );
};

export default TitleParticles;
