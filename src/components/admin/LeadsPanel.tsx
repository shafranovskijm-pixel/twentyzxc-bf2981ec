import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MessageSquare, Loader2, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { filterIncomingLeads, INCOMING_LEAD_FIELDS, loadIncomingLeads, type IncomingLead } from "@/lib/incoming-leads";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  contacted: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  converted: "bg-green-500/20 text-green-700 dark:text-green-400",
  rejected: "bg-red-500/20 text-red-700 dark:text-red-400",
};
const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  contacted: "Связались",
  converted: "Клиент создан",
  rejected: "Отклонена",
};
const PAGE_SIZE = 25;

function leadDate(value: string | null): string {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? format(date, "dd.MM.yyyy HH:mm", { locale: ru })
    : "Дата не указана";
}

const LeadsPanel = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { data: leads = [], isLoading, isFetching, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["leads", "incoming"],
    queryFn: ({ signal }) => loadIncomingLeads(async (from, to) => {
      const { data, error } = await supabase.from("leads")
        .select(INCOMING_LEAD_FIELDS)
        .order("created_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false })
        .range(from, to)
        .abortSignal(signal);
      return { data, error };
    }, signal),
    staleTime: 30 * 1000,
    retry: 1,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ lead, status }: { lead: IncomingLead; status: string }) => {
      let query = supabase.from("leads").update({ status }).eq("id", lead.id);
      query = lead.status === null ? query.is("status", null) : query.eq("status", lead.status);
      const { error } = await query.select("id").single();
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Статус заявки обновлён");
    },
    onError: () => toast.error("Не удалось изменить статус. Обновите список и повторите."),
  });

  const filtered = useMemo(
    () => filterIncomingLeads(leads, filterStatus, search),
    [leads, filterStatus, search],
  );
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const newCount = leads.filter(lead => lead.status === "new").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Входящие заявки
              {newCount > 0 && <Badge variant="secondary">{newCount} новых</Badge>}
            </CardTitle>
            <CardDescription>
              Обращения с сайта и из бота. Контакты, текст и номер заявки сохраняются здесь.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Обновить
          </Button>
        </div>
        <div className="grid gap-3 pt-3 sm:grid-cols-[1fr_180px]">
          <div className="space-y-1.5">
            <Label htmlFor="incoming-lead-search">Найти заявку</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="incoming-lead-search" className="pl-9" value={search}
                onChange={event => { setSearch(event.target.value); setPage(0); }}
                placeholder="Имя, телефон, email, текст или номер заявки"
                autoComplete="off" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="incoming-lead-status">Статус</Label>
            <Select value={filterStatus} onValueChange={value => { setFilterStatus(value); setPage(0); }}>
              <SelectTrigger id="incoming-lead-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="new">Новые</SelectItem>
                <SelectItem value="contacted">Связались</SelectItem>
                <SelectItem value="converted">Клиент создан</SelectItem>
                <SelectItem value="rejected">Отклонены</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError && (
          <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
            Не удалось обновить заявки. Нажмите «Обновить». Если ошибка повторяется, проверьте вход в CRM.
          </p>
        )}
        {isLoading ? (
          <div role="status" className="flex items-center justify-center gap-2 py-8 text-sm">
            <Loader2 className="h-5 w-5 animate-spin" />Загружаем заявки…
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Найдено: {filtered.length} из {leads.length}
              {dataUpdatedAt > 0 && ` · Обновлено в ${format(new Date(dataUpdatedAt), "HH:mm")}`}
            </p>
            {visible.length === 0 && !isError && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {search || filterStatus !== "all" ? "По этим условиям заявок нет. Измените поиск или статус." : "Заявок пока нет."}
              </p>
            )}
            {visible.map(lead => (
              <article key={lead.id} className="space-y-3 rounded-md border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-medium">{lead.name || "Без имени"}</h3>
                      <Badge className={STATUS_COLORS[lead.status || ""] || ""}>
                        {STATUS_LABELS[lead.status || ""] || lead.status || "Без статуса"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{leadDate(lead.created_at)}</p>
                  </div>
                  <Select value={lead.status || "new"} disabled={updateStatus.isPending || lead.status === "converted"}
                    onValueChange={status => updateStatus.mutate({ lead, status })}>
                    <SelectTrigger className="w-44" aria-label={`Статус заявки ${lead.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Новая</SelectItem>
                      <SelectItem value="contacted">Связались</SelectItem>
                      <SelectItem value="rejected">Отклонена</SelectItem>
                      {lead.status === "converted" && <SelectItem value="converted">Клиент создан</SelectItem>}
                      {lead.status && !STATUS_LABELS[lead.status] && <SelectItem value={lead.status} disabled>{lead.status}</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {lead.phone && <p className="break-all"><span className="text-muted-foreground">Телефон: </span>{lead.phone}</p>}
                  {lead.email && <p className="break-all"><span className="text-muted-foreground">Email: </span>{lead.email}</p>}
                  {!lead.phone && !lead.email && <p className="text-muted-foreground">Контакт не указан</p>}
                </div>
                {lead.message && <p className="whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 text-sm">{lead.message}</p>}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="break-all">Источник: {lead.source || "Не указан"}</p>
                  <p className="break-all">Номер заявки: <code className="select-all">{lead.id}</code></p>
                </div>
              </article>
            ))}
            {pageCount > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Назад</Button>
                <span className="text-sm text-muted-foreground">Страница {currentPage + 1} из {pageCount}</span>
                <Button variant="outline" size="sm" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Далее</Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadsPanel;
