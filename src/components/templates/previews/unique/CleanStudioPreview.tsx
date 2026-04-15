import { motion } from "framer-motion";
import { Sparkles, Scissors, Heart, Shield, Star, ChevronDown, Phone, Mail, MapPin, Send, Instagram, Facebook } from "lucide-react";
import { useState } from "react";
import { Template } from "@/data/templates";

const benefits = [
  { icon: Sparkles, title: "Результат", desc: "Видимый эффект уже после первой процедуры" },
  { icon: Scissors, title: "Мастера", desc: "Сертифицированные специалисты с опытом 5+ лет" },
  { icon: Heart, title: "Забота", desc: "Индивидуальный подбор программ ухода" },
  { icon: Shield, title: "Безопасность", desc: "Только сертифицированные материалы" },
];

const plans = [
  { name: "Экспресс", price: "1 800", features: ["Стрижка", "Укладка", "Консультация"], popular: false },
  { name: "Комплекс", price: "4 500", features: ["Стрижка + Окрашивание", "Маска", "Стайлинг", "Чай/кофе"], popular: true },
  { name: "Total Care", price: "8 900", features: ["Полный уход", "SPA-процедура", "Массаж головы", "Домашний уход"], popular: false },
];

const reviews = [
  { text: "Уютная студия, приятная атмосфера. Мой любимый салон!", author: "Ольга Н.", avatar: "💫" },
  { text: "Профессионально и с душой. Результат всегда радует.", author: "Виктория А.", avatar: "✨" },
  { text: "Ходим всей семьёй. Деткам тоже нравится!", author: "Наталья К.", avatar: "🌸" },
];

const faqs = [
  { q: "Нужна ли предварительная запись?", a: "Рекомендуем записываться заранее через сайт или по телефону, но принимаем и без записи при наличии свободных мастеров." },
  { q: "Какие материалы вы используете?", a: "Мы работаем с профессиональными брендами: L'Oréal Professionnel, Wella, Davines." },
  { q: "Есть ли скидки для постоянных клиентов?", a: "Да, программа лояльности — каждая 5-я процедура со скидкой 20%." },
  { q: "Делаете ли вы свадебные укладки?", a: "Да! Свадебные и вечерние укладки — наша специализация. Выезд на локацию возможен." },
];

export const CleanStudioPreview = ({ template }: { template: Template }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [reviewIdx, setReviewIdx] = useState(0);

  return (
    <div className="font-sans bg-white text-zinc-800 overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/80 via-white to-white" />
        <motion.div className="absolute top-10 right-20 w-72 h-72 rounded-full bg-rose-100/50 blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute bottom-20 left-10 w-56 h-56 rounded-full bg-pink-100/40 blur-3xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 7, repeat: Infinity }} />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 text-rose-500 text-sm mb-6">
            <Sparkles className="w-4 h-4" /> Студия красоты
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-light mb-6 text-zinc-800 tracking-tight">
            Clean <span className="font-semibold text-rose-400">Studio</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-lg text-zinc-500 mb-8 max-w-xl mx-auto font-light">
            Пространство, где красота рождается в атмосфере спокойствия и заботы
          </motion.p>
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="px-8 py-4 bg-rose-400 text-white rounded-full text-lg font-medium shadow-lg shadow-rose-400/20 hover:bg-rose-500 hover:shadow-xl transition-all">
            Записаться онлайн
          </motion.button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-light text-center mb-4">Почему <span className="font-semibold text-rose-400">мы</span></h2>
          <p className="text-center text-zinc-400 mb-12">Каждый визит — маленький праздник для вас</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-rose-50/50 rounded-2xl p-6 text-center hover:shadow-md transition-all border border-rose-100/50">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
                  <b.icon className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="font-medium text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-zinc-400">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-6 bg-rose-50/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-light mb-4">О <span className="font-semibold text-rose-400">студии</span></h2>
            <p className="text-zinc-500 mb-4 leading-relaxed">Clean Studio — это уютное пространство в центре города, где каждый клиент получает персональное внимание. Мы верим, что красота должна быть доступной и комфортной.</p>
            <p className="text-zinc-500 leading-relaxed">Наша команда — 8 мастеров с международной сертификацией и любовью к своему делу.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative h-72 rounded-3xl overflow-hidden bg-gradient-to-br from-rose-100 to-pink-50 flex items-center justify-center">
            <div className="text-8xl">💇‍♀️</div>
            <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-full text-sm font-medium text-rose-500 shadow-sm">8 мастеров</div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-12">Наши <span className="font-semibold text-rose-400">услуги</span></h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className={`rounded-2xl p-6 border ${p.popular ? "bg-rose-400 text-white border-rose-300 shadow-xl shadow-rose-400/15 scale-105" : "bg-white border-rose-100 shadow-sm"}`}>
                {p.popular && <div className="text-xs font-medium uppercase tracking-wider mb-2 text-rose-200">Популярный</div>}
                <h3 className="text-xl font-medium mb-1">{p.name}</h3>
                <div className="text-3xl font-semibold mb-4">{p.price} ₽</div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm"><span>✓</span>{f}</li>)}
                </ul>
                <button className={`w-full py-3 rounded-full font-medium transition-all ${p.popular ? "bg-white text-rose-500 hover:bg-rose-50" : "bg-rose-50 text-rose-500 hover:bg-rose-100"}`}>Записаться</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-6 bg-rose-50/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-light mb-12">Отзывы <span className="font-semibold text-rose-400">клиентов</span></h2>
          <motion.div key={reviewIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-8 shadow-sm border border-rose-100/50">
            <div className="text-5xl mb-4">{reviews[reviewIdx].avatar}</div>
            <p className="text-lg text-zinc-600 mb-4 italic font-light">«{reviews[reviewIdx].text}»</p>
            <div className="flex items-center justify-center gap-1 mb-2">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-rose-400 text-rose-400" />)}</div>
            <p className="font-medium">{reviews[reviewIdx].author}</p>
          </motion.div>
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, i) => <button key={i} onClick={() => setReviewIdx(i)} className={`w-3 h-3 rounded-full transition-all ${i === reviewIdx ? "bg-rose-400 scale-125" : "bg-rose-200"}`} />)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-12">Частые <span className="font-semibold text-rose-400">вопросы</span></h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-rose-100 rounded-xl overflow-hidden bg-white">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left font-medium hover:bg-rose-50/50 transition-colors">
                  {f.q}
                  <ChevronDown className={`w-5 h-5 text-rose-300 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-zinc-500 text-sm">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-6 bg-rose-50/30">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-light mb-6">Свяжитесь <span className="font-semibold text-rose-400">с нами</span></h2>
            <div className="space-y-4 text-zinc-500">
              <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-rose-400" /> +7 (999) 555-33-22</div>
              <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-rose-400" /> hello@cleanstudio.ru</div>
              <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-rose-400" /> Москва, ул. Цветочная, 7</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100/50">
            <div className="space-y-4">
              <input placeholder="Ваше имя" className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-rose-50/30 focus:outline-none focus:border-rose-400 text-sm" />
              <input placeholder="Телефон" className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-rose-50/30 focus:outline-none focus:border-rose-400 text-sm" />
              <textarea placeholder="Сообщение" rows={3} className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-rose-50/30 focus:outline-none focus:border-rose-400 text-sm resize-none" />
              <button className="w-full py-3 bg-rose-400 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-rose-500 transition-colors">
                <Send className="w-4 h-4" /> Отправить
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-800 text-zinc-300 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-light text-lg">Clean <span className="font-medium text-rose-400">Studio</span></div>
          <div className="flex gap-6 text-sm text-zinc-400">
            <span className="hover:text-white cursor-pointer">Главная</span>
            <span className="hover:text-white cursor-pointer">Услуги</span>
            <span className="hover:text-white cursor-pointer">Отзывы</span>
            <span className="hover:text-white cursor-pointer">Контакты</span>
          </div>
          <div className="flex gap-3">
            <Instagram className="w-5 h-5 text-zinc-500 hover:text-rose-400 cursor-pointer" />
            <Facebook className="w-5 h-5 text-zinc-500 hover:text-rose-400 cursor-pointer" />
          </div>
        </div>
        <div className="text-center text-zinc-600 text-xs mt-6">© 2024 Clean Studio. Все права защищены.</div>
      </footer>
    </div>
  );
};
