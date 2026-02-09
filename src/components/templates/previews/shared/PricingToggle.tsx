import { motion, AnimatePresence } from "framer-motion";

interface PricingToggleProps {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
  className?: string;
  monthlyLabel?: string;
  annualLabel?: string;
  discount?: number;
}

export const PricingToggle = ({
  isAnnual,
  onToggle,
  className = "",
  monthlyLabel = "Monthly",
  annualLabel = "Annual",
  discount = 20,
}: PricingToggleProps) => {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span
        className={`text-sm font-medium transition-colors cursor-pointer ${
          !isAnnual ? "text-white" : "text-zinc-500"
        }`}
        onClick={() => onToggle(false)}
      >
        {monthlyLabel}
      </span>

      <button
        onClick={() => onToggle(!isAnnual)}
        className="relative w-14 h-7 rounded-full bg-zinc-800 border border-zinc-700 transition-colors"
      >
        <motion.div
          className="absolute top-1 w-5 h-5 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-lg"
          animate={{ left: isAnnual ? "calc(100% - 24px)" : "4px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>

      <span
        className={`text-sm font-medium transition-colors cursor-pointer ${
          isAnnual ? "text-white" : "text-zinc-500"
        }`}
        onClick={() => onToggle(true)}
      >
        {annualLabel}
      </span>

      <AnimatePresence>
        {isAnnual && discount > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -10 }}
            className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium"
          >
            Save {discount}%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

// Animated price display
interface AnimatedPriceProps {
  price: number;
  currency?: string;
  period?: string;
  className?: string;
}

export const AnimatedPrice = ({
  price,
  currency = "$",
  period = "/mo",
  className = "",
}: AnimatedPriceProps) => {
  return (
    <div className={`flex items-baseline ${className}`}>
      <span className="text-zinc-400 text-lg">{currency}</span>
      <motion.span
        key={price}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-white mx-1"
      >
        {price}
      </motion.span>
      <span className="text-zinc-500 text-sm">{period}</span>
    </div>
  );
};
