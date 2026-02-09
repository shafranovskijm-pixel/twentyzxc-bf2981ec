import { Helmet } from "react-helmet-async";

interface ImagePreloadProps {
  /** Image source URL or imported asset */
  src: string;
  /** Fetch priority for the image */
  fetchPriority?: "high" | "low" | "auto";
  /** Image type (defaults to image/jpeg) */
  type?: string;
}

/**
 * Preload critical images (like hero images) for faster LCP.
 * Uses <link rel="preload"> in the document head.
 * 
 * @example
 * <ImagePreload src={heroImage} fetchPriority="high" />
 */
export const ImagePreload = ({ 
  src, 
  fetchPriority = "high",
  type = "image/jpeg" 
}: ImagePreloadProps) => {
  if (!src) return null;

  return (
    <Helmet>
      <link
        rel="preload"
        as="image"
        href={src}
        type={type}
        // @ts-ignore - fetchpriority is valid but not in types
        fetchpriority={fetchPriority}
      />
    </Helmet>
  );
};

interface MultiImagePreloadProps {
  /** Array of image sources to preload */
  images: string[];
  /** Image type (defaults to image/jpeg) */
  type?: string;
}

/**
 * Preload multiple critical images.
 * Useful for carousels or image galleries above the fold.
 * 
 * @example
 * <MultiImagePreload images={[hero1, hero2, hero3]} />
 */
export const MultiImagePreload = ({ 
  images, 
  type = "image/jpeg" 
}: MultiImagePreloadProps) => {
  if (!images || images.length === 0) return null;

  return (
    <Helmet>
      {images.map((src, index) => (
        <link
          key={src}
          rel="preload"
          as="image"
          href={src}
          type={type}
          // @ts-ignore - fetchpriority is valid but not in types
          fetchpriority={index === 0 ? "high" : "low"}
        />
      ))}
    </Helmet>
  );
};
