import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PlaygroundBlock, PlaygroundSettings, ANIMATION_EFFECTS } from "@/data/playground-effects";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ProjectData {
  title: string;
  blocks: PlaygroundBlock[];
  settings: PlaygroundSettings;
}

const PlaygroundView = () => {
  const { slug } = useParams();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from("playground_projects")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) throw error;

        setProject({
          title: data.title,
          blocks: data.blocks as unknown as PlaygroundBlock[],
          settings: data.settings as unknown as PlaygroundSettings
        });
      } catch (err) {
        setError("Проект не найден");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  const getAnimationProps = (animationId?: string) => {
    if (!animationId) return {};
    const effect = ANIMATION_EFFECTS.find(e => e.id === animationId);
    return effect?.framerProps || {};
  };

  const getBackgroundStyle = () => {
    if (!project) return {};
    
    const base: React.CSSProperties = {
      backgroundColor: project.settings.backgroundColor,
      minHeight: '100vh'
    };
    
    if (project.settings.backgroundPattern === 'dots') {
      return {
        ...base,
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      };
    }
    
    if (project.settings.backgroundPattern === 'grid') {
      return {
        ...base,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      };
    }
    
    return base;
  };

  const renderBlock = (block: PlaygroundBlock, index: number) => {
    const animProps = getAnimationProps(block.animation);
    const delay = index * 0.1;
    
    const style = {
      backgroundColor: block.styles.backgroundColor,
      color: block.styles.textColor,
      padding: block.styles.padding,
      fontSize: block.styles.fontSize,
      borderRadius: block.styles.borderRadius,
      textAlign: block.styles.textAlign as React.CSSProperties['textAlign']
    };

    const motionProps = {
      ...animProps,
      transition: { ...((animProps as any).transition || {}), delay }
    };

    switch (block.type) {
      case 'heading':
        return (
          <motion.h2
            key={block.id}
            className={cn("font-bold", block.hoverEffect)}
            style={style}
            {...motionProps}
          >
            {block.content}
          </motion.h2>
        );
      
      case 'text':
        return (
          <motion.p
            key={block.id}
            className={block.hoverEffect}
            style={style}
            {...motionProps}
          >
            {block.content}
          </motion.p>
        );
      
      case 'button':
        return (
          <motion.div
            key={block.id}
            style={{ textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }}
            {...motionProps}
          >
            <button
              className={cn(
                "px-6 py-3 bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity",
                block.hoverEffect
              )}
              style={{ 
                fontSize: block.styles.fontSize,
                borderRadius: block.styles.borderRadius 
              }}
            >
              {block.content}
            </button>
          </motion.div>
        );
      
      case 'image':
        return (
          <motion.div
            key={block.id}
            className={block.hoverEffect}
            style={{ padding: block.styles.padding, textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }}
            {...motionProps}
          >
            <img
              src={block.content}
              alt=""
              className="max-w-full h-auto"
              style={{ borderRadius: block.styles.borderRadius }}
            />
          </motion.div>
        );
      
      case 'divider':
        return (
          <motion.div
            key={block.id}
            className="py-4"
            {...motionProps}
          >
            <div 
              className="h-px w-full"
              style={{ backgroundColor: block.styles.textColor || '#333' }}
            />
          </motion.div>
        );
      
      case 'card':
        return (
          <motion.div
            key={block.id}
            className={cn("border border-border", block.hoverEffect)}
            style={style}
            {...motionProps}
          >
            {block.content}
          </motion.div>
        );
      
      case 'spacer':
        return (
          <motion.div
            key={block.id}
            style={{ padding: block.styles.padding }}
            {...motionProps}
          />
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground">{error || "Проект не найден"}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{project.title} | 24ZXC Playground</title>
      </Helmet>

      <div style={getBackgroundStyle()}>
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {project.blocks.map((block, index) => renderBlock(block, index))}
        </div>
      </div>
    </>
  );
};

export default PlaygroundView;
