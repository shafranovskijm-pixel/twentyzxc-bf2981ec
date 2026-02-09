import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { KeyItem, useInventory } from "@/contexts/InventoryContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DraggableKeyProps {
  keyItem: KeyItem;
}

export function DraggableKey({ keyItem }: DraggableKeyProps) {
  const { setActiveKeyForChest } = useInventory();
  const [isDragging, setIsDragging] = useState(false);

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
        // Dropped on chest!
        setActiveKeyForChest(keyItem);
      }
    }
  };

  // Handle click to use key (alternative to drag)
  const handleClick = () => {
    // Check if chest drop zone is visible
    const dropZone = document.getElementById('chest-drop-zone');
    if (dropZone) {
      const rect = dropZone.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible) {
        setActiveKeyForChest(keyItem);
      } else {
        // Scroll to chest section
        const contactSection = document.getElementById('contact');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
          // After scrolling, activate key
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
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          drag
          dragSnapToOrigin
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={handleClick}
          dragElastic={0.1}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
          className={`
            relative flex items-center justify-center w-10 h-10 
            bg-gradient-to-br from-primary/20 to-primary/5 
            border border-primary/40 rounded-lg cursor-pointer
            transition-colors hover:border-primary/60 hover:from-primary/30
            ${isDragging ? 'z-50 shadow-[0_0_20px_hsl(45_80%_55%/0.5)] cursor-grabbing' : ''}
          `}
          style={{ touchAction: 'none' }}
        >
          <KeyRound className="w-4 h-4 text-primary" />
          
          {/* Glow effect when dragging */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md animate-pulse" />
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-card border-primary/30">
        <p className="text-sm">{keyItem.label}</p>
        <p className="text-xs text-muted-foreground">Нажмите или перетащите к сундуку</p>
      </TooltipContent>
    </Tooltip>
  );
}
