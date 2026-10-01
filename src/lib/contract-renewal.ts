export interface RenewableContractPeriod {
  /** Retained for existing callers; a document date never establishes a service end. */
  contract_date?: string | null;
  paid_until?: string | null;
  service_end?: string | null;
  service_no_deadline?: boolean;
  is_archived?: boolean;
  is_one_time?: boolean;
}

export interface ContractRenewalPeriod {
  startDate: string;
  endDate: string;
}

const parseDateOnly = (value: string | null | undefined) => {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
};

const formatDateOnly = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (value: Date, days: number) => {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
};

const addYearsClamped = (value: Date, years: number) => {
  const result = new Date(value);
  const month = result.getMonth();
  result.setFullYear(result.getFullYear() + years);
  if (result.getMonth() !== month) {
    result.setDate(0);
  }
  return result;
};

export const getContractRenewalPeriod = (
  contract: RenewableContractPeriod,
): ContractRenewalPeriod | null => {
  if (contract.service_no_deadline || contract.is_archived || contract.is_one_time) return null;
  // Same precedence as the renewal reminders. paid_until is a CRM period date,
  // not evidence of a payment; an invalid explicit service_end remains unknown.
  const previousEnd = parseDateOnly(contract.service_end || contract.paid_until);
  if (!previousEnd) return null;

  const newStart = addDays(previousEnd, 1);
  const newEnd = addDays(addYearsClamped(newStart, 1), -1);

  return {
    startDate: formatDateOnly(newStart),
    endDate: formatDateOnly(newEnd),
  };
};

export const isFrdoContractType = (value: string | null | undefined) =>
  /(?:фрдо|frdo)/i.test(value || "");
