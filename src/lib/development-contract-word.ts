import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  TabStopPosition,
  TabStopType,
} from "docx";
import JSZip from "jszip";
import {
  generateDevelopmentContractHtml,
  type DevelopmentContractInput,
} from "@/lib/development-contract-template";

const EXECUTOR = {
  short: 'АНО ДПО и С "Институт развития"',
  full: "Автономная некоммерческая организация дополнительного профессионального образования и сертификации «Институт развития» (АНО ДПО и С «Институт развития»)",
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

const A4 = { width: 11906, height: 16838 };
const PAGE_MARGIN = 720;
const CONTENT_WIDTH = A4.width - PAGE_MARGIN * 2;
const TABLE_WIDTH = 10440;

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "111111" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function formatDateRu(iso: string): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const [y, m, d] = iso.split("T")[0].split("-");
    const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y} года`;
  }
  return iso;
}

function formatMoney(n: number): string {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numToWordsRu(n: number): string {
  const units = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const teens = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
  const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
  const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

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
      if (u) parts.push(fem && u === 1 ? "одна" : fem && u === 2 ? "две" : units[u]);
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
    parts.push(last >= 11 && last <= 14 ? "миллионов" : l1 === 1 ? "миллион" : l1 >= 2 && l1 <= 4 ? "миллиона" : "миллионов");
  }
  if (thousands) {
    parts.push(under1000(thousands, true));
    const last = thousands % 100;
    const l1 = last % 10;
    parts.push(last >= 11 && last <= 14 ? "тысяч" : l1 === 1 ? "тысяча" : l1 >= 2 && l1 <= 4 ? "тысячи" : "тысяч");
  }
  if (rub || (!millions && !thousands)) parts.push(under1000(rub));
  return parts.join(" ").trim();
}

function isFeminine(fullName: string): boolean {
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
  const lw = post.toLowerCase();
  if (lw.includes("генеральн")) return "Генерального директора";
  if (lw.includes("директор")) return "Директора";
  if (lw.includes("руководител")) return "Руководителя";
  return post || "Директора";
}

function clientShortName(data: DevelopmentContractInput): string {
  return (data.client.director_name || data.client.name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w, i, arr) => (i < arr.length - 1 ? `${w[0]}.` : w))
    .join(" ");
}

function p(text: string, options: { bold?: boolean; center?: boolean; right?: boolean; size?: number; indent?: boolean; spacingAfter?: number; pageBreakBefore?: boolean } = {}) {
  return new Paragraph({
    pageBreakBefore: options.pageBreakBefore,
    alignment: options.center ? AlignmentType.CENTER : options.right ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
    indent: options.indent === false || options.center || options.right ? undefined : { firstLine: 420 },
    spacing: { before: 20, after: options.spacingAfter ?? 40, line: 276 },
    children: [new TextRun({ text, bold: options.bold, size: options.size ?? 24, font: "Times New Roman" })],
  });
}

function heading(text: string, first = false) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: first ? 0 : 180, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, font: "Times New Roman" })],
  });
}

function title(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Times New Roman" })],
  });
}

function tableCell(text: string, width: number, options: { bold?: boolean; center?: boolean; noBorder?: boolean; shade?: string } = {}) {
  return new TableCell({
    borders: options.noBorder ? noBorders : cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: options.shade ? { fill: options.shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [p(text, { bold: options.bold, center: options.center ?? true, indent: false, size: 22, spacingAfter: 20 })],
  });
}

function specTable(data: DevelopmentContractInput) {
  const widths = [1500, 1500, 2000, 2600, 2840];
  const total = data.pricePerStudent * data.studentsCount;
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: ["Кол-во часов", "Кол-во человек", "Форма обучения", "Стоимость", "Сумма"].map((text, i) => tableCell(text, widths[i], { bold: true, shade: "EDEDED" })),
      }),
      new TableRow({
        children: [
          `${data.hours} часа`,
          String(data.studentsCount),
          data.form || "дистанционная",
          formatMoney(data.pricePerStudent),
          formatMoney(total),
        ].map((text, i) => tableCell(text, widths[i])),
      }),
    ],
  });
}

function studentsTable(data: DevelopmentContractInput) {
  const widths = [900, 6200, 3340];
  const students = data.students && data.students.length > 0
    ? data.students
    : Array.from({ length: Math.max(1, data.studentsCount) }, () => ({ fio: "", snils: "" }));
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: ["№ п/п", "ФИО", "СНИЛС"].map((text, i) => tableCell(text, widths[i], { bold: true, shade: "EDEDED" })),
      }),
      ...students.map((student, i) => new TableRow({
        children: [
          tableCell(String(i + 1), widths[0]),
          tableCell(student.fio || " ", widths[1], { center: false }),
          tableCell(student.snils || " ", widths[2]),
        ],
      })),
    ],
  });
}

function signatureTable(data: DevelopmentContractInput, requisites = false) {
  const widths = [CONTENT_WIDTH / 2, CONTENT_WIDTH / 2];
  const client = data.client;
  const clientLines = requisites
    ? [
        client.name,
        client.legal_address ? `Адрес: ${client.legal_address}` : "",
        client.inn ? `ИНН ${client.inn}${client.kpp ? ` КПП ${client.kpp}` : ""}` : "",
        client.ogrn ? `ОГРН ${client.ogrn}` : "",
        client.phone ? `Телефон: ${client.phone}` : "",
        client.email ? `e-mail: ${client.email}` : "",
      ].filter(Boolean)
    : [];

  const executorLines = requisites
    ? [
        EXECUTOR.short,
        "Юридический адрес:",
        EXECUTOR.address,
        `Тел: ${EXECUTOR.phone}`,
        `ИНН / КПП ${EXECUTOR.inn} / ${EXECUTOR.kpp}`,
        `ОГРН ${EXECUTOR.ogrn}`,
        `Банк: ${EXECUTOR.bank_name}`,
        `Р/счёт: ${EXECUTOR.bank_account}`,
        `к/с: ${EXECUTOR.bank_corr}`,
        `БИК: ${EXECUTOR.bank_bik}`,
      ]
    : [];

  const cell = (header: string, lines: string[], sign: string, width: number) => new TableCell({
    borders: noBorders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 200, bottom: 80, left: 80, right: 200 },
    children: [
      p(header, { bold: true, indent: false, spacingAfter: 60 }),
      ...lines.map((line) => p(line, { indent: false, size: 22, spacingAfter: 20 })),
      p(`_______________ / ${sign} /`, { indent: false, spacingAfter: 20 }),
      ...(header.startsWith("Заказчик") ? [p("М.П.", { indent: false, size: 22, spacingAfter: 20 })] : []),
    ],
  });

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [new TableRow({
      children: [
        cell("Исполнитель:", executorLines, EXECUTOR.director_short, widths[0]),
        cell("Заказчик:", clientLines, clientShortName(data), widths[1]),
      ],
    })],
  });
}

function requisitesIntro(data: DevelopmentContractInput): string {
  const cl = data.client;
  const ogrnDigits = (cl.ogrn || "").replace(/\D/g, "");
  const isIP = (cl.name || "").trim().toLowerCase().startsWith("ип ") || ogrnDigits.length === 15;
  const dirName = cl.director_name || "";
  const actingWord = isFeminine(dirName) ? "действующей" : "действующего";
  if (isIP) {
    return `${cl.name}${cl.inn ? `, ИНН ${cl.inn}` : ""}${cl.ogrn ? `, ОГРНИП ${cl.ogrn}` : ""}, именуемый в дальнейшем «Заказчик», с одной стороны`;
  }
  return `${cl.name}, именуемое в дальнейшем «Заказчик», ${dirName ? `в лице ${toGenitivePost(cl.director_post || "")} ${toGenitiveName(dirName)}, ${actingWord} на основании Устава` : ""}, с одной стороны`;
}

function buildDocxChildren(data: DevelopmentContractInput) {
  const dateFormatted = formatDateRu(data.date);
  const total = data.pricePerStudent * data.studentsCount;
  const totalWords = numToWordsRu(Math.round(total));

  return [
    title(`Договор № ${data.number}`),
    heading("на оказание платных образовательных услуг", true),
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      spacing: { before: 40, after: 160 },
      children: [new TextRun({ text: `г. Калининград\t${dateFormatted}`, size: 24, font: "Times New Roman" })],
    }),
    p(`${requisitesIntro(data)}, и`),
    p(`${EXECUTOR.full}, именуемое в дальнейшем «Исполнитель», в лице ${toGenitivePost(EXECUTOR.director_post)} ${toGenitiveName(EXECUTOR.director_name)}, действующей на основании Устава, с другой стороны, заключили, в соответствии с Гражданским Кодексом Российской Федерации, Законами Российской Федерации «Об образовании», настоящий Договор о нижеследующем:`),
    p("Основные понятия, используемые в настоящем Договоре:", { bold: true, center: true, indent: false }),
    p(`Заказчик — юридическое лицо, заказывающее платные образовательные услуги в своих интересах или для себя лично;`),
    p(`Исполнитель — ${EXECUTOR.full}, оказывающее платные образовательные услуги на основании действующей Лицензии Министерства образования Калининградской области ${EXECUTOR.license}`),
    p("Слушатель — работник юридического лица — Заказчика, получающий образовательные услуги у Исполнителя."),
    heading("1. Предмет договора"),
    p("1.1. Заказчик поручает и оплачивает образовательные услуги согласно Приложению 1, а Исполнитель принимает на себя обязательства по обучению согласно заявке Заказчика Приложение 2, являющейся неотъемлемой частью договора."),
    p("1.2. Заказчик предоставляет в адрес Исполнителя список сотрудников — слушателей, направляемых для прохождения обучения по соответствующим программам."),
    p("1.3. После прохождения слушателем полного курса обучения и успешной итоговой аттестации ему выдается Свидетельство и Удостоверение установленного образца."),
    heading("2. Обязанности Исполнителя"),
    p("2.1. Исполнитель обязан:"),
    p(`2.1.1. зачислить слушателя, выполнившего установленные Уставом и локальными нормативными документами Исполнителя условия приема, в ${EXECUTOR.full};`),
    p("2.1.2. организовать и обеспечить надлежащее исполнение услуг, предусмотренных в разделе 1 настоящего договора. Образовательные услуги оказываются в соответствии с учебным планом и расписанием занятий, разрабатываемыми Исполнителем;"),
    p("2.1.3. обеспечить для проведения занятий помещения, соответствующие санитарным и гигиеническим требованиям, а также оснащение, соответствующее обязательным нормам и правилам, предъявляемым к образовательному процессу;"),
    p("2.2. обеспечить выдачу Слушателю, прошедшему полный курс обучения и успешно прошедшему аттестацию по соответствующей программе, свидетельства и удостоверения установленного образца."),
    heading("3. Обязанности Заказчика и Слушателя"),
    p("3.1. Заказчик обязан:"),
    p("3.1.1. своевременно вносить плату за предоставленные услуги, указанные в разделе 1 настоящего Договора;"),
    p("3.1.2. при поступлении в образовательное учреждение Слушателей и в процессе их обучения своевременно предоставлять все необходимые документы, предусмотренные Уставом образовательного учреждения; уведомлять Исполнителя о любых изменениях, влияющих на возможность исполнения обязательств по настоящему Договору;"),
    p("3.1.3. возмещать ущерб, причиненный Слушателем имуществу Исполнителя, в соответствии с законодательством Российской Федерации;"),
    p("3.2. Слушатель обязан:"),
    p("3.2.1. выполнять задания по подготовке к занятиям; бережно относиться к имуществу Исполнителя;"),
    p("3.2.2. своевременно уведомлять администрацию Исполнителя о невозможности участия в образовательном процессе с указанием причины."),
    heading("4. Права Исполнителя, Заказчика, Слушателя"),
    p("4.1. Заказчик и Слушатель вправе требовать от Исполнителя предоставления информации по вопросам, касающимся организации и обеспечения надлежащего исполнения услуг, предусмотренных разделом 1 настоящего договора, образовательной деятельности Исполнителя и перспектив её развития;"),
    p("4.2. Заказчик, надлежащим образом исполнивший свои обязательства по настоящему договору, имеет преимущественное право на заключение договора на новый срок по истечении срока действия настоящего договора."),
    p("4.3. Заказчик и Слушатель вправе получать полную и достоверную информацию об оценке знаний, умений, иных образовательных достижениях работников Заказчика, а также о критериях этой оценки;"),
    p("4.4. Исполнитель вправе расторгнуть настоящий договор в одностороннем порядке в случае нарушения Слушателем требований внутреннего распорядка, причинения ущерба имуществу Исполнителя или его сотрудников."),
    p("4.5. Стороны настоящего договора вправе пользоваться иными правами, предусмотренными гражданским законодательством Российской Федерации."),
    heading("5. Стоимость услуг"),
    p("5.1. Стоимость услуг формируется в соответствии с заявками «Заказчика», предусмотренная настоящим Договором, указана в спецификации (Приложение 1), являющейся неотъемлемой частью настоящего Договора. НДС не облагается (упрощённая форма налогообложения) и может быть изменена, по согласованию сторон, в зависимости от процессов инфляции и изменения других стоимостных показателей."),
    heading("6. Порядок расчётов"),
    p("6.1. После подписания настоящего договора «Заказчик» в течение 5 рабочих дней перечисляет «Исполнителю» предоплату в размере 100% стоимости оказанных услуг после выставления счёта на основании заявки «Заказчика»."),
    heading("7. Ответственность сторон"),
    p("7.1. За нарушение условий настоящего договора стороны несут ответственность в соответствии с нормами законодательства, действующего на территории Российской Федерации."),
    heading("8. Общие условия"),
    p("8.1. Все споры по настоящему договору подлежат рассмотрению в Арбитражном суде по месту нахождения ответчика."),
    heading("9. Срок действия договора и другие условия"),
    p("9.1. Настоящий договор вступает в силу со дня его фактического подписания сторонами и действует до полного исполнения своих обязательств сторонами."),
    p("9.2. Договор составлен в двух экземплярах, имеющих равную юридическую силу."),
    heading("10. Адреса, реквизиты и подписи Сторон"),
    signatureTable(data, true),
    p(`Приложение № 1\nк договору № ${data.number} от ${dateFormatted}`, { pageBreakBefore: true, right: true, indent: false }),
    title("СПЕЦИФИКАЦИЯ"),
    p(`по которой ${EXECUTOR.short} осуществляет подготовку по программе дополнительного профессионального обучения:`, { center: true, indent: false }),
    p(`«${data.programName}»`, { bold: true, center: true, indent: false }),
    specTable(data),
    p(`Сумма обучения ${formatMoney(total)} (${totalWords} рублей 00 копеек) НДС не облагается.`, { bold: true, indent: false }),
    signatureTable(data, false),
    p(`Приложение № 2\nк договору № ${data.number} от ${dateFormatted}`, { pageBreakBefore: true, right: true, indent: false }),
    title("Заявка"),
    p(`на обучение работников ${data.client.name} дополнительного профессионального обучения:`, { center: true, indent: false }),
    p(`«${data.programName}»`, { bold: true, center: true, indent: false }),
    studentsTable(data),
    signatureTable(data, false),
  ];
}

export async function generateDevelopmentContractDocxBlob(data: DevelopmentContractInput): Promise<Blob> {
  const doc = new Document({
    creator: "24ZXC",
    title: `Договор № ${data.number}`,
    description: "Договор на оказание платных образовательных услуг",
    styles: {
      default: {
        document: { run: { font: "Times New Roman", size: 24 } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: A4.width, height: A4.height, orientation: PageOrientation.PORTRAIT },
          margin: { top: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN },
        },
      },
      children: buildDocxChildren(data),
    }],
  });

  const blob = await Packer.toBlob(doc);
  await validateDevelopmentContractDocxBlob(blob);
  return blob;
}

export function generateDevelopmentContractDocBlob(data: DevelopmentContractInput): Blob {
  const html = generateDevelopmentContractHtml(data);
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length < 1000 || !text.includes("Договор") || !text.includes("Институт развития")) {
    throw new Error("DOC не сформирован: в файле нет текста договора");
  }
  return new Blob([`\ufeff${html}`], { type: "application/msword;charset=utf-8" });
}

export async function validateDevelopmentContractDocxBlob(blob: Blob): Promise<void> {
  if (!blob || blob.size < 8_000) {
    throw new Error(`DOCX не сформирован: файл слишком маленький (${blob?.size || 0} байт)`);
  }
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (head[0] !== 0x50 || head[1] !== 0x4b) {
    throw new Error("DOCX не сформирован: файл не является ZIP-документом Word");
  }
  const zip = await JSZip.loadAsync(blob);
  const xml = await zip.file("word/document.xml")?.async("text");
  if (!xml) {
    throw new Error("DOCX не сформирован: внутри нет word/document.xml");
  }
  const plainText = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (plainText.length < 1000 || !plainText.includes("Договор") || !plainText.includes("Институт развития")) {
    throw new Error("DOCX не сформирован: внутри файла нет текста договора");
  }
}