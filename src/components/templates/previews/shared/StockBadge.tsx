import { motion } from "framer-motion";
import { Flame, Clock, AlertTriangle, Package } from "lucide-react";

type StockStatus = "low" | "high-demand" | "last-items" | "pre-order" | "out-of-stock";

interface StockBadgeProps {
  status: StockStatus;
  count?: number;
  className?: string;
}

const stockConfig: Record<StockStatus, {
  icon: typeof Flame;
  bg: string;
  text: string;
  label: (count?: number) => string;
}> = {
  "low": {
    icon: AlertTriangle,
    bg: "bg-amber-500/20 border-amber-500/30",
    text: "text-amber-400",
    label: (count) => count ? `Осталось ${count} шт` : "Мало на складе",
  },
  "high-demand": {
    icon: Flame,
    bg: "bg-red-500/20 border-red-500/30",
    text: "text-red-400",
    label: () => "Высокий спрос",
  },
  "last-items": {
    icon: Clock,
    bg: "bg-orange-500/20 border-orange-500/30",
    text: "text-orange-400",
    label: (count) => count ? `Последние ${count} шт` : "Последние экземпляры",
  },
  "pre-order": {
    icon: Package,
    bg: "bg-blue-500/20 border-blue-500/30",
    text: "text-blue-400",
    label: () => "Предзаказ",
  },
  "out-of-stock": {
    icon: AlertTriangle,
    bg: "bg-zinc-500/20 border-zinc-500/30",
    text: "text-zinc-400",
    label: () => "Нет в наличии",
  },
};

export const StockBadge = ({
  status,
  count,
  className = "",
}: StockBadgeProps) => {
  const config = stockConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        border ${config.bg} ${config.text} ${className}
      `}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label(count)}</span>
      
      {/* Animated indicator for high-demand */}
      {status === "high-demand" && (
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-red-400"
        />
      )}
    </motion.div>
  );
};

// Progress bar for stock level
interface StockProgressProps {
  current: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export const StockProgress = ({
  current,
  total,
  showLabel = true,
  className = "",
}: StockProgressProps) => {
  const percentage = (current / total) * 100;
  const isLow = percentage <= 20;
  const isMedium = percentage > 20 && percentage <= 50;

  const getColor = () => {
    if (isLow) return "bg-red-500";
    if (isMedium) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-zinc-400">В наличии</span>
          <span className={isLow ? "text-red-400" : "text-zinc-300"}>
            {current} из {total}
          </span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${getColor()}`}
        />
      </div>
    </div>
  );
};

// Urgency message
interface UrgencyMessageProps {
  viewersCount?: number;
  cartCount?: number;
  className?: string;
}

export const UrgencyMessage = ({
  viewersCount,
  cartCount,
  className = "",
}: UrgencyMessageProps) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {viewersCount && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-zinc-400"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {viewersCount} человек смотрят сейчас
        </motion.p>
      )}
      {cartCount && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 text-xs text-amber-400"
        >
          <Flame className="w-3 h-3" />
          {cartCount} добавили в корзину за последний час
        </motion.p>
      )}
    </div>
  );
};
