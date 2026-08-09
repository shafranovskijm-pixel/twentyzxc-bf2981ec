/** Small pure helpers shared by the proposals (КП) UI. */

/** Format a number as roubles, e.g. 50000 -> "50 000 ₽". */
export function formatMoneyRub(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0 ₽";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(n))} ₽`;
}

/**
 * Validate an ISO date string in strict YYYY-MM-DD form with a year in 2000–9999.
 * Rejects malformed values like "20266-07-10" or impossible dates like "2025-02-30".
 */
export function isValidIsoDate(value: string | null | undefined): boolean {
  if (!value) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 2000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/** Format an ISO date (or any parsable date) as ru-RU dd.mm.yyyy. Returns "" when invalid. */
export function formatDateRu(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU");
}
