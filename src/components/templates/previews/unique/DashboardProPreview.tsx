import { useState } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, Users, BarChart3, Settings, Bell, Search, TrendingUp, TrendingDown, 
  ChevronDown, Plus, Download, DollarSign, Activity, Target, Calendar, PieChart,
  ArrowUpRight, CheckCircle2, Clock, MoreHorizontal, Filter, Zap
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { AnimatedCounter, ScrollReveal } from "../shared";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ImageWithFallback } from "../../ImageWithFallback";

const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/template-images`;

interface DashboardProPreviewProps {
  template: Template;
}

export const DashboardProPreview = ({ template }: DashboardProPreviewProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(0);

  const [widgets, setWidgets] = useState([
    { id: "revenue", title: "Выручка", value: 2845600, prefix: "₽", change: 12.5, up: true, icon: DollarSign },
    { id: "users", title: "Активные пользователи", value: 12847, change: 8.3, up: true, icon: Users },
    { id: "orders", title: "Заказы", value: 1543, change: 15.2, up: true, icon: Activity },
    { id: "conversion", title: "Конверсия", value: 3.2, suffix: "%", change: -1.8, up: false, icon: Target },
  ]);

  const chartData = [
    { name: "Янв", value: 4000, orders: 240 },
    { name: "Фев", value: 3000, orders: 139 },
    { name: "Мар", value: 5000, orders: 480 },
    { name: "Апр", value: 2780, orders: 390 },
    { name: "Май", value: 5890, orders: 480 },
    { name: "Июн", value: 4390, orders: 380 },
    { name: "Июл", value: 6490, orders: 530 },
  ];

  const recentOrders = [
    { id: "#12847", customer: "Александр М.", amount: "45 000 ₽", status: "completed" },
    { id: "#12846", customer: "Мария К.", amount: "28 500 ₽", status: "pending" },
    { id: "#12845", customer: "Дмитрий С.", amount: "156 200 ₽", status: "completed" },
    { id: "#12844", customer: "Елена П.", amount: "67 800 ₽", status: "processing" },
  ];

  const tasks = [
    { title: "Подготовить квартальный отчёт", due: "Сегодня", priority: "high" },
    { title: "Встреча с командой продаж", due: "14:00", priority: "medium" },
    { title: "Обновить документацию API", due: "Завтра", priority: "low" },
  ];

  const notifications = [
    { title: "Новый заказ #12847", time: "2 мин назад", unread: true },
    { title: "Платёж подтверждён", time: "15 мин назад", unread: true },
    { title: "Отчёт сформирован", time: "1 час назад", unread: false },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <motion.aside 
        className="hidden lg:flex w-64 flex-col border-r border-blue-500/10 bg-slate-900"
        initial={{ x: -264 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6 border-b border-blue-500/10">
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Dashboard<span className="text-blue-400">Pro</span></span>
          </motion.div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {[
              { icon: LayoutDashboard, label: "Обзор", active: true },
              { icon: BarChart3, label: "Аналитика", badge: "Новое" },
              { icon: Users, label: "Пользователи" },
              { icon: DollarSign, label: "Финансы" },
              { icon: Calendar, label: "Календарь" },
              { icon: Settings, label: "Настройки" },
            ].map(({ icon: Icon, label, active, badge }) => (
              <motion.li key={label} whileHover={{ x: 4 }}>
                <a 
                  href="#" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1">{label}</span>
                  {badge && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${active ? "bg-white/20" : "bg-blue-500"}`}>
                      {badge}
                    </span>
                  )}
                </a>
              </motion.li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-500/10">
          <motion.div 
            className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-white/60">Pro Plan</span>
            </div>
            <div className="text-white font-medium mb-3 text-sm">Обновитесь для доступа ко всем функциям</div>
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white">
              Обновить
            </Button>
          </motion.div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="border-b border-blue-500/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text"
                  placeholder="Поиск..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-blue-500/50 outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <motion.button 
                  className="relative w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                  whileHover={{ scale: 1.05 }}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                </motion.button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-blue-500/20 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h4 className="font-medium">Уведомления</h4>
                        <button className="text-xs text-blue-400">Прочитать все</button>
                      </div>
                      <div className="max-h-80 overflow-auto">
                        {notifications.map((n, i) => (
                          <div key={i} className={`p-4 border-b border-white/5 hover:bg-white/5 ${n.unread ? "bg-blue-500/5" : ""}`}>
                            <div className="flex items-start gap-3">
                              {n.unread && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />}
                              <div className="flex-1">
                                <div className="font-medium text-sm">{n.title}</div>
                                <div className="text-white/40 text-xs mt-1">{n.time}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User */}
              <motion.div 
                className="flex items-center gap-3 cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <ImageWithFallback src={`${STORAGE_BASE}/dashboard-pro/avatar-1.png`} alt="User avatar" className="w-10 h-10 rounded-full" />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">Иван Петров</div>
                  <div className="text-xs text-white/50">Администратор</div>
                </div>
                <ChevronDown className="w-4 h-4 text-white/50" />
              </motion.div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <motion.h1 
                className="text-2xl font-bold mb-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Добро пожаловать, Иван 👋
              </motion.h1>
              <p className="text-white/50">Вот что происходит с вашим бизнесом сегодня</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Создать
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <Reorder.Group 
            axis="x" 
            values={widgets} 
            onReorder={setWidgets}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {widgets.map((stat) => (
              <Reorder.Item key={stat.id} value={stat}>
                <motion.div 
                  className="p-6 rounded-xl bg-slate-900/50 border border-blue-500/10 cursor-grab active:cursor-grabbing hover:border-blue-500/30 transition-all"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <button className="text-white/40 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-white/60 text-sm mb-1">{stat.title}</div>
                  <div className="text-2xl font-bold mb-2">
                    {stat.prefix && stat.prefix}
                    <AnimatedCounter value={stat.value} duration={1.5} />
                    {stat.suffix && stat.suffix}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{stat.change > 0 ? "+" : ""}{stat.change}%</span>
                    <span className="text-white/40">vs прошлый месяц</span>
                  </div>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Main Chart */}
            <motion.div 
              className="lg:col-span-2 p-6 rounded-xl bg-slate-900/50 border border-blue-500/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Динамика выручки</h3>
                <div className="flex gap-2">
                  {["Неделя", "Месяц", "Год"].map((period, i) => (
                    <button 
                      key={period}
                      onClick={() => setSelectedPeriod(i)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        i === selectedPeriod ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid rgba(59,130,246,0.2)', 
                        borderRadius: '8px',
                        color: 'white'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fill="url(#colorBlue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Tasks */}
            <motion.div 
              className="p-6 rounded-xl bg-slate-900/50 border border-blue-500/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Задачи</h3>
                <button className="text-blue-400 text-sm">Все задачи</button>
              </div>
              
              <div className="space-y-4">
                {tasks.map((task, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      task.priority === "high" ? "bg-red-500" :
                      task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="text-xs text-white/40 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {task.due}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Orders */}
          <motion.div 
            className="p-6 rounded-xl bg-slate-900/50 border border-blue-500/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Последние заказы</h3>
              <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5">
                <Filter className="w-4 h-4 mr-2" />
                Фильтр
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white/40 text-sm border-b border-white/10">
                    <th className="pb-4 font-medium">ID</th>
                    <th className="pb-4 font-medium">Клиент</th>
                    <th className="pb-4 font-medium">Сумма</th>
                    <th className="pb-4 font-medium">Статус</th>
                    <th className="pb-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => (
                    <motion.tr 
                      key={i} 
                      className="border-b border-white/5 hover:bg-white/5"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <td className="py-4 text-blue-400 font-medium">{order.id}</td>
                      <td className="py-4">{order.customer}</td>
                      <td className="py-4 font-medium">{order.amount}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          order.status === "completed" ? "bg-green-500/20 text-green-400" :
                          order.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {order.status === "completed" ? "Завершён" :
                           order.status === "pending" ? "Ожидание" : "В работе"}
                        </span>
                      </td>
                      <td className="py-4">
                        <Button variant="ghost" size="sm" className="text-white/40 hover:text-white">
                          <ArrowUpRight className="w-4 h-4" />
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
