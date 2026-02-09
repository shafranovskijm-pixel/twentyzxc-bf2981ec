import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";
import { useInventory } from "@/contexts/InventoryContext";
import { DraggableKey } from "./DraggableKey";

export function InventoryBar() {
  const { keys, setInventoryRef } = useInventory();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      setInventoryRef(barRef as React.RefObject<HTMLDivElement>);
    }
  }, [setInventoryRef]);

  return (
    <AnimatePresence>
      {keys.length > 0 && (
        <motion.div
          ref={barRef}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            
            {/* Main bar */}
            <div className="relative flex items-center gap-3 px-5 py-3 bg-card/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-[0_0_40px_hsl(45_80%_55%/0.2)]">
              {/* Inventory icon */}
              <div className="flex items-center gap-2 pr-3 border-r border-primary/20">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Package className="w-5 h-5 text-primary" />
                </motion.div>
                <span className="text-xs text-primary font-semibold tracking-wide uppercase hidden sm:block">
                  Ключи
                </span>
              </div>
              
              {/* Keys */}
              <div className="flex items-center gap-2">
                <AnimatePresence mode="popLayout">
                  {keys.map((key, index) => (
                    <DraggableKey key={key.id} keyItem={key} index={index} />
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Key count */}
              <div className="pl-3 border-l border-primary/20">
                <span className="text-xs font-medium text-primary">
                  {keys.length}
                  <span className="text-muted-foreground">/7</span>
                </span>
              </div>
            </div>
            
            {/* Bottom glow line */}
            <motion.div 
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Hint text */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <span className="text-[10px] text-muted-foreground">
                Нажмите на ключ чтобы использовать
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
