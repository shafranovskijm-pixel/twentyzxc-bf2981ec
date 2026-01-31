import { useEffect, useState, useRef, useCallback } from 'react';

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

type AnimationPhase = 'idle' | 'flying-in' | 'visible' | 'fading-out';

const TitleParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const containerRef = useRef<HTMLDivElement>(null);

  const generateParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const particleCount = 200;

    // Decoration positions around the title (relative to container)
    const decorPositions: { x: number; y: number }[] = [];
    
    // Top line - more particles
    for (let i = 0; i <= 100; i += 3) {
      decorPositions.push({ x: i, y: -2 + Math.random() * 6 - 3 });
    }
    // Bottom line
    for (let i = 0; i <= 100; i += 3) {
      decorPositions.push({ x: i, y: 102 + Math.random() * 6 });
    }
    // Left side
    for (let i = 0; i <= 100; i += 5) {
      decorPositions.push({ x: -3 + Math.random() * 4 - 2, y: i });
    }
    // Right side
    for (let i = 0; i <= 100; i += 5) {
      decorPositions.push({ x: 103 + Math.random() * 4, y: i });
    }
    // Corner clusters
    for (let i = 0; i < 8; i++) {
      decorPositions.push({ x: -5 + Math.random() * 10, y: -5 + Math.random() * 10 });
      decorPositions.push({ x: 95 + Math.random() * 10, y: -5 + Math.random() * 10 });
      decorPositions.push({ x: -5 + Math.random() * 10, y: 95 + Math.random() * 10 });
      decorPositions.push({ x: 95 + Math.random() * 10, y: 95 + Math.random() * 10 });
    }
    // Scattered sparkles around text
    for (let i = 0; i < 30; i++) {
      decorPositions.push({ x: 10 + Math.random() * 80, y: 20 + Math.random() * 60 });
    }

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
        delay: Math.random() * 6,
        size: 2 + Math.random() * 4,
        opacity: 0.4 + Math.random() * 0.6,
      });
    }

    return newParticles;
  }, []);

  useEffect(() => {
    // Initial generation
    setParticles(generateParticles());
    
    // Start animation cycle
    const startCycle = () => {
      setPhase('flying-in');
      
      // After particles arrive (max delay 6s + flight 10s = 16s), show them
      setTimeout(() => {
        setPhase('visible');
      }, 16000);
      
      // Hold visible for 3 seconds, then fade out
      setTimeout(() => {
        setPhase('fading-out');
      }, 19000);
      
      // After fade out (4s), regenerate and restart
      setTimeout(() => {
        setParticles(generateParticles());
        setPhase('idle');
        // Small delay before restarting
        setTimeout(() => {
          startCycle();
        }, 500);
      }, 23000);
    };

    // Start first cycle after a small delay
    const initTimeout = setTimeout(() => {
      startCycle();
    }, 100);

    return () => {
      clearTimeout(initTimeout);
    };
  }, [generateParticles]);

  const isFlying = phase === 'flying-in' || phase === 'visible';
  const isFading = phase === 'fading-out';

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
            left: isFlying || isFading ? `${particle.endX}%` : `${particle.startX}%`,
            top: isFlying || isFading ? `${particle.endY}%` : `${particle.startY}%`,
            opacity: isFading ? 0 : (isFlying ? particle.opacity : 0),
            transition: isFading 
              ? `all 4s ease-in ${particle.delay * 0.3}s`
              : `all 10s cubic-bezier(0.23, 1, 0.32, 1) ${particle.delay}s`,
            transform: isFading ? 'scale(0)' : (isFlying ? 'scale(1)' : 'scale(0)'),
          }}
        />
      ))}
      
      {/* Decorative lines */}
      <svg 
        className="absolute inset-0 w-full h-full overflow-visible"
        style={{ 
          opacity: isFading ? 0 : (isFlying ? 1 : 0),
          transition: isFading ? 'opacity 3s ease-in' : 'opacity 3s ease-out 5s'
        }}
      >
        {/* Top left corner */}
        <path
          d="M -5 20 L -5 0 L 20 0"
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth="1"
          style={{ 
            strokeDasharray: 50,
            strokeDashoffset: isFading ? 50 : (isFlying ? 0 : 50),
            transition: isFading ? 'stroke-dashoffset 3s ease-in' : 'stroke-dashoffset 6s ease-out 3s'
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
            strokeDashoffset: isFading ? 50 : (isFlying ? 0 : 50),
            transition: isFading ? 'stroke-dashoffset 3s ease-in 0.2s' : 'stroke-dashoffset 6s ease-out 4s'
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
            strokeDashoffset: isFading ? 50 : (isFlying ? 0 : 50),
            transition: isFading ? 'stroke-dashoffset 3s ease-in 0.4s' : 'stroke-dashoffset 6s ease-out 5s'
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
            strokeDashoffset: isFading ? 50 : (isFlying ? 0 : 50),
            transition: isFading ? 'stroke-dashoffset 3s ease-in 0.6s' : 'stroke-dashoffset 6s ease-out 6s'
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
          opacity: isFading ? 0 : (isFlying ? 1 : 0),
          transform: isFading ? 'scaleX(0)' : (isFlying ? 'scaleX(1)' : 'scaleX(0)'),
          transition: isFading ? 'all 3s ease-in' : 'all 6s ease-out 8s',
        }}
      />
    </div>
  );
};

export default TitleParticles;
