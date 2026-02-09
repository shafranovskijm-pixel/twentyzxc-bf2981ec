import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, X, Loader2 } from "lucide-react";

interface Product360SpinProps {
  images: string[];
  autoPlay?: boolean;
  onClose?: () => void;
  className?: string;
}

export const Product360Spin = ({
  images,
  autoPlay = true,
  onClose,
  className = "",
}: Product360SpinProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(autoPlay);
  const [zoom, setZoom] = useState(1);
  
  const startXRef = useRef(0);
  const velocityRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const autoRotateFrameRef = useRef<number>();

  // Preload all images
  useEffect(() => {
    setIsLoading(true);
    setLoadProgress(0);
    
    let loadedCount = 0;
    const totalImages = images.length;
    
    Promise.all(
      images.map((src) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            setLoadProgress((loadedCount / totalImages) * 100);
            resolve(img);
          };
          img.onerror = reject;
          img.src = src;
        });
      })
    )
      .then((imgs) => {
        setLoadedImages(imgs);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load images:", err);
        setIsLoading(false);
      });

    return () => {
      setLoadedImages([]);
    };
  }, [images]);

  // Render current frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !loadedImages[currentFrame]) return;

    const img = loadedImages[currentFrame];
    
    // Set canvas size to match container
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    // Clear and draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate aspect-fit dimensions with zoom
    const scale = zoom;
    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight;
    if (imgAspect > canvasAspect) {
      drawWidth = canvas.width * scale;
      drawHeight = (canvas.width / imgAspect) * scale;
    } else {
      drawHeight = canvas.height * scale;
      drawWidth = canvas.height * imgAspect * scale;
    }
    
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;
    
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  }, [currentFrame, loadedImages, zoom]);

  // Handle drag
  const handleDrag = useCallback(
    (deltaX: number) => {
      if (loadedImages.length === 0) return;
      
      const sensitivity = 8; // pixels per frame
      const frameDelta = Math.round(deltaX / sensitivity);
      if (frameDelta !== 0) {
        setCurrentFrame((prev) => {
          const newFrame = (prev - frameDelta + images.length) % images.length;
          return newFrame;
        });
      }
    },
    [images.length, loadedImages.length]
  );

  // Inertia animation
  const animateInertia = useCallback(() => {
    if (Math.abs(velocityRef.current) < 0.5) {
      velocityRef.current = 0;
      return;
    }

    handleDrag(velocityRef.current);
    velocityRef.current *= 0.92; // friction

    animationFrameRef.current = requestAnimationFrame(animateInertia);
  }, [handleDrag]);

  // Auto rotate
  useEffect(() => {
    if (!isAutoRotating || isDragging || isLoading) {
      if (autoRotateFrameRef.current) {
        cancelAnimationFrame(autoRotateFrameRef.current);
      }
      return;
    }

    let lastTime = performance.now();
    const speed = 40; // ms per frame

    const rotate = () => {
      const now = performance.now();
      if (now - lastTime >= speed) {
        setCurrentFrame((prev) => (prev + 1) % images.length);
        lastTime = now;
      }
      autoRotateFrameRef.current = requestAnimationFrame(rotate);
    };

    autoRotateFrameRef.current = requestAnimationFrame(rotate);

    return () => {
      if (autoRotateFrameRef.current) {
        cancelAnimationFrame(autoRotateFrameRef.current);
      }
    };
  }, [isAutoRotating, isDragging, isLoading, images.length]);

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
      velocityRef.current = deltaX / (deltaTime / 16);
    }
    
    handleDrag(deltaX);
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
      velocityRef.current = deltaX / (deltaTime / 16);
    }
    
    handleDrag(deltaX);
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
      if (autoRotateFrameRef.current) {
        cancelAnimationFrame(autoRotateFrameRef.current);
      }
    };
  }, []);

  const rotation = (currentFrame / images.length) * 360;

  return (
    <div
      className={`relative w-full h-full min-h-[300px] bg-gradient-to-b from-zinc-900 to-black rounded-2xl overflow-hidden ${className}`}
    >
      {/* Canvas container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      >
        <canvas ref={canvasRef} className="w-full h-full" />
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
            <div className="w-48 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${loadProgress}%` }}
              />
            </div>
            <p className="text-sm text-zinc-400 mt-2">
              Загрузка {Math.round(loadProgress)}%
            </p>
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

        {/* 360 badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-medium">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 rounded-full border-2 border-dashed border-white"
          />
          360° • {images.length} кадров
        </div>
      </div>

      {/* Rotation indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm pointer-events-none">
        <RotateCcw className="w-4 h-4 text-white/60" />
        <span className="text-sm text-white/80">{Math.round(rotation)}°</span>
      </div>

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

      {/* Frame indicator dots */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none">
        {images.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === currentFrame ? "bg-emerald-500 scale-125" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Mini badge for triggering 360° view
interface Mini360BadgeProps {
  onClick?: () => void;
  frameCount?: number;
  className?: string;
}

export const Product360Badge = ({
  onClick,
  frameCount,
  className = "",
}: Mini360BadgeProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/90 backdrop-blur-sm border border-emerald-400/30 text-white text-sm font-medium hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 ${className}`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="w-4 h-4 rounded-full border-2 border-dashed border-white"
      />
      360°{frameCount && ` • ${frameCount}`}
    </motion.button>
  );
};

export default Product360Spin;
