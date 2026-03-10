import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus, Loader2, Save, Trash2, FileText, Download, ChevronDown, ChevronUp,
  CheckCircle2, Circle, ExternalLink, Users,
} from "lucide-react";

interface NmoRegistration {
  id: string;
  client_id: string | null;
  organization_name: string;
  inn: string | null;
  kpp: string | null;
  license_number: string | null;
  license_date: string | null;
  responsible_name: string | null;
  responsible_email: string | null;
  responsible_phone: string | null;
  responsible_snils: string | null;
  responsible_position: string | null;
  status: string;
  checklist: Record<string, boolean>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const checklistLabels: Record<string, string> = {
  docs_collected: "Документы собраны",
  employee_registered: "Сотрудник зарегистрирован на Портале",
  application_submitted: "Заявка подана на org.edu.rosminzdrav.ru",
  originals_sent: "Оригиналы отправлены почтой",
  cabinet_opened: "ЛК организации открыт",
  dpp_passports_filled: "Паспорта ДПП заполнены",
};

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
  organization_name: "",
  inn: "",
  kpp: "",
  license_number: "",
  license_date: "",
  responsible_name: "",
  responsible_email: "",
  responsible_phone: "",
  responsible_snils: "",
  responsible_position: "",
  status: "new",
  notes: "",
  client_id: "",
};

const NmoTab = () => {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["nmo-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nmo_registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NmoRegistration[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["nmo-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, inn, kpp")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!form.organization_name.trim()) throw new Error("Укажите название организации");
      const { error } = await supabase.from("nmo_registrations").insert({
        organization_name: form.organization_name,
        inn: form.inn || null,
        kpp: form.kpp || null,
        license_number: form.license_number || null,
        license_date: form.license_date || null,
        responsible_name: form.responsible_name || null,
        responsible_email: form.responsible_email || null,
        responsible_phone: form.responsible_phone || null,
        responsible_snils: form.responsible_snils || null,
        responsible_position: form.responsible_position || null,
        status: form.status,
        notes: form.notes || null,
        client_id: form.client_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nmo-registrations"] });
      toast.success("Заявка добавлена");
      setForm(emptyForm);
      setShowAdd(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateChecklist = useMutation({
    mutationFn: async ({ id, checklist }: { id: string; checklist: Record<string, boolean> }) => {
      const allDone = Object.values(checklist).every(Boolean);
      const { error } = await supabase
        .from("nmo_registrations")
        .update({ checklist, status: allDone ? "completed" : undefined, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nmo-registrations"] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("nmo_registrations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nmo-registrations"] }),
  });

  const updateRegistration = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emptyForm }) => {
      if (!data.organization_name.trim()) throw new Error("Укажите название организации");
      const { error } = await supabase
        .from("nmo_registrations")
        .update({
          organization_name: data.organization_name,
          inn: data.inn || null,
          kpp: data.kpp || null,
          license_number: data.license_number || null,
          license_date: data.license_date || null,
          responsible_name: data.responsible_name || null,
          responsible_email: data.responsible_email || null,
          responsible_phone: data.responsible_phone || null,
          responsible_snils: data.responsible_snils || null,
          responsible_position: data.responsible_position || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nmo-registrations"] });
      toast.success("Заявка обновлена");
      setEditingId(null);
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

  const startEdit = (reg: NmoRegistration) => {
    setEditingId(reg.id);
    setEditForm({
      organization_name: reg.organization_name,
      inn: reg.inn || "",
      kpp: reg.kpp || "",
      license_number: reg.license_number || "",
      license_date: reg.license_date || "",
      responsible_name: reg.responsible_name || "",
      responsible_email: reg.responsible_email || "",
      responsible_phone: reg.responsible_phone || "",
      responsible_snils: reg.responsible_snils || "",
      responsible_position: reg.responsible_position || "",
      status: reg.status,
      notes: reg.notes || "",
      client_id: reg.client_id || "",
    });
  };

  const fillFromClient = (clientId: string) => {
    const c = clients.find((cl) => cl.id === clientId);
    if (c) {
      setForm((f) => ({
        ...f,
        client_id: clientId,
        organization_name: c.name,
        inn: c.inn || "",
        kpp: c.kpp || "",
      }));
    }
  };

  const completedCount = (checklist: Record<string, boolean>) =>
    Object.values(checklist).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Reference docs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" /> Справочные материалы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {referenceDocs.map((doc) => (
              <a
                key={doc.file}
                href={doc.file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 border rounded-sm text-sm hover:border-primary/30 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                {doc.title}
              </a>
            ))}
            <a
              href="https://edu.rosminzdrav.ru/organizacijam/organizacijam/obrazovatelnym-organizacijam/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 border rounded-sm text-sm hover:border-primary/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              Портал НМО
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Add new */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Заявки на регистрацию ({registrations.length})
        </h2>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Новая заявка</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Новая заявка НМО</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label>Привязать к клиенту</Label>
                  <Select value={form.client_id} onValueChange={fillFromClient}>
                    <SelectTrigger><SelectValue placeholder="Выберите клиента..." /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Название организации *</Label>
                <Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>ИНН</Label>
                  <Input value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} maxLength={12} />
                </div>
                <div className="space-y-2">
                  <Label>КПП</Label>
                  <Input value={form.kpp} onChange={(e) => setForm({ ...form, kpp: e.target.value })} maxLength={9} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Номер лицензии</Label>
                  <Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Дата лицензии</Label>
                  <Input type="date" value={form.license_date} onChange={(e) => setForm({ ...form, license_date: e.target.value })} />
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-3">Ответственное лицо</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>ФИО</Label>
                    <Input value={form.responsible_name} onChange={(e) => setForm({ ...form, responsible_name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={form.responsible_email} onChange={(e) => setForm({ ...form, responsible_email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Телефон</Label>
                      <Input value={form.responsible_phone} onChange={(e) => setForm({ ...form, responsible_phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>СНИЛС</Label>
                      <Input value={form.responsible_snils} onChange={(e) => setForm({ ...form, responsible_snils: e.target.value })} placeholder="000-000-000 00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Должность</Label>
                      <Input value={form.responsible_position} onChange={(e) => setForm({ ...form, responsible_position: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Заметки</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Добавить заявку
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : registrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Нет заявок на регистрацию. Нажмите «Новая заявка» чтобы добавить.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {registrations.map((reg) => {
            const done = completedCount(reg.checklist);
            const total = Object.keys(checklistLabels).length;
            const expanded = expandedId === reg.id;
            const st = statusLabels[reg.status] || statusLabels.new;

            return (
              <Card key={reg.id} className="overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : reg.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{reg.organization_name}</span>
                      <Badge className={`text-xs ${st.color}`}>{st.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {reg.inn && <span>ИНН: {reg.inn}</span>}
                      <span>{done}/{total} этапов</span>
                      <span>{new Date(reg.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Progress dots */}
                    {Object.keys(checklistLabels).map((key) => (
                      <div
                        key={key}
                        className={`w-2 h-2 rounded-full ${reg.checklist[key] ? "bg-green-500" : "bg-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>

                {expanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-4">
                    {/* Status select */}
                    <div className="flex items-center gap-3">
                      <Label className="shrink-0">Статус:</Label>
                      <Select
                        value={reg.status}
                        onValueChange={(v) => updateStatus.mutate({ id: reg.id, status: v })}
                      >
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Checklist */}
                    <div>
                      <p className="text-sm font-medium mb-2">Чеклист этапов</p>
                      <div className="space-y-2">
                        {Object.entries(checklistLabels).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 cursor-pointer group">
                            <Checkbox
                              checked={!!reg.checklist[key]}
                              onCheckedChange={(checked) => {
                                const updated = { ...reg.checklist, [key]: !!checked };
                                updateChecklist.mutate({ id: reg.id, checklist: updated });
                              }}
                            />
                            <span className={`text-sm ${reg.checklist[key] ? "text-green-400 line-through" : ""}`}>
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {reg.kpp && <div><span className="text-muted-foreground">КПП:</span> {reg.kpp}</div>}
                      {reg.license_number && <div><span className="text-muted-foreground">Лицензия:</span> {reg.license_number}</div>}
                      {reg.license_date && <div><span className="text-muted-foreground">Дата лицензии:</span> {new Date(reg.license_date).toLocaleDateString("ru-RU")}</div>}
                      {reg.responsible_name && <div><span className="text-muted-foreground">Ответственный:</span> {reg.responsible_name}</div>}
                      {reg.responsible_email && <div><span className="text-muted-foreground">Email:</span> {reg.responsible_email}</div>}
                      {reg.responsible_phone && <div><span className="text-muted-foreground">Телефон:</span> {reg.responsible_phone}</div>}
                      {reg.responsible_snils && <div><span className="text-muted-foreground">СНИЛС:</span> {reg.responsible_snils}</div>}
                      {reg.responsible_position && <div><span className="text-muted-foreground">Должность:</span> {reg.responsible_position}</div>}
                    </div>

                    {reg.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Заметки:</span>
                        <p className="mt-1">{reg.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Удалить заявку?")) deleteReg.mutate(reg.id); }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Удалить
                      </Button>
                    </div>
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
