export interface CompanyRequisites {
  company_name: string;
  company_short_name: string;
  company_inn: string;
  company_kpp: string;
  company_ogrn: string;
  company_legal_address: string;
  company_actual_address: string;
  company_bank_account: string;
  company_bank_bik: string;
  company_bank_corr: string;
  company_bank_name: string;
  company_director_name: string;
  company_director_post: string;
  company_phone: string;
  company_email: string;
}

export interface ClientRequisites {
  name: string;
  inn: string;
  kpp: string;
  ogrn: string;
  address: string;
  director_name: string;
  director_post: string;
}

export interface ServiceItem {
  name: string;
  qty: number;
  price: number;
}

export interface DocumentData {
  type: "contract" | "invoice" | "act";
  number: string;
  date: string;
  company: CompanyRequisites;
  client: ClientRequisites;
  services: ServiceItem[];
  // contract-specific
  subject?: string;
  deadline?: string;
  paymentTerms?: string;
  // act-specific
  contractNumber?: string;
  contractDate?: string;
}

function formatMoney(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function totalSum(services: ServiceItem[]): number {
  return services.reduce((s, i) => s + i.qty * i.price, 0);
}

const baseStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.4; color: #000; padding: 20mm; }
    table { width: 100%; border-collapse: collapse; }
    .services-table th, .services-table td { border: 1px solid #000; padding: 4px 8px; text-align: left; font-size: 11pt; }
    .services-table th { background: #f0f0f0; font-weight: bold; text-align: center; }
    .services-table td.num { text-align: center; }
    .services-table td.money { text-align: right; }
    h1 { font-size: 14pt; text-align: center; margin: 20px 0; }
    h2 { font-size: 12pt; text-align: center; margin: 15px 0; }
    .header-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .section { margin: 15px 0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
    .signature-block { width: 45%; }
    .signature-line { border-bottom: 1px solid #000; margin-top: 40px; padding-bottom: 2px; }
    .bank-header { border: 2px solid #000; margin-bottom: 20px; }
    .bank-header td { padding: 4px 8px; border: 1px solid #000; font-size: 10pt; }
    p { margin: 5px 0; }
    @media print { body { padding: 10mm; } }
  </style>
`;

function servicesTableHtml(services: ServiceItem[]): string {
  const total = totalSum(services);
  return `
    <table class="services-table">
      <thead>
        <tr>
          <th style="width:5%">№</th>
          <th>Наименование</th>
          <th style="width:8%">Кол-во</th>
          <th style="width:12%">Ед.</th>
          <th style="width:15%">Цена, руб.</th>
          <th style="width:15%">Сумма, руб.</th>
        </tr>
      </thead>
      <tbody>
        ${services.map((s, i) => `
          <tr>
            <td class="num">${i + 1}</td>
            <td>${s.name}</td>
            <td class="num">${s.qty}</td>
            <td class="num">шт.</td>
            <td class="money">${formatMoney(s.price)}</td>
            <td class="money">${formatMoney(s.qty * s.price)}</td>
          </tr>
        `).join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="5" style="text-align:right;font-weight:bold;border:none;">Итого:</td>
          <td class="money" style="font-weight:bold;">${formatMoney(total)}</td>
        </tr>
        <tr>
          <td colspan="5" style="text-align:right;border:none;">Без НДС</td>
          <td class="money" style="border-left:1px solid #000;">—</td>
        </tr>
      </tfoot>
    </table>
  `;
}

export function generateContractHtml(data: DocumentData): string {
  const { company: c, client: cl, services, number: num, date } = data;
  const total = totalSum(services);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Договор №${num}</title>${baseStyles}</head><body>
    <h1>ДОГОВОР №${num}</h1>
    <div class="header-row">
      <span>г. Москва</span>
      <span>${date}</span>
    </div>
    <div class="section">
      <p><strong>${c.company_short_name || c.company_name}</strong>, ИНН ${c.company_inn}, в лице ${c.company_director_post} ${c.company_director_name}, действующего на основании Устава, именуемое в дальнейшем «Исполнитель», с одной стороны, и</p>
      <p><strong>${cl.name}</strong>, ИНН ${cl.inn}${cl.kpp ? `, КПП ${cl.kpp}` : ""}, в лице ${cl.director_post || "Директора"} ${cl.director_name}, именуемое в дальнейшем «Заказчик», с другой стороны,</p>
      <p>заключили настоящий Договор о нижеследующем:</p>
    </div>
    <div class="section">
      <h2>1. ПРЕДМЕТ ДОГОВОРА</h2>
      <p>1.1. Исполнитель обязуется оказать Заказчику следующие услуги${data.subject ? `: ${data.subject}` : ""}:</p>
      ${servicesTableHtml(services)}
      <p style="margin-top:10px;">1.2. Общая стоимость услуг по настоящему Договору составляет <strong>${formatMoney(total)} руб.</strong></p>
    </div>
    <div class="section">
      <h2>2. СРОКИ И ПОРЯДОК ОПЛАТЫ</h2>
      <p>2.1. ${data.paymentTerms || "Оплата производится в размере 100% на основании выставленного счёта."}</p>
      <p>2.2. ${data.deadline ? `Срок выполнения работ: ${data.deadline}.` : "Срок выполнения работ определяется по согласованию сторон."}</p>
    </div>
    <div class="section">
      <h2>3. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</h2>
      <div class="signatures">
        <div class="signature-block">
          <p><strong>Исполнитель:</strong></p>
          <p>${c.company_name}</p>
          <p>ИНН ${c.company_inn}${c.company_kpp ? ` КПП ${c.company_kpp}` : ""}</p>
          <p>${c.company_legal_address}</p>
          <p>р/с ${c.company_bank_account}</p>
          <p>${c.company_bank_name}</p>
          <p>БИК ${c.company_bank_bik} к/с ${c.company_bank_corr}</p>
          <div class="signature-line">${c.company_director_post} __________ / ${c.company_director_name} /</div>
        </div>
        <div class="signature-block">
          <p><strong>Заказчик:</strong></p>
          <p>${cl.name}</p>
          <p>ИНН ${cl.inn}${cl.kpp ? ` КПП ${cl.kpp}` : ""}</p>
          <p>${cl.address}</p>
          <div class="signature-line">${cl.director_post || "Директор"} __________ / ${cl.director_name} /</div>
        </div>
      </div>
    </div>
  </body></html>`;
}

export function generateInvoiceHtml(data: DocumentData): string {
  const { company: c, client: cl, services, number: num, date } = data;
  const total = totalSum(services);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Счёт №${num}</title>${baseStyles}</head><body>
    <table class="bank-header">
      <tr>
        <td rowspan="2" style="width:55%;">
          <p>${c.company_bank_name}</p>
          <p>БИК ${c.company_bank_bik}</p>
        </td>
        <td style="width:15%;">БИК</td>
        <td>${c.company_bank_bik}</td>
      </tr>
      <tr>
        <td>Корр. счёт</td>
        <td>${c.company_bank_corr}</td>
      </tr>
      <tr>
        <td>
          <p>Получатель: <strong>${c.company_short_name || c.company_name}</strong></p>
          <p>ИНН ${c.company_inn}${c.company_kpp ? ` КПП ${c.company_kpp}` : ""}</p>
        </td>
        <td>Расч. счёт</td>
        <td>${c.company_bank_account}</td>
      </tr>
    </table>

    <h1>СЧЁТ НА ОПЛАТУ №${num} от ${date}</h1>
    <div class="section">
      <p><strong>Поставщик:</strong> ${c.company_name}, ИНН ${c.company_inn}${c.company_kpp ? `, КПП ${c.company_kpp}` : ""}, ${c.company_legal_address}, тел.: ${c.company_phone}</p>
      <p><strong>Покупатель:</strong> ${cl.name}, ИНН ${cl.inn}${cl.kpp ? `, КПП ${cl.kpp}` : ""}, ${cl.address}</p>
    </div>
    ${servicesTableHtml(services)}
    <div class="section" style="margin-top:20px;">
      <p><strong>Итого к оплате: ${formatMoney(total)} руб.</strong></p>
      <p style="font-size:10pt;color:#555;margin-top:5px;">Без НДС.</p>
    </div>
    <div class="signatures">
      <div class="signature-block">
        <div class="signature-line">${c.company_director_post} __________ / ${c.company_director_name} /</div>
      </div>
    </div>
  </body></html>`;
}

export function generateActHtml(data: DocumentData): string {
  const { company: c, client: cl, services, number: num, date } = data;
  const total = totalSum(services);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Акт №${num}</title>${baseStyles}</head><body>
    <h1>АКТ №${num}<br/>выполненных работ (оказанных услуг)</h1>
    <div class="header-row">
      <span>г. Москва</span>
      <span>${date}</span>
    </div>
    ${data.contractNumber ? `<p class="section">К Договору №${data.contractNumber}${data.contractDate ? ` от ${data.contractDate}` : ""}</p>` : ""}
    <div class="section">
      <p><strong>${c.company_short_name || c.company_name}</strong>, именуемое в дальнейшем «Исполнитель», в лице ${c.company_director_post} ${c.company_director_name}, с одной стороны, и</p>
      <p><strong>${cl.name}</strong>, именуемое в дальнейшем «Заказчик», в лице ${cl.director_post || "Директора"} ${cl.director_name}, с другой стороны,</p>
      <p>составили настоящий Акт о том, что Исполнитель выполнил, а Заказчик принял следующие работы (услуги):</p>
    </div>
    ${servicesTableHtml(services)}
    <div class="section" style="margin-top:15px;">
      <p>Общая стоимость выполненных работ (оказанных услуг) составляет <strong>${formatMoney(total)} руб.</strong></p>
      <p style="margin-top:10px;">Вышеперечисленные работы (услуги) выполнены полностью и в срок. Заказчик претензий по объёму, качеству и срокам оказания услуг не имеет.</p>
    </div>
    <div class="signatures">
      <div class="signature-block">
        <p><strong>Исполнитель:</strong></p>
        <p>${c.company_name}</p>
        <div class="signature-line">${c.company_director_post} __________ / ${c.company_director_name} /</div>
      </div>
      <div class="signature-block">
        <p><strong>Заказчик:</strong></p>
        <p>${cl.name}</p>
        <div class="signature-line">${cl.director_post || "Директор"} __________ / ${cl.director_name} /</div>
      </div>
    </div>
  </body></html>`;
}

export function openDocumentPrint(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
