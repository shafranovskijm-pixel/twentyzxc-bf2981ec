import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, FileText, UserPlus, TrendingUp, AlertTriangle, Clock, Bell,
  Loader2, Users, PieChart,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  CartesianGrid, PieChart as RePieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { format, subMonths, startOfMonth, endOfMonth, isAfter, isBefore, addDays } from "date-fns";
import { ru } from "date-fns/locale";

interface DashboardTabProps {
  onNavigate: (section: string) => void;
}

const DashboardTab = ({ onNavigate }: DashboardTabProps) => {
  const { data: contracts = [], isLoading: l1 } = useQuery({
    queryKey: ["dashboard-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, amount, amount_extra, payment_status, contract_date, paid_until, client_name, is_archived")
        .eq("is_archived", false);
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [], isLoading: l2 } = useQuery({
    queryKey: ["dashboard-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, status, created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [], isLoading: l3 } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, task_date, client_id")
        .eq("task_date", today)
        .neq("status", "done");
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [], isLoading: l4 } = useQuery({
    queryKey: ["dashboard-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, service_type");
      if (error) throw error;
      return data;
    },
  });

  const isLoading = l1 || l2 || l3 || l4;

  const kpi = useMemo(() => {
    const paid = contracts.filter((c) => c.payment_status === "оплачено");
    const revenue = paid.reduce((s, c) => s + (Number(c.amount) || 0) + (Number(c.amount_extra) || 0), 0);
    const activeContracts = contracts.length;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const newLeads = leads.filter((l) => l.created_at && new Date(l.created_at) >= monthStart).length;
    const converted = leads.filter((l) => l.status === "converted").length;
    const conversion = leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;

    const overdue = contracts.filter(
      (c) => c.paid_until && isBefore(new Date(c.paid_until), now) && c.payment_status !== "оплачено"
    );
    const expiringSoon = contracts.filter(
      (c) =>
        c.paid_until &&
        isAfter(new Date(c.paid_until), now) &&
        isBefore(new Date(c.paid_until), addDays(now, 7)) &&
        c.payment_status !== "оплачено"
    );

    return { revenue, activeContracts, newLeads, conversion, overdue, expiringSoon };
  }, [contracts, leads]);

  // Revenue by month (last 6 months)
  const revenueChart = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const ms = startOfMonth(month);
      const me = endOfMonth(month);
      const total = contracts
        .filter(
          (c) =>
            c.payment_status === "оплачено" &&
            c.contract_date &&
            new Date(c.contract_date) >= ms &&
            new Date(c.contract_date) <= me
        )
        .reduce((s, c) => s + (Number(c.amount) || 0) + (Number(c.amount_extra) || 0), 0);
      return { name: format(month, "LLL", { locale: ru }), value: total };
    });
  }, [contracts]);

  // Leads by month (last 6 months)
  const leadsChart = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const ms = startOfMonth(month);
      const me = endOfMonth(month);
      const count = leads.filter(
        (l) => l.created_at && new Date(l.created_at) >= ms && new Date(l.created_at) <= me
      ).length;
      return { name: format(month, "LLL", { locale: ru }), value: count };
    });
  }, [leads]);

  // Funnel
  const funnel = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter((l) => l.status === "contacted" || l.status === "converted").length;
    const converted = leads.filter((l) => l.status === "converted").length;
    const paid = contracts.filter((c) => c.payment_status === "оплачено").length;
    return [
      { label: "Новые лиды", count: total, pct: 100 },
      { label: "Связались", count: contacted, pct: total ? Math.round((contacted / total) * 100) : 0 },
      { label: "Договор", count: converted, pct: total ? Math.round((converted / total) * 100) : 0 },
      { label: "Оплата", count: paid, pct: total ? Math.round((paid / total) * 100) : 0 },
    ];
  }, [leads, contracts]);

  // Top 5 clients by revenue
  const topClients = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    contracts.forEach((c) => {
      if (c.payment_status === "оплачено") {
        const amt = (Number(c.amount) || 0) + (Number(c.amount_extra) || 0);
        revenueMap[c.client_name] = (revenueMap[c.client_name] || 0) + amt;
      }
    });
    return Object.entries(revenueMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));
  }, [contracts]);

  // Service type stats
  const serviceStats = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach((c) => {
      const type = c.service_type || "Не указано";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const SERVICE_COLORS: Record<string, string> = {
    "ФРДО": "hsl(210 80% 55%)",
    "САЙТ": "hsl(150 60% 45%)",
    "ПРОЧЕЕ": "hsl(40 70% 50%)",
    "Не указано": "hsl(220 10% 45%)",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Выручка",
      value: `${kpi.revenue.toLocaleString("ru-RU")} ₽`,
      icon: DollarSign,
      color: "text-emerald-400",
    },
    {
      title: "Активные договоры",
      value: kpi.activeContracts,
      icon: FileText,
      color: "text-blue-400",
    },
    {
      title: "Новые лиды",
      value: kpi.newLeads,
      icon: UserPlus,
      color: "text-amber-400",
      subtitle: "за месяц",
    },
    {
      title: "Конверсия",
      value: `${kpi.conversion}%`,
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  const funnelColors = [
    "bg-blue-500",
    "bg-cyan-500",
    "bg-primary",
    "bg-emerald-500",
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k, i) => (
          <motion.div key={k.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{k.title}</p>
                    <p className="text-2xl font-bold mt-1">{k.value}</p>
                    {k.subtitle && <p className="text-xs text-muted-foreground">{k.subtitle}</p>}
                  </div>
                  <k.icon className={`w-8 h-8 ${k.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Выручка по месяцам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 8% 20%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(220 8% 16%)", border: "1px solid hsl(220 8% 20%)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v.toLocaleString("ru-RU")} ₽`, "Выручка"]}
                />
                <Bar dataKey="value" fill="hsl(45 65% 52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Лиды по месяцам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={leadsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 8% 20%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(220 8% 16%)", border: "1px solid hsl(220 8% 20%)", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(200 80% 55%)" strokeWidth={2} dot={{ fill: "hsl(200 80% 55%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Воронка продаж</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {funnel.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-24 text-xs text-muted-foreground shrink-0">{step.label}</div>
                <div className="flex-1 bg-muted/30 rounded-full h-7 overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full ${funnelColors[i]} opacity-80`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(step.pct, 4)}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {step.count} ({step.pct}%)
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Top Clients & Service Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Топ-5 клиентов по выручке
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topClients.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Нет данных</p>
            ) : (
              topClients.map((c, i) => {
                const maxRev = topClients[0]?.revenue || 1;
                return (
                  <motion.div
                    key={c.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-5 text-xs text-muted-foreground text-right shrink-0">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm truncate">{c.name}</span>
                        <span className="text-xs font-medium shrink-0 ml-2">{c.revenue.toLocaleString("ru-RU")} ₽</span>
                      </div>
                      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(c.revenue / maxRev) * 100}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              Клиенты по типу услуг
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serviceStats.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Нет данных</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <RePieChart>
                    <Pie
                      data={serviceStats}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      strokeWidth={2}
                      stroke="hsl(220 8% 12%)"
                    >
                      {serviceStats.map((s) => (
                        <Cell key={s.name} fill={SERVICE_COLORS[s.name] || "hsl(220 10% 45%)"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(220 8% 16%)", border: "1px solid hsl(220 8% 20%)", borderRadius: 8, fontSize: 12 }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {serviceStats.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: SERVICE_COLORS[s.name] || "hsl(220 10% 45%)" }}
                      />
                      <span className="truncate flex-1">{s.name}</span>
                      <span className="font-medium text-xs">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Urgent */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Overdue payments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Просроченные оплаты ({kpi.overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-48 overflow-y-auto">
            {kpi.overdue.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Нет просроченных</p>
            ) : (
              kpi.overdue.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onNavigate("contracts")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors text-sm text-left"
                >
                  <span className="truncate">{c.client_name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    до {c.paid_until ? new Date(c.paid_until).toLocaleDateString("ru-RU") : "—"}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Today's tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Задачи на сегодня ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-48 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Нет задач на сегодня</p>
            ) : (
              tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onNavigate("planner")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-sm text-left"
                >
                  <span className="truncate">{t.title}</span>
                  <Badge variant="outline" className="text-xs shrink-0 ml-2">{t.status}</Badge>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expiring soon */}
      {kpi.expiringSoon.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Истекают в ближайшие 7 дней ({kpi.expiringSoon.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {kpi.expiringSoon.map((c) => (
              <button
                key={c.id}
                onClick={() => onNavigate("contracts")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-sm text-left"
              >
                <span className="truncate">{c.client_name}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  до {c.paid_until ? new Date(c.paid_until).toLocaleDateString("ru-RU") : "—"}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardTab;
