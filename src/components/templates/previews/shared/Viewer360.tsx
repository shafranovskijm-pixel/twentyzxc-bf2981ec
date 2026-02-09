import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

interface Viewer360Props {
  images?: string[];
  placeholderColors?: string[];
  className?: string;
  autoRotate?: boolean;
}

export const Viewer360 = ({
  images,
  placeholderColors = [
    "from-zinc-800 to-zinc-700",
    "from-zinc-700 to-zinc-600",
    "from-zinc-600 to-zinc-700",
    "from-zinc-700 to-zinc-800",
  ],
  className = "",
  autoRotate = false,
}: Viewer360Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const totalFrames = images?.length || placeholderColors.length;
  const rotation = (currentIndex / totalFrames) * 360;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    startXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 10) {
      const direction = delta > 0 ? 1 : -1;
      setCurrentIndex((prev) => (prev + direction + totalFrames) % totalFrames);
      startXRef.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Auto rotation
  useState(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalFrames);
    }, 100);
    return () => clearInterval(interval);
  });

  return (
    <div className={`relative ${className}`}>
      {/* Main viewer */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Product display */}
        <div className="absolute inset-0 flex items-center justify-center">
          {images ? (
            <img
              src={images[currentIndex]}
              alt={`View ${currentIndex + 1}`}
              className="max-w-[80%] max-h-[80%] object-contain"
              draggable={false}
            />
          ) : (
            <motion.div
              animate={{ rotateY: rotation }}
              transition={{ type: "spring", stiffness: 100 }}
              className={`w-48 h-48 rounded-2xl bg-gradient-to-br ${placeholderColors[currentIndex % placeholderColors.length]}`}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* 3D cube effect */}
              <div className="absolute inset-0 rounded-2xl border border-white/10" />
              <div className="absolute inset-4 rounded-xl bg-white/5" />
            </motion.div>
          )}
        </div>

        {/* Rotation indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
          <RotateCcw className="w-4 h-4 text-white/60" />
          <span className="text-sm text-white/80">{Math.round(rotation)}°</span>
        </div>

        {/* 360 badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 rounded-full border-2 border-dashed border-white/60"
          />
          <span className="text-sm font-medium text-white">360°</span>
        </div>

        {/* Drag hint */}
        {!isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ x: [-20, 20, -20] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm"
            >
              <span className="text-sm text-white/70">← Перетащите для вращения →</span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`
            p-2 rounded-lg transition-colors
            ${isAutoRotating ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}
          `}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Frame indicator */}
      <div className="flex justify-center gap-1 mt-3">
        {Array.from({ length: totalFrames }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`
              w-2 h-2 rounded-full transition-all
              ${i === currentIndex ? "bg-primary w-4" : "bg-zinc-700 hover:bg-zinc-600"}
            `}
          />
        ))}
      </div>
    </div>
  );
};

// Mini 360 preview badge
interface Mini360BadgeProps {
  onClick?: () => void;
  className?: string;
}

export const Mini360Badge = ({ onClick, className = "" }: Mini360BadgeProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        bg-zinc-800/80 backdrop-blur-sm border border-zinc-700
        hover:border-zinc-600 transition-colors ${className}
      `}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 rounded-full border-2 border-dashed border-primary"
      />
      <span className="text-sm font-medium text-white">360° просмотр</span>
    </motion.button>
  );
};
