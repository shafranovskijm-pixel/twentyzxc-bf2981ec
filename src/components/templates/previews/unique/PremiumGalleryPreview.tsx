import { useState, useRef, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, ShoppingBag, Search, ChevronRight, ChevronLeft,
  Star, Truck, Shield, Award, Video, Phone, X, MapPin,
  Eye, Clock, Package, Sparkles, ArrowRight, RotateCcw, ZoomIn, ZoomOut, Maximize2
} from "lucide-react";
import { Template } from "@/data/templates";
import { ScrollReveal, AnimatedCounter, GradientButton } from "../shared";
import { ARBadge } from "../shared/ARBadge";
import { SizeGuideModal, SizeGuideButton } from "../shared/SizeGuideModal";
import { StockBadge, UrgencyMessage } from "../shared/StockBadge";

// Lazy load the 3D viewer for better performance
const Product3DViewer = lazy(() => import("../shared/Product3DViewer"));

// Import gallery images
import heroImage from "@/assets/templates/premium-gallery/hero.jpg";
import heroAngle2 from "@/assets/templates/premium-gallery/hero-angle-2.jpg";
import heroAngle3 from "@/assets/templates/premium-gallery/hero-angle-3.jpg";
import heroAngle4 from "@/assets/templates/premium-gallery/hero-angle-4.jpg";
import gallery1 from "@/assets/templates/premium-gallery/gallery-1.jpg";
import gallery1Angle2 from "@/assets/templates/premium-gallery/gallery-1-angle-2.jpg";
import gallery1Angle3 from "@/assets/templates/premium-gallery/gallery-1-angle-3.jpg";
import gallery1Angle4 from "@/assets/templates/premium-gallery/gallery-1-angle-4.jpg";
import gallery2 from "@/assets/templates/premium-gallery/gallery-2.jpg";
import gallery2Angle2 from "@/assets/templates/premium-gallery/gallery-2-angle-2.jpg";
import gallery2Angle3 from "@/assets/templates/premium-gallery/gallery-2-angle-3.jpg";
import gallery2Angle4 from "@/assets/templates/premium-gallery/gallery-2-angle-4.jpg";
import gallery3 from "@/assets/templates/premium-gallery/gallery-3.jpg";
import gallery3Angle2 from "@/assets/templates/premium-gallery/gallery-3-angle-2.jpg";
import gallery3Angle3 from "@/assets/templates/premium-gallery/gallery-3-angle-3.jpg";
import gallery3Angle4 from "@/assets/templates/premium-gallery/gallery-3-angle-4.jpg";
import gallery4 from "@/assets/templates/premium-gallery/gallery-4.jpg";
import gallery4Angle2 from "@/assets/templates/premium-gallery/gallery-4-angle-2.jpg";
import gallery4Angle3 from "@/assets/templates/premium-gallery/gallery-4-angle-3.jpg";
import gallery4Angle4 from "@/assets/templates/premium-gallery/gallery-4-angle-4.jpg";
import gallery5 from "@/assets/templates/premium-gallery/gallery-5.jpg";
import gallery5Angle2 from "@/assets/templates/premium-gallery/gallery-5-angle-2.jpg";
import gallery5Angle3 from "@/assets/templates/premium-gallery/gallery-5-angle-3.jpg";
import gallery5Angle4 from "@/assets/templates/premium-gallery/gallery-5-angle-4.jpg";
import gallery6 from "@/assets/templates/premium-gallery/gallery-6.jpg";
import gallery6Angle2 from "@/assets/templates/premium-gallery/gallery-6-angle-2.jpg";
import gallery6Angle3 from "@/assets/templates/premium-gallery/gallery-6-angle-3.jpg";
import gallery6Angle4 from "@/assets/templates/premium-gallery/gallery-6-angle-4.jpg";

// Hero images for 360° (4 views)
const heroImages360 = [heroImage, heroAngle2, heroAngle3, heroAngle4];

// Gallery images with 360° angles (4 views per product)
const galleryImages360: Record<string, string[]> = {
  "1": [gallery1, gallery1Angle2, gallery1Angle3, gallery1Angle4],
  "2": [gallery2, gallery2Angle2, gallery2Angle3, gallery2Angle4],
  "3": [gallery3, gallery3Angle2, gallery3Angle3, gallery3Angle4],
  "4": [gallery4, gallery4Angle2, gallery4Angle3, gallery4Angle4],
  "5": [gallery5, gallery5Angle2, gallery5Angle3, gallery5Angle4],
  "6": [gallery6, gallery6Angle2, gallery6Angle3, gallery6Angle4],
};

const galleryImages: Record<string, string> = {
  "1": gallery1,
  "2": gallery2,
  "3": gallery3,
  "4": gallery4,
  "5": gallery5,
  "6": gallery6,
};

// Product type definition
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  ar: boolean;
  stock: number;
}

// 360° Product Viewer Component
interface Product360ViewerProps {
  rotation: number;
  setRotation: (val: number) => void;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
}

const Product360Viewer = ({ rotation, setRotation, isDragging, setIsDragging }: Product360ViewerProps) => {
  const startXRef = useRef(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    startXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 5) {
      setRotation((rotation + delta * 0.5) % 360);
      startXRef.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - startXRef.current;
    if (Math.abs(delta) > 5) {
      setRotation((rotation + delta * 0.5) % 360);
      startXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative max-w-md mx-auto">
      {/* 360° Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-5 h-5 rounded-full border-2 border-dashed border-white/60"
        />
        <span className="text-sm font-medium text-white">360°</span>
      </div>

      {/* Main viewer area */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-square rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-emerald-500/20 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        {/* Hero jewelry images - 360° rotation with real images */}
        <div className="absolute inset-0">
          {heroImages360.map((img, i) => {
            const angleRange = 360 / 4; // 90° per image
            const normalizedRotation = ((rotation % 360) + 360) % 360;
            const imageAngleStart = i * angleRange;
            const imageAngleEnd = (i + 1) * angleRange;
            const isVisible = normalizedRotation >= imageAngleStart && normalizedRotation < imageAngleEnd;
            
            return (
              <img
                key={i}
                src={img}
                alt={`Luxury jewelry collection - angle ${i + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${
                  isVisible ? "opacity-100" : "opacity-0"
                }`}
              />
            );
          })}
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
        
        {/* Shine effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"
          style={{
            transform: `translateX(${rotation % 360}px)`,
          }}
        />

        {/* Drag hint */}
        <AnimatePresence>
          {!isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                animate={{ x: [-20, 20, -20] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm"
              >
                <span className="text-sm text-white/70">← Перетащите для вращения →</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rotation indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
          <RotateCcw className="w-4 h-4 text-white/60" />
          <span className="text-sm text-white/80">{Math.round(Math.abs(rotation % 360))}°</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`p-2 rounded-lg transition-colors ${
            isAutoRotating 
              ? "bg-emerald-500 text-white" 
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Frame indicator dots */}
      <div className="flex justify-center gap-1 mt-3">
        {[0, 1, 2, 3].map((i) => {
          const isActive = Math.floor((rotation % 360) / 90) === i || 
                          (rotation < 0 && Math.floor((360 + (rotation % 360)) / 90) === i);
          return (
            <button
              key={i}
              onClick={() => setRotation(i * 90)}
              className={`w-2 h-2 rounded-full transition-all ${
                isActive ? "bg-emerald-500 w-4" : "bg-zinc-700 hover:bg-zinc-600"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

// Product Card with 360° viewer
interface ProductCard360Props {
  product: Product;
  index: number;
  onSelect: (id: string) => void;
  onOpen360: (id: string) => void;
}

const ProductCard360 = ({ product, index, onSelect, onOpen360 }: ProductCard360Props) => {
  const [show3DMode, setShow3DMode] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: show3DMode ? 0 : -8 }}
      className="group"
    >
      <div 
        className={`relative aspect-[3/4] rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border overflow-hidden mb-4 transition-all ${
          show3DMode ? "border-emerald-500" : "border-zinc-800 cursor-pointer"
        }`}
        onClick={() => !show3DMode && onSelect(product.id)}
      >
        {show3DMode ? (
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
              />
            </div>
          }>
            <Product3DViewer 
              imageUrl={galleryImages[product.id]}
              images={galleryImages360[product.id]}
              onClose={() => setShow3DMode(false)}
              className="absolute inset-0"
            />
          </Suspense>
        ) : (
          <>
            {/* Normal product view */}
            <img 
              src={galleryImages[product.id]}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* AR badge - bottom left */}
            {product.ar && (
              <div className="absolute bottom-4 left-4 z-10">
                <ARBadge variant="compact" />
              </div>
            )}

            {/* Stock badge - top left */}
            {product.stock <= 3 && (
              <div className="absolute top-4 left-4 z-10">
                <StockBadge status={product.stock === 1 ? "last-items" : "low"} count={product.stock} />
              </div>
            )}

            {/* 360° badge button - top right, always visible */}
            <button
              onClick={(e) => { e.stopPropagation(); setShow3DMode(true); }}
              className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/90 backdrop-blur-sm border border-emerald-400/30 text-white text-sm font-medium hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 rounded-full border-2 border-dashed border-white"
              />
              360°
            </button>

            {/* Hover overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent flex items-end p-6"
            >
              <div className="flex gap-2 w-full">
                <button className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition-colors">
                  В корзину
                </button>
                <button className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                  <Eye className="w-5 h-5 text-zinc-300" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </div>

      <div>
        <p className="text-xs text-emerald-400 mb-1">{product.category}</p>
        <h3 className="font-medium text-white mb-2 group-hover:text-emerald-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-lg font-semibold text-white">
          {product.price.toLocaleString()} ₽
        </p>
      </div>
    </motion.div>
  );
};

interface PremiumGalleryPreviewProps {
  template: Template;
}

export const PremiumGalleryPreview = ({ template }: PremiumGalleryPreviewProps) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [selectedCity, setSelectedCity] = useState("moscow");
  const [heroRotation, setHeroRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const cities = [
    { id: "moscow", name: "Москва", days: "1-2", price: 0 },
    { id: "spb", name: "Санкт-Петербург", days: "2-3", price: 500 },
    { id: "kazan", name: "Казань", days: "3-4", price: 800 },
    { id: "other", name: "Другой город", days: "5-7", price: 1200 },
  ];

  const products = [
    { id: "1", name: "Изумрудное ожерелье Aurora", price: 245000, category: "Украшения", ar: true, stock: 2 },
    { id: "2", name: "Часы Prestige Gold", price: 890000, category: "Часы", ar: true, stock: 5 },
    { id: "3", name: "Сумка Elegance Black", price: 156000, category: "Аксессуары", ar: false, stock: 8 },
    { id: "4", name: "Кольцо Diamond Heart", price: 320000, category: "Украшения", ar: true, stock: 1 },
    { id: "5", name: "Браслет Serpenti", price: 178000, category: "Украшения", ar: true, stock: 4 },
    { id: "6", name: "Очки Aviator Platinum", price: 89000, category: "Аксессуары", ar: false, stock: 12 },
  ];

  const recommendations = [
    { id: "r1", name: "Для вас", items: 3 },
    { id: "r2", name: "Популярное", items: 8 },
    { id: "r3", name: "Новинки", items: 5 },
  ];

  const recentlyViewed = products.slice(0, 4);

  const selectedShipping = cities.find(c => c.id === selectedCity);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-emerald-900/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-xl text-white">Premium Gallery</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {["Коллекции", "Новинки", "Бренды", "Эксклюзив"].map((item) => (
              <a key={item} href="#" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 text-zinc-400 hover:text-white transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-xs flex items-center justify-center">
                2
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero with Parallax */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-zinc-950 to-teal-900/20" />
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm">Новая коллекция 2025</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
              Роскошь в каждой
              <span className="block text-emerald-400">детали</span>
            </h1>

            <p className="text-lg text-zinc-400 mb-8 max-w-md">
              Эксклюзивные украшения и аксессуары от лучших мировых домов моды. 
              Виртуальная примерка с AR-технологией.
            </p>

            <div className="flex flex-wrap gap-4">
              <GradientButton className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4">
                Смотреть коллекцию
                <ArrowRight className="w-5 h-5 ml-2" />
              </GradientButton>
              <button className="px-8 py-4 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2">
                <Video className="w-5 h-5" />
                Виртуальный тур
              </button>
            </div>
          </motion.div>

          {/* Hero product with 360° rotation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <Product360Viewer 
              rotation={heroRotation}
              setRotation={setHeroRotation}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
            />
          </motion.div>
        </div>
      </section>

      {/* AR Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <ARBadge variant="banner" />
        </div>
      </section>

      {/* Virtual Showroom */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-serif mb-4">
                Виртуальный <span className="text-emerald-400">шоурум</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Исследуйте коллекцию в галерейном формате с возможностью AR-примерки
              </p>
            </div>
          </ScrollReveal>

          {/* Products grid with 360° */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <ProductCard360
                key={product.id}
                product={product}
                index={i}
                onSelect={setSelectedProduct}
                onOpen360={(id) => setSelectedProduct(id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Personalization */}
      <section className="py-16 px-6 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-serif mb-2">Рекомендации для вас</h2>
                <p className="text-sm text-zinc-500">На основе ваших предпочтений</p>
              </div>
              <div className="flex gap-2">
                {recommendations.map((rec) => (
                  <button
                    key={rec.id}
                    className="px-4 py-2 rounded-full text-sm bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                  >
                    {rec.name}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {products.slice(0, 4).map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-64"
              >
                <div className="aspect-square rounded-xl bg-zinc-800 mb-3" />
                <p className="text-sm font-medium text-white">{product.name}</p>
                <p className="text-sm text-emerald-400">{product.price.toLocaleString()} ₽</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Consultation */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/20 p-12 text-center overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-emerald-400" />
              </div>

              <h2 className="text-3xl font-serif mb-4">Персональная консультация</h2>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Свяжитесь с нашим экспертом для индивидуального подбора украшений 
                в режиме видеозвонка
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <button className="flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors">
                  <Video className="w-5 h-5" />
                  Видеоконсультация
                </button>
                <button className="flex items-center gap-2 px-8 py-4 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                  <Phone className="w-5 h-5" />
                  Заказать звонок
                </button>
              </div>

              <p className="text-xs text-zinc-500 mt-6">
                Время работы: 10:00 - 22:00 (МСК)
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Size Guide & Shipping */}
      <section className="py-16 px-6 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Size Guide */}
          <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
            <h3 className="text-xl font-serif mb-4">Подбор размера</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Воспользуйтесь нашим гидом для точного определения размера
            </p>
            <SizeGuideButton onClick={() => setShowSizeGuide(true)} />
          </div>

          {/* Shipping Calculator */}
          <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
            <h3 className="text-xl font-serif mb-4">Расчёт доставки</h3>
            <div className="space-y-3 mb-6">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => setSelectedCity(city.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    selectedCity === city.id
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className={`w-4 h-4 ${selectedCity === city.id ? "text-emerald-400" : "text-zinc-500"}`} />
                    <span className="text-sm">{city.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{city.price === 0 ? "Бесплатно" : `${city.price} ₽`}</p>
                    <p className="text-xs text-zinc-500">{city.days} дней</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-serif mb-6">Недавно просмотренные</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentlyViewed.map((product) => (
              <div key={product.id} className="group">
                <div className="aspect-square rounded-xl bg-zinc-900 border border-zinc-800 mb-2 group-hover:border-emerald-500/30 transition-colors" />
                <p className="text-sm text-zinc-400 truncate">{product.name}</p>
                <p className="text-sm text-emerald-400">{product.price.toLocaleString()} ₽</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                <span className="font-serif text-xl">Premium Gallery</span>
              </div>
              <p className="text-sm text-zinc-500">
                Эксклюзивные украшения и аксессуары от мировых брендов
              </p>
            </div>
            {[
              { title: "Каталог", links: ["Украшения", "Часы", "Аксессуары", "Новинки"] },
              { title: "Сервис", links: ["Доставка", "Оплата", "Возврат", "Гарантия"] },
              { title: "Компания", links: ["О нас", "Бутики", "Карьера", "Контакты"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-medium mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">© 2025 Premium Gallery. Все права защищены.</p>
            <div className="flex items-center gap-6">
              {[Shield, Truck, Award].map((Icon, i) => (
                <Icon key={i} className="w-5 h-5 text-zinc-600" />
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
    </div>
  );
};
