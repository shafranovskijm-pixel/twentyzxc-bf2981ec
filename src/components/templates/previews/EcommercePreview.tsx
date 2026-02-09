import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Search, Heart, User, Star, ChevronRight, Filter } from "lucide-react";

interface EcommercePreviewProps {
  template: Template;
}

export const EcommercePreview = ({ template }: EcommercePreviewProps) => {
  const accentClass = template.accentColor.replace('bg-', '');
  
  const products = [
    { name: "Premium Collection", price: "45 000 ₽", oldPrice: "55 000 ₽", rating: 4.9 },
    { name: "Limited Edition", price: "32 000 ₽", rating: 4.8 },
    { name: "Classic Style", price: "28 000 ₽", rating: 4.7 },
    { name: "New Arrival", price: "38 000 ₽", badge: "Новинка", rating: 5.0 },
    { name: "Bestseller", price: "42 000 ₽", badge: "Хит", rating: 4.9 },
    { name: "Exclusive", price: "65 000 ₽", rating: 4.8 },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${template.gradient}`}>
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
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl ${template.accentColor} flex items-center justify-center`}>
                <ShoppingBag className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-xl text-white">LUXE</span>
            </div>
            
            <nav className="hidden lg:flex items-center gap-8">
              {["Каталог", "Новинки", "Бренды", "Sale", "О нас"].map((item) => (
                <a key={item} href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                  {item}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text" 
                  placeholder="Поиск товаров..." 
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-white/70 hover:text-white transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="text-white/70 hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </button>
              <button className="relative text-white/70 hover:text-white transition-colors">
                <ShoppingBag className="w-5 h-5" />
                <span className={`absolute -top-2 -right-2 w-5 h-5 ${template.accentColor} rounded-full text-xs text-black flex items-center justify-center font-medium`}>
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${template.gradient} opacity-50`} />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <div className={`inline-block px-4 py-1 rounded-full ${template.accentColor} text-black text-sm font-medium mb-6`}>
              Новая коллекция 2024
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Откройте мир <span className={`text-${accentClass}`}>роскоши</span>
            </h1>
            <p className="text-lg text-white/60 mb-8">
              Эксклюзивные товары от ведущих мировых брендов с доставкой по всей России
            </p>
            <Button size="lg" className={`${template.accentColor} text-black hover:opacity-90`}>
              Смотреть коллекцию
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {["Все", "Одежда", "Обувь", "Аксессуары", "Сумки", "Украшения", "Часы"].map((cat, i) => (
              <Button 
                key={cat} 
                variant={i === 0 ? "default" : "outline"}
                className={i === 0 ? `${template.accentColor} text-black` : "border-white/20 text-white hover:bg-white/10"}
              >
                {cat}
              </Button>
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
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <div key={i} className="group">
                <div className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden mb-4">
                  {product.badge && (
                    <div className={`absolute top-4 left-4 px-3 py-1 ${template.accentColor} text-black text-xs font-medium rounded-full`}>
                      {product.badge}
                    </div>
                  )}
                  <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button className={`w-full ${template.accentColor} text-black hover:opacity-90`}>
                      В корзину
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <Star className={`w-4 h-4 text-${accentClass} fill-current`} />
                  <span className="text-white/60 text-sm">{product.rating}</span>
                </div>
                <h3 className="font-medium text-white mb-2">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-${accentClass}`}>{product.price}</span>
                  {product.oldPrice && (
                    <span className="text-white/40 line-through text-sm">{product.oldPrice}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
              Показать ещё
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Бесплатная доставка", desc: "При заказе от 10 000 ₽" },
              { title: "Гарантия качества", desc: "Только оригинальные товары" },
              { title: "Возврат 30 дней", desc: "Простой возврат и обмен" },
              { title: "Поддержка 24/7", desc: "Всегда на связи" },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className={`w-12 h-12 rounded-full ${template.accentColor} mx-auto mb-4 flex items-center justify-center`}>
                  <ShoppingBag className="w-5 h-5 text-black" />
                </div>
                <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                <p className="text-white/50 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Подпишитесь на рассылку</h2>
            <p className="text-white/50 mb-6">Получайте эксклюзивные предложения и новости первыми</p>
            <div className="flex gap-3">
              <input 
                type="email" 
                placeholder="Ваш email" 
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none"
              />
              <Button className={`${template.accentColor} text-black hover:opacity-90`}>
                Подписаться
              </Button>
            </div>
          </div>
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
    </div>
  );
};
