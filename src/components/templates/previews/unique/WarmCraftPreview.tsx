import { motion } from "framer-motion";
import { Coffee, Camera, Palette, Award, Star, ChevronDown, Phone, Mail, MapPin, Send, Instagram } from "lucide-react";
import { useState } from "react";
import { Template } from "@/data/templates";

const benefits = [
  { icon: Coffee, title: "Атмосфера", desc: "Уютное пространство для творчества и отдыха" },
  { icon: Camera, title: "Качество", desc: "Внимание к каждой детали и мелочи" },
  { icon: Palette, title: "Ручная работа", desc: "Всё создаётся вручную с любовью" },
  { icon: Award, title: "Опыт", desc: "Более 8 лет в своём деле" },
];

const plans = [
  { name: "Мини", price: "990", features: ["Напиток", "Десерт дня", "Wi-Fi"], popular: false },
  { name: "Комбо", price: "1 890", features: ["2 напитка", "Десерт + Выпечка", "Мастер-класс мини", "Скидка 15%"], popular: true },
  { name: "Праздник", price: "4 500", features: ["Аренда 2 часа", "Напитки на 6 человек", "Торт", "Декор"], popular: false },
];

const reviews = [
  { text: "Самое уютное место в городе! Кофе — просто космос.", author: "Анна М.", avatar: "☕" },
  { text: "Обожаю ваши десерты ручной работы. Каждый — шедевр.", author: "Светлана Р.", avatar: "🍰" },
  { text: "Провели мастер-класс для детей — все в восторге!", author: "Ирина К.", avatar: "🎨" },
];

const faqs = [
  { q: "Можно ли забронировать столик?", a: "Да, бронирование доступно по телефону или через форму на сайте. На выходные рекомендуем бронировать заранее." },
  { q: "Проводите ли вы мастер-классы?", a: "Каждую субботу — открытые мастер-классы по латте-арт и выпечке. Записывайтесь!" },
  { q: "Есть ли веганское меню?", a: "Да, у нас есть альтернативное молоко и веганские десерты." },
  { q: "Можно ли прийти с собакой?", a: "Конечно! Мы dog-friendly кофейня. У нас есть вода и лакомства для хвостиков." },
];

export const WarmCraftPreview = ({ template }: { template: Template }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [reviewIdx, setReviewIdx] = useState(0);

  return (
    <div className="font-sans bg-amber-50 text-amber-950 overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/60 via-orange-50/30 to-amber-50" />
        <motion.div className="absolute top-20 right-20 w-80 h-80 rounded-full bg-orange-200/30 blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 7, repeat: Infinity }} />
        <motion.div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-amber-200/30 blur-3xl" animate={{ scale: [1.1, 0.9, 1.1] }} transition={{ duration: 6, repeat: Infinity }} />
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 20l4-4 2 2-4 4-2-2zm20-20l4 4-2 2-4-4 2-2z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm mb-6">
            <Coffee className="w-4 h-4" /> Крафтовая мастерская
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-bold mb-6 text-amber-900 tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
            Warm Craft
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-lg text-amber-700/70 mb-8 max-w-xl mx-auto">
            Место, где тепло рук создаёт настоящие шедевры. Кофе, десерты и вдохновение.
          </motion.p>
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="px-8 py-4 bg-amber-700 text-amber-50 rounded-full text-lg font-medium shadow-lg shadow-amber-700/20 hover:bg-amber-800 transition-all">
            Забронировать столик
          </motion.button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>Наши ценности</h2>
          <p className="text-center text-amber-600/60 mb-12">Каждая чашка — маленькая история</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-amber-100 hover:shadow-md transition-all">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="w-7 h-7 text-amber-700" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-amber-900">{b.title}</h3>
                <p className="text-sm text-amber-600/60">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-6 bg-amber-100/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold mb-4 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>Наша история</h2>
            <p className="text-amber-700/70 mb-4 leading-relaxed">Warm Craft появился из любви к ручному труду и хорошему кофе. В 2020 году мы открыли маленькую мастерскую, а сегодня — это место, куда приходят за вдохновением.</p>
            <p className="text-amber-700/70 leading-relaxed">Зёрна обжариваем сами, десерты выпекаем каждое утро, а декор — полностью ручная работа наших мастеров.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative h-72 rounded-3xl overflow-hidden bg-gradient-to-br from-amber-200 via-orange-100 to-amber-100 flex items-center justify-center">
            <div className="text-8xl">☕</div>
            <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-full text-sm font-medium text-amber-700">С 2020 года</div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>Меню</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className={`rounded-2xl p-6 border ${p.popular ? "bg-amber-700 text-amber-50 border-amber-600 shadow-xl shadow-amber-700/15 scale-105" : "bg-white border-amber-100 shadow-sm"}`}>
                {p.popular && <div className="text-xs font-bold uppercase tracking-wider mb-2 text-amber-300">Хит</div>}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <div className="text-3xl font-bold mb-4">{p.price} ₽</div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm"><span>✓</span>{f}</li>)}
                </ul>
                <button className={`w-full py-3 rounded-full font-medium transition-all ${p.popular ? "bg-amber-50 text-amber-800 hover:bg-white" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}>Выбрать</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-6 bg-amber-100/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>Отзывы гостей</h2>
          <motion.div key={reviewIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-8 shadow-sm border border-amber-100">
            <div className="text-5xl mb-4">{reviews[reviewIdx].avatar}</div>
            <p className="text-lg text-amber-800/70 mb-4 italic">«{reviews[reviewIdx].text}»</p>
            <div className="flex items-center justify-center gap-1 mb-2">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />)}</div>
            <p className="font-semibold text-amber-900">{reviews[reviewIdx].author}</p>
          </motion.div>
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, i) => <button key={i} onClick={() => setReviewIdx(i)} className={`w-3 h-3 rounded-full transition-all ${i === reviewIdx ? "bg-amber-600 scale-125" : "bg-amber-200"}`} />)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>Вопросы</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-amber-100 rounded-xl overflow-hidden bg-white">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left font-medium text-amber-900 hover:bg-amber-50/50 transition-colors">
                  {f.q}
                  <ChevronDown className={`w-5 h-5 text-amber-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-amber-700/60 text-sm">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-6 bg-amber-100/30">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>Найдите нас</h2>
            <div className="space-y-4 text-amber-700/70">
              <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-amber-600" /> +7 (999) 222-44-55</div>
              <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-amber-600" /> hello@warmcraft.ru</div>
              <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-amber-600" /> Москва, пер. Уютный, 3</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
            <div className="space-y-4">
              <input placeholder="Ваше имя" className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/50 focus:outline-none focus:border-amber-500 text-sm" />
              <input placeholder="Телефон" className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/50 focus:outline-none focus:border-amber-500 text-sm" />
              <textarea placeholder="Сообщение" rows={3} className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/50 focus:outline-none focus:border-amber-500 text-sm resize-none" />
              <button className="w-full py-3 bg-amber-700 text-amber-50 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-amber-800 transition-colors">
                <Send className="w-4 h-4" /> Отправить
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-900 text-amber-100 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-bold text-lg" style={{ fontFamily: "Georgia, serif" }}>Warm Craft</div>
          <div className="flex gap-6 text-sm text-amber-300">
            <span className="hover:text-white cursor-pointer">Главная</span>
            <span className="hover:text-white cursor-pointer">Меню</span>
            <span className="hover:text-white cursor-pointer">Отзывы</span>
            <span className="hover:text-white cursor-pointer">Контакты</span>
          </div>
          <Instagram className="w-5 h-5 text-amber-400 hover:text-white cursor-pointer" />
        </div>
        <div className="text-center text-amber-600 text-xs mt-6">© 2024 Warm Craft. Все права защищены.</div>
      </footer>
    </div>
  );
};
