/** Shared by the API and CRM editor. No dates, browser state or external calls. */
export const DOCUMENT_MONEY_LIMITS = Object.freeze({
  services: 100,
  quantity: 1_000_000,
  price: 100_000_000,
  grossMinor: 1_000_000_000_000,
});

export interface MoneyService { qty: number; price: number }
export interface MoneyDiscount { kind: "amount" | "percent"; value: number }
export interface DocumentMoney {
  lineTotalsMinor: number[];
  grossMinor: number;
  discountMinor: number;
  netMinor: number;
  grossAmount: number;
  discountAmount: number;
  totalAmount: number;
}

function scaled(value: number, places: number, maximum: number, field: string, positive = false): bigint {
  if (!Number.isFinite(value) || value < 0 || value > maximum || (positive && value === 0)) {
    throw new RangeError(`${field}: недопустимое значение`);
  }
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${places}})?$`).test(String(value))) {
    throw new RangeError(`${field}: допускается не более ${places} знаков после запятой`);
  }
  const [whole, fraction = ""] = String(value).split(".");
  return BigInt(whole + fraction.padEnd(places, "0"));
}

/** An empty list is allowed while the editor is empty. API validation requires a row. */
export function calculateDocumentMoney(services: readonly MoneyService[], discount?: MoneyDiscount): DocumentMoney {
  if (services.length > DOCUMENT_MONEY_LIMITS.services) throw new RangeError("Слишком много строк услуг");
  const lineTotals = services.map((service) => (
    scaled(service.qty, 3, DOCUMENT_MONEY_LIMITS.quantity, "Количество", true) *
    scaled(service.price, 2, DOCUMENT_MONEY_LIMITS.price, "Цена") + 500n
  ) / 1000n);
  const gross = lineTotals.reduce((sum, row) => sum + row, 0n);
  if (gross > BigInt(DOCUMENT_MONEY_LIMITS.grossMinor)) throw new RangeError("Превышен предел общей суммы документа");
  let deduction = 0n;
  if (discount) {
    if (discount.kind !== "amount" && discount.kind !== "percent") throw new RangeError("Неизвестный вид скидки");
    const value = scaled(discount.value, 2, discount.kind === "percent" ? 100 : DOCUMENT_MONEY_LIMITS.grossMinor / 100, "Скидка");
    deduction = discount.kind === "amount" ? value : (gross * value + 5000n) / 10000n;
  }
  if (deduction > gross) throw new RangeError("Скидка превышает стоимость услуг");
  const grossMinor = Number(gross);
  const discountMinor = Number(deduction);
  const netMinor = Number(gross - deduction);
  return {
    lineTotalsMinor: lineTotals.map(Number), grossMinor, discountMinor, netMinor,
    grossAmount: grossMinor / 100, discountAmount: discountMinor / 100, totalAmount: netMinor / 100,
  };
}

/** The amount due is stored for invoices; other service documents retain their gross value. */
export function documentStoredAmount(type: "contract" | "invoice" | "act", money: DocumentMoney): number {
  return type === "invoice" ? money.totalAmount : money.grossAmount;
}
