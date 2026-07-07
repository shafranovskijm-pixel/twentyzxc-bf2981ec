// Договор на оказание платных образовательных услуг
// от лица АНО ДПО и С "Институт развития"
// Основан на образце №16 от 18.09.2025 (МУП "Горводоканал")

export interface DevelopmentClient {
  name: string;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  legal_address?: string | null;
  director_name?: string | null;
  director_post?: string | null;
  phone?: string | null;
  email?: string | null;
  bank_account?: string | null;
  bank_name?: string | null;
  bank_bik?: string | null;
  bank_corr?: string | null;
}

export interface DevelopmentContractInput {
  number: string;              // напр. "275/2026"
  date: string;                // ISO YYYY-MM-DD или уже отформатированная
  client: DevelopmentClient;
  programName: string;         // название программы обучения
  hours: number;               // кол-во часов (72)
  form?: string;               // "дистанционная"
  studentsCount: number;       // кол-во слушателей
  pricePerStudent: number;     // цена за одного слушателя
  students?: { fio: string; snils?: string }[];
}

const EXECUTOR = {
  short: 'АНО ДПО и С "Институт развития"',
  full: 'Автономная некоммерческая организация дополнительного профессионального образования и сертификации «Институт развития» (АНО ДПО и С «Институт развития»)',
  address: "236003, г. Калининград, ул. Ялтинская, д. 89-10",
  phone: "8 984 170 19 73",
  inn: "3900024056",
  kpp: "390001001",
  ogrn: "1243900004039",
  bank_name: "Банк ВТБ (ПАО)",
  bank_account: "40703810226435000001",
  bank_corr: "30101810145250000411",
  bank_bik: "044525411",
  license: "№ Л035-01236-39/01327849 от 31.07.2024 г.",
  director_post: "Генеральный директор",
  director_name: "Яхненко Виктория Павловна",
  director_short: "В.П. Яхненко",
};

function formatDateRu(iso: string): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const [y, m, d] = iso.split("T")[0].split("-");
    const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y} года`;
  }
  return iso;
}

function formatMoney(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numToWordsRu(n: number): string {
  // упрощённая версия для рублей — целая часть
  const units = ["","один","два","три","четыре","пять","шесть","семь","восемь","девять"];
  const teens = ["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
  const tens = ["","","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
  const hundreds = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];

  const under1000 = (num: number, fem = false): string => {
    const parts: string[] = [];
    const h = Math.floor(num / 100);
    const rest = num % 100;
    if (h) parts.push(hundreds[h]);
    if (rest < 20 && rest >= 10) parts.push(teens[rest - 10]);
    else {
      const t = Math.floor(rest / 10);
      const u = rest % 10;
      if (t) parts.push(tens[t]);
      if (u) {
        if (fem && u === 1) parts.push("одна");
        else if (fem && u === 2) parts.push("две");
        else parts.push(units[u]);
      }
    }
    return parts.join(" ");
  };

  if (n === 0) return "ноль";
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rub = n % 1000;
  const parts: string[] = [];
  if (millions) {
    parts.push(under1000(millions));
    const last = millions % 100;
    const l1 = last % 10;
    if (last >= 11 && last <= 14) parts.push("миллионов");
    else if (l1 === 1) parts.push("миллион");
    else if (l1 >= 2 && l1 <= 4) parts.push("миллиона");
    else parts.push("миллионов");
  }
  if (thousands) {
    parts.push(under1000(thousands, true));
    const last = thousands % 100;
    const l1 = last % 10;
    if (last >= 11 && last <= 14) parts.push("тысяч");
    else if (l1 === 1) parts.push("тысяча");
    else if (l1 >= 2 && l1 <= 4) parts.push("тысячи");
    else parts.push("тысяч");
  }
  if (rub || (!millions && !thousands)) parts.push(under1000(rub));
  return parts.join(" ").trim();
}

function isFeminine(fullName: string): boolean {
  if (!fullName) return false;
  const parts = fullName.trim().split(/\s+/);
  const patr = parts[2] || "";
  return patr.endsWith("вна") || patr.endsWith("чна") || patr.endsWith("шна");
}

function toGenitiveName(fio: string): string {
  if (!fio) return "";
  const feminine = isFeminine(fio);
  return fio.trim().split(/\s+/).map((w) => {
    if (feminine) {
      if (w.endsWith("ая")) return w.slice(0, -2) + "ой";
      if (w.endsWith("ва") || w.endsWith("на")) return w.slice(0, -1) + "ой";
      if (w.endsWith("ия")) return w.slice(0, -1) + "и";
      if (w.endsWith("а")) return w.slice(0, -1) + "ы";
    } else {
      if (w.endsWith("ов") || w.endsWith("ев") || w.endsWith("ин")) return w + "а";
      if (w.endsWith("ий") || w.endsWith("ый")) return w.slice(0, -2) + "ого";
      if (w.endsWith("й")) return w.slice(0, -1) + "я";
      const last = w.slice(-1).toLowerCase();
      if (!"аеёиоуыэюя".includes(last)) return w + "а";
    }
    return w;
  }).join(" ");
}

function toGenitivePost(post: string): string {
  if (!post) return "Директора";
  const lw = post.toLowerCase();
  if (lw.includes("генеральн")) return "Генерального директора";
  if (lw.includes("директор")) return "Директора";
  if (lw.includes("руководител")) return "Руководителя";
  return post;
}

const styles = `
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 794px;
    margin: 0 auto;
    padding: 40px 60px;
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.45;
    color: #111;
    background: #fff;
  }
  h1 { font-size: 14pt; text-align: center; margin: 0 0 6px; font-weight: bold; }
  h2 { font-size: 12pt; text-align: center; margin: 14px 0 8px; font-weight: bold; }
  .header-row { display: flex; justify-content: space-between; margin: 6px 0 14px; font-size: 12pt; }
  p { margin: 2px 0; text-align: justify; text-indent: 28px; }
  p.no-indent { text-indent: 0; }
  .center { text-align: center; text-indent: 0; }
  .right { text-align: right; text-indent: 0; }
  section { margin: 6px 0; break-inside: avoid; }
  table.spec { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11pt; }
  table.spec th, table.spec td { border: 1px solid #111; padding: 6px 8px; text-align: center; }
  .signatures { display: flex; justify-content: space-between; margin-top: 30px; gap: 20px; break-inside: avoid; page-break-inside: avoid; }
  .signature-block { width: 48%; font-size: 11pt; position: relative; padding-bottom: 40px; }
  .signature-block p { text-indent: 0; margin: 2px 0; }
  .signature-line { border-top: 1px solid #111; margin-top: 44px; padding-top: 3px; position: relative; min-height: 22px; }
  .page-break { page-break-before: always; break-before: page; padding-top: 30px; }
  strong { font-weight: bold; }
</style>
`;

export function generateDevelopmentContractHtml(data: DevelopmentContractInput): string {
  const cl = data.client;
  const numFormatted = data.number;
  const dateFormatted = formatDateRu(data.date);

  const total = data.pricePerStudent * data.studentsCount;
  const totalInt = Math.round(total);
  const totalWords = numToWordsRu(totalInt);

  // Определяем сторону Заказчика
  const ogrnDigits = (cl.ogrn || "").replace(/\D/g, "");
  const isIP = (cl.name || "").trim().toLowerCase().startsWith("ип ") || ogrnDigits.length === 15;
  const dirName = cl.director_name || "";
  const dirNameGen = toGenitiveName(dirName);
  const dirPostGen = toGenitivePost(cl.director_post || "");
  const actingWord = isFeminine(dirName) ? "действующей" : "действующего";

  const clientPartyIntro = isIP
    ? `<strong>${cl.name}</strong>${cl.inn ? `, ИНН ${cl.inn}` : ""}${cl.ogrn ? `, ОГРНИП ${cl.ogrn}` : ""}, именуемый в дальнейшем «Заказчик», с одной стороны`
    : `<strong>${cl.name}</strong>, именуемое в дальнейшем «Заказчик», ${dirName ? `в лице ${dirPostGen} ${dirNameGen}, ${actingWord} на основании Устава` : ""}, с одной стороны`;

  const clientRequisites = isIP
    ? `
      <p>${cl.name}</p>
      ${cl.legal_address ? `<p>Адрес: ${cl.legal_address}</p>` : ""}
      ${cl.inn ? `<p>ИНН ${cl.inn}${cl.ogrn ? `, ОГРНИП ${cl.ogrn}` : ""}</p>` : ""}
      ${cl.bank_account ? `<p>р/с ${cl.bank_account}</p>` : ""}
      ${cl.bank_name ? `<p>${cl.bank_name}</p>` : ""}
      ${cl.bank_corr ? `<p>к/с ${cl.bank_corr}</p>` : ""}
      ${cl.bank_bik ? `<p>БИК ${cl.bank_bik}</p>` : ""}
      ${cl.phone ? `<p>Тел.: ${cl.phone}</p>` : ""}
      ${cl.email ? `<p>E-mail: ${cl.email}</p>` : ""}
    `
    : `
      <p>${cl.name}</p>
      ${cl.legal_address ? `<p>Адрес (место нахождения): ${cl.legal_address}</p>` : ""}
      ${cl.inn ? `<p>ИНН ${cl.inn}${cl.kpp ? ` КПП ${cl.kpp}` : ""}</p>` : ""}
      ${cl.ogrn ? `<p>ОГРН ${cl.ogrn}</p>` : ""}
      ${cl.bank_account ? `<p>р/с ${cl.bank_account}</p>` : ""}
      ${cl.bank_name ? `<p>${cl.bank_name}</p>` : ""}
      ${cl.bank_corr ? `<p>к/с ${cl.bank_corr}</p>` : ""}
      ${cl.bank_bik ? `<p>БИК ${cl.bank_bik}</p>` : ""}
      ${cl.phone ? `<p>Телефон: ${cl.phone}</p>` : ""}
      ${cl.email ? `<p>e-mail: ${cl.email}</p>` : ""}
    `;

  const clientShort = (cl.director_name || cl.name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w, i, arr) => (i < arr.length - 1 ? `${w[0]}.` : w))
    .join(" ");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Договор №${numFormatted}</title>${styles}</head><body>

    <h1>Договор № ${numFormatted}</h1>
    <h2>на оказание платных образовательных услуг</h2>
    <div class="header-row">
      <span>г. Калининград</span>
      <span>${dateFormatted}</span>
    </div>

    <section>
      <p>${clientPartyIntro}, и</p>
      <p>${EXECUTOR.full}, именуемое в дальнейшем «Исполнитель», в лице ${toGenitivePost(EXECUTOR.director_post)} ${toGenitiveName(EXECUTOR.director_name)}, действующей на основании Устава, с другой стороны, заключили, в соответствии с Гражданским Кодексом Российской Федерации, Законами Российской Федерации «Об образовании», настоящий Договор о нижеследующем:</p>
    </section>

    <section>
      <p class="center"><strong>Основные понятия, используемые в настоящем Договоре:</strong></p>
      <p><strong>Заказчик</strong> — юридическое лицо, заказывающее платные образовательные услуги в своих интересах или для себя лично;</p>
      <p><strong>Исполнитель</strong> — ${EXECUTOR.full}, оказывающее платные образовательные услуги на основании действующей Лицензии Министерства образования Калининградской области ${EXECUTOR.license}</p>
      <p><strong>Слушатель</strong> — работник юридического лица — Заказчика, получающий образовательные услуги у Исполнителя.</p>
    </section>

    <section>
      <h2>1. Предмет договора</h2>
      <p>1.1. Заказчик поручает и оплачивает образовательные услуги согласно Приложению 1, а Исполнитель принимает на себя обязательства по обучению согласно заявке Заказчика Приложение 2, являющейся неотъемлемой частью договора.</p>
      <p>1.2. Заказчик предоставляет в адрес Исполнителя список сотрудников — слушателей, направляемых для прохождения обучения по соответствующим программам.</p>
      <p>1.3. После прохождения слушателем полного курса обучения и успешной итоговой аттестации ему выдается Свидетельство и Удостоверение установленного образца.</p>
    </section>

    <section>
      <h2>2. Обязанности Исполнителя</h2>
      <p>2.1. Исполнитель обязан:</p>
      <p>2.1.1. зачислить слушателя, выполнившего установленные Уставом и локальными нормативными документами Исполнителя условия приема, в ${EXECUTOR.full};</p>
      <p>2.1.2. организовать и обеспечить надлежащее исполнение услуг, предусмотренных в разделе 1 настоящего договора. Образовательные услуги оказываются в соответствии с учебным планом и расписанием занятий, разрабатываемыми Исполнителем;</p>
      <p>2.1.3. обеспечить для проведения занятий помещения, соответствующие санитарным и гигиеническим требованиям, а также оснащение, соответствующее обязательным нормам и правилам, предъявляемым к образовательному процессу;</p>
      <p>2.2. обеспечить выдачу Слушателю, прошедшему полный курс обучения и успешно прошедшему аттестацию по соответствующей программе, свидетельства и удостоверения установленного образца.</p>
    </section>

    <section>
      <h2>3. Обязанности Заказчика и Слушателя</h2>
      <p>3.1. Заказчик обязан:</p>
      <p>3.1.1. своевременно вносить плату за предоставленные услуги, указанные в разделе 1 настоящего Договора;</p>
      <p>3.1.2. при поступлении в образовательное учреждение Слушателей и в процессе их обучения своевременно предоставлять все необходимые документы, предусмотренные Уставом образовательного учреждения; уведомлять Исполнителя о любых изменениях, влияющих на возможность исполнения обязательств по настоящему Договору;</p>
      <p>3.1.3. возмещать ущерб, причиненный Слушателем имуществу Исполнителя, в соответствии с законодательством Российской Федерации;</p>
      <p>3.2. Слушатель обязан:</p>
      <p>3.2.1. выполнять задания по подготовке к занятиям; бережно относиться к имуществу Исполнителя;</p>
      <p>3.2.2. своевременно уведомлять администрацию Исполнителя о невозможности участия в образовательном процессе с указанием причины.</p>
    </section>

    <section>
      <h2>4. Права Исполнителя, Заказчика, Слушателя</h2>
      <p>4.1. Заказчик и Слушатель вправе требовать от Исполнителя предоставления информации по вопросам, касающимся организации и обеспечения надлежащего исполнения услуг, предусмотренных разделом 1 настоящего договора, образовательной деятельности Исполнителя и перспектив её развития;</p>
      <p>4.2. Заказчик, надлежащим образом исполнивший свои обязательства по настоящему договору, имеет преимущественное право на заключение договора на новый срок по истечении срока действия настоящего договора.</p>
      <p>4.3. Заказчик и Слушатель вправе получать полную и достоверную информацию об оценке знаний, умений, иных образовательных достижениях работников Заказчика, а также о критериях этой оценки;</p>
      <p>4.4. Исполнитель вправе расторгнуть настоящий договор в одностороннем порядке в случае нарушения Слушателем требований внутреннего распорядка, причинения ущерба имуществу Исполнителя или его сотрудников.</p>
      <p>4.5. Стороны настоящего договора вправе пользоваться иными правами, предусмотренными гражданским законодательством Российской Федерации.</p>
    </section>

    <section>
      <h2>5. Стоимость услуг</h2>
      <p>5.1. Стоимость услуг формируется в соответствии с заявками «Заказчика», предусмотренная настоящим Договором, указана в спецификации (Приложение 1), являющейся неотъемлемой частью настоящего Договора. НДС не облагается (упрощённая форма налогообложения) и может быть изменена, по согласованию сторон, в зависимости от процессов инфляции и изменения других стоимостных показателей.</p>
    </section>

    <section>
      <h2>6. Порядок расчётов</h2>
      <p>6.1. После подписания настоящего договора «Заказчик» в течение 5 рабочих дней перечисляет «Исполнителю» предоплату в размере 100% стоимости оказанных услуг после выставления счёта на основании заявки «Заказчика».</p>
    </section>

    <section>
      <h2>7. Ответственность сторон</h2>
      <p>7.1. За нарушение условий настоящего договора стороны несут ответственность в соответствии с нормами законодательства, действующего на территории Российской Федерации.</p>
    </section>

    <section>
      <h2>8. Общие условия</h2>
      <p>8.1. Все споры по настоящему договору подлежат рассмотрению в Арбитражном суде по месту нахождения ответчика.</p>
    </section>

    <section>
      <h2>9. Срок действия договора и другие условия</h2>
      <p>9.1. Настоящий договор вступает в силу со дня его фактического подписания сторонами и действует до полного исполнения своих обязательств сторонами.</p>
      <p>9.2. Договор составлен в двух экземплярах, имеющих равную юридическую силу.</p>
    </section>

    <h2>10. Адреса, реквизиты и подписи Сторон</h2>
    <div class="signatures">
      <div class="signature-block">
        <p><strong>Исполнитель:</strong></p>
        <p>${EXECUTOR.short}</p>
        <p>Юридический адрес:</p>
        <p>${EXECUTOR.address}</p>
        <p>Тел: ${EXECUTOR.phone}</p>
        <p>ИНН / КПП ${EXECUTOR.inn} / ${EXECUTOR.kpp}</p>
        <p>ОГРН ${EXECUTOR.ogrn}</p>
        <p>Банк: ${EXECUTOR.bank_name}</p>
        <p>Р/счёт: ${EXECUTOR.bank_account}</p>
        <p>к/с: ${EXECUTOR.bank_corr}</p>
        <p>БИК: ${EXECUTOR.bank_bik}</p>
        <div class="signature-line">
          _______________ / ${EXECUTOR.director_short} /
        </div>
      </div>
      <div class="signature-block">
        <p><strong>Заказчик:</strong></p>
        ${clientRequisites}
        <div class="signature-line">_______________ / ${clientShort} /</div>
        <p style="margin-top:4px;">М.П.</p>
      </div>
    </div>

    <!-- Приложение №1 — Спецификация -->
    <div class="page-break">
      <p class="right">Приложение № 1<br/>к договору № ${numFormatted} от ${dateFormatted}</p>
      <h1 style="margin-top:12px;">СПЕЦИФИКАЦИЯ</h1>
      <p class="center">по которой ${EXECUTOR.short} осуществляет подготовку<br/>по программе дополнительного профессионального обучения:</p>
      <p class="center"><strong>«${data.programName}»</strong></p>
      <table class="spec">
        <thead>
          <tr>
            <th>Кол-во часов</th>
            <th>Кол-во человек</th>
            <th>Форма обучения</th>
            <th>Стоимость</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${data.hours} часа</td>
            <td>${data.studentsCount}</td>
            <td>${data.form || "дистанционная"}</td>
            <td>${formatMoney(data.pricePerStudent)}</td>
            <td>${formatMoney(total)}</td>
          </tr>
        </tbody>
      </table>
      <p class="no-indent"><strong>Сумма обучения ${formatMoney(total)} (${totalWords} рублей 00 копеек)</strong> НДС не облагается.</p>
      <div class="signatures">
        <div class="signature-block">
          <p><strong>Исполнитель:</strong></p>
          <div class="signature-line">
            _______________ / ${EXECUTOR.director_short} /
          </div>
        </div>
        <div class="signature-block">
          <p><strong>Заказчик:</strong></p>
          <div class="signature-line">_______________ / ${clientShort} /</div>
        </div>
      </div>
    </div>

    <!-- Приложение №2 — Заявка -->
    <div class="page-break">
      <p class="right">Приложение № 2<br/>к договору № ${numFormatted} от ${dateFormatted}</p>
      <h1 style="margin-top:12px;">Заявка</h1>
      <p class="center">на обучение работников ${cl.name} дополнительного профессионального обучения:</p>
      <p class="center"><strong>«${data.programName}»</strong></p>
      <table class="spec">
        <thead>
          <tr>
            <th style="width:8%">№ п/п</th>
            <th>ФИО</th>
            <th style="width:30%">СНИЛС</th>
          </tr>
        </thead>
        <tbody>
          ${(data.students && data.students.length > 0
            ? data.students
            : Array.from({ length: Math.max(1, data.studentsCount) }, () => ({ fio: "", snils: "" }))
          ).map((s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td style="text-align:left; padding-left:10px;">${s.fio || "&nbsp;"}</td>
              <td>${s.snils || "&nbsp;"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="signatures">
        <div class="signature-block">
          <p><strong>Исполнитель:</strong></p>
          <div class="signature-line">
            _______________ / ${EXECUTOR.director_short} /
          </div>
        </div>
        <div class="signature-block">
          <p><strong>Заказчик:</strong></p>
          <div class="signature-line">_______________ / ${clientShort} /</div>
        </div>
      </div>
    </div>

  </body></html>`;
}

export const DEV_EXECUTOR_INFO = EXECUTOR;
