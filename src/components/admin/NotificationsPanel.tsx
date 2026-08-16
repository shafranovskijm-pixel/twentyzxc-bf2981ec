import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, AlertTriangle, Clock, UserPlus, CalendarClock, BellOff, Loader2, Undo2 } from "lucide-react";
import { isBefore, addDays, subHours } from "date-fns";
import { toast } from "sonner";
import {
  useDismissedNotifications,
  useNotificationSettings,
  type NotificationSettings,
} from "@/hooks/use-notification-settings";

interface NotificationsPanelProps {
  onNavigate: (section: string, clientName?: string) => void;
}

type PanelNotification = {
  id: string;
  type: keyof NotificationSettings;
  icon: typeof AlertTriangle;
  label: string;
  section: string;
  color: string;
  clientName?: string;
  dismissKey: string;
  snapshot: string;
};

const NotificationsPanel = ({ onNavigate }: NotificationsPanelProps) => {
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const { settings } = useNotificationSettings();
  const { dismissed, dismiss, restoreAll } = useDismissedNotifications();

  const { data: contracts = [] } = useQuery({
    queryKey: ["notif-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, client_name, paid_until, payment_status")
        .eq("is_archived", false);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const { data: todayTasks = [] } = useQuery({
    queryKey: ["notif-tasks"],
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
    refetchInterval: 60000,
  });

  const { data: recentLeads = [] } = useQuery({
    queryKey: ["notif-leads"],
    queryFn: async () => {
      const since = subHours(new Date(), 24).toISOString();
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const items = useMemo(() => {
    const notifications: PanelNotification[] = [];
    const now = new Date();

    // Overdue
    contracts
      .filter((c) => c.paid_until && isBefore(new Date(c.paid_until), now) && c.payment_status !== "оплачено")
      .forEach((c) =>
        notifications.push({
          id: `overdue-${c.id}`,
          type: "overdue",
          icon: AlertTriangle,
          label: `Просрочено: ${c.client_name}`,
          section: "clients",
          color: "text-destructive",
          clientName: c.client_name,
          dismissKey: `overdue:${c.id}`,
          snapshot: String(c.paid_until),
        })
      );

    // Expiring in 7 days
    contracts
      .filter(
        (c) =>
          c.paid_until &&
          !isBefore(new Date(c.paid_until), now) &&
          isBefore(new Date(c.paid_until), addDays(now, 7)) &&
          c.payment_status !== "оплачено"
      )
      .forEach((c) =>
        notifications.push({
          id: `exp-${c.id}`,
          type: "expiring",
          icon: CalendarClock,
          label: `Истекает: ${c.client_name}`,
          section: "clients",
          color: "text-amber-400",
          clientName: c.client_name,
          dismissKey: `expiring:${c.id}`,
          snapshot: String(c.paid_until),
        })
      );

    // Today tasks
    todayTasks.forEach((t) =>
      notifications.push({
        id: `task-${t.id}`,
        type: "tasks",
        icon: Clock,
        label: t.title,
        section: "planner",
        color: "text-blue-400",
        dismissKey: `tasks:${t.id}`,
        snapshot: new Date().toISOString().split("T")[0],
      })
    );

    // New leads
    recentLeads.forEach((l) =>
      notifications.push({
        id: `lead-${l.id}`,
        type: "leads",
        icon: UserPlus,
        label: `Новый лид: ${l.name || "Без имени"}`,
        section: "clients",
        color: "text-emerald-400",
        dismissKey: `leads:${l.id}`,
        snapshot: String(l.created_at || ""),
      })
    );

    return notifications;
  }, [contracts, todayTasks, recentLeads]);

  const enabledItems = items.filter((item) => settings[item.type]);
  const notifications = enabledItems.filter((item) => dismissed[item.dismissKey] !== item.snapshot);
  const hiddenCount = enabledItems.length - notifications.length;
  const count = notifications.length;

  const handleNavigate = (notification: PanelNotification) => {
    setOpen(false);
    onNavigate(notification.section, notification.clientName);
  };

  const handleDismiss = async (notification: PanelNotification) => {
    setDismissing(notification.id);
    try {
      await dismiss(notification.dismissKey, notification.snapshot);
      toast.success("Уведомление отключено");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Не удалось отключить уведомление");
    } finally {
      setDismissing(null);
    }
  };

  const handleRestore = async () => {
    setDismissing("restore");
    try {
      await restoreAll();
      toast.success("Отключённые уведомления возвращены");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Не удалось вернуть уведомления");
    } finally {
      setDismissing(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-96 overflow-y-auto">
        <div className="p-3 border-b">
          <h4 className="text-sm font-semibold">Уведомления</h4>
        </div>
        {count === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Всё в порядке ✓</p>
        ) : (
          <div className="divide-y">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-stretch">
                <button
                  onClick={() => handleNavigate(n)}
                  className="min-w-0 flex-1 flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                >
                  <n.icon className={`w-4 h-4 mt-0.5 shrink-0 ${n.color}`} />
                  <span className="min-w-0">
                    <span className="block text-sm leading-tight">{n.label}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {n.clientName ? "Открыть карточку клиента" : "Открыть раздел"}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDismiss(n)}
                  disabled={!!dismissing}
                  className="w-11 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  title="Отключить это уведомление"
                  aria-label={`Отключить уведомление: ${n.label}`}
                >
                  {dismissing === n.id
                    ? <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    : <BellOff className="mx-auto h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
        {hiddenCount > 0 && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-xs text-muted-foreground"
              disabled={!!dismissing}
              onClick={handleRestore}
            >
              {dismissing === "restore"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Undo2 className="h-3.5 w-3.5" />}
              Вернуть отключённые: {hiddenCount}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPanel;
