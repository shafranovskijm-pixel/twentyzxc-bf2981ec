import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PlaygroundBlock, PlaygroundSettings, ANIMATION_EFFECTS } from "@/data/playground-effects";
import { cn } from "@/lib/utils";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { isLucideIcon, getLucideIconName, LucideIconByName } from "@/components/playground/LucideIconPicker";
import { toast } from "sonner";

interface ProjectData {
  title: string;
  blocks: PlaygroundBlock[];
  settings: PlaygroundSettings;
}
const FormBlock = ({ block, slug, style, mp }: { block: PlaygroundBlock; slug: string; style: React.CSSProperties; mp: any }) => {
  const [formData, setFormData] = useState({ name: '', contact: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const parts = block.content.split('|');
  const [title, namePh, contactPh, messagePh, btnText] = parts;
  const showMessage = parts.length < 6 || parts[5] !== 'hide-message';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('playground-form-submit', {
        body: { slug, name: formData.name, contact: formData.contact, message: formData.message },
      });
      if (error) throw error;
      setSent(true);
      toast.success('Заявка отправлена!');
    } catch {
      toast.error('Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <motion.div className={cn("text-center", block.hoverEffect)} style={style} {...mp}>
        <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
        <p className="font-semibold">Спасибо!</p>
        <p className="text-sm opacity-70">Ваша заявка отправлена</p>
      </motion.div>
    );
  }

  return (
    <motion.div className={cn("border border-border/30", block.hoverEffect)} style={style} {...mp}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="font-semibold mb-3" style={{ color: block.styles.textColor }}>{title || 'Оставьте заявку'}</div>
        <input
          className="w-full h-10 rounded-md border border-border/40 bg-background/50 px-3 text-sm"
          placeholder={namePh || 'Имя'}
          value={formData.name}
          onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
          required
        />
        <input
          className="w-full h-10 rounded-md border border-border/40 bg-background/50 px-3 text-sm"
          placeholder={contactPh || 'Телефон или Email'}
          value={formData.contact}
          onChange={(e) => setFormData(p => ({ ...p, contact: e.target.value }))}
          required
        />
        {showMessage && (
          <textarea
            className="w-full h-20 rounded-md border border-border/40 bg-background/50 px-3 py-2 text-sm resize-none"
            placeholder={messagePh || 'Сообщение'}
            value={formData.message}
            onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
          />
        )}
        <button
          type="submit"
          disabled={sending}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {btnText || 'Отправить'}
        </button>
      </form>
    </motion.div>
  );
};

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
        const [logoItem, ...menuItems] = items;
        const [logoLabel] = (logoItem || '').split('|').map(s => s.trim());
        return wrapWithLink(block,
          <motion.nav key={block.id} className={cn("flex items-center justify-between flex-wrap gap-4 sticky top-0 z-50 backdrop-blur-md", block.hoverEffect)} style={{ ...style, textAlign: undefined, backgroundColor: style.backgroundColor || 'rgba(0,0,0,0.5)' }} {...mp}>
            <div className="font-bold text-lg tracking-tight" style={{ color: block.styles.textColor }}>{logoLabel || '☰'}</div>
            <div className="flex items-center gap-6 flex-wrap">
              {menuItems.map((item, i) => {
                const [label, href] = item.split('|').map(s => s.trim());
                if (href) {
                  const isAnchor = href.startsWith('#');
                  return (
                    <a
                      key={i}
                      href={href}
                      {...(isAnchor ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                      className="text-sm cursor-pointer transition-all duration-200 no-underline opacity-70 hover:opacity-100 hover:translate-y-[-1px]"
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
                return <span key={i} className="text-sm cursor-pointer transition-all duration-200 opacity-70 hover:opacity-100" style={{ color: block.styles.textColor }}>{label}</span>;
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
          "px-6 py-3 font-medium transition-all duration-300 relative overflow-hidden",
          bs === 'filled' && "bg-primary text-primary-foreground hover:opacity-90",
          bs === 'outline' && "bg-transparent border-2 border-current hover:opacity-90",
          bs === 'gradient' && "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02]",
          bs === 'glass' && "backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30",
          bs === 'neon' && "bg-transparent border-2 hover:shadow-[0_0_20px_currentColor,0_0_40px_currentColor] hover:scale-[1.02]",
          block.hoverEffect
        );
        const neonStyle = bs === 'neon' ? { borderColor: block.styles.textColor || '#a855f7', textShadow: `0 0 10px ${block.styles.textColor || '#a855f7'}` } : {};
        return wrapWithLink(block,
          <motion.div key={block.id} style={{ textAlign: block.styles.textAlign as React.CSSProperties['textAlign'] }} {...mp}>
            <button className={btnCls} style={{ fontSize: block.styles.fontSize, borderRadius: block.styles.borderRadius, color: bs === 'outline' || bs === 'neon' ? block.styles.textColor : undefined, ...neonStyle }}>
              <span className="relative z-10">{block.content}</span>
            </button>
          </motion.div>
        );
      }
      case 'image': {
        const isFullWidth = block.styles.padding === '0px' && block.styles.borderRadius === '0px';
        return wrapWithLink(block,
          <motion.div key={block.id} className={block.hoverEffect} style={{ 
            padding: isFullWidth ? 0 : block.styles.padding, 
            textAlign: block.styles.textAlign as React.CSSProperties['textAlign'],
            ...(isFullWidth ? { margin: '0 -24px', width: 'calc(100% + 48px)' } : {})
          }} {...mp}>
            <img src={block.content} alt="" className="max-w-full h-auto w-full" style={{ borderRadius: isFullWidth ? 0 : block.styles.borderRadius }} />
          </motion.div>
        );
      }
      case 'columns': {
        const cols = block.content.split('||').filter(Boolean);
        return wrapWithLink(block,
          <motion.div key={block.id} className={cn("grid gap-4", block.hoverEffect)} style={{ ...style, gridTemplateColumns: `repeat(${Math.min(cols.length, 4)}, 1fr)` }} {...mp}>
            {cols.map((col, i) => {
              const parts = col.split('|');
              const title = parts[0] || '';
              const desc = parts[1] || '';
              let iconElement: React.ReactNode = null;
              let cleanTitle = title;
              const lucideMatch = title.match(/^lucide:([a-z0-9-]+)\s*/);
              if (lucideMatch) {
                iconElement = <LucideIconByName name={lucideMatch[1]} size={28} className="mx-auto" />;
                cleanTitle = title.replace(lucideMatch[0], '');
              } else {
                const emojiMatch = title.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u);
                if (emojiMatch) {
                  iconElement = <span className="text-3xl">{emojiMatch[0].trim()}</span>;
                  cleanTitle = title.replace(emojiMatch[0], '');
                }
              }
              return (
                <div key={i} className="p-4 rounded-lg border text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: block.styles.borderColor || 'rgba(255,255,255,0.1)' }}>
                  {iconElement && <div className="mb-2 flex justify-center">{iconElement}</div>}
                  <div className="font-semibold mb-1" style={{ color: block.styles.textColor }}>{cleanTitle}</div>
                  {desc && <div className="text-sm opacity-70">{desc}</div>}
                </div>
              );
            })}
          </motion.div>
        );
      }
      case 'icon-text': {
        const [iconStr, title, desc] = block.content.split('|');
        const isLucide = iconStr && isLucideIcon(iconStr);
        return wrapWithLink(block,
          <motion.div key={block.id} className={cn("flex items-center gap-4", block.hoverEffect)} style={style} {...mp}>
            {isLucide ? (
              <div className="shrink-0" style={{ color: block.styles.textColor }}>
                <LucideIconByName name={getLucideIconName(iconStr)} size={32} />
              </div>
            ) : (
              <span className="text-4xl shrink-0">{iconStr}</span>
            )}
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
        return wrapWithLink(block, <motion.div key={block.id} className={cn("border backdrop-blur-sm", block.hoverEffect)} style={{ ...style, borderColor: block.styles.borderColor || 'rgba(255,255,255,0.1)', boxShadow: style.boxShadow || (style.backgroundColor && style.backgroundColor !== 'transparent' ? '0 4px 20px rgba(0,0,0,0.2)' : undefined) }} {...mp}>{block.content}</motion.div>);
      case 'spacer':
        return <motion.div key={block.id} style={{ padding: block.styles.padding }} {...mp} />;
      case 'form':
        return <FormBlock key={block.id} block={block} slug={slug || ''} style={style} mp={mp} />;
      case 'accordion': {
        const items = block.content.split('\n').filter(Boolean);
        return wrapWithLink(block,
          <motion.div key={block.id} className={block.hoverEffect} style={style} {...mp}>
            {items.map((item, i) => {
              const [q, a] = item.split('|');
              return (
                <details key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 0' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 500 }}>{q}</summary>
                  <p style={{ marginTop: '8px', opacity: 0.8, fontSize: '0.9em' }}>{a}</p>
                </details>
              );
            })}
          </motion.div>
        );
      }
      case 'tabs': {
        const [ActiveTabBlock] = [({ tabs, style, mp, block }: any) => {
          const [active, setActive] = useState(0);
          const tabItems = tabs as string[];
          return (
            <motion.div key={block.id} className={block.hoverEffect} style={style} {...mp}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.2)', marginBottom: '12px' }}>
                {tabItems.map((tab: string, i: number) => {
                  const [title] = tab.split('|');
                  return (
                    <button key={i} onClick={() => setActive(i)} style={{ padding: '8px 16px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'inherit', opacity: i === active ? 1 : 0.5, borderBottom: i === active ? '2px solid currentColor' : '2px solid transparent' }}>
                      {title}
                    </button>
                  );
                })}
              </div>
              <div>{tabItems[active]?.split('|')[1] || ''}</div>
            </motion.div>
          );
        }];
        const tabItems = block.content.split('||').filter(Boolean);
        return <ActiveTabBlock key={block.id} tabs={tabItems} style={style} mp={mp} block={block} />;
      }
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
      <Helmet>
        <title>{project.settings.seoTitle || project.title} | 24ZXC Playground</title>
        {project.settings.seoDescription && <meta name="description" content={project.settings.seoDescription} />}
      </Helmet>
      <div style={getBackgroundStyle()}>
        {/* Back to editor button */}
        <div className="fixed top-4 left-4 z-50">
          <a
            href="/playground"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/80 transition-all text-sm border border-white/10 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            В редактор
          </a>
        </div>
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {(() => {
            const visibleBlocks = project.blocks.filter(b => !b.hidden);
            const groupableTypes = ['counter', 'icon-text'];
            const elements: React.ReactNode[] = [];
            let i = 0;
            while (i < visibleBlocks.length) {
              const block = visibleBlocks[i];
              if (groupableTypes.includes(block.type)) {
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
                      {group.map((gb, gi) => {
                        const rendered = renderBlock(gb, i + gi);
                        if (!rendered) return null;
                        return gb.anchorId && gb.type !== 'navbar'
                          ? <div key={gb.id} id={gb.anchorId}>{rendered}</div>
                          : <div key={gb.id}>{rendered}</div>;
                      })}
                    </div>
                  );
                  i = j;
                  continue;
                }
              }
              const rendered = renderBlock(block, i);
              if (rendered) {
                elements.push(
                  block.anchorId && block.type !== 'navbar'
                    ? <div key={block.id} id={block.anchorId}>{rendered}</div>
                    : <div key={block.id}>{rendered}</div>
                );
              }
              i++;
            }
            return elements;
          })()}
        </div>
      </div>
    </>
  );
};

export default PlaygroundView;
