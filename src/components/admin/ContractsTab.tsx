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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, Save, Loader2, Trash2, Pencil, X, Download, Archive, ArchiveRestore, AlertTriangle, Search, RefreshCw, MoreVertical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TablePagination from "./TablePagination";
import { Checkbox } from "@/components/ui/checkbox";

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
  is_one_time: boolean;
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
  const [isOneTime, setIsOneTime] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState("active");
  const [inn, setInn] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [innLoading, setInnLoading] = useState(false);

  const { data: contracts = [], isLoading, error: contractsError } = useQuery({
    queryKey: ["admin-contracts"],
    queryFn: async () => {
      console.log("[ContractsTab] Starting contracts query...");
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Query timeout after 10s")), 10000)
      );
      const queryPromise = supabase
        .from("contracts")
        .select("*")
        .order("updated_at", { ascending: false });
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      console.log("[ContractsTab] Query result:", { count: data?.length, error });
      if (error) throw error;
      return data as Contract[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const getNextContractNumber = () => {
    const year = new Date().getFullYear();
    let maxNum = 0;
    contracts.forEach((c) => {
      const match = c.contract_number?.match(/^(\d+)-(\d{4})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `${maxNum + 1}-${year}`;
  };

  const resetForm = () => {
    setClientName(""); setContractNumber(""); setContractDate(""); setPaymentStatus("не оплачено");
    setAmount(""); setAmountExtra(""); setContractType(""); setResponsible(""); setNotes("");
    setPaidUntil(""); setInn(""); setFile(null); setEditingId(null); setShowForm(false); setIsOneTime(false);
  };

  const lookupByValue = async (searchValue: string) => {
    if (!searchValue.trim()) return toast.error("Введите ИНН или название организации");
    setInnLoading(true);
    try {
      const val = searchValue.trim();
      const isInn = /^\d{10,12}$/.test(val);
      const { data, error } = await supabase.functions.invoke("dadata-lookup", {
        body: isInn ? { inn: val } : { query: val },
      });
      if (error) throw error;
      if (!data?.found) {
        toast.error("Организация не найдена");
        return;
      }
      setClientName(data.name_short || data.name || "");
      if (data.inn) setInn(data.inn);
      if (data.management_name) {
        setNotes((prev) => {
          const mgmt = `${data.management_post || "Руководитель"}: ${data.management_name}`;
          return prev ? `${prev}\n${mgmt}` : mgmt;
        });
      }
      toast.success(`Найдено: ${data.name_short || data.name}`);
    } catch {
      toast.error("Ошибка поиска");
    } finally {
      setInnLoading(false);
    }
  };

  const lookupInn = () => lookupByValue(inn);

  const startEdit = (c: Contract) => {
    setEditingId(c.id); setClientName(c.client_name); setContractNumber(c.contract_number || "");
    setContractDate(c.contract_date || ""); setPaymentStatus(c.payment_status || "не оплачено");
    setAmount(c.amount?.toString() || ""); setAmountExtra(c.amount_extra?.toString() || "");
    setContractType(c.contract_type || ""); setResponsible(c.responsible || "");
    setNotes(c.notes || ""); setPaidUntil(c.paid_until || ""); setFile(null); setShowForm(true);
    setIsOneTime(c.is_one_time ?? false);
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
    // Auto-calculate paid_until from contract_date + 1 year if not one-time and no manual value
    let computedPaidUntil = paidUntil || null;
    if (!isOneTime && contractDate && !paidUntil) {
      const d = new Date(contractDate);
      d.setFullYear(d.getFullYear() + 1);
      computedPaidUntil = d.toISOString().split("T")[0];
    }
    if (isOneTime) {
      computedPaidUntil = null;
    }
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
      paid_until: computedPaidUntil,
      is_one_time: isOneTime,
    };

    // Optimistic update for edits
    if (editingId) {
      const prev = queryClient.getQueryData<Contract[]>(["admin-contracts"]);
      queryClient.setQueryData<Contract[]>(["admin-contracts"], (old) =>
        old?.map((c) => c.id === editingId ? { ...c, ...payload } as Contract : c) ?? []
      );
      resetForm();
      setSaving(false);
      toast.success("Договор обновлён");

      try {
        if (file) { const fp = await uploadFile(editingId); if (fp) payload.file_path = fp; }
        const { error } = await supabase.from("contracts").update(payload as any).eq("id", editingId);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      } catch {
        queryClient.setQueryData(["admin-contracts"], prev);
        toast.error("Ошибка сохранения — изменения откачены");
      }
    } else {
      // New contract — check session first, then insert
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          toast.error("Сессия истекла — войдите заново");
          setSaving(false);
          return;
        }
        const { data, error } = await supabase.from("contracts").insert(payload as any).select("id").single();
        if (error) {
          console.error("Contract insert error:", error);
          throw error;
        }
        if (file && data) {
          const fp = await uploadFile(data.id);
          if (fp) await supabase.from("contracts").update({ file_path: fp }).eq("id", data.id);
        }
        toast.success("Договор добавлен");
        queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
        resetForm();
      } catch (err: any) {
        const msg = err?.message || "Неизвестная ошибка";
        toast.error(`Ошибка сохранения: ${msg}`);
      }
      setSaving(false);
    }
  };

  const deleteContract = useMutation({
    mutationFn: async (contract: Contract) => {
      if (contract.file_path) await supabase.storage.from("contracts").remove([contract.file_path]);
      const { error } = await supabase.from("contracts").delete().eq("id", contract.id);
      if (error) throw error;
    },
    onMutate: async (contract) => {
      await queryClient.cancelQueries({ queryKey: ["admin-contracts"] });
      const prev = queryClient.getQueryData<Contract[]>(["admin-contracts"]);
      queryClient.setQueryData<Contract[]>(["admin-contracts"], (old) => old?.filter((c) => c.id !== contract.id) ?? []);
      return { prev };
    },
    onSuccess: () => { toast.success("Договор удалён"); },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(["admin-contracts"], ctx.prev); toast.error("Ошибка удаления"); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-contracts"] }),
  });

  const toggleArchive = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase.from("contracts").update({ is_archived: archive } as any).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, archive }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-contracts"] });
      const prev = queryClient.getQueryData<Contract[]>(["admin-contracts"]);
      queryClient.setQueryData<Contract[]>(["admin-contracts"], (old) =>
        old?.map((c) => c.id === id ? { ...c, is_archived: archive } : c) ?? []
      );
      return { prev };
    },
    onSuccess: () => { toast.success("Готово"); },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(["admin-contracts"], ctx.prev); toast.error("Ошибка"); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-contracts"] }),
  });

  const togglePaymentStatus = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: string | null }) => {
      const cycle = ["не оплачено", "частично", "оплачено"];
      const idx = cycle.indexOf(current || "не оплачено");
      const next = cycle[(idx + 1) % cycle.length];
      const { error } = await supabase.from("contracts").update({ payment_status: next } as any).eq("id", id);
      if (error) throw error;
      return { id, next };
    },
    onMutate: async ({ id, current }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-contracts"] });
      const prev = queryClient.getQueryData<Contract[]>(["admin-contracts"]);
      const cycle = ["не оплачено", "частично", "оплачено"];
      const idx = cycle.indexOf(current || "не оплачено");
      const next = cycle[(idx + 1) % cycle.length];
      queryClient.setQueryData<Contract[]>(["admin-contracts"], (old) =>
        old?.map((c) => c.id === id ? { ...c, payment_status: next } : c) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(["admin-contracts"], ctx.prev); toast.error("Ошибка обновления статуса"); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-contracts"] }),
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

  const getAnniversaryDays = (contractDate: string | null, contractType: string | null): number | null => {
    if (!contractDate || !contractType) return null;
    const type = contractType.toLowerCase();
    if (!type.includes("сайт") && !type.includes("фрдо")) return null;
    const cd = new Date(contractDate);
    const now = new Date();
    const nextAnniversary = new Date(cd);
    nextAnniversary.setFullYear(now.getFullYear());
    if (nextAnniversary < now) nextAnniversary.setFullYear(now.getFullYear() + 1);
    const diffDays = Math.round((nextAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 14 ? diffDays : null;
  };

  if (contractsError) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-sm text-destructive">Ошибка загрузки: {contractsError.message}</p>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-contracts"] })} className="text-sm text-primary underline">Повторить</button>
      </div>
    );
  }

  // Reset page on search/tab change
  const handleSearch = (v: string) => { setSearch(v); setCurrentPage(1); };
  const handleTab = (v: string) => { setTab(v); setCurrentPage(1); };
  const handlePageSize = (v: number) => { setPageSize(v); setCurrentPage(1); };

  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y">
              {items.map((c) => (
                <div key={c.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => startEdit(c)} className="font-medium text-left hover:text-primary hover:underline underline-offset-2 transition-colors text-sm">
                      {c.client_name}
                    </button>
                    <Badge
                      variant={statusColor(c.payment_status)}
                      className="shrink-0 text-xs cursor-pointer hover:opacity-80 transition-opacity select-none"
                      onClick={(e) => { e.stopPropagation(); togglePaymentStatus.mutate({ id: c.id, current: c.payment_status }); }}
                    >{c.payment_status || "—"}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {c.contract_number && <span className="font-mono">№{c.contract_number}</span>}
                    {c.contract_date && <span>{new Date(c.contract_date).toLocaleDateString("ru-RU")}</span>}
                    <span className="font-medium text-foreground">{formatAmount(c.amount)}</span>
                    {c.contract_type && <span>{c.contract_type}</span>}
                    {(() => { const d = getAnniversaryDays(c.contract_date, c.contract_type); return d !== null ? (
                      <span className="flex items-center gap-1 text-orange-500 font-semibold">
                        <RefreshCw className="w-3 h-3" />Продление через {d} дн.
                      </span>
                    ) : null; })()}
                  </div>
                  {c.paid_until && (
                    <div className={`text-xs flex items-center gap-1 ${isPaidUntilExpired(c.paid_until) ? "text-red-500 font-semibold" : isPaidUntilSoon(c.paid_until) ? "text-yellow-500 font-semibold" : "text-muted-foreground"}`}>
                      {(isPaidUntilExpired(c.paid_until) || isPaidUntilSoon(c.paid_until)) && <AlertTriangle className="w-3 h-3" />}
                      Оплачено до: {new Date(c.paid_until).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                  <div className="flex gap-1 pt-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5">
                          <MoreVertical className="w-4 h-4" /> Действия
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(c)}>
                          <Pencil className="w-4 h-4 mr-2" /> Редактировать
                        </DropdownMenuItem>
                        {c.file_path && (
                          <DropdownMenuItem onClick={() => downloadFile(c.file_path!)}>
                            <Download className="w-4 h-4 mr-2" /> Скачать файл
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toggleArchive.mutate({ id: c.id, archive: !isArchive })}>
                          {isArchive ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                          {isArchive ? "Восстановить" : "В архив"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => deleteContract.mutate(c)} className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table className="min-w-[1100px]">
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
                    <TableHead className="w-[80px] text-right sticky right-0 bg-background">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <button onClick={() => startEdit(c)} className="hover:underline hover:text-primary text-left transition-colors cursor-pointer">
                          {c.client_name}
                        </button>
                      </TableCell>
                      <TableCell>{c.contract_number || "—"}</TableCell>
                      <TableCell>{c.contract_date ? new Date(c.contract_date).toLocaleDateString("ru-RU") : "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusColor(c.payment_status)}
                          className="cursor-pointer hover:opacity-80 transition-opacity select-none"
                          onClick={() => togglePaymentStatus.mutate({ id: c.id, current: c.payment_status })}
                        >{c.payment_status || "—"}</Badge>
                      </TableCell>
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
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center gap-1.5">
                            {c.contract_type || "—"}
                            {(() => { const d = getAnniversaryDays(c.contract_date, c.contract_type); return d !== null ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <RefreshCw className="w-4 h-4 text-orange-500" />
                                </TooltipTrigger>
                                <TooltipContent>Продление через {d} дн.</TooltipContent>
                              </Tooltip>
                            ) : null; })()}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>{c.responsible || "—"}</TableCell>
                      <TableCell className="text-right sticky right-0 bg-background">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="w-9 h-9">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEdit(c)}>
                              <Pencil className="w-4 h-4 mr-2" /> Редактировать
                            </DropdownMenuItem>
                            {c.file_path && (
                              <DropdownMenuItem onClick={() => downloadFile(c.file_path!)}>
                                <Download className="w-4 h-4 mr-2" /> Скачать файл
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => toggleArchive.mutate({ id: c.id, archive: !isArchive })}>
                              {isArchive ? <ArchiveRestore className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                              {isArchive ? "Восстановить" : "В архив"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteContract.mutate(c)} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              onPageSizeChange={handlePageSize}
            />
            <div className="flex justify-center py-4 border-t">
              <Button variant="outline" onClick={() => { resetForm(); setContractNumber(getNextContractNumber()); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <Plus className="w-4 h-4 mr-2" />Добавить договор
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Input placeholder="Поиск договоров..." value={search} onChange={(e) => handleSearch(e.target.value)} className="flex-1" />
        <Button onClick={() => { resetForm(); setContractNumber(getNextContractNumber()); setShowForm(true); }}>
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
                <Label>Поиск по ИНН / названию</Label>
                <Input value={inn} onChange={(e) => setInn(e.target.value)} placeholder="ИНН или название организации" onKeyDown={(e) => e.key === "Enter" && lookupInn()} />
              </div>
              <Button onClick={lookupInn} disabled={innLoading} variant="outline">
                {innLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Организация *</Label>
                <div className="flex gap-2">
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="ООО Ромашка" onKeyDown={(e) => e.key === "Enter" && lookupByValue(clientName)} />
                  <Button variant="outline" size="icon" className="shrink-0" disabled={innLoading || !clientName.trim()} onClick={() => lookupByValue(clientName)} title="Найти по названию">
                    {innLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2"><Label>Номер договора</Label><Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} placeholder="140-2024" /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2"><Label>Дата</Label><Input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Статус оплаты</Label><Input value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} placeholder="оплачено / не оплачено" /></div>
              <div className="space-y-2"><Label>Оплачено до</Label><Input type="date" value={paidUntil} onChange={(e) => setPaidUntil(e.target.value)} /></div>
              <div className="space-y-2"><Label>Тип договора</Label><Input value={contractType} onChange={(e) => setContractType(e.target.value)} placeholder="фрдо, разработка..." /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      <Tabs value={tab} onValueChange={handleTab}>
        <TabsList>
          <TabsTrigger value="active">Активные ({activeCount})</TabsTrigger>
          <TabsTrigger value="archive" className="gap-2"><Archive className="w-4 h-4" />Архив ({archiveCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {renderTable(paginatedItems, false)}
        </TabsContent>
        <TabsContent value="archive" className="mt-4">
          {renderTable(paginatedItems, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractsTab;
