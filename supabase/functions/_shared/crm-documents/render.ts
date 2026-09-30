import {
  generateActHtml,
  generateContractHtml,
  generateInvoiceHtml,
  type ClientRequisites,
  type CompanyRequisites,
  type DocumentData,
} from "../../../../src/lib/document-templates.ts";
import { generateFrdoContractHtml } from "../../../../src/lib/frdo-contract-template.ts";
import { generateNmoContractHtml } from "../../../../src/lib/nmo-contract-template.ts";
import {
  calculateTotals,
  DocumentValidationError,
  validateDocumentInput,
  validateIsoDate,
  type DocumentInput,
  type DocumentService,
} from "./domain.ts";

export type { ClientRequisites, CompanyRequisites } from "../../../../src/lib/document-templates.ts";

export interface LinkedContractSnapshot {
  id: string;
  number: string;
  date: string;
}

export interface RenderContext {
  client: ClientRequisites;
  company: CompanyRequisites;
  /** Exact configured values before deriving an ИП signature from its legal name. */
  companySourceSnapshot?: CompanyRequisites;
  linkedContract?: LinkedContractSnapshot;
  /** Supplied by trusted server configuration, never from the document request. */
  assetOrigin: string;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface RenderedDocument {
  html: string;
  services: DocumentService[];
  totalAmount: number;
  metadata: Record<string, JsonValue>;
}

const CLIENT_FIELDS: (keyof ClientRequisites)[] = [
  "name", "inn", "kpp", "ogrn", "address", "director_name", "director_post",
];
const COMPANY_FIELDS: (keyof CompanyRequisites)[] = [
  "company_name", "company_short_name", "company_inn", "company_kpp", "company_ogrn",
  "company_legal_address", "company_actual_address", "company_bank_account", "company_bank_bik",
  "company_bank_corr", "company_bank_name", "company_director_name", "company_director_post",
  "company_phone", "company_email",
];

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function copyRequisites<T extends object>(source: T, fields: (keyof T)[], field: string): T {
  const result = {} as T;
  for (const key of fields) {
    if (typeof source?.[key] !== "string") {
      throw new DocumentValidationError([{ field: `${field}.${String(key)}`, message: "ожидается строка из карточки CRM" }]);
    }
    result[key] = source[key];
  }
  return result;
}

function escapedRequisites<T extends object>(source: T): T {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, escapeHtml(value)])) as T;
}

/** String formatting is independent of the server timezone (unlike Date locale conversion). */
export function formatDocumentDate(value: string): string {
  const [year, month, day] = validateIsoDate(value).split("-");
  return `${day}.${month}.${year}`;
}

function configuredAssetOrigin(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Document asset origin is not configured correctly");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Document asset origin must be an HTTPS origin without a path or credentials");
  }
  return url.origin;
}

function cloneJson(value: object): { [key: string]: JsonValue } {
  return JSON.parse(JSON.stringify(value)) as { [key: string]: JsonValue };
}

export function renderDocument(input: DocumentInput, context: RenderContext): RenderedDocument {
  const checked = validateDocumentInput(input);
  const totals = calculateTotals(checked.services, checked.discount);
  const client = copyRequisites(context.client, CLIENT_FIELDS, "client");
  const company = copyRequisites(context.company, COMPANY_FIELDS, "company");
  const companySourceSnapshot = context.companySourceSnapshot
    ? copyRequisites(context.companySourceSnapshot, COMPANY_FIELDS, "companySourceSnapshot") : undefined;
  if (checked.invoiceBasis && checked.invoiceBasis.payerInn !== client.inn.trim()) {
    throw new DocumentValidationError([{ field: "invoiceBasis.payerInn", message: "ИНН плательщика исходного счёта не совпадает с ИНН клиента CRM" }]);
  }
  let linkedContract: LinkedContractSnapshot | undefined;
  if (checked.contractId) {
    if (!context.linkedContract || context.linkedContract.id.toLowerCase() !== checked.contractId) {
      throw new DocumentValidationError([{ field: "contractId", message: "нужны подтверждённые реквизиты связанного договора" }]);
    }
    if (typeof context.linkedContract.number !== "string" || !context.linkedContract.number.trim()) {
      throw new DocumentValidationError([{ field: "linkedContract.number", message: "в связанном договоре отсутствует номер" }]);
    }
    linkedContract = {
      id: checked.contractId,
      number: context.linkedContract.number,
      date: validateIsoDate(context.linkedContract.date, "linkedContract.date"),
    };
  }
  const data: DocumentData = {
    type: checked.type,
    number: escapeHtml(checked.number),
    date: formatDocumentDate(checked.date),
    company: escapedRequisites(company),
    client: escapedRequisites(client),
    clientRepresentative: checked.clientRepresentative ? escapedRequisites(checked.clientRepresentative) : undefined,
    services: checked.services.map((service, index) => ({
      ...service,
      name: escapeHtml(service.name),
      computedLineTotal: totals.lineTotalsMinor[index] / 100,
    })),
    assetOrigin: configuredAssetOrigin(context.assetOrigin),
    computedGrossTotal: totals.grossAmount,
    subject: checked.subject ? escapeHtml(checked.subject) : undefined,
    deadline: checked.deadline
      ? escapeHtml(/^\d{4}-\d{2}-\d{2}$/.test(checked.deadline) ? formatDocumentDate(checked.deadline) : checked.deadline)
      : undefined,
    paymentTerms: checked.paymentTerms ? escapeHtml(checked.paymentTerms) : undefined,
    contractNumber: linkedContract ? escapeHtml(linkedContract.number) : undefined,
    contractDate: linkedContract ? formatDocumentDate(linkedContract.date) : undefined,
    invoiceNumber: checked.invoiceBasis ? escapeHtml(checked.invoiceBasis.number) : undefined,
    invoiceDate: checked.invoiceBasis ? formatDocumentDate(checked.invoiceBasis.date) : undefined,
    discountAmount: totals.discountAmount,
    discountDeadline: checked.discount?.deadline ? formatDocumentDate(checked.discount.deadline) : undefined,
  };
  let html: string;
  if (checked.type === "contract") {
    const renderer = checked.template === "frdo" ? generateFrdoContractHtml
      : checked.template === "nmo" ? generateNmoContractHtml : generateContractHtml;
    html = renderer(data);
  } else if (checked.type === "act") {
    html = generateActHtml(data);
  } else {
    html = generateInvoiceHtml(data);
  }
  const metadata: RenderedDocument["metadata"] = {
    schemaVersion: 1,
    source: "crm-documents-api",
    currency: "RUB",
    rounding: "half-up-per-line",
    clientId: checked.clientId,
    documentInput: cloneJson(checked),
    clientSnapshot: cloneJson(client),
    companySnapshot: cloneJson(company),
    contractSubType: checked.template === "frdo" || checked.template === "nmo" ? checked.template : "site",
    subject: checked.subject ?? "",
    deadline: checked.deadline ?? "",
    paymentTerms: checked.paymentTerms ?? "",
    clientKpp: client.kpp,
    clientOgrn: client.ogrn,
    clientAddress: client.address,
    clientDirectorName: client.director_name,
    clientDirectorPost: client.director_post,
    discount: checked.discount ? cloneJson(checked.discount) : null,
    discountAmount: totals.discountAmount,
    discountDeadline: checked.discount?.deadline ?? "",
    grossAmount: totals.grossAmount,
    netAmount: totals.totalAmount,
    grossMinor: totals.grossMinor,
    discountMinor: totals.discountMinor,
    netMinor: totals.netMinor,
    lineTotalsMinor: totals.lineTotalsMinor,
  };
  if (companySourceSnapshot) metadata.companySourceSnapshot = cloneJson(companySourceSnapshot);
  if (linkedContract) metadata.linkedContractSnapshot = cloneJson(linkedContract);
  if (checked.invoiceBasis) {
    metadata.invoiceBasisSnapshot = cloneJson(checked.invoiceBasis);
    metadata.invoiceBasisProvenance = "explicit-source-export";
  }
  if (checked.servicePeriod) metadata.servicePeriod = cloneJson(checked.servicePeriod);
  if (checked.clientRepresentative) metadata.clientRepresentative = cloneJson(checked.clientRepresentative);
  return { html, services: checked.services, totalAmount: totals.totalAmount, metadata };
}
