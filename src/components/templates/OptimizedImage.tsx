import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

/**
 * Generates WebP path from original image path
 * /path/to/image.jpg -> /path/to/image.webp
 */
const getWebPPath = (src: string): string => {
  return src.replace(/\.(jpg|jpeg|png)$/i, ".webp");
};

// Predefined sizes configurations
export const imageSizes = {
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  hero: "(max-width: 768px) 100vw, 50vw",
  fullWidth: "100vw",
  thumbnail: "(max-width: 640px) 50vw, 150px",
  gallery: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  avatar: "96px",
  product: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px",
  portrait: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 192px",
};

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
};

interface OptimizedImageProps {
  /** Image source (jpg/jpeg/png) */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS classes */
  className?: string;
  /** Aspect ratio preset */
  aspectRatio?: "square" | "video" | "portrait" | "wide";
  /** Priority loading for hero/above-fold images */
  priority?: boolean;
  /** Responsive sizes attribute */
  sizes?: string;
  /** Enable WebP format (if webp file exists) */
  webp?: boolean;
  /** Show loading skeleton */
  showSkeleton?: boolean;
  /** Blur-up effect during loading */
  blur?: boolean;
  /** Fallback gradient for errors */
  fallbackGradient?: string;
}

/**
 * OptimizedImage component with WebP support via <picture> element.
 * 
 * Automatically tries to load WebP version first, falls back to original format.
 * 
 * @example
 * <OptimizedImage 
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   priority
 *   webp
 *   sizes={imageSizes.hero}
 * />
 */
export const OptimizedImage = ({
  src,
  alt,
  className,
  aspectRatio = "video",
  priority = false,
  sizes = imageSizes.card,
  webp = true,
  showSkeleton = true,
  blur = true,
  fallbackGradient = "from-muted/50 to-muted",
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate WebP path
  const webpSrc = useMemo(() => {
    if (!webp || !src) return null;
    return getWebPPath(src);
  }, [src, webp]);

  // Reset state when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px", threshold: 0.01 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Error fallback
  if (!src || hasError) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "w-full bg-gradient-to-br rounded-lg overflow-hidden",
          fallbackGradient,
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg",
        aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {/* Loading skeleton */}
      {isLoading && showSkeleton && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Blur placeholder */}
      {blur && isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/60 backdrop-blur-sm" />
      )}

      {/* Picture element with WebP + fallback */}
      {isInView && (
        <motion.picture
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* WebP source (modern browsers) */}
          {webpSrc && (
            <source srcSet={webpSrc} type="image/webp" sizes={sizes} />
          )}
          
          {/* Fallback image (jpg/png) */}
          <img
            src={src}
            alt={alt}
            className={cn("w-full h-full object-cover")}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            sizes={sizes}
            {...(priority && { fetchPriority: "high" as const })}
          />
        </motion.picture>
      )}
    </div>
  );
};

export default OptimizedImage;
