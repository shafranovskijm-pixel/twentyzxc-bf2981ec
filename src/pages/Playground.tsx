import { useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Save, Share2, RotateCcw, Settings, Layers, Palette, ExternalLink, Layout, Undo2, Redo2, Monitor, Tablet, Smartphone, Eye, Puzzle, Type, Paintbrush, Download, ListTree, Upload, Copy, FileJson, Search } from "lucide-react";
import { TelegramConnectButton } from "@/components/playground/TelegramConnectButton";
import { FontSettings } from "@/components/playground/FontSettings";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePlayground } from "@/hooks/use-playground";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { BlockPalette } from "@/components/playground/BlockPalette";
import { Canvas } from "@/components/playground/Canvas";
import { BlockEditor } from "@/components/playground/BlockEditor";
import { BlockStyles } from "@/data/playground-effects";
import { ProjectTemplates, PageTemplatesList, BlockExamplesList } from "@/components/playground/ProjectTemplates";
import { PlaygroundCTA } from "@/components/playground/PlaygroundCTA";
import { PublishedProjectsGallery } from "@/components/playground/PublishedProjectsGallery";
import { FeedbackSection } from "@/components/playground/FeedbackSection";
import { CanvasSettings } from "@/components/playground/CanvasSettings";
import { SaveDialog } from "@/components/playground/SaveDialog";
import { LayerList } from "@/components/playground/LayerList";
import { exportToHTML } from "@/lib/export-html";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";

const Playground = () => {
  const { toast } = useToast();
  const { isAdmin } = useAdminAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreview, setIsPreview] = useState(false);
  const [copiedStyles, setCopiedStyles] = useState<BlockStyles | null>(null);

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
    addImageBlock,
    updateBlock,
    updateBlockStyles,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    clearAll,
    loadTemplate,
    reorderBlocks,
    exportData,
    importData,
    toggleBlockHidden,
    undo,
    redo,
    canUndo,
    canRedo
  } = usePlayground();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveClick = () => {
    if (blocks.length === 0) {
      toast({ title: "Нечего сохранять", description: "Добавьте хотя бы один блок", variant: "destructive" });
      return;
    }
    if (savedSlug) {
      handleSave(savedSlug);
    } else {
      setShowSaveDialog(true);
    }
  };

  const handleSave = async (slug: string) => {
    setIsSaving(true);
    setShowSaveDialog(false);
    try {
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
      toast({ title: "Сохранено!", description: `Ваш проект доступен по адресу /p/${slug}` });
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Ошибка сохранения", description: "Попробуйте ещё раз", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (!savedSlug) {
      toast({ title: "Сначала сохраните проект", variant: "destructive" });
      return;
    }
    const url = `${window.location.origin}/p/${savedSlug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована!", description: url });
  };

  const handleSelectTemplate = (templateBlocks: Parameters<typeof loadTemplate>[0]) => {
    if (blocks.length > 0) {
      const confirmed = window.confirm("Текущие блоки будут заменены шаблоном. Продолжить?");
      if (!confirmed) return;
    }
    loadTemplate(templateBlocks);
    toast({ title: "Шаблон загружен", description: "Теперь вы можете редактировать блоки" });
  };

  const scrollToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExportHTML = () => {
    if (blocks.length === 0) {
      toast({ title: "Нечего экспортировать", description: "Добавьте хотя бы один блок", variant: "destructive" });
      return;
    }
    const data = exportData();
    const html = exportToHTML(data.title, data.blocks, data.settings);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "HTML скачан!", description: "Файл готов к размещению на хостинге" });
  };

  const handleExportJSON = () => {
    if (blocks.length === 0) {
      toast({ title: "Нечего экспортировать", variant: "destructive" });
      return;
    }
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "JSON скачан!" });
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.blocks || !Array.isArray(data.blocks)) throw new Error('Invalid format');
        importData({ title: data.title || 'Импорт', blocks: data.blocks, settings: data.settings || {} });
        toast({ title: "Проект импортирован!" });
      } catch {
        toast({ title: "Ошибка импорта", description: "Неверный формат файла", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDuplicate = () => {
    if (blocks.length === 0) {
      toast({ title: "Нечего дублировать", variant: "destructive" });
      return;
    }
    setSavedSlug(null);
    setShowSaveDialog(true);
    toast({ title: "Введите новый slug для копии проекта" });
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
        <section ref={editorRef} className="scroll-mt-24">
          <div className="container px-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 py-3">
              <div className="flex items-center gap-4">
                <Input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="text-xl font-semibold bg-transparent border-none focus:ring-0 p-0 h-auto w-auto min-w-[200px]"
                />
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} title="Отменить (Ctrl+Z)">
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo} title="Повторить (Ctrl+Shift+Z)">
                  <Redo2 className="w-4 h-4" />
                </Button>

                {/* Device switcher in toolbar */}
                <div className="hidden md:flex items-center gap-1 p-1 rounded-lg border border-border bg-secondary/20">
                  <Button variant={deviceMode === 'desktop' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDeviceMode('desktop')} title="Desktop">
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button variant={deviceMode === 'tablet' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDeviceMode('tablet')} title="Tablet">
                    <Tablet className="w-4 h-4" />
                  </Button>
                  <Button variant={deviceMode === 'mobile' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDeviceMode('mobile')} title="Mobile">
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>

                <TelegramConnectButton slug={savedSlug || undefined} />
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
                <Button variant="outline" onClick={handleExportHTML} disabled={blocks.length === 0} title="Скачать HTML">
                  <Download className="w-4 h-4 mr-2" />
                  HTML
                </Button>
                <Button variant="outline" onClick={handleExportJSON} disabled={blocks.length === 0} title="Скачать JSON">
                  <FileJson className="w-4 h-4 mr-2" />
                  JSON
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} title="Импорт из JSON">
                  <Upload className="w-4 h-4 mr-2" />
                  Импорт
                </Button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
                <Button variant="outline" onClick={handleDuplicate} disabled={blocks.length === 0} title="Дублировать проект">
                  <Copy className="w-4 h-4 mr-2" />
                  Копия
                </Button>
                <Button variant="hero" onClick={handleSaveClick} disabled={isSaving}>
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

            {/* Mobile palette trigger */}
            <div className="lg:hidden flex gap-2 mb-4">
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
                  <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                    <ProjectTemplates onSelectTemplate={handleSelectTemplate} onAddBlocks={addBlocks} />
                    <BlockPalette onAddBlock={addBlock} />
                    <CanvasSettings settings={settings} onSettingsChange={setSettings} />
                    <FontSettings settings={settings} onSettingsChange={setSettings} />
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
                  <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                    {selectedBlock ? (
                      <BlockEditor
                        block={selectedBlock}
                        allBlocks={blocks}
                        onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                        onUpdateStyles={(styles) => updateBlockStyles(selectedBlock.id, styles)}
                        onDelete={() => deleteBlock(selectedBlock.id)}
                        onDuplicate={() => duplicateBlock(selectedBlock.id)}
                        onMove={(dir) => moveBlock(selectedBlock.id, dir)}
                        copiedStyles={copiedStyles}
                        onCopyStyles={() => setCopiedStyles({ ...selectedBlock.styles })}
                        onPasteStyles={() => copiedStyles && updateBlockStyles(selectedBlock.id, copiedStyles)}
                      />
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Выберите блок для редактирования
                      </p>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Mobile device switcher */}
              <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-secondary/20 md:hidden">
                <Button variant={deviceMode === 'desktop' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDeviceMode('desktop')}>
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button variant={deviceMode === 'tablet' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDeviceMode('tablet')}>
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button variant={deviceMode === 'mobile' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setDeviceMode('mobile')}>
                  <Smartphone className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Fixed-height editor area with independent scrolling */}
            <div className="hidden lg:grid lg:grid-cols-[280px_1fr_300px] gap-6 h-[calc(100vh-220px)] min-h-[500px]">
              {/* Left sidebar - Accordion */}
              <div className="overflow-y-auto rounded-lg border border-border bg-secondary/20 p-4">
                <Accordion type="multiple" defaultValue={["blocks"]}>
                  <AccordionItem value="templates" className="border-border">
                    <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline py-3">
                      <span className="flex items-center gap-2">
                        <Layout className="w-4 h-4" />
                        Готовые шаблоны
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <PageTemplatesList onSelectTemplate={handleSelectTemplate} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="examples" className="border-border">
                    <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline py-3">
                      <span className="flex items-center gap-2">
                        <Puzzle className="w-4 h-4" />
                        Примеры блоков
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <BlockExamplesList onAddBlocks={addBlocks} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="blocks" className="border-border">
                    <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline py-3">
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Добавить блок
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <BlockPalette onAddBlock={addBlock} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="layers" className="border-border">
                    <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline py-3">
                      <span className="flex items-center gap-2">
                        <ListTree className="w-4 h-4" />
                        Структура страницы
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <LayerList
                        blocks={blocks}
                        selectedBlockId={selectedBlockId}
                        onSelectBlock={setSelectedBlockId}
                        onDeleteBlock={deleteBlock}
                        onToggleHidden={toggleBlockHidden}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="settings" className="border-border">
                    <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline py-3">
                      <span className="flex items-center gap-2">
                        <Paintbrush className="w-4 h-4" />
                        Настройки фона
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CanvasSettings settings={settings} onSettingsChange={setSettings} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="font" className="border-border">
                    <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline py-3">
                      <span className="flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Шрифт
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <FontSettings settings={settings} onSettingsChange={setSettings} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="seo" className="border-b-0">
                    <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline py-3">
                      <span className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        SEO
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Заголовок (title)</label>
                          <input
                            value={settings.seoTitle || ''}
                            onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value || undefined })}
                            className="w-full h-8 rounded-md border border-border bg-secondary/50 px-2 text-xs"
                            placeholder="Заголовок страницы"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Описание (description)</label>
                          <textarea
                            value={settings.seoDescription || ''}
                            onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value || undefined })}
                            className="w-full h-16 rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs resize-none"
                            placeholder="Описание для поисковых систем"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Применяется на опубликованной странице /p/slug</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Canvas - independent scroll */}
              <div className="overflow-y-auto flex justify-center">
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
                    onDeleteBlock={deleteBlock}
                    onDuplicateBlock={duplicateBlock}
                    onAddImageBlock={addImageBlock}
                  />
                </div>
              </div>

              {/* Right sidebar - Block Editor - independent scroll */}
              <div className="overflow-y-auto rounded-lg border border-border bg-secondary/20 p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Редактор блока
                </h3>
                {selectedBlock ? (
                  <BlockEditor
                    block={selectedBlock}
                    allBlocks={blocks}
                    onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                    onUpdateStyles={(styles) => updateBlockStyles(selectedBlock.id, styles)}
                    onDelete={() => deleteBlock(selectedBlock.id)}
                    onDuplicate={() => duplicateBlock(selectedBlock.id)}
                    onMove={(dir) => moveBlock(selectedBlock.id, dir)}
                    copiedStyles={copiedStyles}
                    onCopyStyles={() => setCopiedStyles({ ...selectedBlock.styles })}
                    onPasteStyles={() => copiedStyles && updateBlockStyles(selectedBlock.id, copiedStyles)}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Выберите блок на холсте для редактирования
                  </p>
                )}
              </div>
            </div>

            {/* Mobile canvas (below sheets) */}
            <div className="lg:hidden min-h-[400px]">
              <div
                className="w-full mx-auto transition-all duration-300"
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
                  onDeleteBlock={deleteBlock}
                  onDuplicateBlock={duplicateBlock}
                  onAddImageBlock={addImageBlock}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Spacer */}
        <div className="py-10" />

        {/* Gallery Section */}
        <div id="gallery">
          <PublishedProjectsGallery isAdmin={isAdmin} />
        </div>

        {/* Feedback Section */}
        <FeedbackSection isAdmin={isAdmin} />

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

      <SaveDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSave}
        isSaving={isSaving}
        existingSlug={savedSlug}
      />
    </>
  );
};

export default Playground;
