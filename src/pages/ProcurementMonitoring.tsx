import { useEffect, useId, useMemo, useState } from "react";
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
  RefreshCw,
  Search,
  LockKeyhole,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useProcurementControl, type ProcurementControl, type ProcurementInstruction, type ProcurementReference } from "@/hooks/use-procurement-control";
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

const statusLabels: Record<RadarStatus, string> = { waiting: "Ожидание ответа", clarify: "Уточнение", conditional: "Условное участие", strategy: "Проработка", partner: "Нужен партнёр", stop: "Не участвуем" };
const decisions = { work: "В работу", hold: "Отложить", watch: "Наблюдать" } as const;
const inputStyle = "w-full rounded-md border border-border bg-white px-3 py-2 text-sm disabled:opacity-60";
const buttonStyle = "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50";

export function snapshotAgeDays(label: string, now = new Date()): number | null {
  const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const match = label.match(/(\d{1,2})\s+([а-я]+)\s+(\d{4})/i);
  if (!match || !months.includes(match[2].toLowerCase())) return null;
  const day = Date.UTC(Number(match[3]), months.indexOf(match[2].toLowerCase()), Number(match[1]));
  const today = Date.parse(`${now.toLocaleDateString("sv-SE", { timeZone: "Asia/Vladivostok" })}T00:00:00Z`);
  return Number.isFinite(today) ? Math.max(0, Math.floor((today - day) / 86_400_000)) : null;
}

function InstructionEditor({ tender, existing, disabled, conflict, onSave }: {
  tender: ProcurementReference; existing?: ProcurementControl; disabled: boolean; conflict: boolean;
  onSave: (tender: ProcurementReference, input: ProcurementInstruction, expected?: ProcurementControl) => Promise<ProcurementControl>;
}) {
  const id = useId();
  const initial = (value?: ProcurementControl): ProcurementInstruction => ({ decision: value?.decision ?? "watch", priority: value?.priority ?? "normal", note: value?.note ?? "" });
  const [draft, setDraft] = useState<ProcurementInstruction>(() => initial(existing));
  const [baseline, setBaseline] = useState(existing);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  useEffect(() => { if (!dirty) { setDraft(initial(existing)); setBaseline(existing); } }, [existing, dirty]);
  const changedElsewhere = dirty && (existing?.id !== baseline?.id || existing?.updatedAt !== baseline?.updatedAt);
  const update = (patch: Partial<ProcurementInstruction>) => { setDraft((previous) => ({ ...previous, ...patch })); setDirty(true); setNotice(null); };
  return <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
    <summary className="cursor-pointer text-sm font-semibold"><LockKeyhole className="mr-1 inline h-4 w-4" /> Поручение в CRM{existing ? ` · ${decisions[existing.decision]}` : " · не создано"}</summary>
    <form className="mt-3 space-y-3" onSubmit={async (event) => {
      event.preventDefault(); setNotice(null);
      try {
        const saved = await onSave(tender, draft, baseline);
        setDraft(initial(saved)); setBaseline(saved); setDirty(false);
        setNotice({ error: false, text: "Поручение сохранено в CRM. Это действие не отправляло заявку на площадку." });
      } catch (error) { setNotice({ error: true, text: error instanceof Error ? error.message : "Сохранение не подтверждено." }); }
    }}>
      <p className="text-xs leading-relaxed text-muted-foreground">Поручение сохранится в CRM. Оно не отправляет заявку и не запускает агента автоматически: после сохранения напишите в задаче «продолжай». Заметки доступны только администраторам.</p>
      {conflict && <p role="alert" className="text-sm text-rose-700">По этому номеру несколько поручений. Проверьте дубликаты в планере CRM.</p>}
      {changedElsewhere && <p role="alert" className="text-sm text-amber-800">В CRM появилась другая версия. Ваш черновик сохранён на экране. Сверьте данные перед сохранением.</p>}
      <fieldset disabled={disabled || conflict} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium" htmlFor={`${id}-decision`}>Решение<select id={`${id}-decision`} className={`${inputStyle} mt-1`} value={draft.decision} onChange={(event) => update({ decision: event.target.value as ProcurementInstruction["decision"] })}>{Object.entries(decisions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-medium" htmlFor={`${id}-priority`}>Приоритет<select id={`${id}-priority`} className={`${inputStyle} mt-1`} value={draft.priority} onChange={(event) => update({ priority: event.target.value as ProcurementInstruction["priority"] })}><option value="normal">Обычный</option><option value="high">Высокий</option></select></label>
        </div>
        <label className="block text-xs font-medium" htmlFor={`${id}-note`}>Комментарий<textarea id={`${id}-note`} className={`${inputStyle} mt-1 min-h-24`} maxLength={4000} value={draft.note} onChange={(event) => update({ note: event.target.value })} placeholder="Что проверить, подготовить или уточнить" /></label>
        <button type="submit" className={buttonStyle} disabled={changedElsewhere}>Сохранить поручение</button>
        {changedElsewhere && <button type="button" className={`${buttonStyle} ml-2`} onClick={() => { setDraft(initial(existing)); setBaseline(existing); setDirty(false); setNotice(null); }}>Загрузить версию CRM</button>}
      </fieldset>
      {dirty && <p className="text-xs text-amber-800">На экране есть несохранённые изменения.</p>}
      {existing && <p className="text-xs text-muted-foreground">Ответ CRM: {new Date(existing.updatedAt).toLocaleString("ru-RU")} · задача {existing.id.slice(0, 8)}</p>}
      {notice && <p role={notice.error ? "alert" : "status"} className={`text-sm ${notice.error ? "text-rose-700" : "text-emerald-800"}`}>{notice.text}</p>}
    </form>
  </details>;
}

const ProcurementMonitoring = () => {
  const { user, isAdmin, isLoading: authLoading } = useAdminAuth();
  const canManage = Boolean(user && isAdmin && !authLoading);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RadarStatus | "all" | "deferred">("all");
  const numbers = useMemo(() => [...currentCandidates, ...deferredCandidates].map((item) => item.number), []);
  const control = useProcurementControl({ enabled: canManage, userId: user?.id, numbers });
  const term = search.trim().toLocaleLowerCase("ru-RU");
  const matchesSearch = (item: ProcurementReference) => `${item.number} ${item.title}`.toLocaleLowerCase("ru-RU").includes(term);
  const current = currentCandidates.filter((item) => matchesSearch(item) && (status === "all" || status === item.status));
  const deferred = deferredCandidates.filter((item) => matchesSearch(item) && ["all", "deferred", "stop"].includes(status));
  const availableStatuses = [...new Set(currentCandidates.map((item) => item.status))];
  const age = snapshotAgeDays(monitoringUpdatedAt);
  const renderEditor = (item: ProcurementReference) => canManage ? <InstructionEditor key={`instruction-${item.number}`} tender={item} existing={control.controls[item.number]}
    disabled={control.isLoading || control.isRefreshing || control.isSaving || Boolean(control.error)} conflict={control.conflicts.includes(item.number)}
    onSave={(tender, input, expected) => control.save({ tender, input, expected })} /> : null;
  return (
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
          <div className="container px-4 py-6 md:py-8">
            <Link to="/zakupki" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Назад к услугам
            </Link>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-4xl">
                <p className="landing-eyebrow flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]"><Radar className="h-4 w-4" /> Рабочий реестр 24ZXC</p>
                <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">Закупки и следующие действия</h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Текущие процедуры, доступность площадок и возможности, к которым готовимся.</p>
              </div>
              <div className="rounded-lg border border-[#e8dfab] bg-[#fbf8e9] px-5 py-4 text-sm">
                <div className="flex items-center gap-2 font-semibold"><CalendarClock className="h-4 w-4" /> Проверка источников</div>
                <p className="mt-1 text-muted-foreground">{monitoringUpdatedAt}</p>
                <button type="button" className={`${buttonStyle} mt-2`} onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4" /> Обновить страницу</button>
              </div>
            </div>

            <p role="note" className={`mt-3 rounded-md border p-3 text-xs leading-relaxed ${age !== null && age > 0 ? "border-amber-300 bg-amber-50 text-amber-950" : "border-border bg-slate-50"}`}>{age !== null && age > 0 ? `Снимку ${age} дн. Сроки и доступность могли измениться. ` : "Сроки и доступность могут измениться после проверки. "}Обновление реестра — после проверки источников, без фонового автопоиска. Кнопка загружает опубликованную версию страницы, а не проверяет площадки заново.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_230px]">
              <label className="relative"><span className="sr-only">Поиск по названию или номеру закупки</span><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input className={`${inputStyle} pl-9`} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Название или номер закупки" /></label>
              <label><span className="sr-only">Статус закупки</span><select className={inputStyle} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">Все статусы</option>{availableStatuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}<option value="deferred">Отложенные закупки</option></select></label>
            </div>
            <nav className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Разделы тендерного радара">
              <a href="#current" className="rounded-full border border-border bg-white px-4 py-2 font-medium hover:border-[#d4be37]">Текущие закупки</a>
              <a href="#platforms" className="rounded-full border border-border bg-white px-4 py-2 font-medium hover:border-[#d4be37]">Площадки</a>
              <a href="#plans" className="rounded-full border border-border bg-white px-4 py-2 font-medium hover:border-[#d4be37]">Планы октября–ноября</a>
              <a href="#deferred" className="rounded-full border border-border bg-white px-4 py-2 font-medium hover:border-[#d4be37]">Архив и потенциал</a>
              <a href="#growth" className="rounded-full border border-border bg-white px-4 py-2 font-medium hover:border-[#d4be37]">План роста</a>
            </nav>

            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
              {[
                { icon: SearchCheck, value: String(currentCandidates.length), label: "кандидатов в реестре" },
                { icon: Eye, value: String(platformAccess.length), label: "площадок и источников" },
                { icon: CircleDot, value: String(platformAccess.filter((item) => item.state !== "open").length), label: "источников с ограничениями" },
                { icon: TrendingUp, value: String(deferredCandidates.length), label: "в архиве и потенциале" },
              ].map((item) => (
                <div key={item.label} className="bg-white px-4 py-3">
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            {canManage ? <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"><span className="inline-flex items-center gap-1 font-medium"><LockKeyhole className="h-4 w-4" /> Администратор</span><span className="text-xs text-muted-foreground">Поручения — задачи CRM. {control.isLoading ? "Загружаем…" : control.error ? "Данные не получены." : `Загружено: ${Object.keys(control.controls).length}.`}</span><button type="button" className={buttonStyle} disabled={control.isRefreshing || control.isSaving} onClick={() => { void control.refetch(); }}><RefreshCw className={`h-4 w-4 ${control.isRefreshing ? "animate-spin" : ""}`} /> Обновить поручения</button><Link to="/admin" className="text-xs underline">Открыть CRM</Link></div>
              : <p className="mt-3 text-xs text-muted-foreground">Публичный реестр открыт для просмотра. <Link to="/admin" className="underline">Войти в CRM</Link> для приватных поручений.</p>}
            {canManage && control.error && <p role="alert" className="mt-3 text-sm text-rose-700">{control.error.message}</p>}
          </div>
        </section>

        <section id="current" className="container scroll-mt-20 px-4 py-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><h2 className="font-display text-2xl font-semibold">Текущие закупки</h2><p className="mt-1 text-xs text-muted-foreground">Показано {current.length} из {currentCandidates.length}</p></div>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">Статус — результат проверки. Поручение «В работу» не подтверждает подачу, допуск или победу.</p>
          </div>

          {current.length === 0 && <p className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">В текущем разделе нет закупок по выбранному фильтру. Проверьте отложенные или измените поиск.</p>}
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {current.map((item) => (
              <article key={item.number} className="flex flex-col rounded-xl border border-border bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${candidateStyles[item.status]}`}>● {item.statusLabel}</span>
                  <span className="text-sm text-muted-foreground">{item.platform}</span>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">№ {item.number}</p>
                <h3 className="mt-2 font-display text-xl font-semibold leading-tight">{item.title}</h3>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-b border-border pb-3"><strong>{item.price}</strong><span className="text-sm text-muted-foreground">Срок: {item.deadline}</span></div>
                <p className="mt-3 text-sm leading-relaxed"><strong>Следующий шаг:</strong> {item.nextStep}</p>
                <details className="mt-3 text-sm leading-relaxed"><summary className="cursor-pointer font-medium">Подтверждения и ограничения</summary><dl className="mt-3 space-y-3">
                  <div><dt className="font-semibold">Что подтверждено</dt><dd className="text-muted-foreground">{item.confirmed}</dd></div>
                  <div><dt className="font-semibold">Что ещё требуется</dt><dd className="text-muted-foreground">{item.blocker}</dd></div>
                </dl></details>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Открыть источник <ArrowUpRight className="h-4 w-4" /></a>
                {renderEditor(item)}
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
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Плановая строка не равна открытому приёму заявок. Ниже — найденная выборка и результат её проверки.</p>
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">Архив и потенциал</p>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-5xl">Не прячем упущенные возможности — показываем, что откроет доступ</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">Здесь завершённые и отложенные закупки: результат, причина и следующий шаг. Архивная оценка не заменяет проверку условий новой процедуры.</p>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">Показано {deferred.length} из {deferredCandidates.length}{deferred.length === 0 ? " — нет отложенных закупок по выбранному фильтру." : ""}</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-white">
            {deferred.map((item, index) => (
              <article key={item.number} className={`grid gap-5 p-6 md:grid-cols-[1fr_1fr] md:p-7 ${index ? "border-t border-border" : ""}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800">{item.statusLabel ?? "Архив / отложено"}</span><span className="text-xs text-muted-foreground">№ {item.number}</span></div>
                  <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 font-semibold">{item.price}</p>
                </div>
                <div className="text-sm leading-relaxed">
                  <p><strong>Причина:</strong> <span className="text-muted-foreground">{item.reason}</span></p>
                  <p className="mt-3"><strong>Как открыть доступ:</strong> <span className="text-muted-foreground">{item.unlock}</span></p>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 font-semibold">Источник <ArrowUpRight className="h-3.5 w-3.5" /></a>
                  {renderEditor(item)}
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
};

export default ProcurementMonitoring;
