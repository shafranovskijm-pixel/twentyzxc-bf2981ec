import { motion } from "framer-motion";
import { Code, Rocket, Target, TrendingUp, Star, ChevronDown, Phone, Mail, MapPin, Send, Github, Linkedin } from "lucide-react";
import { useState } from "react";
import { Template } from "@/data/templates";

const benefits = [
  { icon: Code, title: "Разработка", desc: "Полный цикл от идеи до продакшна" },
  { icon: Rocket, title: "Скорость", desc: "MVP за 2 недели, релиз за месяц" },
  { icon: Target, title: "Точность", desc: "Попадание в ЦА с первой итерации" },
  { icon: TrendingUp, title: "Рост", desc: "Масштабирование без технических ограничений" },
];

const plans = [
  { name: "Starter", price: "49 000", features: ["Лендинг", "SEO базовый", "Аналитика", "1 мес. поддержки"], popular: false },
  { name: "Business", price: "149 000", features: ["Веб-приложение", "API интеграции", "CI/CD", "Тестирование", "3 мес. поддержки"], popular: true },
  { name: "Enterprise", price: "от 300 000", features: ["Полный стек", "Архитектура", "DevOps", "SLA 99.9%", "12 мес. поддержки"], popular: false },
];

const reviews = [
  { text: "Ребята сделали нам CRM, которая работает как часы. ROI x5.", author: "Алексей Т.", avatar: "🚀" },
  { text: "Быстро, качественно, без лишней бюрократии. Рекомендую!", author: "Мария К.", avatar: "⚡" },
  { text: "Лучшая команда, с которой я работал за 10 лет в IT.", author: "Дмитрий В.", avatar: "💎" },
];

const faqs = [
  { q: "Какие технологии вы используете?", a: "React, TypeScript, Node.js, Python, PostgreSQL, AWS/GCP — подбираем стек под задачу." },
  { q: "Работаете ли вы с MVP?", a: "Да! MVP — наша специализация. Запускаем первую версию продукта за 2-4 недели." },
  { q: "Как происходит коммуникация?", a: "Ежедневные стендапы, Slack/Telegram, еженедельные демо. Полная прозрачность." },
  { q: "Есть ли гарантия?", a: "6 месяцев гарантийной поддержки включены в каждый проект." },
];

export const NeonDrivePreview = ({ template }: { template: Template }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [reviewIdx, setReviewIdx] = useState(0);

  return (
    <div className="font-sans bg-slate-950 text-white overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/30 via-slate-950 to-slate-950" />
        <motion.div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl" animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity }} />
        <motion.div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl" animate={{ scale: [1.3, 1, 1.3], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 5, repeat: Infinity }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        <div className="relative z-10 text-center px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm mb-6 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <Code className="w-4 h-4" /> Digital Agency
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">Neon</span> Drive
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Создаём цифровые продукты, которые двигают бизнес вперёд. Код, дизайн, маркетинг — под ключ.
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-lg font-medium shadow-lg shadow-cyan-500/25 hover:shadow-xl transition-all hover:scale-105">
              Обсудить проект
            </button>
            <button className="px-8 py-4 border border-cyan-500/30 text-cyan-400 rounded-lg text-lg font-medium hover:bg-cyan-500/10 transition-all">
              Портфолио
            </button>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Что мы <span className="text-cyan-400">делаем</span></h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 text-center hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.05)] transition-all">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                  <b.icon className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-slate-500">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold mb-4">О <span className="text-cyan-400">команде</span></h2>
            <p className="text-slate-400 mb-4 leading-relaxed">Мы — команда из 15 инженеров, дизайнеров и маркетологов. За 5 лет запустили 200+ проектов для клиентов из 12 стран.</p>
            <p className="text-slate-400 leading-relaxed">Наш подход: Agile, прозрачность, ориентация на результат. Каждый проект — это партнёрство.</p>
            <div className="flex gap-6 mt-6">
              <div className="text-center"><div className="text-2xl font-bold text-cyan-400">200+</div><div className="text-xs text-slate-500">проектов</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-cyan-400">15</div><div className="text-xs text-slate-500">в команде</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-cyan-400">12</div><div className="text-xs text-slate-500">стран</div></div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-950/50 to-slate-900 flex items-center justify-center border border-cyan-500/10">
            <div className="text-7xl font-mono text-cyan-400/20">&lt;/&gt;</div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Тарифы</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className={`rounded-2xl p-6 border ${p.popular ? "bg-gradient-to-b from-cyan-600 to-blue-600 border-cyan-500 shadow-xl shadow-cyan-500/15 scale-105" : "bg-slate-900/50 border-slate-800"}`}>
                {p.popular && <div className="text-xs font-bold uppercase tracking-wider mb-2 text-cyan-200">Популярный</div>}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <div className="text-3xl font-bold mb-4">{p.price} <span className="text-lg font-normal">₽</span></div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f, j) => <li key={j} className="flex items-center gap-2 text-sm"><span className={p.popular ? "text-cyan-200" : "text-cyan-400"}>✓</span>{f}</li>)}
                </ul>
                <button className={`w-full py-3 rounded-lg font-medium transition-all ${p.popular ? "bg-white text-cyan-700 hover:bg-slate-100" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"}`}>Выбрать</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Отзывы <span className="text-cyan-400">клиентов</span></h2>
          <motion.div key={reviewIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
            <div className="text-5xl mb-4">{reviews[reviewIdx].avatar}</div>
            <p className="text-lg text-slate-300 mb-4 italic">«{reviews[reviewIdx].text}»</p>
            <div className="flex items-center justify-center gap-1 mb-2">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-cyan-400 text-cyan-400" />)}</div>
            <p className="font-semibold">{reviews[reviewIdx].author}</p>
          </motion.div>
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, i) => <button key={i} onClick={() => setReviewIdx(i)} className={`w-3 h-3 rounded-full transition-all ${i === reviewIdx ? "bg-cyan-400 scale-125" : "bg-slate-700"}`} />)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left font-medium hover:bg-slate-800/50 transition-colors">
                  {f.q}
                  <ChevronDown className={`w-5 h-5 text-cyan-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-slate-400 text-sm">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">Контакты</h2>
            <div className="space-y-4 text-slate-400">
              <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-cyan-400" /> +7 (999) 777-55-33</div>
              <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-cyan-400" /> hello@neondrive.dev</div>
              <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-cyan-400" /> Москва, Технопарк</div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <div className="space-y-4">
              <input placeholder="Ваше имя" className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50 focus:outline-none focus:border-cyan-500 text-sm" />
              <input placeholder="Email" className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50 focus:outline-none focus:border-cyan-500 text-sm" />
              <textarea placeholder="Опишите проект" rows={3} className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800/50 focus:outline-none focus:border-cyan-500 text-sm resize-none" />
              <button className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Send className="w-4 h-4" /> Отправить
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/50 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-bold text-lg"><span className="text-cyan-400">Neon</span> Drive</div>
          <div className="flex gap-6 text-sm text-slate-500">
            <span className="hover:text-white cursor-pointer">Главная</span>
            <span className="hover:text-white cursor-pointer">Услуги</span>
            <span className="hover:text-white cursor-pointer">Тарифы</span>
            <span className="hover:text-white cursor-pointer">Контакты</span>
          </div>
          <div className="flex gap-3">
            <Github className="w-5 h-5 text-slate-600 hover:text-cyan-400 cursor-pointer" />
            <Linkedin className="w-5 h-5 text-slate-600 hover:text-cyan-400 cursor-pointer" />
          </div>
        </div>
        <div className="text-center text-slate-700 text-xs mt-6">© 2024 Neon Drive. Все права защищены.</div>
      </footer>
    </div>
  );
};
