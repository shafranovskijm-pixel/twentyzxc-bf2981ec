import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileDown,
  FileSignature,
  ListTodo,
  Loader2,
  Mail,
  PhoneCall,
  Save,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob, generatePdfBlob, safePdfFilename } from "@/lib/document-pdf";
import { generateTwentyEightProposalHtml } from "@/lib/twenty-eight-documents";

const PROJECT_STAGES = [
  "Новый запрос",
  "Запрошены документы",
  "Аудит программ",
  "Согласование мэппинга",
  "Подготовка пакета",
  "Отправлено на подпись",
  "Подано в лицензирующий орган",
  "Уточнения",
  "Изменения внесены в реестр",
  "Завершено",
  "Приостановлено",
];

const PROJECT_STEPS = [
  "Получить документы",
  "Проверить 26 программ",
  "Сопоставить до 18 кандидатов",
  "Согласовать спорные позиции",
  "Подготовить пакет",
  "Подать заявление",
  "Зафиксировать результат",
];

const DEFAULT_CALL_SCRIPT = "Добрый день. Меня зовут Максим Шафрановский. Сопровождаю ООО УЦ «ТЕХНОСЕРВИС», лицензия Л035-01213-63/00617723. Готовим заявление до 1 сентября по 28-ФЗ. Подскажите, пожалуйста: можно ли включить все программы в одно заявление; какие области и виды профессиональной деятельности указывать по приказам Ростехнадзора № 155, Минприроды № 755 и МЧС № 596; какие приложения нужны; как подавать программы, если в типовой ДПП нет прямого мэппинга? У нас готова таблица, можем направить на предварительную проверку.";

const DEFAULT_EMAIL_SUBJECT = "ООО УЦ «ТЕХНОСЕРВИС» — уточнение порядка внесения изменений в реестр лицензий по 28-ФЗ";

const DEFAULT_EMAIL_BODY = "Добрый день! Сопровождаем ООО УЦ «ТЕХНОСЕРВИС» (ИНН 6382090879, лицензия Л035-01213-63/00617723) при подготовке заявления о внесении в реестр лицензий областей и видов профессиональной деятельности по ДПП, разработанным на основании типовых программ. Просим сообщить: 1) допустимо ли подать одно заявление по нескольким программам; 2) какие области и виды указывать по приказам № 155, № 755 и № 596; 3) какие документы приложить; 4) как действовать при отсутствии прямого мэппинга в типовой программе; 5) можно ли направить таблицу на предварительную проверку. С уважением, Максим Шафрановский, +7 (914) 721-34-24, support@sintagma.com.ru.";

type ProjectStatus = "active" | "done" | "paused";
type RiskLevel = "low" | "medium" | "high";

interface ClientProject {
  id: string;
  client_id: string;
  service_type: string;
  price: number;
  stage: string;
  status: ProjectStatus;
  progress_completed: number;
  progress_total: number;
  next_step: string | null;
  next_step_at: string | null;
  risk_level: RiskLevel;
  risk_note: string | null;
  scope_summary: string | null;
  call_script: string | null;
  email_subject: string | null;
  email_body: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectClientData {
  id: string;
  name: string;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  legal_address?: string | null;
  director_name?: string | null;
  email?: string | null;
}

interface ActiveProject extends ClientProject {
  clients: { id: string; name: string } | null;
}

const riskConfig: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: "Низкий риск", className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  medium: { label: "Нужен контроль", className: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  high: { label: "Высокий риск", className: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
};

const formatMoney = (value: number) => `${Number(value || 0).toLocaleString("ru-RU")} ₽`;

const formatDateTime = (value?: string | null) => value
  ? new Date(value).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
  : "не назначено";

const getDueState = (value?: string | null) => {
  if (!value) {
    return {
      label: "Срок не назначен",
      shortLabel: "Без срока",
      tone: "border-border bg-muted/40 text-muted-foreground",
      isOverdue: false,
    };
  }

  const target = new Date(value);
  const diffMinutes = Math.round((target.getTime() - Date.now()) / 60_000);
  const absoluteMinutes = Math.abs(diffMinutes);
  const days = Math.max(1, Math.ceil(absoluteMinutes / 1_440));
  const time = target.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  if (diffMinutes < 0) {
    return {
      label: `Просрочено на ${days} дн. · ${formatDateTime(value)}`,
      shortLabel: `Просрочено ${days} дн.`,
      tone: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300",
      isOverdue: true,
    };
  }

  if (diffMinutes <= 1_440) {
    return {
      label: `Сегодня в ${time}`,
      shortLabel: `Сегодня ${time}`,
      tone: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      isOverdue: false,
    };
  }

  return {
    label: `Через ${days} дн. · ${formatDateTime(value)}`,
    shortLabel: `Через ${days} дн.`,
    tone: "border-primary/30 bg-primary/10 text-primary",
    isOverdue: false,
  };
};

const toLocalInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const copyText = async (value: string, label: string) => {
  await navigator.clipboard.writeText(value);
  toast.success(`${label} скопирован`);
};

export function ActiveProjectsOverview({ onOpenClient }: { onOpenClient: (clientId: string) => void }) {
  const { data: projects = [], isError } = useQuery({
    queryKey: ["active-client-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_projects")
        .select("*, clients(id,name)")
        .eq("status", "active")
        .order("next_step_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as unknown as ActiveProject[];
    },
    retry: 1,
    staleTime: 60_000,
  });

  if (isError || projects.length === 0) return null;

  const highRiskCount = projects.filter((project) => project.risk_level === "high").length;
  const overdueCount = projects.filter((project) => getDueState(project.next_step_at).isOverdue).length;

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Фокус работы
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Ближайшие действия по активным клиентам — без поиска по таблице.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">В работе: {projects.length}</Badge>
            {overdueCount > 0 && <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300">Просрочено: {overdueCount}</Badge>}
            {highRiskCount > 0 && <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">Высокий риск: {highRiskCount}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.slice(0, 6).map((project) => {
          const progress = Math.min(100, Math.round(project.progress_completed / Math.max(1, project.progress_total) * 100));
          const dueState = getDueState(project.next_step_at);
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpenClient(project.client_id)}
              className={`group relative overflow-hidden rounded-xl border bg-background/80 p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md ${dueState.isOverdue ? "border-red-500/40" : ""}`}
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent opacity-70" />
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{project.clients?.name || "Клиент"}</p>
                  <p className="mt-0.5 truncate text-[11px] uppercase tracking-wide text-muted-foreground">{project.service_type}</p>
                </div>
                <Badge variant="outline" className={riskConfig[project.risk_level].className}>{riskConfig[project.risk_level].label}</Badge>
              </div>

              <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Следующее действие</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{project.next_step || "Указать следующий шаг"}</p>
                <div className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${dueState.tone}`}>
                  <Clock3 className="h-3 w-3" /> {dueState.shortLabel}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-primary">{project.stage}</span>
                <span className="shrink-0 font-semibold">{formatMoney(project.price)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={progress} className="h-1.5 flex-1" />
                <span className="w-8 text-right text-[11px] text-muted-foreground">{progress}%</span>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 text-xs font-medium text-primary opacity-80 transition group-hover:opacity-100">
                Открыть клиента <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function ClientProjectPanel({
  client,
  onGenerateContract,
}: {
  client: ProjectClientData;
  onGenerateContract: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<ClientProject>>({});
  const [makingProposal, setMakingProposal] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["client-project", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_projects")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ClientProject | null;
    },
    enabled: Boolean(client.id),
  });

  useEffect(() => {
    if (project) setDraft(project);
  }, [project]);

  const saveProject = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("Проект не создан");
      const nextStepAt = draft.next_step_at
        ? new Date(draft.next_step_at).toISOString()
        : null;
      const { error } = await supabase.from("client_projects").update({
        service_type: draft.service_type,
        price: Number(draft.price || 0),
        stage: draft.stage,
        status: draft.status,
        progress_completed: Number(draft.progress_completed || 0),
        progress_total: Number(draft.progress_total || PROJECT_STEPS.length),
        next_step: draft.next_step || null,
        next_step_at: nextStepAt,
        risk_level: draft.risk_level,
        risk_note: draft.risk_note || null,
        scope_summary: draft.scope_summary || null,
        call_script: draft.call_script || null,
        email_subject: draft.email_subject || null,
        email_body: draft.email_body || null,
      }).eq("id", project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-project", client.id] });
      queryClient.invalidateQueries({ queryKey: ["active-client-projects"] });
      toast.success("Этап и следующий шаг сохранены");
    },
    onError: () => toast.error("Не удалось сохранить проект"),
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("client_projects").insert({
        client_id: client.id,
        service_type: "Лицензионный комплаенс 28-ФЗ",
        price: 35000,
        stage: "Новый запрос",
        status: "active",
        progress_completed: 0,
        progress_total: PROJECT_STEPS.length,
        next_step: "Запросить полный комплект программ и приказы об утверждении",
        risk_level: "medium",
        risk_note: "Не заполнять области и виды деятельности без прямого основания или согласования.",
        scope_summary: "Аудит 26 программ; сопоставление до 18 кандидатов; одно согласование; один пакет; одна подача; одна отработка формального замечания. Разработка программ не входит.",
        call_script: DEFAULT_CALL_SCRIPT,
        email_subject: DEFAULT_EMAIL_SUBJECT,
        email_body: DEFAULT_EMAIL_BODY,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-project", client.id] });
      queryClient.invalidateQueries({ queryKey: ["active-client-projects"] });
      toast.success("Проект 28-ФЗ создан");
    },
    onError: () => toast.error("Не удалось создать проект"),
  });

  const createTask = async () => {
    const title = `Позвонить в ЦПО Самарской области по 28-ФЗ — ${client.name}`;
    const due = draft.next_step_at ? new Date(draft.next_step_at) : new Date();
    const taskDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
    const { data: existing } = await supabase.from("tasks").select("id").eq("client_id", client.id).eq("title", title).eq("task_date", taskDate).maybeSingle();
    if (existing) return toast.info("Такая задача уже есть в планировщике");
    const description = `Телефон ЦПО: (846) 332-49-03. Время: ${formatDateTime(draft.next_step_at)}.\n\n${draft.call_script || DEFAULT_CALL_SCRIPT}`;
    const { error } = await supabase.from("tasks").insert({ title, description, task_date: taskDate, status: "todo", sort_order: 0, client_id: client.id });
    if (error) return toast.error("Не удалось создать задачу");
    await supabase.from("client_interactions").insert({ client_id: client.id, interaction_type: "note", content: `Создана задача: ${title} (${formatDateTime(draft.next_step_at)})` });
    queryClient.invalidateQueries({ queryKey: ["planner-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["client-history-tasks", client.id] });
    queryClient.invalidateQueries({ queryKey: ["client-interactions", client.id] });
    toast.success("Задача добавлена в планировщик");
  };

  const progress = useMemo(() => Math.min(100, Math.round(Number(draft.progress_completed || 0) / Math.max(1, Number(draft.progress_total || PROJECT_STEPS.length)) * 100)), [draft.progress_completed, draft.progress_total]);
  const completedSteps = Math.min(PROJECT_STEPS.length, Number(draft.progress_completed || 0));
  const currentStepIndex = Math.min(PROJECT_STEPS.length - 1, completedSteps);
  const dueState = getDueState(draft.next_step_at);
  const isDirty = useMemo(() => {
    if (!project) return false;
    const fields: Array<keyof ClientProject> = [
      "service_type",
      "price",
      "stage",
      "status",
      "progress_completed",
      "progress_total",
      "next_step",
      "next_step_at",
      "risk_level",
      "risk_note",
      "scope_summary",
      "call_script",
      "email_subject",
      "email_body",
    ];
    return fields.some((field) => String(draft[field] ?? "") !== String(project[field] ?? ""));
  }, [draft, project]);

  const makeProposal = async () => {
    try {
      setMakingProposal(true);
      const html = generateTwentyEightProposalHtml({
        name: client.name,
        license: client.inn === "6382090879" ? "Л035-01213-63/00617723 от 27.09.2022" : undefined,
        director: client.director_name || undefined,
        email: client.email || undefined,
      }, {
        price: Number(draft.price || 35000),
        scopeSummary: draft.scope_summary,
        riskNote: draft.risk_note,
      });
      const blob = await generatePdfBlob(html, { title: `КП 28-ФЗ — ${client.name}` });
      downloadBlob(blob, safePdfFilename(`КП_${client.name}_28-ФЗ.pdf`));
      toast.success("КП сформировано");
    } catch {
      toast.error("Не удалось сформировать КП");
    } finally {
      setMakingProposal(false);
    }
  };

  if (isLoading) return <div className="flex justify-center rounded-lg border p-5"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (!project) {
    return (
      <Card className="border-dashed border-primary/40">
        <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex-1"><p className="font-semibold">Работа с клиентом</p><p className="text-sm text-muted-foreground">Добавьте проект, чтобы видеть этап, следующий шаг, риск, документы и сценарии.</p></div>
          <Button onClick={() => createProject.mutate()} disabled={createProject.isPending}><BriefcaseBusiness className="mr-2 h-4 w-4" />Проект 28-ФЗ</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/40 bg-card shadow-sm">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <BriefcaseBusiness className="h-4 w-4 text-primary" /> Центр работы с клиентом
            </CardTitle>
            <p className="mt-1 truncate text-sm text-muted-foreground">{client.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">{draft.service_type}</Badge>
            <Badge variant="outline" className={riskConfig[(draft.risk_level || "medium") as RiskLevel].className}>{riskConfig[(draft.risk_level || "medium") as RiskLevel].label}</Badge>
            <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <WalletCards className="h-3 w-3" /> 100% предоплата
            </Badge>
            <span className="rounded-lg border bg-background/70 px-3 py-1.5 text-sm font-semibold">{formatMoney(Number(draft.price || 0))}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
          <div className="space-y-4 p-4 sm:p-5">
            <section className={`rounded-xl border p-4 ${dueState.tone}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
                    <CalendarClock className="h-3.5 w-3.5" /> Сейчас нужно
                  </p>
                  <p className="mt-2 text-base font-semibold leading-snug text-foreground">{draft.next_step || "Укажите следующее действие"}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium"><Clock3 className="h-3.5 w-3.5" />{dueState.label}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button size="sm" onClick={createTask}><ListTodo className="mr-1.5 h-4 w-4" />В планер</Button>
                  <Button size="sm" variant="outline" className="bg-background/70" onClick={() => copyText(draft.call_script || DEFAULT_CALL_SCRIPT, "Сценарий звонка")}><PhoneCall className="mr-1.5 h-4 w-4" />Текст звонка</Button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-background/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Маршрут работы</p>
                  <p className="text-xs text-muted-foreground">Нажмите на шаг, чтобы отметить продвижение.</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {isDirty && <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">Есть несохранённые изменения</Badge>}
                  <span className="font-semibold">{completedSteps}/{PROJECT_STEPS.length}</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
              </div>
              <Progress value={progress} className="mt-3 h-2" />
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
                {PROJECT_STEPS.map((step, index) => {
                  const done = index < completedSteps;
                  const current = index === currentStepIndex && completedSteps < PROJECT_STEPS.length;
                  return (
                    <button
                      type="button"
                      key={step}
                      onClick={() => setDraft((previous) => ({ ...previous, progress_completed: done ? index : index + 1, progress_total: PROJECT_STEPS.length }))}
                      className={`group flex min-h-[78px] flex-col items-start gap-2 rounded-lg border p-2.5 text-left text-xs transition ${done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : current ? "border-primary/50 bg-primary/10 text-foreground shadow-sm" : "border-border/70 bg-muted/30 text-muted-foreground hover:border-primary/30 hover:bg-muted/60"}`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold ${done ? "border-emerald-500/40 bg-emerald-500/20" : current ? "border-primary/50 bg-primary/20 text-primary" : "border-border bg-background"}`}>
                        {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-4 border-t border-border/60 bg-muted/20 p-4 sm:p-5 xl:border-l xl:border-t-0">
            <div>
              <p className="text-sm font-semibold">Управление проектом</p>
              <p className="text-xs text-muted-foreground">Только поля, которые меняются в ежедневной работе.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-1.5"><Label>Этап</Label><Select value={draft.stage || "Новый запрос"} onValueChange={(value) => setDraft((previous) => ({ ...previous, stage: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROJECT_STAGES.map((stage) => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Статус</Label><Select value={draft.status || "active"} onValueChange={(value) => setDraft((previous) => ({ ...previous, status: value as ProjectStatus }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">В работе</SelectItem><SelectItem value="paused">Приостановлен</SelectItem><SelectItem value="done">Завершён</SelectItem></SelectContent></Select></div>
            </div>

            <div className="space-y-1.5"><Label>Следующее действие</Label><Textarea rows={2} value={draft.next_step || ""} onChange={(event) => setDraft((previous) => ({ ...previous, next_step: event.target.value }))} /></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div className="space-y-1.5"><Label>Срок и время</Label><Input type="datetime-local" value={toLocalInput(draft.next_step_at)} onChange={(event) => setDraft((previous) => ({ ...previous, next_step_at: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Цена</Label><Input type="number" min={0} step={1000} value={Number(draft.price || 0)} onChange={(event) => setDraft((previous) => ({ ...previous, price: Number(event.target.value) }))} /></div>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <Label className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Риск и ограничение</Label>
              <Select value={draft.risk_level || "medium"} onValueChange={(value) => setDraft((previous) => ({ ...previous, risk_level: value as RiskLevel }))}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Низкий</SelectItem><SelectItem value="medium">Нужен контроль</SelectItem><SelectItem value="high">Высокий</SelectItem></SelectContent></Select>
              <Textarea className="mt-2" rows={3} value={draft.risk_note || ""} onChange={(event) => setDraft((previous) => ({ ...previous, risk_note: event.target.value }))} />
            </div>

            <Button className="w-full" onClick={() => saveProject.mutate()} disabled={saveProject.isPending || !isDirty}>
              {saveProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isDirty ? <Save className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {isDirty ? "Сохранить изменения" : "Всё сохранено"}
            </Button>
          </aside>
        </div>

        <div className="border-t border-border/60 bg-background/80 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">Документы и коммуникация</p>
              <p className="text-xs text-muted-foreground">Все частые действия собраны в одном месте.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={makeProposal} disabled={makingProposal}>{makingProposal ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}КП 28-ФЗ</Button>
              <Button size="sm" variant="outline" onClick={onGenerateContract}><FileSignature className="mr-1.5 h-4 w-4" />Договор 28-ФЗ</Button>
              <Button size="sm" variant="outline" onClick={() => copyText(draft.call_script || DEFAULT_CALL_SCRIPT, "Сценарий звонка")}><PhoneCall className="mr-1.5 h-4 w-4" />Сценарий звонка</Button>
              <Button size="sm" variant="outline" onClick={() => copyText(`Тема: ${draft.email_subject || DEFAULT_EMAIL_SUBJECT}\n\n${draft.email_body || DEFAULT_EMAIL_BODY}`, "Письмо")}><Mail className="mr-1.5 h-4 w-4" />Текст письма</Button>
            </div>
          </div>
        </div>

        <details className="border-t border-border/60 bg-muted/10 p-4 text-sm sm:p-5">
          <summary className="cursor-pointer font-medium text-muted-foreground transition hover:text-foreground">Дополнительные настройки: объём услуги и готовые тексты</summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="space-y-1"><Label>Что входит</Label><Textarea rows={5} value={draft.scope_summary || ""} onChange={(event) => setDraft((p) => ({ ...p, scope_summary: event.target.value }))} /></div>
            <div className="space-y-1"><Label>Сценарий звонка · ЦПО (846) 332-49-03</Label><Textarea rows={5} value={draft.call_script || ""} onChange={(event) => setDraft((p) => ({ ...p, call_script: event.target.value }))} /></div>
            <div className="space-y-1"><Label>Тема письма</Label><Input value={draft.email_subject || ""} onChange={(event) => setDraft((p) => ({ ...p, email_subject: event.target.value }))} /></div>
            <div className="space-y-1 lg:col-span-2"><Label>Текст письма</Label><Textarea rows={6} value={draft.email_body || ""} onChange={(event) => setDraft((p) => ({ ...p, email_body: event.target.value }))} /></div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
