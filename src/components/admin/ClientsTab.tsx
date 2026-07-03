import { useState, useEffect } from "react";
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
import { Plus, Save, Loader2, Trash2, X, RefreshCw, FileText, ClipboardList, History, Phone, Mail, MessageSquare, StickyNote, Send, Search, Download, CheckSquare, Eye } from "lucide-react";
import { KeyRound, Building2, User, Copy } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TablePagination from "./TablePagination";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generatePdfBlob, blobToBase64, downloadBlob, safePdfFilename } from "@/lib/document-pdf";
import QuickDocumentDialog from "./QuickDocumentDialog";

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
  service_deadline: string | null;
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

async function fetchDadata(params: { inn?: string; query?: string }) {
  try {
    const { data, error } = await supabase.functions.invoke("dadata-lookup", {
      body: params,
    });
    if (error) throw error;
    if (!data?.found) return null;
    return {
      name: data.name || null,
      name_short: data.name_short || null,
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

const ClientsTab = ({ onNavigate, initialClientName, onConsumed }: ClientsTabProps = {}) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quickDoc, setQuickDoc] = useState<{ open: boolean; docType: "contract" | "invoice" | "act"; clientName: string }>({ open: false, docType: "contract", clientName: "" });
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
  const [serviceDeadline, setServiceDeadline] = useState("");
  const [inn, setInn] = useState("");
  const [kpp, setKpp] = useState("");
  const [ogrn, setOgrn] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [directorPost, setDirectorPost] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [syncing, setSyncing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importConfirm, setImportConfirm] = useState<{ names: string[]; contractTypes: Record<string, string>; selectedNames: Set<string> } | null>(null);

  const handleImportFromContracts = async () => {
    setImporting(true);
    try {
      const { data: contracts } = await supabase
        .from("contracts")
        .select("client_name, contract_type")
        .eq("is_archived", false);
      const { data: existingClients } = await supabase
        .from("clients")
        .select("name");

      const existingNames = new Set((existingClients || []).map(c => c.name.toLowerCase().trim()));
      const newNamesMap = new Map<string, string>();
      
      (contracts || []).forEach(c => {
        const key = c.client_name.toLowerCase().trim();
        if (!existingNames.has(key) && !newNamesMap.has(key)) {
          newNamesMap.set(key, c.contract_type || "");
        }
      });

      if (newNamesMap.size === 0) {
        toast.info("Все клиенты из договоров уже импортированы");
        setImporting(false);
        return;
      }

      const names: string[] = [];
      const contractTypes: Record<string, string> = {};
      // Get original casing from contracts
      (contracts || []).forEach(c => {
        const key = c.client_name.toLowerCase().trim();
        if (newNamesMap.has(key) && !contractTypes[c.client_name]) {
          names.push(c.client_name);
          contractTypes[c.client_name] = c.contract_type || "";
          newNamesMap.delete(key);
        }
      });

      setImportConfirm({ names, contractTypes, selectedNames: new Set<string>() });
    } catch {
      toast.error("Ошибка при загрузке данных");
    }
    setImporting(false);
  };

  const toggleImportName = (name: string) => {
    if (!importConfirm) return;
    const next = new Set(importConfirm.selectedNames);
    if (next.has(name)) next.delete(name); else next.add(name);
    setImportConfirm({ ...importConfirm, selectedNames: next });
  };

  const toggleAllImport = () => {
    if (!importConfirm) return;
    const allSelected = importConfirm.selectedNames.size === importConfirm.names.length;
    setImportConfirm({
      ...importConfirm,
      selectedNames: allSelected ? new Set<string>() : new Set(importConfirm.names),
    });
  };

  const confirmImport = async () => {
    if (!importConfirm || importConfirm.selectedNames.size === 0) return;
    setImporting(true);
    try {
      const selectedNames = importConfirm.names.filter(name => importConfirm.selectedNames.has(name));

      // Fetch INN from generated_documents for selected clients
      const { data: docs } = await supabase
        .from("generated_documents")
        .select("client_name, client_inn")
        .in("client_name", selectedNames)
        .not("client_inn", "is", null);

      const innMap = new Map<string, string>();
      (docs || []).forEach(d => {
        if (d.client_inn && !innMap.has(d.client_name)) {
          innMap.set(d.client_name, d.client_inn);
        }
      });

      const rows = selectedNames.map(name => {
        const ct = importConfirm.contractTypes[name]?.toUpperCase() || "";
        let serviceType: string | null = null;
        if (ct.includes("ФРДО")) serviceType = "ФРДО";
        else if (ct.includes("САЙТ") || ct.includes("SITE")) serviceType = "САЙТ";
        else if (ct) serviceType = "ПРОЧЕЕ";
        return { name, service_type: serviceType, inn: innMap.get(name) || null };
      });

      const { error, data: inserted } = await supabase.from("clients").insert(rows as any).select();
      if (error) throw error;

      toast.success(`Импортировано ${rows.length} клиентов`);
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });

      // Auto-sync requisites via DaData for clients with INN
      const withInn = (inserted || []).filter((c: any) => c.inn);
      if (withInn.length > 0) {
        toast.info(`Синхронизация реквизитов для ${withInn.length} клиентов...`);
        for (const client of withInn) {
          const dadata = await fetchDadata({ inn: (client as any).inn });
          if (dadata) {
            await supabase.from("clients").update({
              kpp: dadata.kpp,
              ogrn: dadata.ogrn,
              legal_address: dadata.legal_address,
              director_name: dadata.director_name,
              director_post: dadata.director_post,
            } as any).eq("id", (client as any).id);
          }
        }
        queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
        toast.success("Реквизиты синхронизированы");
      }
    } catch {
      toast.error("Ошибка импорта");
    }
    setImportConfirm(null);
    setImporting(false);
  };

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
    setServiceDeadline("");
    setInn(""); setKpp(""); setOgrn(""); setLegalAddress(""); setDirectorName(""); setDirectorPost("");
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (c: Client) => {
    setEditingId(c.id); setName(c.name); setContactPerson(c.contact_person || "");
    setPhone(c.phone || ""); setEmail(c.email || ""); setTelegram(c.telegram || "");
    setNotes(c.notes || ""); setServiceType(c.service_type || "");
    setFrdoLogin(c.frdo_login || ""); setFrdoPassword(c.frdo_password || ""); setFrdoPasswordPo((c as any).frdo_password_po || "");
    setPaymentDate(c.payment_date || "");
    setServiceDeadline((c as any).service_deadline || "");
    setInn(c.inn || ""); setKpp(c.kpp || ""); setOgrn(c.ogrn || "");
    setLegalAddress(c.legal_address || ""); setDirectorName(c.director_name || "");
    setDirectorPost(c.director_post || "");
    setShowForm(true);
  };

  useEffect(() => {
    if (!initialClientName || isLoading) return;
    const target = initialClientName.toLowerCase().trim();
    const found = (clients as Client[]).find((c) => c.name.toLowerCase().trim() === target);
    if (found) {
      startEdit(found);
    } else {
      resetForm();
      setName(initialClientName);
      setShowForm(true);
      toast.info("Карточка не найдена — заполните и сохраните");
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
    onConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClientName, isLoading]);

  const fillFromContract = async () => {
    const clientName = name.trim();
    if (!clientName) { toast.error("Укажите название клиента"); return; }
    setSyncing(true);
    try {
      const { data } = await supabase.from("generated_documents")
        .select("client_inn")
        .eq("client_name", clientName)
        .not("client_inn", "is", null)
        .limit(1)
        .maybeSingle();
      if (data?.client_inn) {
        setInn(data.client_inn);
        toast.success(`ИНН из документа: ${data.client_inn}`);
        // Auto-sync via DaData with the correct INN
        const result = await fetchDadata({ inn: data.client_inn });
        if (result) {
          if (result.kpp) setKpp(result.kpp);
          if (result.ogrn) setOgrn(result.ogrn);
          if (result.legal_address) setLegalAddress(result.legal_address);
          if (result.director_name) setDirectorName(result.director_name);
          if (result.director_post) setDirectorPost(result.director_post);
          toast.success("Реквизиты заполнены из договора");
        }
      } else {
        toast.error("ИНН не найден в документах этого клиента");
      }
    } catch { toast.error("Ошибка при поиске ИНН в документах"); }
    setSyncing(false);
  };

  const syncRequisites = async (byInn = false) => {
    const innVal = inn.trim();
    const nameVal = name.trim();
    if (byInn && (!innVal || !/^\d{10,12}$/.test(innVal))) {
      return toast.error("Введите корректный ИНН (10 или 12 цифр)");
    }
    if (!byInn && !nameVal) return toast.error("Укажите название организации");
    setSyncing(true);
    const params = byInn ? { inn: innVal } : { query: nameVal };
    const result = await fetchDadata(params);
    if (result) {
      if (byInn && result.name) setName(result.name);
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
          const params = client.inn ? { inn: client.inn } : { query: client.name };
          const result = await fetchDadata(params);
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
        service_deadline: serviceDeadline || null,
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
        <Input placeholder="Поиск клиентов..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="flex-1 min-w-[150px]" />
        <Button variant="outline" onClick={handleImportFromContracts} disabled={importing} size="sm" className="sm:size-default">
          {importing ? <Loader2 className="w-4 h-4 animate-spin sm:mr-2" /> : <Download className="w-4 h-4 sm:mr-2" />}
          <span className="hidden sm:inline">Импорт из договоров</span>
        </Button>
        <Button variant="outline" onClick={syncAllClients} disabled={syncingAll || clients.length === 0} size="sm" className="sm:size-default">
          {syncingAll ? <Loader2 className="w-4 h-4 animate-spin sm:mr-2" /> : <RefreshCw className="w-4 h-4 sm:mr-2" />}
          <span className="hidden sm:inline">Синхр. все реквизиты</span>
        </Button>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="sm:size-default">
          <Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Добавить</span>
        </Button>

        <AlertDialog open={!!importConfirm} onOpenChange={(open) => !open && setImportConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Импорт клиентов из договоров</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Выбрано {importConfirm?.selectedNames?.size || 0} из {importConfirm?.names?.length || 0}</span>
                    <Button variant="ghost" size="sm" onClick={toggleAllImport} className="text-xs h-7">
                      <CheckSquare className="w-3 h-3 mr-1" />
                      {importConfirm?.selectedNames?.size === importConfirm?.names?.length ? "Снять все" : "Выбрать все"}
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto text-xs space-y-1">
                    {importConfirm?.names.map((n, i) => (
                      <label key={i} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted cursor-pointer">
                        <Checkbox
                          checked={importConfirm.selectedNames.has(n)}
                          onCheckedChange={() => toggleImportName(n)}
                        />
                        <span className="flex-1">{n}</span>
                        {importConfirm.contractTypes[n] && (
                          <Badge variant="outline" className="ml-2 text-[10px]">{importConfirm.contractTypes[n]}</Badge>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={confirmImport} disabled={importing || !(importConfirm?.selectedNames?.size)}>
                {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Импортировать ({importConfirm?.selectedNames?.size || 0})
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg">{editingId ? "Редактировать клиента" : "Новый клиент"}</CardTitle>
              <div className="flex items-center gap-2">
                {editingId && onNavigate && (
                  <>
                    <Button variant="outline" size="sm" onClick={async () => { await saveClient(); setQuickDoc({ open: true, docType: "contract", clientName: name }); }} title="Договор с предпросмотром">
                      <FileText className="w-4 h-4 mr-1" /> Договор
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => { await saveClient(); setQuickDoc({ open: true, docType: "invoice", clientName: name }); }} title="Счёт с предпросмотром">
                      <ClipboardList className="w-4 h-4 mr-1" /> Счёт
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => { await saveClient(); setQuickDoc({ open: true, docType: "act", clientName: name }); }} title="Акт с предпросмотром">
                      <CheckSquare className="w-4 h-4 mr-1" /> Акт
                    </Button>
                    {telegram && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`https://t.me/${telegram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">
                          <Send className="w-4 h-4 mr-1" /> Telegram
                        </a>
                      </Button>
                    )}
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Always-visible: organization name */}
            <div className="space-y-2">
              <Label>Название организации *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ООО Ромашка" />
            </div>

            {/* Quick facts strip (read-only) */}
            {editingId && (
              <ClientQuickFacts
                phone={phone}
                email={email}
                telegram={telegram}
                inn={inn}
                paymentDate={paymentDate}
                serviceDeadline={serviceDeadline}
                contactPerson={contactPerson}
                clientId={editingId}
                clientName={name}
              />
            )}

            {/* Sections: contracts + activity (open by default), then docs/tasks/edit groups */}
            <ClientCardSections
              editingId={editingId}
              clientName={name}
              interactionsEnabled={!!editingId}
              // form state
              contactPerson={contactPerson} setContactPerson={setContactPerson}
              phone={phone} setPhone={setPhone}
              email={email} setEmail={setEmail}
              telegram={telegram} setTelegram={setTelegram}
              notes={notes} setNotes={setNotes}
              serviceType={serviceType} setServiceType={setServiceType}
              frdoLogin={frdoLogin} setFrdoLogin={setFrdoLogin}
              frdoPassword={frdoPassword} setFrdoPassword={setFrdoPassword}
              frdoPasswordPo={frdoPasswordPo} setFrdoPasswordPo={setFrdoPasswordPo}
              paymentDate={paymentDate} setPaymentDate={setPaymentDate}
              serviceDeadline={serviceDeadline} setServiceDeadline={setServiceDeadline}
              inn={inn} setInn={setInn}
              kpp={kpp} setKpp={setKpp}
              ogrn={ogrn} setOgrn={setOgrn}
              legalAddress={legalAddress} setLegalAddress={setLegalAddress}
              directorName={directorName} setDirectorName={setDirectorName}
              directorPost={directorPost} setDirectorPost={setDirectorPost}
              syncing={syncing}
              fillFromContract={fillFromContract}
              syncRequisites={syncRequisites}
              onOpenQuickDocument={(docType) => setQuickDoc({ open: true, docType, clientName: name })}
            />

            <Button onClick={saveClient} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingId ? "Сохранить изменения" : "Добавить"}
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
                {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((c) => (
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
                      <TableHead>Срок услуг</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((c) => (
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
                        <TableCell className="text-xs">
                          {(c as any).service_deadline ? (() => {
                            const dl = new Date((c as any).service_deadline);
                            const diff = Math.round((dl.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            const color = diff < 0 ? "text-destructive" : diff <= 30 ? "text-destructive" : diff <= 90 ? "text-amber-400" : "text-muted-foreground";
                            return <span className={color}>{dl.toLocaleDateString("ru-RU")}</span>;
                          })() : "—"}
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
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(v) => { setPageSize(v); setCurrentPage(1); }}
              />
            </>
          )}
        </CardContent>
      </Card>
      <QuickDocumentDialog
        open={quickDoc.open}
        onOpenChange={(v) => setQuickDoc((q) => ({ ...q, open: v }))}
        clientName={quickDoc.clientName}
        docType={quickDoc.docType}
      />
    </div>
  );
};

const DOC_TYPE_LABELS: Record<string, string> = {
  contract: "Договор",
  invoice: "Счёт",
  act: "Акт",
};

interface ClientsTabProps {
  onNavigate?: (section: string, params?: { clientName?: string; docType?: string }) => void;
  initialClientName?: string;
  onConsumed?: () => void;
}

const ClientHistory = ({ clientName, clientId }: { clientName: string; clientId: string }) => {
  const queryClient = useQueryClient();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["client-history-contracts", clientName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, contract_number, contract_date, amount, payment_status, contract_type, file_path")
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
        .select("id, doc_type, doc_number, doc_date, total_amount, html_content")
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
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const newStatus = c.payment_status === "оплачено" ? "не оплачено" : "оплачено";
                    await supabase.from("contracts").update({ payment_status: newStatus } as any).eq("id", c.id);
                    queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
                    queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
                    toast.success(`Статус: ${newStatus}`);
                  }}
                  className={`text-xs ml-auto px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${statusColor(c.payment_status)}`}
                >
                  {c.payment_status || "не оплачено"}
                </button>
                {c.file_path && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const { data } = await supabase.storage.from("contracts").createSignedUrl(c.file_path!, 300);
                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      else toast.error("Не удалось открыть файл");
                    }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                )}
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
                {d.html_content && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setPreviewHtml(d.html_content)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                )}
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
      {/* Document preview dialog */}
      <Dialog open={!!previewHtml} onOpenChange={(open) => { if (!open) setPreviewHtml(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Просмотр документа</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewHtml(null)}><X className="w-4 h-4" /></Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 p-2">
            <iframe
              srcDoc={previewHtml || ""}
              className="w-full h-full min-h-[600px] bg-white rounded border"
              style={{ border: "none" }}
            />
          </div>
        </DialogContent>
      </Dialog>
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

// ============================================================
// Shared data hooks (React Query dedupes between count + list)
// ============================================================
const useClientContracts = (clientName: string) =>
  useQuery({
    queryKey: ["client-history-contracts", clientName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, contract_number, contract_date, amount, payment_status, contract_type, file_path")
        .eq("client_name", clientName)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientName,
  });

const useClientDocuments = (clientName: string) =>
  useQuery({
    queryKey: ["client-history-docs", clientName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_documents")
        .select("id, doc_type, doc_number, doc_date, total_amount, html_content")
        .eq("client_name", clientName)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientName,
  });

const useClientTasks = (clientId: string) =>
  useQuery({
    queryKey: ["client-history-tasks", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, task_date")
        .eq("client_id", clientId)
        .order("task_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

const useClientInteractions = (clientId: string) =>
  useQuery({
    queryKey: ["client-interactions", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_interactions")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

// ============================================================
// Quick facts header strip
// ============================================================
const ClientQuickFacts = ({ phone, email, telegram, inn, paymentDate, serviceDeadline, contactPerson, clientId, clientName }: {
  phone: string; email: string; telegram: string; inn: string;
  paymentDate: string; serviceDeadline: string; contactPerson: string;
  clientId?: string; clientName?: string;
}) => {
  const copy = (v: string, label: string) => {
    if (!v) return;
    navigator.clipboard.writeText(v).then(() => toast.success(`${label} скопирован`));
  };
  const [callOpen, setCallOpen] = useState(false);
  const hasAny = phone || email || telegram || inn || paymentDate || serviceDeadline || contactPerson;
  if (!hasAny) return null;

  let deadlineNode: React.ReactNode = null;
  if (serviceDeadline) {
    const dl = new Date(serviceDeadline);
    const diff = Math.round((dl.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const cls = diff < 0 || diff <= 30 ? "text-destructive" : diff <= 90 ? "text-amber-400" : "text-muted-foreground";
    deadlineNode = (
      <span className={`inline-flex items-center gap-1 ${cls}`} title={`Срок услуг до ${dl.toLocaleDateString("ru-RU")}`}>
        ⏳ до {dl.toLocaleDateString("ru-RU")}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground rounded-md border border-border/40 bg-muted/20 px-3 py-2">
      {contactPerson && (
        <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{contactPerson}</span>
      )}
      {phone && (
        <span className="inline-flex items-center gap-1">
          <button
            onClick={() => (clientId ? setCallOpen(true) : copy(phone, "Телефон"))}
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            title="Зафиксировать звонок"
          >
            <Phone className="w-3 h-3" />{phone}
          </button>
          <button
            onClick={() => copy(phone, "Телефон")}
            className="opacity-50 hover:opacity-100 hover:text-primary transition"
            title="Скопировать номер"
          >
            <Copy className="w-2.5 h-2.5" />
          </button>
        </span>
      )}
      {email && (
        <button onClick={() => copy(email, "Email")} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
          <Mail className="w-3 h-3" />{email}<Copy className="w-2.5 h-2.5 opacity-50" />
        </button>
      )}
      {telegram && (
        <a href={`https://t.me/${telegram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
          <Send className="w-3 h-3" />{telegram}
        </a>
      )}
      {inn && (
        <button onClick={() => copy(inn, "ИНН")} className="inline-flex items-center gap-1 font-mono hover:text-primary transition-colors">
          ИНН: {inn}<Copy className="w-2.5 h-2.5 opacity-50" />
        </button>
      )}
      {paymentDate && (
        <span className="inline-flex items-center gap-1">💳 {new Date(paymentDate).toLocaleDateString("ru-RU")}</span>
      )}
      {deadlineNode}
      {clientId && (
        <LogCallDialog
          open={callOpen}
          onClose={() => setCallOpen(false)}
          clientId={clientId}
          clientName={clientName || ""}
          phone={phone}
        />
      )}
    </div>
  );
};

// ============================================================
// Main accordion structure inside the client card
// ============================================================
const SECTIONS_KEY = "client-card-sections";
const DEFAULT_OPEN = ["contracts", "activity"];

interface ClientCardSectionsProps {
  editingId: string | null;
  clientName: string;
  interactionsEnabled: boolean;
  contactPerson: string; setContactPerson: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  telegram: string; setTelegram: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  serviceType: string; setServiceType: (v: string) => void;
  frdoLogin: string; setFrdoLogin: (v: string) => void;
  frdoPassword: string; setFrdoPassword: (v: string) => void;
  frdoPasswordPo: string; setFrdoPasswordPo: (v: string) => void;
  paymentDate: string; setPaymentDate: (v: string) => void;
  serviceDeadline: string; setServiceDeadline: (v: string) => void;
  inn: string; setInn: (v: string) => void;
  kpp: string; setKpp: (v: string) => void;
  ogrn: string; setOgrn: (v: string) => void;
  legalAddress: string; setLegalAddress: (v: string) => void;
  directorName: string; setDirectorName: (v: string) => void;
  directorPost: string; setDirectorPost: (v: string) => void;
  syncing: boolean;
  fillFromContract: () => void;
  syncRequisites: (byInn?: boolean) => void;
  onOpenQuickDocument: (docType: "contract" | "invoice" | "act") => void;
}

const ClientCardSections = (p: ClientCardSectionsProps) => {
  const [open, setOpen] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_OPEN;
    try {
      const raw = localStorage.getItem(SECTIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_OPEN;
  });
  useEffect(() => {
    try { localStorage.setItem(SECTIONS_KEY, JSON.stringify(open)); } catch {}
  }, [open]);

  const { data: contracts = [] } = useClientContracts(p.clientName);
  const { data: documents = [] } = useClientDocuments(p.clientName);
  const { data: tasks = [] } = useClientTasks(p.editingId || "");
  const { data: interactions = [] } = useClientInteractions(p.editingId || "");

  return (
    <Accordion type="multiple" value={open} onValueChange={setOpen} className="w-full">
      {/* Contracts */}
      {p.editingId && (
        <AccordionItem value="contracts">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Договоры <span className="text-muted-foreground">({contracts.length})</span></span>
          </AccordionTrigger>
          <AccordionContent>
            <ContractsSection clientName={p.clientName} onOpenContract={() => p.onOpenQuickDocument("contract")} />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Activity */}
      {p.interactionsEnabled && p.editingId && (
        <AccordionItem value="activity">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2"><History className="w-4 h-4" /> Активность по клиенту <span className="text-muted-foreground">({interactions.length})</span></span>
          </AccordionTrigger>
          <AccordionContent>
            <InteractionLog clientId={p.editingId} />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Documents */}
      {p.editingId && documents.length > 0 && (
        <AccordionItem value="documents">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Документы <span className="text-muted-foreground">({documents.length})</span></span>
          </AccordionTrigger>
          <AccordionContent>
            <DocumentsSection clientName={p.clientName} clientId={p.editingId} onOpenQuickDocument={p.onOpenQuickDocument} />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Tasks */}
      {p.editingId && tasks.length > 0 && (
        <AccordionItem value="tasks">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Задачи <span className="text-muted-foreground">({tasks.length})</span></span>
          </AccordionTrigger>
          <AccordionContent>
            <TasksSection clientId={p.editingId} />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Logins & access */}
      <AccordionItem value="logins">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Логины и доступы</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>Услуга</Label>
              <Select value={p.serviceType} onValueChange={p.setServiceType}>
                <SelectTrigger><SelectValue placeholder="Выберите услугу" /></SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Логин ФИС ФРДО</Label><Input value={p.frdoLogin} onChange={(e) => p.setFrdoLogin(e.target.value)} placeholder="login" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Пароль ДПО</Label><Input value={p.frdoPassword} onChange={(e) => p.setFrdoPassword(e.target.value)} placeholder="пароль ДПО" /></div>
              <div className="space-y-2"><Label>Пароль ПО</Label><Input value={p.frdoPasswordPo} onChange={(e) => p.setFrdoPasswordPo(e.target.value)} placeholder="пароль ПО" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата оплаты</Label>
                <Input type="date" value={p.paymentDate} onChange={(e) => p.setPaymentDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Срок оказания услуг (до)</Label>
                <Input type="date" value={p.serviceDeadline} onChange={(e) => p.setServiceDeadline(e.target.value)} />
                {p.serviceDeadline && (() => {
                  const diff = Math.round((new Date(p.serviceDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  if (diff < 0) return <p className="text-xs text-destructive">Срок истёк {Math.abs(diff)} дн. назад</p>;
                  if (diff <= 30) return <p className="text-xs text-destructive">Осталось {diff} дн.</p>;
                  if (diff <= 90) return <p className="text-xs text-amber-400">Осталось {diff} дн.</p>;
                  return <p className="text-xs text-muted-foreground">Осталось {diff} дн.</p>;
                })()}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Requisites */}
      <AccordionItem value="requisites">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Реквизиты</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-1">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={p.fillFromContract} disabled={p.syncing}>
                <FileText className="w-4 h-4 mr-2" /> Из договора
              </Button>
              <Button variant="outline" size="sm" onClick={() => p.syncRequisites()} disabled={p.syncing}>
                {p.syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Синхронизировать
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>ИНН</Label><div className="flex gap-2"><Input value={p.inn} onChange={(e) => p.setInn(e.target.value)} placeholder="1234567890" /><Button variant="outline" size="sm" onClick={() => p.syncRequisites(true)} disabled={p.syncing} className="shrink-0" title="Обновить по ИНН">{p.syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button></div></div>
              <div className="space-y-2"><Label>КПП</Label><Input value={p.kpp} onChange={(e) => p.setKpp(e.target.value)} placeholder="123456789" /></div>
              <div className="space-y-2"><Label>ОГРН</Label><Input value={p.ogrn} onChange={(e) => p.setOgrn(e.target.value)} placeholder="1234567890123" /></div>
            </div>
            <div className="space-y-2"><Label>Юридический адрес</Label><Input value={p.legalAddress} onChange={(e) => p.setLegalAddress(e.target.value)} placeholder="г. Москва, ул. ..." /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>ФИО руководителя</Label><Input value={p.directorName} onChange={(e) => p.setDirectorName(e.target.value)} placeholder="Иванов Иван Иванович" /></div>
              <div className="space-y-2"><Label>Должность руководителя</Label><Input value={p.directorPost} onChange={(e) => p.setDirectorPost(e.target.value)} placeholder="Директор" /></div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Contacts & description */}
      <AccordionItem value="contacts">
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2"><User className="w-4 h-4" /> Контакты и описание</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Контактное лицо</Label><Input value={p.contactPerson} onChange={(e) => p.setContactPerson(e.target.value)} placeholder="Иванов И.И." /></div>
              <div className="space-y-2"><Label>Телефон</Label><Input value={p.phone} onChange={(e) => p.setPhone(e.target.value)} placeholder="+7 999 123-45-67" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input value={p.email} onChange={(e) => p.setEmail(e.target.value)} placeholder="info@company.ru" /></div>
              <div className="space-y-2"><Label>Telegram</Label><Input value={p.telegram} onChange={(e) => p.setTelegram(e.target.value)} placeholder="@username" /></div>
            </div>
            <div className="space-y-2">
              <Label>Заметки</Label>
              <Textarea value={p.notes} onChange={(e) => p.setNotes(e.target.value)} placeholder="Доп. информация..." rows={3} />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

// ============================================================
// Section renderers (data reused via React Query cache)
// ============================================================
const ContractsSection = ({ clientName, onOpenContract }: { clientName: string; onOpenContract: () => void }) => {
  const queryClient = useQueryClient();
  const { data: contracts = [], isLoading } = useClientContracts(clientName);
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";
  const statusColor = (s: string | null) => {
    if (s === "оплачено") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "частично") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const handleDownload = async (c: any) => {
    setDownloadingId(c.id);
    try {
      // 1) Прямая загрузка из Storage, если файл прикреплён
      if (c.file_path) {
        const { data, error } = await supabase.storage.from("contracts").download(c.file_path);
        if (error) throw error;
        downloadBlob(data, safePdfFilename(`Договор_${c.contract_number || c.id}_${c.contract_date || ""}.pdf`));
        toast.success("PDF скачан");
        return;
      }
      // 2) Fallback: сгенерированный документ типа "contract"
      const { data: docs } = await supabase
        .from("generated_documents")
        .select("html_content, doc_number, doc_date")
        .eq("contract_id", c.id)
        .eq("doc_type", "contract")
        .order("created_at", { ascending: false })
        .limit(1);
      const html = docs?.[0]?.html_content;
      if (!html) {
        toast.error("Договор ещё не сгенерирован");
        return;
      }
      const blob = await generatePdfBlob(html);
      const name = safePdfFilename(`Договор_${c.contract_number || docs![0].doc_number}_${c.contract_date || docs![0].doc_date}.pdf`);
      downloadBlob(blob, name);
      toast.success("PDF скачан");
    } catch (e: any) {
      toast.error(`Ошибка: ${e?.message || "не удалось скачать"}`);
    } finally {
      setDownloadingId(null);
    }
  };
  if (isLoading) return <p className="text-xs text-muted-foreground">Загрузка...</p>;
  if (!contracts.length) return <p className="text-xs text-muted-foreground">Нет договоров</p>;
  return (
    <div className="space-y-1">
      {contracts.map((c: any) => (
        <div
          key={c.id}
          role="button"
          tabIndex={0}
          onClick={onOpenContract}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenContract();
            }
          }}
          className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-md bg-muted/30 text-sm cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Открыть договор с предпросмотром"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <span className="font-mono text-xs">№{c.contract_number || "—"}</span>
            <span className="text-muted-foreground text-xs">{fmt(c.contract_date)}</span>
            {c.amount && <span className="font-medium">{Number(c.amount).toLocaleString("ru-RU")} ₽</span>}
            {c.contract_type && <Badge variant="outline" className="text-xs">{c.contract_type}</Badge>}
          </div>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const newStatus = c.payment_status === "оплачено" ? "не оплачено" : "оплачено";
              await supabase.from("contracts").update({ payment_status: newStatus } as any).eq("id", c.id);
              queryClient.invalidateQueries({ queryKey: ["client-history-contracts", clientName] });
              queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
              toast.success(`Статус: ${newStatus}`);
            }}
            className={`text-xs ml-auto px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${statusColor(c.payment_status)}`}
          >
            {c.payment_status || "не оплачено"}
          </button>
          {c.file_path && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={async (e) => {
                e.stopPropagation();
                const { data } = await supabase.storage.from("contracts").createSignedUrl(c.file_path!, 300);
                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                else toast.error("Не удалось открыть файл");
              }}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(c);
            }}
            disabled={downloadingId === c.id}
            title="Скачать PDF"
          >
            {downloadingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </Button>
        </div>
      ))}
    </div>
  );
};

const DocumentsSection = ({ clientName, clientId, onOpenQuickDocument }: { clientName: string; clientId?: string; onOpenQuickDocument?: (docType: "contract" | "invoice" | "act") => void }) => {
  const { data: documents = [] } = useClientDocuments(clientName);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [resendDoc, setResendDoc] = useState<any | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";

  const handleDownload = async (d: any) => {
    if (!d.html_content) {
      toast.error("Нет содержимого документа");
      return;
    }
    setDownloadingId(d.id);
    try {
      const blob = await generatePdfBlob(d.html_content);
      const label = DOC_TYPE_LABELS[d.doc_type] || d.doc_type;
      const name = safePdfFilename(`${label}_${d.doc_number}_${d.doc_date}.pdf`);
      downloadBlob(blob, name);
      toast.success("PDF скачан");
    } catch (e: any) {
      toast.error(`Ошибка: ${e?.message || "не удалось создать PDF"}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <div className="space-y-1">
        {documents.map((d: any) => {
          const canOpenBuilder = ["contract", "invoice", "act"].includes(d.doc_type);
          return (
          <div
            key={d.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (d.html_content) setPreviewHtml(d.html_content);
              else if (canOpenBuilder) onOpenQuickDocument?.(d.doc_type);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (d.html_content) setPreviewHtml(d.html_content);
                else if (canOpenBuilder) onOpenQuickDocument?.(d.doc_type);
              }
            }}
            className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-md bg-muted/30 text-sm cursor-pointer transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Открыть предпросмотр документа"
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <Badge variant="outline" className="text-xs">{DOC_TYPE_LABELS[d.doc_type] || d.doc_type}</Badge>
              <span className="font-mono text-xs">№{d.doc_number}</span>
              <span className="text-muted-foreground text-xs">{fmt(d.doc_date)}</span>
              {d.total_amount && <span className="font-medium ml-auto">{Number(d.total_amount).toLocaleString("ru-RU")} ₽</span>}
            </div>
            {d.html_content && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setPreviewHtml(d.html_content); }} title="Просмотр">
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDownload(d); }} disabled={downloadingId === d.id} title="Скачать PDF">
                  {downloadingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setResendDoc(d); }} title="Отправить заново по email">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        );})}
      </div>
      <Dialog open={!!previewHtml} onOpenChange={(open) => { if (!open) setPreviewHtml(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Просмотр документа</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewHtml(null)}><X className="w-4 h-4" /></Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 p-2">
            <iframe srcDoc={previewHtml || ""} className="w-full h-full min-h-[600px] bg-white rounded border" style={{ border: "none" }} />
          </div>
        </DialogContent>
      </Dialog>
      {resendDoc && (
        <ResendDocDialog
          doc={resendDoc}
          clientName={clientName}
          clientId={clientId}
          onClose={() => setResendDoc(null)}
        />
      )}
    </>
  );
};

const TasksSection = ({ clientId }: { clientId: string }) => {
  const { data: tasks = [] } = useClientTasks(clientId);
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : "—";
  const taskStatusLabel = (s: string) => {
    if (s === "done") return { label: "Готово", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    if (s === "in_progress") return { label: "В работе", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    return { label: "К выполнению", cls: "bg-muted text-muted-foreground" };
  };
  return (
    <div className="space-y-1">
      {tasks.map((t: any) => {
        const st = taskStatusLabel(t.status);
        return (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30 text-sm">
            <span className="truncate flex-1">{t.title}</span>
            <span className="text-muted-foreground text-xs">{fmt(t.task_date)}</span>
            <Badge variant="outline" className={`text-xs ${st.cls}`}>{st.label}</Badge>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// Log call dialog (opens when clicking phone in quick facts)
// ============================================================
const LogCallDialog = ({ open, onClose, clientId, clientName, phone }: {
  open: boolean; onClose: () => void; clientId: string; clientName: string; phone: string;
}) => {
  const queryClient = useQueryClient();
  const [when, setWhen] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // datetime-local in local TZ: YYYY-MM-DDTHH:MM
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setWhen(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      setComment("");
    }
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      const dt = when ? new Date(when) : new Date();
      const whenStr = dt.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
      const lines = [
        `📞 ${phone || "—"}`,
        `🕒 ${whenStr}`,
      ];
      if (comment.trim()) lines.push(comment.trim());
      else lines.push("Звонок состоялся");
      const { error } = await supabase.from("client_interactions").insert({
        client_id: clientId,
        interaction_type: "call",
        content: lines.join("\n"),
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["client-interactions", clientId] });
      toast.success("Звонок зафиксирован");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Phone className="w-4 h-4" /> Зафиксировать звонок</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <div><span className="opacity-70">Клиент:</span> <span className="text-foreground">{clientName}</span></div>
            {phone && <div><span className="opacity-70">Номер:</span> <span className="text-foreground font-mono">{phone}</span></div>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Когда</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">О чём договорились (не обязательно)</Label>
            <Textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Кратко: о чём говорили, что решили, следующий шаг…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={saving}>Отмена</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// Resend document dialog (PDF as attachment, no signed links)
// ============================================================
const ResendDocDialog = ({ doc, clientName, clientId, onClose }: {
  doc: any; clientName: string; clientId?: string; onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const docLabel = `${DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type} №${doc.doc_number} от ${new Date(doc.doc_date).toLocaleDateString("ru-RU")}`;
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(docLabel);
  const [alsoContract, setAlsoContract] = useState(false);
  const [contractDoc, setContractDoc] = useState<any | null>(null);
  const [sending, setSending] = useState(false);

  // Prefill client email + look up related contract (if current doc is invoice/act)
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data: client } = await supabase
          .from("clients")
          .select("email")
          .eq("name", clientName)
          .maybeSingle();
        if (!cancel && client?.email) setTo(client.email);
      } catch {}

      if (doc.doc_type !== "contract") {
        try {
          let q = supabase
            .from("generated_documents")
            .select("id, doc_type, doc_number, doc_date, html_content")
            .eq("doc_type", "contract")
            .order("created_at", { ascending: false })
            .limit(1);
          if (doc.contract_id) q = q.eq("contract_id", doc.contract_id);
          else q = q.eq("client_name", clientName);
          const { data } = await q;
          if (!cancel && data && data.length) setContractDoc(data[0]);
        } catch {}
      }
    })();
    return () => { cancel = true; };
  }, [clientName, doc.contract_id, doc.doc_type]);

  const send = async () => {
    const toClean = to.trim();
    if (!toClean) {
      toast.error("Укажите email получателя");
      return;
    }
    setSending(true);
    try {
      const attachments: { filename: string; base64: string; contentType: string }[] = [];

      // Main doc
      const mainBlob = await generatePdfBlob(doc.html_content);
      const mainName = safePdfFilename(
        `${DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}_${doc.doc_number}_${doc.doc_date}.pdf`
      );
      attachments.push({
        filename: mainName,
        base64: await blobToBase64(mainBlob),
        contentType: "application/pdf",
      });

      // Optional: also attach contract
      if (alsoContract && contractDoc?.html_content) {
        const cBlob = await generatePdfBlob(contractDoc.html_content);
        const cName = safePdfFilename(
          `Договор_${contractDoc.doc_number}_${contractDoc.doc_date}.pdf`
        );
        attachments.push({
          filename: cName,
          base64: await blobToBase64(cBlob),
          contentType: "application/pdf",
        });
      }

      const items = attachments
        .map((a, i) => {
          const label = i === 0
            ? docLabel
            : `Договор №${contractDoc.doc_number} от ${new Date(contractDoc.doc_date).toLocaleDateString("ru-RU")}`;
          return `<li style="margin:4px 0;">${label}</li>`;
        })
        .join("");

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color:#111;">
          <p>Добрый день!</p>
          <p>Высылаем документ${attachments.length > 1 ? "ы" : ""} во вложении:</p>
          <ul style="padding-left:20px;">${items}</ul>
          <p style="color:#6b7280;font-size:13px;margin-top:24px;">С уважением, Синтагма.</p>
        </div>
      `;

      const recipients = [toClean, ...(cc.trim() ? [cc.trim()] : [])].filter(Boolean);
      const { data, error } = await supabase.functions.invoke("send-document-email", {
        body: { to: recipients.join(","), subject: subject.trim() || docLabel, html, attachments },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Ошибка отправки");

      // Log to client_interactions
      if (clientId) {
        await supabase.from("client_interactions").insert({
          client_id: clientId,
          interaction_type: "email",
          content: `✉️ Отправлено на ${recipients.join(", ")}\n${attachments.map(a => "• " + a.filename).join("\n")}`,
        });
        queryClient.invalidateQueries({ queryKey: ["client-interactions", clientId] });
      }

      // Update client email if changed
      try {
        const { data: client } = await supabase
          .from("clients")
          .select("id,email")
          .eq("name", clientName)
          .maybeSingle();
        if (client && client.email !== toClean) {
          await supabase.from("clients").update({ email: toClean }).eq("id", client.id);
        }
      } catch {}

      toast.success("Письмо отправлено с вложением");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Не удалось отправить");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !sending) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="w-4 h-4" /> Отправить заново</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Документ: <span className="text-foreground">{docLabel}</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Кому *</Label>
            <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="info@company.ru" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Копия</Label>
            <Input type="email" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="(необязательно)" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Тема</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          {contractDoc && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={alsoContract} onCheckedChange={(v) => setAlsoContract(v === true)} />
              <span>Также вложить Договор №{contractDoc.doc_number}</span>
            </label>
          )}
          <div className="text-[11px] text-muted-foreground">
            Файлы прикрепляются ко письму как PDF — без коротких ссылок.
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={sending}>Отмена</Button>
            <Button onClick={send} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Отправить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
