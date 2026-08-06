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