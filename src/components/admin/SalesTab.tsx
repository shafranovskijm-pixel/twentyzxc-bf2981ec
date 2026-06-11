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
import { Plus, Search, MoreVertical, Mail, RefreshCw, Pencil, Trash2, Download, FileEdit, Loader2, ExternalLink, Sparkles, Database, Upload, FileSpreadsheet } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import ImportLeadsDialog from "./sales/ImportLeadsDialog";
import { makeDedupHash, toColdyCSV, downloadFile } from "./sales/lead-utils";

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
  city?: string | null;
  region?: string | null;
  address?: string | null;
  category?: string | null;
  dedup_hash?: string | null;
};

const STATUSES: { value: string; label: string; tone: string }[] = [
  { value: "new",       label: "Новый",            tone: "bg-slate-500/15 text-slate-200 border-slate-500/30" },
  { value: "emailed",   label: "Письмо отправлено", tone: "bg-blue-500/15 text-blue-200 border-blue-500/30" },
  { value: "replied",   label: "Ответ получен",    tone: "bg-amber-500/15 text-amber-200 border-amber-500/30" },
  { value: "demo",      label: "Демо назначено",   tone: "bg-violet-500/15 text-violet-200 border-violet-500/30" },
  { value: "contract",  label: "Договор",          tone: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30" },
  { value: "later",     label: "Позже",            tone: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30" },
  { value: "client",    label: "Клиент",           tone: "bg-emerald-500/25 text-emerald-100 border-emerald-500/50" },
  { value: "rejected",  label: "Отказ",            tone: "bg-rose-500/15 text-rose-200 border-rose-500/30" },
];

// Пресеты фильтров (включая псевдо-статусы по наличию полей)
const FILTER_PRESETS: { value: string; label: string }[] = [
  { value: "all", label: "Все статусы" },
  { value: "new", label: "Новые" },
  { value: "has_email", label: "Есть email" },
  { value: "has_phone", label: "Есть телефон" },
  { value: "no_contact", label: "Нет контактов" },
  { value: "emailed", label: "Письмо отправлено" },
  { value: "replied", label: "Ответили" },
  { value: "demo", label: "Назначить демо" },
  { value: "rejected", label: "Не интересно" },
  { value: "later", label: "Позже" },
  { value: "client", label: "Клиент" },
];

const DEFAULT_SUBJECT = "Дистанционное обучение для вашего учебного центра — 15 минут демо";
const DEFAULT_BODY = `Добрый день.

Меня зовут Максим Шафрановский. Я развиваю платформу СИНТАГМА для учебных центров: СДО, готовые курсы, ИИ-генерация курсов, документы организации и контроль прохождения обучения.

Помогаем учебным центрам быстро запускать дистанционное обучение: добавить ученика, назначить курс, контролировать прохождение и вести документы в одной системе.

Могу бесплатно показать за 15 минут, как это работает и как можно адаптировать платформу под вашу организацию.

Вам актуально посмотреть демо?`;

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
  const [nameQuery, setNameQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [sugOpen, setSugOpen] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [innLookup, setInnLookup] = useState(false);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [registryRegion, setRegistryRegion] = useState("77");
  const [registryLimit, setRegistryLimit] = useState(10);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [composeLead, setComposeLead] = useState<Lead | null>(null);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);

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

  // DaData suggestions while typing org name in dialog
  useEffect(() => {
    if (!editing || editing.id) { setSuggestions([]); return; }
    const q = nameQuery.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    let cancel = false;
    setSugLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.functions.invoke("dadata-suggest", { body: { query: q } });
        if (!cancel) {
          setSuggestions(data?.suggestions ?? []);
          setSugOpen(true);
        }
      } catch {} finally { if (!cancel) setSugLoading(false); }
    }, 280);
    return () => { cancel = true; clearTimeout(t); };
  }, [nameQuery, editing]);

  function applySuggestion(s: any) {
    if (!editing) return;
    setEditing({
      ...editing,
      name: s.name || s.value,
      inn: s.inn || editing.inn,
      email: editing.email || s.email,
      phone: editing.phone || s.phone,
      contact_person: editing.contact_person || s.management || "",
      source: editing.source || "DaData",
      license_cache: { ...(editing.license_cache || {}), address: s.address, ogrn: s.ogrn, kpp: s.kpp },
    });
    setNameQuery(s.name || s.value);
    setSugOpen(false);
  }

  async function lookupByInn() {
    if (!editing) return;
    const inn = (editing.inn || "").trim();
    if (!/^\d{10}$|^\d{12}$/.test(inn)) return toast.error("ИНН должен быть 10 или 12 цифр");
    setInnLookup(true);
    try {
      const { data, error } = await supabase.functions.invoke("dadata-lookup", { body: { inn } });
      if (error) throw error;
      if (!data?.found) { toast.info("Ничего не найдено по ИНН"); return; }
      const _name = data.name_short || data.name;
      setEditing({
        ...editing,
        name: editing.name?.trim() || _name || "",
        contact_person: editing.contact_person || data.management_name || "",
        source: editing.source || "Реестр / ИНН",
        license_cache: { ...data, org_name: _name, found: true },
      });
      setNameQuery(_name || "");
      toast.success(`Найдено: ${_name}`);
    } catch (e: any) {
      toast.error(e?.message || "Ошибка поиска");
    } finally { setInnLookup(false); }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter(l => {
      if (statusFilter !== "all") {
        if (statusFilter === "has_email") { if (!l.email) return false; }
        else if (statusFilter === "has_phone") { if (!l.phone) return false; }
        else if (statusFilter === "no_contact") { if (l.email || l.phone) return false; }
        else if (l.status !== statusFilter) return false;
      }
      if (!q) return true;
      return [l.name, l.inn, l.email, l.website, l.contact_person]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
    });
  }, [leads, search, statusFilter]);

  const existingHashes = useMemo(() => {
    const s = new Set<string>();
    for (const l of leads) {
      const h = l.dedup_hash || makeDedupHash(l);
      if (h) s.add(h);
    }
    return s;
  }, [leads]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  const allFilteredSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id));
  function toggleSelectAll() {
    if (allFilteredSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(l => l.id)));
  }

  function openCompose(l: Lead) {
    setComposeLead(l);
    setComposeSubject(subject.replace(/\{org\}/g, l.name));
    setComposeBody(body.replace(/\{org\}/g, l.name).replace(/\{contact\}/g, l.contact_person ?? ""));
  }

  async function sendComposed() {
    if (!composeLead?.email) return toast.error("Нет email");
    setSending(true);
    try {
      const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;white-space:pre-wrap;color:#1a1a1a;font-size:15px;line-height:1.55;">${composeBody.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</div>`;
      const { data, error } = await supabase.functions.invoke("send-document-email", {
        body: { to: composeLead.email, subject: composeSubject, html },
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || "Не удалось отправить");
      await supabase.from("sales_leads")
        .update({ status: "emailed", last_email_sent_at: new Date().toISOString() })
        .eq("id", composeLead.id);
      toast.success(`Письмо отправлено на ${composeLead.email}`);
      setComposeLead(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Ошибка отправки");
    } finally { setSending(false); }
  }

  function exportColdy() {
    const target = selected.size > 0
      ? leads.filter(l => selected.has(l.id))
      : filtered;
    const withEmail = target.filter(l => l.email);
    if (!withEmail.length) return toast.error("Нет лидов с email для экспорта");
    const csv = toColdyCSV(withEmail);
    downloadFile(`coldy-leads-${new Date().toISOString().slice(0,10)}.csv`, csv);
    toast.success(`Экспортировано ${withEmail.length} лидов`);
  }

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
      const { data, error } = await supabase.functions.invoke("dadata-lookup", { body: { inn: lead.inn } });
      if (error) throw error;
      if (!data?.found) { toast.info("В реестре не найдено"); return; }
      const _name = data.name_short || data.name;
      const patch: any = { license_cache: { ...data, org_name: _name, found: true } };
      if (!lead.name) patch.name = _name;
      if (!lead.contact_person && data.management_name) patch.contact_person = data.management_name;
      await supabase.from("sales_leads").update(patch).eq("id", lead.id);
      toast.success("Реквизиты обновлены");
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
        const { data } = await supabase.functions.invoke("dadata-lookup", { body: { inn: l.inn } });
        if (data?.found) {
          const _name = data.name_short || data.name;
          await supabase.from("sales_leads").update({ license_cache: { ...data, org_name: _name, found: true } }).eq("id", l.id);
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
    const rowsWithHash = rows.map(r => ({ ...r, dedup_hash: makeDedupHash(r as any) }));
    const { error } = await supabase.from("sales_leads").insert(rowsWithHash as any);
    if (error) return toast.error(error.message);
    toast.success(`Добавлено ${rows.length}`);
    load();
  }

  async function importFromRegistry() {
    setRegistryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-rosobrnadzor", {
        body: { mode: "recent", region: registryRegion === "all" ? "" : registryRegion, limit: registryLimit, withDetails: true, pages: 2 },
      });
      if (error) throw error;
      const results: any[] = data?.results ?? [];
      if (!results.length) { toast.info("Реестр не вернул записей"); return; }
      const userRes = await supabase.auth.getUser();
      const user_id = userRes.data.user?.id;
      if (!user_id) { toast.error("Нет авторизации"); return; }
      const existingInns = new Set(leads.map(l => l.inn).filter(Boolean) as string[]);
      const existingNames = new Set(leads.map(l => l.name));
      const rows = results
        .filter(r => (r.inn ? !existingInns.has(r.inn) : !existingNames.has(r.org_name)))
        .map(r => ({
          user_id,
          name: r.org_name || "Без названия",
          inn: r.inn || null,
          email: r.email || null,
          phone: r.phone || null,
          contact_person: r.director || null,
          source: `Реестр Рособрнадзора (рег. ${registryRegion})`,
          status: "new",
          notes: r.address ? `Адрес: ${r.address}` : null,
          license_cache: {
            found: true,
            org_name: r.org_name,
            license_number: r.reg_number,
            license_date: r.order_date,
            license_status: r.status,
            address: r.address,
            ogrn: r.ogrn,
            registry_url: r.registry_url,
          },
        }));
      if (!rows.length) { toast.info("Все эти организации уже есть в лидах"); setRegistryOpen(false); return; }
      const rowsWithHash = rows.map(r => ({ ...r, dedup_hash: makeDedupHash(r as any) }));
      const { error: insErr } = await supabase.from("sales_leads").insert(rowsWithHash as any);
      if (insErr) throw insErr;
      toast.success(`Добавлено ${rows.length} новых лидов из реестра`);
      setRegistryOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Ошибка загрузки из реестра");
    } finally {
      setRegistryLoading(false);
    }
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
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Фильтр" /></SelectTrigger>
          <SelectContent>
            {FILTER_PRESETS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />Импорт XLSX/CSV
        </Button>
        <Button variant="outline" onClick={exportColdy}>
          <Download className="h-4 w-4 mr-2" />Экспорт для Coldy{selected.size > 0 ? ` (${selected.size})` : ""}
        </Button>
        <Button variant="outline" onClick={importFromContracts}><Download className="h-4 w-4 mr-2" />Из договоров</Button>
        <Button variant="outline" onClick={() => setRegistryOpen(true)}>
          <Database className="h-4 w-4 mr-2" />Из реестра Рособрнадзора
        </Button>
        <Button variant="outline" onClick={syncAllReq} disabled={syncAll}>
          {syncAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Обогатить (ИНН)
        </Button>
        <Button variant="outline" onClick={() => setTplOpen(true)}><FileEdit className="h-4 w-4 mr-2" />Шаблон письма</Button>
        <Button onClick={() => { setNameQuery(""); setSuggestions([]); setEditing({ id: "", name: "", inn: "", website: "", email: "", phone: "", contact_person: "", source: "", status: "new", next_step: "", notes: "", license_cache: null, last_email_sent_at: null }); }}>
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
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setNameQuery(""); setSuggestions([]); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Редактировать лид" : "Новый лид"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label>Организация *  <span className="text-xs text-muted-foreground font-normal">(введите 2+ символа — подскажет DaData)</span></Label>
                <Popover open={sugOpen && suggestions.length > 0} onOpenChange={setSugOpen}>
                  <PopoverTrigger asChild>
                    <Input
                      value={editing.id ? editing.name : nameQuery}
                      onChange={e => {
                        if (editing.id) setEditing({ ...editing, name: e.target.value });
                        else { setNameQuery(e.target.value); setEditing({ ...editing, name: e.target.value }); }
                      }}
                      onFocus={() => suggestions.length > 0 && setSugOpen(true)}
                      placeholder="Название или ИНН организации"
                    />
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[min(640px,90vw)]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <div className="max-h-72 overflow-y-auto">
                      {sugLoading && <div className="p-3 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 inline animate-spin mr-1" />Поиск…</div>}
                      {suggestions.map((s, i) => (
                        <button key={i} type="button" onClick={() => applySuggestion(s)} className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b border-border/30 last:border-0">
                          <div className="text-sm font-medium truncate">{s.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            ИНН {s.inn || "—"} {s.address ? `· ${s.address}` : ""}
                          </div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>ИНН</Label>
                <div className="flex gap-2">
                  <Input value={editing.inn ?? ""} onChange={e => setEditing({ ...editing, inn: e.target.value.replace(/\D/g, "") })} placeholder="10 или 12 цифр" />
                  <Button type="button" variant="outline" size="icon" onClick={lookupByInn} disabled={innLookup} title="Подтянуть по ИНН">
                    {innLookup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
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
              {(editing.license_cache?.license_number || editing.license_cache?.address) && (
                <div className="md:col-span-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-1">
                  {editing.license_cache?.license_number && (
                    <div>📜 Лицензия № <b>{editing.license_cache.license_number}</b>{editing.license_cache.license_date ? ` от ${editing.license_cache.license_date}` : ""} {editing.license_cache.license_status ? `· ${editing.license_cache.license_status}` : ""}</div>
                  )}
                  {editing.license_cache?.address && <div className="text-muted-foreground">📍 {editing.license_cache.address}</div>}
                  {editing.license_cache?.management_name && <div className="text-muted-foreground">👤 {editing.license_cache.management_post || "Руководитель"}: {editing.license_cache.management_name}</div>}
                </div>
              )}
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

      {/* Registry import dialog */}
      <Dialog open={registryOpen} onOpenChange={(o) => !registryLoading && setRegistryOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Свежие лицензии из реестра</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Загружу последние выданные лицензии на образовательную деятельность из реестра
              <b> islod.obrnadzor.gov.ru</b> и сразу добавлю их в лиды с парсингом ИНН, адреса и контактов из карточки.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Регион</Label>
                <Select value={registryRegion} onValueChange={setRegistryRegion}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="77">77 — Москва</SelectItem>
                    <SelectItem value="78">78 — Санкт-Петербург</SelectItem>
                    <SelectItem value="50">50 — Московская обл.</SelectItem>
                    <SelectItem value="47">47 — Ленинградская обл.</SelectItem>
                    <SelectItem value="66">66 — Свердловская обл.</SelectItem>
                    <SelectItem value="23">23 — Краснодарский край</SelectItem>
                    <SelectItem value="16">16 — Татарстан</SelectItem>
                    <SelectItem value="74">74 — Челябинская обл.</SelectItem>
                    <SelectItem value="all">Все регионы</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Сколько загрузить</Label>
                <Select value={String(registryLimit)} onValueChange={(v) => setRegistryLimit(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 30, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ⏱ Парсинг ~{Math.ceil(registryLimit * 0.5)} сек. (по 200мс на карточку). Дубликаты по ИНН/названию пропускаются.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRegistryOpen(false)} disabled={registryLoading}>Отмена</Button>
            <Button onClick={importFromRegistry} disabled={registryLoading}>
              {registryLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
              Загрузить {registryLimit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}