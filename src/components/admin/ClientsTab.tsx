import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Save, Loader2, Trash2, X, RefreshCw, FileText, ClipboardList, History } from "lucide-react";

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
  });

  const resetForm = () => {
    setName(""); setContactPerson(""); setPhone(""); setEmail(""); setTelegram(""); setNotes("");
    setServiceType(""); setFrdoLogin(""); setFrdoPassword(""); setPaymentDate("");
    setInn(""); setKpp(""); setOgrn(""); setLegalAddress(""); setDirectorName(""); setDirectorPost("");
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (c: Client) => {
    setEditingId(c.id); setName(c.name); setContactPerson(c.contact_person || "");
    setPhone(c.phone || ""); setEmail(c.email || ""); setTelegram(c.telegram || "");
    setNotes(c.notes || ""); setServiceType(c.service_type || "");
    setFrdoLogin(c.frdo_login || ""); setFrdoPassword(c.frdo_password || "");
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
      <div className="flex items-center gap-3">
        <Input placeholder="Поиск клиентов..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Button variant="outline" onClick={syncAllClients} disabled={syncingAll || clients.length === 0}>
          {syncingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Синхр. все реквизиты
        </Button>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />Добавить
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Контактное лицо</Label><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Иванов И.И." /></div>
              <div className="space-y-2"><Label>Телефон</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 999 123-45-67" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@company.ru" /></div>
              <div className="space-y-2"><Label>Telegram</Label><Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Логин ФИС ФРДО</Label><Input value={frdoLogin} onChange={(e) => setFrdoLogin(e.target.value)} placeholder="login" /></div>
              <div className="space-y-2"><Label>Пароль ФИС ФРДО</Label><Input value={frdoPassword} onChange={(e) => setFrdoPassword(e.target.value)} placeholder="password" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>ИНН</Label><Input value={inn} onChange={(e) => setInn(e.target.value)} placeholder="1234567890" /></div>
                <div className="space-y-2"><Label>КПП</Label><Input value={kpp} onChange={(e) => setKpp(e.target.value)} placeholder="123456789" /></div>
                <div className="space-y-2"><Label>ОГРН</Label><Input value={ogrn} onChange={(e) => setOgrn(e.target.value)} placeholder="1234567890123" /></div>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Юридический адрес</Label>
                <Input value={legalAddress} onChange={(e) => setLegalAddress(e.target.value)} placeholder="г. Москва, ул. ..." />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsTab;
