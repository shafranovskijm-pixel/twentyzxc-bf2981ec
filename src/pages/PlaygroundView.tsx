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
    const isGradient = project.settings.backgroundColor.startsWith('linear-gradient');
    const base: React.CSSProperties = isGradient
      ? { background: project.settings.backgroundColor, minHeight: '100vh' }
      : { backgroundColor: project.settings.backgroundColor, minHeight: '100vh' };
    const pattern = project.settings.backgroundPattern || 'none';
    if (pattern === 'dots') return { ...base, backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`, backgroundSize: '20px 20px' };
    if (pattern === 'grid') return { ...base, backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '20px 20px' };
    if (pattern === 'diagonal') return { ...base, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px)` };
    if (pattern === 'cross') return { ...base, backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px), radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`, backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' };
    return base;
  };

  const wrapWithLink = (block: PlaygroundBlock, element: React.ReactNode) => {
    if (block.link) return <a href={block.link} target="_blank" rel="noopener noreferrer" className="block">{element}</a>;
    return element;
  };

  const renderBlock = (block: PlaygroundBlock, index: number) => {
    const animProps = getAnimationProps(block.animation);
    const delay = index * 0.1;
    const style: React.CSSProperties = {
      backgroundColor: block.styles.backgroundColor,
      color: block.styles.textColor,
      padding: block.styles.padding,
      fontSize: block.styles.fontSize,
      borderRadius: block.styles.borderRadius,
      textAlign: block.styles.textAlign as React.CSSProperties['textAlign'],
      fontFamily: block.styles.fontFamily || project?.settings.globalFontFamily || undefined,
      boxShadow: block.styles.boxShadow || undefined
    };
    const textStyle = block.styles.gradientText ? {
      ...style,
      background: block.styles.gradientText,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    } as React.CSSProperties : style;
    const mp = { ...animProps, transition: { ...((animProps as any).transition || {}), delay } };

    const blockWrapper = (block: PlaygroundBlock, element: React.ReactNode) => {
      const wrapped = block.anchorId ? <div id={block.anchorId}>{element}</div> : element;
      return wrapped;
    };

    switch (block.type) {
      case 'navbar': {
        const items = block.content.split('\n').filter(Boolean);
        return wrapWithLink(block,
          <motion.nav key={block.id} className={cn("flex items-center justify-between flex-wrap gap-4 sticky top-0 z-50", block.hoverEffect)} style={{ ...style, textAlign: undefined }} {...mp}>
            <div className="font-bold text-lg" style={{ color: block.styles.textColor }}>☰</div>
            <div className="flex items-center gap-6 flex-wrap">
              {items.map((item, i) => {
                const [label, href] = item.split('|').map(s => s.trim());
                if (href) {
                  const isAnchor = href.startsWith('#');
                  return (
                    <a
                      key={i}
                      href={href}
                      {...(isAnchor ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                      className="text-sm hover:opacity-80 cursor-pointer transition-opacity no-underline"
                      style={{ color: block.styles.textColor }}
                      onClick={isAnchor ? (e) => {
                        e.preventDefault();
                        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                      } : undefined}
                    >
                      {label}
                    </a>
                  );
                }
                return <span key={i} className="text-sm hover:opacity-80 cursor-pointer transition-opacity" style={{ color: block.styles.textColor }}>{label}</span>;
              })}
            </div>
          </motion.nav>
        );
      }
      case 'heading':
        return wrapWithLink(block, <motion.h2 key={block.id} className={cn("font-bold", block.hoverEffect)} style={textStyle} {...mp}>{block.content}</motion.h2>);
      case 'text':
        return wrapWithLink(block, <motion.p key={block.id} className={block.hoverEffect} style={style} {...mp}>{block.content}</motion.p>);
      case 'button': {
        const bs = block.buttonStyle || 'filled';
        const btnCls = cn(
          "px-6 py-3 font-medium hover:opacity-90 transition-opacity",
          bs === 'filled' && "bg-primary text-primary-foreground",
          bs === 'outline' && "bg-transparent border-2 border-current",
          bs === 'gradient' && "bg-gradient-to-r from-primary to-accent text-primary-foreground",
          block.hoverEffect
        );
        return wrapWithLink(block,
          <motion.div key={block.id} style={{ textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }} {...mp}>
            <button className={btnCls} style={{ fontSize: block.styles.fontSize, borderRadius: block.styles.borderRadius, color: bs === 'outline' ? block.styles.textColor : undefined }}>{block.content}</button>
          </motion.div>
        );
      }
      case 'image':
        return wrapWithLink(block,
          <motion.div key={block.id} className={block.hoverEffect} style={{ padding: block.styles.padding, textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }} {...mp}>
            <img src={block.content} alt="" className="max-w-full h-auto" style={{ borderRadius: block.styles.borderRadius }} />
          </motion.div>
        );
      case 'columns': {
        const cols = block.content.split('||').filter(Boolean);
        return wrapWithLink(block,
          <motion.div key={block.id} className={cn("grid gap-4", block.hoverEffect)} style={{ ...style, gridTemplateColumns: `repeat(${Math.min(cols.length, 4)}, 1fr)` }} {...mp}>
            {cols.map((col, i) => {
              const [title, desc] = col.split('|');
              return <div key={i} className="p-4 rounded-lg border border-border/30 text-center"><div className="font-semibold mb-1" style={{ color: block.styles.textColor }}>{title}</div>{desc && <div className="text-sm opacity-70">{desc}</div>}</div>;
            })}
          </motion.div>
        );
      }
      case 'icon-text': {
        const [icon, title, desc] = block.content.split('|');
        return wrapWithLink(block,
          <motion.div key={block.id} className={cn("flex items-center gap-4", block.hoverEffect)} style={style} {...mp}>
            <span className="text-4xl">{icon}</span>
            <div><div className="font-semibold" style={{ color: block.styles.textColor }}>{title}</div>{desc && <div className="text-sm opacity-70">{desc}</div>}</div>
          </motion.div>
        );
      }
      case 'list': {
        const items = block.content.split('\n').filter(Boolean);
        return wrapWithLink(block,
          <motion.div key={block.id} className={block.hoverEffect} style={style} {...mp}>
            <ul className="list-disc list-inside space-y-1">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </motion.div>
        );
      }
      case 'quote': {
        const [text, author] = block.content.split('|');
        return wrapWithLink(block,
          <motion.blockquote key={block.id} className={cn("border-l-4 border-primary/60 italic", block.hoverEffect)} style={style} {...mp}>
            <p className="mb-2">«{text}»</p>
            {author && <footer className="text-sm opacity-70 not-italic">— {author}</footer>}
          </motion.blockquote>
        );
      }
      case 'counter': {
        const [value, label] = block.content.split('|');
        return wrapWithLink(block,
          <motion.div key={block.id} className={cn("text-center", block.hoverEffect)} style={style} {...mp}>
            <div className="text-4xl font-bold mb-1" style={{ color: block.styles.textColor }}>{value}</div>
            {label && <div className="text-sm opacity-70">{label}</div>}
          </motion.div>
        );
      }
      case 'countdown': {
        const [dateStr, label] = block.content.split('|');
        return wrapWithLink(block,
          <motion.div key={block.id} className={cn("text-center", block.hoverEffect)} style={style} {...mp}>
            <div className="text-3xl font-bold tracking-wider mb-1" style={{ color: block.styles.textColor }}>{dateStr || '00:00:00'}</div>
            {label && <div className="text-sm opacity-70">{label}</div>}
          </motion.div>
        );
      }
      case 'gallery': {
        const images = block.content.split('\n').filter(Boolean);
        return wrapWithLink(block,
          <motion.div key={block.id} className={cn("grid grid-cols-2 sm:grid-cols-3 gap-2", block.hoverEffect)} style={{ padding: block.styles.padding }} {...mp}>
            {images.map((src, i) => <img key={i} src={src} alt="" className="w-full h-auto object-cover" style={{ borderRadius: block.styles.borderRadius }} />)}
          </motion.div>
        );
      }
      case 'video':
        return (
          <motion.div key={block.id} className={block.hoverEffect} style={{ padding: block.styles.padding, textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }} {...mp}>
            <div className="relative w-full" style={{ paddingBottom: '56.25%', borderRadius: block.styles.borderRadius, overflow: 'hidden' }}>
              <iframe src={block.content} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </motion.div>
        );
      case 'socials': {
        const links = block.content.split('\n').filter(Boolean);
        const socialIcons: Record<string, string> = { telegram: '✈️', instagram: '📷', vk: '🔵', youtube: '▶️', tiktok: '🎵', twitter: '🐦', facebook: '📘', github: '🐱' };
        return wrapWithLink(block,
          <motion.div key={block.id} className={cn("flex items-center justify-center gap-4", block.hoverEffect)} style={style} {...mp}>
            {links.map((line, i) => {
              const [platform, url] = line.split('|');
              return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-2xl hover:scale-110 transition-transform" title={platform}>{socialIcons[platform.trim().toLowerCase()] || '🔗'}</a>;
            })}
          </motion.div>
        );
      }
      case 'footer': {
        const parts = block.content.split('|').filter(Boolean);
        return wrapWithLink(block,
          <motion.footer key={block.id} className={cn("border-t border-border/30", block.hoverEffect)} style={{ ...style, textAlign: undefined }} {...mp}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
              <span style={{ color: block.styles.textColor }}>{parts[0]}</span>
              {parts.length > 1 && <div className="flex items-center gap-4 opacity-70">{parts.slice(1).map((p, i) => <span key={i}>{p}</span>)}</div>}
            </div>
          </motion.footer>
        );
      }
      case 'divider':
        return <motion.div key={block.id} className="py-4" {...mp}><div className="h-px w-full" style={{ backgroundColor: block.styles.textColor || '#333' }} /></motion.div>;
      case 'card':
        return wrapWithLink(block, <motion.div key={block.id} className={cn("border border-border", block.hoverEffect)} style={style} {...mp}>{block.content}</motion.div>);
      case 'spacer':
        return <motion.div key={block.id} style={{ padding: block.styles.padding }} {...mp} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
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
      <Helmet><title>{project.title} | 24ZXC Playground</title></Helmet>
      <div style={getBackgroundStyle()}>
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {project.blocks.map((block, index) => {
            const rendered = renderBlock(block, index);
            if (!rendered) return null;
            return block.anchorId && block.type !== 'navbar'
              ? <div key={block.id} id={block.anchorId}>{rendered}</div>
              : <div key={block.id}>{rendered}</div>;
          })}
        </div>
      </div>
    </>
  );
};

export default PlaygroundView;
