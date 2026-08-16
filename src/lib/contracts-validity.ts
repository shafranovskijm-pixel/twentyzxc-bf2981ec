export type ContractValidityFilter =
  | "all"
  | "expired"
  | "within-30"
  | "within-90"
  | "over-90"
  | "no-term"
  | "one-time";

export interface ContractValidityFields {
  paid_until: string | null;
  is_one_time?: boolean | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfLocalDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseLocalDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const getPaidUntilDaysLeft = (paidUntil: string | null, now = new Date()) => {
  if (!paidUntil) return null;
  const paidUntilDate = parseLocalDate(paidUntil);
  if (!paidUntilDate) return null;

  return Math.round(
    (paidUntilDate.getTime() - startOfLocalDay(now).getTime()) / MS_PER_DAY,
  );
};

export const matchesContractValidity = (
  contract: ContractValidityFields,
  filter: ContractValidityFilter,
  now = new Date(),
) => {
  if (filter === "all") return true;
  if (filter === "one-time") return contract.is_one_time === true;
  if (filter === "no-term") return !contract.is_one_time && !contract.paid_until;
  if (contract.is_one_time) return false;

  const daysLeft = getPaidUntilDaysLeft(contract.paid_until, now);
  if (daysLeft === null) return false;

  if (filter === "expired") return daysLeft < 0;
  if (filter === "within-30") return daysLeft >= 0 && daysLeft <= 30;
  if (filter === "within-90") return daysLeft >= 31 && daysLeft <= 90;
  return daysLeft > 90;
};
