import { motion } from "framer-motion";
import { useInView } from "@/hooks/use-in-view";

interface SectionDividerProps {
  variant?: "simple" | "ornate" | "diamond";
  className?: string;
}

export function SectionDivider({ variant = "ornate", className = "" }: SectionDividerProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.5, triggerOnce: true });

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
