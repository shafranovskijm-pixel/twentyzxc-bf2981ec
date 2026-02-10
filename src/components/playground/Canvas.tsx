import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PlaygroundBlock, ANIMATION_EFFECTS } from "@/data/playground-effects";
import { cn } from "@/lib/utils";
import { SortableBlock } from "./SortableBlock";
import { Trash2, Copy, ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CanvasProps {
  blocks: PlaygroundBlock[];
  settings: { backgroundColor: string; backgroundPattern?: string; globalFontFamily?: string; bgDecoration?: string; bgAnimation?: string };
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onReorder: (activeId: string, overId: string) => void;
  onDeleteBlock?: (id: string) => void;
  onDuplicateBlock?: (id: string) => void;
  onAddImageBlock?: (imageUrl: string) => void;
}

export const Canvas = ({ blocks, settings, selectedBlockId, onSelectBlock, onReorder, onDeleteBlock, onDuplicateBlock, onAddImageBlock }: CanvasProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

  const uploadToStorage = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage
      .from('playground-images')
      .upload(filePath, file, { cacheControl: '31536000', upsert: false });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('playground-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }, []);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!onAddImageBlock) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of imageFiles) {
        const url = await uploadToStorage(file);
        if (url) {
          onAddImageBlock(url);
        }
      }
    } finally {
      setIsUploading(false);
    }
  }, [onAddImageBlock, uploadToStorage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

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

    const style: React.CSSProperties = {
      backgroundColor: block.styles.backgroundColor,
      color: block.styles.textColor,
      padding: block.styles.padding,
      fontSize: block.styles.fontSize,
      borderRadius: block.styles.borderRadius,
      textAlign: block.styles.textAlign as React.CSSProperties['textAlign'],
      fontFamily: block.styles.fontFamily || settings.globalFontFamily || undefined,
      boxShadow: block.styles.boxShadow || undefined
    };

    // Gradient text style
    const textStyle = block.styles.gradientText ? {
      ...style,
      background: block.styles.gradientText,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    } as React.CSSProperties : style;

    const onClick = () => onSelectBlock(block.id);

    const wrapWithLink = (element: React.ReactNode) => {
      if (block.link) {
        return (
          <a href={block.link} target="_blank" rel="noopener noreferrer" className="block" onClick={(e) => { e.preventDefault(); onClick(); }}>
            {element}
          </a>
        );
      }
      return element;
    };

    switch (block.type) {
      case 'navbar': {
        const items = block.content.split('\n').filter(Boolean);
        return wrapWithLink(
          <motion.nav className={cn(baseClasses, "flex items-center justify-between flex-wrap gap-4")} style={{ ...style, textAlign: undefined }} onClick={onClick} {...animProps}>
            <div className="font-bold text-lg" style={{ color: block.styles.textColor }}>☰</div>
            <div className="flex items-center gap-6 flex-wrap">
              {items.map((item, i) => {
                const [label, href] = item.split('|').map(s => s.trim());
                return (
                  <span key={i} className="text-sm hover:opacity-80 cursor-pointer transition-opacity" style={{ color: block.styles.textColor }}>
                    {label}{href && <span className="text-[10px] text-muted-foreground ml-1">→{href}</span>}
                  </span>
                );
              })}
            </div>
          </motion.nav>
        );
      }
      case 'heading':
        return wrapWithLink(<motion.h2 className={cn(baseClasses, "font-bold")} style={textStyle} onClick={onClick} {...animProps}>{block.content}</motion.h2>);
      case 'text':
        return wrapWithLink(<motion.p className={baseClasses} style={style} onClick={onClick} {...animProps}>{block.content}</motion.p>);
      case 'button': {
        const btnStyle = block.buttonStyle || 'filled';
        const btnClass = cn(
          "px-6 py-3 font-medium hover:opacity-90 transition-opacity",
          btnStyle === 'filled' && "bg-primary text-primary-foreground",
          btnStyle === 'outline' && "bg-transparent border-2 border-current",
          btnStyle === 'gradient' && "bg-gradient-to-r from-primary to-accent text-primary-foreground",
          block.hoverEffect
        );
        return wrapWithLink(
          <motion.div className={cn(baseClasses, "inline-block")} style={{ textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }} onClick={onClick} {...animProps}>
            <button className={btnClass} style={{ fontSize: block.styles.fontSize, borderRadius: block.styles.borderRadius, color: btnStyle === 'outline' ? block.styles.textColor : undefined }}>
              {block.content}
            </button>
          </motion.div>
        );
      }
      case 'image': {
        const isFullWidth = block.styles.padding === '0px' && block.styles.borderRadius === '0px';
        return wrapWithLink(
          <motion.div className={baseClasses} style={{ 
            padding: isFullWidth ? 0 : block.styles.padding, 
            textAlign: block.styles.textAlign as React.CSSProperties['textAlign'],
            ...(isFullWidth ? { margin: '0 -24px', width: 'calc(100% + 48px)' } : {})
          }} onClick={onClick} {...animProps}>
            <img src={block.content} alt="Изображение" className="max-w-full h-auto w-full" style={{ borderRadius: isFullWidth ? 0 : block.styles.borderRadius }} />
          </motion.div>
        );
      }
      case 'divider':
        return (
          <motion.div className={cn(baseClasses, "py-4")} onClick={onClick} {...animProps}>
            <div className="h-px w-full" style={{ backgroundColor: block.styles.textColor || '#333' }} />
          </motion.div>
        );
      case 'card':
        return wrapWithLink(<motion.div className={cn(baseClasses, "border backdrop-blur-sm")} style={{ ...style, borderColor: block.styles.borderColor || 'rgba(255,255,255,0.1)', boxShadow: style.boxShadow || (style.backgroundColor && style.backgroundColor !== 'transparent' ? '0 4px 20px rgba(0,0,0,0.2)' : undefined) }} onClick={onClick} {...animProps}>{block.content}</motion.div>);
      case 'list': {
        const items = block.content.split('\n').filter(Boolean);
        return wrapWithLink(
          <motion.div className={baseClasses} style={style} onClick={onClick} {...animProps}>
            <ul className="list-disc list-inside space-y-1">
              {items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </motion.div>
        );
      }
      case 'quote': {
        const [text, author] = block.content.split('|');
        return wrapWithLink(
          <motion.blockquote className={cn(baseClasses, "border-l-4 border-primary/60 italic")} style={style} onClick={onClick} {...animProps}>
            <p className="mb-2">«{text}»</p>
            {author && <footer className="text-sm opacity-70 not-italic">— {author}</footer>}
          </motion.blockquote>
        );
      }
      case 'counter': {
        const [value, label] = block.content.split('|');
        return wrapWithLink(
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
      case 'footer': {
        const parts = block.content.split('|').filter(Boolean);
        return wrapWithLink(
          <motion.footer className={cn(baseClasses, "border-t border-border/30")} style={{ ...style, textAlign: undefined }} onClick={onClick} {...animProps}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
              <span style={{ color: block.styles.textColor }}>{parts[0]}</span>
              {parts.length > 1 && (
                <div className="flex items-center gap-4 opacity-70">
                  {parts.slice(1).map((p, i) => <span key={i}>{p}</span>)}
                </div>
              )}
            </div>
          </motion.footer>
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
      case 'columns': {
        const cols = block.content.split('||').filter(Boolean);
        return wrapWithLink(
          <motion.div className={cn(baseClasses, "grid gap-4")} style={{ ...style, gridTemplateColumns: `repeat(${Math.min(cols.length, 4)}, 1fr)` }} onClick={onClick} {...animProps}>
            {cols.map((col, i) => {
              const [title, desc] = col.split('|');
              return (
                <div key={i} className="p-4 rounded-lg border border-border/30 text-center">
                  <div className="font-semibold mb-1" style={{ color: block.styles.textColor }}>{title}</div>
                  {desc && <div className="text-sm opacity-70">{desc}</div>}
                </div>
              );
            })}
          </motion.div>
        );
      }
      case 'icon-text': {
        const [icon, title, desc] = block.content.split('|');
        return wrapWithLink(
          <motion.div className={cn(baseClasses, "flex items-center gap-4")} style={style} onClick={onClick} {...animProps}>
            <span className="text-4xl">{icon}</span>
            <div>
              <div className="font-semibold" style={{ color: block.styles.textColor }}>{title}</div>
              {desc && <div className="text-sm opacity-70">{desc}</div>}
            </div>
          </motion.div>
        );
      }
      case 'countdown': {
        const [dateStr, label] = block.content.split('|');
        return wrapWithLink(
          <motion.div className={cn(baseClasses, "text-center")} style={style} onClick={onClick} {...animProps}>
            <div className="text-3xl font-bold tracking-wider mb-1" style={{ color: block.styles.textColor }}>
              {dateStr || '00:00:00'}
            </div>
            {label && <div className="text-sm opacity-70">{label}</div>}
          </motion.div>
        );
      }
      case 'gallery': {
        const images = block.content.split('\n').filter(Boolean);
        return wrapWithLink(
          <motion.div className={cn(baseClasses, "grid grid-cols-2 sm:grid-cols-3 gap-2")} style={{ padding: block.styles.padding }} onClick={onClick} {...animProps}>
            {images.map((src, i) => (
              <img key={i} src={src} alt="" className="w-full h-auto object-cover" style={{ borderRadius: block.styles.borderRadius }} />
            ))}
          </motion.div>
        );
      }
      case 'socials': {
        const links = block.content.split('\n').filter(Boolean);
        const socialIcons: Record<string, string> = { telegram: '✈️', instagram: '📷', vk: '🔵', youtube: '▶️', tiktok: '🎵', twitter: '🐦', facebook: '📘', github: '🐱' };
        return wrapWithLink(
          <motion.div className={cn(baseClasses, "flex items-center justify-center gap-4")} style={style} onClick={onClick} {...animProps}>
            {links.map((line, i) => {
              const [platform, url] = line.split('|');
              return (
                <span key={i} className="text-2xl cursor-pointer hover:scale-110 transition-transform" title={platform}>
                  {socialIcons[platform.trim().toLowerCase()] || '🔗'}
                </span>
              );
            })}
          </motion.div>
        );
      }
      case 'form': {
        const parts = block.content.split('|');
        const [title, namePh, contactPh, messagePh, btnText] = parts;
        return (
          <motion.div className={cn(baseClasses, "border border-border/30")} style={style} onClick={onClick} {...animProps}>
            <div className="font-semibold mb-4 text-lg" style={{ color: block.styles.textColor }}>{title || 'Оставьте заявку'}</div>
            <div className="space-y-3">
              <div className="h-10 rounded-md bg-background/50 border border-border/40 px-3 flex items-center text-sm text-muted-foreground hover:border-border/60 transition-colors">{namePh || 'Имя'}</div>
              <div className="h-10 rounded-md bg-background/50 border border-border/40 px-3 flex items-center text-sm text-muted-foreground hover:border-border/60 transition-colors">{contactPh || 'Телефон или Email'}</div>
              <div className="h-20 rounded-md bg-background/50 border border-border/40 px-3 pt-2.5 text-sm text-muted-foreground hover:border-border/60 transition-colors">{messagePh || 'Сообщение'}</div>
              <div className="pt-1">
                <div className="bg-primary text-primary-foreground text-center py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">{btnText || 'Отправить'}</div>
              </div>
            </div>
          </motion.div>
        );
      }
      case 'accordion': {
        const items = block.content.split('\n').filter(Boolean);
        return wrapWithLink(
          <motion.div className={cn(baseClasses, "space-y-0")} style={style} onClick={onClick} {...animProps}>
            {items.map((item, i) => {
              const [q, a] = item.split('|');
              return (
                <div key={i} className="border-b border-border/30 py-3">
                  <div className="font-medium flex items-center justify-between cursor-pointer">
                    <span>{q}</span>
                    <span className="text-xs opacity-50">▼</span>
                  </div>
                  <div className="text-sm opacity-70 mt-2">{a}</div>
                </div>
              );
            })}
          </motion.div>
        );
      }
      case 'tabs': {
        const tabs = block.content.split('||').filter(Boolean);
        return wrapWithLink(
          <motion.div className={baseClasses} style={style} onClick={onClick} {...animProps}>
            <div className="flex gap-0 border-b border-border/30 mb-3">
              {tabs.map((tab, i) => {
                const [title] = tab.split('|');
                return (
                  <div key={i} className={cn("px-4 py-2 text-sm cursor-pointer", i === 0 ? "opacity-100 border-b-2 border-current" : "opacity-50")}>
                    {title}
                  </div>
                );
              })}
            </div>
            <div className="text-sm">{tabs[0]?.split('|')[1] || ''}</div>
          </motion.div>
        );
      }
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

  const decorationClass = settings.bgDecoration || 'none';
  const animationClass = settings.bgAnimation || 'none';

  return (
    <div
      className={cn(
        "min-h-[500px] rounded-lg border overflow-hidden relative transition-colors duration-200",
        isDragOver ? "border-primary border-2" : "border-border"
      )}
      style={getBackgroundStyle()}
      onClick={(e) => { if (e.target === e.currentTarget) onSelectBlock(null); }}
      onDrop={handleFileDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Background decorations */}
      {decorationClass === 'particles' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30 animate-pulse"
              style={{
                left: `${(i * 17 + 7) % 100}%`,
                top: `${(i * 23 + 11) % 100}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + (i % 3)}s`,
              }}
            />
          ))}
        </div>
      )}
      {decorationClass === 'glow' && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-primary/8 blur-[60px]" />
        </div>
      )}
      {decorationClass === 'corner-lines' && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-primary/30" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t border-r border-primary/30" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b border-l border-primary/30" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-primary/30" />
        </div>
      )}
      {decorationClass === 'vignette' && (
        <div className="absolute inset-0 pointer-events-none z-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)'
        }} />
      )}
      {decorationClass === 'noise' && (
        <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
      )}
      {decorationClass === 'stars' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                left: `${(i * 23 + 7) % 100}%`,
                top: `${(i * 31 + 13) % 100}%`,
                opacity: 0.15 + (i % 5) * 0.1,
              }}
            />
          ))}
        </div>
      )}
      {decorationClass === 'waves' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ height: '40%' }}>
            <path d="M0,120 C240,180 480,60 720,120 C960,180 1200,60 1440,120 L1440,200 L0,200 Z" fill="currentColor" className="text-primary" />
            <path d="M0,150 C240,100 480,180 720,130 C960,80 1200,160 1440,130 L1440,200 L0,200 Z" fill="currentColor" className="text-primary/50" />
          </svg>
        </div>
      )}
      {decorationClass === 'aurora' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-1/2 h-2/3 opacity-[0.08]" style={{
            background: 'linear-gradient(180deg, #22c55e 0%, #3b82f6 40%, #a855f7 70%, transparent 100%)',
            filter: 'blur(60px)',
            borderRadius: '50%',
          }} />
          <div className="absolute top-0 right-1/4 w-1/3 h-1/2 opacity-[0.06]" style={{
            background: 'linear-gradient(180deg, #06b6d4 0%, #8b5cf6 50%, transparent 100%)',
            filter: 'blur(50px)',
            borderRadius: '50%',
          }} />
        </div>
      )}

      {/* Background animations */}
      {animationClass === 'pulse-glow' && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-0"
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full m-auto w-3/4 h-3/4" />
        </motion.div>
      )}
      {animationClass === 'float-particles' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary/20"
              style={{ left: `${(i * 13 + 5) % 100}%` }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
              initial={{ top: `${(i * 19 + 15) % 80 + 10}%` }}
            />
          ))}
        </div>
      )}
      {animationClass === 'gradient-shift' && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-0 opacity-20"
          animate={{
            background: [
              'radial-gradient(circle at 20% 20%, hsl(var(--primary)) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 80%, hsl(var(--primary)) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, hsl(var(--primary)) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 20%, hsl(var(--primary)) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {animationClass === 'shimmer' && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {animationClass === 'starfield' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {Array.from({ length: 25 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                left: `${(i * 17 + 3) % 100}%`,
                top: `${(i * 29 + 7) % 100}%`,
              }}
              animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.4, 1] }}
              transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}
      {animationClass === 'wave-motion' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-15">
          <motion.svg
            className="absolute bottom-0 w-[200%]"
            viewBox="0 0 2880 200"
            preserveAspectRatio="none"
            style={{ height: '35%' }}
            animate={{ x: [0, -720] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <path d="M0,120 C240,180 480,60 720,120 C960,180 1200,60 1440,120 C1680,180 1920,60 2160,120 C2400,180 2640,60 2880,120 L2880,200 L0,200 Z" fill="currentColor" className="text-primary" />
          </motion.svg>
          <motion.svg
            className="absolute bottom-0 w-[200%]"
            viewBox="0 0 2880 200"
            preserveAspectRatio="none"
            style={{ height: '25%' }}
            animate={{ x: [-720, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            <path d="M0,150 C240,100 480,180 720,130 C960,80 1200,160 1440,130 C1680,80 1920,160 2160,130 C2400,80 2640,160 2880,130 L2880,200 L0,200 Z" fill="currentColor" className="text-primary/60" />
          </motion.svg>
        </div>
      )}
      {animationClass === 'aurora-glow' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <motion.div
            className="absolute top-0 left-1/4 w-1/2 h-2/3"
            style={{ background: 'linear-gradient(180deg, #22c55e 0%, #3b82f6 40%, #a855f7 70%, transparent 100%)', filter: 'blur(60px)', borderRadius: '50%' }}
            animate={{ opacity: [0.05, 0.12, 0.05], x: [0, 40, -30, 0], scaleX: [1, 1.2, 0.9, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-0 right-1/4 w-1/3 h-1/2"
            style={{ background: 'linear-gradient(180deg, #06b6d4 0%, #8b5cf6 50%, transparent 100%)', filter: 'blur(50px)', borderRadius: '50%' }}
            animate={{ opacity: [0.04, 0.1, 0.04], x: [0, -30, 20, 0], scaleX: [1, 0.9, 1.15, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>
      )}
      {/* Drop / upload overlay */}
      {(isDragOver || isUploading) && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-primary">
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin" />
                <span className="text-lg font-medium">Загрузка изображений...</span>
              </>
            ) : (
              <>
                <ImagePlus className="w-12 h-12" />
                <span className="text-lg font-medium">Перетащите изображения сюда</span>
              </>
            )}
          </div>
        </div>
      )}
      <div className="p-6 space-y-4">
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
            <p className="text-center">
              Добавьте блоки из панели слева
              <br />
              <span className="text-sm opacity-60">Перетаскивайте блоки для изменения порядка</span>
              <br />
              <span className="text-sm opacity-60">или перетащите изображения прямо сюда</span>
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.filter(b => !b.hidden).map(b => b.id)} strategy={verticalListSortingStrategy}>
              {(() => {
                const visibleBlocks = blocks.filter(b => !b.hidden);
                const groupableTypes = ['counter', 'icon-text'];
                const elements: React.ReactNode[] = [];
                let i = 0;
                while (i < visibleBlocks.length) {
                  const block = visibleBlocks[i];
                  if (groupableTypes.includes(block.type)) {
                    // Collect consecutive blocks of same type
                    const group: PlaygroundBlock[] = [block];
                    let j = i + 1;
                    while (j < visibleBlocks.length && visibleBlocks[j].type === block.type) {
                      group.push(visibleBlocks[j]);
                      j++;
                    }
                    if (group.length >= 2) {
                      const cols = Math.min(group.length, 4);
                      const gridClass = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4';
                      elements.push(
                        <div key={`group-${group[0].id}`} className={`grid ${gridClass} gap-4`}>
                          {group.map(gb => (
                            <SortableBlock key={gb.id} id={gb.id} isSelected={gb.id === selectedBlockId}>
                              <div className="relative group/block" id={gb.anchorId || undefined}>
                                {renderBlockContent(gb)}
                                {(onDeleteBlock || onDuplicateBlock) && (
                                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
                                    {onDuplicateBlock && (
                                      <button onClick={(e) => { e.stopPropagation(); onDuplicateBlock(gb.id); }} className="p-1.5 rounded bg-secondary/90 border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Дублировать (Ctrl+D)">
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {onDeleteBlock && (
                                      <button onClick={(e) => { e.stopPropagation(); onDeleteBlock(gb.id); }} className="p-1.5 rounded bg-destructive/90 border border-destructive hover:bg-destructive text-destructive-foreground transition-colors" title="Удалить (Delete)">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </SortableBlock>
                          ))}
                        </div>
                      );
                      i = j;
                      continue;
                    }
                  }
                  // Single block render
                  elements.push(
                    <SortableBlock key={block.id} id={block.id} isSelected={block.id === selectedBlockId}>
                      <div className="relative group/block" id={block.anchorId || undefined}>
                        {renderBlockContent(block)}
                        {(onDeleteBlock || onDuplicateBlock) && (
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
                            {onDuplicateBlock && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onDuplicateBlock(block.id); }}
                                className="p-1.5 rounded bg-secondary/90 border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                title="Дублировать (Ctrl+D)"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteBlock && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                                className="p-1.5 rounded bg-destructive/90 border border-destructive hover:bg-destructive text-destructive-foreground transition-colors"
                                title="Удалить (Delete)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </SortableBlock>
                  );
                  i++;
                }
                return elements;
              })()}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
