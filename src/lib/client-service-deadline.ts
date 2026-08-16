export type ClientServiceDeadlineFilter =
  | "all"
  | "expired"
  | "within_30"
  | "days_31_60"
  | "days_61_90"
  | "after_90"
  | "no_deadline"
  | "missing";

export type ClientServiceDeadlineSort = "none" | "asc" | "desc";

export interface ClientServiceDeadlineFields {
  service_deadline?: string | null;
  no_deadline?: boolean | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toCalendarDay = (value: Date) =>
  Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / MS_PER_DAY;

const parseDeadlineDay = (value: string | null | undefined) => {
  if (!value) return null;

  const dateOnly = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return null;
    }
    return Date.UTC(year, month - 1, day) / MS_PER_DAY;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : toCalendarDay(parsed);
};

export const getClientServiceDeadlineDaysLeft = (
  value: string | null | undefined,
  now = new Date(),
) => {
  const deadlineDay = parseDeadlineDay(value);
  return deadlineDay == null ? null : deadlineDay - toCalendarDay(now);
};

export const matchesClientServiceDeadline = (
  client: ClientServiceDeadlineFields,
  filter: ClientServiceDeadlineFilter,
  now = new Date(),
) => {
  if (filter === "all") return true;
  if (filter === "no_deadline") return client.no_deadline === true;
  if (client.no_deadline) return false;

  const daysLeft = getClientServiceDeadlineDaysLeft(client.service_deadline, now);
  if (filter === "missing") return daysLeft == null;
  if (daysLeft == null) return false;

  if (filter === "expired") return daysLeft < 0;
  if (filter === "within_30") return daysLeft >= 0 && daysLeft <= 30;
  if (filter === "days_31_60") return daysLeft >= 31 && daysLeft <= 60;
  if (filter === "days_61_90") return daysLeft >= 61 && daysLeft <= 90;
  return daysLeft > 90;
};

export const compareClientsByServiceDeadline = (
  first: ClientServiceDeadlineFields,
  second: ClientServiceDeadlineFields,
  direction: ClientServiceDeadlineSort,
) => {
  if (direction === "none") return 0;

  const firstDay = first.no_deadline ? null : parseDeadlineDay(first.service_deadline);
  const secondDay = second.no_deadline ? null : parseDeadlineDay(second.service_deadline);

  if (firstDay == null && secondDay == null) return 0;
  if (firstDay == null) return 1;
  if (secondDay == null) return -1;

  return direction === "desc" ? secondDay - firstDay : firstDay - secondDay;
};

export const getNextClientServiceDeadlineSort = (
  current: ClientServiceDeadlineSort,
): ClientServiceDeadlineSort => {
  if (current === "none") return "asc";
  if (current === "asc") return "desc";
  return "none";
};
