export type NotificationSettings = {
  overdue: boolean;
  expiring: boolean;
  renewals: boolean;
  deadlines: boolean;
  tasks: boolean;
  leads: boolean;
};

const defaults: NotificationSettings = {
  overdue: true,
  expiring: true,
  renewals: true,
  deadlines: true,
  tasks: true,
  leads: true,
};

// deno-lint-ignore no-explicit-any
export async function getNotificationSettings(supabase: any): Promise<NotificationSettings> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "telegram_notifications")
      .maybeSingle();
    return { ...defaults, ...((data?.value as Partial<NotificationSettings>) || {}) };
  } catch (_e) {
    return defaults;
  }
}

export type DismissedMap = Record<string, string>;

// deno-lint-ignore no-explicit-any
export async function getDismissedNotifications(supabase: any): Promise<DismissedMap> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "telegram_notifications_dismissed")
      .maybeSingle();
    return ((data?.value as DismissedMap) || {}) as DismissedMap;
  } catch (_e) {
    return {};
  }
}

export function isDismissed(map: DismissedMap, key: string, snapshot: string): boolean {
  return map[key] === snapshot;
}
