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
  ArrowUpRight
} from "lucide-react";

interface WebAppPreviewProps {
  template: Template;
}

export const WebAppPreview = ({ template }: WebAppPreviewProps) => {
  const accentClass = template.accentColor.replace('bg-', '');
  
  const stats = [
    { label: "Всего пользователей", value: "12,543", change: "+12.5%", up: true },
    { label: "Активных сессий", value: "3,241", change: "+8.2%", up: true },
    { label: "Конверсия", value: "24.8%", change: "-2.4%", up: false },
    { label: "Доход", value: "₽ 847,200", change: "+18.7%", up: true },
  ];

  const tasks = [
    { title: "Подготовить отчёт", status: "done" },
    { title: "Провести встречу с командой", status: "in-progress" },
    { title: "Обновить документацию", status: "pending" },
    { title: "Ревью кода", status: "pending" },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${template.gradient} flex`}>
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/10 bg-black/20">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${template.accentColor} flex items-center justify-center`}>
              <LayoutDashboard className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg text-white">Dashboard</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {[
              { icon: LayoutDashboard, label: "Обзор", active: true },
              { icon: BarChart3, label: "Аналитика" },
              { icon: Users, label: "Пользователи" },
              { icon: Calendar, label: "Календарь" },
              { icon: Settings, label: "Настройки" },
            ].map(({ icon: Icon, label, active }) => (
              <li key={label}>
                <a 
                  href="#" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active 
                      ? `${template.accentColor} text-black` 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm text-white/50 mb-2">Pro Plan</div>
            <div className="text-white font-medium mb-3">Обновите для доступа к новым функциям</div>
            <Button size="sm" className={`w-full ${template.accentColor} text-black hover:opacity-90`}>
              Обновить
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text" 
                  placeholder="Поиск..." 
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative text-white/70 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className={`absolute -top-1 -right-1 w-4 h-4 ${template.accentColor} rounded-full text-xs text-black flex items-center justify-center`}>
                  3
                </span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20" />
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-white">Иван Петров</div>
                  <div className="text-xs text-white/50">Администратор</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Добро пожаловать, Иван 👋</h1>
            <p className="text-white/50">Вот что происходит с вашим бизнесом сегодня</p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/50 text-sm">{stat.label}</span>
                  <button className="text-white/40 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
                <div className={`flex items-center gap-1 text-sm ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{stat.change}</span>
                  <span className="text-white/40">vs прошлый месяц</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart placeholder */}
            <div className="lg:col-span-2 p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white">Динамика продаж</h3>
                <div className="flex gap-2">
                  {["Неделя", "Месяц", "Год"].map((period, i) => (
                    <button 
                      key={period}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        i === 1 ? `${template.accentColor} text-black` : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              {/* Chart visualization */}
              <div className="h-64 flex items-end gap-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((height, i) => (
                  <div 
                    key={i} 
                    className="flex-1 rounded-t-md transition-all hover:opacity-80"
                    style={{ 
                      height: `${height}%`,
                      background: `linear-gradient(to top, ${template.accentColor.includes('amber') ? 'rgb(245, 158, 11)' : template.accentColor.includes('blue') ? 'rgb(59, 130, 246)' : template.accentColor.includes('violet') ? 'rgb(139, 92, 246)' : 'rgb(232, 121, 249)'}, transparent)`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Tasks */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white">Задачи на сегодня</h3>
                <button className={`text-${accentClass} text-sm hover:underline`}>Все задачи</button>
              </div>
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li key={task.title} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
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
                  </li>
                ))}
              </ul>
              <Button className={`w-full mt-4 ${template.accentColor} text-black hover:opacity-90`}>
                Добавить задачу
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10">
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
                    <tr key={i} className="border-b border-white/5">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
