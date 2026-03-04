import { motion } from "framer-motion";

export function GradientGlows() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top right glow - warm gold, subtle */}
      <motion.div
        className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(42 60% 50% / 0.06) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Bottom left glow */}
      <motion.div
        className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(35 40% 60% / 0.04) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      {/* Center accent glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(40 30% 55% / 0.03) 0%, transparent 50%)",
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Moving spotlight effect */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(42 50% 50% / 0.03) 0%, transparent 60%)",
        }}
        animate={{
          x: ["-10%", "110%"],
          y: ["20%", "80%"],
        }}
        transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
    </div>
  );
}
