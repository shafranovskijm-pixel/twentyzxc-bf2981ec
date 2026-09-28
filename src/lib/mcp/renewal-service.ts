import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import type { Database } from "../../integrations/supabase/types";
import { CrmError, createUserDatabase, requireAdmin } from "./service";

// No credentials, notes, HTML or arbitrary metadata are read by this tool.
export const RENEWAL_CONTRACT_FIELDS = "id,client_name,contract_number,contract_date,contract_type,amount,amount_extra,paid_until,service_start,service_end,service_no_deadline,is_archived,is_one_time";
export const RENEWAL_CLIENT_FIELDS = "id,name,inn,email";
export const RENEWAL_DOCUMENT_FIELDS = "id,doc_type,doc_number,doc_date,contract_id,client_id,client_name,client_inn,total_amount,revision,services";

type Contract = Pick<Database["public"]["Tables"]["contracts"]["Row"],
  "id" | "client_name" | "contract_number" | "contract_date" | "contract_type" | "amount" | "amount_extra" |
  "paid_until" | "service_start" | "service_end" | "service_no_deadline" | "is_archived" | "is_one_time">;
type Client = Pick<Database["public"]["Tables"]["clients"]["Row"], "id" | "name" | "inn" | "email">;
interface SourceDocument {
  id: string; doc_type: string; doc_number: string; doc_date: string; contract_id: string;
  client_id: string | null; client_name: string; client_inn: string | null;
  total_amount: number; revision: number; services: unknown;
}
export interface RenewalSearchInput {
  /** Explicit calendar date avoids the server's UTC date silently changing the window. */
  asOf: string;
  service?: "frdo" | "all";
  daysAhead?: number;
  expiredDaysBack?: number;
  limit?: number;
  offset?: number;
}

const DAY_MS = 86_400_000;
const PAGE_SIZE = 500;
const MAX_SCAN = 10_000;
function calendarDay(value: string | null | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time / DAY_MS : null;
}
function dateString(day: number) { return new Date(day * DAY_MS).toISOString().slice(0, 10); }
function integer(value: number, min: number, max: number, field: string) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new CrmError("INVALID_RENEWAL_SEARCH", `Поле ${field}: укажите целое число от ${min} до ${max}.`);
  }
  return value;
}
function options(input: RenewalSearchInput) {
  const asOfDay = calendarDay(input.asOf);
  if (asOfDay === null) throw new CrmError("INVALID_RENEWAL_SEARCH", "asOf: укажите существующую календарную дату YYYY-MM-DD.");
  const service = input.service ?? "frdo";
  if (service !== "frdo" && service !== "all") throw new CrmError("INVALID_RENEWAL_SEARCH", "service: ожидается frdo или all.");
  return {
    asOfDay, asOf: input.asOf, service,
    daysAhead: integer(input.daysAhead ?? 30, 0, 366, "daysAhead"),
    expiredDaysBack: integer(input.expiredDaysBack ?? 0, 0, 366, "expiredDaysBack"),
    limit: integer(input.limit ?? 20, 1, 100, "limit"),
    offset: integer(input.offset ?? 0, 0, MAX_SCAN, "offset"),
    usedDefaultDaysAhead: input.daysAhead === undefined,
  };
}
function matchesService(contract: Contract, service: "frdo" | "all") {
  return service === "all" || /(?:фрдо|frdo)/i.test(contract.contract_type ?? "");
}
function expiry(contract: Contract) {
  // A service term is not a payment date. Retain the basis instead of treating
  // paid_until as proof that the legal contract expires on that day.
  const source = contract.service_end ? "service_end" as const : "paid_until" as const;
  const value = contract[source];
  return { date: value, day: calendarDay(value), source };
}

/** Pure selection, also used by tests; never invents a term from contract_date. */
export function selectRenewalContracts(contracts: Contract[], input: RenewalSearchInput) {
  const filter = options(input);
  const active = contracts.filter(contract => !contract.is_archived && !contract.is_one_time &&
    !contract.service_no_deadline && matchesService(contract, filter.service));
  const withoutUsableTerm = active.filter(contract => expiry(contract).day === null);
  const eligible = active.flatMap(contract => {
    const end = expiry(contract);
    if (end.day === null) return [];
    const daysRemaining = end.day - filter.asOfDay;
    return daysRemaining >= -filter.expiredDaysBack && daysRemaining <= filter.daysAhead
      ? [{ contract, expiry: { date: end.date!, source: end.source, daysRemaining } }] : [];
  }).sort((a, b) => a.expiry.daysRemaining - b.expiry.daysRemaining || a.contract.id.localeCompare(b.contract.id));
  return { filter, eligible, withoutUsableTerm };
}

interface QueryResult { data: unknown[] | null; error: { message?: string } | null }
async function readAll<T>(query: (from: number, to: number) => PromiseLike<QueryResult>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_SCAN; from += PAGE_SIZE) {
    const result = await query(from, from + PAGE_SIZE - 1);
    if (result.error) throw new CrmError("DATABASE_ERROR", "Не удалось прочитать данные для подбора продлений.");
    const page = (result.data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
  // Do not silently hide later records or an ambiguous client beyond the cap.
  throw new CrmError("RENEWAL_SCAN_LIMIT", "Слишком много записей для полного подбора. Требуется сузить поиск на стороне CRM.");
}
function structuredServices(value: unknown) {
  if (!Array.isArray(value) || value.length > 100) return null;
  const services = value.map(item => {
    if (!item || typeof item !== "object") return null;
    const { name, qty, price } = item as Record<string, unknown>;
    return typeof name === "string" && name.length > 0 && name.length <= 1000 &&
      typeof qty === "number" && Number.isFinite(qty) && qty > 0 &&
      typeof price === "number" && Number.isFinite(price) && price >= 0 ? { name, qty, price } : null;
  });
  return services.length && services.every(Boolean) ? services : null;
}

/** Uses only the authenticated user's database client/RLS, with no writes. */
export class CrmRenewalService {
  constructor(private db: SupabaseClient) {}

  async listRenewalCandidates(input: RenewalSearchInput) {
    options(input); // Reject malformed input before any database call.
    const contracts = await readAll<Contract>((from, to) => this.db.from("contracts")
      .select(RENEWAL_CONTRACT_FIELDS).eq("is_archived", false).order("id").range(from, to));
    const { filter, eligible, withoutUsableTerm } = selectRenewalContracts(contracts, input);
    const page = eligible.slice(filter.offset, filter.offset + filter.limit);
    const names = [...new Set(page.map(item => item.contract.client_name))];
    const contractIds = page.map(item => item.contract.id);
    const [clients, documents] = page.length ? await Promise.all([
      readAll<Client>((from, to) => this.db.from("clients").select(RENEWAL_CLIENT_FIELDS).in("name", names).order("id").range(from, to)),
      readAll<SourceDocument>((from, to) => this.db.from("generated_documents").select(RENEWAL_DOCUMENT_FIELDS)
        .in("contract_id", contractIds).in("doc_type", ["contract", "invoice"]).order("id").range(from, to)),
    ]) : [[], []] as [Client[], SourceDocument[]];
    const candidates = page.map(({ contract, expiry: term }) => {
      const matchingClients = clients.filter(client => client.name === contract.client_name);
      const client = matchingClients.length === 1 ? matchingClients[0] : null;
      const linkedDocuments = documents.filter(document => document.contract_id === contract.id)
        .sort((a, b) => b.doc_date.localeCompare(a.doc_date) || a.id.localeCompare(b.id));
      const newerContracts = contracts.filter(other => other.id !== contract.id && !other.is_archived &&
        other.client_name === contract.client_name &&
        (/(?:фрдо|frdo)/i.test(contract.contract_type ?? "")
          ? /(?:фрдо|frdo)/i.test(other.contract_type ?? "") : other.contract_type === contract.contract_type) &&
        ((calendarDay(other.service_start) ?? -Infinity) > calendarDay(term.date)! ||
          (calendarDay(other.contract_date) ?? -Infinity) > calendarDay(term.date)!));
      return {
        contractId: contract.id, clientName: contract.client_name,
        contractNumber: contract.contract_number, contractDate: contract.contract_date,
        service: contract.contract_type,
        currentPeriod: { start: contract.service_start, end: contract.service_end, paidUntil: contract.paid_until },
        expiry: { ...term, meaning: term.source === "service_end" ? "recorded_service_end" : "recorded_paid_through_only" },
        previousAmounts: { amount: contract.amount, amountExtra: contract.amount_extra, currency: "RUB", newPriceConfirmed: false },
        clientLink: { status: client ? "unique_exact_name" : matchingClients.length ? "ambiguous_name" : "not_found",
          clientId: client?.id ?? null, matchBasis: "contracts.client_name = clients.name" },
        client: client ? { id: client.id, name: client.name, inn: client.inn, email: client.email } : null,
        clientChoices: client ? [] : matchingClients.map(match => ({ id: match.id, name: match.name, inn: match.inn })),
        sourceDocuments: linkedDocuments.slice(0, 10).map(document => ({
          documentId: document.id, type: document.doc_type, number: document.doc_number, date: document.doc_date,
          revision: document.revision, totalAmount: document.total_amount,
          clientId: document.client_id, clientLinkVerified: !!client && document.client_id === client.id,
          services: structuredServices(document.services),
        })),
        sourceDocumentCount: linkedDocuments.length,
        possibleNewerContracts: newerContracts.slice(0, 10).map(other => ({
          contractId: other.id, number: other.contract_number, date: other.contract_date,
          serviceStart: other.service_start, serviceEnd: other.service_end, paidUntil: other.paid_until,
        })),
        possibleNewerContractCount: newerContracts.length,
        review: {
          clientSelectionNeeded: !client, emailMissing: !client?.email,
          contractNumberMissing: !contract.contract_number, contractDateMissing: !contract.contract_date,
          structuredServicesMissing: !linkedDocuments.some(document => !!client && document.client_id === client.id && structuredServices(document.services)),
          possibleExistingRenewal: newerContracts.length > 0,
          newPeriod: null, newPrice: null,
        },
      };
    });
    return {
      status: "options_for_review", saved: false, sent: false,
      window: { asOf: filter.asOf, from: dateString(filter.asOfDay - filter.expiredDaysBack),
        through: dateString(filter.asOfDay + filter.daysAhead), daysAhead: filter.daysAhead,
        expiredDaysBack: filter.expiredDaysBack, usedDefaultDaysAhead: filter.usedDefaultDaysAhead, service: filter.service },
      totalCandidates: eligible.length, offset: filter.offset, limit: filter.limit,
      hasMore: filter.offset + candidates.length < eligible.length, candidates,
      recordsWithoutUsableTerm: { count: withoutUsableTerm.length,
        sample: withoutUsableTerm.slice(0, 20).map(contract => ({ contractId: contract.id, clientName: contract.client_name,
          number: contract.contract_number, serviceEnd: contract.service_end, paidUntil: contract.paid_until })) },
      nextStep: "Покажите пользователю варианты: клиент, договор, источник срока, прежняя сумма, email и пробелы. Уточните выбранных клиентов, новый период и цену. Сначала предложите подготовить и сохранить договор/счёт без отправки; перед отправкой покажите точные документы и адресата и спросите, отправлять ли их. Поиск ничего не создаёт и не отправляет.",
      limitations: [
        "paid_until — дата оплаченного периода в CRM, а не доказательство окончания договора.",
        "Прежние суммы и услуги приведены как источник для обсуждения; новые условия не согласованы.",
        "Договоры связаны с карточками по точному названию; неоднозначную связь нельзя выбирать автоматически.",
        "Записи без даты не считаются истекающими. Договоры без срока, разовые и архивные исключены.",
      ],
    };
  }
}

export async function runRenewalTool(ctx: ToolContext, input: RenewalSearchInput) {
  try {
    const db = createUserDatabase(ctx);
    await requireAdmin(db, ctx.getUserId());
    const result = await new CrmRenewalService(db).listRenewalCandidates(input);
    return { structuredContent: result, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const result = error instanceof CrmError ? { code: error.code, message: error.message }
      : { code: "INTERNAL_ERROR", message: "Не удалось получить варианты продления. Документы и письма не создавались." };
    return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }] };
  }
}
