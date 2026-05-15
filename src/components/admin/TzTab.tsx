import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ClipboardList, Plus, FileDown, FileText, Eye, Trash2, MoreVertical, Loader2, ArrowLeft, ArrowRight, Save, Search, X } from "lucide-react";
import { toast } from "sonner";
import type { TzPayload, TzSection } from "@/lib/tz/types";
import { renderTzHtml, exportTzPdf, exportTzDocx } from "@/lib/tz/render";

type Step = 1 | 2 | 3 | 4;

const emptyPayload = (): TzPayload => ({
  client_name: "",
  sections: [],
});

const TzTab = () => {
  const qc = useQueryClient();

  // List
  const [search, setSearch] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [contractId, setContractId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState<TzPayload>(emptyPayload);
  const [saving, setSaving] = useState(false);

  // Data
  const { data: tzList = [], isLoading: loadingList } = useQuery({
    queryKey: ["tz_documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tz_documents" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["tz_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tz_templates" as any)
        .select("*")
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["tz-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients" as any).select("id, name, inn, legal_address, director_name").order("name");
      return (data || []) as any[];
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["tz-contracts"],
    queryFn: async () => {
      const { data } = await supabase.from("contracts" as any)
        .select("id, client_name, contract_number, contract_date, amount")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tzList;
    return tzList.filter((t: any) =>
      `${t.title} ${t.tz_number || ""} ${t.client_name}`.toLowerCase().includes(q),
    );
  }, [tzList, search]);

  const resetWizard = () => {
    setStep(1);
    setEditingId(null);
    setTemplateId("");
    setClientId("");
    setContractId("");
    setTitle("");
    setPayload(emptyPayload());
  };

  const openNew = () => {
    resetWizard();
    setWizardOpen(true);
  };

  const openEdit = (row: any) => {
    resetWizard();
    setEditingId(row.id);
    setTemplateId(row.template_id || "");
    setClientId(row.client_id || "");
    setContractId(row.contract_id || "");
    setTitle(row.title || "");
    setPayload({ ...emptyPayload(), ...(row.payload || {}) });
    setStep(2);
    setWizardOpen(true);
  };

  // Apply template → seed payload sections
  const applyTemplate = (tplId: string) => {
    const tpl = templates.find((t: any) => t.id === tplId);
    if (!tpl) return;
    setTemplateId(tplId);
    setPayload(p => ({
      ...p,
      sections: (tpl.sections as TzSection[]).map(s => ({ ...s, enabled: true })),
    }));
    if (!title) setTitle(tpl.name);
  };

  // Apply client → autofill requisites
  const applyClient = (cid: string) => {
    setClientId(cid);
    const c = clients.find((x: any) => x.id === cid);
    if (!c) return;
    setPayload(p => ({
      ...p,
      client_name: c.name || p.client_name,
      client_inn: c.inn || p.client_inn,
      legal_address: c.legal_address || p.legal_address,
      director_name: c.director_name || p.director_name,
    }));
  };

  // Apply contract → autofill contract info
  const applyContract = (id: string) => {
    setContractId(id);
    const c = contracts.find((x: any) => x.id === id);
    if (!c) return;
    setPayload(p => ({
      ...p,
      client_name: p.client_name || c.client_name,
      contract_number: c.contract_number || p.contract_number,
      contract_date: c.contract_date || p.contract_date,
      contract_amount: c.amount ? Number(c.amount) : p.contract_amount,
    }));
  };

  const toggleItem = (sIdx: number, iIdx: number) => {
    setPayload(p => {
      const sections = p.sections.map((s, si) => si !== sIdx ? s : {
        ...s,
        items: s.items.map((it, ii) => ii !== iIdx ? it : { ...it, checked: !it.checked }),
      });
      return { ...p, sections };
    });
  };

  const toggleSection = (sIdx: number) => {
    setPayload(p => {
      const sections = p.sections.map((s, si) => si !== sIdx ? s : { ...s, enabled: s.enabled === false ? true : false });
      return { ...p, sections };
    });
  };

  const updateSectionNote = (sIdx: number, value: string) => {
    setPayload(p => ({
      ...p,
      sections: p.sections.map((s, si) => si !== sIdx ? s : { ...s, customNote: value }),
    }));
  };

  const addCustomItem = (sIdx: number) => {
    const label = window.prompt("Текст пункта:");
    if (!label) return;
    setPayload(p => ({
      ...p,
      sections: p.sections.map((s, si) => si !== sIdx ? s : {
        ...s,
        items: [...s.items, { id: `custom-${Date.now()}`, label, checked: true }],
      }),
    }));
  };

  const buildHtmlNow = (tzNumber?: string, tzDate?: string) =>
    renderTzHtml(payload, { tzNumber, tzDate, title });

  // Save
  const saveAndExport = async (kind: "save" | "pdf" | "docx" | "preview") => {
    if (kind !== "preview") setSaving(true);
    try {
      // Need a TZ number on first save
      let tzNumber: string | undefined;
      let tzDate = new Date().toISOString().slice(0, 10);
      let id = editingId;

      if (!id) {
        // Get next number
        const { data: numData, error: numErr } = await supabase.rpc("next_tz_number" as any);
        if (numErr) throw numErr;
        tzNumber = numData as string;

        const html = renderTzHtml(payload, { tzNumber, tzDate, title });
        const insertRow: any = {
          client_id: clientId || null,
          client_name: payload.client_name || "—",
          client_inn: payload.client_inn || null,
          contract_id: contractId || null,
          template_id: templateId || null,
          title: title || "Техническое задание",
          tz_number: tzNumber,
          tz_date: tzDate,
          payload: payload as any,
          html_content: html,
        };
        const { data: ins, error: insErr } = await supabase
          .from("tz_documents" as any)
          .insert(insertRow)
          .select("*")
          .single();
        if (insErr) throw insErr;
        id = (ins as any).id;
        setEditingId(id);
      } else {
        // Update existing
        const existing = tzList.find((t: any) => t.id === id);
        tzNumber = existing?.tz_number;
        tzDate = existing?.tz_date || tzDate;
        const html = renderTzHtml(payload, { tzNumber, tzDate, title });
        const upd: any = {
          client_id: clientId || null,
          client_name: payload.client_name || "—",
          client_inn: payload.client_inn || null,
          contract_id: contractId || null,
          template_id: templateId || null,
          title: title || "Техническое задание",
          payload: payload as any,
          html_content: html,
        };
        const { error: updErr } = await supabase.from("tz_documents" as any).update(upd).eq("id", id);
        if (updErr) throw updErr;
      }

      qc.invalidateQueries({ queryKey: ["tz_documents"] });
      qc.invalidateQueries({ queryKey: ["unified-documents"] });

      const safeTitle = (title || "TZ").replace(/[^\w\d-]+/g, "_").slice(0, 40);
      const safeNum = (tzNumber || "").replace(/[\/\\]/g, "-");
      const baseName = `TZ_${safeNum}_${safeTitle}`;
      const html = renderTzHtml(payload, { tzNumber, tzDate, title });

      if (kind === "pdf") {
        await exportTzPdf(html, `${baseName}.pdf`);
        toast.success("PDF сохранён");
      } else if (kind === "docx") {
        await exportTzDocx(payload, { tzNumber, tzDate, title, fileName: `${baseName}.docx` });
        toast.success("Word сохранён");
      } else if (kind === "save") {
        toast.success("ТЗ сохранено");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const deleteTz = async (id: string) => {
    if (!window.confirm("Удалить ТЗ?")) return;
    const { error } = await supabase.from("tz_documents" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["tz_documents"] });
    qc.invalidateQueries({ queryKey: ["unified-documents"] });
    toast.success("ТЗ удалено");
  };

  const previewExisting = (row: any) => {
    const html = row.html_content || renderTzHtml(row.payload as TzPayload, { tzNumber: row.tz_number, tzDate: row.tz_date, title: row.title });
    setPreviewHtml(html);
  };

  const downloadExisting = async (row: any, kind: "pdf" | "docx") => {
    const safeTitle = (row.title || "TZ").replace(/[^\w\d-]+/g, "_").slice(0, 40);
    const safeNum = (row.tz_number || "").replace(/[\/\\]/g, "-");
    const baseName = `TZ_${safeNum}_${safeTitle}`;
    if (kind === "pdf") {
      const html = row.html_content || renderTzHtml(row.payload, { tzNumber: row.tz_number, tzDate: row.tz_date, title: row.title });
      await exportTzPdf(html, `${baseName}.pdf`);
    } else {
      await exportTzDocx(row.payload, { tzNumber: row.tz_number, tzDate: row.tz_date, title: row.title, fileName: `${baseName}.docx` });
    }
  };

  // Step navigation
  const canNext =
    step === 1 ? !!payload.client_name :
    step === 2 ? !!templateId && payload.sections.length > 0 :
    true;

  return (
    <div className="space-y-4 pb-24">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Технические задания
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по клиенту, номеру…"
                className="pl-8 w-56"
              />
            </div>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> Новое ТЗ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-40" />
              Пока нет ни одного ТЗ. Нажмите «Новое ТЗ», чтобы создать.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">№</th>
                    <th className="px-3 py-2 font-medium">Дата</th>
                    <th className="px-3 py-2 font-medium">Клиент</th>
                    <th className="px-3 py-2 font-medium">Название</th>
                    <th className="px-3 py-2 font-medium sticky right-0 bg-muted/40 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row: any) => (
                    <tr key={row.id} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono text-xs">{row.tz_number || "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {new Date(row.tz_date || row.created_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-3 py-2">{row.client_name}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span>{row.title}</span>
                          {row.contract_id && <Badge variant="outline" className="text-[10px]">договор</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-2 sticky right-0 bg-background">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => previewExisting(row)}>
                              <Eye className="h-4 w-4 mr-2" /> Превью
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(row)}>
                              <FileText className="h-4 w-4 mr-2" /> Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadExisting(row, "pdf")}>
                              <FileDown className="h-4 w-4 mr-2" /> Скачать PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadExisting(row, "docx")}>
                              <FileDown className="h-4 w-4 mr-2" /> Скачать Word
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteTz(row.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wizard */}
      <Dialog open={wizardOpen} onOpenChange={(o) => { setWizardOpen(o); if (!o) resetWizard(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {editingId ? "Редактировать ТЗ" : "Новое ТЗ"}
              <Badge variant="outline" className="ml-2">Шаг {step} из 4</Badge>
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Клиент (из CRM)</Label>
                <Select value={clientId} onValueChange={applyClient}>
                  <SelectTrigger><SelectValue placeholder="Выбрать клиента или ввести вручную ниже" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Договор (опционально)</Label>
                <Select value={contractId} onValueChange={applyContract}>
                  <SelectTrigger><SelectValue placeholder="Привязать к договору" /></SelectTrigger>
                  <SelectContent>
                    {contracts.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.contract_number || "(без №)"} — {c.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Название ТЗ</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Сайт-каталог + CRM" />
                </div>
                <div>
                  <Label>Заказчик (как в шапке)</Label>
                  <Input value={payload.client_name} onChange={e => setPayload(p => ({ ...p, client_name: e.target.value }))} />
                </div>
                <div>
                  <Label>ИНН</Label>
                  <Input value={payload.client_inn || ""} onChange={e => setPayload(p => ({ ...p, client_inn: e.target.value }))} />
                </div>
                <div>
                  <Label>Руководитель</Label>
                  <Input value={payload.director_name || ""} onChange={e => setPayload(p => ({ ...p, director_name: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label>Юр. адрес</Label>
                  <Input value={payload.legal_address || ""} onChange={e => setPayload(p => ({ ...p, legal_address: e.target.value }))} />
                </div>
                <div>
                  <Label>№ договора</Label>
                  <Input value={payload.contract_number || ""} onChange={e => setPayload(p => ({ ...p, contract_number: e.target.value }))} />
                </div>
                <div>
                  <Label>Дата договора</Label>
                  <Input type="date" value={payload.contract_date || ""} onChange={e => setPayload(p => ({ ...p, contract_date: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Шаблон</Label>
                <Select value={templateId} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue placeholder="Выбрать шаблон" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templateId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {templates.find((t: any) => t.id === templateId)?.description}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Сфера / тематика проекта</Label>
                  <Input
                    value={payload.project_scope || ""}
                    onChange={e => setPayload(p => ({ ...p, project_scope: e.target.value }))}
                    placeholder="Например: импорт авто из Японии, Кореи и Китая"
                  />
                </div>
                <div>
                  <Label>Срок (рабочих дней)</Label>
                  <Input type="number" value={payload.deadline_days || ""} onChange={e => setPayload(p => ({ ...p, deadline_days: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
                <div>
                  <Label>Сумма по договору</Label>
                  <Input type="number" value={payload.contract_amount || ""} onChange={e => setPayload(p => ({ ...p, contract_amount: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
                <div>
                  <Label>Домен</Label>
                  <Input value={payload.domain || ""} onChange={e => setPayload(p => ({ ...p, domain: e.target.value }))} placeholder="example.ru" />
                </div>
                <div>
                  <Label>Референсы</Label>
                  <Input value={payload.references || ""} onChange={e => setPayload(p => ({ ...p, references: e.target.value }))} placeholder="ссылки на похожие сайты" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Отметьте галочками всё, что войдёт в ТЗ. Целые разделы можно отключить переключателем справа.
              </p>
              <Accordion type="multiple" defaultValue={payload.sections.map(s => s.id)}>
                {payload.sections.map((s, sIdx) => {
                  const checkedCount = s.items.filter(i => i.checked).length;
                  return (
                    <AccordionItem key={s.id} value={s.id} className={s.enabled === false ? "opacity-50" : ""}>
                      <div className="flex items-center justify-between gap-2 px-1">
                        <AccordionTrigger className="flex-1 text-left">
                          <span>{s.title}</span>
                          <Badge variant="outline" className="ml-2 text-[10px]">{checkedCount}/{s.items.length}</Badge>
                        </AccordionTrigger>
                        <Switch
                          checked={s.enabled !== false}
                          onCheckedChange={() => toggleSection(sIdx)}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <AccordionContent>
                        <div className="space-y-2 pl-1">
                          {s.items.map((it, iIdx) => (
                            <label key={it.id} className="flex items-start gap-2 cursor-pointer text-sm">
                              <Checkbox checked={it.checked} onCheckedChange={() => toggleItem(sIdx, iIdx)} className="mt-0.5" />
                              <span className={it.checked ? "" : "text-muted-foreground line-through"}>{it.label}</span>
                            </label>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => addCustomItem(sIdx)} className="mt-2 gap-1">
                            <Plus className="h-3 w-3" /> Свой пункт
                          </Button>
                          <Textarea
                            value={s.customNote || ""}
                            onChange={e => updateSectionNote(sIdx, e.target.value)}
                            placeholder="Комментарий к разделу (опционально)"
                            className="mt-2 min-h-[60px]"
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="border rounded-md overflow-hidden bg-white">
                <iframe
                  srcDoc={buildHtmlNow(undefined, new Date().toISOString().slice(0, 10))}
                  className="w-full h-[60vh]"
                  title="Превью ТЗ"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                После сохранения ТЗ получит номер вида ТЗ-NNN/{new Date().getFullYear()} и появится в общей «Истории документов».
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-2">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Назад
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {step < 4 ? (
                <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canNext}>
                  Далее <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => saveAndExport("save")} disabled={saving} className="gap-1">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Сохранить
                  </Button>
                  <Button variant="outline" onClick={() => saveAndExport("docx")} disabled={saving} className="gap-1">
                    <FileDown className="h-4 w-4" /> Word
                  </Button>
                  <Button onClick={() => saveAndExport("pdf")} disabled={saving} className="gap-1">
                    <FileDown className="h-4 w-4" /> PDF
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewHtml} onOpenChange={(o) => !o && setPreviewHtml(null)}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between">
            <DialogTitle>Превью ТЗ</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setPreviewHtml(null)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          {previewHtml && (
            <iframe srcDoc={previewHtml} className="w-full h-full border-0" title="ТЗ" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TzTab;