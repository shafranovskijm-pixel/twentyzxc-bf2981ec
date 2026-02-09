import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface ImageWithFallbackProps {
  src: string | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  aspectRatio?: "square" | "video" | "portrait" | "wide";
  fallbackGradient?: string;
  showSkeleton?: boolean;
}

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
};

export const ImageWithFallback = ({
  src,
  alt,
  className,
  fallbackClassName,
  aspectRatio = "video",
  fallbackGradient = "from-muted/50 to-muted",
  showSkeleton = true,
}: ImageWithFallbackProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);

  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // If no src or error, show gradient fallback
  if (!imageSrc || hasError) {
    return (
      <div
        className={cn(
          "w-full bg-gradient-to-br rounded-lg overflow-hidden",
          fallbackGradient,
          aspectRatioClasses[aspectRatio],
          fallbackClassName || className
        )}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg", aspectRatioClasses[aspectRatio], className)}>
      {/* Loading skeleton */}
      {isLoading && showSkeleton && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {/* Actual image with fade-in */}
      <motion.img
        src={imageSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover",
          isLoading && "opacity-0"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};

// Avatar variant with circular shape
export const AvatarWithFallback = ({
  src,
  alt,
  className,
  size = "md",
}: {
  src: string | undefined;
  alt: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center",
          sizeClasses[size],
          className
        )}
      >
        <span className="text-primary font-medium text-sm">
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-full overflow-hidden", sizeClasses[size], className)}>
      {isLoading && (
        <Skeleton className="absolute inset-0 rounded-full" />
      )}
      <motion.img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover",
          isLoading && "opacity-0"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        loading="lazy"
      />
    </div>
  );
};
