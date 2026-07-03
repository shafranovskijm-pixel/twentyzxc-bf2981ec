import type { DocumentData } from "./document-templates";

function formatMoney(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function totalSum(services: { qty: number; price: number }[]): number {
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

function getActingPhrase(directorName: string): string {
  return isFeminineName(directorName) ? "действующей" : "действующего";
}

function declineFullName(fullName: string): string {
  if (!fullName) return fullName;
  const feminine = isFeminineName(fullName);
  const parts = fullName.trim().split(/\s+/);
  return parts.map(p => toGenitive(p, feminine)).join(" ");
}

function toGenitive(word: string, feminine: boolean): string {
  if (!word) return word;
  const lw = word.toLowerCase();
  if (lw === "директор") return "Директора";
  if (lw === "генеральный") return "Генерального";
  if (feminine) {
    if (word.endsWith("ова") || word.endsWith("ева") || word.endsWith("ёва")) return word.slice(0, -1) + "ой";
    if (word.endsWith("ина")) return word.slice(0, -1) + "ой";
    if (word.endsWith("ская") || word.endsWith("цкая")) return word.slice(0, -2) + "ой";
    if (word.endsWith("ия")) return word.slice(0, -1) + "и";
    if (word.endsWith("ья") || word.endsWith("я")) return word.slice(0, -1) + "и";
    if (word.endsWith("а")) {
      const beforeA = word.slice(-2, -1);
      if ("гкхжшщч".includes(beforeA)) return word.slice(0, -1) + "и";
      return word.slice(0, -1) + "ы";
    }
    if (word.endsWith("вна") || word.endsWith("чна")) return word.slice(0, -1) + "ы";
  } else {
    if (word.endsWith("ов") || word.endsWith("ев") || word.endsWith("ёв")) return word + "а";
    if (word.endsWith("ин") && word.length > 3) return word + "а";
    if (word.endsWith("ский") || word.endsWith("цкий")) return word.slice(0, -2) + "ого";
    if (word.endsWith("й")) return word.slice(0, -1) + "я";
    if (word.endsWith("ь")) return word.slice(0, -1) + "я";
    if (word.endsWith("вич") || word.endsWith("мич") || word.endsWith("ич")) return word + "а";
    const lastChar = word.slice(-1).toLowerCase();
    if (!"аеёиоуыэюя".includes(lastChar)) return word + "а";
  }
  return word;
}

function declinePost(post: string): string {
  if (!post) return post;
  return post.split(/\s+/).map(w => {
    const lw = w.toLowerCase();
    if (lw === "директор") return w[0] === w[0].toUpperCase() ? "Директора" : "директора";
    if (lw === "генеральный") return w[0] === w[0].toUpperCase() ? "Генерального" : "генерального";
    return w;
  }).join(" ");
}

const baseStyles = `
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 794px;
      min-height: 1123px;
      margin: 0 auto;
      padding: 44px 50px;
      font-family: Inter, Arial, sans-serif;
      font-size: 12.5px;
      line-height: 1.58;
      color: #1f2430;
      background:
        radial-gradient(circle at top left, rgba(212,190,55,.14), transparent 260px),
        linear-gradient(135deg, #fbfaf4 0%, #ffffff 42%, #f8f9fb 100%);
      position: relative;
    }
    body::before {
      content: '24ZXC';
      position: fixed;
      top: 34px;
      right: 50px;
      z-index: 0;
      width: 82px;
      height: 82px;
      border-radius: 22px;
      background: linear-gradient(135deg, #15171e 0%, #2b3142 100%);
      color: #d4be37;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: -1px;
      box-shadow: 0 14px 30px rgba(21,23,30,.18);
    }
    body::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 9px;
      height: 100%;
      background: linear-gradient(180deg, #15171e, #d4be37, #15171e);
      opacity: .95;
    }
    body > * { position: relative; z-index: 1; }
    table { width: 100%; border-collapse: collapse; }
    .services-table { margin-top: 14px; border-collapse: separate; border-spacing: 0; overflow: hidden; border-radius: 14px; border: 1px solid #e5e1c7; background: #fff; }
    .services-table th, .services-table td { border: none; border-bottom: 1px solid #ece8d2; padding: 9px 10px; text-align: left; font-size: 11px; vertical-align: top; }
    .services-table th { background: #15171e; color: #f8e670; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; text-align: center; }
    .services-table tr:last-child td { border-bottom: none; }
    .services-table tbody tr:nth-child(even) td { background: #fbfaf4; }
    .services-table td.num { text-align: center; }
    .services-table td.money { text-align: right; white-space: nowrap; }
    h1 {
      margin: 0 110px 22px 0;
      padding: 20px 22px;
      border-radius: 22px;
      background: linear-gradient(135deg, #15171e 0%, #252b3a 100%);
      color: #fff;
      font-size: 22px;
      line-height: 1.12;
      text-align: left;
      letter-spacing: -.03em;
      box-shadow: 0 16px 42px rgba(21,23,30,.12);
    }
    h1::after { content: ''; display: block; width: 72px; height: 4px; margin-top: 12px; border-radius: 999px; background: #d4be37; }
    h2 {
      margin: 20px 0 10px;
      padding: 9px 12px;
      border-left: 4px solid #d4be37;
      border-radius: 0 12px 12px 0;
      background: rgba(212,190,55,.12);
      color: #15171e;
      font-size: 13.5px;
      font-weight: 900;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: .02em;
    }
    h3 { margin: 12px 0 7px; color: #15171e; font-size: 12.5px; font-weight: 850; }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -8px 110px 18px 0;
      padding: 10px 14px;
      border: 1px solid #e9e2b3;
      border-radius: 14px;
      background: rgba(255,255,255,.78);
      color: #4a5162;
      font-weight: 800;
    }
    .section {
      margin: 12px 0;
      padding: 14px 16px;
      border: 1px solid #eee9cf;
      border-radius: 16px;
      background: rgba(255,255,255,.82);
      box-shadow: 0 8px 22px rgba(21,23,30,.04);
      break-inside: avoid;
    }
    .section:has(h2) { break-inside: auto; }
    p { margin: 5px 0; }
    .indent { text-indent: 22px; }
    ul { margin: 6px 0 6px 22px; }
    ul li { margin: 3px 0; }
    .page-break { page-break-before: always; break-before: page; padding-top: 24px; margin-top: 0; }
    .signatures { display: flex; gap: 22px; justify-content: space-between; margin-top: 22px; break-inside: avoid; page-break-inside: avoid; }
    .signature-block {
      width: 50%;
      min-height: 142px;
      position: relative;
      padding: 16px 16px 42px;
      border: 1px solid #e7dfaa;
      border-radius: 18px;
      background: linear-gradient(180deg, #fff, #fffdf2);
      overflow: visible;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .signature-line { border-bottom: 1px solid #15171e; margin-top: 58px; padding-bottom: 4px; position: relative; min-height: 26px; font-weight: 700; }
    .signature-img { position: absolute; height: 48px; bottom: 4px; left: 74px; z-index: 3; }
    .stamp-img { position: absolute; height: 94px; opacity: 0.9; bottom: 8px; left: 16px; z-index: 2; }
    strong { color: #15171e; }
    @media print {
      body { padding: 44px 50px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
      .section, .signatures, .signature-block, tr { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
`;

export function generateNmoContractHtml(data: DocumentData): string {
  const { company: c, client: cl, services, number: num, date } = data;
  const total = totalSum(services);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Договор НМО №${num}</title>${baseStyles}</head><body>
    <h1>ДОГОВОР № ${num}</h1>
    <div class="header-row">
      <span>г. Владивосток</span>
      <span>${date}</span>
    </div>
    <div class="section">
      <p class="indent"><strong>${c.company_short_name || c.company_name}</strong>, в дальнейшем именуемое Исполнитель, ИНН ${c.company_inn}, с одной стороны и ${(() => {
        const n = (cl.name || "").trim().toLowerCase();
        const ogrnDigits = (cl.ogrn || "").replace(/\D/g, "");
        const isIP = n.startsWith("ип ") || n.startsWith("индивидуальный предприниматель") || ogrnDigits.length === 15;
        if (isIP) {
          const ogrn = cl.ogrn ? `ОГРНИП ${cl.ogrn}` : "ОГРНИП";
          return `<strong>${cl.name}</strong>, именуемый в дальнейшем Заказчик, ИНН ${cl.inn}, действующий на основании ${ogrn}`;
        }
        return `<strong>${cl.name}</strong>, именуемое в дальнейшем Заказчик, в лице ${declinePost(cl.director_post || "Директор").toLowerCase()} ${declineFullName(cl.director_name)}, ${getActingPhrase(cl.director_name)} на основании Устава`;
      })()}, с другой стороны, вместе именуемые стороны, заключили настоящий Договор о нижеследующем:</p>
    </div>

    <div class="section">
      <h2>1. ПРЕДМЕТ ДОГОВОРА</h2>
      <p class="indent">1.1. Исполнитель оказывает Заказчику услуги по разработке документов для системы непрерывного медицинского образования (далее — НМО), включая подготовку учебно-методических материалов, программ повышения квалификации, формирование пакетов документов для аккредитации образовательных программ и сопровождение процедуры размещения на портале НМО (далее — услуги), а Заказчик обязуется принять и оплатить данные услуги.</p>
      <p class="indent">1.2. Оказание услуг осуществляется на основании заявления Заказчика и в соответствии со спецификацией (Приложение №1 к настоящему договору).</p>
    </div>

    <div class="section">
      <h2>2. ОБЯЗАННОСТИ СТОРОН</h2>
      <p><strong>2.1. Исполнитель обязуется:</strong></p>
      <p class="indent">2.1.1. Разработать документы для НМО в соответствии с требованиями Министерства здравоохранения Российской Федерации и Координационного совета по развитию непрерывного медицинского и фармацевтического образования;</p>
      <p class="indent">2.1.2. Подготовить учебно-методические материалы, программы повышения квалификации и иные документы, необходимые для размещения на портале НМО;</p>
      <p class="indent">2.1.3. Обеспечить информационно-консультационную поддержку Заказчика по вопросам оформления и подачи документов в систему НМО;</p>
      <p class="indent">2.1.4. Осуществить сопровождение процедуры размещения образовательных программ на портале НМО;</p>
      <p class="indent">2.1.5. Соблюдать конфиденциальность персональных данных и обеспечивать безопасность персональных данных при их обработке;</p>
      <p class="indent">2.1.6. Произвести уничтожение исходных файлов заказчика в срок, не превышающий 30 рабочих дней, с даты окончания срока действия настоящего договора.</p>
      <p style="margin-top:10px;"><strong>2.2. Заказчик обязуется:</strong></p>
      <p class="indent">2.2.1. Обеспечить достоверность предоставляемой Исполнителю информации;</p>
      <p class="indent">2.2.2. Предоставить Исполнителю все необходимые данные, документы и материалы для разработки документов НМО;</p>
      <p class="indent">2.2.3. Произвести оплату на согласованных настоящим договором условиях;</p>
      <p class="indent">2.2.4. Своевременно согласовывать разработанные Исполнителем документы и предоставлять замечания в письменной форме.</p>
    </div>

    <div class="section">
      <h2>3. СТОИМОСТЬ УСЛУГ И ПОРЯДОК РАСЧЕТОВ</h2>
      <p class="indent">3.1. Сумма оплаты по договору определяется в соответствии со спецификацией (Приложение № 1 к настоящему Договору), которая является неотъемлемой частью Договора и составляет <strong>${formatMoney(total)}</strong> рублей, НДС не облагается (НПД).</p>
      ${data.discountAmount && data.discountDeadline ? `<p class="indent"><strong>При оплате до ${data.discountDeadline} сумма составляет ${formatMoney(total - data.discountAmount)} руб.</strong> (скидка ${formatMoney(data.discountAmount)} руб.)</p>` : data.discountAmount ? `<p class="indent"><strong>Сумма со скидкой: ${formatMoney(total - data.discountAmount)} руб.</strong> (скидка ${formatMoney(data.discountAmount)} руб.)</p>` : ''}
      <p class="indent">3.2. Заказчик оплачивает услуги, указанные в приложении №1, ${data.paymentTerms || "авансом в размере 100%"} на основании счета, выставленного Исполнителем, не позднее 5 (пяти) банковских дней после выставления счета.</p>
      <p class="indent">3.3. Обязательства Заказчика по оплате считаются исполненными в момент поступления денежных средств на расчетный счет Исполнителя.</p>
    </div>

    <div class="section">
      <h2>4. ПОРЯДОК СДАЧИ И ПРИЕМКИ УСЛУГ</h2>
      <p class="indent">4.1. Разработка документов осуществляется Исполнителем в сроки, согласованные сторонами.</p>
      <p class="indent">4.2. По завершении оказания услуг Заказчику предоставляются готовые документы для НМО в электронном виде, а также подтверждение размещения на портале НМО (при наличии соответствующей услуги в спецификации).</p>
      <p class="indent">4.3. Заказчик обязан в течение 5 (пяти) рабочих дней с момента получения результата услуг принять выполненную работу или направить Исполнителю мотивированный отказ.</p>
    </div>

    <div class="section">
      <h2>5. КАЧЕСТВО УСЛУГ</h2>
      <p class="indent">5.1. Качество услуг, оказываемых по настоящему Договору, должно соответствовать требованиям Министерства здравоохранения Российской Федерации, действующим нормативным актам в сфере непрерывного медицинского образования, а также стандартам и техническим условиям, действующим в Российской Федерации.</p>
    </div>

    <div class="section">
      <h2>6. КОНФИДЕНЦИАЛЬНОСТЬ</h2>
      <p class="indent">6.1. Каждая сторона соглашается сохранять конфиденциальность всей технической, производственной, деловой, финансовой и другой информации, относящейся к деятельности другой стороны.</p>
      <p class="indent">6.2. Каждая сторона должна в любое время охранять конфиденциальную информацию другой стороны и соглашается не раскрывать, не сообщать, не передавать и не предоставлять никаким другим образом любую конфиденциальную информацию полностью либо частично любой третьей стороне.</p>
      <p class="indent">6.3. Положения о конфиденциальности будут оставаться в силе в течение 5 (пяти) лет после прекращения действия настоящего Договора.</p>
    </div>

    <div class="section">
      <h2>7. ОТВЕТСТВЕННОСТЬ СТОРОН</h2>
      <p class="indent">7.1. Исполнитель не отвечает за убытки, возникшие у Заказчика, если убытки возникли:</p>
      <ul>
        <li>не по вине Исполнителя;</li>
        <li>вследствие неправомерных действий государственных органов и/или третьих лиц или вследствие действия форс-мажорных обстоятельств;</li>
        <li>в случае неисполнения или ненадлежащего исполнения Заказчиком письменных рекомендаций Исполнителя;</li>
        <li>в случае если убытки возникли в результате непредоставления Заказчиком необходимой информации или материалов.</li>
      </ul>
      <p class="indent">7.2. Все иные вопросы ответственности сторон регламентируются нормами действующего законодательства Российской Федерации.</p>
      <p class="indent">7.3. Стороны освобождаются от ответственности по настоящему Договору в случае возникновения обстоятельств непреодолимой силы.</p>
    </div>

    <div class="section">
      <h2>8. ПОРЯДОК ВНЕСЕНИЯ ИЗМЕНЕНИЙ В ДОГОВОР</h2>
      <p class="indent">8.1. Внесение изменений в настоящий Договор оформляется в виде дополнительного соглашения, подписываемого сторонами.</p>
      <p class="indent">8.2. Изменения и дополнения, вносимые в договор, являются обязательными для исполнения сторонами.</p>
    </div>

    <div class="section">
      <h2>9. ПОРЯДОК РАСТОРЖЕНИЯ ДОГОВОРА</h2>
      <p class="indent">9.1. В случае если у Заказчика возникнут обоснованные претензии к исполнению обязательств по Договору Исполнителем, Заказчик вправе расторгнуть Договор в следующем порядке:</p>
      <ul>
        <li>Заказчик составляет письменную претензию и направляет её Исполнителю. Срок рассмотрения претензии — 10 (десять) рабочих дней;</li>
        <li>в случае признания претензии Заказчика обоснованной, стороны расторгают Договор, и Исполнитель возвращает сумму денежных средств, перечисленных Заказчиком за услуги, к исполнению которых у Заказчика возникли претензии.</li>
      </ul>
      <p class="indent">9.2. При расторжении договора по инициативе Заказчика в случае, если не возникает обоснованных претензий к исполнению обязательств по договору Исполнителем, стоимость оплаченных услуг не возвращается.</p>
    </div>

    <div class="section">
      <h2>10. СРОК ДЕЙСТВИЯ ДОГОВОРА</h2>
      <p class="indent">10.1. Договор вступает в силу с момента подписания Договора и действует до исполнения сторонами своих обязанностей. Договор может быть пролонгирован по соглашению сторон и на основании предоплаченного заказчиком счета оферты.</p>
    </div>

    <div class="section">
      <h2>11. ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ</h2>
      <p class="indent">11.1. Правоотношения, не урегулированные настоящим Договором, регулируются в соответствии с действующим законодательством Российской Федерации.</p>
      <p class="indent">11.2. Споры и разногласия, возникающие в процессе исполнения Договора, разрешаются сторонами с соблюдением досудебного порядка разрешения споров. Если стороны не приходят к единому мнению, дело передается на рассмотрение суда по месту нахождения ответчика.</p>
    </div>

    <div class="signatures">
      <div class="signature-block">
        <p><strong>Исполнитель:</strong></p>
        <p>${c.company_name}</p>
        <p>ИНН ${c.company_inn}${c.company_ogrn ? ` ОГРНИП ${c.company_ogrn}` : ""}</p>
        <p>${c.company_bank_name}</p>
        <p>БИК ${c.company_bank_bik}</p>
        <p>р/с ${c.company_bank_account}</p>
        <div class="signature-line">
          / ${c.company_director_name} /
          <img class="signature-img" src="${window.location.origin}/images/signature.png" />
        </div>
        <img class="stamp-img" src="${window.location.origin}/images/stamp.png" />
      </div>
      <div class="signature-block">
        <p><strong>Заказчик:</strong></p>
        <p>${cl.name}</p>
        <p>${cl.address}</p>
        ${(() => {
          const ogrnDigits = (cl.ogrn || "").replace(/\D/g, "");
          const isIP = (cl.name || "").trim().toLowerCase().startsWith("ип ") || ogrnDigits.length === 15;
          if (isIP) {
            return `<p>ИНН ${cl.inn}${cl.ogrn ? ` ОГРНИП ${cl.ogrn}` : ""}</p>
        <div class="signature-line">ИП __________ / ${cl.director_name || cl.name.replace(/^ИП\s+/i, "")} /</div>`;
          }
          return `<p>ИНН${cl.inn ? "/" : ""}${cl.inn}${cl.kpp ? ` КПП ${cl.kpp}` : ""}${cl.ogrn ? ` ОГРН ${cl.ogrn}` : ""}</p>
        <div class="signature-line">${cl.director_post || "Директор"} __________ / ${cl.director_name} /</div>`;
        })()}
        <p style="margin-top:5px;">М.П.</p>
      </div>
    </div>

    <!-- Приложение 1 — Спецификация -->
    <div class="page-break">
      <p style="text-align:right;">Приложение №1 к договору №${num} от ${date}</p>
      <h1>Спецификация № 1</h1>
      <p>Наименование Заказчика: ${cl.name}</p>
      <p>Период оказания услуг: <strong>${data.deadline || "12 месяцев с момента подписания договора"}</strong></p>
      <table class="services-table" style="margin-top:15px;">
        <thead>
          <tr>
            <th>Наименование предоставляемого права, услуги</th>
            <th style="width:8%">Ед. изм.</th>
            <th style="width:8%">Кол-во</th>
            <th style="width:12%">Цена (в руб.)</th>
            <th style="width:12%">Сумма (в руб.)</th>
          </tr>
        </thead>
        <tbody>
          ${services.filter(s => s.name.trim()).map(s => `
            <tr>
              <td>${s.name}</td>
              <td class="num">услуга</td>
              <td class="num">${s.qty}</td>
              <td class="money">${formatMoney(s.price)}</td>
              <td class="money">${formatMoney(s.qty * s.price)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" style="text-align:right;font-weight:bold;border:none;">ИТОГО:</td>
            <td class="money" style="font-weight:bold;">${formatMoney(total)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="margin-top:15px;">Стоимость услуг составляет по настоящей спецификации <strong>${formatMoney(total)}</strong> рублей. НДС не облагается (НПД).</p>
      <div class="signatures">
        <div class="signature-block">
          <p><strong>Исполнитель:</strong></p>
          <div class="signature-line">
            / ${c.company_director_name} /
            <img class="signature-img" src="${window.location.origin}/images/signature.png" />
          </div>
          <p style="margin-top:5px;">М.П.</p>
          <img class="stamp-img" src="${window.location.origin}/images/stamp.png" />
        </div>
        <div class="signature-block">
          <p><strong>Заказчик:</strong></p>
          <div class="signature-line">__________ / ${cl.director_name} /</div>
          <p style="margin-top:5px;">М.П.</p>
        </div>
      </div>
    </div>
  </body></html>`;
}
