import { Helmet } from "react-helmet-async";
import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, LogOut, Loader2 } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  usePortfolioProjects,
  usePortfolioSettings,
  useUpdateProject,
  useUpdateSettings,
  useCreateProject,
  useDeleteProject,
  useReorderProjects,
} from "@/hooks/use-portfolio-projects";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { AdminLoginDialog } from "@/components/portfolio/AdminLoginDialog";
import { AddProjectDialog } from "@/components/portfolio/AddProjectDialog";
import { SortableProjectCard } from "@/components/portfolio/SortableProjectCard";
import { EditableSectionTitle } from "@/components/portfolio/EditableSectionTitle";
import { toast } from "sonner";

const faqs = [
  {
    question: "Сколько стоит разработка сайта?",
    answer: "Стоимость зависит от типа проекта. Лендинг — от 30 000 ₽, корпоративный сайт — от 50 000 ₽, интернет-магазин — от 80 000 ₽. Точную стоимость рассчитаем после обсуждения задачи."
  },
  {
    question: "Какие сроки разработки?",
    answer: "Лендинг — 5-7 дней, корпоративный сайт — 2-3 недели, интернет-магазин — от 1 месяца. Сроки зависят от сложности проекта и оперативности согласования."
  },
  {
    question: "Что входит в стоимость?",
    answer: "Дизайн, адаптивная вёрстка, базовая SEO-оптимизация, подключение аналитики, обучение работе с сайтом и 30 дней бесплатной поддержки после запуска."
  },
  {
    question: "Работаете ли вы по договору?",
    answer: "Да, мы работаем официально как ИП. Заключаем договор, выставляем счёт и предоставляем закрывающие документы. Возможна оплата в рассрочку."
  },
  {
    question: "Можете ли доработать существующий сайт?",
    answer: "Да, берёмся за доработку и поддержку действующих сайтов. Проведём аудит, предложим улучшения и реализуем необходимый функционал."
  },
  {
    question: "Что такое ФРДО и зачем он нужен?",
    answer: "ФИС ФРДО — федеральный реестр документов об образовании. Все лицензированные учебные центры обязаны вносить туда данные о выданных дипломах и удостоверениях. Мы помогаем с настройкой и ведением реестра."
  },
];

const Portfolio = () => {
  const { data: projects, isLoading, error } = usePortfolioProjects();
  const { data: settings } = usePortfolioSettings();
  const { user, isAdmin, isLoading: authLoading, signIn, signOut } = useAdminAuth();
  const updateProject = useUpdateProject();
  const updateSettings = useUpdateSettings();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const reorderProjects = useReorderProjects();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const featuredProjects = useMemo(
    () => projects?.filter(p => p.featured) || [],
    [projects]
  );
  
  const regularProjects = useMemo(
    () => projects?.filter(p => !p.featured) || [],
    [projects]
  );

  const handleUpdate = (updates: Parameters<typeof updateProject.mutate>[0]) => {
    updateProject.mutate(updates, {
      onSuccess: () => toast.success("Проект обновлён"),
      onError: () => toast.error("Ошибка при сохранении"),
    });
  };

  const handleCreate = (project: Parameters<typeof createProject.mutate>[0]) => {
    createProject.mutate(project, {
      onSuccess: () => toast.success("Проект добавлен"),
      onError: () => toast.error("Ошибка при создании"),
    });
  };

  const handleDelete = (id: string) => {
    deleteProject.mutate(id, {
      onSuccess: () => toast.success("Проект удалён"),
      onError: () => toast.error("Ошибка при удалении"),
    });
  };

  const handleSettingsUpdate = (field: "featured_title" | "all_title", value: string) => {
    updateSettings.mutate(
      { [field]: value },
      {
        onSuccess: () => toast.success("Заголовок обновлён"),
        onError: () => toast.error("Ошибка при сохранении"),
      }
    );
  };

  const handleDragEnd = (event: DragEndEvent, isFeatured: boolean) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const projectsList = isFeatured ? featuredProjects : regularProjects;
    const oldIndex = projectsList.findIndex(p => p.id === active.id);
    const newIndex = projectsList.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Calculate new sort orders
    const reorderedProjects = [...projectsList];
    const [moved] = reorderedProjects.splice(oldIndex, 1);
    reorderedProjects.splice(newIndex, 0, moved);

    const updates = reorderedProjects.map((project, index) => ({
      id: project.id,
      sort_order: isFeatured ? index : index + 100, // Offset regular projects
    }));

    reorderProjects.mutate(updates, {
      onSuccess: () => toast.success("Порядок обновлён"),
      onError: () => toast.error("Ошибка при сортировке"),
    });
  };

  return (
    <>
      <Helmet>
        <title>Портфолио — Наши проекты | 24ZXC</title>
        <meta name="description" content="Портфолио веб-студии 24ZXC: сайты, интернет-магазины, веб-приложения и рекламные кампании. Смотрите наши лучшие работы." />
        <link rel="canonical" href="https://24zxc.ru/portfolio" />
      </Helmet>
      <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 right-10 w-32 h-32 border border-primary/10 rotate-45 animate-float" />
        <div className="absolute top-1/3 left-5 w-20 h-20 border border-primary/5 rotate-12 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 border border-primary/10 -rotate-12 animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-40 left-0 w-64 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-60 right-0 w-48 h-[1px] bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(hsl(45 80% 55%) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <svg className="absolute top-20 right-20 w-40 h-40 text-primary/5" viewBox="0 0 100 100">
          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="0.5" />
          <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="0.5" />
          <line x1="40" y1="100" x2="100" y2="40" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        <svg className="absolute top-32 left-8 w-16 h-16 text-primary/20" viewBox="0 0 50 50">
          <path d="M0 25 L25 0 L25 10 L10 25 L25 25 L25 50 L0 25" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        <div className="absolute top-1/2 left-20 w-3 h-3 bg-primary/20 rotate-45" />
        <div className="absolute top-[60%] right-32 w-2 h-2 bg-primary/15 rotate-45" />
        <div className="absolute top-[80%] left-1/3 w-2 h-2 bg-primary/10 rotate-45" />
      </div>

      <Header />
      
      <main className="pt-32 pb-24 relative z-10">
        <div className="container px-4">
          {/* Hero */}
          <div className="text-center mb-20 relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/40 rotate-45" />
            
            {/* Admin Controls */}
            <div className="absolute right-0 top-0 flex items-center gap-2">
              {!authLoading && (
                <>
                  {user && isAdmin ? (
                    <>
                      <AddProjectDialog
                        onCreate={handleCreate}
                        isCreating={createProject.isPending}
                        projectCount={projects?.length || 0}
                      />
                      <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
                        <LogOut className="w-4 h-4" />
                        Выйти
                      </Button>
                    </>
                  ) : (
                    <AdminLoginDialog onLogin={signIn} />
                  )}
                </>
              )}
            </div>
            
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              Наши проекты
            </Badge>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-gold-text">Портфолио</span> работ
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Более 50 успешных проектов по всей России — от веб-разработки до комплексного маркетинга
            </p>
            
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-primary/30" />
              <div className="w-1.5 h-1.5 bg-primary/40 rotate-45" />
              <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-primary/30" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            <StatCard value={50} suffix="+" label="Проектов" />
            <StatCard value={30} suffix="+" label="Клиентов" />
            <StatCard value={5} suffix="" label="Лет опыта" />
            <StatCard value={98} suffix="%" label="Довольных" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-muted-foreground">
              Ошибка загрузки проектов
            </div>
          ) : (
            <>
              {/* Featured Projects */}
              {featuredProjects.length > 0 && (
                <div className="mb-16">
                  <EditableSectionTitle
                    title={settings?.featured_title || "Избранные проекты"}
                    isAdmin={isAdmin}
                    onSave={(value) => handleSettingsUpdate("featured_title", value)}
                    isUpdating={updateSettings.isPending}
                  />
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, true)}
                  >
                    <SortableContext
                      items={featuredProjects.map(p => p.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid md:grid-cols-2 gap-8">
                        {featuredProjects.map((project, i) => (
                          <SortableProjectCard
                            key={project.id}
                            project={project}
                            index={i}
                            isAdmin={isAdmin}
                            isFeatured
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            isUpdating={updateProject.isPending}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* All Projects Grid */}
              {regularProjects.length > 0 && (
                <div>
                  <EditableSectionTitle
                    title={settings?.all_title || "Все проекты"}
                    isAdmin={isAdmin}
                    onSave={(value) => handleSettingsUpdate("all_title", value)}
                    isUpdating={updateSettings.isPending}
                  />
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, false)}
                  >
                    <SortableContext
                      items={regularProjects.map(p => p.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regularProjects.map((project, i) => (
                          <SortableProjectCard
                            key={project.id}
                            project={project}
                            index={i}
                            isAdmin={isAdmin}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            isUpdating={updateProject.isPending}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </>
          )}

          {/* FAQ Section */}
          <div className="mt-24 mb-16">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-4 mb-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/50" />
                <HelpCircle className="w-4 h-4 text-primary" />
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/50" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                Частые <span className="gradient-gold-text">вопросы</span>
              </h2>
              <p className="text-muted-foreground text-sm">
                Ответы на популярные вопросы о наших услугах
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-card/50 rounded-sm border border-border/30 px-5 data-[state=open]:border-primary/30 transition-all duration-300"
                  >
                    <AccordionTrigger className="text-left py-4 hover:no-underline group">
                      <div className="flex items-start gap-3">
                        <span className="text-primary/40 font-display font-bold text-sm group-hover:text-primary transition-colors">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="font-medium group-hover:text-primary transition-colors">
                          {faq.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-9 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="luxury-card p-12 rounded-sm max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                Хотите стать <span className="gradient-gold-text">следующим</span>?
              </h3>
              <p className="text-muted-foreground mb-8">
                Обсудим ваш проект и создадим решение, которое работает
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/#contact">Обсудить проект</a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </>
  );
};

const StatCard = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { ref, displayValue } = useCountUp({ end: value, suffix, duration: 2000 });
  
  return (
    <div ref={ref} className="text-center p-6 luxury-card rounded-sm">
      <div className="text-3xl md:text-4xl font-display font-bold gradient-gold-text mb-2">
        {displayValue}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
};

export default Portfolio;
