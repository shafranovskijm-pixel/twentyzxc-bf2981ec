import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "outline" | "glow";
  size?: "sm" | "md" | "lg";
  accentColor?: string;
  onClick?: () => void;
}

export const GradientButton = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  accentColor = "amber",
  onClick,
}: GradientButtonProps) => {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const baseClasses = cn(
    "relative font-medium rounded-lg overflow-hidden transition-all duration-300",
    sizeClasses[size]
  );

  if (variant === "primary") {
    return (
      <motion.button
        className={cn(
          baseClasses,
          `bg-${accentColor}-500 text-black hover:bg-${accentColor}-400`,
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }

  if (variant === "glow") {
    return (
      <motion.button
        className={cn(
          baseClasses,
          `bg-${accentColor}-500 text-black`,
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        {/* Animated glow */}
        <motion.div
          className={`absolute inset-0 bg-${accentColor}-400`}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 3,
          }}
        />
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    );
  }

  // Outline variant
  return (
    <motion.button
      className={cn(
        baseClasses,
        "border border-white/20 text-white hover:bg-white/10",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
