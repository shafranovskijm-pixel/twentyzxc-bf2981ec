import { motion } from "framer-motion";

type StatusType = "operational" | "degraded" | "outage" | "maintenance";

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showPulse?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; bg: string; text: string }> = {
  operational: {
    color: "bg-emerald-500",
    bg: "bg-emerald-500/20",
    text: "Operational",
  },
  degraded: {
    color: "bg-yellow-500",
    bg: "bg-yellow-500/20",
    text: "Degraded",
  },
  outage: {
    color: "bg-red-500",
    bg: "bg-red-500/20",
    text: "Outage",
  },
  maintenance: {
    color: "bg-blue-500",
    bg: "bg-blue-500/20",
    text: "Maintenance",
  },
};

export const StatusIndicator = ({
  status,
  label,
  showPulse = true,
  className = "",
}: StatusIndicatorProps) => {
  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
        {showPulse && status === "operational" && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.color}`}
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      <span className="text-sm text-zinc-300">{label || config.text}</span>
    </div>
  );
};

// Status card for service status page
interface StatusCardProps {
  name: string;
  status: StatusType;
  uptime?: number;
  latency?: number;
  className?: string;
}

export const StatusCard = ({
  name,
  status,
  uptime = 99.99,
  latency,
  className = "",
}: StatusCardProps) => {
  const config = statusConfig[status];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-white">{name}</span>
        <StatusIndicator status={status} showPulse={false} />
      </div>
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>Uptime: <span className="text-zinc-300">{uptime}%</span></span>
        {latency && (
          <span>Latency: <span className="text-zinc-300">{latency}ms</span></span>
        )}
      </div>
      {/* Mini uptime graph */}
      <div className="flex gap-0.5 mt-3">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-6 rounded-sm ${
              Math.random() > 0.05 ? "bg-emerald-500/40" : "bg-red-500/40"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Overall status banner
interface StatusBannerProps {
  status: StatusType;
  message?: string;
  className?: string;
}

export const StatusBanner = ({
  status,
  message,
  className = "",
}: StatusBannerProps) => {
  const config = statusConfig[status];
  const defaultMessages: Record<StatusType, string> = {
    operational: "All systems operational",
    degraded: "Some systems are experiencing issues",
    outage: "Major outage detected",
    maintenance: "Scheduled maintenance in progress",
  };

  return (
    <div className={`flex items-center justify-center gap-3 py-3 px-4 ${config.bg} rounded-lg ${className}`}>
      <StatusIndicator status={status} showPulse={status === "operational"} />
      <span className="text-sm font-medium text-white">
        {message || defaultMessages[status]}
      </span>
    </div>
  );
};
