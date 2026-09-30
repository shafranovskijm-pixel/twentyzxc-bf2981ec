import { calculateDocumentMoney } from "./document-money.ts";
import { isIndividualEntrepreneur, type DocumentData } from "./document-templates.ts";

export interface CustomContractContent {
  title: string;
  body: string;
  variables?: Record<string, string>;
}

export const CUSTOM_CONTRACT_LIMITS = {
  title: 500, body: 60_000, variables: 100, variableKey: 64, variableValue: 5_000, variableTotal: 60_000,
} as const;

export const CUSTOM_CONTRACT_TOKENS = [
  "client.name", "client.inn", "client.kpp", "client.ogrn", "client.address",
  "client.signatory_name", "client.signatory_post", "client.signatory_basis",
  "company.name", "company.inn", "company.address", "company.bank_account", "company.bank_bik", "company.bank_name",
  "contract.number", "contract.date", "subject", "deadline", "payment_terms", "service.start", "service.end",
  "services.table", "total.amount",
] as const;

export class CustomContractTemplateError extends Error {
  readonly field: string;
  constructor(field: string, message: string) {
    super(message);
    this.name = "CustomContractTemplateError";
    this.field = field;
  }
}

function fail(field: string, message: string): never { throw new CustomContractTemplateError(field, message); }
function checkText(value: unknown, field: string, max: number): asserts value is string {
  if (typeof value !== "string" || !value.trim() || value.length > max) fail(field, `ожидается непустая строка не длиннее ${max} символов`);
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) fail(field, "управляющие символы не допускаются");
}

function validCustomKey(key: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key) && !["constructor", "prototype", "__proto__"].includes(key);
}

/** Values remain literal text, including newlines and any braces/Markdown they contain. */
export function validateCustomContractVariables(value: unknown, field = "customContract.variables"): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(field, "ожидается JSON-объект со строковыми значениями");
  const entries = Object.entries(value);
  if (entries.length > CUSTOM_CONTRACT_LIMITS.variables) fail(field, `не более ${CUSTOM_CONTRACT_LIMITS.variables} переменных`);
  let size = 0;
  const checked: Record<string, string> = Object.create(null);
  for (const [key, item] of entries) {
    if (!validCustomKey(key)) fail(`${field}.${key}`, "имя переменной: латинская буква, затем буквы/цифры/_, максимум 64 символа; служебные имена запрещены");
    checkText(item, `${field}.${key}`, CUSTOM_CONTRACT_LIMITS.variableValue);
    size += item.length;
    if (size > CUSTOM_CONTRACT_LIMITS.variableTotal) fail(field, "суммарная длина значений превышает 60000 символов");
    checked[key] = item;
  }
  return checked;
}

type Segment = { text: string } | { token: string };
function segments(source: string, field: string): Segment[] {
  const result: Segment[] = [];
  let at = 0;
  while (at < source.length) {
    const start = source.indexOf("{{", at);
    const strayEnd = source.indexOf("}}", at);
    if (strayEnd !== -1 && (start === -1 || strayEnd < start)) fail(field, "закрывающие }} без начала переменной");
    if (start === -1) { result.push({ text: source.slice(at) }); break; }
    if (start > at) result.push({ text: source.slice(at, start) });
    const end = source.indexOf("}}", start + 2);
    if (end === -1) fail(field, "незакрытая переменная {{...}}");
    const token = source.slice(start + 2, end).trim();
    if (!(CUSTOM_CONTRACT_TOKENS as readonly string[]).includes(token) && !(token.startsWith("custom.") && validCustomKey(token.slice(7)))) fail(field, `неизвестная переменная {{${token}}}`);
    result.push({ token });
    at = end + 2;
  }
  return result;
}

/** Inspects a reusable template without requiring per-document custom values. Never resolves values. */
export function getCustomContractTokens(content: Pick<CustomContractContent, "title" | "body">): { tokens: string[]; requiredCustomVariables: string[] } {
  checkText(content?.title, "customContract.title", CUSTOM_CONTRACT_LIMITS.title);
  checkText(content?.body, "customContract.body", CUSTOM_CONTRACT_LIMITS.body);
  const titleTokens = segments(content.title, "customContract.title").flatMap(x => "token" in x ? [x.token] : []);
  if (titleTokens.includes("services.table")) fail("customContract.title", "{{services.table}} разрешена только отдельной строкой текста договора");
  const bodyTokens = segments(content.body, "customContract.body").flatMap(x => "token" in x ? [x.token] : []);
  for (const line of content.body.replace(/\r\n?/g, "\n").split("\n")) {
    if (/\{\{\s*services\.table\s*\}\}/.test(line) && !/^\s*\{\{\s*services\.table\s*\}\}\s*$/.test(line)) fail("customContract.body", "{{services.table}} должна занимать отдельную строку");
  }
  const tokens = [...new Set([...titleTokens, ...bodyTokens])];
  return { tokens, requiredCustomVariables: tokens.filter(t => t.startsWith("custom.")).map(t => t.slice(7)) };
}

const html = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const literal = (value: string) => html(value).replace(/\r\n?|\n/g, "<br>");
const money = (value: number) => value.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function displayDate(value?: string): string | undefined {
  if (value === undefined) return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-").reverse().join(".") : value;
}

/** Parse block Markdown first; substitutions are escaped text and can never add Markdown structure. */
function markdown(body: string, expand: (source: string) => string, table: string): string {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  function cells(line: string): string[] {
    let stripped = line.trim();
    if (stripped.startsWith("|")) stripped = stripped.slice(1);
    if (stripped.endsWith("|") && !stripped.endsWith("\\|")) stripped = stripped.slice(0, -1);
    const result: string[] = []; let cell = "";
    for (let i = 0; i < stripped.length; i++) {
      if (stripped[i] === "\\" && stripped[i + 1] === "|") { cell += "|"; i++; }
      else if (stripped[i] === "|") { result.push(cell.trim()); cell = ""; }
      else cell += stripped[i];
    }
    result.push(cell.trim());
    return result;
  }
  const tableStart = (at: number) => at + 1 < lines.length && lines[at].includes("|") && cells(lines[at + 1]).every(c => /^:?-{3,}:?$/.test(c)) && cells(lines[at]).length === cells(lines[at + 1]).length;
  const heading = (line: string) => /^(#{1,6})[ \t]+(.+)$/.exec(line);
  const list = (line: string) => /^([-+*]|\d{1,9}[.)])[ \t]+(.+)$/.exec(line);
  const tableToken = (line: string) => /^\s*\{\{\s*services\.table\s*\}\}\s*$/.test(line);
  for (let i = 0; i < lines.length;) {
    if (!lines[i].trim()) { i++; continue; }
    if (tableToken(lines[i])) { out.push(table); i++; continue; }
    const h = heading(lines[i]);
    if (h) { const level = Math.min(h[1].length + 1, 6); out.push(`<h${level}>${expand(h[2])}</h${level}>`); i++; continue; }
    if (tableStart(i)) {
      const headers = cells(lines[i]);
      if (headers.length > 12) fail("customContract.body", "таблица содержит более 12 колонок");
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|") && !tableToken(lines[i])) {
        const row = cells(lines[i]);
        if (row.length !== headers.length) fail("customContract.body", "число колонок строки таблицы не совпадает с заголовком");
        rows.push(row); i++;
      }
      out.push(`<table class="custom-contract-table"><thead><tr>${headers.map(c => `<th>${expand(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${expand(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    const item = list(lines[i]);
    if (item) {
      // Keep user numbering verbatim: the shared PDF walker does not preserve ol.start/li.value.
      if (/^\d/.test(item[1])) { out.push(`<p class="custom-list-item">${html(item[1])} ${expand(item[2])}</p>`); i++; continue; }
      const entries: string[] = [];
      while (i < lines.length) { const next = list(lines[i]); if (!next || /^\d/.test(next[1])) break; entries.push(`<li>${expand(next[2])}</li>`); i++; }
      out.push(`<ul>${entries.join("")}</ul>`); continue;
    }
    const paragraph = [lines[i++]];
    while (i < lines.length && lines[i].trim() && !heading(lines[i]) && !list(lines[i]) && !tableStart(i) && !tableToken(lines[i])) paragraph.push(lines[i++]);
    out.push(`<p>${expand(paragraph.join("\n"))}</p>`);
  }
  return out.join("\n");
}

const styles = `<style>
@page{size:A4;margin:20mm 18mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.55;color:#15171e;padding:22px;overflow-wrap:anywhere}
.brand-strip{display:flex;justify-content:space-between;background:#15171e;color:#fff;padding:12px 18px}.brand-strip .logo{font-size:20px;font-weight:bold}.brand-strip .logo span{color:#d4be37}.brand-strip .tag{font-size:10px;color:#d4be37}
h1{text-align:center;font-size:22pt;font-weight:400}h2,h3,h4,h5,h6{break-after:avoid}h2{border-bottom:1px solid #d4be37;font-size:13pt}h3,h4,h5,h6{font-size:12pt}.header-row{display:flex;justify-content:space-between;margin:16px 0}
.custom-body,.custom-body p,.custom-body li{break-inside:auto;page-break-inside:auto;overflow:visible;white-space:pre-wrap}.custom-body p{orphans:2;widows:2}.custom-list-item{padding-left:12px}.custom-contract-table{width:100%;border-collapse:collapse;table-layout:fixed;margin:12px 0;break-inside:auto}.custom-contract-table td,.custom-contract-table th{border:1px solid #ddd;padding:7px;overflow-wrap:anywhere;white-space:pre-wrap}.custom-contract-table th{background:#15171e;color:#fff}.custom-contract-table tr{break-inside:auto;page-break-inside:auto}.custom-contract-table thead{display:table-header-group}
.signatures{display:flex;gap:20px;margin-top:20px}.signature-block{width:48%;position:relative;background:#faf8ef;border-left:3px solid #d4be37;padding:14px;overflow-wrap:anywhere}.signature-block p{margin:4px 0}.signature-line{position:relative;margin-top:64px;border-bottom:1px solid #15171e;padding-top:4px}.signature-img{position:absolute;height:45px;left:76px;bottom:26px}.stamp-img{height:94px;position:absolute;left:8px;bottom:5px}
@media print{body{padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.signatures{break-inside:avoid}}
</style>`;

/** Takes RAW strings. It must not receive pre-escaped CRM or template values. */
export function generateCustomContractHtml(data: DocumentData, content: CustomContractContent, servicePeriod?: { start?: string; end?: string }): string {
  const inspection = getCustomContractTokens(content);
  const variables = content.variables === undefined ? {} : validateCustomContractVariables(content.variables);
  const totals = calculateDocumentMoney(data.services);
  const c = data.company, cl = data.client, rep = data.clientRepresentative;
  const values: Record<string, string | undefined> = {
    "client.name": cl.name, "client.inn": cl.inn, "client.kpp": cl.kpp, "client.ogrn": cl.ogrn, "client.address": cl.address,
    "client.signatory_name": rep?.name || cl.director_name, "client.signatory_post": rep?.post || cl.director_post,
    "client.signatory_basis": rep?.basis,
    "company.name": c.company_name, "company.inn": c.company_inn, "company.address": c.company_legal_address,
    "company.bank_account": c.company_bank_account, "company.bank_bik": c.company_bank_bik, "company.bank_name": c.company_bank_name,
    "contract.number": data.number, "contract.date": displayDate(data.date), "subject": data.subject,
    "deadline": displayDate(data.deadline), "payment_terms": data.paymentTerms,
    "service.start": displayDate(servicePeriod?.start), "service.end": displayDate(servicePeriod?.end),
    "total.amount": money(totals.totalAmount),
  };
  for (const [key, value] of Object.entries(variables)) values[`custom.${key}`] = value;
  for (const token of inspection.tokens) {
    if (token !== "services.table" && (!Object.prototype.hasOwnProperty.call(values, token) || typeof values[token] !== "string" || !values[token]!.trim())) fail("customContract", `не заполнена переменная {{${token}}}`);
  }
  const expand = (source: string, field = "customContract.body") => segments(source, field).map(s => "text" in s ? literal(s.text) : literal(values[s.token]!)).join("");
  const serviceTable = `<table class="custom-contract-table"><thead><tr><th>Наименование</th><th>Кол-во</th><th>Цена, ₽</th><th>Сумма, ₽</th></tr></thead><tbody>${data.services.map((s, i) => `<tr><td>${literal(s.name)}</td><td>${s.qty}</td><td>${money(s.price)}</td><td>${money(totals.lineTotalsMinor[i] / 100)}</td></tr>`).join("")}</tbody><tfoot><tr><td>ИТОГО</td><td></td><td></td><td>${money(totals.totalAmount)}</td></tr></tfoot></table>`;
  let assetOrigin = data.assetOrigin ?? (typeof window !== "undefined" ? window.location.origin : "");
  if (assetOrigin) {
    const origin = new URL(assetOrigin);
    if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) fail("assetOrigin", "ожидается доверенный HTTPS origin");
    assetOrigin = origin.origin;
  }
  const title = expand(content.title.trim(), "customContract.title");
  const body = markdown(content.body, expand, serviceTable);
  const info = (label: string, value: string | undefined) => value ? `<p>${label}${literal(value)}</p>` : "";
  const signatureName = rep?.name || cl.director_name || (isIndividualEntrepreneur(cl) ? cl.name.replace(/^ИП\s+/i, "") : "________________");
  const signaturePost = rep?.post || cl.director_post || "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} №${html(data.number)}</title>${styles}</head><body>
<div class="brand-strip"><div class="logo">24<span>ZXC</span></div><div class="tag">WEB &amp; LICENSING STUDIO</div></div>
<h1>${title}</h1><div class="header-row"><span>№ ${html(data.number)}</span><span>${html(displayDate(data.date)!)}</span></div>
<div class="custom-body">${body}</div>
<h2>Реквизиты и подписи сторон</h2><div class="signatures">
<div class="signature-block"><p><strong>Исполнитель:</strong></p>${info("", c.company_name)}${info("ИНН ", c.company_inn)}${info("КПП ", c.company_kpp)}${info(isIndividualEntrepreneur({ name: c.company_name, ogrn: c.company_ogrn }) ? "ОГРНИП " : "ОГРН ", c.company_ogrn)}${info("", c.company_legal_address)}${info("р/с ", c.company_bank_account)}${info("", c.company_bank_name)}${info("БИК ", c.company_bank_bik)}${info("к/с ", c.company_bank_corr)}
<div class="signature-line">${literal(c.company_director_post)} __________ / ${literal(c.company_director_name)} /${assetOrigin ? `<img class="signature-img" src="${html(assetOrigin)}/images/signature.png" alt="Подпись исполнителя">` : ""}</div>${assetOrigin ? `<img class="stamp-img" src="${html(assetOrigin)}/images/stamp.png" alt="Печать исполнителя">` : ""}</div>
<div class="signature-block"><p><strong>Заказчик:</strong></p>${info("", cl.name)}${info("ИНН ", cl.inn)}${info("КПП ", cl.kpp)}${info(isIndividualEntrepreneur(cl) ? "ОГРНИП " : "ОГРН ", cl.ogrn)}${info("", cl.address)}${info("Основание полномочий: ", rep?.basis)}<div class="signature-line">${literal(signaturePost)} __________ / ${literal(signatureName)} /</div></div>
</div></body></html>`;
}
