import { useState } from "react";
import { motion } from "framer-motion";
import { KeyItem, useInventory } from "@/contexts/InventoryContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Key visual styles for each service type
const keyStyles: Record<string, { 
  gradient: string; 
  border: string; 
  glow: string;
  icon: string;
  gemColor: string;
}> = {
  landing: { 
    gradient: "from-amber-500/30 via-yellow-400/20 to-amber-600/30",
    border: "border-amber-500/50",
    glow: "shadow-[0_0_15px_hsl(45_80%_55%/0.5)]",
    icon: "🔑",
    gemColor: "bg-red-500"
  },
  corporate: { 
    gradient: "from-slate-400/30 via-gray-300/20 to-slate-500/30",
    border: "border-slate-400/50",
    glow: "shadow-[0_0_15px_hsl(220_20%_60%/0.5)]",
    icon: "🗝️",
    gemColor: "bg-blue-500"
  },
  ecommerce: { 
    gradient: "from-orange-600/30 via-amber-500/20 to-orange-700/30",
    border: "border-orange-500/50",
    glow: "shadow-[0_0_15px_hsl(30_70%_50%/0.5)]",
    icon: "🔐",
    gemColor: "bg-emerald-500"
  },
  webapp: { 
    gradient: "from-purple-500/30 via-violet-400/20 to-purple-600/30",
    border: "border-purple-500/50",
    glow: "shadow-[0_0_15px_hsl(270_60%_55%/0.5)]",
    icon: "⚿",
    gemColor: "bg-purple-500"
  },
  ads: { 
    gradient: "from-yellow-500/30 via-amber-300/20 to-yellow-600/30",
    border: "border-yellow-500/50",
    glow: "shadow-[0_0_15px_hsl(50_90%_55%/0.5)]",
    icon: "🔑",
    gemColor: "bg-orange-500"
  },
  license: { 
    gradient: "from-teal-500/30 via-cyan-400/20 to-teal-600/30",
    border: "border-teal-500/50",
    glow: "shadow-[0_0_15px_hsl(175_60%_45%/0.5)]",
    icon: "🗝️",
    gemColor: "bg-teal-500"
  },
  frdo: { 
    gradient: "from-rose-500/30 via-pink-400/20 to-rose-600/30",
    border: "border-rose-500/50",
    glow: "shadow-[0_0_15px_hsl(350_70%_55%/0.5)]",
    icon: "🔐",
    gemColor: "bg-yellow-500"
  },
};

const defaultStyle = keyStyles.landing;

interface DraggableKeyProps {
  keyItem: KeyItem;
  index: number;
}

export function DraggableKey({ keyItem, index }: DraggableKeyProps) {
  const { setActiveKeyForChest } = useInventory();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const style = keyStyles[keyItem.id] || defaultStyle;

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    
    // Check if dropped on chest drop zone
    const dropZone = document.getElementById('chest-drop-zone');
    if (dropZone) {
      const dropRect = dropZone.getBoundingClientRect();
      const dropPoint = {
        x: info.point.x,
        y: info.point.y,
      };
      
      if (
        dropPoint.x >= dropRect.left &&
        dropPoint.x <= dropRect.right &&
        dropPoint.y >= dropRect.top &&
        dropPoint.y <= dropRect.bottom
      ) {
        setActiveKeyForChest(keyItem);
      }
    }
  };

  // Handle click to use key
  const handleClick = () => {
    const dropZone = document.getElementById('chest-drop-zone');
    if (dropZone) {
      const rect = dropZone.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible) {
        setActiveKeyForChest(keyItem);
      } else {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => setActiveKeyForChest(keyItem), 800);
        }
      }
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          layout
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0, rotate: 180 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 20,
            delay: index * 0.1 
          }}
          whileHover={{ scale: 1.15, y: -4, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          drag
          dragSnapToOrigin
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={handleClick}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          dragElastic={0.1}
          dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
          className={`
            relative flex items-center justify-center w-12 h-12
            bg-gradient-to-br ${style.gradient}
            border-2 ${style.border} rounded-xl cursor-pointer
            transition-shadow duration-300
            ${isDragging ? `z-50 ${style.glow}` : ''}
            ${isHovered ? style.glow : ''}
          `}
          style={{ touchAction: 'none' }}
        >
          {/* Key icon with 3D effect */}
          <div className="relative">
            <span className="text-xl filter drop-shadow-lg">{style.icon}</span>
            
            {/* Gem indicator */}
            <motion.div 
              className={`absolute -top-1 -right-1 w-2.5 h-2.5 ${style.gemColor} rounded-full border border-white/30`}
              animate={isHovered ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0 }}
            />
          </div>
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
            initial={{ x: '-100%', opacity: 0 }}
            animate={isHovered ? { x: '100%', opacity: 1 } : { x: '-100%', opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
          
          {/* Glow effect when dragging */}
          {isDragging && (
            <motion.div 
              className={`absolute inset-0 rounded-xl ${style.glow} blur-md`}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="bg-card/95 backdrop-blur-sm border-primary/30 px-3 py-2"
      >
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{keyItem.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Нажмите чтобы открыть сундук</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
