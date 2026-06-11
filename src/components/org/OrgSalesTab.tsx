import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, Loader2, MoreVertical, Mail, Pencil, Trash2, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";

type Lead = {
  id: string;
  organization_id: string;
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  next_step: string | null;
  notes: string | null;
  last_email_sent_at: string | null;
  created_at: string;
};

const STATUSES: Record<string, { label: string; tone: string }> = {
  new: { label: "Новый", tone: "bg-muted text-foreground" },
  emailed: { label: "Письмо отправлено", tone: "bg-blue-500/15 text-blue-400" },
  replied: { label: "Ответ получен", tone: "bg-purple-500/15 text-purple-400" },
  demo: { label: "Демо назначено", tone: "bg-amber-500/15 text-amber-400" },
  deal: { label: "Договор", tone: "bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "Отказ", tone: "bg-red-500/15 text-red-400" },
};

const DEFAULT_TEMPLATE = `Добрый день.

Увидел вашу организацию среди образовательных организаций. Меня зовут Максим Шафрановский, я развиваю СИНТАГМУ — платформу для учебных центров: СДО, готовые курсы, ИИ-генерация курсов, документы и контроль прохождения обучения.

Сейчас помогаем учебным центрам запускать дистанционное обучение за 7 дней: добавление учеников, назначение курсов, контроль обучения и документы в одной системе.

Могу бесплатно показать за 15 минут, как это работает. Вам актуально посмотреть?`;
const DEFAULT_SUBJECT = "СИНТАГМА — платформа для учебных центров";
const TEMPLATE_KEY = "syntagma-cold-email-template";
const SUBJECT_KEY = "syntagma-cold-email-subject";

const OrgSalesTab = ({ organizationId }: { organizationId: string }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<Lead> | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sending, setSending] = useState<string | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [subject, setSubject] = useState(() => localStorage.getItem(SUBJECT_KEY) || DEFAULT_SUBJECT);
  const [body, setBody] = useState(() => localStorage.getItem(TEMPLATE_KEY) || DEFAULT_TEMPLATE);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["org-leads", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_leads" as any)
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Lead[];
    },
    enabled: !!organizationId,
  });

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          l.name?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.website?.toLowerCase().includes(q) ||
          l.source?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, search, statusFilter]);

  const saveLead = useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      if (lead.id) {
        const { id, ...rest } = lead;
        const { error } = await supabase.from("org_leads" as any).update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("org_leads" as any).insert({
          organization_id: organizationId,
          name: lead.name,
          website: lead.website || null,
          email: lead.email || null,
          phone: lead.phone || null,
          source: lead.source || null,
          status: lead.status || "new",
          next_step: lead.next_step || null,
          notes: lead.notes || null,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-leads", organizationId] });
      toast.success("Сохранено");
      setEditing(null);
    },
    onError: () => toast.error("Не удалось сохранить"),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("org_leads" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-leads", organizationId] });
      toast.success("Лид удалён");
    },
  });

  const sendEmail = async (lead: Lead) => {
    if (!lead.email) {
      toast.error("У лида не указан email");
      return;
    }
    setSending(lead.id);
    try {
      const html = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #222; white-space: pre-wrap;">${body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</div>`;
      const { data, error } = await supabase.functions.invoke("send-document-email", {
        body: { to: lead.email, subject, html },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Send failed");
      await supabase
        .from("org_leads" as any)
        .update({ status: "emailed", last_email_sent_at: new Date().toISOString() } as any)
        .eq("id", lead.id);
      queryClient.invalidateQueries({ queryKey: ["org-leads", organizationId] });
      toast.success(`Письмо отправлено на ${lead.email}`);
    } catch (e: any) {
      toast.error(e.message || "Ошибка отправки");
    }
    setSending(null);
  };

  const saveTemplate = () => {
    localStorage.setItem(TEMPLATE_KEY, body);
    localStorage.setItem(SUBJECT_KEY, subject);
    setShowTemplate(false);
    toast.success("Шаблон сохранён");
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Продажи</h2>
          <p className="text-xs text-muted-foreground">Лиды и рассылка холодных писем</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowTemplate(true)}>
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Шаблон письма</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setEditing({ status: "new" })}>
            <Plus className="h-4 w-4" />
            Добавить лид
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Поиск по названию, email, сайту..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(STATUSES).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Лидов пока нет. Нажмите «Добавить лид», чтобы начать.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Организация</TableHead>
                  <TableHead>Сайт</TableHead>
                  <TableHead>Email / телефон</TableHead>
                  <TableHead>Откуда нашли</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Следующий шаг</TableHead>
                  <TableHead className="sticky right-0 bg-card text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => {
                  const s = STATUSES[lead.status] || STATUSES.new;
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        {lead.website ? (
                          <a
                            href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            {lead.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{lead.email || <span className="text-muted-foreground">—</span>}</div>
                        {lead.phone && <div className="text-xs text-muted-foreground">{lead.phone}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{lead.source || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <Badge className={s.tone} variant="outline">
                          {s.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {lead.next_step || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="sticky right-0 bg-card text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => sendEmail(lead)}
                            disabled={sending === lead.id || !lead.email}
                            title="Отправить письмо"
                          >
                            {sending === lead.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditing(lead)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Удалить лида?")) deleteLead.mutate(lead.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lead create/edit */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Редактировать лида" : "Новый лид"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Организация *</Label>
                <Input
                  value={editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Сайт</Label>
                  <Input
                    value={editing.website || ""}
                    onChange={(e) => setEditing({ ...editing, website: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Откуда нашли</Label>
                  <Input
                    placeholder="ФРДО, Рособрнадзор, Яндекс..."
                    value={editing.source || ""}
                    onChange={(e) => setEditing({ ...editing, source: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editing.email || ""}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Телефон</Label>
                  <Input
                    value={editing.phone || ""}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Статус</Label>
                <Select
                  value={editing.status || "new"}
                  onValueChange={(v) => setEditing({ ...editing, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUSES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Следующий шаг</Label>
                <Input
                  value={editing.next_step || ""}
                  onChange={(e) => setEditing({ ...editing, next_step: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Заметки</Label>
                <Textarea
                  rows={3}
                  value={editing.notes || ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (!editing?.name?.trim()) return toast.error("Укажите название организации");
                saveLead.mutate(editing);
              }}
              disabled={saveLead.isPending}
            >
              {saveLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template editor */}
      <Dialog open={showTemplate} onOpenChange={setShowTemplate}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Шаблон холодного письма</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Тема</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Текст письма</Label>
              <Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Сохраняется локально в этом браузере. Письма уходят с настроенного SMTP-адреса.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setSubject(DEFAULT_SUBJECT);
                setBody(DEFAULT_TEMPLATE);
              }}
            >
              Сбросить
            </Button>
            <Button onClick={saveTemplate}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgSalesTab;