import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Save, Share2, RotateCcw, Settings, Layers, Palette, ExternalLink, Layout, Undo2, Redo2, Monitor, Tablet, Smartphone, Eye } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePlayground } from "@/hooks/use-playground";
import { BlockPalette } from "@/components/playground/BlockPalette";
import { Canvas } from "@/components/playground/Canvas";
import { BlockEditor } from "@/components/playground/BlockEditor";
import { ProjectTemplates } from "@/components/playground/ProjectTemplates";
import { PlaygroundCTA } from "@/components/playground/PlaygroundCTA";
import { PublishedProjectsGallery } from "@/components/playground/PublishedProjectsGallery";
import { CanvasSettings } from "@/components/playground/CanvasSettings";
import { COLOR_PRESETS } from "@/data/playground-effects";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";

const Playground = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreview, setIsPreview] = useState(false);

  const {
    blocks,
    selectedBlock,
    selectedBlockId,
    settings,
    projectTitle,
    setProjectTitle,
    setSelectedBlockId,
    setSettings,
    addBlock,
    addBlocks,
    updateBlock,
    updateBlockStyles,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    clearAll,
    loadTemplate,
    reorderBlocks,
    exportData,
    undo,
    redo,
    canUndo,
    canRedo
  } = usePlayground();

  const generateSlug = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const scrollToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (blocks.length === 0) {
      toast({
        title: "Нечего сохранять",
        description: "Добавьте хотя бы один блок",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const slug = savedSlug || generateSlug();
      const data = exportData();

      const { error } = await supabase
        .from("playground_projects")
        .upsert({
          slug,
          title: data.title,
          blocks: JSON.parse(JSON.stringify(data.blocks)),
          settings: JSON.parse(JSON.stringify(data.settings))
        }, { onConflict: 'slug' });

      if (error) throw error;

      setSavedSlug(slug);
      toast({
        title: "Сохранено!",
        description: `Ваш проект доступен по адресу /p/${slug}`,
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Ошибка сохранения",
        description: "Попробуйте ещё раз",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (!savedSlug) {
      toast({
        title: "Сначала сохраните проект",
        variant: "destructive"
      });
      return;
    }

    const url = `${window.location.origin}/p/${savedSlug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Ссылка скопирована!",
      description: url
    });
  };

  const handleSelectTemplate = (templateBlocks: Parameters<typeof loadTemplate>[0]) => {
    if (blocks.length > 0) {
      const confirmed = window.confirm("Текущие блоки будут заменены шаблоном. Продолжить?");
      if (!confirmed) return;
    }
    loadTemplate(templateBlocks);
    toast({
      title: "Шаблон загружен",
      description: "Теперь вы можете редактировать блоки"
    });
  };

  return (
    <>
      <Helmet>
        <title>Конструктор сайтов — Создай бесплатно | 24ZXC</title>
        <meta name="description" content="Бесплатный конструктор веб-страниц. Создавайте уникальные дизайны с анимациями и эффектами. Лучшие работы опубликуем на 24zxc.ru" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Raleway:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&family=Merriweather:wght@400;700&family=Lora:wght@400;500;700&family=Nunito:wght@400;600;700&family=PT+Sans:wght@400;700&family=Rubik:wght@400;500;700&family=Comfortaa:wght@400;500;700&family=Caveat:wght@400;700&family=Pacifico&family=Bebas+Neue&family=Jost:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        {/* CTA Section */}
        <div className="pt-24">
          <PlaygroundCTA onStartCreating={scrollToEditor} />
        </div>

        {/* Editor Section */}
        <main ref={editorRef} className="pb-20 scroll-mt-24">
          <div className="container px-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="text-xl font-semibold bg-transparent border-none focus:ring-0 p-0 h-auto w-auto min-w-[200px]"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} title="Отменить (Ctrl+Z)">
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo} title="Повторить (Ctrl+Shift+Z)">
                  <Redo2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={clearAll}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Сбросить
                </Button>
                <Button variant="outline" onClick={() => setIsPreview(true)} disabled={blocks.length === 0}>
                  <Eye className="w-4 h-4 mr-2" />
                  Предпросмотр
                </Button>
                <Button variant="outline" onClick={handleShare} disabled={!savedSlug}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Поделиться
                </Button>
                <Button variant="hero" onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </Button>
                {savedSlug && (
                  <Button variant="outline" asChild>
                    <a href={`/p/${savedSlug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Открыть
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Main content */}
            <div className="grid lg:grid-cols-[280px_1fr_300px] gap-6">
              {/* Left sidebar - Block Palette */}
              <div className="lg:block hidden">
                <div className="sticky top-24 space-y-6">
                  {/* Templates */}
                  <div className="p-4 rounded-lg border border-border bg-secondary/20">
                    <ProjectTemplates onSelectTemplate={handleSelectTemplate} onAddBlocks={addBlocks} />
                  </div>
                  
                  <BlockPalette onAddBlock={addBlock} />
                  
                  <CanvasSettings settings={settings} onSettingsChange={setSettings} />
                </div>
              </div>

              {/* Mobile palette trigger */}
              <div className="lg:hidden flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Layers className="w-4 h-4 mr-2" />
                      Блоки
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Добавить блок</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      <ProjectTemplates onSelectTemplate={handleSelectTemplate} onAddBlocks={addBlocks} />
                      <BlockPalette onAddBlock={addBlock} />
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Palette className="w-4 h-4 mr-2" />
                      Настройки
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Редактор</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      {selectedBlock ? (
                        <BlockEditor
                          block={selectedBlock}
                          onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                          onUpdateStyles={(styles) => updateBlockStyles(selectedBlock.id, styles)}
                          onDelete={() => deleteBlock(selectedBlock.id)}
                          onDuplicate={() => duplicateBlock(selectedBlock.id)}
                          onMove={(dir) => moveBlock(selectedBlock.id, dir)}
                        />
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Выберите блок для редактирования
                        </p>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Canvas */}
              <div className="min-h-[600px] flex flex-col items-center">
                {/* Device switcher */}
                <div className="flex items-center gap-1 mb-4 p-1 rounded-lg border border-border bg-secondary/20">
                  <Button
                    variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setDeviceMode('desktop')}
                    title="Desktop"
                  >
                    <Monitor className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline text-xs">Desktop</span>
                  </Button>
                  <Button
                    variant={deviceMode === 'tablet' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setDeviceMode('tablet')}
                    title="Tablet"
                  >
                    <Tablet className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline text-xs">Tablet</span>
                  </Button>
                  <Button
                    variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setDeviceMode('mobile')}
                    title="Mobile"
                  >
                    <Smartphone className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline text-xs">Mobile</span>
                  </Button>
                </div>
                <div
                  className="w-full transition-all duration-300"
                  style={{
                    maxWidth: deviceMode === 'mobile' ? '375px' : deviceMode === 'tablet' ? '768px' : '100%'
                  }}
                >
                  <Canvas
                    blocks={blocks}
                    settings={settings}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={setSelectedBlockId}
                    onReorder={reorderBlocks}
                  />
                </div>
              </div>

              {/* Right sidebar - Block Editor */}
              <div className="hidden lg:block">
                <div className="sticky top-24 p-4 rounded-lg border border-border bg-secondary/20">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Редактор блока
                  </h3>
                  {selectedBlock ? (
                    <BlockEditor
                      block={selectedBlock}
                      onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                      onUpdateStyles={(styles) => updateBlockStyles(selectedBlock.id, styles)}
                      onDelete={() => deleteBlock(selectedBlock.id)}
                      onDuplicate={() => duplicateBlock(selectedBlock.id)}
                      onMove={(dir) => moveBlock(selectedBlock.id, dir)}
                    />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Выберите блок на холсте для редактирования
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Gallery Section */}
        <div id="gallery">
          <PublishedProjectsGallery />
        </div>

        <Footer />
      </div>

      {/* Fullscreen Preview */}
      {isPreview && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-secondary/30">
            <span className="text-sm font-medium text-muted-foreground">Предпросмотр: {projectTitle}</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-secondary/20">
                <Button variant={deviceMode === 'desktop' ? 'default' : 'ghost'} size="sm" onClick={() => setDeviceMode('desktop')}>
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button variant={deviceMode === 'tablet' ? 'default' : 'ghost'} size="sm" onClick={() => setDeviceMode('tablet')}>
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button variant={deviceMode === 'mobile' ? 'default' : 'ghost'} size="sm" onClick={() => setDeviceMode('mobile')}>
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={() => setIsPreview(false)}>Закрыть</Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex justify-center p-6">
            <div
              className="w-full transition-all duration-300"
              style={{ maxWidth: deviceMode === 'mobile' ? '375px' : deviceMode === 'tablet' ? '768px' : '100%' }}
            >
              <Canvas
                blocks={blocks}
                settings={settings}
                selectedBlockId={null}
                onSelectBlock={() => {}}
                onReorder={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Playground;
