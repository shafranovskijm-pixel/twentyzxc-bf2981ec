import { motion } from "framer-motion";

export function TropicalGlows() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top right — warm sunset orange */}
      <motion.div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(20 85% 55% / 0.18) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Top left — coral pink */}
      <motion.div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(14 85% 65% / 0.14) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* Bottom left — gold */}
      <motion.div
        className="absolute -bottom-60 -left-60 w-[700px] h-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(45 70% 50% / 0.10) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Bottom right — warm rose */}
      <motion.div
        className="absolute -bottom-40 -right-32 w-[550px] h-[550px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(8 75% 55% / 0.10) 0%, transparent 65%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Center ambient */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(30 70% 50% / 0.05) 0%, transparent 50%)",
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Moving warm spotlight */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(25 80% 60% / 0.07) 0%, transparent 60%)",
        }}
        animate={{
          x: ["-10%", "110%"],
          y: ["20%", "70%"],
        }}
        transition={{ duration: 28, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />
    </div>
  );
}
