import { useState } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, Search, ChevronRight, ArrowRight, Sparkles, Gift, Truck, RefreshCcw, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerContainer, StaggerItem, LiveChatWidget, InstagramFeed } from "../shared";
import { ImageWithFallback } from "../../ImageWithFallback";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const STORAGE_BASE = "https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/public/template-images";

interface LuxeBoutiquePreviewProps {
  template: Template;
}

export const LuxeBoutiquePreview = ({ template }: LuxeBoutiquePreviewProps) => {
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const products = [
    { id: 1, name: "Silk Essence Dress", price: "45 900 ₽", category: "Платья", badge: "New", colors: ["rose", "ivory"] },
    { id: 2, name: "Velvet Evening Gown", price: "78 500 ₽", category: "Вечерние", colors: ["black", "burgundy"] },
    { id: 3, name: "Cashmere Coat", price: "125 000 ₽", category: "Верхняя одежда", badge: "Exclusive", colors: ["camel", "gray"] },
    { id: 4, name: "Leather Handbag", price: "65 000 ₽", category: "Аксессуары", colors: ["black", "nude"] },
    { id: 5, name: "Pearl Necklace", price: "35 000 ₽", category: "Украшения", colors: ["white", "cream"] },
    { id: 6, name: "Silk Blouse", price: "28 500 ₽", category: "Блузы", badge: "Bestseller", colors: ["white", "blush"] },
  ];

  const categories = ["New In", "Dresses", "Outerwear", "Accessories", "Jewelry", "Sale"];

  const toggleWishlist = (id: number) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50 text-gray-900 relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(244,114,182,0.1) 1px, transparent 0)`,
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 border-b border-rose-100 bg-white/90 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Top bar */}
        <div className="border-b border-rose-100 py-2 bg-rose-50">
          <div className="container mx-auto px-6 flex items-center justify-between text-xs text-gray-500">
            <span>Бесплатная доставка от 15 000 ₽</span>
            <span className="hidden md:block">Примерка перед покупкой</span>
            <span>+7 (800) 123-45-67</span>
          </div>
        </div>

        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="text-2xl font-light tracking-[0.3em] text-rose-400"
            whileHover={{ scale: 1.02 }}
          >
            LUXE
          </motion.div>

          <nav className="hidden lg:flex items-center gap-8">
            {categories.map((cat, i) => (
              <motion.a 
                key={cat}
                href="#"
                className="text-sm text-gray-600 hover:text-rose-500 transition-colors"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                {cat}
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <motion.button 
              className="text-gray-600 hover:text-rose-500 transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              <Search className="w-5 h-5" />
            </motion.button>
            <motion.button 
              className="relative text-gray-600 hover:text-rose-500 transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full text-xs text-white flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </motion.button>
            
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <motion.button 
                  className="relative text-gray-600 hover:text-rose-500 transition-colors"
                  whileHover={{ scale: 1.1 }}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full text-xs text-white flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </motion.button>
              </SheetTrigger>
              <SheetContent className="bg-white border-rose-100 w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="text-gray-900">Корзина</SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col items-center justify-center h-48 text-gray-400">
                  <ShoppingBag className="w-16 h-16 mb-4 text-rose-200" />
                  <p>Ваша корзина пуста</p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <ScrollReveal>
                <motion.div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 mb-6"
                  whileHover={{ scale: 1.05 }}
                >
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span className="text-sm text-rose-600">Новая коллекция 2024</span>
                </motion.div>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-light leading-tight mb-6 text-gray-900">
                  Изысканный стиль для <span className="text-rose-500 font-normal">особенных</span> моментов
                </h1>
              </ScrollReveal>

              <ScrollReveal delay={0.4}>
                <p className="text-lg text-gray-500 mb-8">
                  Откройте коллекцию премиальных нарядов от ведущих дизайнеров
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.6}>
                <div className="flex flex-wrap gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white px-8 rounded-none">
                      Смотреть коллекцию
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                  <Button size="lg" variant="outline" className="border-rose-200 text-rose-500 hover:bg-rose-50 rounded-none">
                    Lookbook
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal direction="right" delay={0.4}>
              <div className="relative">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden">
                  <ImageWithFallback
                    src={`${STORAGE_BASE}/luxe-boutique/hero.png`}
                    alt="Fashion Preview"
                    className="w-full h-full"
                    aspectRatio="portrait"
                    fallbackGradient="from-rose-100 to-rose-200"
                  />
                </div>
                {/* Floating badge */}
                <motion.div 
                  className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-xl border border-rose-100"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="text-rose-500 text-2xl font-bold">-30%</div>
                  <div className="text-gray-400 text-xs">на новинки</div>
                </motion.div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-y border-rose-100">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Truck, text: "Бесплатная доставка" },
              { icon: RefreshCcw, text: "Возврат 14 дней" },
              { icon: Gift, text: "Подарочная упаковка" },
              { icon: CreditCard, text: "Рассрочка 0%" },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div 
                key={i}
                className="flex items-center justify-center gap-3 text-gray-600"
                whileHover={{ y: -5, color: "#f43f5e" }}
              >
                <Icon className="w-5 h-5 text-rose-400" />
                <span className="text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-light text-gray-900">
                Бестселлеры
              </h2>
              <a href="#" className="text-rose-500 hover:text-rose-600 flex items-center gap-1 text-sm">
                Смотреть все
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.1}>
            {products.map((product, i) => (
              <StaggerItem key={product.id}>
                <motion.div 
                  className="group cursor-pointer"
                  whileHover={{ y: -8 }}
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden border border-rose-100 relative mb-4 group-hover:shadow-xl transition-all">
                    {product.badge && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-rose-500 text-white text-xs rounded-full z-10">
                        {product.badge}
                      </div>
                    )}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center z-10 hover:bg-white transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Heart className={`w-5 h-5 ${wishlist.includes(product.id) ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                    </motion.button>
                    
                    <ImageWithFallback
                      src={`${STORAGE_BASE}/luxe-boutique/product-${i + 1}.png`}
                      alt={product.name}
                      className="w-full h-full"
                      aspectRatio="portrait"
                      fallbackGradient="from-rose-50 to-white"
                    />
                    
                    {/* Quick add button */}
                    <motion.div 
                      className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ y: 20 }}
                      whileHover={{ y: 0 }}
                    >
                      <Button className="w-full bg-white text-gray-900 hover:bg-rose-500 hover:text-white border border-rose-100 rounded-none">
                        В корзину
                      </Button>
                    </motion.div>
                  </div>
                  
                  <div className="px-1">
                    <p className="text-xs text-rose-400 mb-1">{product.category}</p>
                    <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-light text-rose-500">{product.price}</span>
                      <div className="flex gap-1">
                        {product.colors.map((color, ci) => (
                          <div 
                            key={ci}
                            className={`w-4 h-4 rounded-full border border-gray-200 ${
                              color === "rose" ? "bg-rose-300" :
                              color === "ivory" ? "bg-amber-50" :
                              color === "black" ? "bg-gray-900" :
                              color === "burgundy" ? "bg-red-900" :
                              color === "camel" ? "bg-amber-600" :
                              color === "gray" ? "bg-gray-400" :
                              color === "nude" ? "bg-amber-100" :
                              color === "white" ? "bg-white" :
                              color === "cream" ? "bg-amber-50" :
                              "bg-rose-100"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Instagram Feed */}
      <section className="py-20 bg-rose-50">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-2">@luxeboutique</h2>
              <p className="text-gray-500">Подпишитесь на нас в Instagram</p>
            </div>
          </ScrollReveal>
          <InstagramFeed />
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 border-t border-rose-100">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-3xl font-light text-gray-900 mb-4">Будьте в курсе</h2>
              <p className="text-gray-500 mb-8">
                Подпишитесь на нашу рассылку и получите скидку 10% на первый заказ
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Ваш email"
                  className="flex-1 px-4 py-3 border border-rose-200 rounded-none focus:border-rose-500 outline-none"
                />
                <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-none px-8">
                  Подписаться
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-rose-100 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-light tracking-[0.3em] text-rose-400 mb-4">LUXE</div>
              <p className="text-gray-500 text-sm">Изысканная мода для ценителей стиля</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Магазин</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>Новинки</li>
                <li>Платья</li>
                <li>Верхняя одежда</li>
                <li>Аксессуары</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Помощь</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>Доставка</li>
                <li>Возврат</li>
                <li>Размеры</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Контакты</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li>+7 (800) 123-45-67</li>
                <li>hello@luxe.ru</li>
                <li>Москва, ул. Петровка 15</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-rose-100 pt-8 text-center text-gray-400 text-sm">
            © 2024 Luxe Boutique. Все права защищены.
          </div>
        </div>
      </footer>

      <LiveChatWidget accentColor="bg-rose-500" />
    </div>
  );
};
