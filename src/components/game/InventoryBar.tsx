import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Package } from "lucide-react";
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
            <div className="relative flex items-center gap-2 px-4 py-3 bg-card/95 backdrop-blur-xl border border-primary/30 rounded-lg shadow-[0_0_40px_hsl(45_80%_55%/0.2)]">
              {/* Inventory icon */}
              <div className="flex items-center gap-2 pr-3 border-r border-primary/20">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary font-medium tracking-wide uppercase">
                  Инвентарь
                </span>
              </div>
              
              {/* Keys */}
              <div className="flex items-center gap-1">
                <AnimatePresence mode="popLayout">
                  {keys.map((key) => (
                    <DraggableKey key={key.id} keyItem={key} />
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Key count */}
              <div className="pl-2 border-l border-primary/20">
                <span className="text-xs text-muted-foreground">
                  {keys.length}/7
                </span>
              </div>
            </div>
            
            {/* Bottom glow line */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
