import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, MoreVertical, Mail, RefreshCw, Pencil, Trash2, Download, FileEdit, Loader2, ExternalLink } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  inn: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  source: string | null;
  status: string;
  next_step: string | null;
  notes: string | null;
  license_cache: any;
  last_email_sent_at: string | null;
};

const STATUSES: { value: string; label: string; tone: string }[] = [
  { value: "new",       label: "Новый",            tone: "bg-slate-500/15 text-slate-200 border-slate-500/30" },
  { value: "emailed",   label: "Письмо отправлено", tone: "bg-blue-500/15 text-blue-200 border-blue-500/30" },
  { value: "replied",   label: "Ответ получен",    tone: "bg-amber-500/15 text-amber-200 border-amber-500/30" },
  { value: "demo",      label: "Демо назначено",   tone: "bg-violet-500/15 text-violet-200 border-violet-500/30" },
  { value: "contract",  label: "Договор",          tone: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30" },
  { value: "rejected",  label: "Отказ",            tone: "bg-rose-500/15 text-rose-200 border-rose-500/30" },
];

const DEFAULT_SUBJECT = "Дистанционное обучение для вашего учебного центра — 15 минут демо";
const DEFAULT_BODY = `Добрый день.

Увидел вашу организацию среди образовательных организаций. Меня зовут Максим Шафрановский, я развиваю СИНТАГМУ — платформу для учебных центров: СДО, готовые курсы, ИИ-генерация курсов, документы и контроль прохождения обучения.

Сейчас помогаем учебным центрам запускать дистанционное обучение за 7 дней: добавление учеников, назначение курсов, контроль обучения и документы в одной системе.

Могу бесплатно показать за 15 минут, как это работает. Вам актуально посмотреть?`;

const LS_SUBJECT = "sales_email_subject";
const LS_BODY = "sales_email_body";

function statusBadge(s: string) {
  const t = STATUSES.find(x => x.value === s) ?? STATUSES[0];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${t.tone}`}>{t.label}</span>;
}

export default function SalesTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [tplOpen, setTplOpen] = useState(false);
  const [subject, setSubject] = useState(() => localStorage.getItem(LS_SUBJECT) || DEFAULT_SUBJECT);
  const [body, setBody] = useState(() => localStorage.getItem(LS_BODY) || DEFAULT_BODY);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncAll, setSyncAll] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setLeads((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter(l => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.name, l.inn, l.email, l.website, l.contact_person]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
    });
  }, [leads, search, statusFilter]);

  async function saveLead(payload: Partial<Lead>, id?: string) {
    const userRes = await supabase.auth.getUser();
    const user_id = userRes.data.user?.id;
    if (!user_id) { toast.error("Нет авторизации"); return; }
    if (id) {
      const { error } = await supabase.from("sales_leads").update(payload as any).eq("id", id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("sales_leads").insert({ ...(payload as any), user_id });
      if (error) return toast.error(error.message);
    }
    toast.success("Сохранено");
    setEditing(null);
    load();
  }

  async function deleteLead(id: string) {
    if (!confirm("Удалить лид?")) return;
    const { error } = await supabase.from("sales_leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    load();
  }

  async function sendEmail(lead: Lead) {
    if (!lead.email) return toast.error("У лида нет email");
    const personalSubject = subject.replace(/\{org\}/g, lead.name);
    const personalBody = body.replace(/\{org\}/g, lead.name).replace(/\{contact\}/g, lead.contact_person ?? "");
    const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;white-space:pre-wrap;color:#1a1a1a;font-size:15px;line-height:1.55;">${personalBody.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</div>`;
    try {
      const { data, error } = await supabase.functions.invoke("send-document-email", {
        body: { to: lead.email, subject: personalSubject, html },
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || "Не удалось отправить");
      await supabase.from("sales_leads")
        .update({ status: "emailed", last_email_sent_at: new Date().toISOString() })
        .eq("id", lead.id);
      toast.success(`Письмо отправлено на ${lead.email}`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Ошибка отправки");
    }
  }

  async function syncLead(lead: Lead) {
    if (!lead.inn) return toast.error("Нет ИНН");
    setSyncing(lead.id);
    try {
      const { data, error } = await supabase.functions.invoke("parse-rosobrnadzor", { body: { inn: lead.inn } });
      if (error) throw error;
      const patch: any = { license_cache: data };
      if (!lead.name && data.org_name) patch.name = data.org_name;
      if (!lead.email && data.email) patch.email = data.email;
      if (!lead.phone && data.phone) patch.phone = data.phone;
      await supabase.from("sales_leads").update(patch).eq("id", lead.id);
      toast.success(data.found ? "Данные обновлены" : "В реестре не найдено");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Ошибка парсера");
    } finally {
      setSyncing(null);
    }
  }

  async function syncAllReq() {
    const targets = leads.filter(l => l.inn);
    if (!targets.length) return toast.info("Нет лидов с ИНН");
    setSyncAll(true);
    let ok = 0;
    for (const l of targets) {
      try {
        const { data } = await supabase.functions.invoke("parse-rosobrnadzor", { body: { inn: l.inn } });
        if (data) {
          await supabase.from("sales_leads").update({ license_cache: data }).eq("id", l.id);
          ok++;
        }
      } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    setSyncAll(false);
    toast.success(`Обновлено ${ok} из ${targets.length}`);
    load();
  }

  async function importFromContracts() {
    const { data: clients } = await supabase.from("clients").select("name, inn, email, phone, contact_person").limit(1000);
    if (!clients?.length) return toast.info("Клиенты не найдены");
    const userRes = await supabase.auth.getUser();
    const user_id = userRes.data.user?.id!;
    const existingInns = new Set(leads.map(l => l.inn).filter(Boolean) as string[]);
    const existingNames = new Set(leads.map(l => l.name));
    const map = new Map<string, any>();
    for (const c of clients as any[]) {
      const key = (c.inn || c.name || "").toString();
      if (!key) continue;
      if (c.inn && existingInns.has(c.inn)) continue;
      if (!c.inn && existingNames.has(c.name)) continue;
      if (!map.has(key)) map.set(key, {
        name: c.name || "Без названия",
        inn: c.inn || null,
        email: c.email || null,
        phone: c.phone || null,
        contact_person: c.contact_person || null,
      });
    }
    if (!map.size) return toast.info("Все клиенты уже в лидах");
    const rows = Array.from(map.values()).map(v => ({ ...v, source: "Договоры", status: "new", user_id }));
    const { error } = await supabase.from("sales_leads").insert(rows as any);
    if (error) return toast.error(error.message);
    toast.success(`Добавлено ${rows.length}`);
    load();
  }

  function saveTemplate() {
    localStorage.setItem(LS_SUBJECT, subject);
    localStorage.setItem(LS_BODY, body);
    toast.success("Шаблон сохранён");
    setTplOpen(false);
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию, ИНН, email…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={importFromContracts}><Download className="h-4 w-4 mr-2" />Импорт из договоров</Button>
        <Button variant="outline" onClick={syncAllReq} disabled={syncAll}>
          {syncAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Синхр. все реквизиты
        </Button>
        <Button variant="outline" onClick={() => setTplOpen(true)}><FileEdit className="h-4 w-4 mr-2" />Шаблон письма</Button>
        <Button onClick={() => setEditing({ id: "", name: "", inn: "", website: "", email: "", phone: "", contact_person: "", source: "", status: "new", next_step: "", notes: "", license_cache: null, last_email_sent_at: null })}>
          <Plus className="h-4 w-4 mr-2" />Добавить
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium p-3">Организация</th>
                <th className="text-left font-medium p-3">ИНН</th>
                <th className="text-left font-medium p-3">Сайт</th>
                <th className="text-left font-medium p-3">Email</th>
                <th className="text-left font-medium p-3">Телефон</th>
                <th className="text-left font-medium p-3">Лицензия</th>
                <th className="text-left font-medium p-3">Источник</th>
                <th className="text-left font-medium p-3">Статус</th>
                <th className="text-left font-medium p-3">След. шаг</th>
                <th className="sticky right-0 bg-muted/40 w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Загрузка…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">Лидов пока нет. Нажмите «Добавить» или «Импорт из договоров».</td></tr>
              )}
              {!loading && filtered.map(l => {
                const lic = l.license_cache as any;
                return (
                  <tr key={l.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-medium max-w-[260px] truncate" title={l.name}>{l.name}</td>
                    <td className="p-3 tabular-nums">{l.inn || "—"}</td>
                    <td className="p-3 max-w-[160px] truncate">
                      {l.website ? <a href={l.website.startsWith("http") ? l.website : `https://${l.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">{l.website}<ExternalLink className="h-3 w-3" /></a> : "—"}
                    </td>
                    <td className="p-3">{l.email || "—"}</td>
                    <td className="p-3">{l.phone || "—"}</td>
                    <td className="p-3">
                      {lic?.license_number
                        ? <Badge variant="outline" className="border-amber-500/40 text-amber-200">{lic.license_number}</Badge>
                        : lic && lic.found === false ? <span className="text-xs text-muted-foreground">не найдено</span>
                        : "—"}
                    </td>
                    <td className="p-3">{l.source || "—"}</td>
                    <td className="p-3">{statusBadge(l.status)}</td>
                    <td className="p-3 max-w-[180px] truncate" title={l.next_step ?? ""}>{l.next_step || "—"}</td>
                    <td className="sticky right-0 bg-background/95 backdrop-blur p-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {syncing === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => sendEmail(l)}><Mail className="h-4 w-4 mr-2" />Отправить письмо</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => syncLead(l)}><RefreshCw className="h-4 w-4 mr-2" />Подтянуть по ИНН</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditing(l)}><Pencil className="h-4 w-4 mr-2" />Редактировать</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteLead(l.id)} className="text-rose-400 focus:text-rose-300"><Trash2 className="h-4 w-4 mr-2" />Удалить</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Редактировать лид" : "Новый лид"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2"><Label>Организация *</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>ИНН</Label><Input value={editing.inn ?? ""} onChange={e => setEditing({ ...editing, inn: e.target.value })} /></div>
              <div><Label>Сайт</Label><Input value={editing.website ?? ""} onChange={e => setEditing({ ...editing, website: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={editing.email ?? ""} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>Телефон</Label><Input value={editing.phone ?? ""} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></div>
              <div><Label>Контактное лицо</Label><Input value={editing.contact_person ?? ""} onChange={e => setEditing({ ...editing, contact_person: e.target.value })} /></div>
              <div><Label>Источник</Label><Input value={editing.source ?? ""} onChange={e => setEditing({ ...editing, source: e.target.value })} placeholder="Договоры / Поиск / Реестр" /></div>
              <div>
                <Label>Статус</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Следующий шаг</Label><Input value={editing.next_step ?? ""} onChange={e => setEditing({ ...editing, next_step: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Заметки</Label><Textarea rows={3} value={editing.notes ?? ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Отмена</Button>
            <Button onClick={() => {
              if (!editing) return;
              if (!editing.name.trim()) return toast.error("Укажите организацию");
              const { id, ...rest } = editing;
              saveLead(rest, id || undefined);
            }}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template editor */}
      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Шаблон холодного письма</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Тема</Label><Input value={subject} onChange={e => setSubject(e.target.value)} /></div>
            <div><Label>Текст письма</Label><Textarea rows={14} value={body} onChange={e => setBody(e.target.value)} /></div>
            <p className="text-xs text-muted-foreground">Подстановки: <code>{"{org}"}</code>, <code>{"{contact}"}</code></p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setSubject(DEFAULT_SUBJECT); setBody(DEFAULT_BODY); }}>Сбросить</Button>
            <Button onClick={saveTemplate}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}