/** Full issuer bank details confirmed in CRM, never inferred from a prefix. */
export interface CurrentBankPolicy {
  issuer_inn: string;
  company_bank_account: string;
  company_bank_bik: string;
  company_bank_corr: string;
  company_bank_name: string;
  revision: number;
  retired_accounts: string[];
  updated_at?: string;
}

export const COMPANY_BANK_FIELDS = [
  "company_bank_account", "company_bank_bik", "company_bank_corr", "company_bank_name",
] as const;

export class CurrentBankRequisitesError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

const digits = (value: string) => value.replace(/\D/gu, "");
const bankName = (value: string) => value.toLocaleLowerCase("ru-RU").replace(/[\s\p{P}]/gu, "");

export function assertCurrentCompanyBankRequisites(
  company: { company_inn: string } & Record<typeof COMPANY_BANK_FIELDS[number], string>,
  policy: CurrentBankPolicy | null,
) {
  if (!policy || digits(company.company_inn) !== policy.issuer_inn) return;
  if (policy.retired_accounts.includes(digits(company.company_bank_account))) {
    throw new CurrentBankRequisitesError("CRM_COMPANY_BANK_ACCOUNT_RETIRED", "Расчётный счёт исполнителя устарел. Создайте новую версию документа с актуальными реквизитами.");
  }
  if (COMPANY_BANK_FIELDS.some(key => key === "company_bank_name"
    ? bankName(company[key]) !== bankName(policy[key])
    : digits(company[key]) !== policy[key])) {
    throw new CurrentBankRequisitesError("CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT", "Банковские реквизиты исполнителя не совпадают с закреплёнными. Обновите их в новой версии документа перед отправкой.");
  }
}

/** Accept text extracted from the actual PDF or source HTML, including spaced digits. */
export function assertCurrentBankText(text: string, policy: CurrentBankPolicy | null, requireCurrentAccount = false) {
  if (!policy) return;
  const visible = text.replace(/&#(x[0-9a-f]+|[0-9]+);/giu, (entity, code: string) => {
    const value = Number.parseInt(code.startsWith("x") || code.startsWith("X") ? code.slice(1) : code,
      code.startsWith("x") || code.startsWith("X") ? 16 : 10);
    return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
  }).replace(/<[^>]*>/gu, " ").replace(/&(?:nbsp|quot|laquo|raquo|apos);/giu, " ");
  const numeric = digits(visible);
  if (policy.retired_accounts.some(account => numeric.includes(account))) {
    throw new CurrentBankRequisitesError("CRM_COMPANY_BANK_ACCOUNT_RETIRED", "Документ содержит старый расчётный счёт исполнителя. Отправка остановлена; подготовьте новую версию с актуальными реквизитами.");
  }
  if (requireCurrentAccount && numeric.includes(policy.issuer_inn)
    && ([policy.company_bank_account, policy.company_bank_bik, policy.company_bank_corr].some(value => !numeric.includes(value))
      || !bankName(visible).includes(bankName(policy.company_bank_name)))) {
    throw new CurrentBankRequisitesError("CRM_COMPANY_BANK_REQUISITES_NOT_CURRENT", "В документе не подтверждён актуальный комплект банковских реквизитов исполнителя.");
  }
}

/** Only payment fields change; legal identity, terms and signed archives remain separate. */
export function withCurrentCompanyBankRequisites<T extends { company_inn: string }>(company: T, policy: CurrentBankPolicy | null): T {
  if (!policy || digits(company.company_inn) !== policy.issuer_inn) return { ...company };
  return { ...company, ...Object.fromEntries(COMPANY_BANK_FIELDS.map(key => [key, policy[key]])) };
}
