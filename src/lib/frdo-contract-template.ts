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
    h3 { font-size: 12pt; margin: 10px 0; }
    .header-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .section { margin: 15px 0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
    .signature-block { width: 45%; position: relative; }
    .signature-line { border-bottom: 1px solid #000; margin-top: 40px; padding-bottom: 2px; position: relative; }
    .signature-img { position: absolute; height: 50px; bottom: 0; left: 80px; }
    .stamp-img { position: absolute; height: 110px; opacity: 0.85; bottom: -40px; left: 10px; }
    p { margin: 5px 0; }
    .indent { text-indent: 30px; }
    .page-break { page-break-before: always; margin-top: 30px; }
    ul { margin-left: 20px; }
    ul li { margin: 3px 0; }
    @media print {
      body { padding: 10mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
    }
  </style>
`;

export function generateFrdoContractHtml(data: DocumentData): string {
  const { company: c, client: cl, services, number: num, date } = data;
  const total = totalSum(services);

  // Determine period from deadline field (e.g. "05.03.2026 по 05.03.2027")
  const periodText = data.deadline || "12 месяцев с момента подписания договора";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Договор ФРДО №${num}</title>${baseStyles}</head><body>
    <h1>ДОГОВОР № ${num}</h1>
    <div class="header-row">
      <span>г. Владивосток</span>
      <span>${date}</span>
    </div>
    <div class="section">
      <p class="indent"><strong>${c.company_short_name || c.company_name}</strong>, в дальнейшем именуемое УЦ, ИНН ${c.company_inn}, с одной стороны и <strong>${cl.name}</strong>, именуемое в дальнейшем Заказчик, в лице ${declinePost(cl.director_post || "Директор").toLowerCase()} ${declineFullName(cl.director_name)}, ${getActingPhrase(cl.director_name)} на основании Устава, с другой стороны, вместе именуемые стороны, заключили настоящий Договор о нижеследующем:</p>
    </div>

    <div class="section">
      <h2>1. ПРЕДМЕТ ДОГОВОРА</h2>
      <p class="indent">1.1. УЦ оказывает Заказчику услуги по выгрузке данных заказчика о выданных документах об образовании и (или) о квалификации на портал Федеральной информационной системы «Федеральный реестр сведений о документах об образовании и (или) о квалификации, документах об обучении» (далее ФИС ФРДО) и обеспечивает информационно-консультационную поддержку Заказчика по работе в ФИС ФРДО (далее – услуги), а Заказчик обязуется принять и оплатить данные услуги.</p>
      <p class="indent">1.2. Оказание услуг осуществляется на основании заявления Заказчика и в соответствии со спецификацией (Приложение №1 к настоящему договору).</p>
    </div>

    <div class="section">
      <h2>2. ОБЯЗАННОСТИ СТОРОН</h2>
      <p><strong>2.1. УЦ обязуется:</strong></p>
      <p class="indent">2.1.1. Осуществлять обработку персональных данных на основании поручения на обработку персональных данных (Приложение 2 к настоящему договору);</p>
      <p class="indent">2.1.2. Соблюдать конфиденциальность персональных данных и обеспечивать безопасность персональных данных при их обработке;</p>
      <p class="indent">2.1.3. Осуществлять выгрузку данных заказчика в ФИС ФРДО;</p>
      <p class="indent">2.1.4. Обеспечивать информационно-консультационную поддержку Заказчика по работе в ФИС ФРДО;</p>
      <p class="indent">2.1.5. Произвести уничтожение исходных файлов заказчика (заполненных файлов-шаблонов, содержащих персональные данные) в срок, не превышающий 30 рабочих дней, с даты окончания срока действия настоящего договора.</p>
      <p style="margin-top:10px;"><strong>2.2. Заказчик обязуется:</strong></p>
      <p class="indent">2.2.1. Обеспечить достоверность предоставляемой в УЦ информации;</p>
      <p class="indent">2.2.2. Соблюдать требования по обеспечению безопасности использования электронной подписи;</p>
      <p class="indent">2.2.3. Произвести оплату на согласованных настоящим договором условиях.</p>
      <p class="indent">2.2.4. Предоставлять в УЦ заполненный файл-шаблон, содержащий информацию о выданных заказчиком документах об образовании, который необходимо загрузить в ФИС ФРДО, подписанный собственной ЭЦП.</p>
    </div>

    <div class="section">
      <h2>3. СТОИМОСТЬ УСЛУГ И ПОРЯДОК РАСЧЕТОВ</h2>
      <p class="indent">3.1. Сумма оплаты по договору определяется в соответствии со спецификацией (Приложение № 1 к настоящему Договору), которая является неотъемлемой частью Договора и составляет <strong>${formatMoney(total)}</strong> рублей, НДС нет.</p>
      ${data.discountAmount && data.discountDeadline ? `<p class="indent"><strong>При оплате до ${data.discountDeadline} сумма составляет ${formatMoney(total - data.discountAmount)} руб.</strong> (скидка ${formatMoney(data.discountAmount)} руб.)</p>` : data.discountAmount ? `<p class="indent"><strong>Сумма со скидкой: ${formatMoney(total - data.discountAmount)} руб.</strong> (скидка ${formatMoney(data.discountAmount)} руб.)</p>` : ''}
      <p class="indent">3.2. Заказчик оплачивает услуги, указанные в приложении №1, ${data.paymentTerms || "авансом в размере 100%"} на основании счета, выставленного УЦ, не позднее 5 (пяти) банковских дней после выставления счета.</p>
      <p class="indent">3.3. Обязательства Заказчика по оплате считаются исполненными в момент поступления денежных средств на расчетный счет УЦ.</p>
    </div>

    <div class="section">
      <h2>4. ПОРЯДОК СДАЧИ И ПРИЕМКИ УСЛУГ</h2>
      <p class="indent">4.1. Выгрузка файлов-шаблонов осуществляется УЦ в течение 2 (двух) рабочих дней после получения.</p>
      <p class="indent">4.2. По завершении оказания услуг Заказчику представляются фото экрана выгруженных данных, чек об оплате.</p>
    </div>

    <div class="section">
      <h2>5. КАЧЕСТВО УСЛУГ</h2>
      <p class="indent">5.1. Качество услуг, оказываемых по настоящему Договору, должно соответствовать действующим в Российской Федерации нормам, стандартам и техническим условиям.</p>
    </div>

    <div class="section">
      <h2>6. КОНФИДЕНЦИАЛЬНОСТЬ</h2>
      <p class="indent">6.1. Каждая сторона соглашается сохранять конфиденциальность всей технической, производственной, деловой, финансовой и другой информации, относящейся к деятельности другой стороны.</p>
      <p class="indent">6.2. В целях соблюдения режима конфиденциальности Заказчик должен письменно информировать УЦ об особых свойствах переданных документации и информации.</p>
      <p class="indent">6.3. Каждая сторона должна в любое время охранять конфиденциальную информацию другой стороны и соглашается не раскрывать, не сообщать, не передавать и не предоставлять никаким другим образом любую конфиденциальную информацию полностью либо частично любой третьей стороне.</p>
      <p class="indent">6.4. Вышеустановленная обязанность не действует в отношении любой конфиденциальной информации, если:</p>
      <ul>
        <li>раскрытая конфиденциальная информация на момент ее раскрытия уже являлась общедоступной;</li>
        <li>конфиденциальная информация была обнародована передающей стороной или третьими лицами;</li>
        <li>конфиденциальная информация получена от третьих лиц без каких-либо ограничений;</li>
        <li>конфиденциальная информация раскрыта по требованию уполномоченных на то законодательством РФ государственных органов.</li>
      </ul>
      <p class="indent">6.5. Положения о конфиденциальности будут оставаться в силе в течение 5 (пяти) лет после прекращения действия настоящего Договора.</p>
    </div>

    <div class="section">
      <h2>7. ОТВЕТСТВЕННОСТЬ СТОРОН</h2>
      <p class="indent">7.1. УЦ не отвечает за убытки, возникшие у Заказчика, если убытки возникли:</p>
      <ul>
        <li>не по вине УЦ;</li>
        <li>вследствие неправомерных действий государственных органов и/или третьих лиц или вследствие действия форс-мажорных обстоятельств;</li>
        <li>в случае неисполнения или ненадлежащего исполнения Заказчиком письменных рекомендаций УЦ;</li>
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
      <p class="indent">9.1. В случае если у Заказчика возникнут обоснованные претензии к исполнению обязательств по Договору УЦ, Заказчик вправе расторгнуть Договор в следующем порядке:</p>
      <ul>
        <li>Заказчик составляет письменную претензию и направляет ее УЦ. Срок рассмотрения претензии – 10 (десять) рабочих дней;</li>
        <li>в случае признания претензии Заказчика обоснованной, стороны расторгают Договор, и УЦ возвращает сумму денежных средств, перечисленных Заказчиком за услуги, к исполнению которых у Заказчика возникли претензии.</li>
      </ul>
      <p class="indent">9.2. При расторжении договора по инициативе Заказчика в случае, если не возникает обоснованных претензий к исполнению обязательств по договору УЦ, стоимость оплаченных услуг не возвращается.</p>
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
        <p><strong>УЦ:</strong></p>
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
        <p>ИНН${cl.inn ? "/" : ""}${cl.inn}${cl.kpp ? ` КПП ${cl.kpp}` : ""}${cl.ogrn ? ` ОГРН ${cl.ogrn}` : ""}</p>
        <div class="signature-line">${cl.director_post || "Директор"} __________ / ${cl.director_name} /</div>
        <p style="margin-top:5px;">М.П.</p>
      </div>
    </div>

    <!-- Приложение 1 — Спецификация -->
    <div class="page-break">
      <p style="text-align:right;">Приложение №1 к договору №${num} от ${date}</p>
      <h1>Спецификация № 1</h1>
      <p>Наименование Заказчика: ${cl.name}</p>
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
      <p style="margin-top:15px;">Стоимость услуг составляет по настоящей спецификации <strong>${formatMoney(total)}</strong> рублей. НДС нет.</p>
      <div class="signatures">
        <div class="signature-block">
          <p><strong>УЦ:</strong></p>
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

    <!-- Приложение 2 — Поручение на обработку ПДн -->
    <div class="page-break">
      <p style="text-align:right;">Приложение №2</p>
      <h1>Поручение оператора на осуществление обработки персональных данных</h1>
      <div class="section">
        <p class="indent">На основании п. 3, 4 ст. 6 Федерального закона от 27.07.2006 №152-ФЗ "О персональных данных" в рамках договора от ${date} №${num} <strong>${cl.name}</strong> (далее Оператор персональных данных, Заказчик) поручает <strong>${c.company_director_name}</strong> (далее УЦ, Исполнитель) провести обработку персональных данных выбранных субъектов в следующих формах: сбор, обработка, хранение, передача.</p>
      </div>
      <div class="section">
        <h3>1. Цель обработки ПДн:</h3>
        <p class="indent">В связи с исполнением условий договора предполагается обработка следующих персональных данных: фамилия, имя, отчество, пол, СНИЛС, сведения об образовании — с целью направления сведений о документах об образовании в Федеральную информационную систему «Федеральный реестр документов об образовании» (группы субъектов персональных данных — лиц обладателей документов об образовании, выданных Оператором).</p>
      </div>
      <div class="section">
        <h3>2. Лицо УЦ, ответственное за организацию обработки персональных данных:</h3>
        <p class="indent">${c.company_director_post} ${c.company_director_name}.</p>
      </div>
      <div class="section">
        <h3>3. УЦ при выполнении поручения обязан:</h3>
        <p class="indent">3.1. Соблюдать конфиденциальность ПДн и обеспечивать безопасность ПДн при их обработке;</p>
        <p class="indent">3.2. Осуществлять обработку персональных данных на законной основе, в строгом соответствии с условиями настоящего Поручения;</p>
        <p class="indent">3.3. Для обеспечения безопасности персональных данных УЦ должны выполняться следующие мероприятия:</p>
        <p class="indent">3.3.1. Принятие необходимых правовых, организационных и технических мер для защиты ПДн от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, предоставления, распространения;</p>
        <p class="indent">3.3.2. Обеспечение доступа работников УЦ к ПДн после подписания ими Обязательства о неразглашении;</p>
        <p class="indent">3.3.3. Определение угроз безопасности ПДн при их обработке в информационных системах;</p>
        <p class="indent">3.3.4. Применение организационных и технических мер по обеспечению безопасности ПДн;</p>
        <p class="indent">3.3.5. Оценка эффективности принимаемых мер по обеспечению безопасности ПДн;</p>
        <p class="indent">3.3.6. Учет машинных носителей персональных данных;</p>
        <p class="indent">3.3.7. Обнаружение фактов несанкционированного доступа к ПДн и принятие мер;</p>
        <p class="indent">3.3.8. Восстановление ПДн, модифицированных или уничтоженных вследствие несанкционированного доступа;</p>
        <p class="indent">3.3.9. Установление правил доступа к ПДн, обеспечение регистрации и учета всех действий с ПДн;</p>
        <p class="indent">3.3.10. Контроль за принимаемыми мерами по обеспечению безопасности ПДн.</p>
      </div>
      <div class="section">
        <h3>4. Уничтожение персональных данных субъектов производится УЦ в следующих случаях:</h3>
        <ul>
          <li>по дополнительному письменному поручению Заказчика;</li>
          <li>по законному требованию субъекта персональных данных, с обязательным письменным уведомлением Заказчика;</li>
          <li>по требованию органов государственного регулирования, с обязательным письменным уведомлением Заказчика;</li>
          <li>по истечении 30 дней с даты окончания срока действия договора.</li>
        </ul>
        <p class="indent">Уничтожение обрабатываемых персональных данных должно быть гарантированным и обеспечивать невозможность восстановления содержания персональных данных.</p>
      </div>
      <div class="section">
        <h3>5. Заказчик обязуется:</h3>
        <p class="indent">5.1. В случае отзыва субъектом ПДн согласия на обработку направлять Исполнителю письменное поручение на удаление либо обезличивание ПДн субъекта.</p>
        <p class="indent">5.2. При поступлении запроса от субъекта ПДн направлять Исполнителю письменное поручение на предоставление информации либо совершение конкретных действий с ПДн субъекта.</p>
      </div>
      <div class="section">
        <h3>6. Форс-мажор</h3>
        <p class="indent">Стороны освобождаются от ответственности за неисполнение или ненадлежащее исполнение своих обязательств по настоящему Поручению, если это явилось следствием форс-мажорных обстоятельств.</p>
      </div>
      <div class="section">
        <h3>7. Ответственность сторон</h3>
        <p class="indent">Заказчик, как Оператор персональных данных, несет полную ответственность перед субъектом персональных данных за действия, осуществляемые Исполнителем при обработке ПДн субъекта.</p>
        <p class="indent">Исполнитель несет полную ответственность перед Заказчиком за действия, производимые при обработке ПДн субъектов.</p>
        <p class="indent">Стороны несут ответственность за несоблюдение условий настоящего Поручения в соответствии с действующим законодательством.</p>
      </div>
      <div class="signatures">
        <div class="signature-block">
          <p><strong>УЦ:</strong></p>
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
