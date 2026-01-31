import { useEffect, useState, useRef, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

const TitleParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const generateParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 140 - 20, // -20% to 120%
        y: Math.random() * 140 - 20,
        size: 0.5 + Math.random() * 1.5, // Much smaller: 0.5-2px
        opacity: 0.2 + Math.random() * 0.6,
        speedX: (Math.random() - 0.5) * 0.15, // Slow chaotic movement
        speedY: (Math.random() - 0.5) * 0.15,
        twinkleSpeed: 0.5 + Math.random() * 2, // Twinkling speed
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    return newParticles;
  }, []);

  useEffect(() => {
    setParticles(generateParticles());
  }, [generateParticles]);

  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newX = particle.x + particle.speedX;
          let newY = particle.y + particle.speedY;
          
          // Wrap around edges with buffer
          if (newX < -25) newX = 125;
          if (newX > 125) newX = -25;
          if (newY < -25) newY = 125;
          if (newY > 125) newY = -25;

          // Occasionally change direction slightly for more chaos
          let newSpeedX = particle.speedX;
          let newSpeedY = particle.speedY;
          if (Math.random() < 0.005) {
            newSpeedX += (Math.random() - 0.5) * 0.05;
            newSpeedY += (Math.random() - 0.5) * 0.05;
            // Clamp speed
            newSpeedX = Math.max(-0.2, Math.min(0.2, newSpeedX));
            newSpeedY = Math.max(-0.2, Math.min(0.2, newSpeedY));
          }

          return {
            ...particle,
            x: newX,
            y: newY,
            speedX: newSpeedX,
            speedY: newSpeedY,
            twinklePhase: particle.twinklePhase + deltaTime * particle.twinkleSpeed,
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((particle) => {
        const twinkle = Math.sin(particle.twinklePhase) * 0.5 + 0.5;
        const currentOpacity = particle.opacity * (0.3 + twinkle * 0.7);
        
        return (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              background: particle.size > 1.2 
                ? `radial-gradient(circle, hsl(45 80% 70%) 0%, hsl(45 80% 55% / 0.3) 100%)`
                : `hsl(45 80% ${60 + Math.random() * 20}%)`,
              boxShadow: particle.size > 1 
                ? `0 0 ${particle.size * 2}px hsl(45 80% 55% / ${currentOpacity * 0.5})`
                : 'none',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: currentOpacity,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
      
      {/* Subtle corner accents */}
      <svg 
        className="absolute inset-0 w-full h-full overflow-visible opacity-30"
      >
        {/* Top left corner */}
        <path
          d="M 0 15 L 0 0 L 15 0"
          fill="none"
          stroke="hsl(45 80% 55%)"
          strokeWidth="0.5"
        />
        {/* Top right corner */}
        <path
          d="M 85% 0 L 100% 0 L 100% 15"
          fill="none"
          stroke="hsl(45 80% 55%)"
          strokeWidth="0.5"
        />
        {/* Bottom left corner */}
        <path
          d="M 0 85% L 0 100% L 15 100%"
          fill="none"
          stroke="hsl(45 80% 55%)"
          strokeWidth="0.5"
        />
        {/* Bottom right corner */}
        <path
          d="M 85% 100% L 100% 100% L 100% 85%"
          fill="none"
          stroke="hsl(45 80% 55%)"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
};

export default TitleParticles;
