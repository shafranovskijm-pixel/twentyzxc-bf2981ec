export interface RenewableContractPeriod {
  contract_date?: string | null;
  paid_until?: string | null;
}

export interface ContractRenewalPeriod {
  startDate: string;
  endDate: string;
}

const parseDateOnly = (value: string | null | undefined) => {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
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
  let previousEnd = parseDateOnly(contract.paid_until);
  if (!previousEnd) {
    const previousStart = parseDateOnly(contract.contract_date);
    if (!previousStart) return null;
    previousEnd = addYearsClamped(previousStart, 1);
  }

  const newStart = addDays(previousEnd, 1);
  const newEnd = addDays(addYearsClamped(newStart, 1), -1);

  return {
    startDate: formatDateOnly(newStart),
    endDate: formatDateOnly(newEnd),
  };
};

export const isFrdoContractType = (value: string | null | undefined) =>
  /(?:фрдо|frdo)/i.test(value || "");
