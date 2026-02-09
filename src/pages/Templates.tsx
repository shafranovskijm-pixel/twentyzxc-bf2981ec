import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Diamond, ArrowRight, Sparkles, Layers, ShoppingBag, Monitor, Eye, Search, SlidersHorizontal, Star, TrendingUp, X } from "lucide-react";
import { Link } from "react-router-dom";
import { categories, type Template, type Category, getAllTemplates, getPopularTemplates } from "@/data/templates";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "Sparkles": return <Sparkles className="w-5 h-5" />;
    case "Layers": return <Layers className="w-5 h-5" />;
    case "ShoppingBag": return <ShoppingBag className="w-5 h-5" />;
    case "Monitor": return <Monitor className="w-5 h-5" />;
    default: return <Sparkles className="w-5 h-5" />;
  }
};

type SortOption = "popular" | "price-asc" | "price-desc" | "rating" | "new";

const Templates = () => {
  const [activeCategory, setActiveCategory] = useState<string>("landing");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showFilters, setShowFilters] = useState(false);

  const allTemplates = getAllTemplates();
  const popularTemplates = getPopularTemplates(6);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let templates = activeCategory === "all" 
      ? allTemplates 
      : categories.find(c => c.id === activeCategory)?.templates || [];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case "popular":
        templates = [...templates].sort((a, b) => b.ordersCount - a.ordersCount);
        break;
      case "price-asc":
        templates = [...templates].sort((a, b) => {
          const priceA = parseInt(a.price.replace(/\D/g, ""));
          const priceB = parseInt(b.price.replace(/\D/g, ""));
          return priceA - priceB;
        });
        break;
      case "price-desc":
        templates = [...templates].sort((a, b) => {
          const priceA = parseInt(a.price.replace(/\D/g, ""));
          const priceB = parseInt(b.price.replace(/\D/g, ""));
          return priceB - priceA;
        });
        break;
      case "rating":
        templates = [...templates].sort((a, b) => b.rating - a.rating);
        break;
      case "new":
        templates = [...templates].filter(t => t.isNew);
        break;
    }

    return templates;
  }, [activeCategory, searchQuery, sortBy, allTemplates]);

  const currentCategory = activeCategory === "all" ? null : categories.find(c => c.id === activeCategory);

  const sortLabels: Record<SortOption, string> = {
    "popular": "По популярности",
    "price-asc": "Сначала дешевле",
    "price-desc": "Сначала дороже",
    "rating": "По рейтингу",
    "new": "Только новинки"
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(45_80%_55%/0.08),transparent_60%)]" />
        
        <div className="container px-4 relative z-10">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
              <Diamond className="w-5 h-5 text-primary" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Каталог <span className="gradient-gold-text">шаблонов</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Премиальные шаблоны сайтов класса люкс. Современный дизайн, продуманная UX и безупречное качество кода
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="pb-8 sticky top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {getCategoryIcon(category.icon)}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results count */}
      <section className="py-4">
        <div className="container px-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Найдено шаблонов: <span className="text-foreground font-medium">{filteredTemplates.length}</span>
              {searchQuery && <span> по запросу "{searchQuery}"</span>}
            </p>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                Сбросить поиск
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-8 pb-20">
        <div className="container px-4">
          {currentCategory && (
            <AnimatedSection className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">{currentCategory.name}</h2>
              <p className="text-muted-foreground">{currentCategory.description}</p>
            </AnimatedSection>
          )}

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-muted-foreground mb-4">Шаблоны не найдены</div>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
                Сбросить фильтры
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TemplateCard template={template} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container px-4">
          <AnimatedSection>
            <div className="luxury-card rounded-sm p-12 text-center max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Нужен уникальный дизайн?
              </h3>
              <p className="text-muted-foreground mb-8">
                Создадим индивидуальный проект с нуля под ваши требования и фирменный стиль
              </p>
              <Link to="/#contact">
                <Button variant="hero" size="lg">
                  Обсудить проект
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

interface TemplateCardProps {
  template: Template;
}

const TemplateCard = ({ template }: TemplateCardProps) => {
  // Get glow color from template's unique style or derive from accent
  const glowColor = template.uniqueStyle?.secondaryColor || 
    template.accentColor?.replace('bg-', '').replace('-500', '') || 'primary';
  
  return (
    <Link to={`/templates/${template.id}`} className="block group">
      <div 
        className="luxury-card rounded-sm overflow-hidden relative transition-all duration-300 group-hover:border-primary/50"
        style={{
          boxShadow: 'none',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget;
          // Create glow effect based on template's accent color
          const glowColors: Record<string, string> = {
            'bg-white': 'rgba(255, 255, 255, 0.15)',
            'bg-amber-500': 'rgba(245, 158, 11, 0.25)',
            'bg-cyan-400': 'rgba(34, 211, 238, 0.25)',
            'bg-violet-500': 'rgba(139, 92, 246, 0.25)',
            'bg-rose-400': 'rgba(251, 113, 133, 0.25)',
            'bg-emerald-400': 'rgba(52, 211, 153, 0.25)',
            'bg-blue-500': 'rgba(59, 130, 246, 0.25)',
            'bg-fuchsia-500': 'rgba(217, 70, 239, 0.25)',
            'bg-orange-500': 'rgba(249, 115, 22, 0.25)',
          };
          const color = glowColors[template.accentColor] || 'rgba(245, 158, 11, 0.2)';
          target.style.boxShadow = `0 0 40px 10px ${color}, 0 0 80px 20px ${color.replace('0.25', '0.1').replace('0.15', '0.08')}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Preview Area */}
        <div className={`aspect-[4/3] bg-gradient-to-br ${template.gradient} relative overflow-hidden`}>
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {template.isNew && (
              <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Новинка
              </span>
            )}
          </div>

          {/* Decorative elements to simulate a website */}
          <div className="absolute inset-4 border border-white/10 rounded-sm">
            {/* Header bar */}
            <div className="h-8 border-b border-white/10 flex items-center px-3 gap-2">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="flex-1" />
              <div className="w-16 h-2 rounded bg-white/10" />
            </div>
            
            {/* Content simulation */}
            <div className="p-4 space-y-3">
              <div className={`w-8 h-8 rounded ${template.accentColor} opacity-80`} />
              <div className="w-3/4 h-3 rounded bg-white/20" />
              <div className="w-1/2 h-3 rounded bg-white/10" />
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="aspect-square rounded bg-white/5" />
                <div className="aspect-square rounded bg-white/5" />
                <div className="aspect-square rounded bg-white/5" />
              </div>
            </div>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="hero" size="sm">
              Подробнее
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          {/* Glow effect */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 ${template.accentColor} opacity-20 blur-3xl group-hover:opacity-40 transition-opacity`} />
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-display font-semibold group-hover:text-primary transition-colors">
              {template.name}
            </h3>
            <span className="text-primary font-semibold text-sm whitespace-nowrap shimmer">
              {template.price}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(template.rating) ? "text-primary fill-primary" : "text-muted"}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{template.rating} ({template.ordersCount})</span>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {template.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Features */}
          <div className="pt-4 border-t border-border">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {template.features.map((feature) => (
                <span key={feature} className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Templates;
