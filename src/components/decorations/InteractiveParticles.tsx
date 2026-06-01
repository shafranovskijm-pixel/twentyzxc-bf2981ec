import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  vx: number;
  vy: number;
  opacity: number;
  targetOpacity: number;
  pulseSpeed: number;
  pulseOffset: number;
}

export function InteractiveParticles({ count = 50 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);

  const initParticles = useCallback((width: number, height: number) => {
    const isMobile = width < 768;
    const actualCount = isMobile ? Math.min(count, 30) : count;
    particlesRef.current = Array.from({ length: actualCount }, () => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x, y,
        baseX: x,
        baseY: y,
        size: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.1,
        targetOpacity: Math.random() * 0.4 + 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseOffset: Math.random() * Math.PI * 2,
      };
    });
  }, [count]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Logical (CSS) dimensions we render against. Decoupled from the buffer
    // pixel dimensions, which we scale by DPR for crisp particles on retina
    // mobiles.
    let logicalW = window.innerWidth;
    let logicalH = window.innerHeight;
    let lastBufferW = 0;
    let lastBufferH = 0;

    const applyCanvasSize = (w: number, h: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bufW = Math.round(w * dpr);
      const bufH = Math.round(h * dpr);
      if (bufW === lastBufferW && bufH === lastBufferH) return;
      canvas.width = bufW;
      canvas.height = bufH;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastBufferW = bufW;
      lastBufferH = bufH;
    };

    const resize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      const dW = Math.abs(newW - logicalW);
      const dH = Math.abs(newH - logicalH);

      // Mobile browsers fire `resize` whenever the URL bar shows/hides —
      // width stays the same, height jumps ~80–120px. Skip rebuilding the
      // buffer in that case so particles don't flicker on every scroll.
      if (dW === 0 && dH > 0 && dH < 160 && particlesRef.current.length > 0) {
        logicalH = newH;
        applyCanvasSize(logicalW, logicalH);
        return;
      }

      // Real resize: scale existing particles proportionally so they don't
      // jump or all reset to random positions.
      if (particlesRef.current.length > 0 && logicalW > 0 && logicalH > 0) {
        const sx = newW / logicalW;
        const sy = newH / logicalH;
        for (const p of particlesRef.current) {
          p.x *= sx;
          p.y *= sy;
          p.baseX *= sx;
          p.baseY *= sy;
        }
      }

      logicalW = newW;
      logicalH = newH;
      applyCanvasSize(logicalW, logicalH);
      if (particlesRef.current.length === 0) {
        initParticles(logicalW, logicalH);
      }
    };

    resize();

    // Prefer visualViewport when available: it does NOT fire for URL-bar
    // toggle on iOS/Android, which is exactly what we want.
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", resize);
    } else {
      window.addEventListener("resize", resize);
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;
    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, logicalW, logicalH);
      const mouse = mouseRef.current;
      const interactionRadius = 150;

      for (const p of particlesRef.current) {
        // Drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = logicalW;
        if (p.x > logicalW) p.x = 0;
        if (p.y < 0) p.y = logicalH;
        if (p.y > logicalH) p.y = 0;

        // Mouse interaction — repel gently
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < interactionRadius && dist > 0) {
          const force = (interactionRadius - dist) / interactionRadius;
          const angle = Math.atan2(dy, dx);
          p.x += Math.cos(angle) * force * 2;
          p.y += Math.sin(angle) * force * 2;
          // Brighten near cursor
          p.targetOpacity = Math.min(0.9, 0.4 + force * 0.6);
        } else {
          p.targetOpacity = 0.15 + Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.1;
        }

        // Smooth opacity
        p.opacity += (p.targetOpacity - p.opacity) * 0.05;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Gold color: hsl(42, 80%, 50%) = rgb(230, 179, 25)
        ctx.fillStyle = `rgba(212, 190, 55, ${p.opacity})`;
        ctx.fill();

        // Draw glow for larger/brighter particles
        if (p.opacity > 0.3 && p.size > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 190, 55, ${p.opacity * 0.15})`;
          ctx.fill();
        }
      }

      // Draw connections between close particles near cursor
      for (let i = 0; i < particlesRef.current.length; i++) {
        const a = particlesRef.current[i];
        const dxM = a.x - mouse.x;
        const dyM = a.y - mouse.y;
        const distM = Math.sqrt(dxM * dxM + dyM * dyM);
        if (distM > interactionRadius * 1.5) continue;

        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const b = particlesRef.current[j];
          const dx2 = a.x - b.x;
          const dy2 = a.y - b.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 100) {
            const lineOpacity = (1 - dist2 / 100) * 0.15;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(212, 190, 55, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (vv) vv.removeEventListener("resize", resize);
      else window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
