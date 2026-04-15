import { motion } from "framer-motion";
import { Zap, Dumbbell, Music, Clock, Star, ChevronDown, Phone, Mail, MapPin, Send, Instagram } from "lucide-react";
import { useState } from "react";
import { Template } from "@/data/templates";

const benefits = [
  { icon: Zap, title: "Энергия", desc: "Драйв и мотивация в каждом занятии" },
  { icon: Dumbbell, title: "Профи-тренеры", desc: "Команда сертифицированных мастеров" },
  { icon: Music, title: "Атмосфера", desc: "Музыка и свет создают настроение" },
  { icon: Clock, title: "24/7", desc: "Работаем без выходных и перерывов" },
];

const plans = [
  { name: "Старт", price: "3 500", features: ["8 занятий/мес", "Раздевалка", "Вода"], popular: false },
  { name: "Pro", price: "6 900", features: ["Безлимит", "Персональный план", "Питание", "Сауна"], popular: true },
  { name: "VIP", price: "14 000", features: ["Всё из Pro", "Личный тренер", "Массаж", "Парковка"], popular: false },
];

const reviews = [
  { text: "Лучший зал в городе! Атмосфера заряжает на максимум.", author: "Денис Р.", avatar: "💪" },
  { text: "Тренеры — огонь. За 3 месяца результаты, о которых мечтал.", author: "Алексей М.", avatar: "🔥" },
  { text: "Удобное расположение, работают допоздна. То, что нужно.", author: "Кристина Л.", avatar: "⚡" },
];

const faqs = [
  { q: "Нужна ли спортивная подготовка?", a: "Нет! Мы работаем с любым уровнем — от новичков до профи." },
  { q: "Есть ли пробное занятие?", a: "Да, первое посещение бесплатно с любым абонементом." },
  { q: "Можно ли заморозить абонемент?", a: "Да, до 14 дней заморозки включены в любой тариф." },
  { q: "Работает ли кафе?", a: "Да, фитнес-бар работает с 7:00 до 23:00 ежедневно." },
];

export const UrbanPulsePreview = ({ template }: { template: Template }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [reviewIdx, setReviewIdx] = useState(0);

  return (
    <div className="font-sans bg-zinc-950 text-white overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/40 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <motion.div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-red-600/10 blur-3xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 5, repeat: Infinity }} />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-sm mb-6">
            <Zap className="w-4 h-4" /> Почувствуй ритм города
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tight">
            Urban <span className="text-red-500">Pulse</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-lg text-zinc-400 mb-8 max-w-xl mx-auto">
            Фитнес-клуб нового поколения. Тренировки, которые меняют жизнь.
          </motion.p>
          <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="px-8 py-4 bg-red-600 text-white rounded-lg text-lg font-bold uppercase tracking-wider hover:bg-red-500 transition-all shadow-lg shadow-red-600/25">
            Начать бесплатно
          </motion.button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12 uppercase">Наши <span className="text-red-500">преимущества</span></h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center hover:border-red-500/30 transition-colors">
                <div className="w-14 h-14 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-zinc-500">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-6 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-black mb-4 uppercase">О <span className="text-red-500">нас</span></h2>
            <p className="text-zinc-400 mb-4 leading-relaxed">Urban Pulse — это больше, чем фитнес-клуб. Это сообщество людей, которые выбирают активную жизнь. С 2019 года мы помогаем тысячам людей трансформировать себя.</p>
            <p className="text-zinc-400 leading-relaxed">2000 м² площади, 50+ тренажёров, бассейн, сауна — всё для вашего результата.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-red-900/30 to-zinc-900 flex items-center justify-center border border-zinc-800">
            <div className="text-8xl">🏋️</div>
            <div className="absolute bottom-4 right-4 bg-red-600 px-4 py-2 rounded-lg text-sm font-bold">2000 м²</div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12 uppercase">Тарифы</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className={`rounded-2xl p-6 border ${p.popular ? "bg-red-600 border-red-500 shadow-xl shadow-red-600/20 scale-105" : "bg-zinc-900 border-zinc-800"}`}>
                {p.popular && <div className="text-xs font-bold uppercase tracking-wider mb-2 text-red-200">Хит</div>}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <div className="text-3xl font-black mb-4">{p.price} <span className="text-lg font-normal">₽/мес</span></div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm"><span className={p.popular ? "text-red-200" : "text-red-500"}>✓</span>{f}</li>)}
                </ul>
                <button className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${p.popular ? "bg-white text-red-600 hover:bg-zinc-100" : "bg-red-600/20 text-red-400 hover:bg-red-600/30"}`}>Выбрать</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-6 bg-zinc-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-12 uppercase">Отзывы</h2>
          <motion.div key={reviewIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
            <div className="text-5xl mb-4">{reviews[reviewIdx].avatar}</div>
            <p className="text-lg text-zinc-300 mb-4 italic">«{reviews[reviewIdx].text}»</p>
            <div className="flex items-center justify-center gap-1 mb-2">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-red-500 text-red-500" />)}</div>
            <p className="font-bold">{reviews[reviewIdx].author}</p>
          </motion.div>
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, i) => <button key={i} onClick={() => setReviewIdx(i)} className={`w-3 h-3 rounded-full transition-all ${i === reviewIdx ? "bg-red-500 scale-125" : "bg-zinc-700"}`} />)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12 uppercase">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left font-medium hover:bg-zinc-800/50 transition-colors">
                  {f.q}
                  <ChevronDown className={`w-5 h-5 text-red-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-zinc-400 text-sm">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-6 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-black mb-6 uppercase">Контакты</h2>
            <div className="space-y-4 text-zinc-400">
              <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-red-500" /> +7 (999) 888-77-66</div>
              <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-red-500" /> info@urbanpulse.ru</div>
              <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-red-500" /> Москва, ул. Спортивная, 42</div>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <div className="space-y-4">
              <input placeholder="Ваше имя" className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800 focus:outline-none focus:border-red-500 text-sm" />
              <input placeholder="Телефон" className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800 focus:outline-none focus:border-red-500 text-sm" />
              <textarea placeholder="Сообщение" rows={3} className="w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800 focus:outline-none focus:border-red-500 text-sm resize-none" />
              <button className="w-full py-3 bg-red-600 text-white rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-red-500 transition-colors">
                <Send className="w-4 h-4" /> Отправить
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-black text-lg uppercase">Urban <span className="text-red-500">Pulse</span></div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <span className="hover:text-white cursor-pointer">Главная</span>
            <span className="hover:text-white cursor-pointer">Тарифы</span>
            <span className="hover:text-white cursor-pointer">Отзывы</span>
            <span className="hover:text-white cursor-pointer">Контакты</span>
          </div>
          <Instagram className="w-5 h-5 text-zinc-600 hover:text-red-500 cursor-pointer" />
        </div>
        <div className="text-center text-zinc-700 text-xs mt-6">© 2024 Urban Pulse. Все права защищены.</div>
      </footer>
    </div>
  );
};
