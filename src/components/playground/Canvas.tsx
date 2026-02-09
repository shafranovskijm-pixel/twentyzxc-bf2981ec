import { motion } from "framer-motion";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PlaygroundBlock, ANIMATION_EFFECTS } from "@/data/playground-effects";
import { cn } from "@/lib/utils";
import { SortableBlock } from "./SortableBlock";

interface CanvasProps {
  blocks: PlaygroundBlock[];
  settings: { backgroundColor: string; backgroundPattern?: string };
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onReorder: (activeId: string, overId: string) => void;
}

export const Canvas = ({ blocks, settings, selectedBlockId, onSelectBlock, onReorder }: CanvasProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

  const getAnimationProps = (animationId?: string) => {
    if (!animationId) return {};
    const effect = ANIMATION_EFFECTS.find(e => e.id === animationId);
    return effect?.framerProps || {};
  };

  const renderBlockContent = (block: PlaygroundBlock) => {
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

    const onClick = () => onSelectBlock(block.id);

    switch (block.type) {
      case 'heading':
        return <motion.h2 className={cn(baseClasses, "font-bold")} style={style} onClick={onClick} {...animProps}>{block.content}</motion.h2>;
      case 'text':
        return <motion.p className={baseClasses} style={style} onClick={onClick} {...animProps}>{block.content}</motion.p>;
      case 'button':
        return (
          <motion.div className={cn(baseClasses, "inline-block")} style={{ textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }} onClick={onClick} {...animProps}>
            <button className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition-opacity" style={{ fontSize: block.styles.fontSize, borderRadius: block.styles.borderRadius }}>
              {block.content}
            </button>
          </motion.div>
        );
      case 'image':
        return (
          <motion.div className={baseClasses} style={{ padding: block.styles.padding, textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }} onClick={onClick} {...animProps}>
            <img src={block.content} alt="Изображение" className="max-w-full h-auto" style={{ borderRadius: block.styles.borderRadius }} />
          </motion.div>
        );
      case 'divider':
        return (
          <motion.div className={cn(baseClasses, "py-4")} onClick={onClick} {...animProps}>
            <div className="h-px w-full" style={{ backgroundColor: block.styles.textColor || '#333' }} />
          </motion.div>
        );
      case 'card':
        return <motion.div className={cn(baseClasses, "border border-border")} style={style} onClick={onClick} {...animProps}>{block.content}</motion.div>;
      case 'list': {
        const items = block.content.split('\n').filter(Boolean);
        return (
          <motion.div className={baseClasses} style={style} onClick={onClick} {...animProps}>
            <ul className="list-disc list-inside space-y-1">
              {items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </motion.div>
        );
      }
      case 'quote': {
        const [text, author] = block.content.split('|');
        return (
          <motion.blockquote className={cn(baseClasses, "border-l-4 border-primary/60 italic")} style={style} onClick={onClick} {...animProps}>
            <p className="mb-2">«{text}»</p>
            {author && <footer className="text-sm opacity-70 not-italic">— {author}</footer>}
          </motion.blockquote>
        );
      }
      case 'counter': {
        const [value, label] = block.content.split('|');
        return (
          <motion.div className={cn(baseClasses, "text-center")} style={style} onClick={onClick} {...animProps}>
            <div className="text-4xl font-bold mb-1" style={{ color: block.styles.textColor }}>{value}</div>
            {label && <div className="text-sm opacity-70">{label}</div>}
          </motion.div>
        );
      }
      case 'video': {
        const src = block.content;
        return (
          <motion.div className={baseClasses} style={{ padding: block.styles.padding, textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }} onClick={onClick} {...animProps}>
            <div className="relative w-full" style={{ paddingBottom: '56.25%', borderRadius: block.styles.borderRadius, overflow: 'hidden' }}>
              <iframe
                src={src}
                className="absolute inset-0 w-full h-full pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        );
      }
      case 'spacer':
        return (
          <motion.div className={cn(baseClasses, "min-h-[40px]")} style={{ padding: block.styles.padding }} onClick={onClick} {...animProps}>
            {isSelected && (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-muted-foreground/30 rounded">Отступ</div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  const getBackgroundStyle = () => {
    const isGradient = settings.backgroundColor.startsWith('linear-gradient');
    const base: React.CSSProperties = isGradient
      ? { background: settings.backgroundColor }
      : { backgroundColor: settings.backgroundColor };

    const pattern = settings.backgroundPattern || 'none';
    if (pattern === 'dots') {
      return { ...base, backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`, backgroundSize: '20px 20px' };
    }
    if (pattern === 'grid') {
      return { ...base, backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '20px 20px' };
    }
    if (pattern === 'diagonal') {
      return { ...base, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px)` };
    }
    if (pattern === 'cross') {
      return { ...base, backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`, backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' };
    }
    return base;
  };

  return (
    <div
      className="min-h-[500px] rounded-lg border border-border overflow-hidden"
      style={getBackgroundStyle()}
      onClick={(e) => { if (e.target === e.currentTarget) onSelectBlock(null); }}
    >
      <div className="p-6 space-y-4">
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
            <p className="text-center">
              Добавьте блоки из панели слева
              <br />
              <span className="text-sm opacity-60">Перетаскивайте блоки для изменения порядка</span>
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map(block => (
                <SortableBlock key={block.id} id={block.id} isSelected={block.id === selectedBlockId}>
                  {renderBlockContent(block)}
                </SortableBlock>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
