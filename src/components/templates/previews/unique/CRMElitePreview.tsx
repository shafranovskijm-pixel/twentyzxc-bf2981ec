import { useState } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { 
  Users, Target, TrendingUp, ChevronDown, Plus, Download, Phone, Mail, 
  Filter, MoreHorizontal, Star, DollarSign, ArrowUpRight, Calendar,
  CheckCircle2, XCircle, Clock, MessageSquare, Settings, Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter, ScrollReveal } from "../shared";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CRMElitePreviewProps {
  template: Template;
}

export const CRMElitePreview = ({ template }: CRMElitePreviewProps) => {
  const [activeTab, setActiveTab] = useState("leads");
  const [showNotifications, setShowNotifications] = useState(false);

  const funnelData = [
    { stage: "Leads", count: 1250, color: "#8b5cf6", percentage: 100 },
    { stage: "Qualified", count: 890, color: "#a78bfa", percentage: 71 },
    { stage: "Proposal", count: 420, color: "#c4b5fd", percentage: 34 },
    { stage: "Negotiation", count: 180, color: "#ddd6fe", percentage: 14 },
    { stage: "Won", count: 95, color: "#10b981", percentage: 8 },
  ];

  const leads = [
    { name: "Алексей Смирнов", company: "TechCorp", value: "450 000 ₽", stage: "proposal", priority: "high", lastContact: "2 часа назад" },
    { name: "Мария Петрова", company: "DesignStudio", value: "280 000 ₽", stage: "qualified", priority: "medium", lastContact: "1 день назад" },
    { name: "Дмитрий Козлов", company: "StartupX", value: "1 200 000 ₽", stage: "negotiation", priority: "high", lastContact: "30 мин назад" },
    { name: "Елена Иванова", company: "MediaGroup", value: "95 000 ₽", stage: "leads", priority: "low", lastContact: "3 дня назад" },
  ];

  const activities = [
    { type: "call", contact: "Алексей Смирнов", time: "10:30", done: true },
    { type: "meeting", contact: "Дмитрий Козлов", time: "14:00", done: false },
    { type: "email", contact: "Мария Петрова", time: "16:30", done: false },
  ];

  const chartData = [
    { month: "Янв", value: 4500 },
    { month: "Фев", value: 5200 },
    { month: "Мар", value: 4800 },
    { month: "Апр", value: 6100 },
    { month: "Май", value: 5800 },
    { month: "Июн", value: 7200 },
  ];

  const pieData = [
    { name: "Новые", value: 35, color: "#8b5cf6" },
    { name: "В работе", value: 45, color: "#a78bfa" },
    { name: "Закрыты", value: 20, color: "#10b981" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <motion.aside 
        className="hidden lg:flex w-64 flex-col border-r border-violet-500/10 bg-slate-900"
        initial={{ x: -264 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6 border-b border-violet-500/10">
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">CRM<span className="text-violet-400">Elite</span></span>
          </motion.div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="text-xs text-white/30 uppercase tracking-widest mb-4 px-4">Главное</div>
          <ul className="space-y-1">
            {[
              { icon: Target, label: "Дашборд", active: true },
              { icon: Users, label: "Лиды", badge: "128" },
              { icon: DollarSign, label: "Сделки" },
              { icon: Calendar, label: "Задачи" },
              { icon: TrendingUp, label: "Аналитика" },
            ].map(({ icon: Icon, label, active, badge }) => (
              <motion.li key={label} whileHover={{ x: 4 }}>
                <a 
                  href="#" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active 
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1">{label}</span>
                  {badge && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${active ? "bg-white/20" : "bg-violet-500"}`}>
                      {badge}
                    </span>
                  )}
                </a>
              </motion.li>
            ))}
          </ul>

          <div className="text-xs text-white/30 uppercase tracking-widest mb-4 px-4 mt-8">Инструменты</div>
          <ul className="space-y-1">
            {[
              { icon: MessageSquare, label: "Сообщения" },
              { icon: Settings, label: "Настройки" },
            ].map(({ icon: Icon, label }) => (
              <motion.li key={label} whileHover={{ x: 4 }}>
                <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </a>
              </motion.li>
            ))}
          </ul>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="border-b border-violet-500/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Воронка продаж</h1>
              <p className="text-white/50 text-sm">Обзор текущих сделок</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.button 
                  className="relative w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                  whileHover={{ scale: 1.05 }}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full" />
                </motion.button>
              </div>

              <motion.div 
                className="flex items-center gap-3 cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600" />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">Анна Волкова</div>
                  <div className="text-xs text-white/50">Sales Manager</div>
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { title: "Всего лидов", value: 1250, change: "+12%", up: true, icon: Users },
              { title: "Конверсия", value: 7.6, suffix: "%", change: "+2.1%", up: true, icon: Target },
              { title: "Средний чек", value: 385000, prefix: "₽", change: "+8%", up: true, icon: DollarSign },
              { title: "Выиграно сделок", value: 95, change: "+15", up: true, icon: CheckCircle2 },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                className="p-6 rounded-xl bg-slate-900/50 border border-violet-500/10 hover:border-violet-500/30 transition-all"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="text-green-400 text-sm">{stat.change}</span>
                </div>
                <div className="text-white/60 text-sm mb-1">{stat.title}</div>
                <div className="text-2xl font-bold">
                  {stat.prefix}
                  <AnimatedCounter value={stat.value} duration={1.5} />
                  {stat.suffix}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Sales Funnel */}
            <motion.div 
              className="lg:col-span-2 p-6 rounded-xl bg-slate-900/50 border border-violet-500/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-semibold mb-6">Воронка продаж</h3>
              <div className="space-y-4">
                {funnelData.map((stage, i) => (
                  <motion.div 
                    key={i}
                    className="relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/70">{stage.stage}</span>
                      <span className="text-sm font-medium">{stage.count}</span>
                    </div>
                    <div className="h-8 rounded-lg overflow-hidden bg-white/5">
                      <motion.div 
                        className="h-full rounded-lg"
                        style={{ backgroundColor: stage.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.percentage}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Activities */}
            <motion.div 
              className="p-6 rounded-xl bg-slate-900/50 border border-violet-500/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Сегодня</h3>
                <button className="text-violet-400 text-sm">Все</button>
              </div>
              
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.done ? "bg-green-500/20" : "bg-violet-500/20"
                    }`}>
                      {activity.type === "call" && <Phone className={`w-4 h-4 ${activity.done ? "text-green-400" : "text-violet-400"}`} />}
                      {activity.type === "meeting" && <Users className={`w-4 h-4 ${activity.done ? "text-green-400" : "text-violet-400"}`} />}
                      {activity.type === "email" && <Mail className={`w-4 h-4 ${activity.done ? "text-green-400" : "text-violet-400"}`} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{activity.contact}</div>
                      <div className="text-xs text-white/40">{activity.time}</div>
                    </div>
                    {activity.done ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-white/30" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Leads Table */}
          <motion.div 
            className="p-6 rounded-xl bg-slate-900/50 border border-violet-500/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Активные лиды</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5">
                  <Filter className="w-4 h-4 mr-2" />
                  Фильтр
                </Button>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white/40 text-sm border-b border-white/10">
                    <th className="pb-4 font-medium">Контакт</th>
                    <th className="pb-4 font-medium">Компания</th>
                    <th className="pb-4 font-medium">Сумма</th>
                    <th className="pb-4 font-medium">Этап</th>
                    <th className="pb-4 font-medium">Приоритет</th>
                    <th className="pb-4 font-medium">Последний контакт</th>
                    <th className="pb-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <motion.tr 
                      key={i} 
                      className="border-b border-white/5 hover:bg-white/5"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600" />
                          <span className="font-medium">{lead.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-white/60">{lead.company}</td>
                      <td className="py-4 font-medium text-violet-400">{lead.value}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          lead.stage === "proposal" ? "bg-violet-500/20 text-violet-400" :
                          lead.stage === "negotiation" ? "bg-amber-500/20 text-amber-400" :
                          lead.stage === "qualified" ? "bg-blue-500/20 text-blue-400" :
                          "bg-white/10 text-white/60"
                        }`}>
                          {lead.stage === "proposal" ? "Предложение" :
                           lead.stage === "negotiation" ? "Переговоры" :
                           lead.stage === "qualified" ? "Квалифицирован" : "Лид"}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${
                                lead.priority === "high" ? "fill-amber-400 text-amber-400" :
                                lead.priority === "medium" && star <= 2 ? "fill-amber-400 text-amber-400" :
                                lead.priority === "low" && star <= 1 ? "fill-amber-400 text-amber-400" :
                                "text-white/20"
                              }`} 
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-4 text-white/40 text-sm">{lead.lastContact}</td>
                      <td className="py-4">
                        <Button variant="ghost" size="sm" className="text-white/40 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
