import { useParams, Link } from "react-router-dom";
import { getTemplateById, getCategoryByTemplateId } from "@/data/templates";
import { LandingPreview, CorporatePreview, EcommercePreview, WebAppPreview } from "@/components/templates/previews";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, ArrowLeft } from "lucide-react";

const TemplatePreview = () => {
  const { id } = useParams<{ id: string }>();
  
  const template = id ? getTemplateById(id) : undefined;
  const category = id ? getCategoryByTemplateId(id) : undefined;

  if (!template || !category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Шаблон не найден</h1>
          <Link to="/templates">
            <Button>Вернуться к каталогу</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Render preview based on category
  const renderPreview = () => {
    switch (category.id) {
      case "landing":
        return <LandingPreview template={template} />;
      case "corporate":
        return <CorporatePreview template={template} />;
      case "ecommerce":
        return <EcommercePreview template={template} />;
      case "webapp":
        return <WebAppPreview template={template} />;
      default:
        return <LandingPreview template={template} />;
    }
  };

  return (
    <div className="relative">
      {/* Floating toolbar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl">
        <Link to={`/templates/${template.id}`}>
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Назад</span>
          </Button>
        </Link>
        
        <div className="h-6 w-px bg-white/20" />
        
        <div className="px-3">
          <div className="text-white text-sm font-medium">{template.name}</div>
          <div className="text-white/50 text-xs">{category.name}</div>
        </div>
        
        <div className="h-6 w-px bg-white/20" />
        
        <Link to="/#contact">
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <span className="hidden sm:inline">Заказать</span>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
        
        <Link to="/templates">
          <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Preview content */}
      {renderPreview()}
    </div>
  );
};

export default TemplatePreview;
