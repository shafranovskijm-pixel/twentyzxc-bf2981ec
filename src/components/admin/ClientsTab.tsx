import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Save, Loader2, Trash2, X, RefreshCw, FileText, ClipboardList, History, Phone, Mail, MessageSquare, StickyNote, Send } from "lucide-react";

interface Client {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  notes: string | null;
  service_type: string | null;
  frdo_login: string | null;
  frdo_password: string | null;
  frdo_password_po: string | null;
  payment_date: string | null;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  legal_address: string | null;
  director_name: string | null;
  director_post: string | null;
  created_at: string;
}

const SERVICE_OPTIONS = [
  { value: "ФРДО", label: "ФРДО", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "САЙТ", label: "САЙТ", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "ПРОЧЕЕ", label: "ПРОЧЕЕ", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
];

async function fetchDadataByName(companyName: string) {
  try {
    const { data, error } = await supabase.functions.invoke("dadata-lookup", {
      body: { query: companyName },
    });
    if (error) throw error;
    if (!data?.found) return null;
    return {
      inn: data.inn || null,
      kpp: data.kpp || null,
      ogrn: data.ogrn || null,
      legal_address: data.address || null,
      director_name: data.management_name || null,
      director_post: data.management_post || null,
    };
  } catch {
    return null;
  }
}

const ClientsTab = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [frdoLogin, setFrdoLogin] = useState("");
  const [frdoPassword, setFrdoPassword] = useState("");
  const [frdoPasswordPo, setFrdoPasswordPo] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [inn, setInn] = useState("");
  const [kpp, setKpp] = useState("");
  const [ogrn, setOgrn] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [directorPost, setDirectorPost] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  const { data: clients = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const resetForm = () => {
    setName(""); setContactPerson(""); setPhone(""); setEmail(""); setTelegram(""); setNotes("");
    setServiceType(""); setFrdoLogin(""); setFrdoPassword(""); setFrdoPasswordPo(""); setPaymentDate("");
    setInn(""); setKpp(""); setOgrn(""); setLegalAddress(""); setDirectorName(""); setDirectorPost("");
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (c: Client) => {
    setEditingId(c.id); setName(c.name); setContactPerson(c.contact_person || "");
    setPhone(c.phone || ""); setEmail(c.email || ""); setTelegram(c.telegram || "");
    setNotes(c.notes || ""); setServiceType(c.service_type || "");
    setFrdoLogin(c.frdo_login || ""); setFrdoPassword(c.frdo_password || ""); setFrdoPasswordPo((c as any).frdo_password_po || "");
    setPaymentDate(c.payment_date || "");
    setInn(c.inn || ""); setKpp(c.kpp || ""); setOgrn(c.ogrn || "");
    setLegalAddress(c.legal_address || ""); setDirectorName(c.director_name || "");
    setDirectorPost(c.director_post || "");
    setShowForm(true);
  };

  const syncRequisites = async () => {
    if (!name.trim()) return toast.error("Укажите название организации");
    setSyncing(true);
    const result = await fetchDadataByName(name.trim());
    if (result) {
      if (result.inn) setInn(result.inn);
      if (result.kpp) setKpp(result.kpp);
      if (result.ogrn) setOgrn(result.ogrn);
      if (result.legal_address) setLegalAddress(result.legal_address);
      if (result.director_name) setDirectorName(result.director_name);
      if (result.director_post) setDirectorPost(result.director_post);
      toast.success("Реквизиты загружены");
    } else {
      toast.error("Организация не найдена в DaData");
    }
    setSyncing(false);
  };

  const syncAllClients = async () => {
    setSyncingAll(true);
    let updated = 0;
    let failed = 0;
    const BATCH_SIZE = 5;
    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
      const batch = clients.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (client) => {
          const result = await fetchDadataByName(client.name);
          if (result && result.inn) {
            const payload: Record<string, string | null> = {};
            if (result.inn) payload.inn = result.inn;
            if (result.kpp) payload.kpp = result.kpp;
            if (result.ogrn) payload.ogrn = result.ogrn;
            if (result.legal_address) payload.legal_address = result.legal_address;
            if (result.director_name) payload.director_name = result.director_name;
            if (result.director_post) payload.director_post = result.director_post;
            const { error } = await supabase.from("clients").update(payload as any).eq("id", client.id);
            return !error;
          }
          return false;
        })
      );
      results.forEach((ok) => ok ? updated++ : failed++);
      toast.info(`Обработано ${Math.min(i + BATCH_SIZE, clients.length)} из ${clients.length}...`);
    }
    queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    toast.success(`Синхронизация завершена: ${updated} обновлено, ${failed} не найдено`);
    setSyncingAll(false);
  };

  const saveClient = async () => {
    if (!name.trim()) return toast.error("Укажите название организации");
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        telegram: telegram.trim() || null,
        notes: notes.trim() || null,
        service_type: serviceType || null,
        frdo_login: frdoLogin.trim() || null,
        frdo_password: frdoPassword.trim() || null,
        frdo_password_po: frdoPasswordPo.trim() || null,
        payment_date: paymentDate || null,
        inn: inn.trim() || null,
        kpp: kpp.trim() || null,
        ogrn: ogrn.trim() || null,
        legal_address: legalAddress.trim() || null,
        director_name: directorName.trim() || null,
        director_post: directorPost.trim() || null,
      };
      if (editingId) {
        const { error } = await supabase.from("clients").update(payload as any).eq("id", editingId);
        if (error) throw error;
        toast.success("Клиент обновлён");
      } else {
        const { error } = await supabase.from("clients").insert(payload as any);
        if (error) throw error;
        toast.success("Клиент добавлен");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      resetForm();
    } catch {
      toast.error("Ошибка сохранения");
    }
    setSaving(false);
  };

  const updateServiceType = async (clientId: string, value: string) => {
    const { error } = await supabase.from("clients").update({ service_type: value }).eq("id", clientId);
    if (error) { toast.error("Ошибка"); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) { toast.error("Ошибка удаления"); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    toast.success("Клиент удалён");
  };

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) ||
      c.contact_person?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.inn?.toLowerCase().includes(s);
  });

  const getServiceBadge = (type: string | null) => {
    const opt = SERVICE_OPTIONS.find(o => o.value === type);
    if (!opt) return <span className="text-muted-foreground text-xs">—</span>;
    return <Badge variant="outline" className={opt.color}>{opt.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Input placeholder="Поиск клиентов..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[150px]" />
        <Button variant="outline" onClick={syncAllClients} disabled={syncingAll || clients.length === 0} size="sm" className="sm:size-default">
          {syncingAll ? <Loader2 className="w-4 h-4 animate-spin sm:mr-2" /> : <RefreshCw className="w-4 h-4 sm:mr-2" />}
          <span className="hidden sm:inline">Синхр. все реквизиты</span>
        </Button>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="sm:size-default">
          <Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Добавить</span>
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{editingId ? "Редактировать клиента" : "Новый клиент"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Название организации *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ООО Ромашка" />
              </div>
              <div className="space-y-2">
                <Label>Услуга</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger><SelectValue placeholder="Выберите услугу" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Контактное лицо</Label><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Иванов И.И." /></div>
              <div className="space-y-2"><Label>Телефон</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 999 123-45-67" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@company.ru" /></div>
              <div className="space-y-2"><Label>Telegram</Label><Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" /></div>
            </div>
            <div className="space-y-2"><Label>Логин ФИС ФРДО</Label><Input value={frdoLogin} onChange={(e) => setFrdoLogin(e.target.value)} placeholder="login" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Пароль ДПО</Label><Input value={frdoPassword} onChange={(e) => setFrdoPassword(e.target.value)} placeholder="пароль ДПО" /></div>
              <div className="space-y-2"><Label>Пароль ПО</Label><Input value={frdoPasswordPo} onChange={(e) => setFrdoPasswordPo(e.target.value)} placeholder="пароль ПО" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата оплаты</Label>
                <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </div>
            </div>

            {/* Requisites section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Реквизиты</h3>
                <Button variant="outline" size="sm" onClick={syncRequisites} disabled={syncing}>
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Синхронизировать
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>ИНН</Label><Input value={inn} onChange={(e) => setInn(e.target.value)} placeholder="1234567890" /></div>
                <div className="space-y-2"><Label>КПП</Label><Input value={kpp} onChange={(e) => setKpp(e.target.value)} placeholder="123456789" /></div>
                <div className="space-y-2"><Label>ОГРН</Label><Input value={ogrn} onChange={(e) => setOgrn(e.target.value)} placeholder="1234567890123" /></div>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Юридический адрес</Label>
                <Input value={legalAddress} onChange={(e) => setLegalAddress(e.target.value)} placeholder="г. Москва, ул. ..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2"><Label>ФИО руководителя</Label><Input value={directorName} onChange={(e) => setDirectorName(e.target.value)} placeholder="Иванов Иван Иванович" /></div>
                <div className="space-y-2"><Label>Должность руководителя</Label><Input value={directorPost} onChange={(e) => setDirectorPost(e.target.value)} placeholder="Директор" /></div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Заметки</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Доп. информация..." rows={2} />
            </div>

            {/* Client History Section - only when editing */}
            {editingId && <ClientHistory clientName={name} clientId={editingId} />}

            <Button onClick={saveClient} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingId ? "Обновить" : "Добавить"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : isError ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-sm text-destructive">Ошибка загрузки клиентов</p>
              <p className="text-xs text-muted-foreground">{error instanceof Error ? error.message : "Попробуйте перезагрузить страницу"}</p>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-clients"] })}>
                Повторить
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "Ничего не найдено" : "Нет клиентов"}
            </p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y">
                {filtered.map((c) => (
                  <div key={c.id} className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="font-medium text-left hover:text-primary hover:underline underline-offset-2 transition-colors text-sm"
                      >
                        {c.name}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        {getServiceBadge(c.service_type)}
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => deleteClient(c.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {c.inn && <span className="font-mono">ИНН: {c.inn}</span>}
                      {c.contact_person && <span>{c.contact_person}</span>}
                      {c.phone && <span>{c.phone}</span>}
                      {c.payment_date && <span>Оплата: {new Date(c.payment_date).toLocaleDateString("ru-RU")}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Организация</TableHead>
                      <TableHead>ИНН</TableHead>
                      <TableHead>Услуга</TableHead>
                      <TableHead>Контактное лицо</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Оплата</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <button
                            onClick={() => startEdit(c)}
                            className="font-medium text-left hover:text-primary hover:underline underline-offset-2 transition-colors"
                          >
                            {c.name}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{c.inn || "—"}</TableCell>
                        <TableCell>
                          <Select value={c.service_type || ""} onValueChange={(v) => updateServiceType(c.id, v)}>
                            <SelectTrigger className="h-7 w-[110px] border-none bg-transparent p-0 shadow-none focus:ring-0">
                              <SelectValue>{getServiceBadge(c.service_type)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{c.contact_person || "—"}</TableCell>
                        <TableCell>{c.phone || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {c.payment_date
                            ? new Date(c.payment_date).toLocaleDateString("ru-RU")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteClient(c.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DOC_TYPE_LABELS: Record<string, string> = {
  contract: "Договор",
  invoice: "Счёт",
  act: "Акт",
};

const ClientHistory = ({ clientName, clientId }: { clientName: string; clientId: string }) => {
  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["client-history-contracts", clientName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, contract_number, contract_date, amount, payment_status, contract_type")
        .eq("client_name", clientName)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientName,
  });

  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ["client-history-docs", clientName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_documents")
        .select("id, doc_type, doc_number, doc_date, total_amount")
        .eq("client_name", clientName)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!clientName,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["client-history-tasks", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, task_date")
        .eq("client_id", clientId)
        .order("task_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const isLoading = loadingContracts || loadingDocs || loadingTasks;
  const isEmpty = contracts.length === 0 && documents.length === 0 && tasks.length === 0;

  if (isLoading) {
    return (
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Загрузка истории...
        </div>
      </div>
    );
  }

  if (isEmpty) return null;

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const statusColor = (s: string | null) => {
    if (s === "оплачено") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "частично") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const taskStatusLabel = (s: string) => {
    if (s === "done") return { label: "Готово", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    if (s === "in_progress") return { label: "В работе", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    return { label: "К выполнению", cls: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="border-t pt-4 mt-4 space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">История взаимодействий</h3>
      </div>

      {/* Interaction log */}
      <InteractionLog clientId={clientId} />

      {contracts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <FileText className="w-3.5 h-3.5" /> Договоры ({contracts.length})
          </div>
          <div className="space-y-1">
            {contracts.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30 text-sm">
                <span className="font-mono text-xs">№{c.contract_number || "—"}</span>
                <span className="text-muted-foreground">{formatDate(c.contract_date)}</span>
                {c.amount && <span className="font-medium">{Number(c.amount).toLocaleString("ru-RU")} ₽</span>}
                {c.contract_type && <Badge variant="outline" className="text-xs">{c.contract_type}</Badge>}
                <Badge variant="outline" className={`text-xs ml-auto ${statusColor(c.payment_status)}`}>
                  {c.payment_status || "не оплачено"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ClipboardList className="w-3.5 h-3.5" /> Документы ({documents.length})
          </div>
          <div className="space-y-1">
            {documents.map(d => (
              <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30 text-sm">
                <Badge variant="outline" className="text-xs">{DOC_TYPE_LABELS[d.doc_type] || d.doc_type}</Badge>
                <span className="font-mono text-xs">№{d.doc_number}</span>
                <span className="text-muted-foreground">{formatDate(d.doc_date)}</span>
                {d.total_amount && <span className="font-medium ml-auto">{Number(d.total_amount).toLocaleString("ru-RU")} ₽</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ClipboardList className="w-3.5 h-3.5" /> Задачи ({tasks.length})
          </div>
          <div className="space-y-1">
            {tasks.map(t => {
              const st = taskStatusLabel(t.status);
              return (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30 text-sm">
                  <span className="truncate flex-1">{t.title}</span>
                  <span className="text-muted-foreground text-xs">{formatDate(t.task_date)}</span>
                  <Badge variant="outline" className={`text-xs ${st.cls}`}>{st.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const INTERACTION_TYPES = [
  { value: "call", label: "Звонок", icon: Phone },
  { value: "email", label: "Письмо", icon: Mail },
  { value: "meeting", label: "Встреча", icon: MessageSquare },
  { value: "note", label: "Заметка", icon: StickyNote },
];

const InteractionLog = ({ clientId }: { clientId: string }) => {
  const queryClient = useQueryClient();
  const [newType, setNewType] = useState("note");
  const [newContent, setNewContent] = useState("");

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ["client-interactions", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_interactions")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const addInteraction = useMutation({
    mutationFn: async () => {
      if (!newContent.trim()) throw new Error("empty");
      const { error } = await supabase.from("client_interactions").insert({
        client_id: clientId,
        interaction_type: newType,
        content: newContent.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-interactions", clientId] });
      setNewContent("");
      toast.success("Запись добавлена");
    },
    onError: () => toast.error("Ошибка добавления"),
  });

  const deleteInteraction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_interactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-interactions", clientId] });
    },
  });

  const getTypeInfo = (type: string) => INTERACTION_TYPES.find((t) => t.value === type) || INTERACTION_TYPES[3];

  return (
    <div className="space-y-3">
      {/* Add new */}
      <div className="flex gap-2">
        <Select value={newType} onValueChange={setNewType}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTERACTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <span className="flex items-center gap-1.5">
                  <t.icon className="w-3 h-3" /> {t.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Описание..."
          className="flex-1 h-8 text-sm"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addInteraction.mutate()}
        />
        <Button size="sm" variant="outline" onClick={() => addInteraction.mutate()} disabled={!newContent.trim() || addInteraction.isPending}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Загрузка...
        </div>
      ) : interactions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">Нет записей</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {interactions.map((item: any) => {
            const info = getTypeInfo(item.interaction_type);
            const Icon = info.icon;
            return (
              <div key={item.id} className="flex items-start gap-2 px-3 py-2 rounded-md bg-muted/30 text-sm group">
                <Icon className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{item.content}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {info.label} · {new Date(item.created_at).toLocaleDateString("ru-RU")} {new Date(item.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  onClick={() => deleteInteraction.mutate(item.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientsTab;
