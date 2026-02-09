import { useState } from "react";
import { Template } from "@/data/templates";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Bell, 
  Search,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ChevronDown,
  Plus,
  Filter,
  Download,
  Moon,
  Sun,
  Command,
  Zap,
  Target,
  DollarSign,
  Activity,
  X,
  GripVertical
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { AnimatedCounter, ScrollReveal, StaggerContainer, StaggerItem } from "./shared";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface WebAppPreviewProps {
  template: Template;
}

export const WebAppPreview = ({ template }: WebAppPreviewProps) => {
  const accentClass = template.accentColor.replace('bg-', '');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeTab, setActiveTab] = useState("week");
  const [selectedPeriod, setSelectedPeriod] = useState(1);
  
  const [widgets, setWidgets] = useState([
    { id: "revenue", title: "Выручка", value: 847200, prefix: "₽", change: 18.7, up: true, icon: DollarSign },
    { id: "users", title: "Пользователи", value: 12543, change: 12.5, up: true, icon: Users },
    { id: "sessions", title: "Сессии", value: 3241, change: 8.2, up: true, icon: Activity },
    { id: "conversion", title: "Конверсия", value: 24.8, suffix: "%", change: -2.4, up: false, icon: Target },
  ]);

  const [tasks, setTasks] = useState([
    { id: "1", title: "Подготовить отчёт", status: "done" },
    { id: "2", title: "Провести встречу с командой", status: "in-progress" },
    { id: "3", title: "Обновить документацию", status: "pending" },
    { id: "4", title: "Ревью кода", status: "pending" },
  ]);

  const chartData = [
    { name: "Пн", value: 4000, sales: 2400 },
    { name: "Вт", value: 3000, sales: 1398 },
    { name: "Ср", value: 5000, sales: 4800 },
    { name: "Чт", value: 2780, sales: 3908 },
    { name: "Пт", value: 5890, sales: 4800 },
    { name: "Сб", value: 3390, sales: 3800 },
    { name: "Вс", value: 3490, sales: 4300 },
  ];

  const pieData = [
    { name: "Прямой", value: 400, color: template.accentColor.includes("blue") ? "#3b82f6" : template.accentColor.includes("violet") ? "#8b5cf6" : "#f59e0b" },
    { name: "Органический", value: 300, color: "#10b981" },
    { name: "Реферальный", value: 200, color: "#6366f1" },
    { name: "Соцсети", value: 100, color: "#ec4899" },
  ];

  const notifications = [
    { id: 1, title: "Новый пользователь", desc: "Мария К. зарегистрировалась", time: "2 мин назад", unread: true },
    { id: 2, title: "Достижение цели", desc: "Выручка превысила 800К", time: "1 час назад", unread: true },
    { id: 3, title: "Обновление системы", desc: "Версия 2.4.1 установлена", time: "3 часа назад", unread: false },
  ];

  const kanbanColumns = [
    { id: "todo", title: "К выполнению", tasks: ["Исследование рынка", "Прототип дизайна"] },
    { id: "progress", title: "В работе", tasks: ["API интеграция", "Тестирование"] },
    { id: "done", title: "Готово", tasks: ["Документация", "Деплой v2.3"] },
  ];

  const accentColor = template.accentColor.includes("blue") ? "#3b82f6" : template.accentColor.includes("violet") ? "#8b5cf6" : "#f59e0b";

  return (
    <div className={`min-h-screen bg-gradient-to-b ${template.gradient} flex`}>
      {/* Sidebar */}
      <motion.aside 
        className="hidden lg:flex w-64 flex-col border-r border-white/10 bg-black/20"
        initial={{ x: -264 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6 border-b border-white/10">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className={`w-10 h-10 rounded-xl ${template.accentColor} flex items-center justify-center`}>
              <LayoutDashboard className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg text-white">Dashboard</span>
          </motion.div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {[
              { icon: LayoutDashboard, label: "Обзор", active: true },
              { icon: BarChart3, label: "Аналитика", badge: "Новое" },
              { icon: Users, label: "Пользователи" },
              { icon: Calendar, label: "Календарь" },
              { icon: Settings, label: "Настройки" },
            ].map(({ icon: Icon, label, active, badge }) => (
              <motion.li key={label} whileHover={{ x: 4 }}>
                <a 
                  href="#" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active 
                      ? `${template.accentColor} text-black` 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1">{label}</span>
                  {badge && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${active ? "bg-black/20" : `bg-${accentClass}`} ${active ? "text-black" : "text-black"}`}>
                      {badge}
                    </span>
                  )}
                </a>
              </motion.li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <motion.div 
            className="p-4 rounded-xl bg-white/5 border border-white/10"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className={`w-5 h-5 text-${accentClass}`} />
              <span className="text-sm text-white/50">Pro Plan</span>
            </div>
            <div className="text-white font-medium mb-3 text-sm">Обновите для доступа к новым функциям</div>
            <Button size="sm" className={`w-full ${template.accentColor} text-black hover:opacity-90`}>
              Обновить
            </Button>
          </motion.div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            {/* Search with Command Palette hint */}
            <div className="flex-1 max-w-md">
              <motion.div 
                className="relative cursor-pointer"
                onClick={() => setShowCommandPalette(true)}
                whileHover={{ scale: 1.02 }}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <div className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white/40 text-sm flex items-center justify-between">
                  <span>Поиск...</span>
                  <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-xs">
                    <Command className="w-3 h-3" />K
                  </kbd>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button 
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                onClick={() => setIsDarkMode(!isDarkMode)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </motion.button>

              {/* Notifications */}
              <div className="relative">
                <motion.button 
                  className="relative text-white/70 hover:text-white transition-colors"
                  onClick={() => setShowNotifications(!showNotifications)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Bell className="w-5 h-5" />
                  <span className={`absolute -top-1 -right-1 w-4 h-4 ${template.accentColor} rounded-full text-xs text-black flex items-center justify-center`}>
                    2
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h4 className="font-medium text-white">Уведомления</h4>
                        <button className="text-xs text-white/50 hover:text-white">Прочитать все</button>
                      </div>
                      <div className="max-h-80 overflow-auto">
                        {notifications.map((n) => (
                          <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 ${n.unread ? "bg-white/5" : ""}`}>
                            <div className="flex items-start gap-3">
                              {n.unread && <div className={`w-2 h-2 rounded-full ${template.accentColor} mt-2`} />}
                              <div className="flex-1">
                                <div className="font-medium text-white text-sm">{n.title}</div>
                                <div className="text-white/50 text-sm">{n.desc}</div>
                                <div className="text-white/30 text-xs mt-1">{n.time}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              <div className="relative">
                <motion.button 
                  className="flex items-center gap-3"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-9 h-9 rounded-full bg-white/20" />
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-white">Иван Петров</div>
                    <div className="text-xs text-white/50">Администратор</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/50" />
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      {["Профиль", "Настройки", "Тарифы", "Выйти"].map((item, i) => (
                        <button 
                          key={item}
                          className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 ${i === 3 ? "text-red-400 border-t border-white/10" : "text-white/70"}`}
                        >
                          {item}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="px-6 pb-3 flex items-center gap-2 text-sm">
            <span className="text-white/40">Dashboard</span>
            <span className="text-white/20">/</span>
            <span className="text-white">Обзор</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <motion.h1 
                className="text-2xl font-bold text-white mb-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Добро пожаловать, Иван 👋
              </motion.h1>
              <p className="text-white/50">Вот что происходит с вашим бизнесом сегодня</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </Button>
              <Button className={`${template.accentColor} text-black hover:opacity-90`}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </div>
          </div>

          {/* Stats Grid - Draggable */}
          <Reorder.Group 
            axis="x" 
            values={widgets} 
            onReorder={setWidgets}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {widgets.map((stat) => (
              <Reorder.Item key={stat.id} value={stat}>
                <motion.div 
                  className="p-6 rounded-xl bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-${accentClass}/20 flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 text-${accentClass}`} />
                    </div>
                    <button className="text-white/40 hover:text-white">
                      <GripVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-white/50 text-sm mb-1">{stat.title}</div>
                  <div className="text-2xl font-bold text-white mb-2">
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
              className="lg:col-span-2 p-6 rounded-xl bg-white/5 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white">Динамика продаж</h3>
                <div className="flex gap-2">
                  {["Неделя", "Месяц", "Год"].map((period, i) => (
                    <button 
                      key={period}
                      onClick={() => setSelectedPeriod(i)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        i === selectedPeriod ? `${template.accentColor} text-black` : 'text-white/50 hover:text-white'
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
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: 'white' }}
                    />
                    <Area type="monotone" dataKey="value" stroke={accentColor} fill="url(#colorValue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Tasks */}
            <motion.div 
              className="p-6 rounded-xl bg-white/5 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white">Задачи на сегодня</h3>
                <button className={`text-${accentClass} text-sm hover:underline`}>Все задачи</button>
              </div>
              <ul className="space-y-3">
                {tasks.map((task, i) => (
                  <motion.li 
                    key={task.id} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : task.status === 'in-progress' ? (
                      <Clock className={`w-5 h-5 text-${accentClass}`} />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                    )}
                    <span className={`flex-1 text-sm ${task.status === 'done' ? 'text-white/50 line-through' : 'text-white'}`}>
                      {task.title}
                    </span>
                  </motion.li>
                ))}
              </ul>
              <Button className={`w-full mt-4 ${template.accentColor} text-black hover:opacity-90`}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить задачу
              </Button>
            </motion.div>
          </div>

          {/* Second Row: Pie Chart + Kanban */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Pie Chart */}
            <motion.div 
              className="p-6 rounded-xl bg-white/5 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="font-semibold text-white mb-6">Источники трафика</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-white/60 text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mini Kanban */}
            <motion.div 
              className="lg:col-span-2 p-6 rounded-xl bg-white/5 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white">Доска задач</h3>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  Фильтр
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {kanbanColumns.map((col, i) => (
                  <div key={col.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/70">{col.title}</span>
                      <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">{col.tasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {col.tasks.map((task, j) => (
                        <motion.div
                          key={task}
                          className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white cursor-move hover:border-white/20"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + j * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          {task}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity Table */}
          <motion.div 
            className="p-6 rounded-xl bg-white/5 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-white">Последняя активность</h3>
              <button className={`text-${accentClass} text-sm hover:underline flex items-center gap-1`}>
                Смотреть все
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white/40 text-sm border-b border-white/10">
                    <th className="pb-3 font-medium">Пользователь</th>
                    <th className="pb-3 font-medium">Действие</th>
                    <th className="pb-3 font-medium">Дата</th>
                    <th className="pb-3 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { user: "Мария К.", action: "Создала новый проект", date: "2 мин назад", status: "Успешно" },
                    { user: "Алексей П.", action: "Обновил настройки", date: "15 мин назад", status: "Успешно" },
                    { user: "Елена С.", action: "Экспортировала отчёт", date: "1 час назад", status: "В процессе" },
                  ].map((row, i) => (
                    <motion.tr 
                      key={i} 
                      className="border-b border-white/5 hover:bg-white/5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/20" />
                          <span className="text-white">{row.user}</span>
                        </div>
                      </td>
                      <td className="py-4 text-white/70">{row.action}</td>
                      <td className="py-4 text-white/50">{row.date}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          row.status === 'Успешно' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Command Palette */}
      <AnimatePresence>
        {showCommandPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-start justify-center pt-32"
            onClick={() => setShowCommandPalette(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <Search className="w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Введите команду или поиск..."
                  autoFocus
                  className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none"
                />
                <kbd className="px-2 py-1 rounded bg-white/10 text-white/40 text-xs">ESC</kbd>
              </div>
              <div className="p-2 max-h-80 overflow-auto">
                <div className="text-xs text-white/40 px-3 py-2">Быстрые действия</div>
                {[
                  { icon: Plus, label: "Создать проект" },
                  { icon: Users, label: "Добавить пользователя" },
                  { icon: BarChart3, label: "Открыть аналитику" },
                  { icon: Settings, label: "Настройки" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
