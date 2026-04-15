import { motion } from "framer-motion";
import { Leaf, Droplets, Sun, Heart, Star, ChevronDown, Phone, Mail, MapPin, Send, Instagram, Facebook } from "lucide-react";
import { useState } from "react";
import { Template } from "@/data/templates";

const benefits = [
  { icon: Leaf, title: "100% Натурально", desc: "Только природные компоненты без химии" },
  { icon: Droplets, title: "Гидратация", desc: "Глубокое увлажнение и питание кожи" },
  { icon: Sun, title: "Энергия природы", desc: "Заряд бодрости на каждый день" },
  { icon: Heart, title: "Забота о вас", desc: "Индивидуальный подход к каждому" },
];

const plans = [
  { name: "Базовый", price: "2 500", features: ["1 процедура", "Консультация", "Рекомендации"], popular: false },
  { name: "Оптимальный", price: "5 900", features: ["3 процедуры", "Диагностика", "Программа ухода", "Скидка 10%"], popular: true },
  { name: "Премиум", price: "12 000", features: ["7 процедур", "Полная диагностика", "Персональный план", "Бонусы"], popular: false },
];

const reviews = [
  { text: "Невероятная атмосфера и результат! Кожа словно ожила.", author: "Анна К.", avatar: "🌿" },
  { text: "Профессиональный подход и натуральная косметика. Рекомендую!", author: "Мария С.", avatar: "🍃" },
  { text: "Хожу уже полгода — эффект потрясающий. Спасибо!", author: "Елена В.", avatar: "🌱" },
];

const faqs = [
  { q: "Какие продукты вы используете?", a: "Мы работаем исключительно с сертифицированной натуральной косметикой без парабенов и сульфатов." },
  { q: "Нужна ли предварительная запись?", a: "Да, рекомендуем записаться заранее. Онлайн-запись доступна 24/7." },
  { q: "Есть ли противопоказания?", a: "Перед первой процедурой мы проводим бесплатную консультацию и аллерготест." },
  { q: "Можно ли купить подарочный сертификат?", a: "Да, сертификаты на любую сумму доступны в нашей студии и онлайн." },
];

export const NatureFlowPreview = ({ template }: { template: Template }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [reviewIdx, setReviewIdx] = useState(0);

  return (
    <div className="font-sans bg-gradient-to-b from-green-50 via-emerald-50/30 to-white text-green-950 overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/80 via-green-50 to-teal-50/60" />
        <motion.div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-emerald-200/40 blur-3xl" animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl" animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} />
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} className="absolute text-emerald-300/30 text-4xl" style={{ top: `${15 + i * 14}%`, left: `${5 + i * 16}%` }} animate={{ y: [-20, 20, -20], rotate: [0, 10, -10, 0] }} transition={{ duration: 4 + i, repeat: Infinity }}>🍃</motion.div>
        ))}
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm mb-6">
            <Leaf className="w-4 h-4" /> Гармония с природой
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-800 via-green-700 to-teal-600 bg-clip-text text-transparent leading-tight">
            Nature Flow
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-lg md:text-xl text-green-700/80 mb-8 max-w-xl mx-auto">
            Откройте силу природы для вашей красоты и здоровья. Натуральный уход, проверенный временем.
          </motion.p>
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-full text-lg font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-105 transition-all">
            Записаться на консультацию
          </motion.button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-emerald-900">Почему выбирают нас</h2>
          <p className="text-center text-green-600/70 mb-12 max-w-lg mx-auto">Мы объединяем традиции и инновации для вашей красоты</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center shadow-sm border border-emerald-100 hover:shadow-md hover:border-emerald-200 transition-all">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-emerald-900">{b.title}</h3>
                <p className="text-sm text-green-600/70">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-6 bg-gradient-to-r from-emerald-50 to-teal-50/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold mb-4 text-emerald-900">Наша история</h2>
            <p className="text-green-700/70 mb-4 leading-relaxed">Мы начали свой путь в 2018 году с мечты — создать пространство, где природа заботится о человеке. Сегодня мы — команда из 12 специалистов, которые ежедневно помогают людям обрести гармонию.</p>
            <p className="text-green-700/70 leading-relaxed">Наши программы разработаны совместно с ведущими дерматологами и основаны на лучших натуральных ингредиентах со всего мира.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative h-72 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-200 via-teal-100 to-green-200 flex items-center justify-center">
            <div className="text-8xl">🌿</div>
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium text-emerald-700">С 2018 года</div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-emerald-900">Тарифы</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className={`rounded-2xl p-6 border ${p.popular ? "bg-gradient-to-b from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-xl scale-105" : "bg-white border-emerald-100 shadow-sm"}`}>
                {p.popular && <div className="text-xs font-bold uppercase tracking-wider mb-2 text-emerald-200">Популярный</div>}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <div className="text-3xl font-bold mb-4">{p.price} ₽</div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm"><span>✓</span>{f}</li>)}
                </ul>
                <button className={`w-full py-3 rounded-full font-medium transition-all ${p.popular ? "bg-white text-emerald-700 hover:bg-emerald-50" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>Выбрать</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-6 bg-gradient-to-r from-emerald-50 to-teal-50/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-emerald-900">Отзывы клиентов</h2>
          <motion.div key={reviewIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-100">
            <div className="text-5xl mb-4">{reviews[reviewIdx].avatar}</div>
            <p className="text-lg text-green-700/80 mb-4 italic">«{reviews[reviewIdx].text}»</p>
            <div className="flex items-center justify-center gap-1 mb-2">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-emerald-400 text-emerald-400" />)}</div>
            <p className="font-semibold text-emerald-900">{reviews[reviewIdx].author}</p>
          </motion.div>
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, i) => <button key={i} onClick={() => setReviewIdx(i)} className={`w-3 h-3 rounded-full transition-all ${i === reviewIdx ? "bg-emerald-500 scale-125" : "bg-emerald-200"}`} />)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-emerald-900">Частые вопросы</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-emerald-100 rounded-xl overflow-hidden bg-white">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left font-medium text-emerald-900 hover:bg-emerald-50/50 transition-colors">
                  {f.q}
                  <ChevronDown className={`w-5 h-5 text-emerald-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-green-700/70 text-sm">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-6 bg-gradient-to-b from-emerald-50 to-green-100/50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-emerald-900">Свяжитесь с нами</h2>
            <div className="space-y-4 text-green-700/80">
              <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-emerald-500" /> +7 (999) 123-45-67</div>
              <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-emerald-500" /> info@natureflow.ru</div>
              <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-emerald-500" /> Москва, ул. Зелёная, 12</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
            <div className="space-y-4">
              <input placeholder="Ваше имя" className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50/50 focus:outline-none focus:border-emerald-400 text-sm" />
              <input placeholder="Телефон" className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50/50 focus:outline-none focus:border-emerald-400 text-sm" />
              <textarea placeholder="Сообщение" rows={3} className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50/50 focus:outline-none focus:border-emerald-400 text-sm resize-none" />
              <button className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Send className="w-4 h-4" /> Отправить
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-900 text-emerald-100 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-lg"><Leaf className="w-5 h-5" /> Nature Flow</div>
          <div className="flex gap-6 text-sm text-emerald-300">
            <span className="hover:text-white cursor-pointer">Главная</span>
            <span className="hover:text-white cursor-pointer">Услуги</span>
            <span className="hover:text-white cursor-pointer">Отзывы</span>
            <span className="hover:text-white cursor-pointer">Контакты</span>
          </div>
          <div className="flex gap-3">
            <Instagram className="w-5 h-5 text-emerald-400 hover:text-white cursor-pointer" />
            <Facebook className="w-5 h-5 text-emerald-400 hover:text-white cursor-pointer" />
          </div>
        </div>
        <div className="text-center text-emerald-500 text-xs mt-6">© 2024 Nature Flow. Все права защищены.</div>
      </footer>
    </div>
  );
};
