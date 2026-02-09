import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TemplateImage {
  id: string;
  url: string | undefined;
  loading: boolean;
  error: boolean;
}

interface UseTemplateImagesResult {
  images: Record<string, TemplateImage>;
  getImageUrl: (imageId: string) => string | undefined;
  isLoading: (imageId: string) => boolean;
  generateImage: (imageId: string) => Promise<string | undefined>;
  generateAllImages: () => Promise<void>;
}

const STORAGE_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/template-images`;

export const useTemplateImages = (templateId: string): UseTemplateImagesResult => {
  const [images, setImages] = useState<Record<string, TemplateImage>>({});

  // Check which images already exist in storage
  useEffect(() => {
    const checkExistingImages = async () => {
      try {
        const { data: files, error } = await supabase.storage
          .from("template-images")
          .list(templateId);

        if (error) {
          console.error("Error listing images:", error);
          return;
        }

        if (files && files.length > 0) {
          const existingImages: Record<string, TemplateImage> = {};
          
          files.forEach((file) => {
            const imageId = file.name.replace(".png", "");
            existingImages[imageId] = {
              id: imageId,
              url: `${STORAGE_BASE_URL}/${templateId}/${file.name}`,
              loading: false,
              error: false,
            };
          });

          setImages(existingImages);
        }
      } catch (error) {
        console.error("Error checking existing images:", error);
      }
    };

    if (templateId) {
      checkExistingImages();
    }
  }, [templateId]);

  const getImageUrl = useCallback(
    (imageId: string): string | undefined => {
      return images[imageId]?.url;
    },
    [images]
  );

  const isLoading = useCallback(
    (imageId: string): boolean => {
      return images[imageId]?.loading ?? false;
    },
    [images]
  );

  const generateImage = useCallback(
    async (imageId: string): Promise<string | undefined> => {
      // Mark as loading
      setImages((prev) => ({
        ...prev,
        [imageId]: { id: imageId, url: undefined, loading: true, error: false },
      }));

      try {
        const { data, error } = await supabase.functions.invoke("generate-template-images", {
          body: { templateId, imageId },
        });

        if (error) {
          throw error;
        }

        const url = data?.url;
        
        setImages((prev) => ({
          ...prev,
          [imageId]: { id: imageId, url, loading: false, error: !url },
        }));

        return url;
      } catch (error) {
        console.error("Error generating image:", error);
        setImages((prev) => ({
          ...prev,
          [imageId]: { id: imageId, url: undefined, loading: false, error: true },
        }));
        return undefined;
      }
    },
    [templateId]
  );

  const generateAllImages = useCallback(async () => {
    // Fetch template config to know which images to generate
    try {
      const { data, error } = await supabase.functions.invoke("generate-template-images", {
        body: {},
      });

      if (error) {
        throw error;
      }

      const config = data?.configs?.[templateId];
      if (!config) {
        console.warn("No config found for template:", templateId);
        return;
      }

      // Generate images sequentially to avoid rate limiting
      for (const imageConfig of config.images) {
        if (!images[imageConfig.id]?.url) {
          await generateImage(imageConfig.id);
          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error("Error generating all images:", error);
    }
  }, [templateId, images, generateImage]);

  return {
    images,
    getImageUrl,
    isLoading,
    generateImage,
    generateAllImages,
  };
};

// Static URLs for templates that already have images
export const getStaticTemplateImageUrl = (templateId: string, imageId: string): string => {
  return `${STORAGE_BASE_URL}/${templateId}/${imageId}.png`;
};

// Template image configurations for reference
export const templateImageIds: Record<string, string[]> = {
  "marble-gold": ["portfolio-1", "portfolio-2", "portfolio-3", "portfolio-4", "portfolio-5", "portfolio-6", "team-1", "team-2", "team-3", "team-4"],
  "luxe-boutique": ["hero", "product-1", "product-2", "product-3", "product-4", "product-5", "product-6"],
  "artisan-market": ["product-1", "product-2", "product-3", "product-4", "product-5", "product-6", "artisan-1", "artisan-2", "artisan-3"],
  "executive-suite": ["team-1", "team-2", "team-3", "team-4", "service-1", "service-2", "service-3"],
  "noir-elegance": ["hero", "project-1", "project-2", "project-3"],
  "golden-prestige": ["hero", "service-1", "service-2", "service-3"],
  "crystal-vision": ["hero", "project-1", "project-2", "project-3"],
  "tech-horizon": ["project-1", "project-2", "project-3", "team-1", "team-2", "team-3"],
  "premium-gallery": ["gallery-1", "gallery-2", "gallery-3", "gallery-4", "gallery-5", "gallery-6"],
  "dashboard-pro": ["avatar-1", "avatar-2", "avatar-3"],
  "crm-elite": ["avatar-1", "avatar-2", "avatar-3"],
  "platform-x": ["feature-1", "feature-2"],
};
