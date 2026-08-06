import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarClock, Clock, UserPlus, RefreshCw, Hourglass, BellOff, FileText, X, Undo2, FilePlus2 } from "lucide-react";
import { isBefore, addDays, subHours, format } from "date-fns";
import {
  useNotificationSettings,
  useDismissedNotifications,
  notificationTypeLabels,
  type NotificationSettings,
} from "@/hooks/use-notification-settings";

interface NotificationsTabProps {
  onOpenContracts: (clientName: string) => void;
  onNewContract?: (clientName: string) => void;
}

type Item = {
  id: string;
  type: keyof NotificationSettings;
  icon: typeof AlertTriangle;
  color: string;
  label: string;
  meta?: string;
  clientName?: string;
  dismissKey: string;
  snapshot: string;
};

const NotificationsTab = ({ onOpenContracts, onNewContract }: NotificationsTabProps) => {
  const { settings, update } = useNotificationSettings();
  const { dismissed, dismiss, restoreAll } = useDismissedNotifications();
  const [saving, setSaving] = useState<string | null>(null);

  const toggle = async (key: keyof NotificationSettings, value: boolean) => {
    setSaving(key);
    try {
      await update({ [key]: value });
      toast.success(value ? "Уведомления включены" : "Уведомления отключены");
    } catch (e: any) {
      toast.error(e?.message || "Не удалось сохранить");
    } finally {
      setSaving(null);
    }
  };

  const { data: contracts = [] } = useQuery({
    queryKey: ["notif-tab-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, client_name, contract_number, paid_until, contract_date, contract_type, payment_status")
        .eq("is_archived", false);
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["notif-tab-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, service_deadline")
        .not("service_deadline", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["notif-tab-tasks"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title")
        .eq("task_date", today)
        .neq("status", "done");
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["notif-tab-leads"],
    queryFn: async () => {
      const since = subHours(new Date(), 48).toISOString();
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const items = useMemo(() => {
    const list: Item[] = [];
    const now = new Date();

    contracts.forEach((c) => {
      if (c.paid_until && c.payment_status !== "оплачено") {
        const due = new Date(c.paid_until);
        if (isBefore(due, now)) {
          list.push({
            id: `overdue-${c.id}`,
            dismissKey: `overdue:${c.id}`,
            snapshot: String(c.paid_until),
            type: "overdue",
            icon: AlertTriangle,
            color: "text-destructive",
            label: `Просрочена оплата: ${c.client_name}`,
            meta: `${c.contract_number || "б/н"} · до ${format(due, "dd.MM.yyyy")}`,
            clientName: c.client_name,
          });
        } else if (isBefore(due, addDays(now, 7))) {
          list.push({
            id: `exp-${c.id}`,
            dismissKey: `expiring:${c.id}`,
            snapshot: String(c.paid_until),
            type: "expiring",
            icon: CalendarClock,
            color: "text-amber-400",
            label: `Оплата истекает: ${c.client_name}`,
            meta: `${c.contract_number || "б/н"} · до ${format(due, "dd.MM.yyyy")}`,
            clientName: c.client_name,
          });
        }
      }

      if (c.contract_date && (c.contract_type === "Сайт" || c.contract_type === "ФРДО")) {
        const start = new Date(c.contract_date);
        const anniversary = new Date(start);
        anniversary.setFullYear(now.getFullYear());
        if (anniversary < now) anniversary.setFullYear(now.getFullYear() + 1);
        const days = Math.round((anniversary.getTime() - now.getTime()) / 86400000);
        if (days >= 0 && days <= 14) {
          list.push({
            id: `renew-${c.id}`,
            dismissKey: `renewals:${c.id}`,
            snapshot: String(anniversary.getFullYear()),
            type: "renewals",
            icon: RefreshCw,
            color: "text-primary",
            label: `Продление: ${c.client_name}`,
            meta: `${c.contract_type} · через ${days} дн.`,
            clientName: c.client_name,
          });
        }
      }
    });

    clients.forEach((cl) => {
      const days = Math.round((new Date(cl.service_deadline!).getTime() - now.getTime()) / 86400000);
      if (days >= 0 && days <= 95) {
        list.push({
          id: `deadline-${cl.id}`,
          dismissKey: `deadlines:${cl.id}`,
          snapshot: String(cl.service_deadline),
          type: "deadlines",
          icon: Hourglass,
          color: "text-sky-400",
          label: `Срок услуги: ${cl.name}`,
          meta: `осталось ${days} дн.`,
          clientName: cl.name,
        });
      }
    });

    tasks.forEach((t) =>
      list.push({ id: `task-${t.id}`, dismissKey: `tasks:${t.id}`, snapshot: new Date().toISOString().split("T")[0], type: "tasks", icon: Clock, color: "text-blue-400", label: t.title, meta: "задача на сегодня" })
    );

    leads.forEach((l) =>
      list.push({
        id: `lead-${l.id}`,
        dismissKey: `leads:${l.id}`,
        snapshot: String(l.created_at || ""),
        type: "leads",
        icon: UserPlus,
        color: "text-emerald-400",
        label: `Новый лид: ${l.name || "Без имени"}`,
        meta: l.created_at ? format(new Date(l.created_at), "dd.MM HH:mm") : undefined,
        clientName: l.name || undefined,
      })
    );

    return list;
  }, [contracts, clients, tasks, leads]);

  const enabledItems = items.filter((i) => settings[i.type]);
  const isHidden = (i: Item) => dismissed[i.dismissKey] === i.snapshot;
  const visibleItems = enabledItems.filter((i) => !isHidden(i));
  const hiddenCount = enabledItems.length - visibleItems.length;

  const handleDismiss = async (i: Item) => {
    try {
      await dismiss(i.dismissKey, i.snapshot);
      toast.success("Напоминание скрыто");
    } catch (e: any) {
      toast.error(e?.message || "Не удалось скрыть");
    }
  };

  const handleRestore = async () => {
    try {
      await restoreAll();
      toast.success("Скрытые напоминания возвращены");
    } catch (e: any) {
      toast.error(e?.message || "Не удалось восстановить");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Telegram-уведомления</CardTitle>
          <CardDescription>Отключите типы уведомлений, которые не нужно присылать в бот</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {(Object.keys(notificationTypeLabels) as (keyof NotificationSettings)[]).map((key) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <div className="text-sm font-medium">{notificationTypeLabels[key].title}</div>
                <div className="text-xs text-muted-foreground">{notificationTypeLabels[key].description}</div>
              </div>
              <Switch
                checked={settings[key]}
                disabled={saving === key}
                onCheckedChange={(v) => toggle(key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Активные упоминания</CardTitle>
            <CardDescription>То, что бот пришлёт по включённым типам</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hiddenCount > 0 && (
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={handleRestore}>
                <Undo2 className="w-3.5 h-3.5" />
                Скрыто: {hiddenCount} · Показать
              </Button>
            )}
            <Badge variant="outline">{visibleItems.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <BellOff className="w-6 h-6" />
              <span className="text-sm">Нет активных уведомлений</span>
            </div>
          ) : (
            <div className="divide-y">
              {visibleItems.map((n) => (
                <div key={n.id} className="flex items-start gap-3 px-4 sm:px-6 py-3">
                  <n.icon className={`w-4 h-4 mt-0.5 shrink-0 ${n.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm leading-tight">{n.label}</div>
                    {n.meta && <div className="text-xs text-muted-foreground mt-0.5">{n.meta}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {n.clientName && (n.type === "deadlines" || n.type === "renewals") && onNewContract && (
                      <Button size="sm" variant="default" className="gap-1.5" onClick={() => onNewContract(n.clientName!)}>
                        <FilePlus2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Новый договор</span>
                      </Button>
                    )}
                    {n.clientName && (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onOpenContracts(n.clientName!)}>
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Договоры</span>
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="px-2 text-muted-foreground hover:text-destructive" title="Скрыть напоминание" onClick={() => handleDismiss(n)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsTab;