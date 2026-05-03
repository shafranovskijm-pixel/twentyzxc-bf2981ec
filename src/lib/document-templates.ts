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
  // invoice discount
  discountAmount?: number;
  discountDeadline?: string;
}

function formatMoney(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function totalSum(services: ServiceItem[]): number {
  return services.reduce((s, i) => s + i.qty * i.price, 0);
}

function isFeminineName(fullName: string): boolean {
  if (!fullName) return false;
  const parts = fullName.trim().split(/\s+/);
  const patronymic = parts.length >= 3 ? parts[2] : parts.length >= 2 ? parts[1] : "";
  if (patronymic.endsWith("вна") || patronymic.endsWith("чна") || patronymic.endsWith("шна")) return true;
  const lastName = parts[0] || "";
  if (lastName.endsWith("ва") || lastName.endsWith("на") || lastName.endsWith("ая") || lastName.endsWith("яя")) return true;
  return false;
}

function toGenitive(word: string, feminine: boolean): string {
  if (!word) return word;
  // Common title patterns
  const lw = word.toLowerCase();
  if (lw === "директор") return feminine ? "Директора" : "Директора";
  if (lw === "генеральный") return "Генерального";
  // For names: apply basic Russian declension rules
  if (feminine) {
    // Feminine last names: -ова → -овой, -ева → -евой, -ина → -иной, -ая → -ой, -яя → -ей
    if (word.endsWith("ова")) return word.slice(0, -1) + "ой";
    if (word.endsWith("ева")) return word.slice(0, -1) + "ой";
    if (word.endsWith("ёва")) return word.slice(0, -1) + "ой";
    if (word.endsWith("ина")) return word.slice(0, -1) + "ой";
    if (word.endsWith("ская")) return word.slice(0, -2) + "ой";
    if (word.endsWith("цкая")) return word.slice(0, -2) + "ой";
    // Feminine first names: -а → -ы (after г,к,х → -и), -я → -и, -ия → -ии
    if (word.endsWith("ия")) return word.slice(0, -1) + "и";
    if (word.endsWith("ья")) return word.slice(0, -1) + "и";
    if (word.endsWith("я")) return word.slice(0, -1) + "и";
    if (word.endsWith("а")) {
      const beforeA = word.slice(-2, -1);
      if ("гкх".includes(beforeA)) return word.slice(0, -1) + "и";
      if ("жшщч".includes(beforeA)) return word.slice(0, -1) + "и";
      return word.slice(0, -1) + "ы";
    }
    // Feminine patronymic: -вна → -вны
    if (word.endsWith("вна")) return word.slice(0, -1) + "ы";
    if (word.endsWith("чна")) return word.slice(0, -1) + "ы";
  } else {
    // Masculine last names: -ов → -ова, -ев → -ева, -ин → -ина, -ский → -ского
    if (word.endsWith("ов") || word.endsWith("ев") || word.endsWith("ёв")) return word + "а";
    if (word.endsWith("ин") && word.length > 3) return word + "а";
    if (word.endsWith("ский")) return word.slice(0, -2) + "ого";
    if (word.endsWith("цкий")) return word.slice(0, -2) + "ого";
    // Masculine first names: consonant → +а, -й → -я, -ь → -я
    if (word.endsWith("й")) return word.slice(0, -1) + "я";
    if (word.endsWith("ь")) return word.slice(0, -1) + "я";
    // Masculine patronymic: -вич → -вича
    if (word.endsWith("вич") || word.endsWith("мич") || word.endsWith("ич")) return word + "а";
    // Default for masculine: add -а
    const lastChar = word.slice(-1).toLowerCase();
    if (!"аеёиоуыэюя".includes(lastChar)) return word + "а";
  }
  return word;
}

function declineFullName(fullName: string): string {
  if (!fullName) return fullName;
  const feminine = isFeminineName(fullName);
  const parts = fullName.trim().split(/\s+/);
  return parts.map(p => toGenitive(p, feminine)).join(" ");
}

function declinePost(post: string): string {
  if (!post) return post;
  // Handle multi-word posts like "Генеральный директор"
  return post.split(/\s+/).map(w => {
    const lw = w.toLowerCase();
    if (lw === "директор") return w[0] === w[0].toUpperCase() ? "Директора" : "директора";
    if (lw === "генеральный") return w[0] === w[0].toUpperCase() ? "Генерального" : "генерального";
    if (lw === "заместитель") return w[0] === w[0].toUpperCase() ? "Заместителя" : "заместителя";
    if (lw === "президент") return w[0] === w[0].toUpperCase() ? "Президента" : "президента";
    if (lw === "управляющий") return w[0] === w[0].toUpperCase() ? "Управляющего" : "управляющего";
    if (lw === "председатель") return w[0] === w[0].toUpperCase() ? "Председателя" : "председателя";
    return w;
  }).join(" ");
}

function getActingPhrase(directorName: string): string {
  return isFeminineName(directorName) ? "действующей" : "действующего";
}

const baseStyles = `
  <style>
    @page { size: A4; margin: 10mm; }
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
    .signature-block { width: 45%; position: relative; padding-bottom: 40px; }
    .signature-line { border-bottom: 1px solid #000; margin-top: 70px; padding-bottom: 2px; position: relative; min-height: 0; }
    .signature-img { position: absolute; height: 48px; bottom: 2px; left: 80px; }
    .stamp-img { position: absolute; height: 100px; opacity: 0.9; bottom: -10px; left: 0; }
    .bank-header { border: 2px solid #000; margin-bottom: 20px; }
    .bank-header td { padding: 4px 8px; border: 1px solid #000; font-size: 10pt; }
    p { margin: 5px 0; }
    @media print {
      body { padding: 10mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
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
      <span>г. Владивосток</span>
      <span>${date}</span>
    </div>
    <div class="section">
      <p><strong>${c.company_short_name || c.company_name}</strong>, ИНН ${c.company_inn}, именуемое в дальнейшем «Исполнитель», с одной стороны, и</p>
      <p><strong>${cl.name}</strong>, ИНН ${cl.inn}${cl.kpp ? `, КПП ${cl.kpp}` : ""}, в лице ${declinePost(cl.director_post || "Директор")} ${declineFullName(cl.director_name)}, ${getActingPhrase(cl.director_name)} на основании Устава, именуемое в дальнейшем «Заказчик», с другой стороны,</p>
      <p>заключили настоящий Договор о нижеследующем:</p>
    </div>
    <div class="section">
      <h2>1. ПРЕДМЕТ ДОГОВОРА</h2>
      <p>1.1. Исполнитель обязуется оказать Заказчику следующие услуги${data.subject ? `: ${data.subject}` : ""}:</p>
      ${servicesTableHtml(services)}
      <p style="margin-top:10px;">1.2. Общая стоимость услуг по настоящему Договору составляет <strong>${formatMoney(total)} руб.</strong></p>
      ${data.discountAmount && data.discountDeadline ? `<p style="margin-top:10px;font-size:11pt;"><strong>При оплате до ${data.discountDeadline} сумма составляет ${formatMoney(total - data.discountAmount)} руб.</strong> (скидка ${formatMoney(data.discountAmount)} руб.)</p>` : data.discountAmount ? `<p style="margin-top:10px;font-size:11pt;"><strong>Сумма со скидкой: ${formatMoney(total - data.discountAmount)} руб.</strong> (скидка ${formatMoney(data.discountAmount)} руб.)</p>` : ''}
    </div>
    <div class="section">
      <h2>2. СРОКИ И ПОРЯДОК ОПЛАТЫ</h2>
      <p>2.1. ${data.paymentTerms || "Оплата производится в размере 100% на основании выставленного счёта."}</p>
      <p>2.2. ${data.deadline ? `Срок выполнения работ: ${data.deadline}.` : "Срок выполнения работ определяется по согласованию сторон."}</p>
    </div>
    <div class="section">
      <h2>3. ПРАВА И ОБЯЗАННОСТИ СТОРОН</h2>
      <p><strong>3.1. Исполнитель обязан:</strong></p>
      <p>3.1.1. Оказать услуги надлежащего качества.</p>
      <p>3.1.2. Оказать услуги в полном объёме.</p>
      <p>3.1.3. Безвозмездно исправить по требованию Заказчика все выявленные недостатки, если в процессе оказания услуг Исполнитель допустил отступление от условий Договора, ухудшившее качество работы.</p>
      <p>3.1.4. Выполнить работу лично или с привлечением третьих лиц.</p>
      <p style="margin-top:10px;"><strong>3.2. Заказчик обязан:</strong></p>
      <p>3.2.1. Оплатить услуги по цене, указанной в п. 2.1. настоящего Договора.</p>
      <p>3.3. Предоставить Исполнителю необходимую информацию для размещения на сайте (реквизиты компании, товарные позиции, информацию об услугах, логотип, фото, характеристики, стоимость, описание) если есть.</p>
      <p style="margin-top:10px;"><strong>3.4. Заказчик имеет право:</strong></p>
      <p>3.4.1. Во всякое время проверять ход и качество работы, выполняемой Исполнителем, не вмешиваясь в его деятельность.</p>
      <p>3.4.2. Отказаться от исполнения Договора в любое время до подписания акта сдачи-приёмки выполненных работ (оказанных услуг), уплатив Исполнителю часть установленной цены пропорционально части оказанных услуг, выполненной до получения извещения об отказе Заказчика от исполнения договора.</p>
    </div>
    <div class="section">
      <h2>4. ОТВЕТСТВЕННОСТЬ СТОРОН</h2>
      <p>4.1. За неисполнение, либо ненадлежащее исполнение договорных обязательств, Стороны несут имущественную ответственность в порядке и на условиях, предусмотренных действующим законодательством РФ.</p>
    </div>
    <div class="section">
      <h2>5. ПОРЯДОК РАЗРЕШЕНИЯ СПОРОВ</h2>
      <p>5.1. Споры и разногласия, которые могут возникнуть при исполнении настоящего Договора, будут по возможности разрешаться путём переговоров между Сторонами.</p>
      <p>5.2. В случае невозможности разрешения разногласий путём переговоров они подлежат рассмотрению в арбитражном суде согласно порядку, установленному законодательством Российской Федерации.</p>
    </div>
    <div class="section">
      <h2>6. СРОК ДЕЙСТВИЯ ДОГОВОРА И ПОРЯДОК ЕГО ИЗМЕНЕНИЯ</h2>
      <p>6.1. Договор вступает в силу с момента его подписания и действует до полного исполнения сторонами своих обязательств.</p>
      <p>6.2. Любые изменения и дополнения к настоящему Договору имеют силу только в том случае, если они оформлены в письменном виде и подписаны обеими Сторонами.</p>
      <p>6.3. Заказчик вправе в одностороннем порядке отказаться от исполнения настоящего Договора при условии оплаты Исполнителю фактически понесённых им расходов.</p>
      <p>6.4. Исполнитель вправе в одностороннем порядке отказаться от исполнения настоящего Договора лишь при условии полного возмещения Заказчику убытков.</p>
      <p>6.5. Сторона, решившая расторгнуть настоящий Договор, должна направить письменное уведомление о намерении расторгнуть настоящий Договор другой Стороне не позднее чем за 10 дней до предполагаемого дня расторжения настоящего Договора.</p>
      <p>6.6. Стороны осуществляют документооборот посредством установленным действующим законодательством Российской Федерации, в частности, через электронный документооборот с использованием усиленной квалифицированной электронной подписи и систем электронного документооборота.</p>
      <p>6.7. Вопросы, не урегулированные настоящим Договором, разрешаются в соответствии с действующим законодательством Российской Федерации.</p>
    </div>
    <div class="section">
      <h2>7. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</h2>
      <div class="signatures">
        <div class="signature-block">
          <p><strong>Исполнитель:</strong></p>
          <p>${c.company_name}</p>
          <p>ИНН ${c.company_inn}${c.company_kpp ? ` КПП ${c.company_kpp}` : ""}</p>
          <p>${c.company_legal_address}</p>
          <p>р/с ${c.company_bank_account}</p>
          <p>${c.company_bank_name}</p>
          <p>БИК ${c.company_bank_bik} к/с ${c.company_bank_corr}</p>
          <div class="signature-line">
            ${c.company_director_post} __________ / ${c.company_director_name} /
            <img class="signature-img" src="${window.location.origin}/images/signature.png" />
          </div>
          <img class="stamp-img" src="${window.location.origin}/images/stamp.png" />
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
      ${data.discountAmount ? `
        <p style="margin-top:12px;"><strong>Итого к оплате: ${formatMoney(total - data.discountAmount)} руб.</strong></p>
        <p style="font-size:10pt;color:#555;margin-top:3px;">${data.discountDeadline ? `При оплате до ${data.discountDeadline} (скидка ${formatMoney(data.discountAmount)} руб.)` : `Скидка ${formatMoney(data.discountAmount)} руб.`}</p>
      ` : ''}
    </div>
    <div class="signatures">
      <div class="signature-block">
        <div class="signature-line">
          ${c.company_director_post} __________ / ${c.company_director_name} /
          <img class="signature-img" src="${window.location.origin}/images/signature.png" />
        </div>
        <img class="stamp-img" src="${window.location.origin}/images/stamp.png" />
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
      <span>г. Владивосток</span>
      <span>${date}</span>
    </div>
    ${data.contractNumber ? `<p class="section">К Договору №${data.contractNumber}${data.contractDate ? ` от ${data.contractDate}` : ""}</p>` : ""}
    <div class="section">
      <p><strong>${c.company_short_name || c.company_name}</strong>, именуемое в дальнейшем «Исполнитель», с одной стороны, и</p>
      <p><strong>${cl.name}</strong>, именуемое в дальнейшем «Заказчик», в лице ${declinePost(cl.director_post || "Директор")} ${declineFullName(cl.director_name)}, ${getActingPhrase(cl.director_name)} на основании Устава, с другой стороны,</p>
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
        <div class="signature-line">
          ${c.company_director_post} __________ / ${c.company_director_name} /
          <img class="signature-img" src="${window.location.origin}/images/signature.png" />
        </div>
        <img class="stamp-img" src="${window.location.origin}/images/stamp.png" />
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
  // Try window.open first, fallback to blob download if blocked (e.g. in iframe)
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  } else {
    // Fallback: create a blob and open it as a downloadable HTML file
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
