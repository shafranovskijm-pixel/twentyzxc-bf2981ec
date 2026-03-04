import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Save, Loader2, Trash2, Pencil, X, Download, Archive, ArchiveRestore, AlertTriangle, Search } from "lucide-react";

interface Contract {
  id: string;
  client_name: string;
  contract_number: string | null;
  contract_date: string | null;
  payment_status: string | null;
  amount: number | null;
  amount_extra: number | null;
  contract_type: string | null;
  responsible: string | null;
  file_path: string | null;
  notes: string | null;
  paid_until: string | null;
  is_archived: boolean;
  created_at: string;
}

const ContractsTab = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("не оплачено");
  const [amount, setAmount] = useState("");
  const [amountExtra, setAmountExtra] = useState("");
  const [contractType, setContractType] = useState("");
  const [responsible, setResponsible] = useState("");
  const [notes, setNotes] = useState("");
  const [paidUntil, setPaidUntil] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState("active");
  const [inn, setInn] = useState("");
  const [innLoading, setInnLoading] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["admin-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("contract_number", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });

  const resetForm = () => {
    setClientName(""); setContractNumber(""); setContractDate(""); setPaymentStatus("не оплачено");
    setAmount(""); setAmountExtra(""); setContractType(""); setResponsible(""); setNotes("");
    setPaidUntil(""); setInn(""); setFile(null); setEditingId(null); setShowForm(false);
  };

  const lookupInn = async () => {
    if (!inn.trim()) return toast.error("Введите ИНН");
    setInnLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("dadata-lookup", {
        body: { inn: inn.trim() },
      });
      if (error) throw error;
      if (!data?.found) {
        toast.error("Организация не найдена");
        return;
      }
      setClientName(data.name_short || data.name || "");
      if (data.management_name) {
        setNotes((prev) => {
          const mgmt = `${data.management_post || "Руководитель"}: ${data.management_name}`;
          return prev ? `${prev}\n${mgmt}` : mgmt;
        });
      }
      toast.success(`Найдено: ${data.name_short || data.name}`);
    } catch {
      toast.error("Ошибка поиска по ИНН");
    } finally {
      setInnLoading(false);
    }
  };

  const startEdit = (c: Contract) => {
    setEditingId(c.id); setClientName(c.client_name); setContractNumber(c.contract_number || "");
    setContractDate(c.contract_date || ""); setPaymentStatus(c.payment_status || "не оплачено");
    setAmount(c.amount?.toString() || ""); setAmountExtra(c.amount_extra?.toString() || "");
    setContractType(c.contract_type || ""); setResponsible(c.responsible || "");
    setNotes(c.notes || ""); setPaidUntil(c.paid_until || ""); setFile(null); setShowForm(true);
  };

  const uploadFile = async (contractId: string): Promise<string | null> => {
    if (!file) return null;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${contractId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("contracts").upload(path, file);
    setUploading(false);
    if (error) { toast.error("Ошибка загрузки файла"); return null; }
    return path;
  };

  const saveContract = async () => {
    if (!clientName.trim()) return toast.error("Укажите организацию");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        client_name: clientName.trim(),
        contract_number: contractNumber.trim() || null,
        contract_date: contractDate || null,
        payment_status: paymentStatus || null,
        amount: amount ? parseFloat(amount) : null,
        amount_extra: amountExtra ? parseFloat(amountExtra) : null,
        contract_type: contractType.trim() || null,
        responsible: responsible.trim() || null,
        notes: notes.trim() || null,
        paid_until: paidUntil || null,
      };
      if (editingId) {
        if (file) { const fp = await uploadFile(editingId); if (fp) payload.file_path = fp; }
        const { error } = await supabase.from("contracts").update(payload as any).eq("id", editingId);
        if (error) throw error;
        toast.success("Договор обновлён");
      } else {
        const { data, error } = await supabase.from("contracts").insert(payload as any).select("id").single();
        if (error) throw error;
        if (file && data) {
          const fp = await uploadFile(data.id);
          if (fp) await supabase.from("contracts").update({ file_path: fp }).eq("id", data.id);
        }
        toast.success("Договор добавлен");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      resetForm();
    } catch { toast.error("Ошибка сохранения"); }
    setSaving(false);
  };

  const deleteContract = useMutation({
    mutationFn: async (contract: Contract) => {
      if (contract.file_path) await supabase.storage.from("contracts").remove([contract.file_path]);
      const { error } = await supabase.from("contracts").delete().eq("id", contract.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-contracts"] }); toast.success("Договор удалён"); },
    onError: () => toast.error("Ошибка удаления"),
  });

  const toggleArchive = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase.from("contracts").update({ is_archived: archive } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      toast.success("Готово");
    },
    onError: () => toast.error("Ошибка"),
  });

  const downloadFile = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("contracts").download(filePath);
    if (error || !data) return toast.error("Ошибка скачивания");
    const url = URL.createObjectURL(data);
    const a = document.createElement("a"); a.href = url;
    a.download = filePath.split("/").pop() || "contract"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = contracts.filter((c) => {
    const isArchived = (c as any).is_archived ?? false;
    if (tab === "active" && isArchived) return false;
    if (tab === "archive" && !isArchived) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return c.client_name.toLowerCase().includes(s) ||
      c.contract_number?.toLowerCase().includes(s) ||
      c.contract_type?.toLowerCase().includes(s) ||
      c.responsible?.toLowerCase().includes(s);
  });

  const activeCount = contracts.filter((c) => !(c as any).is_archived).length;
  const archiveCount = contracts.filter((c) => (c as any).is_archived).length;

  const statusColor = (status: string | null) => {
    if (!status) return "secondary";
    if (status.toLowerCase().includes("оплачено") && !status.toLowerCase().includes("не")) return "default";
    return "secondary";
  };

  const formatAmount = (n: number | null) => {
    if (n == null) return "—";
    return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
  };

  const isPaidUntilSoon = (paidUntil: string | null) => {
    if (!paidUntil) return false;
    const date = new Date(paidUntil);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 30 && diffDays >= 0;
  };

  const isPaidUntilExpired = (paidUntil: string | null) => {
    if (!paidUntil) return false;
    return new Date(paidUntil) < new Date();
  };

  const renderTable = (items: Contract[], isArchive: boolean) => (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? "Ничего не найдено" : isArchive ? "Архив пуст" : "Нет договоров"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Организация</TableHead>
                  <TableHead>№ договора</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Оплата</TableHead>
                  <TableHead>Оплачено до</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Ответственный</TableHead>
                  <TableHead className="w-[140px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.client_name}</TableCell>
                    <TableCell>{c.contract_number || "—"}</TableCell>
                    <TableCell>{c.contract_date ? new Date(c.contract_date).toLocaleDateString("ru-RU") : "—"}</TableCell>
                    <TableCell><Badge variant={statusColor(c.payment_status)}>{c.payment_status || "—"}</Badge></TableCell>
                    <TableCell>
                      {c.paid_until ? (
                        <span className={`flex items-center gap-1 ${isPaidUntilExpired(c.paid_until) ? "text-red-500 font-semibold" : isPaidUntilSoon(c.paid_until) ? "text-yellow-500 font-semibold" : ""}`}>
                          {isPaidUntilExpired(c.paid_until) && <AlertTriangle className="w-4 h-4" />}
                          {isPaidUntilSoon(c.paid_until) && !isPaidUntilExpired(c.paid_until) && <AlertTriangle className="w-4 h-4" />}
                          {new Date(c.paid_until).toLocaleDateString("ru-RU")}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{formatAmount(c.amount)}</TableCell>
                    <TableCell>{c.contract_type || "—"}</TableCell>
                    <TableCell>{c.responsible || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {c.file_path && (
                          <Button variant="ghost" size="icon" onClick={() => downloadFile(c.file_path!)} title="Скачать"><Download className="w-4 h-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => toggleArchive.mutate({ id: c.id, archive: !isArchive })} title={isArchive ? "Восстановить" : "В архив"}>
                          {isArchive ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteContract.mutate(c)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Input placeholder="Поиск договоров..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />Добавить
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{editingId ? "Редактировать договор" : "Новый договор"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="space-y-2 flex-1">
                <Label>Поиск по ИНН</Label>
                <Input value={inn} onChange={(e) => setInn(e.target.value)} placeholder="Введите ИНН организации" onKeyDown={(e) => e.key === "Enter" && lookupInn()} />
              </div>
              <Button onClick={lookupInn} disabled={innLoading} variant="outline">
                {innLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Организация *</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="ООО Ромашка" /></div>
              <div className="space-y-2"><Label>Номер договора</Label><Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} placeholder="140-2024" /></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2"><Label>Дата</Label><Input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Статус оплаты</Label><Input value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} placeholder="оплачено / не оплачено" /></div>
              <div className="space-y-2"><Label>Оплачено до</Label><Input type="date" value={paidUntil} onChange={(e) => setPaidUntil(e.target.value)} /></div>
              <div className="space-y-2"><Label>Тип договора</Label><Input value={contractType} onChange={(e) => setContractType(e.target.value)} placeholder="фрдо, разработка..." /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Сумма</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="23000" /></div>
              <div className="space-y-2"><Label>Доп. сумма</Label><Input type="number" value={amountExtra} onChange={(e) => setAmountExtra(e.target.value)} placeholder="5000" /></div>
              <div className="space-y-2"><Label>Ответственный</Label><Input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Иванов" /></div>
            </div>
            <div className="space-y-2"><Label>Заметки</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Примечания..." rows={2} /></div>
            <div className="space-y-2"><Label>Файл договора (PDF/Word)</Label><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
            <Button onClick={saveContract} disabled={saving || uploading} className="w-full">
              {(saving || uploading) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingId ? "Обновить" : "Добавить"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Активные ({activeCount})</TabsTrigger>
          <TabsTrigger value="archive" className="gap-2"><Archive className="w-4 h-4" />Архив ({archiveCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {renderTable(filtered, false)}
        </TabsContent>
        <TabsContent value="archive" className="mt-4">
          {renderTable(filtered, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractsTab;
