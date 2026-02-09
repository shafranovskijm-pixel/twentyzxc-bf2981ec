import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Star, Heart, ShoppingBag, Search, 
  ChevronRight, Award, Truck, Users, Package, Shield,
  TrendingUp, Camera, Check, MapPin
} from "lucide-react";
import { Template } from "@/data/templates";
import { ScrollReveal, AnimatedCounter, GradientButton, LiveChatWidget } from "../shared";
import { ImageWithFallback } from "../../ImageWithFallback";

// Local images
import artisan1 from "@/assets/templates/artisan-market/artisan-1.jpg";
import artisan2 from "@/assets/templates/artisan-market/artisan-2.jpg";
import artisan3 from "@/assets/templates/artisan-market/artisan-3.jpg";
import product1 from "@/assets/templates/artisan-market/product-1.jpg";
import product2 from "@/assets/templates/artisan-market/product-2.jpg";
import product3 from "@/assets/templates/artisan-market/product-3.jpg";
import product4 from "@/assets/templates/artisan-market/product-4.jpg";
import product5 from "@/assets/templates/artisan-market/product-5.jpg";
import product6 from "@/assets/templates/artisan-market/product-6.jpg";

const artisanImages = [artisan1, artisan2, artisan3];
const productImages = [product1, product2, product3, product4, product5, product6];

interface ArtisanMarketPreviewProps {
  template: Template;
}

export const ArtisanMarketPreview = ({ template }: ArtisanMarketPreviewProps) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [likedProducts, setLikedProducts] = useState<string[]>([]);

  const categories = [
    { id: "all", name: "Все", icon: "✨" },
    { id: "ceramics", name: "Керамика", icon: "🏺" },
    { id: "textile", name: "Текстиль", icon: "🧶" },
    { id: "jewelry", name: "Украшения", icon: "💍" },
    { id: "wood", name: "Дерево", icon: "🪵" },
    { id: "leather", name: "Кожа", icon: "👜" },
  ];

  const featuredArtisans = [
    { id: "1", name: "Мария Иванова", specialty: "Керамика", rating: 4.9, sales: 234, avatar: "", location: "Москва" },
    { id: "2", name: "Алексей Петров", specialty: "Изделия из дерева", rating: 5.0, sales: 189, avatar: "", location: "Санкт-Петербург" },
    { id: "3", name: "Елена Смирнова", specialty: "Украшения", rating: 4.8, sales: 312, avatar: "", location: "Казань" },
  ];

  const products = [
    { id: "1", name: "Керамическая ваза", price: 4500, artisan: "Мария И.", rating: 4.9, reviews: 23, handmade: true, image: "" },
    { id: "2", name: "Кожаная сумка", price: 8900, artisan: "Дмитрий К.", rating: 5.0, reviews: 45, handmade: true, image: "" },
    { id: "3", name: "Деревянная шкатулка", price: 3200, artisan: "Алексей П.", rating: 4.7, reviews: 18, handmade: true, image: "" },
    { id: "4", name: "Льняной плед", price: 6700, artisan: "Ольга В.", rating: 4.8, reviews: 31, handmade: true, image: "" },
    { id: "5", name: "Серебряные серьги", price: 5400, artisan: "Елена С.", rating: 5.0, reviews: 67, handmade: true, image: "" },
    { id: "6", name: "Глиняный горшок", price: 2800, artisan: "Мария И.", rating: 4.6, reviews: 12, handmade: true, image: "" },
  ];

  const reviews = [
    { id: "1", author: "Анна К.", text: "Замечательная ваза! Качество на высоте, мастер очень внимательный.", rating: 5, hasPhoto: true },
    { id: "2", author: "Иван М.", text: "Получил шкатулку за 3 дня. Упаковано идеально, вещь потрясающая!", rating: 5, hasPhoto: true },
    { id: "3", author: "Светлана Д.", text: "Уже третий заказ на этой площадке. Все мастера профессионалы.", rating: 5, hasPhoto: false },
  ];

  const stats = [
    { value: 2500, suffix: "+", label: "Мастеров" },
    { value: 15000, suffix: "+", label: "Товаров" },
    { value: 50000, suffix: "+", label: "Покупателей" },
    { value: 98, suffix: "%", label: "Довольных клиентов" },
  ];

  const toggleLike = (productId: string) => {
    setLikedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 text-zinc-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-zinc-800">Artisan Market</span>
          </div>
          
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Найти товар или мастера..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-sm focus:outline-none focus:border-orange-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2">
              <Heart className="w-5 h-5 text-zinc-600" />
              {likedProducts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                  {likedProducts.length}
                </span>
              )}
            </button>
            <button className="relative p-2">
              <ShoppingBag className="w-5 h-5 text-zinc-600" />
            </button>
            <button className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors">
              Войти
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-orange-200 rounded-full opacity-50" />
        <div className="absolute bottom-10 right-10 w-32 h-32 border-2 border-dashed border-amber-300 rounded-full opacity-40" />
        
        {/* Hand-drawn style decorations */}
        <svg className="absolute top-20 right-1/4 w-16 h-16 text-orange-300 opacity-40" viewBox="0 0 100 100">
          <path d="M10,50 Q30,20 50,50 T90,50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
        </svg>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6"
          >
            <Award className="w-4 h-4" />
            Более 2500 проверенных мастеров
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Уникальные вещи от
            <span className="text-orange-600 block mt-2">настоящих мастеров</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-600 mb-8 max-w-2xl mx-auto"
          >
            Маркетплейс изделий ручной работы. Каждый товар создан с душой 
            и любовью к своему делу.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <GradientButton className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg">
              Смотреть каталог
              <ChevronRight className="w-5 h-5 ml-2" />
            </GradientButton>
            <button className="px-8 py-4 rounded-xl border-2 border-orange-300 text-orange-700 font-medium hover:bg-orange-50 transition-colors">
              Стать мастером
            </button>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2} />
              </p>
              <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Categories */}
      <section className="py-8 px-6 overflow-x-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-3 min-w-max justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                    : "bg-white text-zinc-700 hover:bg-orange-50 border border-orange-100"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Artisans */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-800">Лучшие мастера</h2>
                <p className="text-zinc-500 mt-1">Проверенные профессионалы своего дела</p>
              </div>
              <button className="text-orange-600 font-medium flex items-center gap-1 hover:underline">
                Все мастера <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredArtisans.map((artisan, i) => (
              <motion.div
                key={artisan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-6 border border-orange-100 hover:shadow-xl hover:shadow-orange-500/10 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <ImageWithFallback
                      src={artisanImages[i]}
                      alt={artisan.name}
                      className="w-full h-full rounded-full"
                      aspectRatio="square"
                      fallbackGradient="from-orange-200 to-amber-200"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-800">{artisan.name}</h3>
                    <p className="text-sm text-zinc-500">{artisan.specialty}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-zinc-400" />
                      <span className="text-xs text-zinc-400">{artisan.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-orange-50">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium">{artisan.rating}</span>
                  </div>
                  <span className="text-sm text-zinc-500">{artisan.sales} продаж</span>
                  <button className="px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-sm font-medium hover:bg-orange-100 transition-colors">
                    Подписаться
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-800">Новинки каталога</h2>
                <p className="text-zinc-500 mt-1">Только что добавленные товары</p>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                  <ImageWithFallback
                    src={productImages[i]}
                    alt={product.name}
                    className="w-full h-full"
                    aspectRatio="square"
                    fallbackGradient="from-orange-100 to-amber-100"
                  />
                  
                  {/* Handmade badge */}
                  {product.handmade && (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-orange-600 flex items-center gap-1">
                      <span>✋</span> Handmade
                    </div>
                  )}
                  
                  {/* Like button */}
                  <button
                    onClick={() => toggleLike(product.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110"
                  >
                    <Heart 
                      className={`w-4 h-4 transition-colors ${
                        likedProducts.includes(product.id) 
                          ? "text-red-500 fill-red-500" 
                          : "text-zinc-400"
                      }`} 
                    />
                  </button>

                  {/* Quick add */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute bottom-3 left-3 right-3 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    В корзину
                  </motion.button>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                    </div>
                    <span className="text-xs text-zinc-400">({product.reviews})</span>
                  </div>
                  <h3 className="font-medium text-zinc-800 mb-1">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-600">{product.price.toLocaleString()} ₽</span>
                    <span className="text-xs text-zinc-500">{product.artisan}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seller Dashboard Preview */}
      <section className="py-16 px-6 bg-gradient-to-br from-orange-500 to-amber-500 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Продавайте свои изделия
              </h2>
              <p className="text-orange-100 mb-6">
                Присоединяйтесь к сообществу мастеров и начните зарабатывать 
                на своём творчестве. Удобный личный кабинет, аналитика продаж, 
                прямая связь с покупателями.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Комиссия всего 5% от продаж",
                  "Встроенная аналитика и статистика",
                  "Чат с покупателями",
                  "Продвижение в каталоге",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button className="px-8 py-4 rounded-xl bg-white text-orange-600 font-bold hover:bg-orange-50 transition-colors">
                Стать продавцом
              </button>
            </div>

            {/* Dashboard mock */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 text-zinc-800 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Кабинет продавца</h3>
                <span className="text-xs text-zinc-500">Февраль 2025</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-orange-50">
                  <p className="text-sm text-zinc-500">Продажи</p>
                  <p className="text-2xl font-bold text-orange-600">₽ 127,450</p>
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +23%
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-amber-50">
                  <p className="text-sm text-zinc-500">Заказы</p>
                  <p className="text-2xl font-bold text-amber-600">48</p>
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +12%
                  </span>
                </div>
              </div>
              {/* Mini chart */}
              <div className="h-24 flex items-end gap-1">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05 }}
                    className="flex-1 bg-gradient-to-t from-orange-500 to-amber-400 rounded-t"
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-800">Отзывы покупателей</h2>
              <p className="text-zinc-500 mt-2">Реальные истории наших клиентов</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-orange-100"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-zinc-700 mb-4">"{review.text}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-orange-50">
                  <span className="font-medium text-zinc-800">{review.author}</span>
                  {review.hasPhoto && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Camera className="w-3 h-3" /> С фото
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-6 bg-orange-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Гарантия качества", desc: "Проверенные мастера" },
              { icon: Truck, title: "Быстрая доставка", desc: "По всей России" },
              { icon: Award, title: "100% Handmade", desc: "Уникальные изделия" },
              { icon: Users, title: "Поддержка 24/7", desc: "Всегда на связи" },
            ].map((badge, i) => (
              <motion.div
                key={badge.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                  <badge.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-zinc-800 text-sm">{badge.title}</h4>
                <p className="text-xs text-zinc-500 mt-1">{badge.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-zinc-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">Artisan Market</span>
              </div>
              <p className="text-sm text-zinc-400">
                Маркетплейс уникальных изделий ручной работы от проверенных мастеров
              </p>
            </div>
            {[
              { title: "Покупателям", links: ["Каталог", "Мастера", "Акции", "Доставка"] },
              { title: "Продавцам", links: ["Стать мастером", "Тарифы", "Обучение", "FAQ"] },
              { title: "Компания", links: ["О нас", "Блог", "Вакансии", "Контакты"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-zinc-800 text-center text-sm text-zinc-500">
            © 2025 Artisan Market. Все права защищены.
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <LiveChatWidget />
    </div>
  );
};
