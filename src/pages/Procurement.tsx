import { Helmet } from "react-helmet-async";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  GraduationCap,
  MonitorSmartphone,
  PackageCheck,
  Send,
  ShieldCheck,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LandingContact from "@/components/landing/LandingContact";

const directions = [
  {
    icon: MonitorSmartphone,
    label: "Сайты",
    title: "Сайт с заранее понятным результатом",
    description: "Лендинги и сайты образовательных организаций: адаптивная вёрстка, размещение материалов и передача готового результата.",
    price: "от 15 000 ₽",
    deadline: "от 5 дней",
  },
  {
    icon: ShieldCheck,
    label: "СИНТАГМА",
    title: "Учёт обучения и охраны труда",
    description: "Курсы, группы, слушатели, статусы прохождения, тесты, журналы, приказы и протоколы проверки знаний.",
    price: "16 990 ₽ / мес.",
    deadline: "до 3 дней",
  },
  {
    icon: GraduationCap,
    label: "Документы",
    title: "Программы и учебные материалы",
    description: "Адаптация дополнительных профессиональных программ, учебных планов, графиков и оценочных материалов.",
    price: "от 5 000 ₽",
    deadline: "от 2 дней",
  },
];

const packages = [
  {
    category: "Сайт",
    name: "Одностраничный сайт",
    price: "15 000 ₽",
    deadline: "5–7 дней",
    result: ["Одна адаптивная страница", "Форма заявки и контакты", "Размещение материалов заказчика", "30 дней технической поддержки"],
  },
  {
    category: "Сайт",
    name: "Сайт образовательной организации",
    price: "20 000 ₽",
    deadline: "до 10 рабочих дней",
    result: ["Согласованная структура разделов", "Адаптивная версия", "Размещение предоставленных сведений", "Передача готового сайта"],
  },
  {
    category: "Сайт",
    name: "Расширенный образовательный сайт",
    price: "50 000 ₽",
    deadline: "до 10 рабочих дней",
    result: ["Самостоятельное редактирование", "Перенос согласованного объёма", "Подключение имеющегося домена", "Хостинг на 12 месяцев"],
    note: "Объём переноса и хранилища фиксируется до договора.",
  },
  {
    category: "Система",
    name: "СИНТАГМА «Профессиональный»",
    price: "16 990 ₽ / мес.",
    deadline: "активация до 3 рабочих дней",
    result: ["Курсы, слушатели и группы", "Прогресс и тестирование", "Журналы, приказы и протоколы", "Подготовка рабочих реестров"],
    featured: true,
  },
  {
    category: "Документы",
    name: "Адаптация одной ДПП",
    price: "5 000 ₽",
    deadline: "2–3 рабочих дня",
    result: ["Программа и учебный план", "Календарный график", "Оценочные материалы", "Условия реализации и чек-лист"],
  },
  {
    category: "Документы",
    name: "Комплект из четырёх ДПП",
    price: "20 000 ₽",
    deadline: "7–10 рабочих дней",
    result: ["ГО и ЧС", "Пожарная безопасность", "Отходы I–IV классов", "Промышленная безопасность"],
  },
];

const workflow = [
  { title: "Выбираем пакет", text: "Вы присылаете задачу, ссылку на закупку или техническое задание." },
  { title: "Сверяем требования", text: "Проверяем результат, сроки, исходные материалы и границы ответственности." },
  { title: "Фиксируем условия", text: "Готовим коммерческое предложение и договор с измеримым результатом." },
  { title: "Передаём и закрываем", text: "Показываем результат, вносим согласованные правки и оформляем акт." },
];

const faq = [
  {
    question: "Можно ли приобрести услуги через Портал поставщиков?",
    answer: "Да, готовим отдельные оферты под типовые пакеты. Пока проверенные публичные ссылки не размещены, запросите коммерческое предложение — укажем точный предмет, состав и цену закупки.",
  },
  {
    question: "Что входит в фиксированную цену?",
    answer: "Только перечисленный в пакете результат. Исходные материалы, объём переноса, внешние сервисы, домен, интеграции и специальные требования фиксируем до заключения договора.",
  },
  {
    question: "СИНТАГМА — это готовая полноценная СУОТ?",
    answer: "Нет. Стандартный тариф предназначен для курсов, групп, слушателей, контроля прохождения, тестов, журналов, приказов и протоколов. Индивидуальные модули СУОТ оцениваются после обследования и технического задания.",
  },
  {
    question: "Входит ли официальная интеграция с реестрами Минтруда?",
    answer: "Нет, подтверждённая официальная XML-интеграция с Минтрудом в стандартный тариф не включена. Такой функционал можно оценивать только после проверки актуальных требований и доступного способа интеграции.",
  },
  {
    question: "Вы проводите обучение и выдаёте документы об образовании?",
    answer: "Подготовка программ и предоставление программного продукта не являются проведением обучения. Само обучение возможно отдельно через партнёра с подходящей образовательной лицензией.",
  },
  {
    question: "Гарантирует ли сайт получение образовательной лицензии?",
    answer: "Нет. Мы создаём техническую площадку и размещаем согласованные сведения. Решение лицензирующего или надзорного органа зависит от всего комплекта требований организации, а не только от сайта.",
  },
  {
    question: "Может ли один ИП выполнить такую закупку?",
    answer: "Да, если предмет закупки соответствует узкому типовому пакету и в документации нет обязательного требования к конкретному составу команды. Для сложной разработки сначала оцениваем объём и необходимые компетенции.",
  },
  {
    question: "Цена включает НДС?",
    answer: "Исполнитель применяет налог на профессиональный доход, поэтому НДС в цену не включается. Точная формулировка указывается в коммерческом предложении и договоре.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: "Цифровые услуги для закупок",
  url: "https://24zxc.ru/zakupki",
  itemListElement: packages.map((item) => ({
    "@type": "Offer",
    priceCurrency: "RUB",
    price: item.price.replace(/\D/g, ""),
    itemOffered: { "@type": "Service", name: item.name },
  })),
};

const Procurement = () => (
  <>
    <Helmet>
      <title>Цифровые услуги для закупок — 24ZXC и СИНТАГМА</title>
      <meta name="description" content="Сайты, СИНТАГМА для учёта обучения и охраны труда, образовательные программы и документы с понятным результатом, сроком и ценой." />
      <link rel="canonical" href="https://24zxc.ru/zakupki" />
      <meta property="og:title" content="Цифровые услуги для закупок — 24ZXC и СИНТАГМА" />
      <meta property="og:description" content="Готовые пакеты цифровых услуг для организаций: результат, срок и цена фиксируются до договора." />
      <meta property="og:url" content="https://24zxc.ru/zakupki" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://24zxc.ru/og-image.png" />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>

    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[#15171e] text-white">
          <div className="absolute inset-0 opacity-20" aria-hidden="true" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
          }} />
          <div className="container relative px-4 py-20 md:py-28 lg:py-32">
            <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_.72fr] lg:gap-16">
              <div>
                <div className="mb-7 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                  <span className="rounded-full border border-[#d4be37]/50 bg-[#d4be37]/10 px-3 py-1.5 text-[#eadc82]">24ZXC × СИНТАГМА</span>
                  <span>Для организаций и учреждений</span>
                </div>
                <h1 className="max-w-5xl font-display text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">Цифровые услуги для закупок — с понятным результатом, сроком и ценой</h1>
                <p className="mt-7 max-w-3xl text-lg leading-relaxed text-white/70 md:text-xl">Сайты, система учёта обучения СИНТАГМА и подготовка учебных программ. Типовые задачи — готовыми пакетами, индивидуальная разработка — после согласования ТЗ.</p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a href="#services" className="landing-gold-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5">Выбрать услугу <ArrowDown className="h-4 w-4" /></a>
                  <a href="#contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/25 px-6 py-3 font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5">Запросить предложение <ArrowRight className="h-4 w-4" /></a>
                </div>
              </div>

              <aside className="rounded-xl border border-white/15 bg-white/[.06] p-6 shadow-2xl backdrop-blur-sm md:p-8" aria-label="Пакет для закупки">
                <div className="flex items-center justify-between border-b border-white/15 pb-5">
                  <div><p className="text-xs uppercase tracking-[0.18em] text-[#eadc82]">Пакет поставщика</p><h2 className="mt-2 font-display text-2xl font-semibold">Предмет закупки без лишнего</h2></div>
                  <PackageCheck className="h-8 w-8 text-[#d4be37]" />
                </div>
                <div className="divide-y divide-white/10">
                  {["Сайты и порталы", "СИНТАГМА и учёт обучения", "Программы и учебные материалы"].map((item) => (
                    <div key={item} className="flex items-center gap-3 py-4 text-sm text-white/80"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#d4be37]" /> {item}</div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">{["Договор", "Акт", "КЭП", "Без НДС"].map((item) => <span key={item} className="rounded-full border border-white/15 bg-black/10 px-3 py-1.5 text-xs text-white/65">{item}</span>)}</div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-[#fbfaf5]">
          <div className="container grid gap-px px-4 py-5 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            {["ИП · НПД", "Работа по договору", "Дистанционно по России", "Результат фиксируется до старта"].map((item) => <div key={item} className="flex items-center gap-2 py-2 lg:justify-center"><Check className="h-4 w-4 text-[#9b8816]" /> {item}</div>)}
          </div>
        </section>

        <section id="services" className="container px-4 py-20 md:py-24">
          <div className="max-w-3xl">
            <span className="landing-accent-rule" />
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ядро услуг</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">Три направления, которые можно точно описать в закупке</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">На каждой карточке — базовый результат, стартовая цена и ориентир по сроку. Финальный состав фиксируем в коммерческом предложении и договоре.</p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {directions.map((item, index) => (
              <article key={item.label} className="group flex min-h-[360px] flex-col rounded-xl border border-border bg-card p-7 shadow-[0_18px_50px_rgba(21,23,30,.06)] transition-all hover:-translate-y-1 hover:border-[#d4be37] md:p-8">
                <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">0{index + 1} · {item.label}</span><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fbf8e9] text-[#897814]"><item.icon className="h-5 w-5" /></span></div>
                <h3 className="mt-8 font-display text-2xl font-semibold leading-tight">{item.title}</h3>
                <p className="mt-4 flex-1 leading-relaxed text-muted-foreground">{item.description}</p>
                <div className="mt-7 border-t border-border pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-xl">{item.price}</strong><span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" /> {item.deadline}</span></div></div>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-lg border border-[#e8dfab] bg-[#fbf8e9] px-5 py-4 text-sm leading-relaxed text-[#423d20] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Портал поставщиков:</strong> оферты готовятся к публикации. До появления проверенных публичных ссылок направим коммерческое предложение под предмет вашей закупки.</p></div>
            <a href="/zakupki/monitoring" className="inline-flex shrink-0 items-center gap-2 font-semibold underline decoration-[#d4be37] decoration-2 underline-offset-4">Открыть тендерный радар <ArrowRight className="h-4 w-4" /></a>
          </div>
        </section>

        <section id="packages" className="border-y border-border bg-[#f7f7f5]">
          <div className="container px-4 py-20 md:py-24">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl"><p className="landing-eyebrow text-sm font-semibold uppercase tracking-[0.16em]">Типовые пакеты</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">Цена привязана к конкретному результату</h2></div>
              <a href="#contact" className="inline-flex items-center gap-2 text-sm font-semibold underline decoration-[#d4be37] decoration-2 underline-offset-8">Запросить КП <ArrowDown className="h-4 w-4" /></a>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((item) => (
                <article key={item.name} className={`flex flex-col rounded-xl border p-6 md:p-7 ${item.featured ? "border-[#8fdcca] bg-[#f1fbf8]" : "border-border bg-white"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div><p className={`text-xs font-bold uppercase tracking-[0.18em] ${item.featured ? "text-[#168c76]" : "text-muted-foreground"}`}>{item.category}</p><h3 className="mt-3 font-display text-2xl font-semibold leading-tight">{item.name}</h3></div>
                    {item.featured && <span className="rounded-full bg-[#55cdb1] px-3 py-1 text-xs font-semibold text-[#10211d]">Флагман</span>}
                  </div>
                  <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-y border-border py-5"><strong className="text-2xl">{item.price}</strong><span className="text-sm text-muted-foreground">{item.deadline}</span></div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Результат</p>
                  <ul className="mt-4 flex-1 space-y-3 text-sm leading-relaxed">{item.result.map((result) => <li key={result} className="flex gap-2.5"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${item.featured ? "text-[#189b82]" : "text-[#9b8816]"}`} /> {result}</li>)}</ul>
                  {item.note && <p className="mt-5 rounded-md bg-[#fbf8e9] px-4 py-3 text-xs leading-relaxed text-[#5a5126]">{item.note}</p>}
                  <a href="#contact" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">Получить описание для закупки <ArrowRight className="h-4 w-4" /></a>
                </article>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-dashed border-[#c9bb69] bg-white p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Индивидуальная разработка</p><h3 className="mt-2 font-display text-2xl font-semibold">Автоматизация, интеграции и отдельные модули</h3><p className="mt-2 max-w-3xl leading-relaxed text-muted-foreground">Стоимость и срок определяем только после обследования и согласования технического задания.</p></div>
              <a href="mailto:24@24zxc.ru?subject=Техническое%20задание%20на%20индивидуальную%20разработку" className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-md border border-foreground px-5 py-3 text-sm font-semibold md:mt-0">Отправить ТЗ <Send className="h-4 w-4" /></a>
            </div>
          </div>
        </section>

        <section id="syntagma" className="border-b border-border bg-white">
          <div className="container px-4 py-20 md:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[.95fr_1.05fr] lg:gap-16">
              <div>
                <img src="/brand/syntagma-logo.png" alt="СИНТАГМА" width="311" height="77" className="h-auto w-[260px] max-w-full" />
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-[#168c76]">Учёт обучения и охраны труда</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">Видно, кто зачислен, кто прошёл обучение и какие документы готовы</h2>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">Система объединяет курсы, группы, слушателей, статусы прохождения, тесты, журналы, приказы и протоколы проверки знаний.</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">{["Массовое зачисление", "Контроль статусов", "Тестирование", "Протоколы проверки знаний"].map((item) => <div key={item} className="flex items-center gap-2 rounded-md border border-[#cfe9e2] bg-[#f1fbf8] px-4 py-3 text-sm font-medium"><CheckCircle2 className="h-4 w-4 text-[#189b82]" /> {item}</div>)}</div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href="#contact" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#55cdb1] px-5 py-3 text-sm font-semibold text-[#111216] transition-opacity hover:opacity-90">Запросить демонстрацию <ArrowRight className="h-4 w-4" /></a>
                  <a href="https://синтагма.рф" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-[#85cdbd] px-5 py-3 text-sm font-semibold">Открыть сайт продукта <ArrowUpRight className="h-4 w-4" /></a>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#cfe9e2] bg-[#f1fbf8]">
                <div className="grid items-end gap-6 px-6 pt-8 sm:grid-cols-[1fr_235px] sm:px-8">
                  <div className="pb-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#168c76]">Стандартный тариф</p><p className="mt-3 font-display text-3xl font-semibold">16 990 ₽ / месяц</p><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Активация — до 3 рабочих дней после получения необходимых данных.</p><div className="mt-6 border-l-2 border-[#55cdb1] pl-4 text-sm leading-relaxed text-muted-foreground">Не заявляется как готовая полноценная СУОТ. Проведение обучения и официальная XML-интеграция с Минтрудом в тариф не входят.</div></div>
                  <img src="/brand/syntagma-mobile-app.png" alt="Интерфейс СИНТАГМА на смартфоне" width="446" height="641" loading="lazy" className="mx-auto w-full max-w-[235px] self-end" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="container px-4 py-20 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[.65fr_1.35fr] lg:gap-16">
            <div><p className="landing-eyebrow text-sm font-semibold uppercase tracking-[0.16em]">Как проходит закупка</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">От запроса до акта — четыре понятных шага</h2><p className="mt-5 leading-relaxed text-muted-foreground">Если в документации есть обязательные требования, сначала проверяем их выполнимость. Это помогает не обещать лишнего и точно принять результат.</p></div>
            <ol className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">{workflow.map((step, index) => <li key={step.title} className="bg-white p-6 md:p-8"><span className="font-display text-3xl text-[#b39e22]">0{index + 1}</span><h3 className="mt-5 text-lg font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p></li>)}</ol>
          </div>
          <div className="mt-16 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl bg-[#15171e] p-7 text-white md:p-9"><ClipboardCheck className="h-7 w-7 text-[#d4be37]" /><h3 className="mt-5 font-display text-2xl font-semibold">Что получает заказчик</h3><ul className="mt-6 space-y-4 text-sm text-white/70">{["Измеримый результат по согласованному составу", "Коммерческое предложение и договор", "Передачу результата и закрывающий акт", "Понятный канал связи на всём сроке работ"].map((item) => <li key={item} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d4be37]" /> {item}</li>)}</ul></div>
            <div className="rounded-xl border border-border bg-[#f7f7f5] p-7 md:p-9"><FileCheck2 className="h-7 w-7 text-[#9b8816]" /><h3 className="mt-5 font-display text-2xl font-semibold">Что нужно от заказчика</h3><ul className="mt-6 space-y-4 text-sm text-muted-foreground">{["Техническое задание или краткое описание задачи", "Утверждённые тексты, документы и изображения", "Доступы, если нужны домен, хостинг или интеграция", "Один ответственный за согласование результата"].map((item) => <li key={item} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9b8816]" /> {item}</li>)}</ul></div>
          </div>
        </section>

        <section id="faq" className="border-y border-border bg-[#f7f7f5]">
          <div className="container grid gap-12 px-4 py-20 md:py-24 lg:grid-cols-[.6fr_1.4fr] lg:gap-16">
            <div><p className="landing-eyebrow text-sm font-semibold uppercase tracking-[0.16em]">Вопросы</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-5xl">До заключения договора</h2><p className="mt-5 leading-relaxed text-muted-foreground">Короткие ответы про Портал поставщиков, лицензию, СИНТАГМУ и границы типовых пакетов.</p></div>
            <div className="divide-y divide-border border-y border-border">{faq.map((item) => <details key={item.question} className="group py-1"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-semibold marker:content-none"><span>{item.question}</span><ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" /></summary><p className="max-w-3xl pb-6 pr-8 text-sm leading-relaxed text-muted-foreground">{item.answer}</p></details>)}</div>
          </div>
        </section>

        <LandingContact initialService="Закупка / коммерческое предложение" eyebrow="Запрос для закупки" title="Получите описание, срок и цену" description="Пришлите ссылку на закупку, техническое задание или коротко опишите нужный результат. Проверим, подходит ли типовой пакет, и подготовим предложение." />
      </main>
      <Footer />
    </div>
  </>
);

export default Procurement;
