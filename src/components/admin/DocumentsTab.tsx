import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Loader2, Printer, Search, History, Eye, Download, X, Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  type DocumentData,
  type ServiceItem,
  type CompanyRequisites,
  type ClientRequisites,
  generateContractHtml,
  generateInvoiceHtml,
  generateActHtml,
} from "@/lib/document-templates";

type DocType = "contract" | "invoice" | "act";

const DOC_LABELS: Record<DocType, string> = {
  contract: "Договор",
  invoice: "Счёт на оплату",
  act: "Акт выполненных работ",
};

const DocumentsTab = ({ initialContractId, onMounted }: { initialContractId?: string; onMounted?: () => void }) => {
  const queryClient = useQueryClient();
  const { settings, isLoading: settingsLoading } = useSiteSettings();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["doc-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name, email, inn, kpp, ogrn, legal_address, director_name, director_post").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["doc-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, contract_number, contract_date, client_name")
        .order("contract_number", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [docType, setDocType] = useState<DocType>("contract");
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Auto-generate doc number from last document
  const { data: lastDocNumbers } = useQuery({
    queryKey: ["last-doc-numbers"],
    queryFn: async () => {
      const result: Record<string, string> = {};
      for (const type of ["contract", "invoice", "act"] as DocType[]) {
        const { data } = await supabase
          .from("generated_documents" as any)
          .select("doc_number")
          .eq("doc_type", type)
          .order("created_at", { ascending: false })
          .limit(1);
        if (data && data.length > 0) {
          const lastNum = parseInt((data[0] as any).doc_number, 10);
          result[type] = String(isNaN(lastNum) ? 1 : lastNum + 1).padStart(3, "0");
        } else {
          result[type] = "001";
        }
      }
      return result;
    },
  });

  useEffect(() => {
    if (lastDocNumbers && !docNumber) {
      setDocNumber(lastDocNumbers[docType] || "001");
    }
  }, [lastDocNumbers, docType]);

  // client
  const [clientSearch, setClientSearch] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientInn, setClientInn] = useState("");
  const [clientKpp, setClientKpp] = useState("");
  const [clientOgrn, setClientOgrn] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientDirectorName, setClientDirectorName] = useState("");
  const [clientDirectorPost, setClientDirectorPost] = useState("Директор");

  // services
  const [services, setServices] = useState<ServiceItem[]>([{ name: "", qty: 1, price: 0 }]);

  // contract-specific
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");

  // act-specific
  const [linkedContractId, setLinkedContractId] = useState("");

  const [lookingUp, setLookingUp] = useState(false);

  // Pre-fill from planner task
  useEffect(() => {
    if (initialContractId && contracts.length > 0) {
      const contract = contracts.find(c => c.id === initialContractId);
      if (contract) {
        setLinkedContractId(contract.id);
        setClientName(contract.client_name || "");
      }
      onMounted?.();
    }
  }, [initialContractId, contracts]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const lookupInn = async () => {
    if (!clientInn || clientInn.length < 10) return toast.error("Введите корректный ИНН");
    setLookingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke("dadata-lookup", {
        body: { inn: clientInn },
      });
      if (error) throw error;
      if (!data?.found) { toast.error("Организация не найдена"); return; }
      setClientName(data.name_short || data.name || "");
      setClientKpp(data.kpp || "");
      setClientOgrn(data.ogrn || "");
      setClientAddress(data.address || "");
      setClientDirectorName(data.management_name || "");
      setClientDirectorPost(data.management_post || "Директор");
      toast.success("Реквизиты заполнены");
    } catch {
      toast.error("Ошибка запроса DaData");
    }
    setLookingUp(false);
  };

  const selectClient = async (clientId: string, name: string) => {
    setClientName(name);
    setClientSearch("");

    // First try to use existing client data from DB
    const client = clients.find(c => c.id === clientId);
    if (client?.inn) {
      setClientInn(client.inn || "");
      setClientKpp(client.kpp || "");
      setClientOgrn(client.ogrn || "");
      setClientAddress(client.legal_address || "");
      setClientDirectorName(client.director_name || "");
      setClientDirectorPost(client.director_post || "Директор");
      toast.success("Реквизиты загружены из карточки клиента");
      return;
    }

    // If no data in DB, lookup via DaData and save to client record
    setLookingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke("dadata-lookup", {
        body: { query: name },
      });
      if (error) throw error;
      if (data?.found) {
        setClientInn(data.inn || "");
        setClientKpp(data.kpp || "");
        setClientOgrn(data.ogrn || "");
        setClientAddress(data.address || "");
        setClientDirectorName(data.management_name || "");
        setClientDirectorPost(data.management_post || "Директор");
        if (data.name_short) setClientName(data.name_short);

        // Save requisites to client record in DB
        if (data.inn && clientId) {
          const updatePayload: Record<string, string | null> = {};
          if (data.inn) updatePayload.inn = data.inn;
          if (data.kpp) updatePayload.kpp = data.kpp;
          if (data.ogrn) updatePayload.ogrn = data.ogrn;
          if (data.address) updatePayload.legal_address = data.address;
          if (data.management_name) updatePayload.director_name = data.management_name;
          if (data.management_post) updatePayload.director_post = data.management_post;
          await supabase.from("clients").update(updatePayload).eq("id", clientId);
          queryClient.invalidateQueries({ queryKey: ["doc-clients"] });
          queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
          toast.success("Реквизиты найдены и сохранены в карточку клиента");
        } else {
          toast.info("Организация найдена, но реквизиты неполные");
        }
      } else {
        toast.info("Организация не найдена в DaData. Введите ИНН для поиска.");
      }
    } catch {
      // Silent fail
    }
    setLookingUp(false);
  };

  const addService = () => setServices(prev => [...prev, { name: "", qty: 1, price: 0 }]);
  const removeService = (i: number) => setServices(prev => prev.filter((_, idx) => idx !== i));
  const updateService = (i: number, field: keyof ServiceItem, value: string | number) => {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const total = services.reduce((s, i) => s + i.qty * i.price, 0);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  };

  const generate = async () => {
    if (!docNumber.trim()) return toast.error("Укажите номер документа");
    if (!clientName.trim()) return toast.error("Укажите клиента");
    if (services.every(s => !s.name.trim())) return toast.error("Добавьте хотя бы одну услугу");

    const company: CompanyRequisites = {
      company_name: settings.company_name || "",
      company_short_name: settings.company_short_name || "",
      company_inn: settings.company_inn || "",
      company_kpp: settings.company_kpp || "",
      company_ogrn: settings.company_ogrn || "",
      company_legal_address: settings.company_legal_address || "",
      company_actual_address: settings.company_actual_address || "",
      company_bank_account: settings.company_bank_account || "",
      company_bank_bik: settings.company_bank_bik || "",
      company_bank_corr: settings.company_bank_corr || "",
      company_bank_name: settings.company_bank_name || "",
      company_director_name: settings.company_director_name || "",
      company_director_post: settings.company_director_post || "",
      company_phone: settings.company_phone || "",
      company_email: settings.company_email || "",
    };

    const client: ClientRequisites = {
      name: clientName,
      inn: clientInn,
      kpp: clientKpp,
      ogrn: clientOgrn,
      address: clientAddress,
      director_name: clientDirectorName,
      director_post: clientDirectorPost,
    };

    const linkedContract = contracts.find(c => c.id === linkedContractId);

    const docData: DocumentData = {
      type: docType,
      number: docNumber,
      date: formatDate(docDate),
      company,
      client,
      services: services.filter(s => s.name.trim()),
      subject,
      deadline,
      paymentTerms,
      contractNumber: linkedContract?.contract_number || "",
      contractDate: linkedContract?.contract_date ? formatDate(linkedContract.contract_date) : "",
    };

    let html = "";
    switch (docType) {
      case "contract": html = generateContractHtml(docData); break;
      case "invoice": html = generateInvoiceHtml(docData); break;
      case "act": html = generateActHtml(docData); break;
    }

    // Save to DB
    try {
      const filteredServices = services.filter(s => s.name.trim());
      const { error: insertError } = await supabase.from("generated_documents").insert({
        doc_type: docType,
        doc_number: docNumber,
        doc_date: docDate,
        client_name: clientName,
        client_inn: clientInn || null,
        contract_id: linkedContractId || null,
        total_amount: total,
        services: JSON.stringify(filteredServices),
        html_content: html,
      });
      if (insertError) {
        console.error("Document save error:", insertError);
        toast.error(`Ошибка сохранения: ${insertError.message}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["generated-documents"] });
        toast.success("Документ сохранён");
      }
    } catch (err) {
      console.error("Document save exception:", err);
      toast.error("Не удалось сохранить документ");
    }

    setPreviewHtml(html);
  };

  const sendDocumentEmail = async () => {
    if (!emailTo.trim() || !previewHtml) return toast.error("Укажите email получателя");
    setEmailSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-document-email', {
        body: {
          to: emailTo.trim(),
          subject: `${DOC_LABELS[docType]} №${docNumber} от ${formatDate(docDate)}`,
          html: previewHtml,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Ошибка отправки');
      
      // Save email to client card if not already there
      const client = clients.find(c => c.name === clientName);
      if (client && !client.email && emailTo.trim()) {
        await supabase.from("clients").update({ email: emailTo.trim() }).eq("id", client.id);
        queryClient.invalidateQueries({ queryKey: ["doc-clients"] });
        queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      }
      
      toast.success(`Документ отправлен на ${emailTo}`);
      setEmailDialogOpen(false);
      setEmailTo("");
    } catch (err: any) {
      toast.error(err.message || "Не удалось отправить письмо");
    }
    setEmailSending(false);
  };

  if (settingsLoading || clientsLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Document type & number */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Тип и номер документа</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Тип документа</Label>
            <Select value={docType} onValueChange={v => { setDocType(v as DocType); setDocNumber(lastDocNumbers?.[v] || "001"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(DOC_LABELS) as DocType[]).map(k => (
                  <SelectItem key={k} value={k}>{DOC_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Номер</Label>
            <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="001" />
          </div>
          <div className="space-y-1">
            <Label>Дата</Label>
            <Input type="date" value={docDate} onChange={e => setDocDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Client */}
      <Card>
        <CardHeader>
          <CardTitle>Заказчик (контрагент)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label>Выбрать из клиентов</Label>
              <div className="relative">
                <Input
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder="Поиск клиента..."
                />
                {clientSearch && filteredClients.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                    {filteredClients.map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                        onClick={() => selectClient(c.id, c.name)}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>ИНН</Label>
              <div className="flex gap-2">
                <Input value={clientInn} onChange={e => setClientInn(e.target.value)} placeholder="1234567890" />
                <Button variant="outline" size="sm" onClick={lookupInn} disabled={lookingUp} className="shrink-0">
                  {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Название</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="ООО «Клиент»" />
            </div>
            <div className="space-y-1">
              <Label>КПП</Label>
              <Input value={clientKpp} onChange={e => setClientKpp(e.target.value)} placeholder="123456789" />
            </div>
            <div className="space-y-1">
              <Label>ОГРН</Label>
              <Input value={clientOgrn} onChange={e => setClientOgrn(e.target.value)} placeholder="1234567890123" />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>Адрес</Label>
              <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="г. Москва, ул. ..." />
            </div>
            <div className="space-y-1">
              <Label>ФИО руководителя</Label>
              <Input value={clientDirectorName} onChange={e => setClientDirectorName(e.target.value)} placeholder="Петров Пётр Петрович" />
            </div>
            <div className="space-y-1">
              <Label>Должность</Label>
              <Input value={clientDirectorPost} onChange={e => setClientDirectorPost(e.target.value)} placeholder="Директор" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract-specific */}
      {docType === "contract" && (
        <Card>
          <CardHeader><CardTitle>Условия договора</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Предмет договора</Label>
              <Textarea value={subject} onChange={e => setSubject(e.target.value)} placeholder="Разработка веб-сайта..." rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Сроки выполнения</Label>
                <Input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="30 рабочих дней" />
              </div>
              <div className="space-y-1">
                <Label>Условия оплаты</Label>
                <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="100% предоплата" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Act-specific: link to contract */}
      {docType === "act" && (
        <Card>
          <CardHeader><CardTitle>Привязка к договору</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Label>Договор</Label>
              <Select value={linkedContractId} onValueChange={setLinkedContractId}>
                <SelectTrigger><SelectValue placeholder="Выберите договор (необязательно)" /></SelectTrigger>
                <SelectContent>
                  {contracts.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      №{c.contract_number} — {c.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Услуги / работы</span>
            <Button variant="outline" size="sm" onClick={addService}><Plus className="w-4 h-4 mr-1" />Добавить</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {services.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_120px_auto] gap-2 items-end">
                <div className="space-y-1">
                  {i === 0 && <Label>Наименование</Label>}
                  <Input value={s.name} onChange={e => updateService(i, "name", e.target.value)} placeholder="Услуга..." />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label>Кол-во</Label>}
                  <Input type="number" min={1} value={s.qty} onChange={e => updateService(i, "qty", parseInt(e.target.value) || 1)} />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label>Цена, ₽</Label>}
                  <Input type="number" min={0} value={s.price} onChange={e => updateService(i, "price", parseFloat(e.target.value) || 0)} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeService(i)} disabled={services.length <= 1}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right font-semibold text-lg">
            Итого: {total.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽
          </div>
        </CardContent>
      </Card>

      {/* Generate */}
      <Button onClick={generate} size="lg" className="w-full">
        <Printer className="w-5 h-5 mr-2" />
        Сформировать {DOC_LABELS[docType]}
      </Button>

      {/* History */}
      <DocumentHistory onView={setPreviewHtml} />

      {/* Document Preview Modal */}
      <Dialog open={!!previewHtml} onOpenChange={(open) => { if (!open) setPreviewHtml(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0">
            <DialogTitle>Предпросмотр документа</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.print();
                  }
                }}
              >
                <Printer className="w-4 h-4 mr-2" />
                Печать
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const client = clients.find(c => c.name === clientName);
                  setEmailTo(client?.email || "");
                  setEmailDialogOpen(true);
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                На почту
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!previewHtml || !iframeRef.current?.contentWindow) return;
                  iframeRef.current.contentWindow.print();
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать PDF
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewHtml && (
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                className="w-full h-full border-0 bg-white"
                title="Предпросмотр документа"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Отправить на почту</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Email получателя</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                placeholder="client@example.com"
                onKeyDown={e => { if (e.key === 'Enter') sendDocumentEmail(); }}
              />
            </div>
            <Button onClick={sendDocumentEmail} disabled={emailSending} className="w-full">
              {emailSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Отправить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DOC_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  contract: { label: "Договор", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  invoice: { label: "Счёт", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  act: { label: "Акт", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

const DocumentHistory = ({ onView }: { onView: (html: string) => void }) => {
  const queryClient = useQueryClient();
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["generated-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_documents" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const viewDoc = (html: string) => {
    onView(html);
  };

  const deleteDoc = async (id: string) => {
    const { error } = await supabase.from("generated_documents" as any).delete().eq("id", id);
    if (error) { toast.error("Ошибка удаления"); return; }
    queryClient.invalidateQueries({ queryKey: ["generated-documents"] });
    toast.success("Документ удалён");
  };

  if (isLoading) return null;
  if (docs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" />История документов</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тип</TableHead>
              <TableHead>Номер</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((doc: any) => {
              const typeInfo = DOC_TYPE_LABELS[doc.doc_type] || { label: doc.doc_type, color: "" };
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">№{doc.doc_number}</TableCell>
                  <TableCell>{new Date(doc.doc_date).toLocaleDateString("ru-RU")}</TableCell>
                  <TableCell>{doc.client_name}</TableCell>
                  <TableCell>{doc.total_amount ? Number(doc.total_amount).toLocaleString("ru-RU", { minimumFractionDigits: 2 }) + " ₽" : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => viewDoc(doc.html_content)} title="Открыть">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc.id)} className="text-destructive hover:text-destructive" title="Удалить">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DocumentsTab;
