import { motion } from "framer-motion";
import { useMemo } from "react";

/** Floating leaf particles for "Freshness" */
const LeavesAnimation = () => {
  const leaves = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: Math.random() * 10 + 6,
    duration: Math.random() * 12 + 18,
    delay: Math.random() * 8,
    rotate: Math.random() * 360,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {leaves.map(l => (
        <motion.div
          key={l.id}
          className="absolute text-emerald-400/20 dark:text-emerald-500/15"
          style={{ left: `${l.x}%`, top: "-5%", fontSize: l.size }}
          animate={{ y: ["0vh", "105vh"], rotate: [l.rotate, l.rotate + 360], x: [0, 30, -20, 10, 0] }}
          transition={{ duration: l.duration, delay: l.delay, repeat: Infinity, ease: "linear" }}
        >
          🍃
        </motion.div>
      ))}
    </div>
  );
};

/** Soft pulsing fade for "Office" */
const FadeAnimation = () => (
  <div className="fixed inset-0 pointer-events-none z-0">
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-slate-200/10 to-transparent dark:from-slate-600/5"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

/** Twinkling lights for "New York" */
const LightsAnimation = () => {
  const lights = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 4,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {lights.map(l => (
        <motion.div
          key={l.id}
          className="absolute rounded-full bg-amber-400/30 dark:bg-amber-400/20"
          style={{ left: `${l.x}%`, top: `${l.y}%`, width: l.size, height: l.size }}
          animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: l.duration, delay: l.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

/** Shifting gradient for "Sunset" */
const GradientAnimation = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <motion.div
      className="absolute inset-0"
      style={{ background: "linear-gradient(135deg, rgba(251,146,60,0.06), rgba(244,63,94,0.04), rgba(251,191,36,0.05))" }}
      animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute w-96 h-96 rounded-full bg-orange-400/8 blur-3xl"
      style={{ left: "20%", top: "30%" }}
      animate={{ x: [0, 60, -40, 0], y: [0, -50, 30, 0], scale: [1, 1.15, 0.9, 1] }}
      transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

/** Gentle glow for "Minimalism" */
const GlowAnimation = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <motion.div
      className="absolute w-80 h-80 rounded-full bg-violet-400/10 blur-3xl"
      style={{ right: "10%", top: "20%" }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute w-64 h-64 rounded-full bg-purple-300/8 blur-3xl"
      style={{ left: "15%", bottom: "25%" }}
      animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.2, 0.5, 0.2] }}
      transition={{ duration: 12, delay: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

/** Drifting silver-turquoise sparkle particles */
const ParticlesAnimation = () => {
  const particles = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 15 + 20,
    delay: Math.random() * 10,
    opacityDuration: Math.random() * 4 + 2,
    color: Math.random() > 0.5 ? "bg-cyan-300/30" : "bg-white/20",
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${p.color}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -60, -120],
            x: [0, Math.random() * 30 - 15, Math.random() * 20 - 10],
            opacity: [0.1, 0.7, 0.1],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

/** Drifting sand/dust particles for "Sunset" */
const SandAnimation = () => {
  const grains = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.8,
    duration: Math.random() * 18 + 14,
    delay: Math.random() * 10,
    color: Math.random() > 0.6 ? "bg-amber-300/25" : "bg-orange-200/20",
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {grains.map(g => (
        <motion.div
          key={g.id}
          className={`absolute rounded-full ${g.color}`}
          style={{ left: `${g.x}%`, top: `${g.y}%`, width: g.size, height: g.size }}
          animate={{
            x: [0, 40, 80],
            y: [0, -15, -30],
            opacity: [0.15, 0.5, 0.1],
          }}
          transition={{ duration: g.duration, delay: g.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

export const ThemeAnimation = ({ animation }: { animation: string }) => {
  switch (animation) {
    case "leaves": return <LeavesAnimation />;
    case "fade": return <FadeAnimation />;
    case "lights": return <LightsAnimation />;
    case "gradient": return <GradientAnimation />;
    case "glow": return <GlowAnimation />;
    case "particles": return <ParticlesAnimation />;
    case "sand": return <SandAnimation />;
    default: return null;
  }
};
