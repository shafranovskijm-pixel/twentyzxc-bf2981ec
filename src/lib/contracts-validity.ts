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

export type ContractSortField =
  | "client_name"
  | "contract_number"
  | "contract_date"
  | "payment_status"
  | "paid_until"
  | "amount"
  | "contract_type"
  | "responsible";

export type ContractSortDirection = "upcoming" | "asc" | "desc";

export interface ContractSortState {
  field: ContractSortField;
  direction: ContractSortDirection;
}

export interface ContractSortFields extends ContractValidityFields {
  client_name: string;
  contract_number: string | null;
  contract_date: string | null;
  payment_status: string | null;
  amount: number | null;
  contract_type: string | null;
  responsible: string | null;
}

export const DEFAULT_CONTRACT_SORT: ContractSortState = {
  field: "paid_until",
  direction: "upcoming",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RU_COLLATOR = new Intl.Collator("ru-RU", { numeric: true, sensitivity: "base" });

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

const getPaidUntilTimestamp = (contract: ContractValidityFields) => {
  if (contract.is_one_time || !contract.paid_until) return null;
  return parseLocalDate(contract.paid_until)?.getTime() ?? null;
};

export const compareContractsByPaidUntilAscending = (
  first: ContractValidityFields,
  second: ContractValidityFields,
) => {
  const firstTimestamp = getPaidUntilTimestamp(first);
  const secondTimestamp = getPaidUntilTimestamp(second);

  if (firstTimestamp === null && secondTimestamp === null) return 0;
  if (firstTimestamp === null) return 1;
  if (secondTimestamp === null) return -1;
  return firstTimestamp - secondTimestamp;
};

export const compareContractsByPaidUntilDescending = (
  first: ContractValidityFields,
  second: ContractValidityFields,
) => {
  const firstTimestamp = getPaidUntilTimestamp(first);
  const secondTimestamp = getPaidUntilTimestamp(second);

  if (firstTimestamp === null && secondTimestamp === null) return 0;
  if (firstTimestamp === null) return 1;
  if (secondTimestamp === null) return -1;
  return secondTimestamp - firstTimestamp;
};

/**
 * Keeps every contract in the list while bringing the next renewals to the top.
 * Active terms are ordered from the nearest date, followed by recently expired
 * terms, then contracts without a date and one-time contracts.
 */
export const compareContractsByPaidUntilUpcoming = (
  first: ContractValidityFields,
  second: ContractValidityFields,
  now = new Date(),
) => {
  const firstDays = first.is_one_time ? null : getPaidUntilDaysLeft(first.paid_until, now);
  const secondDays = second.is_one_time ? null : getPaidUntilDaysLeft(second.paid_until, now);

  if (firstDays === null && secondDays === null) return 0;
  if (firstDays === null) return 1;
  if (secondDays === null) return -1;

  const firstIsUpcoming = firstDays >= 0;
  const secondIsUpcoming = secondDays >= 0;

  if (firstIsUpcoming && !secondIsUpcoming) return -1;
  if (!firstIsUpcoming && secondIsUpcoming) return 1;

  if (firstIsUpcoming) return firstDays - secondDays;

  // For overdue terms, show the most recently expired ones first.
  return secondDays - firstDays;
};

const compareNullable = <T>(
  first: T | null | undefined,
  second: T | null | undefined,
  compareValues: (left: T, right: T) => number,
  direction: "asc" | "desc",
) => {
  if (first == null && second == null) return 0;
  if (first == null) return 1;
  if (second == null) return -1;
  const result = compareValues(first, second);
  return direction === "desc" ? -result : result;
};

const paymentStatusRank = (value: string) => {
  const normalized = value.toLowerCase().trim();
  if (normalized === "не оплачено") return 0;
  if (normalized === "частично") return 1;
  if (normalized === "оплачено") return 2;
  return 3;
};

export const compareContractsBySort = (
  first: ContractSortFields,
  second: ContractSortFields,
  sort: ContractSortState,
  now = new Date(),
) => {
  if (sort.field === "paid_until") {
    if (sort.direction === "upcoming") {
      return compareContractsByPaidUntilUpcoming(first, second, now);
    }
    return sort.direction === "desc"
      ? compareContractsByPaidUntilDescending(first, second)
      : compareContractsByPaidUntilAscending(first, second);
  }

  const direction = sort.direction === "desc" ? "desc" : "asc";

  if (sort.field === "amount") {
    return compareNullable(first.amount, second.amount, (left, right) => left - right, direction);
  }

  if (sort.field === "contract_date") {
    const firstDate = first.contract_date ? parseLocalDate(first.contract_date)?.getTime() : null;
    const secondDate = second.contract_date ? parseLocalDate(second.contract_date)?.getTime() : null;
    return compareNullable(firstDate, secondDate, (left, right) => left - right, direction);
  }

  if (sort.field === "payment_status") {
    return compareNullable(
      first.payment_status,
      second.payment_status,
      (left, right) => {
        const rankDifference = paymentStatusRank(left) - paymentStatusRank(right);
        return rankDifference || RU_COLLATOR.compare(left, right);
      },
      direction,
    );
  }

  return compareNullable(
    first[sort.field],
    second[sort.field],
    (left, right) => RU_COLLATOR.compare(String(left), String(right)),
    direction,
  );
};

export const getNextContractSort = (
  current: ContractSortState,
  field: ContractSortField,
): ContractSortState => {
  if (field === "paid_until") {
    if (current.field !== field) return { field, direction: "upcoming" };
    if (current.direction === "upcoming") return { field, direction: "asc" };
    if (current.direction === "asc") return { field, direction: "desc" };
    return { field, direction: "upcoming" };
  }

  if (current.field !== field) return { field, direction: "asc" };
  return { field, direction: current.direction === "asc" ? "desc" : "asc" };
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
