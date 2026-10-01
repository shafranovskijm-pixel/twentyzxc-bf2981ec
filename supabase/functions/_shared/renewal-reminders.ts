/** Calendar-only renewal checks. Document dates never establish a service term. */
export interface RenewalReminderContract {
  id: string;
  service_end: string | null;
  paid_until: string | null;
  is_archived: boolean;
  is_one_time: boolean;
  service_no_deadline: boolean;
}

export interface RenewalReminder<T extends RenewalReminderContract> {
  contract: T;
  expiryDate: string;
  expirySource: "service_end" | "paid_until";
  daysRemaining: number;
}

const DAY_MS = 86_400_000;

function calendarDay(value: string | null): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value
    ? time / DAY_MS
    : null;
}

/** Match the MCP renewal service's precedence and exclusions, retaining the source. */
export function selectRenewalReminders<T extends RenewalReminderContract>(
  contracts: T[],
  asOf: string,
  daysAhead = 14,
): RenewalReminder<T>[] {
  const today = calendarDay(asOf);
  if (today === null || !Number.isInteger(daysAhead) || daysAhead < 0) {
    throw new Error("Invalid renewal reminder calendar window");
  }
  return contracts.flatMap((contract): RenewalReminder<T>[] => {
    if (contract.is_archived || contract.is_one_time || contract.service_no_deadline) return [];
    // A present but invalid service_end is unknown, not permission to use another date.
    const expirySource = contract.service_end ? "service_end" : "paid_until";
    const expiryDate = contract[expirySource];
    const end = calendarDay(expiryDate);
    if (end === null || !expiryDate) return [];
    const daysRemaining = end - today;
    // Expired terms stay expired; never roll them into another year.
    return daysRemaining >= 0 && daysRemaining <= daysAhead
      ? [{ contract, expiryDate, expirySource, daysRemaining }]
      : [];
  }).sort((a, b) => a.daysRemaining - b.daysRemaining || a.contract.id.localeCompare(b.contract.id));
}

export function describeRenewalTerm(
  reminder: Pick<RenewalReminder<RenewalReminderContract>, "expiryDate" | "expirySource" | "daysRemaining">,
): string {
  const date = reminder.expiryDate.split("-").reverse().join(".");
  const remaining = reminder.daysRemaining === 0 ? "сегодня" : `через ${reminder.daysRemaining} дн.`;
  return reminder.expirySource === "service_end"
    ? `услуги до ${date}, ${remaining}`
    : `период по CRM до ${date}, ${remaining}; факт оплаты не проверен`;
}
