import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, MotionValue } from "framer-motion";
import { RotateCcw, ZoomIn, ZoomOut, X, Loader2 } from "lucide-react";

// Separate component for rotation indicator to use motion value properly
const RotationIndicator = ({ rotation }: { rotation: MotionValue<number> }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const unsubscribe = rotation.on("change", (r) => {
      const normalized = ((r % 360) + 360) % 360;
      setDisplayValue(Math.round(normalized));
    });
    return unsubscribe;
  }, [rotation]);

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm pointer-events-none">
      <RotateCcw className="w-4 h-4 text-white/60" />
      <span className="text-sm text-white/80">{displayValue}°</span>
    </div>
  );
};

interface ProductPseudo3DProps {
  imageUrl: string;
  autoPlay?: boolean;
  onClose?: () => void;
  className?: string;
}

export const ProductPseudo3D = ({
  imageUrl,
  autoPlay = true,
  onClose,
  className = "",
}: ProductPseudo3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(autoPlay);
  const [zoom, setZoom] = useState(1);
  
  const rotation = useMotionValue(0);
  const startXRef = useRef(0);
  const velocityRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const autoRotateRef = useRef<ReturnType<typeof animate> | null>(null);

  // Dynamic lighting based on rotation
  const lightAngle = useTransform(rotation, (r) => 90 + r);
  const lightIntensity = useTransform(rotation, (r) => 
    0.15 + 0.1 * Math.abs(Math.sin((r * Math.PI) / 180))
  );
  const shadowX = useTransform(rotation, (r) => Math.sin((r * Math.PI) / 180) * 20);

  // Preload image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setIsLoading(false);
    img.onerror = () => setIsLoading(false);
    img.src = imageUrl;
  }, [imageUrl]);

  // Auto rotation
  useEffect(() => {
    if (!isAutoRotating || isDragging || isLoading) {
      autoRotateRef.current?.stop();
      return;
    }

    const startRotation = rotation.get();
    autoRotateRef.current = animate(rotation, startRotation + 360, {
      duration: 20,
      ease: "linear",
      repeat: Infinity,
    });

    return () => {
      autoRotateRef.current?.stop();
    };
  }, [isAutoRotating, isDragging, isLoading, rotation]);

  // Inertia animation
  const animateInertia = useCallback(() => {
    if (Math.abs(velocityRef.current) < 0.5) {
      velocityRef.current = 0;
      return;
    }

    rotation.set(rotation.get() + velocityRef.current);
    velocityRef.current *= 0.94;

    animationFrameRef.current = requestAnimationFrame(animateInertia);
  }, [rotation]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    startXRef.current = e.clientX;
    velocityRef.current = 0;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const now = performance.now();
    const deltaX = e.clientX - startXRef.current;
    const deltaTime = now - lastMoveTimeRef.current;
    
    if (deltaTime > 0) {
      velocityRef.current = deltaX / (deltaTime / 16) * 0.5;
    }
    
    rotation.set(rotation.get() + deltaX * 0.5);
    startXRef.current = e.clientX;
    lastMoveTimeRef.current = now;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    animateInertia();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    startXRef.current = e.touches[0].clientX;
    velocityRef.current = 0;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const now = performance.now();
    const deltaX = e.touches[0].clientX - startXRef.current;
    const deltaTime = now - lastMoveTimeRef.current;
    
    if (deltaTime > 0) {
      velocityRef.current = deltaX / (deltaTime / 16) * 0.5;
    }
    
    rotation.set(rotation.get() + deltaX * 0.5);
    startXRef.current = e.touches[0].clientX;
    lastMoveTimeRef.current = now;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    animateInertia();
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      autoRotateRef.current?.stop();
    };
  }, []);

  const displayRotation = useTransform(rotation, (r) => {
    const normalized = ((r % 360) + 360) % 360;
    return Math.round(normalized);
  });

  return (
    <div
      className={`relative w-full h-full min-h-[300px] bg-gradient-to-b from-zinc-900 to-black rounded-2xl overflow-hidden ${className}`}
    >
      {/* 3D Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none flex items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        <motion.div
          className="relative"
          style={{
            rotateY: rotation,
            transformStyle: "preserve-3d",
            scale: zoom,
          }}
        >
          {/* Main product image */}
          <motion.div className="relative">
            <img
              src={imageUrl}
              alt="Product"
              className="w-full max-w-[400px] h-auto rounded-xl shadow-2xl"
              style={{
                filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))",
              }}
              draggable={false}
            />

            {/* Dynamic highlight overlay */}
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: useTransform(
                  [lightAngle, lightIntensity],
                  ([angle, intensity]) =>
                    `linear-gradient(${angle}deg, transparent 30%, rgba(255, 255, 255, ${intensity}) 50%, transparent 70%)`
                ),
              }}
            />

            {/* Subtle edge glow */}
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                boxShadow: useTransform(
                  shadowX,
                  (x) => `inset ${x}px 0 30px rgba(16, 185, 129, 0.1)`
                ),
              }}
            />
          </motion.div>

          {/* Reflection effect */}
          <motion.div
            className="absolute top-full left-0 right-0 pointer-events-none overflow-hidden"
            style={{
              height: "80px",
              transform: "scaleY(-1) translateY(0)",
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)",
            }}
          >
            <img
              src={imageUrl}
              alt=""
              className="w-full max-w-[400px] h-auto rounded-xl opacity-40 blur-[1px]"
              draggable={false}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center z-20"
          >
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-sm text-zinc-400">Загрузка...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors pointer-events-auto"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 3D badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-medium ml-auto">
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 rounded border-2 border-dashed border-white"
            style={{ transformStyle: "preserve-3d" }}
          />
          3D View
        </div>
      </div>

      {/* Rotation indicator */}
      <RotationIndicator rotation={rotation} />

      {/* Drag hint */}
      <AnimatePresence>
        {!isDragging && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ x: [-20, 20, -20] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm"
            >
              <span className="text-sm text-white/70">
                ← Перетащите для вращения →
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium transition-all ${
            isAutoRotating
              ? "bg-emerald-500 text-white"
              : "bg-black/60 text-white/70 hover:bg-black/80"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          {isAutoRotating ? "Авто" : "Ручное"}
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          className="p-2 rounded-full bg-black/60 text-white/70 hover:bg-black/80 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
          className="p-2 rounded-full bg-black/60 text-white/70 hover:bg-black/80 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Badge for triggering 3D view
interface Pseudo3DBadgeProps {
  onClick?: () => void;
  className?: string;
}

export const Pseudo3DBadge = ({
  onClick,
  className = "",
}: Pseudo3DBadgeProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/90 backdrop-blur-sm border border-emerald-400/30 text-white text-sm font-medium hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 ${className}`}
    >
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="w-4 h-4 rounded border-2 border-dashed border-white"
        style={{ transformStyle: "preserve-3d" }}
      />
      3D
    </motion.button>
  );
};

export default ProductPseudo3D;
