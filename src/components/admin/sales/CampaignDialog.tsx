import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Mail, Play, X, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
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

const STATUS_LABEL: Record<string, { label: string; cls: string; icon: any }> = {
  queued:    { label: "Ждёт",      cls: "bg-amber-500/15 text-amber-300 border-amber-500/30", icon: Clock },
  sending:   { label: "Отправляется", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30", icon: Loader2 },
  sent:      { label: "Отправлено", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  failed:    { label: "Ошибка",    cls: "bg-rose-500/15 text-rose-300 border-rose-500/30", icon: AlertCircle },
  cancelled: { label: "Отменено",  cls: "bg-slate-500/15 text-slate-300 border-slate-500/30", icon: X },
};

export default function CampaignDialog({
  open, onOpenChange, subject, body, selectedLeadIds,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subject: string;
  body: string;
  selectedLeadIds: string[];
}) {
  const [items, setItems] = useState<QItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);

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
        </div>

        <Tabs defaultValue="today" className="flex-1 flex flex-col min-h-0 mt-2">
          <TabsList>
            <TabsTrigger value="today">Сегодня ({today.length})</TabsTrigger>
            <TabsTrigger value="all">История</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="flex-1 overflow-y-auto rounded-lg border border-border/40 mt-2">
            {loading && <div className="p-6 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Загрузка…</div>}
            {!loading && today.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">На сегодня ничего не запланировано. Нажмите «Запустить на сегодня».</div>}
            {today.map(renderRow)}
          </TabsContent>
          <TabsContent value="all" className="flex-1 overflow-y-auto rounded-lg border border-border/40 mt-2">
            {items.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">История пуста.</div>}
            {items.slice().reverse().map(renderRow)}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="text-xs text-muted-foreground mr-auto">
            До 20 писем в день · по 1 каждые 10 минут · 10:00–18:00 МСК
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}