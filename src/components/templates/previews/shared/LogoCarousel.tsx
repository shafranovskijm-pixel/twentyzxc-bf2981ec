import { motion } from "framer-motion";
import { Building2, Briefcase, Globe, Zap, Star, Shield, Rocket, Target } from "lucide-react";

interface LogoCarouselProps {
  accentColor?: string;
}

export const LogoCarousel = ({ accentColor = "amber" }: LogoCarouselProps) => {
  const logos = [
    { icon: Building2, name: "Corporation" },
    { icon: Briefcase, name: "Enterprise" },
    { icon: Globe, name: "Global Inc" },
    { icon: Zap, name: "FastTech" },
    { icon: Star, name: "Premium" },
    { icon: Shield, name: "Secure Co" },
    { icon: Rocket, name: "Startup X" },
    { icon: Target, name: "Focus Ltd" },
  ];

  // Duplicate for seamless loop
  const allLogos = [...logos, ...logos];

  return (
    <div className="relative overflow-hidden py-8">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/80 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/80 to-transparent z-10" />
      
      <motion.div
        className="flex gap-12 items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {allLogos.map((logo, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity shrink-0"
          >
            <logo.icon className={`w-8 h-8 text-${accentColor}-400`} />
            <span className="text-white/70 font-medium whitespace-nowrap">{logo.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
