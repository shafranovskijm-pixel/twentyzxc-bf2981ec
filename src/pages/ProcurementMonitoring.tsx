import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CircleDot,
  Eye,
  Radar,
  SearchCheck,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  currentCandidates,
  deferredCandidates,
  futurePlans,
  growthRoadmap,
  monitoringUpdatedAt,
  platformAccess,
  type RadarStatus,
} from "@/data/procurement-monitoring";

const candidateStyles: Record<RadarStatus, string> = {
  waiting: "border-blue-200 bg-blue-50 text-blue-800",
  clarify: "border-amber-200 bg-amber-50 text-amber-800",
  conditional: "border-violet-200 bg-violet-50 text-violet-800",
  strategy: "border-teal-200 bg-teal-50 text-teal-800",
  partner: "border-violet-200 bg-violet-50 text-violet-800",
  stop: "border-rose-200 bg-rose-50 text-rose-800",
};

const platformStyles: Record<string, string> = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-800",
  partial: "border-amber-200 bg-amber-50 text-amber-800",
  blocked: "border-rose-200 bg-rose-50 text-rose-800",
};

const ProcurementMonitoring = () => (
  <>
    <Helmet>
      <title>Тендерный радар — текущие закупки и площадки | 24ZXC</title>
      <meta name="description" content="Текущие закупки, доступность площадок, причины отказа и план роста 24ZXC и СИНТАГМА." />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href="https://24zxc.ru/zakupki/monitoring" />
      <meta property="og:title" content="Тендерный радар 24ZXC" />
      <meta property="og:description" content="Что готовим, что уточняем, где нужен партнёр и какие площадки доступны." />
      <meta property="og:url" content="https://24zxc.ru/zakupki/monitoring" />
      <meta property="og:type" content="website" />
    </Helmet>

    <div className="min-h-screen bg-[#f7f7f5] text-foreground">
      <Header />
      <main>
        <section className="border-b border-border bg-white">
          <div className="container px-4 py-12 md:py-16">
            <Link to="/zakupki" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Назад к услугам
            </Link>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-4xl">
                <p className="landing-eyebrow flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]"><Radar className="h-4 w-4" /> Рабочий реестр 24ZXC</p>
                <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-6xl">Тендерный радар без скрытых отказов</h1>
                <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">Показываем найденные процедуры, ограничения площадок и причины, по которым закупку готовим, уточняем или откладываем до усиления поставщика.</p>
              </div>
              <div className="rounded-lg border border-[#e8dfab] bg-[#fbf8e9] px-5 py-4 text-sm">
                <div className="flex items-center gap-2 font-semibold"><CalendarClock className="h-4 w-4" /> Проверено</div>
                <p className="mt-1 text-muted-foreground">{monitoringUpdatedAt}</p>
              </div>
            </div>

            <nav className="mt-9 flex flex-wrap gap-2 text-sm" aria-label="Разделы тендерного радара">
              <a href="#current" className="rounded-full border border-border bg-white px-4 py-2 font-medium hover:border-[#d4be37]">Текущие закупки</a>
              <a href="#platforms" className="rounded-full border border-border bg-white px-4 py-2 font-medium hover:border-[#d4be37]">Площадки</a>
              <a href="#plans" className="rounded-full border border-border bg-white px-4 py-2 font-medium hover:border-[#d4be37]">Планы октября–ноября</a>
              <a href="#deferred" className="rounded-full border border-border bg-white px-4 py-2 font-medium hover:border-[#d4be37]">Пока не участвуем</a>
              <a href="#growth" className="rounded-full border border-border bg-white px-4 py-2 font-medium hover:border-[#d4be37]">План роста</a>
            </nav>

            <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: SearchCheck, value: String(currentCandidates.length), label: "текущих кандидатов" },
                { icon: Eye, value: String(platformAccess.length), label: "площадок и источников" },
                { icon: CircleDot, value: "0", label: "безусловно зелёных" },
                { icon: TrendingUp, value: String(growthRoadmap.length), label: "направлений роста" },
              ].map((item) => (
                <div key={item.label} className="bg-white p-5">
                  <item.icon className="h-5 w-5 text-[#9b8816]" />
                  <p className="mt-4 text-3xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-[#15171e] text-white">
          <div className="container grid gap-4 px-4 py-6 text-sm md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Готовим", "Документы прочитаны, требования и экономика подтверждены."],
              ["Уточняем", "Есть совпадение, но не хватает документов или ответа."],
              ["Партнёр", "Сами не закрываем обязательное требование или объём."],
              ["Не участвуем", "Есть жёсткий допуск, который сейчас отсутствует."],
            ].map(([title, text]) => (
              <div key={title} className="border-l border-white/20 pl-4"><p className="font-semibold text-[#eadc82]">{title}</p><p className="mt-1 leading-relaxed text-white/60">{text}</p></div>
            ))}
          </div>
        </section>

        <section id="current" className="container scroll-mt-20 px-4 py-16 md:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Текущие</p><h2 className="mt-2 font-display text-3xl font-semibold md:text-5xl">Кандидаты на сегодня</h2></div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">Статус — рабочая квалификация, а не подтверждение подачи или допуска. Перед любым действием повторно сверяем официальные документы.</p>
          </div>

          <div className="mt-9 grid gap-5 xl:grid-cols-2">
            {currentCandidates.map((item) => (
              <article key={item.number} className="flex flex-col rounded-xl border border-border bg-white p-6 shadow-[0_16px_40px_rgba(21,23,30,.05)] md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${candidateStyles[item.status]}`}>● {item.statusLabel}</span>
                  <span className="text-sm text-muted-foreground">{item.platform}</span>
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">№ {item.number}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">{item.title}</h3>
                <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 border-b border-border pb-5"><strong className="text-xl">{item.price}</strong><span className="text-sm text-muted-foreground">до {item.deadline}</span></div>

                <dl className="mt-5 flex-1 space-y-4 text-sm leading-relaxed">
                  <div><dt className="font-semibold text-foreground">Что подтверждено</dt><dd className="mt-1 text-muted-foreground">{item.confirmed}</dd></div>
                  <div><dt className="font-semibold text-foreground">Почему не подаём прямо сейчас</dt><dd className="mt-1 text-muted-foreground">{item.blocker}</dd></div>
                  <div><dt className="font-semibold text-foreground">Следующий шаг</dt><dd className="mt-1 text-muted-foreground">{item.nextStep}</dd></div>
                </dl>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">Открыть источник <ArrowUpRight className="h-4 w-4" /></a>
              </article>
            ))}
          </div>
        </section>

        <section id="plans" className="scroll-mt-20 border-y border-border bg-[#fbfaf5]">
          <div className="container px-4 py-14 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[.65fr_1.35fr] lg:gap-14">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8c7a13]">Планы закупок</p>
                <h2 className="mt-3 font-display text-3xl font-semibold">Октябрь и ноябрь 2026</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">В проверенной официальной выборке подходящих конкурентных строк пока нет. Это не означает, что новые извещения не появятся после изменения планов.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {futurePlans.map((plan) => (
                  <article key={`${plan.customer}-${plan.subject}`} className="rounded-lg border border-border bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{plan.customer}</span><span>{plan.month}</span></div>
                    <h3 className="mt-3 font-semibold">{plan.subject}</h3>
                    <p className="mt-2 text-lg font-semibold">{plan.price}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.verdict}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="platforms" className="scroll-mt-20 border-y border-border bg-white">
          <div className="container px-4 py-16 md:py-20">
            <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="landing-eyebrow text-xs font-bold uppercase tracking-[0.18em]">Контур поиска</p>
                <h2 className="mt-3 font-display text-3xl font-semibold md:text-5xl">Что просматриваем и где есть ограничения</h2>
                <p className="mt-5 leading-relaxed text-muted-foreground">Тайм-аут означает временную техническую недоступность нашего канала, а не отсутствие закупок. Вход и КЭП обычно нужны для участия, а не для обычного публичного поиска.</p>
                <div className="mt-7 rounded-lg border border-[#e8dfab] bg-[#fbf8e9] p-5 text-sm leading-relaxed text-[#4f4827]">
                  <strong>Агрегаторы</strong> Synapse, B2B.House, ПоискТендеров и Energybase используем только для обнаружения и резервной проверки. Решение принимаем по официальной карточке и документам.
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {platformAccess.map((platform) => (
                  <article key={platform.name} className="rounded-xl border border-border bg-[#f7f7f5] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{platform.name}</h3>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${platformStyles[platform.state]}`}>{platform.stateLabel}</span>
                    </div>
                    <dl className="mt-5 space-y-3 text-sm leading-relaxed">
                      <div><dt className="font-semibold">Видим</dt><dd className="mt-1 text-muted-foreground">{platform.visible}</dd></div>
                      <div><dt className="font-semibold">Ограничение</dt><dd className="mt-1 text-muted-foreground">{platform.blocked}</dd></div>
                      <div><dt className="font-semibold">Что делаем</dt><dd className="mt-1 text-muted-foreground">{platform.action}</dd></div>
                    </dl>
                    <a href={platform.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold">Площадка <ArrowUpRight className="h-3.5 w-3.5" /></a>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="deferred" className="container scroll-mt-20 px-4 py-16 md:py-20">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Пока не участвуем</p>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-5xl">Не прячем упущенные возможности — показываем, что откроет доступ</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">Красный статус не всегда означает «никогда». Он фиксирует конкретное обязательное условие, которого сейчас нет.</p>
          </div>

          <div className="mt-9 overflow-hidden rounded-xl border border-border bg-white">
            {deferredCandidates.map((item, index) => (
              <article key={item.number} className={`grid gap-5 p-6 md:grid-cols-[1fr_1fr] md:p-7 ${index ? "border-t border-border" : ""}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">Не участвуем сейчас</span><span className="text-xs text-muted-foreground">№ {item.number}</span></div>
                  <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 font-semibold">{item.price}</p>
                </div>
                <div className="text-sm leading-relaxed">
                  <p><strong>Причина:</strong> <span className="text-muted-foreground">{item.reason}</span></p>
                  <p className="mt-3"><strong>Как открыть доступ:</strong> <span className="text-muted-foreground">{item.unlock}</span></p>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 font-semibold">Источник <ArrowUpRight className="h-3.5 w-3.5" /></a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="growth" className="scroll-mt-20 border-y border-border bg-[#15171e] text-white">
          <div className="container px-4 py-16 md:py-20">
            <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#eadc82]">Потенциал</p>
                <h2 className="mt-3 font-display text-3xl font-semibold md:text-5xl">Что увеличит число доступных закупок</h2>
                <p className="mt-5 leading-relaxed text-white/60">Рост — это не обещание взять любой контракт. Это последовательное закрытие допусков, опыта, партнёров, функций продукта и финансовых ограничений.</p>
              </div>
              <ol className="space-y-4">
                {growthRoadmap.map((item, index) => (
                  <li key={item.title} className="grid gap-4 rounded-xl border border-white/15 bg-white/[.05] p-5 sm:grid-cols-[52px_1fr] sm:p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4be37]/50 font-display text-xl text-[#eadc82]">{index + 1}</span>
                    <div><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="container px-4 py-14 md:py-16">
            <div className="grid gap-6 rounded-xl border border-[#e8dfab] bg-[#fbf8e9] p-7 md:grid-cols-[1fr_auto] md:items-center md:p-9">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#6f631c]"><ShieldAlert className="h-5 w-5" /> Контрольная точка</div>
                <h2 className="mt-3 font-display text-2xl font-semibold md:text-3xl">Перед отправкой заявки — отдельное решение владельца ИП</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">Поиск и подготовку ведём до последнего шага. Итоговая цена, отправка, КЭП, обеспечение и заключение контракта выполняются только после подтверждения по конкретной закупке.</p>
              </div>
              <Link to="/zakupki#contact" className="landing-gold-btn inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold">Предложить закупку <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  </>
);

export default ProcurementMonitoring;
