import { motion } from "framer-motion";
import { PlaygroundBlock, ANIMATION_EFFECTS } from "@/data/playground-effects";
import { cn } from "@/lib/utils";

interface CanvasProps {
  blocks: PlaygroundBlock[];
  settings: { backgroundColor: string; backgroundPattern?: string };
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}

export const Canvas = ({ blocks, settings, selectedBlockId, onSelectBlock }: CanvasProps) => {
  const getAnimationProps = (animationId?: string) => {
    if (!animationId) return {};
    const effect = ANIMATION_EFFECTS.find(e => e.id === animationId);
    return effect?.framerProps || {};
  };

  const renderBlock = (block: PlaygroundBlock) => {
    const isSelected = block.id === selectedBlockId;
    const animProps = getAnimationProps(block.animation);
    
    const baseClasses = cn(
      "cursor-pointer transition-all duration-200",
      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      block.hoverEffect
    );

    const style = {
      backgroundColor: block.styles.backgroundColor,
      color: block.styles.textColor,
      padding: block.styles.padding,
      fontSize: block.styles.fontSize,
      borderRadius: block.styles.borderRadius,
      textAlign: block.styles.textAlign as React.CSSProperties['textAlign']
    };

    switch (block.type) {
      case 'heading':
        return (
          <motion.h2
            key={block.id}
            className={cn(baseClasses, "font-bold")}
            style={style}
            onClick={() => onSelectBlock(block.id)}
            {...animProps}
          >
            {block.content}
          </motion.h2>
        );
      
      case 'text':
        return (
          <motion.p
            key={block.id}
            className={baseClasses}
            style={style}
            onClick={() => onSelectBlock(block.id)}
            {...animProps}
          >
            {block.content}
          </motion.p>
        );
      
      case 'button':
        return (
          <motion.div
            key={block.id}
            className={cn(baseClasses, "inline-block")}
            style={{ textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }}
            onClick={() => onSelectBlock(block.id)}
            {...animProps}
          >
            <button
              className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity"
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
            className={baseClasses}
            style={{ padding: block.styles.padding, textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }}
            onClick={() => onSelectBlock(block.id)}
            {...animProps}
          >
            <img
              src={block.content}
              alt="Изображение"
              className="max-w-full h-auto"
              style={{ borderRadius: block.styles.borderRadius }}
            />
          </motion.div>
        );
      
      case 'divider':
        return (
          <motion.div
            key={block.id}
            className={cn(baseClasses, "py-4")}
            onClick={() => onSelectBlock(block.id)}
            {...animProps}
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
            className={cn(baseClasses, "border border-border")}
            style={style}
            onClick={() => onSelectBlock(block.id)}
            {...animProps}
          >
            {block.content}
          </motion.div>
        );
      
      case 'spacer':
        return (
          <motion.div
            key={block.id}
            className={cn(baseClasses, "min-h-[40px]")}
            style={{ padding: block.styles.padding }}
            onClick={() => onSelectBlock(block.id)}
            {...animProps}
          >
            {isSelected && (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-muted-foreground/30 rounded">
                Отступ
              </div>
            )}
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  const getBackgroundStyle = () => {
    const base: React.CSSProperties = {
      backgroundColor: settings.backgroundColor
    };
    
    if (settings.backgroundPattern === 'dots') {
      return {
        ...base,
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      };
    }
    
    if (settings.backgroundPattern === 'grid') {
      return {
        ...base,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      };
    }
    
    return base;
  };

  return (
    <div 
      className="min-h-[500px] rounded-lg border border-border overflow-hidden"
      style={getBackgroundStyle()}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelectBlock(null);
        }
      }}
    >
      <div className="p-6 space-y-4">
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
            <p className="text-center">
              Добавьте блоки из панели слева
              <br />
              <span className="text-sm opacity-60">Нажмите на блок для редактирования</span>
            </p>
          </div>
        ) : (
          blocks.map(renderBlock)
        )}
      </div>
    </div>
  );
};
