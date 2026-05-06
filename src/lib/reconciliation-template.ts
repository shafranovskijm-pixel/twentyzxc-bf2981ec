import type { CompanyRequisites, ClientRequisites } from "./document-templates";

export interface ReconciliationRow {
  date: string; // ISO yyyy-mm-dd
  doc: string;
  debit: number; // начисление (Исполнитель «продал»)
  credit: number; // оплата от заказчика
}

export interface ReconciliationData {
  number: string;
  periodFrom: string; // ISO
  periodTo: string; // ISO
  company: CompanyRequisites;
  client: ClientRequisites;
  rows: ReconciliationRow[];
  openingBalance?: number; // начальное сальдо в пользу Исполнителя (+) или Заказчика (-)
}

function fmtMoney(n: number): string {
  if (!n) return "";
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateShort(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}.${mm}.${yy}`;
}

function fmtPeriod(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()} г.`;
}

function fmtDateLong(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ── Сумма прописью (рубли + копейки) ── */
const ones = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const onesF = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

function tripletToWords(n: number, feminine: boolean): string {
  const out: string[] = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  if (h) out.push(hundreds[h]);
  if (t === 1) {
    out.push(teens[u]);
  } else {
    if (t) out.push(tens[t]);
    if (u) out.push(feminine ? onesF[u] : ones[u]);
  }
  return out.join(" ");
}

function pluralForm(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function moneyToWords(amount: number): string {
  const sign = amount < 0 ? "минус " : "";
  const abs = Math.abs(amount);
  const rub = Math.floor(abs);
  const kop = Math.round((abs - rub) * 100);
  const billions = Math.floor(rub / 1_000_000_000);
  const millions = Math.floor((rub % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((rub % 1_000_000) / 1000);
  const ones3 = rub % 1000;

  const parts: string[] = [];
  if (billions) parts.push(tripletToWords(billions, false), pluralForm(billions, ["миллиард", "миллиарда", "миллиардов"]));
  if (millions) parts.push(tripletToWords(millions, false), pluralForm(millions, ["миллион", "миллиона", "миллионов"]));
  if (thousands) parts.push(tripletToWords(thousands, true), pluralForm(thousands, ["тысяча", "тысячи", "тысяч"]));
  if (ones3 || !parts.length) parts.push(tripletToWords(ones3, false));
  let words = parts.filter(Boolean).join(" ").trim();
  words = words.charAt(0).toUpperCase() + words.slice(1);
  return `${sign}${words} ${pluralForm(rub, ["рубль", "рубля", "рублей"])} ${String(kop).padStart(2, "0")} ${pluralForm(kop, ["копейка", "копейки", "копеек"])}`;
}

export function generateReconciliationHtml(data: ReconciliationData): string {
  const { company: c, client: cl, rows, number: num } = data;
  const opening = data.openingBalance || 0;

  const totalDebit = rows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCredit = rows.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  // Сальдо: opening (плюс — клиент должен) + дебет − кредит
  const finalBalance = opening + totalDebit - totalCredit;
  const debtor = finalBalance > 0 ? c.company_short_name || c.company_name : finalBalance < 0 ? cl.name : null;
  const debtAmount = Math.abs(finalBalance);

  const styles = `
    <style>
      @page { size: A4 landscape; margin: 8mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Times New Roman', Times, serif; font-size: 9pt; line-height: 1.3; color: #000; padding: 10mm; }
      h1 { font-size: 12pt; text-align: center; margin: 0 0 4px; }
      h2 { font-size: 10pt; text-align: center; margin: 0 0 4px; font-weight: normal; }
      .center { text-align: center; }
      .intro { margin: 10px 0 14px; font-size: 9.5pt; }
      table { width: 100%; border-collapse: collapse; }
      table.recon { table-layout: fixed; }
      table.recon th, table.recon td { border: 1px solid #000; padding: 3px 5px; font-size: 8.5pt; vertical-align: top; }
      table.recon th { background: #f0f0f0; font-weight: bold; text-align: center; }
      .col-date { width: 7%; }
      .col-doc { width: 21%; }
      .col-money { width: 11%; text-align: right; }
      .row-section { background: #f7f7f7; font-weight: bold; }
      .row-section td { padding: 4px 5px; }
      .totals td { font-weight: bold; background: #fafafa; }
      .summary { margin-top: 14px; display: flex; gap: 24px; }
      .summary > div { flex: 1; font-size: 9pt; }
      .signatures { display: flex; gap: 24px; margin-top: 30px; page-break-inside: avoid; }
      .signature-block { flex: 1; position: relative; padding-bottom: 30px; min-height: 130px; }
      .signature-line { border-bottom: 1px solid #000; margin-top: 60px; padding-bottom: 2px; position: relative; min-height: 0; }
      .signature-img { position: absolute; height: 44px; bottom: 2px; left: 80px; }
      .stamp-img { position: absolute; height: 95px; opacity: 0.9; bottom: -10px; left: 0; }
      p { margin: 3px 0; }
      @media print {
        body { padding: 6mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  `;

  const ourSide = (r: ReconciliationRow) => `
    <tr>
      <td class="col-date">${fmtDateShort(r.date)}</td>
      <td class="col-doc">${(r.doc || "").replace(/</g, "&lt;")}</td>
      <td class="col-money">${fmtMoney(r.debit || 0)}</td>
      <td class="col-money">${fmtMoney(r.credit || 0)}</td>
    </tr>
  `;
  // Зеркало для контрагента: дебет ↔ кредит
  const theirSide = (r: ReconciliationRow) => `
      <td class="col-date">${fmtDateShort(r.date)}</td>
      <td class="col-doc">${(r.doc || "").replace(/</g, "&lt;")}</td>
      <td class="col-money">${fmtMoney(r.credit || 0)}</td>
      <td class="col-money">${fmtMoney(r.debit || 0)}</td>
  `;

  // Combine рядом — у нас две таблицы рядом
  const rowsHtml = rows.map((r) => `
    <tr>
      <td class="col-date">${fmtDateShort(r.date)}</td>
      <td class="col-doc">${(r.doc || "").replace(/</g, "&lt;")}</td>
      <td class="col-money">${fmtMoney(r.debit || 0)}</td>
      <td class="col-money">${fmtMoney(r.credit || 0)}</td>
      <td class="col-date">${fmtDateShort(r.date)}</td>
      <td class="col-doc">${(r.doc || "").replace(/</g, "&lt;")}</td>
      <td class="col-money">${fmtMoney(r.credit || 0)}</td>
      <td class="col-money">${fmtMoney(r.debit || 0)}</td>
    </tr>
  `).join("");

  const conclusion = finalBalance === 0
    ? `на ${fmtDateLong(data.periodTo)} задолженность отсутствует.`
    : `на ${fmtDateLong(data.periodTo)} задолженность в пользу ${debtor} <strong>${fmtMoney(debtAmount)} руб.</strong> (${moneyToWords(debtAmount)}).`;

  const ourName = c.company_short_name || c.company_name;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Акт сверки №${num}</title>${styles}</head><body>
    <h1>Акт сверки №${num}</h1>
    <h2>взаимных расчётов за период: ${fmtPeriod(data.periodFrom)} — ${fmtPeriod(data.periodTo)}</h2>
    <h2>между ${ourName}${c.company_inn ? ` (ИНН ${c.company_inn})` : ""}</h2>
    <h2>и ${cl.name}${cl.inn ? ` (ИНН ${cl.inn})` : ""}</h2>

    <p class="intro">Мы, нижеподписавшиеся, ${c.company_director_post || "Директор"} ${ourName} ${c.company_director_name || ""}, с одной стороны, и ${cl.name}, с другой стороны, составили настоящий акт сверки в том, что состояние взаимных расчётов по данным учёта следующее:</p>

    <table class="recon">
      <thead>
        <tr>
          <th colspan="4">По данным ${ourName}, руб.</th>
          <th colspan="4">По данным ${cl.name}, руб.</th>
        </tr>
        <tr>
          <th>Дата</th><th>Документ</th><th>Дебет</th><th>Кредит</th>
          <th>Дата</th><th>Документ</th><th>Дебет</th><th>Кредит</th>
        </tr>
      </thead>
      <tbody>
        <tr class="row-section">
          <td colspan="4">Сальдо начальное${opening ? ` (${opening > 0 ? "в пользу " + ourName : "в пользу " + cl.name}): ${fmtMoney(Math.abs(opening))}` : ""}</td>
          <td colspan="4">Сальдо начальное${opening ? ` (${opening > 0 ? "в пользу " + ourName : "в пользу " + cl.name}): ${fmtMoney(Math.abs(opening))}` : ""}</td>
        </tr>
        ${rowsHtml || `<tr><td colspan="8" style="text-align:center;color:#888;padding:8px;">Нет операций за период</td></tr>`}
        <tr class="totals">
          <td colspan="2" style="text-align:right;">Обороты за период</td>
          <td class="col-money">${fmtMoney(totalDebit)}</td>
          <td class="col-money">${fmtMoney(totalCredit)}</td>
          <td colspan="2" style="text-align:right;">Обороты за период</td>
          <td class="col-money">${fmtMoney(totalCredit)}</td>
          <td class="col-money">${fmtMoney(totalDebit)}</td>
        </tr>
        <tr class="totals">
          <td colspan="2" style="text-align:right;">Сальдо конечное</td>
          <td class="col-money">${finalBalance > 0 ? fmtMoney(finalBalance) : ""}</td>
          <td class="col-money">${finalBalance < 0 ? fmtMoney(-finalBalance) : ""}</td>
          <td colspan="2" style="text-align:right;">Сальдо конечное</td>
          <td class="col-money">${finalBalance < 0 ? fmtMoney(-finalBalance) : ""}</td>
          <td class="col-money">${finalBalance > 0 ? fmtMoney(finalBalance) : ""}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary">
      <div>
        <p><strong>По данным ${ourName}</strong></p>
        <p>${conclusion}</p>
      </div>
      <div>
        <p><strong>По данным ${cl.name}</strong></p>
        <p>${conclusion}</p>
      </div>
    </div>

    <div class="signatures">
      <div class="signature-block">
        <p><strong>От ${ourName}</strong></p>
        <p>${c.company_director_post || "Директор"}</p>
        <div class="signature-line">
          __________ / ${c.company_director_name || ""} /
          <img class="signature-img" src="${typeof window !== "undefined" ? window.location.origin : ""}/images/signature.png" />
        </div>
        <img class="stamp-img" src="${typeof window !== "undefined" ? window.location.origin : ""}/images/stamp.png" />
        <p style="margin-top:6px;">М.П.</p>
      </div>
      <div class="signature-block">
        <p><strong>От ${cl.name}</strong></p>
        <p>${cl.director_post || "Директор"}</p>
        <div class="signature-line">__________ / ${cl.director_name || "_______________________"} /</div>
        <p style="margin-top:6px;">М.П.</p>
      </div>
    </div>
  </body></html>`;
}