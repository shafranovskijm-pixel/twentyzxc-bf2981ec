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
import { Plus, Trash2, FileDown, Mail, Save, FileSignature, Edit, Settings2, X, ArrowLeft, GripVertical } from "lucide-react";
import { renderProposalHtml, calcProposalTotals, type ProposalRenderItem } from "@/lib/proposal-template";
import { generatePdfBlob, downloadBlob, blobToBase64, safePdfFilename } from "@/lib/document-pdf";

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

  if (view === "editor") {
    return (
      <ProposalEditor
        proposalId={editingId}
        onClose={() => { setView("list"); setEditingId(null); load(); }}
      />
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Коммерческие предложения</h2>
          <p className="text-sm text-muted-foreground">Конструктор КП с экспортом в PDF и отправкой на email</p>
        </div>
        <Button onClick={() => { setEditingId(null); setView("editor"); }} className="gap-2">
          <Plus className="h-4 w-4" /> Новое КП
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Загрузка…</div>
      ) : proposals.length === 0 ? (
        <Card className="p-12 text-center">
          <FileSignature className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-4">Пока нет коммерческих предложений</p>
          <Button onClick={() => { setEditingId(null); setView("editor"); }} className="gap-2">
            <Plus className="h-4 w-4" /> Создать первое КП
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">№</th>
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Организация</th>
                  <th className="px-4 py-3 font-medium text-right">Сумма</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium sticky right-0 bg-muted/50">Действия</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map(p => (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.number || "—"}</td>
                    <td className="px-4 py-3">{p.client_name || "—"}</td>
                    <td className="px-4 py-3">{p.client_org || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {new Intl.NumberFormat("ru-RU").format(Math.round(Number(p.total_amount)))} ₽
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={statusColors[p.status] || ""} variant="outline">
                        {statusLabels[p.status] || p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-2 sticky right-0 bg-card">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingId(p.id); setView("editor"); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={async () => {
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
        // pre-fill with default services
        setItems(cat.filter(c => c.is_default).map((c, i) => ({
          service_key: c.key, title: c.title, description: c.description, price: Number(c.default_price),
          qty: 1, sort_order: i, included: true,
        })));
      }
    })();
  }, [proposalId]);

  const totals = useMemo(
    () => calcProposalTotals(items.filter(i => i.included), discountPercent),
    [items, discountPercent]
  );

  const renderData = useMemo(() => ({
    number,
    date: new Date(createdAt).toLocaleDateString("ru-RU"),
    clientName, clientOrg, clientEmail, clientPhone,
    introText, footerText, discountPercent,
    validUntil: validUntil ? new Date(validUntil).toLocaleDateString("ru-RU") : null,
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

  const save = async (): Promise<string | null> => {
    setSaving(true);
    try {
      let id = proposalId;
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
        setNumber(created.number);
      } else {
        const { error } = await supabase.from("proposals").update(payload).eq("id", id);
        if (error) throw error;
      }
      // replace items
      await supabase.from("proposal_items").delete().eq("proposal_id", id);
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
      const blob = await generatePdfBlob(html);
      const fname = safePdfFilename(`KP-${number || "draft"}-${clientOrg || clientName || "client"}.pdf`);
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
      const blob = await generatePdfBlob(html);
      const base64 = await blobToBase64(blob);
      const fname = safePdfFilename(`KP-${number || id.slice(0,8)}.pdf`);
      const subj = `Коммерческое предложение №${number || ""} — 24ZXC`;
      const emailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#15171e">
          <div style="border-left:3px solid #d4be37;padding:8px 16px;margin-bottom:20px">
            <div style="font-size:11px;letter-spacing:2px;color:#d4be37;text-transform:uppercase">24ZXC</div>
            <div style="font-size:18px;font-weight:600;margin-top:4px">Коммерческое предложение №${number || ""}</div>
          </div>
          <p>Здравствуйте${clientName ? ", " + clientName : ""}!</p>
          <p>Направляем коммерческое предложение по запрошенным услугам. Документ во вложении.</p>
          <p>Итоговая сумма: <b>${new Intl.NumberFormat("ru-RU").format(Math.round(totals.total))} ₽</b></p>
          ${validUntil ? `<p style="color:#8a8a93;font-size:13px">Предложение действительно до ${new Date(validUntil).toLocaleDateString("ru-RU")}.</p>` : ""}
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
              {proposalId ? `Редактирование КП ${number ? "№" + number : ""}` : "Новое КП"}
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

      <div className="grid lg:grid-cols-2 gap-4">
        {/* LEFT — controls */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Клиент</h3>
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

          <Card className="p-4 space-y-3">
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

          <Card className="p-4 space-y-3">
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
                {new Intl.NumberFormat("ru-RU").format(Math.round(totals.total))} ₽
              </span>
            </div>
          </Card>
        </div>

        {/* RIGHT — preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
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