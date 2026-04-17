import { motion } from "framer-motion";
import { useInView } from "@/hooks/use-in-view";

interface SectionDividerProps {
  variant?: "simple" | "ornate" | "diamond" | "palm";
  className?: string;
}

export function SectionDivider({ variant = "ornate", className = "" }: SectionDividerProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.5, triggerOnce: true });

  if (variant === "palm") {
    return (
      <div ref={ref} className={`flex items-center justify-center gap-5 py-12 ${className}`}>
        <motion.div
          className="h-px w-24 md:w-40 bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/30"
          initial={{ scaleX: 0, originX: 1 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.7 }}
        />
        <motion.svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-amber-500/70"
          fill="currentColor"
          initial={{ opacity: 0, scale: 0, rotate: -30 }}
          animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <path d="M12 2c-1 3-3 5-6 6 2 1 4 3 5 5-1-1-3-2-5-2 1 2 2 5 2 8 1-3 2-5 4-7 0 2-1 4-2 5 2-1 4-3 5-5-1 0-2 0-3 1 1-2 2-4 2-7-2 1-3 3-4 5 0-3 1-6 2-9z" />
        </motion.svg>
        <motion.div
          className="h-px w-24 md:w-40 bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/30"
          initial={{ scaleX: 0, originX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.7 }}
        />
      </div>
    );
  }

  if (variant === "simple") {
    return (
      <div ref={ref} className={`flex items-center justify-center py-8 ${className}`}>
        <motion.div
          className="h-px w-32 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.8 }}
        />
      </div>
    );
  }

  if (variant === "diamond") {
    return (
      <div ref={ref} className={`flex items-center justify-center gap-4 py-12 ${className}`}>
        <motion.div
          className="h-px w-24 bg-gradient-to-r from-transparent to-primary/30"
          initial={{ scaleX: 0, originX: 1 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.6 }}
        />
        <motion.div
          className="w-3 h-3 bg-primary/40 rotate-45"
          initial={{ scale: 0, rotate: 0 }}
          animate={isInView ? { scale: 1, rotate: 45 } : { scale: 0, rotate: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        />
        <motion.div
          className="h-px w-24 bg-gradient-to-l from-transparent to-primary/30"
          initial={{ scaleX: 0, originX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.6 }}
        />
      </div>
    );
  }

  // Ornate variant (default)
  return (
    <div ref={ref} className={`flex items-center justify-center py-16 ${className}`}>
      <div className="relative flex items-center gap-6">
        {/* Left line */}
        <motion.div
          className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-primary/40"
          initial={{ scaleX: 0, originX: 1 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.6 }}
        />
        
        {/* Left ornament */}
        <motion.svg 
          className="w-4 h-4 text-primary/30" 
          viewBox="0 0 16 16"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <path d="M8 0 L16 8 L8 16 L0 8 Z" fill="none" stroke="currentColor" strokeWidth="1" />
        </motion.svg>
        
        {/* Center diamond */}
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="w-4 h-4 bg-primary/30 rotate-45" />
          <motion.div
            className="absolute inset-0 w-4 h-4 bg-primary/20 rotate-45"
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        
        {/* Right ornament */}
        <motion.svg 
          className="w-4 h-4 text-primary/30" 
          viewBox="0 0 16 16"
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <path d="M8 0 L16 8 L8 16 L0 8 Z" fill="none" stroke="currentColor" strokeWidth="1" />
        </motion.svg>
        
        {/* Right line */}
        <motion.div
          className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-primary/40"
          initial={{ scaleX: 0, originX: 0 }}
          animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
}
