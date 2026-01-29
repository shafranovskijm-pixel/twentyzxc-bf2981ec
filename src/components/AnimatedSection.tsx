import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
}

const AnimatedSection = ({ 
  children, 
  className, 
  delay = 0,
  direction = "up" 
}: AnimatedSectionProps) => {
  const [ref, isInView] = useInView<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: "-50px"
  });

  const getTransform = () => {
    if (!isInView) {
      switch (direction) {
        case "up": return "translateY(40px)";
        case "down": return "translateY(-40px)";
        case "left": return "translateX(40px)";
        case "right": return "translateX(-40px)";
        case "scale": return "scale(0.9)";
        default: return "translateY(40px)";
      }
    }
    return direction === "scale" ? "scale(1)" : "translate(0)";
  };

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isInView ? 1 : 0,
        transform: getTransform(),
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
