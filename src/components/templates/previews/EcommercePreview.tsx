import { useState, useEffect, useCallback } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Search, Heart, User, Star, ChevronRight, Filter, X, Plus, Minus, Trash2, Check, Clock, Truck, Shield, RefreshCcw, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter, ScrollReveal, StaggerContainer, StaggerItem, TiltCard } from "./shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import useEmblaCarousel from "embla-carousel-react";

interface EcommercePreviewProps {
  template: Template;
}

interface Product {
  id: number;
  name: string;
  price: string;
  priceNum: number;
  oldPrice?: string;
  rating: number;
  badge?: string;
  colors: string[];
  sizes: string[];
  description: string;
}

interface CartItem extends Product {
  quantity: number;
  selectedColor: string;
  selectedSize: string;
}

export const EcommercePreview = ({ template }: EcommercePreviewProps) => {
  const accentClass = template.accentColor.replace('bg-', '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [countdown, setCountdown] = useState({ h: 23, m: 59, s: 59 });
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  
  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
        return { h: 23, m: 59, s: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const products: Product[] = [
    { id: 1, name: "Premium Collection", price: "45 000 ₽", priceNum: 45000, oldPrice: "55 000 ₽", rating: 4.9, colors: ["black", "white", "beige"], sizes: ["S", "M", "L", "XL"], description: "Эксклюзивная коллекция премиального качества из натуральных материалов" },
    { id: 2, name: "Limited Edition", price: "32 000 ₽", priceNum: 32000, rating: 4.8, colors: ["navy", "gray"], sizes: ["M", "L"], description: "Лимитированная серия с уникальным дизайном" },
    { id: 3, name: "Classic Style", price: "28 000 ₽", priceNum: 28000, rating: 4.7, colors: ["white", "black"], sizes: ["S", "M", "L"], description: "Классический стиль для повседневной носки" },
    { id: 4, name: "New Arrival", price: "38 000 ₽", priceNum: 38000, badge: "Новинка", rating: 5.0, colors: ["beige", "brown"], sizes: ["M", "L", "XL"], description: "Новинка сезона с актуальным кроем" },
    { id: 5, name: "Bestseller", price: "42 000 ₽", priceNum: 42000, badge: "Хит", rating: 4.9, colors: ["black", "white", "gray"], sizes: ["S", "M", "L", "XL"], description: "Бестселлер среди наших клиентов" },
    { id: 6, name: "Exclusive", price: "65 000 ₽", priceNum: 65000, rating: 4.8, colors: ["gold", "silver"], sizes: ["M", "L"], description: "Эксклюзивный товар ручной работы" },
  ];

  const categories = ["Все", "Одежда", "Обувь", "Аксессуары", "Сумки", "Украшения"];

  const toggleWishlist = (id: number) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { 
        ...product, 
        quantity: 1, 
        selectedColor: product.colors[selectedColor] || product.colors[0],
        selectedSize: product.sizes[selectedSize] || product.sizes[0]
      }]);
    }
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return newQty === 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.priceNum * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const colorMap: Record<string, string> = {
    black: "bg-black", white: "bg-white", beige: "bg-amber-200", navy: "bg-blue-900",
    gray: "bg-gray-500", brown: "bg-amber-800", gold: "bg-yellow-500", silver: "bg-gray-300"
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${template.gradient}`}>
      {/* Promo Banner */}
      <div className={`${template.accentColor} text-black py-2 text-center text-sm font-medium`}>
        <div className="container mx-auto px-6 flex items-center justify-center gap-4">
          <span>🔥 РАСПРОДАЖА: Скидки до 50% заканчиваются через</span>
          <div className="flex gap-1 font-mono font-bold">
            <span className="bg-black/20 px-2 py-0.5 rounded">{String(countdown.h).padStart(2, '0')}</span>:
            <span className="bg-black/20 px-2 py-0.5 rounded">{String(countdown.m).padStart(2, '0')}</span>:
            <span className="bg-black/20 px-2 py-0.5 rounded">{String(countdown.s).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6">
          {/* Top bar */}
          <div className="py-2 border-b border-white/10 flex justify-between text-xs text-white/50">
            <span>Бесплатная доставка от 10 000 ₽</span>
            <span>+7 (800) 123-45-67</span>
          </div>
          {/* Main nav */}
          <div className="py-4 flex items-center justify-between gap-8">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className={`w-10 h-10 rounded-xl ${template.accentColor} flex items-center justify-center`}>
                <ShoppingBag className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-xl text-white">LUXE</span>
            </motion.div>
            
            <nav className="hidden lg:flex items-center gap-8">
              {["Каталог", "Новинки", "Бренды", "Sale", "О нас"].map((item) => (
                <a key={item} href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium relative group">
                  {item}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-${accentClass} group-hover:w-full transition-all`} />
                </a>
              ))}
            </nav>

            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text" 
                  placeholder="Поиск товаров..." 
                  onFocus={() => setSearchOpen(true)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <motion.button 
                className="text-white/70 hover:text-white transition-colors relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className={`absolute -top-2 -right-2 w-4 h-4 ${template.accentColor} rounded-full text-xs text-black flex items-center justify-center`}>
                    {wishlist.length}
                  </span>
                )}
              </motion.button>
              <button className="text-white/70 hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </button>
              
              {/* Cart Sheet */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <motion.button 
                    className="relative text-white/70 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {cartCount > 0 && (
                      <motion.span 
                        className={`absolute -top-2 -right-2 w-5 h-5 ${template.accentColor} rounded-full text-xs text-black flex items-center justify-center font-medium`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        key={cartCount}
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </motion.button>
                </SheetTrigger>
                <SheetContent className="bg-zinc-900 border-white/10 text-white w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle className="text-white">Корзина ({cartCount})</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col h-[calc(100vh-200px)]">
                    {cart.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center flex-col gap-4">
                        <ShoppingBag className="w-16 h-16 text-white/20" />
                        <p className="text-white/50">Корзина пуста</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-auto space-y-4">
                          <AnimatePresence>
                            {cart.map((item) => (
                              <motion.div 
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex gap-4 p-4 bg-white/5 rounded-xl"
                              >
                                <div className="w-20 h-24 rounded-lg bg-white/10" />
                                <div className="flex-1">
                                  <h4 className="font-medium">{item.name}</h4>
                                  <p className="text-white/50 text-sm">{item.selectedSize} / {item.selectedColor}</p>
                                  <p className={`text-${accentClass} font-medium mt-1`}>{item.price}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <button 
                                      onClick={() => updateQuantity(item.id, -1)}
                                      className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center">{item.quantity}</span>
                                    <button 
                                      onClick={() => updateQuantity(item.id, 1)}
                                      className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setCart(cart.filter(x => x.id !== item.id))}
                                  className="text-white/40 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                        <div className="border-t border-white/10 pt-4 mt-4">
                          <div className="flex justify-between mb-4">
                            <span className="text-white/70">Итого:</span>
                            <span className="text-xl font-bold">{cartTotal.toLocaleString()} ₽</span>
                          </div>
                          <Button className={`w-full ${template.accentColor} text-black hover:opacity-90`}>
                            Оформить заказ
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${template.gradient} opacity-50`} />
        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal>
            <div className="max-w-2xl">
              <motion.div 
                className={`inline-block px-4 py-1 rounded-full ${template.accentColor} text-black text-sm font-medium mb-6`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                Новая коллекция 2024
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Откройте мир <span className={`text-${accentClass}`}>роскоши</span>
              </h1>
              <p className="text-lg text-white/60 mb-8">
                Эксклюзивные товары от ведущих мировых брендов с доставкой по всей России
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className={`${template.accentColor} text-black hover:opacity-90`}>
                  Смотреть коллекцию
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Categories */}
      <section className="py-6 border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {categories.map((cat, i) => (
              <motion.button
                key={cat}
                onClick={() => setSelectedCategory(i)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  i === selectedCategory 
                    ? `${template.accentColor} text-black` 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Популярные товары</h2>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Filter className="w-4 h-4 mr-2" />
              Фильтры
            </Button>
          </div>
          
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
            {products.map((product, i) => (
              <StaggerItem key={product.id}>
                <motion.div 
                  className="group cursor-pointer"
                  whileHover={{ y: -8 }}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden mb-4 group-hover:border-white/20 transition-all">
                    {product.badge && (
                      <motion.div 
                        className={`absolute top-4 left-4 px-3 py-1 ${template.accentColor} text-black text-xs font-medium rounded-full z-10`}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                      >
                        {product.badge}
                      </motion.div>
                    )}
                    <motion.button 
                      className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                        wishlist.includes(product.id) 
                          ? `${template.accentColor}` 
                          : "bg-black/50 opacity-0 group-hover:opacity-100"
                      }`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? "text-black fill-current" : "text-white"}`} />
                    </motion.button>
                    
                    {/* Image placeholder with zoom effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:scale-110 transition-transform duration-500" />
                    
                    {/* Quick add overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <Button 
                        className={`w-full ${template.accentColor} text-black hover:opacity-90`}
                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                      >
                        В корзину
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className={`w-4 h-4 text-${accentClass} fill-current`} />
                    <span className="text-white/60 text-sm">{product.rating}</span>
                  </div>
                  <h3 className="font-medium text-white mb-2 group-hover:text-white/80 transition-colors">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-${accentClass}`}>{product.price}</span>
                    {product.oldPrice && (
                      <span className="text-white/40 line-through text-sm">{product.oldPrice}</span>
                    )}
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
              Показать ещё
            </Button>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-3xl">
          {selectedProduct && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square rounded-xl bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              </div>
              <div>
                <DialogHeader>
                  <DialogTitle className="text-2xl text-white">{selectedProduct.name}</DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-2 mt-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(selectedProduct.rating) ? `text-${accentClass} fill-current` : "text-white/20"}`} />
                    ))}
                  </div>
                  <span className="text-white/50 text-sm">{selectedProduct.rating} / 5</span>
                </div>
                <p className="text-white/60 mb-6">{selectedProduct.description}</p>
                
                {/* Color selector */}
                <div className="mb-6">
                  <div className="text-sm text-white/70 mb-2">Цвет:</div>
                  <div className="flex gap-2">
                    {selectedProduct.colors.map((color, i) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(i)}
                        className={`w-8 h-8 rounded-full ${colorMap[color]} border-2 ${i === selectedColor ? `border-${accentClass}` : "border-transparent"} transition-all`}
                      />
                    ))}
                  </div>
                </div>

                {/* Size selector */}
                <div className="mb-6">
                  <div className="text-sm text-white/70 mb-2">Размер:</div>
                  <div className="flex gap-2">
                    {selectedProduct.sizes.map((size, i) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(i)}
                        className={`w-12 h-10 rounded-lg border text-sm font-medium transition-all ${
                          i === selectedSize 
                            ? `${template.accentColor} text-black border-transparent` 
                            : "border-white/20 text-white hover:border-white/40"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mb-6">
                  <span className={`text-3xl font-bold text-${accentClass}`}>{selectedProduct.price}</span>
                  {selectedProduct.oldPrice && (
                    <span className="text-white/40 line-through">{selectedProduct.oldPrice}</span>
                  )}
                </div>

                <Button 
                  className={`w-full ${template.accentColor} text-black hover:opacity-90 py-6`}
                  onClick={() => addToCart(selectedProduct)}
                >
                  Добавить в корзину
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Trust Badges */}
      <section className="py-16 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-6">
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.1}>
            {[
              { icon: Truck, title: "Бесплатная доставка", desc: "При заказе от 10 000 ₽" },
              { icon: Shield, title: "Гарантия качества", desc: "Только оригинальные товары" },
              { icon: RefreshCcw, title: "Возврат 30 дней", desc: "Простой возврат и обмен" },
              { icon: Clock, title: "Поддержка 24/7", desc: "Всегда на связи" },
            ].map((feature, i) => (
              <StaggerItem key={i}>
                <motion.div 
                  className="text-center p-4"
                  whileHover={{ y: -5 }}
                >
                  <motion.div 
                    className={`w-14 h-14 rounded-full ${template.accentColor} mx-auto mb-4 flex items-center justify-center`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="w-6 h-6 text-black" />
                  </motion.div>
                  <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                  <p className="text-white/50 text-sm">{feature.desc}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Подпишитесь на рассылку</h2>
              <p className="text-white/50 mb-6">Получайте эксклюзивные предложения и новости первыми</p>
              <div className="flex gap-3">
                <input 
                  type="email" 
                  placeholder="Ваш email" 
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className={`${template.accentColor} text-black hover:opacity-90 px-8`}>
                    Подписаться
                  </Button>
                </motion.div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-lg ${template.accentColor} flex items-center justify-center`}>
                  <ShoppingBag className="w-4 h-4 text-black" />
                </div>
                <span className="font-bold text-white">LUXE</span>
              </div>
              <p className="text-white/50 text-sm">Ваш магазин премиальных товаров</p>
            </div>
            {[
              { title: "Покупателям", links: ["Доставка", "Возврат", "FAQ"] },
              { title: "Компания", links: ["О нас", "Контакты", "Вакансии"] },
              { title: "Категории", links: ["Одежда", "Обувь", "Аксессуары"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            © 2024 LUXE. Все права защищены.
          </div>
        </div>
      </footer>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[100] flex items-start justify-center pt-32"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="w-full max-w-2xl px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
                <input
                  type="text"
                  placeholder="Что вы ищете?"
                  autoFocus
                  className="w-full pl-14 pr-12 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-lg placeholder:text-white/40 focus:border-white/40 outline-none"
                />
                <button 
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-6 text-white/40 text-sm">
                Популярные запросы: <span className="text-white/60">Платья</span>, <span className="text-white/60">Сумки</span>, <span className="text-white/60">Обувь</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
