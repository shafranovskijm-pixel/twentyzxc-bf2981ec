import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { validateIsoDate } from "../../../supabase/functions/_shared/crm-documents/domain";
import { CrmError, createUserDatabase, requireAdmin } from "./service";

export type PaymentStatus = "unpaid" | "partial" | "paid";
export type PaymentConfirmationSource = "user_report" | "bank_document";

export interface PaymentTarget {
  clientId: string;
  contractId?: string | null;
  invoiceId?: string | null;
}

export interface SetPaymentStatusInput extends PaymentTarget {
  requestId: string;
  expectedRevision: number;
  expectedSourceRevision: string;
  status: PaymentStatus;
  /** Cumulative receipts in RUB, never an increment. */
  paidAmount?: number | null;
  paidOn?: string | null;
  confirmationSource?: PaymentConfirmationSource;
  reason?: string | null;
}

export interface PaymentSnapshot {
  clientId: string;
  contractId: string | null;
  invoiceId: string | null;
  scope: string;
  targetId: string;
  amountDue: number | null;
  paidAmount: number | null;
  remainingAmount: number | null;
  paymentStatus: PaymentStatus | null;
  paymentRevision: number;
  sourceRevision: string;
  paidOn: string | null;
  confirmationSource: PaymentConfirmationSource | null;
  reason: string | null;
  amountKnown: boolean;
  knownPaidAmount?: number;
  requiresInvoiceSelection?: boolean;
  legacyStatus?: string | null;
  linkedInvoices: unknown[];
  history: unknown[];
}

const messages: Record<string, string> = {
  CRM_ADMIN_REQUIRED: "Изменять оплату может только администратор CRM.",
  CRM_PAYMENT_INVALID_TARGET: "Укажите точный clientId и contractId либо invoiceId. Не выбирайте договор по похожему названию.",
  CRM_PAYMENT_TARGET_REQUIRED: "Укажите точный clientId и contractId либо invoiceId. Не выбирайте договор по похожему названию.",
  CRM_PAYMENT_CLIENT_NOT_FOUND: "Клиент не найден. Сначала выберите существующую карточку.",
  CRM_CLIENT_NOT_FOUND: "Клиент не найден. Сначала выберите существующую карточку.",
  CRM_PAYMENT_CONTRACT_NOT_FOUND: "Договор не найден. Проверьте точный contractId.",
  CRM_PAYMENT_INVOICE_NOT_FOUND: "Счёт не найден. Проверьте точный invoiceId.",
  CRM_PAYMENT_TARGET_NOT_FOUND: "Договор или счёт не найден. Проверьте выбранные ID.",
  CRM_PAYMENT_CLIENT_MISMATCH: "Договор или счёт не принадлежит указанному клиенту. Уточните карточку и документ.",
  CRM_PAYMENT_CONTRACT_MISMATCH: "Выбранный счёт не связан с указанным договором. Уточните точные ID.",
  CRM_PAYMENT_AMBIGUOUS_CLIENT: "Связь старого договора с клиентом неоднозначна. Требуется точное сопоставление; оплата не изменена.",
  CRM_PAYMENT_INVOICE_REQUIRED: "У договора несколько счетов. Уточните конкретный invoiceId; оплата не распределяется автоматически.",
  CRM_PAYMENT_REVISION_CONFLICT: "Оплата уже изменилась. Перечитайте crm_get_payment_status и согласуйте изменение по актуальной версии; не увеличивайте сумму повторно.",
  CRM_PAYMENT_SOURCE_CONFLICT: "Сумма, скидка или связь документа изменилась. Перечитайте crm_get_payment_status и проверьте выбранный счёт перед новой операцией.",
  CRM_PAYMENT_SOURCE_REVISION_CONFLICT: "Сумма, скидка или связь документа изменилась. Перечитайте crm_get_payment_status и проверьте выбранный счёт перед новой операцией.",
  CRM_PAYMENT_SOURCE_CHANGED: "Сумма, скидка или связь документа изменилась. Перечитайте crm_get_payment_status и проверьте выбранный счёт перед новой операцией.",
  CRM_REQUEST_ID_CONFLICT: "Этот requestId уже использован с другими данными. Проверьте сохранённый результат; повтор одной операции должен содержать прежние данные.",
  CRM_PAYMENT_INVALID_AMOUNT: "Укажите общую полученную сумму в рублях с точностью до копейки. Для частичной оплаты сумма должна быть больше нуля и меньше суммы к оплате.",
  CRM_PAYMENT_AMOUNT_INVALID: "Укажите общую полученную сумму в рублях с точностью до копейки. Для частичной оплаты сумма должна быть больше нуля и меньше суммы к оплате.",
  CRM_PAYMENT_STATUS_AMOUNT_MISMATCH: "Статус не соответствует общей сумме поступлений. Перечитайте сумму к оплате после скидки: unpaid — ноль, partial — часть, paid — полная сумма.",
  CRM_PAYMENT_RECONCILIATION_REQUIRED: "Связь или сумма документа с учтёнными платежами требует сверки. Автоматическое перераспределение оплаты остановлено; проверьте договор и счета.",
  CRM_PAYMENT_USE_COMMAND: "Эта оплата ведётся через защищённый журнал. Используйте crm_get_payment_status и crm_set_payment_status с актуальными версиями.",
  CRM_PAYMENT_AMOUNT_UNKNOWN: "Сумма к оплате не установлена. Сначала уточните сумму и выбранный документ.",
  CRM_PAYMENT_INVALID_STATUS: "Допустимы только unpaid (не оплачен), partial (частично оплачен) и paid (оплачен).",
  CRM_PAYMENT_INVALID_REQUEST: "Нужны requestId, актуальные paymentRevision и sourceRevision из crm_get_payment_status.",
  CRM_PAYMENT_INVALID_DATE: "Укажите известную дату оплаты YYYY-MM-DD либо null. Не подставляйте сегодняшнюю дату вместо неизвестной.",
  CRM_PAYMENT_INVALID_SOURCE: "Источник — user_report для слов пользователя либо bank_document с ссылкой/описанием предоставленного банковского документа в reason. Сверка с банком не выполняется.",
  CRM_PAYMENT_INVALID_REASON: "Комментарий должен содержать не более 2000 символов без управляющих символов.",
  CRM_PAYMENT_VERIFICATION_FAILED: "Не удалось подтвердить сохранённую оплату повторным чтением. Операция могла сохраниться: проверьте crm_get_payment_status; повторяйте только прежний requestId с прежними данными.",
  CRM_PAYMENT_VERIFICATION_CONFLICT: "После записи состояние оплаты отличается от повторного чтения. Операция могла сохраниться: перечитайте crm_get_payment_status. Не зачисляйте сумму ещё раз и не подставляйте новую версию автоматически.",
  CRM_PAYMENT_DATABASE_ERROR: "Операция с оплатой не подтверждена. Проверьте crm_get_payment_status; при повторе используйте прежний requestId и данные.",
};

function fail(code: string): never {
  throw new CrmError(code, messages[code]);
}

function databaseError(error: { message?: string } | null) {
  if (!error) return;
  const reported = error.message?.match(/CRM_[A-Z_]+/)?.[0];
  fail(reported && Object.prototype.hasOwnProperty.call(messages, reported) ? reported : "CRM_PAYMENT_DATABASE_ERROR");
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const statuses: PaymentStatus[] = ["unpaid", "partial", "paid"];

export function validatePaymentTarget(target: PaymentTarget) {
  if (!target || !uuid.test(target.clientId || "") || (!target.contractId && !target.invoiceId)
    || (target.contractId != null && !uuid.test(target.contractId))
    || (target.invoiceId != null && !uuid.test(target.invoiceId))) fail("CRM_PAYMENT_INVALID_TARGET");
  return { clientId: target.clientId.toLowerCase(), contractId: target.contractId?.toLowerCase() ?? null,
    invoiceId: target.invoiceId?.toLowerCase() ?? null };
}

export function validatePaymentChange(input: SetPaymentStatusInput) {
  const target = validatePaymentTarget(input);
  if (!uuid.test(input.requestId || "") || !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0
    || typeof input.expectedSourceRevision !== "string" || !input.expectedSourceRevision.trim()
    || input.expectedSourceRevision.length > 200) fail("CRM_PAYMENT_INVALID_REQUEST");
  if (!statuses.includes(input.status)) fail("CRM_PAYMENT_INVALID_STATUS");
  const amount = input.paidAmount ?? null;
  if (amount !== null && (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0
    || !Number.isSafeInteger(Math.round(amount * 100)) || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001)) {
    fail("CRM_PAYMENT_INVALID_AMOUNT");
  }
  if ((input.status === "partial" && !(amount > 0)) || (input.status === "unpaid" && amount !== null && amount !== 0)) {
    fail("CRM_PAYMENT_INVALID_AMOUNT");
  }
  const paidOn = input.paidOn ?? null;
  if (paidOn !== null) {
    try { validateIsoDate(paidOn); } catch { fail("CRM_PAYMENT_INVALID_DATE"); }
  }
  if (input.reason != null && (typeof input.reason !== "string" || input.reason.length > 2000 || /[\x00-\x1f\x7f]/.test(input.reason))) {
    fail("CRM_PAYMENT_INVALID_REASON");
  }
  const reason = input.reason?.trim() || null;
  const confirmationSource = input.confirmationSource ?? "user_report";
  if (!["user_report", "bank_document"].includes(confirmationSource) || (confirmationSource === "bank_document" && !reason)) {
    fail("CRM_PAYMENT_INVALID_SOURCE");
  }
  return { ...target, requestId: input.requestId.toLowerCase(), expectedRevision: input.expectedRevision,
    expectedSourceRevision: input.expectedSourceRevision, status: input.status, paidAmount: amount,
    paidOn, confirmationSource, reason };
}

function snapshot(value: unknown, target: PaymentTarget): PaymentSnapshot {
  const data = value as PaymentSnapshot | null;
  const money = (amount: unknown) => typeof amount === "number" && Number.isFinite(amount) && amount >= 0;
  if (!data || typeof data !== "object" || data.clientId !== target.clientId
    || (target.contractId && data.contractId !== target.contractId) || (target.invoiceId && data.invoiceId !== target.invoiceId)
    || !["contract", "invoice"].includes(data.scope) || !uuid.test(data.targetId || "")
    || (data.contractId !== null && !uuid.test(data.contractId || "")) || (data.invoiceId !== null && !uuid.test(data.invoiceId || ""))
    || data.targetId !== (data.scope === "invoice" ? data.invoiceId : data.contractId)
    || !money(data.amountDue) || (data.paidAmount !== null && !money(data.paidAmount))
    || (data.remainingAmount !== null && !money(data.remainingAmount)) || typeof data.amountKnown !== "boolean"
    || !Number.isSafeInteger(data.paymentRevision) || data.paymentRevision < 0
    || typeof data.sourceRevision !== "string" || !data.sourceRevision
    || !Array.isArray(data.history) || !Array.isArray(data.linkedInvoices)
    || (data.paidOn !== null && typeof data.paidOn !== "string")
    || (data.confirmationSource !== null && !["user_report", "bank_document"].includes(data.confirmationSource))
    || (data.reason !== null && typeof data.reason !== "string")
    || (data.paymentStatus !== null && !statuses.includes(data.paymentStatus))) fail("CRM_PAYMENT_VERIFICATION_FAILED");
  return data;
}

/** RPCs own amount/discount calculation, linkage, locking, audit and idempotency. */
export class CrmPaymentService {
  constructor(private db: SupabaseClient) {}

  async getPaymentStatus(input: PaymentTarget) {
    const target = validatePaymentTarget(input);
    const { data, error } = await this.db.rpc("crm_get_payment_status", {
      p_client_id: target.clientId, p_contract_id: target.contractId, p_invoice_id: target.invoiceId,
    });
    databaseError(error);
    return { payment: snapshot(data, target), bankVerified: false as const, sent: false as const };
  }

  async setPaymentStatus(input: SetPaymentStatusInput) {
    const command = validatePaymentChange(input);
    const { data, error } = await this.db.rpc("crm_set_payment_status", {
      p_request_id: command.requestId, p_client_id: command.clientId, p_contract_id: command.contractId,
      p_invoice_id: command.invoiceId, p_expected_revision: command.expectedRevision,
      p_expected_source_revision: command.expectedSourceRevision, p_status: command.status,
      p_paid_amount: command.paidAmount, p_paid_on: command.paidOn,
      p_confirmation_source: command.confirmationSource, p_reason: command.reason,
    });
    databaseError(error);
    if (!data || data.saved !== true || typeof data.replayed !== "boolean") fail("CRM_PAYMENT_VERIFICATION_FAILED");
    const written = snapshot(data.payment, command);
    let current: PaymentSnapshot;
    try {
      current = (await this.getPaymentStatus(command)).payment;
    } catch {
      // A failed verification is not evidence that the already committed write failed.
      fail("CRM_PAYMENT_VERIFICATION_FAILED");
    }
    const fields: (keyof PaymentSnapshot)[] = ["clientId", "contractId", "invoiceId", "scope", "targetId", "paymentRevision", "sourceRevision",
      "amountDue", "paidAmount", "remainingAmount", "paymentStatus", "paidOn", "confirmationSource", "reason", "amountKnown"];
    if (fields.some(field => current[field] !== written[field])) fail("CRM_PAYMENT_VERIFICATION_CONFLICT");
    return { saved: true as const, verified: true as const, requestId: command.requestId, replayed: data.replayed as boolean,
      payment: current, bankVerified: false as const, sent: false as const };
  }
}

export async function runPaymentTool<T>(ctx: ToolContext, action: (service: CrmPaymentService) => Promise<T>) {
  try {
    const db = createUserDatabase(ctx);
    await requireAdmin(db, ctx.getUserId());
    const result = await action(new CrmPaymentService(db));
    return { structuredContent: result, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const result = error instanceof CrmError ? { code: error.code, message: error.message }
      : { code: "CRM_PAYMENT_DATABASE_ERROR", message: messages.CRM_PAYMENT_DATABASE_ERROR };
    return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
}
