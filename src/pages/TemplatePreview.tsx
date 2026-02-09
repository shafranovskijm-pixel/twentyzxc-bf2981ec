import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getTemplateById, getCategoryByTemplateId } from "@/data/templates";
import { LandingPreview, CorporatePreview, EcommercePreview, WebAppPreview } from "@/components/templates/previews";
import { 
  NoirElegancePreview, 
  GoldenPrestigePreview, 
  CrystalVisionPreview,
  ExecutiveSuitePreview,
  MarbleGoldPreview,
  LuxeBoutiquePreview,
  DashboardProPreview,
  CRMElitePreview
} from "@/components/templates/previews/unique";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, ArrowLeft } from "lucide-react";
import { DeviceSwitcher, DeviceType, getDeviceWidth } from "@/components/templates/previews/shared";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TemplatePreview = () => {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const template = id ? getTemplateById(id) : undefined;
  const category = id ? getCategoryByTemplateId(id) : undefined;

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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

  // Render unique preview based on template ID, fallback to category-based preview
  const renderPreview = () => {
    // Unique previews for specific templates
    switch (id) {
      // Landing templates
      case "noir-elegance":
        return <NoirElegancePreview template={template} />;
      case "golden-prestige":
        return <GoldenPrestigePreview template={template} />;
      case "crystal-vision":
        return <CrystalVisionPreview template={template} />;
      
      // Corporate templates
      case "executive-suite":
        return <ExecutiveSuitePreview template={template} />;
      case "marble-gold":
        return <MarbleGoldPreview template={template} />;
      
      // E-commerce templates
      case "luxe-boutique":
        return <LuxeBoutiquePreview template={template} />;
      
      // WebApp templates
      case "dashboard-pro":
        return <DashboardProPreview template={template} />;
      case "crm-elite":
        return <CRMElitePreview template={template} />;
      
      // Fallback to category-based preview for templates without unique preview
      default:
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
    }
  };

  const deviceWidth = getDeviceWidth(device);

  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Floating toolbar */}
      <motion.div 
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
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
        
        <DeviceSwitcher
          currentDevice={device}
          onDeviceChange={setDevice}
          onFullscreen={toggleFullscreen}
        />
        
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
      </motion.div>

      {/* Device indicator */}
      <AnimatePresence mode="wait">
        {device !== "desktop" && (
          <motion.div
            key={device}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white/60 text-xs"
          >
            {device === "tablet" ? "768px — iPad / Tablet" : "375px — iPhone / Mobile"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview content */}
      <div className="flex justify-center items-start min-h-screen pt-20 pb-16">
        <motion.div
          className={cn(
            "transition-all duration-500 ease-out origin-top",
            device !== "desktop" && "rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          )}
          style={{ 
            width: deviceWidth,
            maxWidth: "100%",
          }}
          animate={{
            scale: device === "desktop" ? 1 : 0.95,
          }}
        >
          {/* Device frame for mobile/tablet */}
          {device !== "desktop" && (
            <div className="bg-black h-6 flex items-center justify-center rounded-t-3xl border-b border-white/10">
              <div className="w-20 h-1 bg-white/20 rounded-full" />
            </div>
          )}
          
          <div className={cn(
            device !== "desktop" && "bg-zinc-900"
          )}>
            {renderPreview()}
          </div>
          
          {/* Device bottom bar */}
          {device !== "desktop" && (
            <div className="bg-black h-5 flex items-center justify-center rounded-b-3xl border-t border-white/10">
              <div className="w-24 h-1 bg-white/20 rounded-full" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TemplatePreview;
