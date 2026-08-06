import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const NOTIFICATION_SETTINGS_KEY = "telegram_notifications";
export const NOTIFICATION_DISMISSED_KEY = "telegram_notifications_dismissed";

export type DismissedMap = Record<string, string>;

export type NotificationSettings = {
  overdue: boolean;
  expiring: boolean;
  renewals: boolean;
  deadlines: boolean;
  tasks: boolean;
  leads: boolean;
};

export const defaultNotificationSettings: NotificationSettings = {
  overdue: true,
  expiring: true,
  renewals: true,
  deadlines: true,
  tasks: true,
  leads: true,
};

export const notificationTypeLabels: Record<keyof NotificationSettings, { title: string; description: string }> = {
  overdue: { title: "Просроченные оплаты", description: "Договоры с истёкшей датой оплаты" },
  expiring: { title: "Оплата скоро истекает", description: "Напоминание за 3 дня до окончания оплаты" },
  renewals: { title: "Продление договоров", description: "Годовщина договоров «Сайт» и «ФРДО» за 14 дней" },
  deadlines: { title: "Сроки услуг клиентов", description: "Напоминания за 3, 2 и 1 месяц до окончания услуги" },
  tasks: { title: "Задачи планера", description: "Ежедневные напоминания по задачам" },
  leads: { title: "Заявки с сайта", description: "Новые лиды из форм, брифов и конструктора" },
};

export function useNotificationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notification-settings"],
    queryFn: async (): Promise<NotificationSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", NOTIFICATION_SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      return { ...defaultNotificationSettings, ...((data?.value as Partial<NotificationSettings>) || {}) };
    },
  });

  const update = async (patch: Partial<NotificationSettings>) => {
    const next = { ...(query.data || defaultNotificationSettings), ...patch };
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: NOTIFICATION_SETTINGS_KEY, value: next as any }, { onConflict: "key" });
    if (error) throw error;
    queryClient.setQueryData(["notification-settings"], next);
    return next;
  };

  return {
    settings: query.data || defaultNotificationSettings,
    isLoading: query.isLoading,
    update,
  };
}

export function useDismissedNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notification-dismissed"],
    queryFn: async (): Promise<DismissedMap> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", NOTIFICATION_DISMISSED_KEY)
        .maybeSingle();
      if (error) throw error;
      return ((data?.value as DismissedMap) || {}) as DismissedMap;
    },
  });

  const save = async (next: DismissedMap) => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: NOTIFICATION_DISMISSED_KEY, value: next as any }, { onConflict: "key" });
    if (error) throw error;
    queryClient.setQueryData(["notification-dismissed"], next);
    return next;
  };

  const dismiss = (key: string, snapshot: string) => save({ ...(query.data || {}), [key]: snapshot });
  const restoreAll = () => save({});

  return {
    dismissed: query.data || ({} as DismissedMap),
    isLoading: query.isLoading,
    dismiss,
    restoreAll,
  };
}