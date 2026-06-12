import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Mail, Play, X, RefreshCw, AlertCircle, CheckCircle2, Clock, Eye, Pencil, Copy, FileDown, FileText, ChevronDown, ChevronUp, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type QItem = {
  id: string;
  lead_id: string | null;
  email: string;
  subject: string;
  scheduled_at: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  attempts: number;
};

type LeadLite = { id: string; name: string; email: string | null; contact_person: string | null; status: string };

const STATUS_LABEL: Record<string, { label: string; cls: string; icon: any }> = {
  queued:    { label: "Ждёт",      cls: "bg-amber-500/15 text-amber-300 border-amber-500/30", icon: Clock },
  sending:   { label: "Отправляется", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30", icon: Loader2 },
  sent:      { label: "Отправлено", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  failed:    { label: "Ошибка",    cls: "bg-rose-500/15 text-rose-300 border-rose-500/30", icon: AlertCircle },
  cancelled: { label: "Отменено",  cls: "bg-slate-500/15 text-slate-300 border-slate-500/30", icon: X },
};

export default function CampaignDialog({
  open, onOpenChange, subject, body, selectedLeadIds, leads, onEditTemplate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subject: string;
  body: string;
  selectedLeadIds: string[];
  leads: LeadLite[];
  onEditTemplate: () => void;
}) {
  const [items, setItems] = useState<QItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [tplOpen, setTplOpen] = useState(true);
  const [previewLead, setPreviewLead] = useState<LeadLite | null>(null);
  const [reportRange, setReportRange] = useState<"today" | "7d" | "30d">("today");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("email_campaign_queue")
      .select("*")
      .order("scheduled_at", { ascending: true })
      .limit(500);
    setItems((data as any) ?? []);
    setLoading(false);
  }

  async function runSmtpTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("smtp-diagnose", {
        body: { to: "24@24zxc.ru" },
      });
      if (error) {
        setTestResult({ success: false, error: error.message, steps: [] });
        toast.error("Тест провалился — см. детали ниже");
      } else {
        setTestResult(data);
        if (data?.success) toast.success("Тест пройден — письмо отправлено на 24@24zxc.ru");
        else toast.error("Тест провалился — см. детали ниже");
      }
    } catch (e: any) {
      setTestResult({ success: false, error: String(e?.message || e), steps: [] });
      toast.error("Ошибка вызова функции");
    } finally {
      setTesting(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [open]);

  const todayMsk = useMemo(() => {
    const now = new Date();
    const msk = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60_000);
    return msk.toISOString().slice(0, 10);
  }, [items]);

  const today = items.filter(i => {
    const d = new Date(i.scheduled_at);
    const msk = new Date(d.getTime() + (3 * 60 + d.getTimezoneOffset()) * 60_000);
    return msk.toISOString().slice(0, 10) === todayMsk;
  });

  const sentToday = today.filter(i => i.status === "sent").length;
  const queuedToday = today.filter(i => i.status === "queued").length;
  const failedToday = today.filter(i => i.status === "failed").length;
  const nextSlot = today.find(i => i.status === "queued");

  async function launchAuto() {
    setLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke("enqueue-campaign", {
        body: { mode: "auto_new", subject, body },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`В очереди ${data.queued} писем. Последнее: ${format(new Date(data.last_at), "dd.MM HH:mm", { locale: ru })}`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Ошибка");
    } finally { setLaunching(false); }
  }

  async function launchSelected() {
    if (!selectedLeadIds.length) return toast.error("Выберите лидов в таблице");
    setLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke("enqueue-campaign", {
        body: { lead_ids: selectedLeadIds, subject, body },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`В очереди ${data.queued} писем`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Ошибка");
    } finally { setLaunching(false); }
  }

  async function cancelItem(id: string) {
    await supabase.from("email_campaign_queue").update({ status: "cancelled" }).eq("id", id);
    load();
  }

  async function cancelAllQueued() {
    if (!confirm("Отменить все письма в ожидании?")) return;
    await supabase.from("email_campaign_queue").update({ status: "cancelled" }).eq("status", "queued");
    toast.success("Очередь очищена");
    load();
  }

  // ===== Шаблон / превью =====
  const personalize = (text: string, l: LeadLite | null) =>
    text.replace(/\{org\}/g, l?.name || "{org}").replace(/\{contact\}/g, l?.contact_person || "{contact}");

  const firstLeadForPreview: LeadLite | null = useMemo(() => {
    if (selectedLeadIds.length) {
      const m = leads.find(l => selectedLeadIds.includes(l.id) && l.email);
      if (m) return m;
    }
    return leads.find(l => l.email && l.status === "new") || leads.find(l => l.email) || null;
  }, [leads, selectedLeadIds]);

  // ===== Отчёт =====
  function reportItems(): QItem[] {
    const now = Date.now();
    let from = 0;
    if (reportRange === "today") {
      const d = new Date();
      const msk = new Date(d.getTime() + (3 * 60 + d.getTimezoneOffset()) * 60_000);
      msk.setUTCHours(0, 0, 0, 0);
      from = msk.getTime() - (3 * 60 + d.getTimezoneOffset()) * 60_000;
    } else if (reportRange === "7d") from = now - 7 * 86400_000;
    else from = now - 30 * 86400_000;
    return items.filter(i => new Date(i.scheduled_at).getTime() >= from);
  }

  function buildReportText(): string {
    const list = reportItems();
    const byEmail = new Map(leads.map(l => [l.email, l.name] as const));
    const sent = list.filter(i => i.status === "sent");
    const queued = list.filter(i => i.status === "queued");
    const failed = list.filter(i => i.status === "failed");
    const cancelled = list.filter(i => i.status === "cancelled");

    const periodLabel = reportRange === "today"
      ? `за ${format(new Date(), "dd.MM.yyyy", { locale: ru })}`
      : reportRange === "7d" ? "за последние 7 дней" : "за последние 30 дней";

    const lines: string[] = [];
    lines.push(`Отчёт по холодной email-рассылке СИНТАГМА ${periodLabel}`);
    lines.push("");
    lines.push(`Всего писем в плане: ${list.length}`);
    lines.push(`✅ Отправлено: ${sent.length}`);
    lines.push(`⏳ В очереди: ${queued.length}`);
    lines.push(`❌ Ошибок: ${failed.length}`);
    if (cancelled.length) lines.push(`⊘ Отменено: ${cancelled.length}`);
    lines.push("");
    if (sent.length) {
      lines.push("Отправлено:");
      for (const i of sent) {
        const org = byEmail.get(i.email) ?? "—";
        const t = i.sent_at ? format(new Date(i.sent_at), "dd.MM HH:mm", { locale: ru }) : "";
        lines.push(`- ${i.email} — ${org} — ${t}`);
      }
      lines.push("");
    }
    if (failed.length) {
      lines.push("Ошибки:");
      for (const i of failed) {
        const org = byEmail.get(i.email) ?? "—";
        lines.push(`- ${i.email} — ${org} — ${i.error ?? "неизвестная ошибка"}`);
      }
      lines.push("");
    }
    if (queued.length) {
      lines.push("В очереди (ближайшие 10):");
      for (const i of queued.slice(0, 10)) {
        const org = byEmail.get(i.email) ?? "—";
        const t = format(new Date(i.scheduled_at), "dd.MM HH:mm", { locale: ru });
        lines.push(`- ${i.email} — ${org} — ${t}`);
      }
      lines.push("");
    }
    lines.push("Шаблон письма:");
    lines.push(`Тема: ${subject}`);
    lines.push("---");
    lines.push(body);
    return lines.join("\n");
  }

  async function copyReport() {
    await navigator.clipboard.writeText(buildReportText());
    toast.success("Отчёт скопирован — вставьте в ChatGPT");
  }

  function downloadText() {
    const blob = new Blob([buildReportText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `campaign-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    const list = reportItems();
    const byEmail = new Map(leads.map(l => [l.email, l.name] as const));
    const rows = [["Запланировано","Отправлено","Email","Организация","Статус","Ошибка"]];
    for (const i of list) {
      rows.push([
        format(new Date(i.scheduled_at), "dd.MM.yyyy HH:mm"),
        i.sent_at ? format(new Date(i.sent_at), "dd.MM.yyyy HH:mm") : "",
        i.email,
        byEmail.get(i.email) ?? "",
        i.status,
        (i.error ?? "").replace(/[\r\n]+/g, " "),
      ]);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `campaign-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  function renderRow(i: QItem) {
    const s = STATUS_LABEL[i.status] ?? STATUS_LABEL.queued;
    const Icon = s.icon;
    return (
      <div key={i.id} className="flex items-center gap-3 p-3 border-b border-border/40 text-sm">
        <div className="w-24 tabular-nums text-muted-foreground">
          {format(new Date(i.scheduled_at), "dd.MM HH:mm", { locale: ru })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{i.email}</div>
          <div className="text-xs text-muted-foreground truncate">{i.subject}</div>
          {i.error && <div className="text-xs text-rose-400 truncate">{i.error}</div>}
        </div>
        <Badge variant="outline" className={s.cls}>
          <Icon className={`h-3 w-3 mr-1 ${i.status === "sending" ? "animate-spin" : ""}`} />
          {s.label}
        </Badge>
        {i.status === "queued" && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => cancelItem(i.id)} title="Отменить">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Рассылка по расписанию</DialogTitle>
        </DialogHeader>

        {/* Превью шаблона */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 p-3">
            <FileText className="h-4 w-4 text-amber-300" />
            <div className="text-sm font-medium">Шаблон письма</div>
            <div className="text-xs text-muted-foreground truncate hidden sm:block">
              · {subject.slice(0, 60)}{subject.length > 60 ? "…" : ""}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onEditTemplate}>
                <Pencil className="h-3.5 w-3.5 mr-1" />Изменить
              </Button>
              <Button variant="ghost" size="sm" onClick={() => firstLeadForPreview && setPreviewLead(firstLeadForPreview)} disabled={!firstLeadForPreview}>
                <Eye className="h-3.5 w-3.5 mr-1" />Как увидит лид
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTplOpen(v => !v)}>
                {tplOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {tplOpen && (
            <div className="px-3 pb-3 space-y-2">
              <div className="text-xs">
                <span className="text-muted-foreground">Тема: </span>
                <span className="font-medium">{subject}</span>
              </div>
              <div className="rounded-md bg-background/60 border border-border/40 p-3 text-xs whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                {body}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {"{org}"} и {"{contact}"} автоматически подставятся для каждого лида.
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 flex flex-wrap items-center gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Сегодня</div>
            <div className="text-lg font-semibold">
              {sentToday} <span className="text-muted-foreground text-sm">из 20 отправлено</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">В очереди</div>
            <div className="text-lg font-semibold text-amber-300">{queuedToday}</div>
          </div>
          {failedToday > 0 && (
            <div>
              <div className="text-xs text-muted-foreground">Ошибок</div>
              <div className="text-lg font-semibold text-rose-300">{failedToday}</div>
            </div>
          )}
          {nextSlot && (
            <div>
              <div className="text-xs text-muted-foreground">Следующее</div>
              <div className="text-lg font-semibold">{format(new Date(nextSlot.scheduled_at), "HH:mm", { locale: ru })}</div>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={load} title="Обновить"><RefreshCw className="h-4 w-4" /></Button>
            {queuedToday > 0 && (
              <Button variant="outline" size="sm" onClick={cancelAllQueued}>Очистить очередь</Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button onClick={launchAuto} disabled={launching}>
            {launching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Запустить на сегодня (новые лиды)
          </Button>
          <Button variant="outline" onClick={launchSelected} disabled={launching || !selectedLeadIds.length}>
            <Play className="h-4 w-4 mr-2" />
            Добавить выбранных{selectedLeadIds.length > 0 ? ` (${selectedLeadIds.length})` : ""}
          </Button>
          <Button variant="outline" onClick={runSmtpTest} disabled={testing} className="ml-auto">
            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Stethoscope className="h-4 w-4 mr-2" />}
            Тест SMTP → 24@24zxc.ru
          </Button>
        </div>

        {testResult && (
          <div className={`mt-2 rounded-lg border p-3 text-xs ${testResult.success ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm flex items-center gap-2">
                {testResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-400" />}
                {testResult.success ? "SMTP работает — письмо принято сервером" : "SMTP-ошибка"}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTestResult(null)}><X className="h-3 w-3" /></Button>
            </div>
            {testResult.error && <div className="text-rose-300 mb-2 break-words">{testResult.error}</div>}
            {testResult.hint && <div className="text-amber-300 mb-2">{testResult.hint}</div>}
            {Array.isArray(testResult.steps) && testResult.steps.length > 0 && (
              <div className="space-y-1">
                {testResult.steps.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 font-mono">
                    {s.ok ? <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> : <AlertCircle className="h-3 w-3 text-rose-400 shrink-0" />}
                    <span className="w-32 shrink-0">{s.name}</span>
                    <span className="w-16 text-muted-foreground tabular-nums">{s.ms} ms</span>
                    {s.detail && <span className="text-rose-300 truncate">{s.detail}</span>}
                  </div>
                ))}
              </div>
            )}
            {testResult.smtp && (
              <div className="mt-2 text-muted-foreground">
                Сервер: {testResult.smtp.host}:{testResult.smtp.port} · от {testResult.smtp.user}
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="today" className="flex-1 flex flex-col min-h-0 mt-2">
          <TabsList>
            <TabsTrigger value="today">Сегодня ({today.length})</TabsTrigger>
            <TabsTrigger value="all">История / Отчёт</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="flex-1 overflow-y-auto rounded-lg border border-border/40 mt-2">
            {loading && <div className="p-6 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Загрузка…</div>}
            {!loading && today.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">На сегодня ничего не запланировано. Нажмите «Запустить на сегодня».</div>}
            {today.map(renderRow)}
          </TabsContent>
          <TabsContent value="all" className="flex-1 flex flex-col min-h-0 mt-2">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Select value={reportRange} onValueChange={(v: any) => setReportRange(v)}>
                <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Сегодня</SelectItem>
                  <SelectItem value="7d">Последние 7 дней</SelectItem>
                  <SelectItem value="30d">Последние 30 дней</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={copyReport}>
                <Copy className="h-3.5 w-3.5 mr-1" />Скопировать для ChatGPT
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadText}>
                <FileDown className="h-3.5 w-3.5 mr-1" />.txt
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadCsv}>
                <FileDown className="h-3.5 w-3.5 mr-1" />.csv
              </Button>
              <div className="text-xs text-muted-foreground ml-auto">{reportItems().length} писем в отчёте</div>
            </div>
            <div className="flex-1 overflow-y-auto rounded-lg border border-border/40">
              {reportItems().length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">За выбранный период писем нет.</div>}
              {reportItems().slice().reverse().map(renderRow)}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="text-xs text-muted-foreground mr-auto">
            До 20 писем в день · по 1 каждые 10 минут · 10:00–18:00 МСК
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>

      {/* Окно превью «как увидит лид» */}
      <Dialog open={!!previewLead} onOpenChange={(o) => !o && setPreviewLead(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Превью для {previewLead?.name}</DialogTitle>
          </DialogHeader>
          {previewLead && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Кому: <b>{previewLead.email}</b></div>
              <div className="text-sm"><span className="text-muted-foreground">Тема: </span><b>{personalize(subject, previewLead)}</b></div>
              <div className="rounded-md bg-background/60 border border-border/40 p-3 text-sm whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                {personalize(body, previewLead)}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewLead(null)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}