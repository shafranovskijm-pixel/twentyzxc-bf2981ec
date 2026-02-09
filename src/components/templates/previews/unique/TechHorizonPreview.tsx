import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Terminal, Code2, Zap, GitBranch, Slack, Github, 
  ChevronRight, Copy, Check, Search, ArrowRight,
  Clock, Activity, Database, Shield, Globe, Cpu
} from "lucide-react";
import { Template } from "@/data/templates";
import { 
  TypewriterText, ScrollReveal, StaggerContainer, StaggerItem, 
  GradientButton, LogoCarousel 
} from "../shared";
import { CodeBlock } from "../shared/CodeBlock";
import { PricingToggle, AnimatedPrice } from "../shared/PricingToggle";
import { StatusIndicator, StatusCard, StatusBanner } from "../shared/StatusIndicator";
import { ImageWithFallback } from "../../ImageWithFallback";

const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/template-images`;

interface TechHorizonPreviewProps {
  template: Template;
}

export const TechHorizonPreview = ({ template }: TechHorizonPreviewProps) => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeTab, setActiveTab] = useState<"curl" | "node" | "python">("curl");
  const [copied, setCopied] = useState(false);

  const codeExamples = {
    curl: `curl -X POST https://api.techhorizon.io/v1/data \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "SELECT * FROM users"}'`,
    node: `import { TechHorizon } from '@techhorizon/sdk';

const client = new TechHorizon('YOUR_API_KEY');

const result = await client.query({
  sql: 'SELECT * FROM users',
  params: []
});

console.log(result.data);`,
    python: `from techhorizon import Client

client = Client(api_key="YOUR_API_KEY")

result = client.query(
    sql="SELECT * FROM users",
    params=[]
)

print(result.data)`,
  };

  const integrations = [
    { name: "GitHub", icon: Github },
    { name: "Slack", icon: Slack },
    { name: "Vercel", icon: Globe },
    { name: "Docker", icon: Database },
    { name: "AWS", icon: Shield },
    { name: "Kubernetes", icon: Cpu },
  ];

  const metrics = [
    { label: "API Requests", value: "2.4M", change: "+12%", positive: true },
    { label: "Avg Latency", value: "45ms", change: "-8%", positive: true },
    { label: "Uptime", value: "99.99%", change: "0%", positive: true },
    { label: "Active Users", value: "12.5K", change: "+23%", positive: true },
  ];

  const changelog = [
    { version: "2.1.0", date: "8 Фев 2025", title: "GraphQL Support", type: "feature" },
    { version: "2.0.5", date: "2 Фев 2025", title: "Performance improvements", type: "improvement" },
    { version: "2.0.4", date: "28 Янв 2025", title: "Security patch", type: "security" },
    { version: "2.0.3", date: "20 Янв 2025", title: "Bug fixes", type: "fix" },
  ];

  const pricingPlans = [
    { 
      name: "Starter", 
      monthlyPrice: 29, 
      annualPrice: 24,
      description: "Для небольших проектов",
      features: ["10K API запросов/мес", "1 GB хранилище", "Email поддержка", "Базовая аналитика"],
      highlighted: false
    },
    { 
      name: "Pro", 
      monthlyPrice: 99, 
      annualPrice: 79,
      description: "Для растущих компаний",
      features: ["100K API запросов/мес", "10 GB хранилище", "Приоритетная поддержка", "Расширенная аналитика", "Webhooks", "API Rate limiting"],
      highlighted: true
    },
    { 
      name: "Enterprise", 
      monthlyPrice: 299, 
      annualPrice: 249,
      description: "Для крупного бизнеса",
      features: ["Безлимит API запросов", "100 GB хранилище", "24/7 поддержка", "SLA 99.99%", "Dedicated инфраструктура", "Custom интеграции"],
      highlighted: false
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        {/* Glowing orbs */}
        <motion.div
          animate={{ 
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ 
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px]"
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-sm font-medium">v2.1 — GraphQL теперь доступен</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Tech Horizon
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto"
          >
            API-first платформа для современных разработчиков. 
            <TypewriterText 
              texts={["Масштабируемость", "Надёжность", "Скорость", "Безопасность"]}
              className="text-cyan-400 ml-2"
            />
          </motion.p>

          {/* Terminal preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/80 backdrop-blur-xl rounded-xl border border-zinc-800 overflow-hidden text-left max-w-2xl mx-auto mb-8"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-zinc-500 text-xs ml-2">terminal</span>
            </div>
            <div className="p-4 font-mono text-sm">
              <div className="text-zinc-500">$ npm install @techhorizon/sdk</div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-emerald-400 mt-2"
              >
                ✓ Installed successfully in 1.2s
              </motion.div>
            </div>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <GradientButton className="bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-lg">
              Начать бесплатно
              <ArrowRight className="w-5 h-5 ml-2" />
            </GradientButton>
            <button className="px-8 py-4 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Документация
            </button>
          </motion.div>
        </div>
      </section>

      {/* Status Section */}
      <section className="py-12 px-6 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <StatusBanner status="operational" message="Все системы работают стабильно" />
        </div>
      </section>

      {/* Code Examples Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Простая <span className="text-cyan-400">интеграция</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Начните работу за минуты с нашими SDK для популярных языков
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Code tabs */}
            <div>
              <div className="flex gap-2 mb-4">
                {(["curl", "node", "python"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab 
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
              <CodeBlock code={codeExamples[activeTab]} language={activeTab} />
            </div>

            {/* Response preview */}
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-zinc-300">Response</span>
                <span className="ml-auto px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">200 OK</span>
              </div>
              <pre className="font-mono text-sm text-zinc-400 overflow-x-auto">
{`{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2025-02-08T10:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "latency_ms": 42
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Dashboard Section */}
      <section className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Мониторинг в <span className="text-cyan-400">реальном времени</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800"
              >
                <p className="text-sm text-zinc-500 mb-1">{metric.label}</p>
                <p className="text-3xl font-bold text-white mb-1">{metric.value}</p>
                <span className={`text-xs ${metric.positive ? "text-emerald-400" : "text-red-400"}`}>
                  {metric.change}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Status cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <StatusCard name="API Gateway" status="operational" uptime={99.99} latency={32} />
            <StatusCard name="Database Cluster" status="operational" uptime={99.98} latency={8} />
            <StatusCard name="CDN" status="operational" uptime={100} latency={12} />
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Интеграции</h2>
              <p className="text-zinc-400">Подключайтесь к вашим любимым инструментам</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {integrations.map((integration, i) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, borderColor: "rgba(6, 182, 212, 0.5)" }}
                transition={{ delay: i * 0.05 }}
                className="aspect-square rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <integration.icon className="w-8 h-8 text-zinc-400" />
                <span className="text-xs text-zinc-500">{integration.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Changelog Section */}
      <section className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Changelog</h2>
              <p className="text-zinc-400">Последние обновления платформы</p>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {changelog.map((item, i) => (
              <motion.div
                key={item.version}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800"
              >
                <div className={`px-3 py-1 rounded-full text-xs font-mono ${
                  item.type === "feature" ? "bg-cyan-500/20 text-cyan-400" :
                  item.type === "security" ? "bg-red-500/20 text-red-400" :
                  item.type === "improvement" ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-zinc-700 text-zinc-300"
                }`}>
                  {item.version}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{item.title}</p>
                </div>
                <span className="text-sm text-zinc-500">{item.date}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Тарифы</h2>
              <p className="text-zinc-400 mb-8">Выберите план, подходящий для вашего проекта</p>
              <PricingToggle 
                isAnnual={isAnnual} 
                onToggle={setIsAnnual}
                monthlyLabel="Месяц"
                annualLabel="Год"
              />
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-6 rounded-2xl border ${
                  plan.highlighted 
                    ? "bg-gradient-to-b from-cyan-500/10 to-transparent border-cyan-500/30" 
                    : "bg-zinc-900/50 border-zinc-800"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-xs font-medium text-white">
                    Популярный
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">{plan.description}</p>
                <AnimatedPrice 
                  price={isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  currency="$"
                  period="/мес"
                />
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-cyan-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full mt-6 py-3 rounded-xl font-medium transition-colors ${
                  plan.highlighted 
                    ? "bg-cyan-500 text-white hover:bg-cyan-400" 
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}>
                  Выбрать план
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Документация</h2>
              <p className="text-zinc-400">Быстрый поиск по базе знаний</p>
            </div>
          </ScrollReveal>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск по документации..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              { title: "Быстрый старт", desc: "Начните за 5 минут", icon: Zap },
              { title: "API Reference", desc: "Полное описание API", icon: Code2 },
              { title: "Примеры", desc: "Готовые сниппеты", icon: GitBranch },
            ].map((item) => (
              <motion.div
                key={item.title}
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 cursor-pointer hover:border-cyan-500/30 transition-colors"
              >
                <item.icon className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-6 h-6 text-cyan-400" />
                <span className="font-bold text-white">Tech Horizon</span>
              </div>
              <p className="text-sm text-zinc-500">
                API-first платформа для современных разработчиков
              </p>
            </div>
            {[
              { title: "Продукт", links: ["Возможности", "Цены", "Changelog", "Roadmap"] },
              { title: "Ресурсы", links: ["Документация", "API Reference", "Статус", "Блог"] },
              { title: "Компания", links: ["О нас", "Карьера", "Контакты", "Legal"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">© 2025 Tech Horizon. Все права защищены.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Github className="w-5 h-5 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
              <Slack className="w-5 h-5 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
