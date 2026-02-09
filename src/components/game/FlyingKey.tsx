import { motion, AnimatePresence } from "framer-motion";
import { KeyRound } from "lucide-react";
import { useInventory } from "@/contexts/InventoryContext";

export function FlyingKey() {
  const { flyingKey } = useInventory();

  return (
    <AnimatePresence>
      {flyingKey && flyingKey.phase !== 'done' && (
        <motion.div
          initial={{
            position: 'fixed',
            left: flyingKey.startPosition.x,
            top: flyingKey.startPosition.y,
            scale: 1,
            rotate: 0,
            opacity: 1,
            zIndex: 9999,
          }}
          animate={{
            left: flyingKey.endPosition.x,
            top: flyingKey.endPosition.y,
            scale: flyingKey.phase === 'arriving' ? 0.5 : 1.2,
            rotate: 360,
            opacity: flyingKey.phase === 'arriving' ? 0 : 1,
          }}
          transition={{
            duration: flyingKey.phase === 'arriving' ? 0.3 : 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="pointer-events-none"
          style={{
            position: 'fixed',
            zIndex: 9999,
          }}
        >
          {/* Key container */}
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            {/* Glow trail */}
            <motion.div
              className="absolute inset-0 bg-primary/30 rounded-full blur-xl"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            
            {/* Key icon */}
            <div className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 rounded-lg border border-primary/50 shadow-[0_0_30px_hsl(45_80%_55%/0.5)]">
              <KeyRound className="w-6 h-6 text-primary-foreground" />
            </div>
            
            {/* Sparkle particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-primary rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos((i / 6) * Math.PI * 2) * 30,
                  y: Math.sin((i / 6) * Math.PI * 2) * 30,
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 0.2,
                }}
                style={{ left: '50%', top: '50%' }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
