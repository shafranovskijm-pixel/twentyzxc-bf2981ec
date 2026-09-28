import { calculateDocumentMoney, DOCUMENT_MONEY_LIMITS, type DocumentMoney } from "../../../../src/lib/document-money.ts";

/** Runtime boundary for the document API. Monetary arithmetic is in integer kopecks. */
export type DocumentType = "contract" | "invoice" | "act";
export type ContractTemplate = "standard" | "frdo" | "nmo";

export interface DocumentService {
  name: string;
  qty: number;
  price: number;
}

export interface Discount {
  kind: "amount" | "percent";
  value: number;
  deadline?: string;
}

export interface ServicePeriod {
  start?: string;
  end?: string;
  noDeadline: boolean;
}

export interface DocumentInput {
  type: DocumentType;
  clientId: string;
  date: string;
  number: string;
  template?: ContractTemplate;
  services: DocumentService[];
  subject?: string;
  /** Explicitly supplied term or period, matching the existing CRM editor. */
  deadline?: string;
  paymentTerms?: string;
  contractId?: string;
  discount?: Discount;
  /** Structured CRM dates, supplied explicitly and independent of contractual wording. */
  servicePeriod?: ServicePeriod;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export class DocumentValidationError extends Error {
  readonly issues: ValidationIssue[];
  constructor(issues: ValidationIssue[]) {
    super(issues.map(({ field, message }) => `${field}: ${message}`).join("; "));
    this.name = "DocumentValidationError";
    this.issues = issues;
  }
}

export type DocumentTotals = DocumentMoney;
export const DOCUMENT_LIMITS = DOCUMENT_MONEY_LIMITS;

function invalid(field: string, message: string): never {
  throw new DocumentValidationError([{ field, message }]);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    invalid(field, "ожидается объект");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) invalid(field, "ожидается JSON-объект");
  return value as Record<string, unknown>;
}

function knownKeys(value: Record<string, unknown>, keys: string[], field: string): void {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) invalid(`${field}.${key}`, "неизвестное поле");
  }
}

function text(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    invalid(field, `ожидается непустая строка не длиннее ${maxLength} символов`);
  }
  // Tabs/newlines are useful in explicit contract terms; other control characters are not.
  if (Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
  })) {
    invalid(field, "управляющие символы не допускаются");
  }
  return value.trim();
}

export function validateIsoDate(value: unknown, field = "date"): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    invalid(field, "ожидается дата YYYY-MM-DD");
  }
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year === 0 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) {
    invalid(field, "такой календарной даты не существует");
  }
  return value;
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    invalid(field, "ожидается UUID");
  }
  return value.toLowerCase();
}

function decimal(value: unknown, field: string, places: number, maximum: number, positive = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > maximum || (positive && value === 0)) {
    invalid(field, `ожидается число ${positive ? "> 0" : ">= 0"} и <= ${maximum}`);
  }
  // Number#toString gives the decimal JSON value, avoiding binary-float modulo checks.
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${places}})?$`).test(String(value))) {
    invalid(field, `допускается не более ${places} знаков после запятой`);
  }
  return value === 0 ? 0 : value;
}

function validateServices(value: unknown): DocumentService[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > DOCUMENT_LIMITS.services) {
    invalid("services", `ожидается от 1 до ${DOCUMENT_LIMITS.services} услуг`);
  }
  return value.map((item, index) => {
    const field = `services[${index}]`;
    const service = record(item, field);
    knownKeys(service, ["name", "qty", "price"], field);
    return {
      name: text(service.name, `${field}.name`, 2000),
      qty: decimal(service.qty, `${field}.qty`, 3, DOCUMENT_LIMITS.quantity, true),
      price: decimal(service.price, `${field}.price`, 2, DOCUMENT_LIMITS.price),
    };
  });
}

function validateDiscount(value: unknown): Discount {
  const discount = record(value, "discount");
  knownKeys(discount, ["kind", "value", "deadline"], "discount");
  if (discount.kind !== "amount" && discount.kind !== "percent") {
    invalid("discount.kind", "ожидается amount или percent");
  }
  const result: Discount = {
    kind: discount.kind,
    value: decimal(discount.value, "discount.value", 2, discount.kind === "percent" ? 100 : DOCUMENT_LIMITS.grossMinor / 100),
  };
  if (discount.deadline !== undefined) result.deadline = validateIsoDate(discount.deadline, "discount.deadline");
  return result;
}

/** Half-up rounding happens once per service row and once for a percentage discount. */
export function calculateTotals(services: DocumentService[], discount?: Discount): DocumentTotals {
  const checkedServices = validateServices(services);
  const checkedDiscount = discount === undefined ? undefined : validateDiscount(discount);
  try {
    return calculateDocumentMoney(checkedServices, checkedDiscount);
  } catch (error) {
    invalid(checkedDiscount ? "discount.value" : "services", error instanceof Error ? error.message : "некорректная сумма");
  }
}

export function validateDocumentInput(input: unknown): DocumentInput {
  const raw = record(input, "document");
  knownKeys(raw, ["type", "clientId", "date", "number", "template", "services", "subject", "deadline", "paymentTerms", "contractId", "discount", "servicePeriod"], "document");
  if (raw.type !== "contract" && raw.type !== "invoice" && raw.type !== "act") {
    invalid("type", "ожидается contract, invoice или act");
  }
  const result: DocumentInput = {
    type: raw.type,
    clientId: uuid(raw.clientId, "clientId"),
    date: validateIsoDate(raw.date),
    number: text(raw.number, "number", 100),
    services: validateServices(raw.services),
  };
  if (/[\r\n\t]/.test(result.number)) invalid("number", "ожидается номер в одной строке");
  if (raw.template !== undefined) {
    if (raw.type !== "contract") invalid("template", "шаблон задаётся только для договора");
    if (raw.template !== "standard" && raw.template !== "frdo" && raw.template !== "nmo") {
      invalid("template", "ожидается standard, frdo или nmo");
    }
    result.template = raw.template;
  } else if (raw.type === "contract") {
    result.template = "standard";
  }
  for (const key of ["subject", "deadline", "paymentTerms"] as const) {
    if (raw[key] !== undefined || raw.type === "contract") result[key] = text(raw[key], key, 5000);
  }
  if (result.deadline && /^\d{4}-\d{2}-\d{2}$/.test(result.deadline)) validateIsoDate(result.deadline, "deadline");
  if (raw.contractId !== undefined || raw.type === "act") result.contractId = uuid(raw.contractId, "contractId");
  if (raw.type === "contract" && result.contractId) invalid("contractId", "договор не может ссылаться на другой договор в этой операции");
  if (raw.discount !== undefined) {
    if (raw.type !== "invoice") invalid("discount", "скидка поддерживается только для счёта");
    result.discount = validateDiscount(raw.discount);
    if (result.discount.deadline && result.discount.deadline < result.date) {
      invalid("discount.deadline", "срок скидки не может быть раньше даты счёта");
    }
  }
  if (raw.servicePeriod !== undefined) {
    if (raw.type !== "contract") invalid("servicePeriod", "период задаётся только для договора");
    const period = record(raw.servicePeriod, "servicePeriod");
    knownKeys(period, ["start", "end", "noDeadline"], "servicePeriod");
    if (typeof period.noDeadline !== "boolean") invalid("servicePeriod.noDeadline", "ожидается явно заданное true или false");
    const checkedPeriod: ServicePeriod = { noDeadline: period.noDeadline };
    if (period.start !== undefined) checkedPeriod.start = validateIsoDate(period.start, "servicePeriod.start");
    if (period.end !== undefined) checkedPeriod.end = validateIsoDate(period.end, "servicePeriod.end");
    if (checkedPeriod.noDeadline && checkedPeriod.end) invalid("servicePeriod.end", "дата окончания несовместима с noDeadline=true");
    if (checkedPeriod.start && checkedPeriod.end && checkedPeriod.end < checkedPeriod.start) {
      invalid("servicePeriod.end", "окончание периода не может быть раньше начала");
    }
    result.servicePeriod = checkedPeriod;
  }
  calculateTotals(result.services, result.discount);
  return result;
}
