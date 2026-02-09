import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Save, Share2, RotateCcw, Settings, Layers, Palette, ExternalLink, Layout } from "lucide-react";
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
    updateBlock,
    updateBlockStyles,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    clearAll,
    loadTemplate,
    reorderBlocks,
    exportData
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
                <Button variant="outline" onClick={clearAll}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Сбросить
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
                    <ProjectTemplates onSelectTemplate={handleSelectTemplate} />
                  </div>
                  
                  <BlockPalette onAddBlock={addBlock} />
                  
                  {/* Canvas settings */}
                  <div className="space-y-4 p-4 rounded-lg border border-border bg-secondary/20">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Настройки холста
                    </h3>
                    <div className="space-y-2">
                      <Label className="text-xs">Фон</Label>
                      <div className="flex gap-2 flex-wrap">
                        {COLOR_PRESETS.slice(0, 6).map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setSettings({ ...settings, backgroundColor: color.value })}
                            className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                            style={{ backgroundColor: color.value === 'transparent' ? '#000' : color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Паттерн</Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={settings.backgroundPattern === 'none' ? 'default' : 'outline'}
                          onClick={() => setSettings({ ...settings, backgroundPattern: 'none' })}
                        >
                          Нет
                        </Button>
                        <Button
                          size="sm"
                          variant={settings.backgroundPattern === 'dots' ? 'default' : 'outline'}
                          onClick={() => setSettings({ ...settings, backgroundPattern: 'dots' })}
                        >
                          Точки
                        </Button>
                        <Button
                          size="sm"
                          variant={settings.backgroundPattern === 'grid' ? 'default' : 'outline'}
                          onClick={() => setSettings({ ...settings, backgroundPattern: 'grid' })}
                        >
                          Сетка
                        </Button>
                      </div>
                    </div>
                  </div>
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
                      <ProjectTemplates onSelectTemplate={handleSelectTemplate} />
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
              <div className="min-h-[600px]">
                <Canvas
                  blocks={blocks}
                  settings={settings}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onReorder={reorderBlocks}
                />
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
    </>
  );
};

export default Playground;
