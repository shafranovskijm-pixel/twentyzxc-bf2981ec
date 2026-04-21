import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus, Loader2, Save, Trash2, FileText, Download, ChevronDown, ChevronUp,
  ExternalLink, Users, BookOpen,
} from "lucide-react";
import { NmoStepCard } from "./nmo/NmoStepCard";
import { NmoDocumentsList } from "./nmo/NmoDocumentsList";
import { NMO_STEPS, NMO_INSTRUCTION_PDF } from "./nmo/nmo-steps";
import { useGenerateNmoDocs } from "./nmo/use-generate-nmo-docs";
import type { NmoRegistrationFull } from "./nmo/types";

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Новая", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  in_progress: { label: "В работе", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  waiting: { label: "Ожидание", color: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  completed: { label: "Завершена", color: "bg-green-500/10 text-green-400 border-green-500/30" },
};

const referenceDocs = [
  { title: "Инструкция по работе в ЛК", file: "/docs/nmo/instruction.pdf" },
  { title: "Порядок включения ДПП", file: "/docs/nmo/poryadok-dpp.pdf" },
  { title: "Рекомендации по ДПП", file: "/docs/nmo/recomendacii-dpp.pdf" },
];

const emptyForm = {
  organization_name: "", organization_abbr: "", inn: "", kpp: "", ogrn: "",
  legal_address: "", actual_address: "", organization_phone: "", organization_email: "",
  organization_website: "", region: "", has_dpo_appendix: false,
  license_number: "", license_date: "",
  responsible_name: "", responsible_email: "", responsible_mobile: "",
  responsible_birth_date: "", responsible_gender: "", responsible_snils: "",
  responsible_position: "", responsible_login: "",
  status: "new", notes: "", client_id: "",
};

const NmoTab = () => {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["nmo-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nmo_registrations").select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as NmoRegistrationFull[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["nmo-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name, inn, kpp").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!form.organization_name.trim()) throw new Error("Укажите название организации");
      const payload: Record<string, unknown> = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
      if (!payload.client_id) delete payload.client_id;
      const { error } = await supabase.from("nmo_registrations").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nmo-registrations"] });
      toast.success("Заявка добавлена");
      setForm(emptyForm); setShowAdd(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateChecklist = useMutation({
    mutationFn: async ({ id, checklist }: { id: string; checklist: Record<string, boolean> }) => {
      const allDone = Object.values(checklist).every(Boolean);
      const patch: Record<string, unknown> = { checklist, updated_at: new Date().toISOString() };
      if (allDone) patch.status = "completed";
      const { error } = await supabase.from("nmo_registrations").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nmo-registrations"] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("nmo_registrations")
        .update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nmo-registrations"] }),
  });

  const updateField = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<NmoRegistrationFull> }) => {
      const { error } = await supabase.from("nmo_registrations")
        .update({ ...patch, updated_at: new Date().toISOString() } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nmo-registrations"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRegistration = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emptyForm }) => {
      if (!data.organization_name.trim()) throw new Error("Укажите название организации");
      const payload: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
      if (!payload.client_id) delete payload.client_id;
      const { error } = await supabase.from("nmo_registrations").update(payload as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nmo-registrations"] });
      toast.success("Заявка обновлена"); setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteReg = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nmo_registrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nmo-registrations"] });
      toast.success("Заявка удалена");
    },
  });

  const { generate, generating } = useGenerateNmoDocs(() => {
    queryClient.invalidateQueries({ queryKey: ["nmo-documents"] });
  });

  const startEdit = (reg: NmoRegistrationFull) => {
    setEditingId(reg.id);
    setEditForm({
      organization_name: reg.organization_name,
      organization_abbr: reg.organization_abbr || "",
      inn: reg.inn || "", kpp: reg.kpp || "", ogrn: reg.ogrn || "",
      legal_address: reg.legal_address || "", actual_address: reg.actual_address || "",
      organization_phone: reg.organization_phone || "", organization_email: reg.organization_email || "",
      organization_website: reg.organization_website || "", region: reg.region || "",
      has_dpo_appendix: !!reg.has_dpo_appendix,
      license_number: reg.license_number || "", license_date: reg.license_date || "",
      responsible_name: reg.responsible_name || "", responsible_email: reg.responsible_email || "",
      responsible_mobile: reg.responsible_mobile || "",
      responsible_birth_date: reg.responsible_birth_date || "",
      responsible_gender: reg.responsible_gender || "",
      responsible_snils: reg.responsible_snils || "",
      responsible_position: reg.responsible_position || "",
      responsible_login: reg.responsible_login || "",
      status: reg.status, notes: reg.notes || "", client_id: reg.client_id || "",
    });
  };

  const fillFromClient = (clientId: string) => {
    const c = clients.find((cl) => cl.id === clientId);
    if (c) setForm((f) => ({ ...f, client_id: clientId, organization_name: c.name, inn: c.inn || "", kpp: c.kpp || "" }));
  };

  const totalSteps = NMO_STEPS.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" /> Справочные материалы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {referenceDocs.map((doc) => (
              <a key={doc.file} href={doc.file} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 border rounded-sm text-sm hover:border-primary/30 transition-colors">
                <Download className="w-3.5 h-3.5 text-primary" />
                {doc.title}
              </a>
            ))}
            <a href={NMO_INSTRUCTION_PDF} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 border rounded-sm text-sm hover:border-primary/30 transition-colors">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Инструкция Минздрава 07.05.2024
            </a>
            <a href="https://edu.rosminzdrav.ru/organizacijam/organizacijam/obrazovatelnym-organizacijam/"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 border rounded-sm text-sm hover:border-primary/30 transition-colors">
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              Портал НМО
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Заявки на регистрацию ({registrations.length})
        </h2>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Новая заявка</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Новая заявка НМО</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label>Привязать к клиенту</Label>
                  <Select value={form.client_id} onValueChange={fillFromClient}>
                    <SelectTrigger><SelectValue placeholder="Выберите клиента..." /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2"><Label>Полное наименование *</Label><Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Сокращённое</Label><Input value={form.organization_abbr} onChange={(e) => setForm({ ...form, organization_abbr: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>ИНН</Label><Input value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} maxLength={12} /></div>
                <div className="space-y-2"><Label>КПП</Label><Input value={form.kpp} onChange={(e) => setForm({ ...form, kpp: e.target.value })} maxLength={9} /></div>
                <div className="space-y-2"><Label>ОГРН</Label><Input value={form.ogrn} onChange={(e) => setForm({ ...form, ogrn: e.target.value })} maxLength={15} /></div>
              </div>
              <div className="space-y-2"><Label>Юридический адрес</Label><Input value={form.legal_address} onChange={(e) => setForm({ ...form, legal_address: e.target.value })} /></div>
              <div className="space-y-2"><Label>Фактический адрес</Label><Input value={form.actual_address} onChange={(e) => setForm({ ...form, actual_address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Регион</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
                <div className="space-y-2"><Label>Сайт</Label><Input value={form.organization_website} onChange={(e) => setForm({ ...form, organization_website: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Телефон организации</Label><Input value={form.organization_phone} onChange={(e) => setForm({ ...form, organization_phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>E-mail организации</Label><Input type="email" value={form.organization_email} onChange={(e) => setForm({ ...form, organization_email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Номер лицензии</Label><Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></div>
                <div className="space-y-2"><Label>Дата лицензии</Label><Input type="date" value={form.license_date} onChange={(e) => setForm({ ...form, license_date: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.has_dpo_appendix} onChange={(e) => setForm({ ...form, has_dpo_appendix: e.target.checked })} />
                Имеется приложение о ДПО к лицензии
              </label>

              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-3">Ответственное лицо</p>
                <div className="space-y-3">
                  <div className="space-y-2"><Label>ФИО</Label><Input value={form.responsible_name} onChange={(e) => setForm({ ...form, responsible_name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.responsible_email} onChange={(e) => setForm({ ...form, responsible_email: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Мобильный</Label><Input value={form.responsible_mobile} onChange={(e) => setForm({ ...form, responsible_mobile: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Дата рождения</Label><Input type="date" value={form.responsible_birth_date} onChange={(e) => setForm({ ...form, responsible_birth_date: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Пол</Label>
                      <Select value={form.responsible_gender} onValueChange={(v) => setForm({ ...form, responsible_gender: v })}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="М">Мужской</SelectItem>
                          <SelectItem value="Ж">Женский</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>СНИЛС</Label><Input value={form.responsible_snils} onChange={(e) => setForm({ ...form, responsible_snils: e.target.value })} placeholder="000-000-000 00" /></div>
                    <div className="space-y-2"><Label>Должность</Label><Input value={form.responsible_position} onChange={(e) => setForm({ ...form, responsible_position: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Логин НМФО (после регистрации)</Label><Input value={form.responsible_login} onChange={(e) => setForm({ ...form, responsible_login: e.target.value })} /></div>
                </div>
              </div>
              <div className="space-y-2"><Label>Заметки</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Добавить заявку
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : registrations.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Нет заявок. Нажмите «Новая заявка».</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {registrations.map((reg) => {
            const checklist = (reg.checklist || {}) as Record<string, boolean>;
            const done = NMO_STEPS.filter((s) => checklist[s.key]).length;
            const expanded = expandedId === reg.id;
            const st = statusLabels[reg.status] || statusLabels.new;
            const activeStepIdx = NMO_STEPS.findIndex((s) => !checklist[s.key]);

            return (
              <Card key={reg.id} className="overflow-hidden">
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : reg.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium truncate">{reg.organization_name}</span>
                      <Badge className={`text-xs ${st.color}`}>{st.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {reg.inn && <span>ИНН: {reg.inn}</span>}
                      <span>Этап {Math.min(done + 1, totalSteps)} из {totalSteps}</span>
                      <span>{new Date(reg.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                    <div className="mt-2 max-w-sm">
                      <Progress value={(done / totalSteps) * 100} className="h-1.5" />
                    </div>
                  </div>
                  {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>

                {expanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-4">
                    <div className="flex flex-wrap gap-3 items-center">
                      <Label className="text-xs shrink-0">Внутренний статус:</Label>
                      <Select value={reg.status} onValueChange={(v) => updateStatus.mutate({ id: reg.id, status: v })}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Пошаговый мастер регистрации</p>
                      <div className="space-y-2">
                        {NMO_STEPS.map((step, idx) => (
                          <NmoStepCard
                            key={step.key}
                            step={step}
                            registration={reg}
                            done={!!checklist[step.key]}
                            active={idx === activeStepIdx}
                            onToggle={(d) => {
                              const updated = { ...checklist, [step.key]: d };
                              updateChecklist.mutate({ id: reg.id, checklist: updated });
                            }}
                            onGenerateDocs={() => generate(reg)}
                            generating={generating}
                            onUpdateField={(patch) => updateField.mutate({ id: reg.id, patch })}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-sm font-medium mb-2">Сгенерированные документы</p>
                      <NmoDocumentsList registrationId={reg.id} />
                    </div>

                    {editingId === reg.id ? (
                      <div className="space-y-3 border-t pt-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Полное наименование *</Label><Input value={editForm.organization_name} onChange={(e) => setEditForm({ ...editForm, organization_name: e.target.value })} /></div>
                          <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Сокращённое</Label><Input value={editForm.organization_abbr} onChange={(e) => setEditForm({ ...editForm, organization_abbr: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">ИНН</Label><Input value={editForm.inn} onChange={(e) => setEditForm({ ...editForm, inn: e.target.value })} maxLength={12} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">КПП</Label><Input value={editForm.kpp} onChange={(e) => setEditForm({ ...editForm, kpp: e.target.value })} maxLength={9} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">ОГРН</Label><Input value={editForm.ogrn} onChange={(e) => setEditForm({ ...editForm, ogrn: e.target.value })} maxLength={15} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Регион</Label><Input value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} /></div>
                          <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Юр. адрес</Label><Input value={editForm.legal_address} onChange={(e) => setEditForm({ ...editForm, legal_address: e.target.value })} /></div>
                          <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Факт. адрес</Label><Input value={editForm.actual_address} onChange={(e) => setEditForm({ ...editForm, actual_address: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Телефон орг.</Label><Input value={editForm.organization_phone} onChange={(e) => setEditForm({ ...editForm, organization_phone: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">E-mail орг.</Label><Input value={editForm.organization_email} onChange={(e) => setEditForm({ ...editForm, organization_email: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Сайт</Label><Input value={editForm.organization_website} onChange={(e) => setEditForm({ ...editForm, organization_website: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Номер лицензии</Label><Input value={editForm.license_number} onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Дата лицензии</Label><Input type="date" value={editForm.license_date} onChange={(e) => setEditForm({ ...editForm, license_date: e.target.value })} /></div>
                          <label className="flex items-center gap-2 text-xs cursor-pointer sm:col-span-2 pt-2">
                            <input type="checkbox" checked={editForm.has_dpo_appendix} onChange={(e) => setEditForm({ ...editForm, has_dpo_appendix: e.target.checked })} />
                            Приложение о ДПО к лицензии
                          </label>
                        </div>
                        <div className="border-t pt-3">
                          <p className="text-xs font-medium mb-2">Ответственное лицо</p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">ФИО</Label><Input value={editForm.responsible_name} onChange={(e) => setEditForm({ ...editForm, responsible_name: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input type="email" value={editForm.responsible_email} onChange={(e) => setEditForm({ ...editForm, responsible_email: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-xs">Мобильный</Label><Input value={editForm.responsible_mobile} onChange={(e) => setEditForm({ ...editForm, responsible_mobile: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label className="text-xs">Дата рождения</Label><Input type="date" value={editForm.responsible_birth_date} onChange={(e) => setEditForm({ ...editForm, responsible_birth_date: e.target.value })} /></div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Пол</Label>
                              <Select value={editForm.responsible_gender} onValueChange={(v) => setEditForm({ ...editForm, responsible_gender: v })}>
                                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="М">Мужской</SelectItem>
                                  <SelectItem value="Ж">Женский</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5"><Label className="text-xs">СНИЛС</Label><Input value={editForm.responsible_snils} onChange={(e) => setEditForm({ ...editForm, responsible_snils: e.target.value })} placeholder="000-000-000 00" /></div>
                            <div className="space-y-1.5"><Label className="text-xs">Должность</Label><Input value={editForm.responsible_position} onChange={(e) => setEditForm({ ...editForm, responsible_position: e.target.value })} /></div>
                            <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Логин НМФО</Label><Input value={editForm.responsible_login} onChange={(e) => setEditForm({ ...editForm, responsible_login: e.target.value })} /></div>
                          </div>
                        </div>
                        <div className="space-y-1.5"><Label className="text-xs">Заметки</Label><Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} /></div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateRegistration.mutate({ id: reg.id, data: editForm })} disabled={updateRegistration.isPending} className="flex-1">
                            {updateRegistration.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                            Сохранить
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Отмена</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" onClick={() => startEdit(reg)}>
                          <Save className="w-4 h-4 mr-1" /> Редактировать данные
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Удалить заявку?")) deleteReg.mutate(reg.id); }}>
                          <Trash2 className="w-4 h-4 mr-1" /> Удалить
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NmoTab;
