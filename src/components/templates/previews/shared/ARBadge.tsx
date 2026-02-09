import { motion } from "framer-motion";
import { Smartphone, Eye, Box, Sparkles } from "lucide-react";

interface ARBadgeProps {
  variant?: "default" | "compact" | "banner";
  className?: string;
  onClick?: () => void;
}

export const ARBadge = ({
  variant = "default",
  className = "",
  onClick,
}: ARBadgeProps) => {
  if (variant === "compact") {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
          bg-gradient-to-r from-purple-500/20 to-pink-500/20
          border border-purple-500/30 text-purple-400 text-xs font-medium
          hover:border-purple-400/50 transition-colors ${className}
        `}
      >
        <Box className="w-3.5 h-3.5" />
        <span>AR</span>
      </motion.button>
    );
  }

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative overflow-hidden rounded-2xl
          bg-gradient-to-r from-purple-900/50 to-pink-900/50
          border border-purple-500/30 p-6 ${className}
        `}
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 50%, rgba(168, 85, 247, 0.4) 0%, transparent 50%),
                               radial-gradient(circle at 70% 50%, rgba(236, 72, 153, 0.4) 0%, transparent 50%)`,
            }}
          />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Animated 3D icon */}
            <div className="relative">
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              >
                <Box className="w-8 h-8 text-white" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center"
              >
                <Sparkles className="w-3 h-3 text-white" />
              </motion.div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-1">
                Примерьте в дополненной реальности
              </h4>
              <p className="text-sm text-purple-200/70">
                Посмотрите, как товар выглядит в вашем пространстве
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-purple-900 font-medium hover:bg-purple-50 transition-colors"
          >
            <Smartphone className="w-5 h-5" />
            <span>Открыть AR</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-xl
        bg-gradient-to-r from-purple-500/10 to-pink-500/10
        border border-purple-500/20 hover:border-purple-400/40 transition-all ${className}
      `}
    >
      {/* Shimmer effect */}
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
      />

      <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
        <Box className="w-5 h-5 text-purple-400" />
      </div>

      <div className="relative text-left">
        <p className="text-sm font-medium text-white">Попробуйте в AR</p>
        <p className="text-xs text-purple-300/70">Сканируйте с телефона</p>
      </div>

      <Eye className="w-5 h-5 text-purple-400 ml-auto" />
    </motion.button>
  );
};

// QR code for AR
interface ARQRCodeProps {
  className?: string;
}

export const ARQRCode = ({ className = "" }: ARQRCodeProps) => {
  return (
    <div className={`p-4 rounded-xl bg-white ${className}`}>
      {/* Fake QR code pattern */}
      <div className="w-32 h-32 grid grid-cols-8 grid-rows-8 gap-0.5">
        {Array.from({ length: 64 }).map((_, i) => (
          <div
            key={i}
            className={`${Math.random() > 0.5 ? "bg-black" : "bg-white"}`}
          />
        ))}
      </div>
      <p className="text-center text-xs text-zinc-500 mt-2">
        Сканируйте камерой телефона
      </p>
    </div>
  );
};
