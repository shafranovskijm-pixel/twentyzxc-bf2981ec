import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Rocket, Zap, Shield, Globe, Code2, Check, X, 
  ArrowRight, Star, Users, TrendingUp, Key, 
  CreditCard, Webhook, BarChart3, Layers, Palette,
  ChevronRight, Play
} from "lucide-react";
import { Template } from "@/data/templates";
import { ScrollReveal, AnimatedCounter, GradientButton, TypewriterText, LogoCarousel } from "../shared";
import { PricingToggle, AnimatedPrice } from "../shared/PricingToggle";

interface PlatformXPreviewProps {
  template: Template;
}

export const PlatformXPreview = ({ template }: PlatformXPreviewProps) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: "starter",
      name: "Starter",
      description: "Для маленьких команд",
      monthlyPrice: 49,
      annualPrice: 39,
      features: [
        { name: "До 1,000 пользователей", included: true },
        { name: "5 проектов", included: true },
        { name: "API доступ", included: true },
        { name: "Email поддержка", included: true },
        { name: "Webhooks", included: false },
        { name: "White-label", included: false },
        { name: "SSO/SAML", included: false },
        { name: "Dedicated инфраструктура", included: false },
      ],
      cta: "Начать бесплатно",
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      description: "Для растущих компаний",
      monthlyPrice: 149,
      annualPrice: 119,
      features: [
        { name: "До 10,000 пользователей", included: true },
        { name: "Безлимит проектов", included: true },
        { name: "API доступ", included: true },
        { name: "Приоритетная поддержка", included: true },
        { name: "Webhooks", included: true },
        { name: "White-label", included: true },
        { name: "SSO/SAML", included: false },
        { name: "Dedicated инфраструктура", included: false },
      ],
      cta: "Начать trial",
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Для крупного бизнеса",
      monthlyPrice: 499,
      annualPrice: 399,
      features: [
        { name: "Безлимит пользователей", included: true },
        { name: "Безлимит проектов", included: true },
        { name: "API доступ", included: true },
        { name: "24/7 поддержка + SLA", included: true },
        { name: "Webhooks", included: true },
        { name: "White-label", included: true },
        { name: "SSO/SAML", included: true },
        { name: "Dedicated инфраструктура", included: true },
      ],
      cta: "Связаться",
      popular: false,
    },
  ];

  const testimonials = [
    { 
      text: "Platform X позволил нам запустить SaaS за 2 недели вместо 6 месяцев.", 
      author: "Александр К.", 
      role: "CEO, TechStartup",
      company: "TechStartup"
    },
    { 
      text: "Экономия на разработке составила более $100,000 в первый год.", 
      author: "Мария С.", 
      role: "CTO, FinanceApp",
      company: "FinanceApp"
    },
    { 
      text: "Лучшее решение для multi-tenant архитектуры на рынке.", 
      author: "Дмитрий В.", 
      role: "Lead Developer, EnterpriseCo",
      company: "EnterpriseCo"
    },
  ];

  const integrations = [
    { name: "Stripe", icon: CreditCard, color: "from-purple-500 to-indigo-500" },
    { name: "Zapier", icon: Zap, color: "from-orange-500 to-red-500" },
    { name: "Webhooks", icon: Webhook, color: "from-cyan-500 to-blue-500" },
    { name: "API", icon: Code2, color: "from-emerald-500 to-teal-500" },
  ];

  const usageData = [
    { label: "Янв", value: 65 },
    { label: "Фев", value: 78 },
    { label: "Мар", value: 82 },
    { label: "Апр", value: 91 },
    { label: "Май", value: 95 },
    { label: "Июн", value: 100 },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 30% 50%, rgba(217, 70, 239, 0.15) 0%, transparent 50%),
                          radial-gradient(circle at 70% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
                          radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)`,
            }}
          />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 mb-8"
          >
            <Rocket className="w-4 h-4 text-fuchsia-400" />
            <span className="text-fuchsia-400 text-sm font-medium">Platform X 2.0 — уже доступен</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Запустите свой{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              SaaS за дни
            </span>
            <br />
            <TypewriterText 
              texts={["не за месяцы", "не за годы", "уже сегодня"]}
              className="text-zinc-400"
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto"
          >
            Готовая инфраструктура для multi-tenant приложений. 
            Биллинг, аутентификация, API — всё включено.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center mb-12"
          >
            <GradientButton className="bg-gradient-to-r from-fuchsia-500 to-pink-500 px-8 py-4 text-lg">
              Начать 14-дневный trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </GradientButton>
            <button className="flex items-center gap-2 px-8 py-4 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors">
              <Play className="w-5 h-5" />
              Смотреть демо
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-12"
          >
            {[
              { value: 500, suffix: "+", label: "Компаний" },
              { value: 2, suffix: "M+", label: "Пользователей" },
              { value: 99.9, suffix: "%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-white">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2} />
                </p>
                <p className="text-sm text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features comparison */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Всё что нужно для <span className="text-fuchsia-400">SaaS</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                От биллинга до аналитики — готовые модули для быстрого запуска
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Multi-tenant",
                desc: "Изолированные окружения для каждого клиента",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: CreditCard,
                title: "Биллинг",
                desc: "Stripe интеграция, подписки, invoices",
                gradient: "from-fuchsia-500 to-pink-500",
              },
              {
                icon: Shield,
                title: "Auth & SSO",
                desc: "OAuth, SAML, MFA из коробки",
                gradient: "from-emerald-500 to-teal-500",
              },
              {
                icon: BarChart3,
                title: "Аналитика",
                desc: "Метрики, когорты, воронки",
                gradient: "from-amber-500 to-orange-500",
              },
              {
                icon: Key,
                title: "API Keys",
                desc: "Управление ключами для клиентов",
                gradient: "from-purple-500 to-indigo-500",
              },
              {
                icon: Palette,
                title: "White-label",
                desc: "Кастомизация под бренд клиента",
                gradient: "from-rose-500 to-pink-500",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-fuchsia-500/30 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-tenant Architecture */}
      <section className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Архитектура <span className="text-fuchsia-400">multi-tenant</span>
              </h2>
            </div>
          </ScrollReveal>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="relative p-8 rounded-3xl bg-zinc-900 border border-zinc-800"
          >
            {/* Architecture diagram mock */}
            <div className="flex flex-col items-center gap-8">
              {/* Top layer - Tenants */}
              <div className="flex gap-4">
                {["Tenant A", "Tenant B", "Tenant C"].map((tenant, i) => (
                  <motion.div
                    key={tenant}
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/30"
                  >
                    <p className="text-sm font-medium text-fuchsia-400">{tenant}</p>
                  </motion.div>
                ))}
              </div>

              {/* Arrows */}
              <div className="flex gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-px h-8 bg-gradient-to-b from-fuchsia-500/50 to-transparent" />
                ))}
              </div>

              {/* Middle layer - Platform X */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="px-12 py-6 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500"
              >
                <p className="text-lg font-bold text-white">Platform X</p>
                <p className="text-sm text-white/70">Auth • Billing • API • Analytics</p>
              </motion.div>

              {/* Arrow */}
              <div className="w-px h-8 bg-gradient-to-b from-pink-500/50 to-transparent" />

              {/* Bottom layer - Database */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="px-8 py-4 rounded-xl bg-zinc-800 border border-zinc-700"
              >
                <p className="text-sm font-medium text-zinc-300">Isolated Databases</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Billing Dashboard Mock */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <ScrollReveal>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Биллинг-панель <span className="text-fuchsia-400">для ваших клиентов</span>
                </h2>
                <p className="text-zinc-400 mb-6">
                  Каждый ваш клиент получает доступ к управлению подписками, 
                  истории платежей и invoice прямо из интерфейса.
                </p>
                <ul className="space-y-3">
                  {[
                    "Stripe интеграция из коробки",
                    "Поддержка разных тарифов",
                    "Автоматические invoice",
                    "Управление способами оплаты",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-zinc-300">
                      <Check className="w-5 h-5 text-fuchsia-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            </div>

            {/* Dashboard mock */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Управление подпиской</h3>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                  Активна
                </span>
              </div>
              
              <div className="p-4 rounded-xl bg-zinc-800/50 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400">Текущий план</span>
                  <span className="font-semibold text-fuchsia-400">Pro</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Следующий платёж</span>
                  <span className="font-semibold">$149 / 1 мар 2025</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-fuchsia-500 text-white text-sm font-medium">
                  Изменить план
                </button>
                <button className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium">
                  История платежей
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* White-label Preview */}
      <section className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-fuchsia-400">White-label</span> под ваш бренд
              </h2>
              <p className="text-zinc-400">
                Каждый клиент может кастомизировать интерфейс под свой бренд
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { brand: "Brand A", color: "from-blue-500 to-cyan-500" },
              { brand: "Brand B", color: "from-purple-500 to-pink-500" },
              { brand: "Brand C", color: "from-orange-500 to-red-500" },
            ].map((item, i) => (
              <motion.div
                key={item.brand}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800"
              >
                <div className={`h-32 rounded-xl bg-gradient-to-br ${item.color} mb-4 flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{item.brand}</span>
                </div>
                <p className="text-sm text-zinc-400 text-center">
                  Собственный домен, логотип, цвета
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Простые <span className="text-fuchsia-400">тарифы</span>
              </h2>
              <p className="text-zinc-400 mb-8">14-дневный trial для всех планов</p>
              <PricingToggle
                isAnnual={isAnnual}
                onToggle={setIsAnnual}
                monthlyLabel="Месяц"
                annualLabel="Год"
              />
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-6 rounded-2xl border ${
                  plan.popular
                    ? "bg-gradient-to-b from-fuchsia-500/10 to-transparent border-fuchsia-500/30"
                    : "bg-zinc-900/50 border-zinc-800"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-fuchsia-500 text-xs font-medium text-white">
                    Популярный
                  </div>
                )}

                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>
                
                <AnimatedPrice
                  price={isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  currency="$"
                  period="/мес"
                />

                <ul className="mt-6 space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.name}
                      className={`flex items-center gap-2 text-sm ${
                        feature.included ? "text-zinc-300" : "text-zinc-600"
                      }`}
                    >
                      {feature.included ? (
                        <Check className="w-4 h-4 text-fuchsia-400" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      {feature.name}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    plan.popular
                      ? "bg-fuchsia-500 text-white hover:bg-fuchsia-400"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Интеграции</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrations.map((int, i) => (
              <motion.div
                key={int.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${int.color} flex items-center justify-center mx-auto mb-3`}>
                  <int.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium text-zinc-300">{int.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Отзывы основателей</h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-fuchsia-400 fill-fuchsia-400" />
                  ))}
                </div>
                <p className="text-zinc-300 mb-4">"{t.text}"</p>
                <div>
                  <p className="font-medium text-white">{t.author}</p>
                  <p className="text-sm text-zinc-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/30 p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent" />
            <div className="relative z-10">
              <Rocket className="w-16 h-16 text-fuchsia-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Готовы запустить свой SaaS?
              </h2>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Начните 14-дневный trial без кредитной карты. 
                Полный доступ ко всем функциям.
              </p>
              <GradientButton className="bg-gradient-to-r from-fuchsia-500 to-pink-500 px-12 py-4 text-lg">
                Начать бесплатно
                <ArrowRight className="w-5 h-5 ml-2" />
              </GradientButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-6 h-6 text-fuchsia-400" />
                <span className="font-bold text-xl">Platform X</span>
              </div>
              <p className="text-sm text-zinc-500">
                Инфраструктура для вашего SaaS
              </p>
            </div>
            {[
              { title: "Продукт", links: ["Возможности", "Цены", "Интеграции", "Changelog"] },
              { title: "Ресурсы", links: ["Документация", "API", "Блог", "Статус"] },
              { title: "Компания", links: ["О нас", "Карьера", "Контакты", "Legal"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-zinc-500 hover:text-fuchsia-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-zinc-800 text-center text-sm text-zinc-500">
            © 2025 Platform X. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
};
