import { motion } from "framer-motion";

export function GeometricShapes() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Large rotating diamond - top right */}
      <motion.div
        className="absolute top-20 right-10 w-32 h-32 border border-primary/15 rotate-45"
        animate={{ rotate: [45, 135, 45] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Medium floating square - left side */}
      <motion.div
        className="absolute top-1/3 left-8 w-20 h-20 border border-primary/10"
        animate={{ y: [0, -20, 0], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Small diamond - bottom left */}
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-12 h-12 border border-primary/15 rotate-45"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Elegant lines - top left corner */}
      <svg className="absolute top-40 left-12 w-24 h-24 text-primary/10" viewBox="0 0 100 100">
        <motion.path
          d="M0 50 L50 0 L50 20 L20 50 L50 50 L50 100 L0 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
        />
      </svg>
      
      {/* Diagonal lines - right side */}
      <svg className="absolute top-1/2 right-20 w-32 h-32 text-primary/8" viewBox="0 0 100 100">
        <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="0.5" />
        <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" />
        <line x1="40" y1="100" x2="100" y2="40" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      
      {/* Floating frame - center right */}
      <motion.div
        className="absolute top-[60%] right-16 w-16 h-24 border border-primary/10"
        animate={{ y: [0, 15, 0], rotateZ: [-5, 5, -5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Gold accent dots */}
      <motion.div
        className="absolute top-1/2 left-20 w-3 h-3 bg-primary/25 rotate-45"
        animate={{ opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-[70%] right-1/3 w-2 h-2 bg-primary/20 rotate-45"
        animate={{ opacity: [0.1, 0.35, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />
      <motion.div
        className="absolute top-[85%] left-1/3 w-2.5 h-2.5 bg-primary/15 rotate-45"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, delay: 2 }}
      />

      {/* Additional gold dots */}
      <motion.div
        className="absolute top-[20%] left-[45%] w-1.5 h-1.5 rounded-full bg-primary/30"
        animate={{ opacity: [0.15, 0.45, 0.15], scale: [1, 1.3, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-[40%] right-[12%] w-2 h-2 rounded-full bg-primary/25"
        animate={{ opacity: [0.1, 0.35, 0.1] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-[15%] left-[20%] w-1.5 h-1.5 rounded-full bg-primary/20"
        animate={{ opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1.5 }}
      />
      <motion.div
        className="absolute top-[55%] left-[8%] w-2 h-2 rounded-full bg-primary/15"
        animate={{ opacity: [0.1, 0.3, 0.1], y: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      {/* Horizontal gold lines */}
      <div className="absolute top-[45%] left-0 w-24 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      <div className="absolute top-[75%] right-0 w-32 h-px bg-gradient-to-l from-transparent via-primary/15 to-transparent" />
      <div className="absolute top-[15%] left-[30%] w-16 h-px bg-gradient-to-r from-primary/12 to-transparent" />

      {/* Corner ornament - bottom left */}
      <div className="absolute bottom-12 left-12">
        <div className="w-20 h-20 border-b border-l border-primary/12" />
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-primary/25 rotate-45 -translate-x-0.5 translate-y-0.5" />
      </div>

      {/* Corner ornament - top right */}
      <div className="absolute top-12 right-12">
        <div className="w-16 h-16 border-t border-r border-primary/12" />
        <div className="absolute top-0 right-0 w-2 h-2 bg-primary/25 rotate-45 translate-x-0.5 -translate-y-0.5" />
      </div>
    </div>
  );
}
