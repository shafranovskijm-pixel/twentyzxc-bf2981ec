import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Clock, 
  Code2, 
  Diamond,
  Sparkles,
  Zap,
  Shield,
  Headphones,
  Eye,
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  Play,
  TrendingUp,
  Users,
  Award
} from "lucide-react";
import { getTemplateById, getCategoryByTemplateId, getSimilarTemplates } from "@/data/templates";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useCallback } from "react";
import { TiltCard } from "@/components/templates/previews/shared/TiltCard";

const TemplateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentScreenshot, setCurrentScreenshot] = useState(0);
  const [reviewsEmblaRef, reviewsEmblaApi] = useEmblaCarousel({ loop: true });
  const [currentReview, setCurrentReview] = useState(0);
  
  const template = id ? getTemplateById(id) : undefined;
  const category = id ? getCategoryByTemplateId(id) : undefined;
  const similarTemplates = id ? getSimilarTemplates(id, 3) : [];

  // Reviews carousel auto-scroll
  useEffect(() => {
    if (!reviewsEmblaApi) return;
    const interval = setInterval(() => reviewsEmblaApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [reviewsEmblaApi]);

  useEffect(() => {
    if (!reviewsEmblaApi) return;
    const onSelect = () => setCurrentReview(reviewsEmblaApi.selectedScrollSnap());
    reviewsEmblaApi.on("select", onSelect);
    return () => { reviewsEmblaApi.off("select", onSelect); };
  }, [reviewsEmblaApi]);

  const scrollToReview = useCallback((index: number) => reviewsEmblaApi?.scrollTo(index), [reviewsEmblaApi]);

  if (!template || !category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-32 text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Шаблон не найден</h1>
          <p className="text-muted-foreground mb-8">К сожалению, запрашиваемый шаблон не существует</p>
          <Link to="/templates">
            <Button variant="hero">
              <ArrowLeft className="w-4 h-4" />
              Вернуться к каталогу
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const benefits = [
    { icon: <Zap className="w-5 h-5" />, title: "Быстрая загрузка", description: "Оптимизированный код для максимальной производительности" },
    { icon: <Shield className="w-5 h-5" />, title: "Безопасность", description: "Защита от XSS, CSRF и других уязвимостей" },
    { icon: <Code2 className="w-5 h-5" />, title: "Чистый код", description: "Поддерживаемая архитектура и документация" },
    { icon: <Headphones className="w-5 h-5" />, title: "Поддержка", description: "30 дней бесплатной технической поддержки" },
  ];

  const processSteps = [
    { step: 1, title: "Бриф", desc: "Обсуждаем требования и цели проекта", duration: "1-2 дня" },
    { step: 2, title: "Дизайн", desc: "Создаём макеты и согласовываем", duration: "3-5 дней" },
    { step: 3, title: "Разработка", desc: "Верстаем и программируем функционал", duration: "5-10 дней" },
    { step: 4, title: "Тестирование", desc: "Проверяем на всех устройствах", duration: "1-2 дня" },
    { step: 5, title: "Запуск", desc: "Размещаем на хостинге и настраиваем", duration: "1 день" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(45_80%_55%/0.08),transparent_60%)]" />
        <div className={`absolute inset-0 bg-gradient-to-b ${template.gradient} opacity-30`} />
        
        <div className="container px-4 relative z-10">
          {/* Breadcrumb */}
          <AnimatedSection>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
              <Link to="/templates" className="hover:text-primary transition-colors">
                Шаблоны
              </Link>
              <span>/</span>
              <Link to={`/templates?category=${category.id}`} className="hover:text-primary transition-colors">
                {category.name}
              </Link>
              <span>/</span>
              <span className="text-foreground">{template.name}</span>
            </div>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Info */}
            <AnimatedSection>
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
                <Diamond className="w-5 h-5 text-primary" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {template.popular && (
                  <Badge className="bg-primary text-primary-foreground">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Популярный
                  </Badge>
                )}
                {template.isNew && (
                  <Badge className="bg-green-500 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Новинка
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                {template.name}
              </h1>

              {/* Rating & Orders */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.floor(template.rating) ? "text-primary fill-primary" : "text-muted"}`} 
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">{template.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{template.ordersCount} заказов</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {template.fullDescription}
              </p>

              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="text-3xl font-display font-bold gradient-gold-text shimmer">
                  {template.price}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{template.deliveryTime}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link to={`/templates/${template.id}/preview`}>
                  <Button variant="hero" size="lg">
                    <Eye className="w-4 h-4" />
                    Смотреть демо
                  </Button>
                </Link>
                <Link to="/#contact">
                  <Button variant="heroOutline" size="lg">
                    Заказать шаблон
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            {/* Right: 3D Tilt Preview */}
            <AnimatedSection delay={0.2}>
              <TiltCard className="group" glowColor={template.uniqueStyle?.secondaryColor || "rgba(245, 158, 11, 0.3)"}>
                <div className={`aspect-[4/3] bg-gradient-to-br ${template.gradient} rounded-sm overflow-hidden relative luxury-card`}>
                  {/* Decorative elements to simulate a website */}
                  <div className="absolute inset-4 border border-white/10 rounded-sm">
                    {/* Header bar */}
                    <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2">
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="w-3 h-3 rounded-full bg-white/20" />
                      <div className="flex-1" />
                      <div className="flex gap-4">
                        <div className="w-12 h-2 rounded bg-white/10" />
                        <div className="w-12 h-2 rounded bg-white/10" />
                        <div className="w-12 h-2 rounded bg-white/10" />
                      </div>
                    </div>
                    
                    {/* Content simulation */}
                    <div className="p-6 space-y-4">
                      <div className={`w-12 h-12 rounded ${template.accentColor} opacity-80`} />
                      <div className="w-3/4 h-4 rounded bg-white/20" />
                      <div className="w-1/2 h-4 rounded bg-white/10" />
                      <div className="mt-8 grid grid-cols-3 gap-3">
                        <div className="aspect-square rounded bg-white/5" />
                        <div className="aspect-square rounded bg-white/5" />
                        <div className="aspect-square rounded bg-white/5" />
                      </div>
                      <div className="mt-4 flex gap-3">
                        <div className={`h-10 w-32 rounded ${template.accentColor} opacity-60`} />
                        <div className="h-10 w-32 rounded bg-white/10" />
                      </div>
                    </div>
                  </div>

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.div 
                      className={`w-16 h-16 rounded-full ${template.accentColor} flex items-center justify-center shadow-lg`}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Play className="w-6 h-6 text-black ml-1" />
                    </motion.div>
                  </div>

                  {/* Glow effect */}
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 ${template.accentColor} opacity-20 blur-3xl`} />
                </div>
              </TiltCard>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Screenshots Gallery */}
      <section className="py-16 relative">
        <div className="container px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Скриншоты шаблона
            </h2>
            <p className="text-muted-foreground">Посмотрите основные секции и страницы</p>
          </AnimatedSection>

          {/* Screenshot tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {template.screenshots.map((screenshot, i) => (
              <button
                key={screenshot.id}
                onClick={() => setCurrentScreenshot(i)}
                className={`px-4 py-2 rounded-sm text-sm transition-all ${
                  i === currentScreenshot 
                    ? `${template.accentColor} text-black` 
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {screenshot.title}
              </button>
            ))}
          </div>

          {/* Screenshot display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreenshot}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className={`aspect-video rounded-sm overflow-hidden bg-gradient-to-br ${template.gradient} border border-border luxury-card`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className={`w-16 h-16 rounded-xl ${template.accentColor} mx-auto mb-4 flex items-center justify-center`}>
                      <Sparkles className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-white mb-2">
                      {template.screenshots[currentScreenshot]?.title}
                    </h3>
                    <p className="text-white/60">
                      {template.screenshots[currentScreenshot]?.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Что входит в шаблон
            </h2>
            <p className="text-muted-foreground">Полный список возможностей и функций</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Highlights */}
            <AnimatedSection>
              <div className="luxury-card rounded-sm p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-sm ${template.accentColor} flex items-center justify-center`}>
                    <Sparkles className="w-5 h-5 text-black" />
                  </div>
                  <h3 className="text-lg font-display font-semibold">Ключевые функции</h3>
                </div>
                <ul className="space-y-3">
                  {template.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>

            {/* Tech Stack */}
            <AnimatedSection delay={0.1}>
              <div className="luxury-card rounded-sm p-6 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-sm ${template.accentColor} flex items-center justify-center`}>
                    <Code2 className="w-5 h-5 text-black" />
                  </div>
                  <h3 className="text-lg font-display font-semibold">Технологии</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {template.techStack.map((tech) => (
                    <Badge key={tech} variant="outline" className="text-sm">
                      {tech}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Современный стек технологий обеспечивает высокую производительность, 
                  масштабируемость и удобство поддержки проекта
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-20 relative bg-secondary/30">
        <div className="container px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Этапы разработки
            </h2>
            <p className="text-muted-foreground">Как мы работаем над вашим проектом</p>
          </AnimatedSection>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border hidden md:block" />
              
              <div className="space-y-8">
                {processSteps.map((step, i) => (
                  <AnimatedSection key={i} delay={i * 0.1}>
                    <div className={`flex flex-col md:flex-row items-center gap-6 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                      <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : ""}`}>
                        <div className="luxury-card rounded-sm p-6">
                          <div className="text-sm text-primary font-medium mb-1">Шаг {step.step}</div>
                          <h4 className="text-lg font-display font-semibold mb-2">{step.title}</h4>
                          <p className="text-muted-foreground text-sm mb-2">{step.desc}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {step.duration}
                          </div>
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-full ${template.accentColor} flex items-center justify-center font-bold text-black relative z-10`}>
                        {step.step}
                      </div>
                      <div className="flex-1" />
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Carousel */}
      <section className="py-20 relative">
        <div className="container px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Отзывы клиентов
            </h2>
            <p className="text-muted-foreground">Что говорят о нашей работе</p>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto">
            <div className="overflow-hidden" ref={reviewsEmblaRef}>
              <div className="flex">
                {template.reviews.map((review, i) => (
                  <div key={i} className="flex-[0_0_100%] min-w-0 px-4">
                    <div className="luxury-card rounded-sm p-8 text-center">
                      <Quote className="w-10 h-10 text-primary/30 mx-auto mb-6" />
                      <div className="flex justify-center gap-1 mb-4">
                        {[...Array(5)].map((_, j) => (
                          <Star 
                            key={j}
                            className={`w-4 h-4 ${j < review.rating ? "text-primary fill-primary" : "text-muted"}`}
                          />
                        ))}
                      </div>
                      <p className="text-lg text-foreground mb-6 italic">"{review.text}"</p>
                      <div className="flex items-center justify-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${template.accentColor}`} />
                        <div className="text-left">
                          <div className="font-medium">{review.author}</div>
                          <div className="text-sm text-muted-foreground">{review.role}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {template.reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToReview(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentReview ? `${template.accentColor} w-6` : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 relative bg-secondary/30">
        <div className="container px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Часто задаваемые вопросы
            </h2>
            <p className="text-muted-foreground">Ответы на популярные вопросы о шаблоне</p>
          </AnimatedSection>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {template.faqs.map((faq, i) => (
                <AnimatedSection key={i} delay={i * 0.1}>
                  <AccordionItem value={`faq-${i}`} className="luxury-card rounded-sm border-0 px-6">
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </AnimatedSection>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 relative">
        <div className="container px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Преимущества работы с нами
            </h2>
            <p className="text-muted-foreground">Качество и надёжность в каждом проекте</p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="luxury-card rounded-sm p-6 text-center h-full">
                  <div className={`w-12 h-12 rounded-sm ${template.accentColor} flex items-center justify-center mx-auto mb-4`}>
                    <div className="text-black">{benefit.icon}</div>
                  </div>
                  <h3 className="font-display font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Similar Templates */}
      {similarTemplates.length > 0 && (
        <section className="py-20 relative bg-secondary/30">
          <div className="container px-4">
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
                Похожие шаблоны
              </h2>
              <p className="text-muted-foreground">Другие решения в категории {category.name}</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {similarTemplates.map((similar, i) => (
                <AnimatedSection key={similar.id} delay={i * 0.1}>
                  <Link to={`/templates/${similar.id}`} className="block group">
                    <div className="luxury-card rounded-sm overflow-hidden">
                      <div className={`aspect-[4/3] bg-gradient-to-br ${similar.gradient} relative`}>
                        <div className="absolute inset-4 border border-white/10 rounded-sm" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-24 ${similar.accentColor} opacity-20 blur-2xl" />
                      </div>
                      <div className="p-4">
                        <h4 className="font-display font-semibold group-hover:text-primary transition-colors">
                          {similar.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{similar.description}</p>
                        <div className="text-primary text-sm font-medium mt-2">{similar.price}</div>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container px-4">
          <AnimatedSection>
            <div className="luxury-card rounded-sm p-12 text-center max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Готовы начать?
              </h3>
              <p className="text-muted-foreground mb-8">
                Оставьте заявку, и мы свяжемся с вами для обсуждения деталей проекта
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/#contact">
                  <Button variant="hero" size="lg">
                    Обсудить проект
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/templates">
                  <Button variant="heroOutline" size="lg">
                    Смотреть другие шаблоны
                  </Button>
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TemplateDetail;
