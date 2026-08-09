import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Trash2, FileDown, Mail, Save, FileSignature, Edit, Settings2, X, ArrowLeft, Search, Users, Wallet, AlertTriangle, Check } from "lucide-react";
import { renderProposalHtml, calcProposalTotals, type ProposalRenderItem } from "@/lib/proposal-template";
import { generatePdfBlob, downloadBlob, blobToBase64, safePdfFilename } from "@/lib/document-pdf";
import { formatMoneyRub, formatDateRu, isValidIsoDate } from "@/lib/proposal-utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

type CrmClient = {
  id: string;
  name: string;
  contact_person: string | null;
  director_name: string | null;
  email: string | null;
  phone: string | null;
};

type Catalog = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  default_price: number;
  category: string | null;
  sort_order: number;
  is_default: boolean;
};

type Item = {
  id?: string;
  service_key?: string | null;
  title: string;
  description: string | null;
  price: number;
  qty: number;
  sort_order: number;
  included: boolean;
};

type Proposal = {
  id: string;
  number: string | null;
  client_name: string | null;
  client_org: string | null;
  client_email: string | null;
  client_phone: string | null;
  intro_text: string | null;
  footer_text: string | null;
  discount_percent: number;
  valid_until: string | null;
  status: string;
  total_amount: number;
  created_at: string;
};

const DEFAULT_INTRO = "Благодарим за интерес к нашим услугам. Направляем коммерческое предложение по комплексному сопровождению вашей организации. Все цены указаны в рублях, НДС не облагается (УСН).";
const DEFAULT_FOOTER = "Все работы выполняются по договору. Гарантия на разработку — 12 месяцев.";

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  sent: "Отправлено",
  accepted: "Принято",
  rejected: "Отклонено",
};
const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-400",
  accepted: "bg-green-500/15 text-green-400",
  rejected: "bg-red-500/15 text-red-400",
};

export default function ProposalsTab() {
  const [view, setView] = useState<"list" | "editor">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Ошибка загрузки: " + error.message);
    setProposals((data as Proposal[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    count: proposals.length,
    total: proposals.reduce((s, p) => s + (Number(p.total_amount) || 0), 0),
    noClient: proposals.filter(p => !p.client_org && !p.client_name).length,
  }), [proposals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return proposals.filter(p => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return [p.number, p.client_name, p.client_org, p.client_email]
        .some(v => (v || "").toLowerCase().includes(q));
    });
  }, [proposals, search, statusFilter]);

  if (view === "editor") {
    return (
      <ProposalEditor
        proposalId={editingId}
        onClose={() => { setView("list"); setEditingId(null); load(); }}
      />
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Коммерческие предложения</h2>
          <p className="text-sm text-muted-foreground">Конструктор КП с экспортом в PDF и отправкой на email</p>
        </div>
        <Button onClick={() => { setEditingId(null); setView("editor"); }} className="gap-2">
          <Plus className="h-4 w-4" /> Новое КП
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Всего КП", value: String(stats.count), icon: FileSignature },
          { label: "Общая сумма", value: formatMoneyRub(stats.total), icon: Wallet },
          { label: "Без клиента", value: String(stats.noClient), icon: Users },
        ].map(s => (
          <Card key={s.label} className="bg-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-lg font-semibold tabular-nums truncate">{s.value}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по номеру, клиенту или организации"
            aria-label="Поиск по коммерческим предложениям"
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[["all", "Все"], ...Object.entries(statusLabels)].map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={statusFilter === value ? "default" : "outline"}
              onClick={() => setStatusFilter(value)}
              className="h-8 text-xs"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Загрузка…</div>
      ) : proposals.length === 0 ? (
        <Card className="p-12 text-center bg-card">
          <FileSignature className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-4">Пока нет коммерческих предложений</p>
          <Button onClick={() => { setEditingId(null); setView("editor"); }} className="gap-2">
            <Plus className="h-4 w-4" /> Создать первое КП
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-card text-sm text-muted-foreground">
          Ничего не найдено по заданным условиям
        </Card>
      ) : (
        <Card className="overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">№</th>
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Контакт</th>
                  <th className="px-4 py-3 font-medium text-right">Сумма</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Действует до</th>
                  <th className="px-4 py-3 font-medium sticky right-0 bg-muted">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => { setEditingId(p.id); setView("editor"); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { setEditingId(p.id); setView("editor"); } }}
                    className="border-t hover:bg-muted/40 cursor-pointer focus:outline-none focus:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{p.number || "—"}</td>
                    <td className="px-4 py-3">
                      {p.client_org || p.client_name ? (
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.client_org || p.client_name}</div>
                          {p.client_org && p.client_name && (
                            <div className="text-xs text-muted-foreground truncate">{p.client_name}</div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-500">
                          <AlertTriangle className="h-3 w-3" /> Не указан клиент
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="truncate">{p.client_email || "—"}</div>
                      {p.client_phone && <div className="truncate">{p.client_phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatMoneyRub(p.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={statusColors[p.status] || ""} variant="outline">
                        {statusLabels[p.status] || p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateRu(p.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateRu(p.valid_until) || "—"}
                    </td>
                    <td className="px-4 py-2 sticky right-0 bg-card">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Редактировать КП"
                          aria-label={`Редактировать КП ${p.number || ""}`}
                          onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setView("editor"); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Удалить КП" aria-label={`Удалить КП ${p.number || ""}`} onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Удалить КП?")) return;
                          const { error } = await supabase.from("proposals").delete().eq("id", p.id);
                          if (error) toast.error(error.message); else { toast.success("Удалено"); load(); }
                        }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function ProposalEditor({ proposalId, onClose }: { proposalId: string | null; onClose: () => void }) {
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  /** Id of the proposal currently being edited — set after the first insert to avoid duplicates. */
  const [savedId, setSavedId] = useState<string | null>(proposalId);
  const [items, setItems] = useState<Item[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientOrg, setClientOrg] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [introText, setIntroText] = useState(DEFAULT_INTRO);
  const [footerText, setFooterText] = useState(DEFAULT_FOOTER);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [validUntil, setValidUntil] = useState("");
  const [number, setNumber] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString());
  const [saving, setSaving] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [working, setWorking] = useState<"" | "pdf" | "email">("");

  const loadCatalog = async () => {
    const { data } = await supabase.from("proposal_services_catalog").select("*").order("sort_order");
    setCatalog((data as Catalog[]) || []);
    return (data as Catalog[]) || [];
  };

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, contact_person, director_name, email, phone")
        .order("name");
      if (error) { toast.error("Не удалось загрузить клиентов: " + error.message); return; }
      setClients((data as CrmClient[]) || []);
    })();
  }, []);

  // initial load
  useEffect(() => {
    (async () => {
      const cat = await loadCatalog();
      if (proposalId) {
        const { data: p } = await supabase.from("proposals").select("*").eq("id", proposalId).maybeSingle();
        const { data: its } = await supabase.from("proposal_items").select("*").eq("proposal_id", proposalId).order("sort_order");
        if (p) {
          setClientName(p.client_name || "");
          setClientOrg(p.client_org || "");
          setClientEmail(p.client_email || "");
          setClientPhone(p.client_phone || "");
          setIntroText(p.intro_text || "");
          setFooterText(p.footer_text || "");
          setDiscountPercent(Number(p.discount_percent) || 0);
          setValidUntil(p.valid_until || "");
          setNumber(p.number);
          setCreatedAt(p.created_at);
        }
        setItems(((its as any[]) || []).map(it => ({
          id: it.id, service_key: it.service_key, title: it.title, description: it.description,
          price: Number(it.price), qty: Number(it.qty), sort_order: it.sort_order, included: it.included,
        })));
      } else {
        // default valid until = today + 30 days (YYYY-MM-DD)
        const d = new Date(Date.now() + 30 * 86400000);
        setValidUntil(d.toISOString().slice(0, 10));
        // pre-fill with default services
        setItems(cat.filter(c => c.is_default).map((c, i) => ({
          service_key: c.key, title: c.title, description: c.description, price: Number(c.default_price),
          qty: 1, sort_order: i, included: true,
        })));
      }
    })();
  }, [proposalId]);

  const pickClient = (c: CrmClient) => {
    setClientOrg(c.name || "");
    setClientName(c.contact_person || c.director_name || "");
    setClientEmail(c.email || "");
    setClientPhone(c.phone || "");
    setClientPickerOpen(false);
    toast.success(`Клиент «${c.name}» подставлен`);
  };

  const totals = useMemo(
    () => calcProposalTotals(items.filter(i => i.included), discountPercent),
    [items, discountPercent]
  );

  const renderData = useMemo(() => ({
    number,
    date: new Date(createdAt).toLocaleDateString("ru-RU"),
    clientName, clientOrg, clientEmail, clientPhone,
    introText, footerText, discountPercent,
    validUntil: validUntil ? formatDateRu(validUntil) || null : null,
    items: items.filter(i => i.included).map(i => ({
      title: i.title, description: i.description, price: i.price, qty: i.qty,
    })) as ProposalRenderItem[],
  }), [number, createdAt, clientName, clientOrg, clientEmail, clientPhone, introText, footerText, discountPercent, validUntil, items]);

  const html = useMemo(() => renderProposalHtml(renderData), [renderData]);

  const addFromCatalog = (c: Catalog) => {
    if (items.some(i => i.service_key === c.key)) {
      toast.info("Услуга уже добавлена");
      return;
    }
    setItems([...items, {
      service_key: c.key, title: c.title, description: c.description,
      price: Number(c.default_price), qty: 1, sort_order: items.length, included: true,
    }]);
  };

  const addCustom = () => {
    setItems([...items, {
      service_key: null, title: "Новая услуга", description: "",
      price: 0, qty: 1, sort_order: items.length, included: true,
    }]);
  };

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems(items.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  /** Returns an error message when the form is not ready to be saved. */
  const validate = (): string | null => {
    if (!clientOrg.trim() && !clientName.trim()) return "Укажите клиента: организацию или ФИО";
    if (!items.some(i => i.included)) return "Добавьте хотя бы одну включённую услугу";
    if (validUntil && !isValidIsoDate(validUntil)) return "Некорректная дата «Действует до» (формат ГГГГ-ММ-ДД, год 2000–9999)";
    return null;
  };

  const save = async (): Promise<string | null> => {
    const problem = validate();
    if (problem) { toast.error(problem); return null; }
    setSaving(true);
    try {
      let id = savedId;
      const payload = {
        client_name: clientName || null,
        client_org: clientOrg || null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        intro_text: introText || null,
        footer_text: footerText || null,
        discount_percent: discountPercent,
        valid_until: validUntil || null,
        total_amount: totals.total,
      };
      if (!id) {
        const { data: numData, error: numErr } = await supabase.rpc("next_proposal_number");
        if (numErr) throw numErr;
        const user = (await supabase.auth.getUser()).data.user;
        const { data: created, error } = await supabase.from("proposals")
          .insert({ ...payload, number: numData, created_by: user?.id, status: "draft" })
          .select().single();
        if (error) throw error;
        id = created.id;
        setSavedId(created.id);
        setNumber(created.number);
        setCreatedAt(created.created_at);
      } else {
        const { error } = await supabase.from("proposals").update(payload).eq("id", id);
        if (error) throw error;
      }
      // replace items
      const { error: delErr } = await supabase.from("proposal_items").delete().eq("proposal_id", id);
      if (delErr) throw delErr;
      if (items.length > 0) {
        const { error: itErr } = await supabase.from("proposal_items").insert(
          items.map((it, i) => ({
            proposal_id: id, service_key: it.service_key || null, title: it.title,
            description: it.description, price: it.price, qty: it.qty,
            sort_order: i, included: it.included,
          }))
        );
        if (itErr) throw itErr;
      }
      toast.success("Сохранено");
      return id;
    } catch (e: any) {
      toast.error("Ошибка сохранения: " + e.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    setWorking("pdf");
    try {
      const id = await save();
      if (!id) return;
      const { data: fresh } = await supabase.from("proposals").select("number, created_at").eq("id", id).maybeSingle();
      const docNumber = fresh?.number || number;
      const blob = await generatePdfBlob(renderProposalHtml({
        ...renderData,
        number: docNumber,
        date: formatDateRu(fresh?.created_at || createdAt),
      }));
      const fname = safePdfFilename(`KP-${docNumber || "draft"}-${clientOrg || clientName || "client"}.pdf`);
      downloadBlob(blob, fname);
      toast.success("PDF готов");
    } catch (e: any) {
      toast.error("Ошибка PDF: " + e.message);
    } finally { setWorking(""); }
  };

  const sendEmail = async () => {
    if (!clientEmail) { toast.error("Укажите email клиента"); return; }
    setWorking("email");
    try {
      const id = await save();
      if (!id) return;
      const { data: fresh } = await supabase.from("proposals").select("number, created_at").eq("id", id).maybeSingle();
      const docNumber = fresh?.number || number;
      const blob = await generatePdfBlob(renderProposalHtml({
        ...renderData,
        number: docNumber,
        date: formatDateRu(fresh?.created_at || createdAt),
      }));
      const base64 = await blobToBase64(blob);
      const fname = safePdfFilename(`KP-${docNumber || id.slice(0, 8)}.pdf`);
      const subj = `Коммерческое предложение №${docNumber || ""} — 24ZXC`;
      const emailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#15171e">
          <div style="border-left:3px solid #d4be37;padding:8px 16px;margin-bottom:20px">
            <div style="font-size:11px;letter-spacing:2px;color:#d4be37;text-transform:uppercase">24ZXC</div>
            <div style="font-size:18px;font-weight:600;margin-top:4px">Коммерческое предложение №${docNumber || ""}</div>
          </div>
          <p>Здравствуйте${clientName ? ", " + clientName : ""}!</p>
          <p>Направляем коммерческое предложение по запрошенным услугам. Документ во вложении.</p>
          <p>Итоговая сумма: <b>${formatMoneyRub(totals.total)}</b></p>
          ${validUntil ? `<p style="color:#8a8a93;font-size:13px">Предложение действительно до ${formatDateRu(validUntil)}.</p>` : ""}
          <p>С уважением,<br>команда 24ZXC<br><a href="https://24zxc.ru" style="color:#d4be37">24zxc.ru</a></p>
        </div>`;
      const { data, error } = await supabase.functions.invoke("send-document-email", {
        body: {
          to: clientEmail,
          subject: subj,
          html: emailHtml,
          attachments: [{ filename: fname, base64, contentType: "application/pdf" }],
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Ошибка отправки");
      await supabase.from("proposals").update({ status: "sent" }).eq("id", id);
      toast.success(`КП отправлено на ${clientEmail}`);
    } catch (e: any) {
      toast.error("Ошибка отправки: " + e.message);
    } finally { setWorking(""); }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> К списку
          </Button>
          <div>
            <h2 className="text-xl font-semibold">
              {savedId ? `Редактирование КП ${number ? "№" + number : ""}` : "Новое КП"}
            </h2>
            <p className="text-xs text-muted-foreground">Изменения в превью отображаются в реальном времени</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatalogOpen(true)} className="gap-2">
            <Settings2 className="h-4 w-4" /> Каталог
          </Button>
          <Button variant="outline" onClick={() => save()} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Сохранение…" : "Сохранить"}
          </Button>
          <Button variant="outline" onClick={downloadPdf} disabled={!!working} className="gap-2">
            <FileDown className="h-4 w-4" /> {working === "pdf" ? "PDF…" : "PDF"}
          </Button>
          <Button onClick={sendEmail} disabled={!!working || !clientEmail} className="gap-2">
            <Mail className="h-4 w-4" /> {working === "email" ? "Отправка…" : "Отправить"}
          </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        {/* LEFT — controls */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Клиент</h3>
              <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" aria-label="Выбрать клиента из CRM">
                    <Users className="h-3.5 w-3.5" /> Выбрать из CRM
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Поиск клиента…" />
                    <CommandList>
                      <CommandEmpty>Клиенты не найдены</CommandEmpty>
                      <CommandGroup>
                        {clients.map(c => (
                          <CommandItem
                            key={c.id}
                            value={`${c.name} ${c.contact_person || ""} ${c.email || ""}`}
                            onSelect={() => pickClient(c)}
                          >
                            <Check className={cn("mr-2 h-4 w-4", clientOrg === c.name ? "opacity-100" : "opacity-0")} />
                            <div className="min-w-0">
                              <div className="truncate">{c.name}</div>
                              {(c.contact_person || c.email) && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {[c.contact_person, c.email].filter(Boolean).join(" · ")}
                                </div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">ФИО</Label>
                <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Иван Иванов" /></div>
              <div className="space-y-1"><Label className="text-xs">Организация</Label>
                <Input value={clientOrg} onChange={e => setClientOrg(e.target.value)} placeholder="ООО «Учебный центр»" /></div>
              <div className="space-y-1"><Label className="text-xs">Email</Label>
                <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="ivan@example.ru" /></div>
              <div className="space-y-1"><Label className="text-xs">Телефон</Label>
                <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+7 ..." /></div>
            </div>
          </Card>

          <Card className="p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Услуги</h3>
              <Button size="sm" variant="ghost" onClick={addCustom} className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Своя услуга
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2 bg-card/50">
                  <div className="flex items-start gap-2">
                    <Checkbox checked={it.included} onCheckedChange={(v) => updateItem(idx, { included: !!v })} className="mt-1" />
                    <Input value={it.title} onChange={e => updateItem(idx, { title: e.target.value })}
                      className="flex-1 font-medium" />
                    <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea value={it.description || ""} onChange={e => updateItem(idx, { description: e.target.value })}
                    placeholder="Описание услуги" className="text-xs min-h-[60px]" rows={2} />
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-[10px] uppercase text-muted-foreground">Цена ₽</Label>
                      <Input type="number" value={it.price} onChange={e => updateItem(idx, { price: Number(e.target.value) || 0 })} /></div>
                    <div><Label className="text-[10px] uppercase text-muted-foreground">Кол-во</Label>
                      <Input type="number" value={it.qty} onChange={e => updateItem(idx, { qty: Number(e.target.value) || 0 })} /></div>
                    <div><Label className="text-[10px] uppercase text-muted-foreground">Сумма</Label>
                      <div className="h-10 flex items-center px-3 rounded-md border bg-muted/30 text-sm tabular-nums font-medium">
                        {new Intl.NumberFormat("ru-RU").format(it.price * it.qty)} ₽
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Добавить из каталога:</Label>
              <ScrollArea className="h-48 border rounded-lg p-2">
                <div className="space-y-1">
                  {catalog.map(c => {
                    const added = items.some(i => i.service_key === c.key);
                    return (
                      <button key={c.id} disabled={added} onClick={() => addFromCatalog(c)}
                        className="w-full flex items-center justify-between p-2 rounded text-left hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{c.title}</div>
                          {c.category && <div className="text-[10px] text-muted-foreground">{c.category}</div>}
                        </div>
                        <div className="text-xs tabular-nums text-primary font-medium ml-2">
                          {new Intl.NumberFormat("ru-RU").format(Number(c.default_price))} ₽
                        </div>
                        {added ? <X className="h-3 w-3 ml-2 text-muted-foreground" /> : <Plus className="h-3 w-3 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </Card>

          <Card className="p-4 space-y-3 bg-card">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Параметры</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Скидка, %</Label>
                <Input type="number" min={0} max={100} value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Действует до</Label>
                <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                {validUntil && !isValidIsoDate(validUntil) && (
                  <p className="text-[11px] text-destructive">Некорректная дата — нужен формат ГГГГ-ММ-ДД, год 2000–9999</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Вступительный текст</Label>
              <Textarea value={introText} onChange={e => setIntroText(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Подпись внизу</Label>
              <Textarea value={footerText} onChange={e => setFooterText(e.target.value)} rows={2} />
            </div>
            <div className="pt-2 border-t flex justify-between text-sm">
              <span className="text-muted-foreground">Итого к оплате:</span>
              <span className="font-bold text-lg text-primary tabular-nums">
                {formatMoneyRub(totals.total)}
              </span>
            </div>
          </Card>
        </div>

        {/* RIGHT — preview */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <Card className="overflow-hidden bg-white">
            <div className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-b flex items-center justify-between">
              <span>Предпросмотр (так выглядит PDF)</span>
              <span className="font-mono">A4 · 794px</span>
            </div>
            <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
              <iframe title="proposal-preview" srcDoc={html}
                style={{ width: "794px", border: "none", display: "block", transformOrigin: "top left" }}
                className="min-h-[1123px] scale-[0.75] origin-top-left"
              />
            </div>
          </Card>
        </div>
      </div>

      <CatalogDialog open={catalogOpen} onClose={() => { setCatalogOpen(false); loadCatalog(); }} />
    </div>
  );
}

function CatalogDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [list, setList] = useState<Catalog[]>([]);
  const [adding, setAdding] = useState<Partial<Catalog>>({});

  const load = async () => {
    const { data } = await supabase.from("proposal_services_catalog").select("*").order("sort_order");
    setList((data as Catalog[]) || []);
  };
  useEffect(() => { if (open) load(); }, [open]);

  const update = async (id: string, patch: Partial<Catalog>) => {
    setList(list.map(c => c.id === id ? { ...c, ...patch } as Catalog : c));
    await supabase.from("proposal_services_catalog").update(patch).eq("id", id);
  };
  const remove = async (id: string) => {
    if (!confirm("Удалить услугу из каталога?")) return;
    await supabase.from("proposal_services_catalog").delete().eq("id", id);
    load();
  };
  const add = async () => {
    if (!adding.title || !adding.key) { toast.error("Укажите ключ и название"); return; }
    const { error } = await supabase.from("proposal_services_catalog").insert({
      key: adding.key, title: adding.title, description: adding.description || null,
      default_price: Number(adding.default_price) || 0, category: adding.category || null,
      sort_order: list.length * 10 + 10, is_default: !!adding.is_default,
    });
    if (error) { toast.error(error.message); return; }
    setAdding({});
    load();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle>Каталог услуг</DialogTitle></DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2">
            {list.map(c => (
              <div key={c.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={c.title} onChange={e => update(c.id, { title: e.target.value })} className="font-medium" />
                  <Input value={c.category || ""} onChange={e => update(c.id, { category: e.target.value })} placeholder="Категория" className="w-40" />
                  <Input type="number" value={c.default_price} onChange={e => update(c.id, { default_price: Number(e.target.value) || 0 })} className="w-32" />
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Textarea value={c.description || ""} onChange={e => update(c.id, { description: e.target.value })}
                  placeholder="Описание" rows={2} className="text-xs" />
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-2">
                    <Checkbox checked={c.is_default} onCheckedChange={(v) => update(c.id, { is_default: !!v })} />
                    По умолчанию в новых КП
                  </label>
                  <span className="text-muted-foreground font-mono">{c.key}</span>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="border-2 border-dashed rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-medium">Добавить услугу</h4>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Ключ (latin, напр. consulting)" value={adding.key || ""} onChange={e => setAdding({ ...adding, key: e.target.value })} />
              <Input placeholder="Категория" value={adding.category || ""} onChange={e => setAdding({ ...adding, category: e.target.value })} />
              <Input placeholder="Название" value={adding.title || ""} onChange={e => setAdding({ ...adding, title: e.target.value })} className="col-span-2" />
              <Textarea placeholder="Описание" value={adding.description || ""} onChange={e => setAdding({ ...adding, description: e.target.value })} rows={2} className="col-span-2" />
              <Input type="number" placeholder="Цена" value={adding.default_price || ""} onChange={e => setAdding({ ...adding, default_price: Number(e.target.value) })} />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={!!adding.is_default} onCheckedChange={(v) => setAdding({ ...adding, is_default: !!v })} />
                По умолчанию в новых КП
              </label>
            </div>
            <Button onClick={add} className="gap-2"><Plus className="h-4 w-4" /> Добавить</Button>
          </div>
        </ScrollArea>
        <DialogFooter><Button variant="outline" onClick={onClose}>Закрыть</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}