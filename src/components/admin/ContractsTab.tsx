import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, Save, Loader2, Trash2, Pencil, X, Download, Archive, ArchiveRestore, AlertTriangle, Search, RefreshCw, MoreVertical, FileCheck, FileText, CalendarClock, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import TablePagination from "./TablePagination";
import { Checkbox } from "@/components/ui/checkbox";
import OrgRequisitesBlock from "./contracts/OrgRequisitesBlock";
import DevelopmentContractPanel from "./contracts/DevelopmentContractPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { resendContractEmail } from "@/lib/resend-contract";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { generateContractHtml, type DocumentData, type CompanyRequisites, type ClientRequisites } from "@/lib/document-templates";
import { generatePdfBase64 } from "@/lib/document-pdf";
import {
  compareContractsBySort,
  DEFAULT_CONTRACT_SORT,
  getPaidUntilDaysLeft,
  getNextContractSort,
  matchesContractValidity,
  type ContractSortField,
  type ContractSortState,
  type ContractValidityFilter,
} from "@/lib/contracts-validity";

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

interface SortableTableHeadProps {
  field: ContractSortField;
  label: string;
  sort: ContractSortState;
  onSort: (field: ContractSortField) => void;
}

const SortableTableHead = ({ field, label, sort, onSort }: SortableTableHeadProps) => {
  const active = sort.field === field;
  const directionLabel = !active
    ? "Сортировать"
    : sort.direction === "upcoming"
      ? "Ближайшие окончания"
      : sort.direction === "asc"
        ? "По возрастанию"
        : "По убыванию";

  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex flex-col items-start gap-0.5 whitespace-nowrap text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${label}: ${directionLabel}. Нажмите для изменения порядка`}
        title={`${label}: ${directionLabel}`}
      >
        <span className="inline-flex items-center gap-1.5">
          {label}
          {!active ? (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-45" />
          ) : sort.direction === "upcoming" ? (
            <CalendarClock className="h-3.5 w-3.5 text-orange-500" />
          ) : sort.direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )}
        </span>
        {active && (
          <span className={`text-[10px] font-medium ${sort.direction === "upcoming" ? "text-orange-600" : "text-muted-foreground"}`}>
            {directionLabel}
          </span>
        )}
      </button>
    </TableHead>
  );
};

interface PaidUntilQuickEditProps {
  contract: Pick<Contract, "id" | "paid_until" | "is_one_time">;
  mobile?: boolean;
  isExpired: boolean;
  isSoon: boolean;
  onSave: (paidUntil: string | null) => Promise<unknown>;
}

const PaidUntilQuickEdit = ({
  contract,
  mobile = false,
  isExpired,
  isSoon,
  onSave,
}: PaidUntilQuickEditProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(contract.paid_until || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setDraft(contract.paid_until || "");
  }, [contract.paid_until, open]);

  const save = async (next: string | null) => {
    if (next === (contract.paid_until || null) && !(next && contract.is_one_time)) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setOpen(false);
    } catch {
      // The mutation displays a user-facing error and keeps the editor open.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`group inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isExpired
              ? "text-red-500 font-semibold"
              : isSoon
                ? "text-yellow-500 font-semibold"
                : "text-foreground"
          }`}
          aria-label="Изменить срок оплаты"
        >
          {(isExpired || isSoon) && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
          {mobile && <span className="font-normal text-muted-foreground">Оплачено до:</span>}
          {contract.is_one_time ? (
            <span className="font-medium">Единоразово</span>
          ) : contract.paid_until ? (
            <span>{new Date(contract.paid_until).toLocaleDateString("ru-RU")}</span>
          ) : (
            <span className="font-normal text-muted-foreground">Нет срока</span>
          )}
          <Pencil className="h-3.5 w-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <div>
          <p className="text-sm font-semibold">Оплачено до</p>
          <p className="text-xs text-muted-foreground">Измените дату или уберите срок.</p>
        </div>
        <Input
          type="date"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={saving}
          aria-label="Новая дата окончания оплаты"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="flex-1"
            disabled={!draft || saving}
            onClick={() => save(draft)}
          >
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Сохранить
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => save(null)}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Нет срока
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface ContractsTabProps {
  onOpenClient?: (name: string) => void;
  initialClientName?: string;
  initialSearch?: string;
  autoOpenNew?: boolean;
  onConsumed?: () => void;
}

const ContractsTab = ({ onOpenClient, initialClientName, initialSearch, autoOpenNew, onConsumed }: ContractsTabProps = {}) => {
  const queryClient = useQueryClient();
  const { settings } = useSiteSettings();
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
  const [validityFilter, setValidityFilter] = useState<ContractValidityFilter>("all");
  const [contractSort, setContractSort] = useState<ContractSortState>(DEFAULT_CONTRACT_SORT);
  const [inn, setInn] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [innLoading, setInnLoading] = useState(false);

  // Resend (повторная отправка) state
  const [resendOpen, setResendOpen] = useState(false);
  const [resendContract, setResendContract] = useState<Contract | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendIncludeInvoice, setResendIncludeInvoice] = useState(true);
  const [resendSending, setResendSending] = useState(false);

  // Documents (contract/invoice) list dialog
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsContract, setDocsContract] = useState<Contract | null>(null);
  const [docsList, setDocsList] = useState<Array<{ id: string; doc_type: string; doc_number: string; doc_date: string; created_at: string }>>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  // Document preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [previewDocId, setPreviewDocId] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const openPreview = async (doc: { id: string; doc_type: string; doc_number: string }) => {
    const label = doc.doc_type === "contract" ? "Договор" : doc.doc_type === "invoice" ? "Счёт" : doc.doc_type === "act" ? "Акт" : doc.doc_type;
    setPreviewTitle(`${label} №${doc.doc_number}`);
    setPreviewDocId(doc.id);
    setPreviewDocType(doc.doc_type);
    setPreviewDocNumber(doc.doc_number);
    setPreviewHtml("");
    setPreviewOpen(true);
    setPreviewLoading(true);
    const { data } = await supabase
      .from("generated_documents")
      .select("html_content")
      .eq("id", doc.id)
      .maybeSingle();
    setPreviewHtml((data as any)?.html_content || "");
    setPreviewLoading(false);
  };

  const [previewDocType, setPreviewDocType] = useState<string>("");
  const [previewDocNumber, setPreviewDocNumber] = useState<string>("");
  const [previewDownloading, setPreviewDownloading] = useState(false);

  const downloadPreviewPdf = async () => {
    if (!previewHtml) return;
    setPreviewDownloading(true);
    const tid = toast.loading("Генерация PDF...");
    try {
      const base64 = await generatePdfBase64(previewHtml);
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const label = previewDocType === "contract" ? "Договор" : previewDocType === "invoice" ? "Счёт" : previewDocType === "act" ? "Акт" : "Документ";
      a.download = `${label}_${(previewDocNumber || "").replace(/\//g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF скачан", { id: tid });
    } catch (e: any) {
      toast.error(e?.message || "Не удалось сгенерировать PDF", { id: tid });
    } finally {
      setPreviewDownloading(false);
    }
  };

  const sendPreviewByEmail = () => {
    if (!docsContract) return;
    setPreviewOpen(false);
    openResend(docsContract);
  };

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

  // Auto-open "Новый договор" with prefilled client (triggered from ClientsTab)
  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearch]);

  useEffect(() => {
    if (!autoOpenNew) return;
    if (isLoading) return; // wait for contracts list to compute next number
    resetForm();
    if (initialClientName) setClientName(initialClientName);
    setContractNumber(getNextContractNumber());
    setContractDate(new Date().toISOString().split("T")[0]);
    setShowForm(true);
    onConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenNew, isLoading]);

  const resetForm = () => {
    setClientName(""); setContractNumber(""); setContractDate(""); setPaymentStatus("не оплачено");
    setAmount(""); setAmountExtra(""); setContractType(""); setResponsible(""); setNotes("");
    setPaidUntil(""); setInn(""); setFile(null); setEditingId(null); setShowForm(false); setIsOneTime(false);
  };

  // Email lookup by client name for search
  const { data: clientEmails = [] } = useQuery({
    queryKey: ["clients-email-index"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("name, email");
      if (error) throw error;
      return (data || []) as { name: string; email: string | null }[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const emailByClient = new Map<string, string>();
  clientEmails.forEach((c) => {
    if (c.email) emailByClient.set(c.name.toLowerCase().trim(), c.email.toLowerCase());
  });

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

  const isPaid = (status: string | null) => (status || "").toLowerCase().trim() === "оплачено";

  const openDocs = async (c: Contract) => {
    setDocsContract(c);
    setDocsOpen(true);
    setDocsLoading(true);
    setDocsList([]);
    // Match by contract_id OR by doc_number == contract_number (legacy docs)
    const byId = await supabase
      .from("generated_documents")
      .select("id,doc_type,doc_number,doc_date,created_at")
      .eq("contract_id", c.id)
      .order("created_at", { ascending: false });
    const list = new Map<string, any>();
    (byId.data || []).forEach((d) => list.set(d.id, d));
    if (c.contract_number) {
      const byNum = await supabase
        .from("generated_documents")
        .select("id,doc_type,doc_number,doc_date,created_at,client_name,client_inn,contract_id")
        .eq("doc_number", c.contract_number)
        .eq("client_name", c.client_name)
        .order("created_at", { ascending: false });
      (byNum.data || []).forEach((d: any) => {
        // Only include legacy docs that either belong to this contract or have no contract_id yet
        if (list.has(d.id)) return;
        if (d.contract_id && d.contract_id !== c.id) return;
        list.set(d.id, d);
      });
    }
    let items = Array.from(list.values());
    setDocsList(items);
    setDocsLoading(false);
    // Auto-generate contract document silently if none exists
    const hasContract = items.some((d) => d.doc_type === "contract");
    if (!hasContract) {
      const ok = await autoGenerateContract(c, items);
      if (ok) {
        // Refresh the list
        const refresh = await supabase
          .from("generated_documents")
          .select("id,doc_type,doc_number,doc_date,created_at")
          .eq("contract_id", c.id)
          .order("created_at", { ascending: false });
        const map = new Map<string, any>();
        (refresh.data || []).forEach((d) => map.set(d.id, d));
        if (c.contract_number) {
          const r2 = await supabase
            .from("generated_documents")
            .select("id,doc_type,doc_number,doc_date,created_at,client_name,client_inn,contract_id")
            .eq("doc_number", c.contract_number)
            .eq("client_name", c.client_name)
            .order("created_at", { ascending: false });
          (r2.data || []).forEach((d: any) => {
            if (map.has(d.id)) return;
            if (d.contract_id && d.contract_id !== c.id) return;
            map.set(d.id, d);
          });
        }
        const merged = Array.from(map.values());
        setDocsList(merged);
        // Auto-open preview of the newly generated contract
        const created = merged.find((d) => d.doc_type === "contract");
        if (created) {
          setDocsOpen(false);
          await openPreview(created);
        }
      }
    }
  };

  const autoGenerateContract = async (c: Contract, existing: any[]): Promise<boolean> => {
    try {
      toast.loading("Генерирую договор...", { id: "auto-gen-contract" });
      // Load client requisites
      const { data: clientRow } = await supabase
        .from("clients")
        .select("inn, kpp, ogrn, legal_address, director_name, director_post")
        .eq("name", c.client_name)
        .maybeSingle();

      // Try to pull services/metadata from an existing invoice for this contract
      let services: Array<{ name: string; qty: number; price: number }> = [];
      let subject = "";
      let deadline = "";
      let paymentTerms = "";
      const invoiceMeta = existing.find((d) => d.doc_type === "invoice");
      if (invoiceMeta) {
        const { data: inv } = await supabase
          .from("generated_documents")
          .select("services, metadata")
          .eq("id", invoiceMeta.id)
          .maybeSingle();
        if (inv?.services) {
          try {
            const parsed = typeof inv.services === "string" ? JSON.parse(inv.services) : inv.services;
            if (Array.isArray(parsed)) services = parsed;
          } catch {}
        }
        if (inv?.metadata) {
          try {
            const m = typeof inv.metadata === "string" ? JSON.parse(inv.metadata) : inv.metadata;
            subject = m?.subject || "";
            deadline = m?.deadline || "";
            paymentTerms = m?.paymentTerms || "";
          } catch {}
        }
      }
      if (services.length === 0) {
        services = [{
          name: c.contract_type || "Услуги по договору",
          qty: 1,
          price: Number(c.amount) || 0,
        }];
      }

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
        name: c.client_name,
        inn: clientRow?.inn || "",
        kpp: clientRow?.kpp || "",
        ogrn: clientRow?.ogrn || "",
        address: clientRow?.legal_address || "",
        director_name: clientRow?.director_name || "",
        director_post: clientRow?.director_post || "",
      };

      const dateStr = c.contract_date
        ? new Date(c.contract_date).toLocaleDateString("ru-RU")
        : new Date().toLocaleDateString("ru-RU");
      const docNumber = c.contract_number || "";
      if (!docNumber) {
        toast.error("У договора нет номера", { id: "auto-gen-contract" });
        return false;
      }

      const total = services.reduce((s, i) => s + Number(i.qty || 0) * Number(i.price || 0), 0);

      const docData: DocumentData = {
        type: "contract",
        number: docNumber,
        date: dateStr,
        company,
        client,
        services,
        subject,
        deadline,
        paymentTerms,
      };
      const html = generateContractHtml(docData);

      const { error: insertError } = await supabase.from("generated_documents").insert({
        doc_type: "contract",
        doc_number: docNumber,
        doc_date: c.contract_date || new Date().toISOString().split("T")[0],
        client_name: c.client_name,
        client_inn: clientRow?.inn || null,
        contract_id: c.id,
        total_amount: total,
        services: JSON.stringify(services),
        html_content: html,
        metadata: JSON.stringify({
          subject,
          deadline,
          paymentTerms,
          clientKpp: client.kpp,
          clientOgrn: client.ogrn,
          clientAddress: client.address,
          clientDirectorName: client.director_name,
          clientDirectorPost: client.director_post,
        }),
      });
      if (insertError) {
        toast.error(`Не удалось сохранить: ${insertError.message}`, { id: "auto-gen-contract" });
        return false;
      }
      queryClient.invalidateQueries({ queryKey: ["generated-documents"] });
      toast.success("Договор сгенерирован", { id: "auto-gen-contract" });
      return true;
    } catch (e: any) {
      toast.error(`Ошибка генерации: ${e?.message || e}`, { id: "auto-gen-contract" });
      return false;
    }
  };

  const editDoc = (docId: string) => {
    sessionStorage.setItem("pending_edit_doc", JSON.stringify({ docId }));
    window.dispatchEvent(new CustomEvent("admin:navigate", { detail: { section: "documents" } }));
    setDocsOpen(false);
  };

  const createDocFor = (c: Contract, docType: "contract" | "invoice") => {
    sessionStorage.setItem("pending_act", JSON.stringify({
      contractId: c.id,
      clientName: c.client_name,
      docType,
      autoSend: false,
    }));
    window.dispatchEvent(new CustomEvent("admin:navigate", { detail: { section: "documents" } }));
    toast.success(`Открываю конструктор: ${docType === "contract" ? "Договор" : "Счёт"}`);
    setDocsOpen(false);
  };

  const createActAndSend = (c: Contract) => {
    sessionStorage.setItem("pending_act", JSON.stringify({
      contractId: c.id,
      clientName: c.client_name,
      autoSend: true,
    }));
    // Notify Admin layout to switch to Documents tab
    window.dispatchEvent(new CustomEvent("admin:navigate", { detail: { section: "documents" } }));
    toast.success("Открываю конструктор Акта...");
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

  const updatePaidUntil = useMutation({
    mutationFn: async ({ id, paidUntil }: { id: string; paidUntil: string | null }) => {
      const patch: Record<string, unknown> = { paid_until: paidUntil };
      if (paidUntil) patch.is_one_time = false;
      const { error } = await supabase.from("contracts").update(patch as any).eq("id", id);
      if (error) throw error;
      return { id, paidUntil };
    },
    onMutate: async ({ id, paidUntil }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-contracts"] });
      const prev = queryClient.getQueryData<Contract[]>(["admin-contracts"]);
      queryClient.setQueryData<Contract[]>(["admin-contracts"], (old) =>
        old?.map((contract) =>
          contract.id === id
            ? {
                ...contract,
                paid_until: paidUntil,
                is_one_time: paidUntil ? false : contract.is_one_time,
              }
            : contract
        ) ?? []
      );
      return { prev };
    },
    onSuccess: ({ paidUntil }) => {
      toast.success(paidUntil ? "Срок оплаты обновлён" : "Срок оплаты убран");
    },
    onError: (_error, _variables, context) => {
      if (context?.prev) queryClient.setQueryData(["admin-contracts"], context.prev);
      toast.error("Не удалось изменить срок оплаты");
    },
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

  const openResend = async (c: Contract) => {
    setResendContract(c);
    setResendEmail("");
    setResendIncludeInvoice(true);
    setResendOpen(true);
    // Prefill email from clients table
    const { data } = await supabase.from("clients").select("email").eq("name", c.client_name).maybeSingle();
    if (data?.email) setResendEmail(data.email);
  };

  const doResend = async () => {
    if (!resendContract) return;
    const email = resendEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error("Введите корректный email");
    }
    setResendSending(true);
    const tid = toast.loading("Готовлю файлы и ставлю письмо в отправку...");
    try {
      await resendContractEmail({
        contractId: resendContract.id,
        contractNumber: resendContract.contract_number,
        clientName: resendContract.client_name,
        email,
        includeInvoice: resendIncludeInvoice,
      });
      toast.success(`Письмо поставлено в отправку на ${email}`, { id: tid });
      setResendOpen(false);
      queryClient.invalidateQueries({ queryKey: ["contract-files"] });
    } catch (err: any) {
      toast.error(err?.message || "Не удалось отправить", { id: tid });
    } finally {
      setResendSending(false);
    }
  };

  const filtered = contracts.filter((c) => {
    const isArchived = (c as any).is_archived ?? false;
    if (tab === "active" && isArchived) return false;
    if (tab === "archive" && !isArchived) return false;
    if (!matchesContractValidity(c, validityFilter)) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    const email = emailByClient.get(c.client_name.toLowerCase().trim());
    return c.client_name.toLowerCase().includes(s) ||
      c.contract_number?.toLowerCase().includes(s) ||
      c.contract_type?.toLowerCase().includes(s) ||
      c.responsible?.toLowerCase().includes(s) ||
      email?.includes(s);
  }).sort((first, second) => {
    return compareContractsBySort(first, second, contractSort);
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
    const daysLeft = getPaidUntilDaysLeft(paidUntil);
    return daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
  };

  const isPaidUntilExpired = (paidUntil: string | null) => {
    const daysLeft = getPaidUntilDaysLeft(paidUntil);
    return daysLeft !== null && daysLeft < 0;
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
  const handleValidityFilter = (v: ContractValidityFilter) => { setValidityFilter(v); setCurrentPage(1); };
  const handleContractSort = (field: ContractSortField) => {
    setContractSort((current) => getNextContractSort(current, field));
    setCurrentPage(1);
  };
  const handlePageSize = (v: number) => { setPageSize(v); setCurrentPage(1); };

  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderTable = (items: Contract[], isArchive: boolean) => (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search || validityFilter !== "all"
              ? "По выбранным условиям договоров нет"
              : isArchive
                ? "Архив пуст"
                : "Нет договоров"}
          </p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y">
              {items.map((c) => (
                <div key={c.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => onOpenClient?.(c.client_name)} className="font-medium text-left hover:text-primary hover:underline underline-offset-2 transition-colors text-sm">
                      {c.client_name}
                    </button>
                    <Badge
                      variant={statusColor(c.payment_status)}
                      className="shrink-0 text-xs cursor-pointer hover:opacity-80 transition-opacity select-none"
                      onClick={(e) => { e.stopPropagation(); togglePaymentStatus.mutate({ id: c.id, current: c.payment_status }); }}
                    >{c.payment_status || "—"}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {c.contract_number && (
                      <button
                        onClick={() => openDocs(c)}
                        className="font-mono hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer"
                      >№{c.contract_number}</button>
                    )}
                    {c.contract_date && <span>{new Date(c.contract_date).toLocaleDateString("ru-RU")}</span>}
                    <span className="font-medium text-foreground">{formatAmount(c.amount)}</span>
                    {c.contract_type && <span>{c.contract_type}</span>}
                    {(() => { const d = getAnniversaryDays(c.contract_date, c.contract_type); return d !== null ? (
                      <span className="flex items-center gap-1 text-orange-500 font-semibold">
                        <RefreshCw className="w-3 h-3" />Продление через {d} дн.
                      </span>
                    ) : null; })()}
                  </div>
                  <div className="text-xs">
                    <PaidUntilQuickEdit
                      contract={c}
                      mobile
                      isExpired={isPaidUntilExpired(c.paid_until)}
                      isSoon={isPaidUntilSoon(c.paid_until)}
                      onSave={(next) => updatePaidUntil.mutateAsync({ id: c.id, paidUntil: next })}
                    />
                  </div>
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
                        <DropdownMenuItem onClick={() => openDocs(c)}>
                          <FileText className="w-4 h-4 mr-2" /> Договор и счёт
                        </DropdownMenuItem>
                        {c.file_path && (
                          <DropdownMenuItem onClick={() => downloadFile(c.file_path!)}>
                            <Download className="w-4 h-4 mr-2" /> Скачать файл
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openResend(c)}>
                          <Send className="w-4 h-4 mr-2" /> Отправить повторно
                        </DropdownMenuItem>
                        {isPaid(c.payment_status) && !isArchive && (
                          <DropdownMenuItem onClick={() => createActAndSend(c)}>
                            <FileCheck className="w-4 h-4 mr-2" /> Сделать акт и отправить
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
                    <SortableTableHead field="client_name" label="Организация" sort={contractSort} onSort={handleContractSort} />
                    <SortableTableHead field="contract_number" label="№ договора" sort={contractSort} onSort={handleContractSort} />
                    <SortableTableHead field="contract_date" label="Дата" sort={contractSort} onSort={handleContractSort} />
                    <SortableTableHead field="payment_status" label="Оплата" sort={contractSort} onSort={handleContractSort} />
                    <SortableTableHead field="paid_until" label="Оплачено до" sort={contractSort} onSort={handleContractSort} />
                    <SortableTableHead field="amount" label="Сумма" sort={contractSort} onSort={handleContractSort} />
                    <SortableTableHead field="contract_type" label="Тип" sort={contractSort} onSort={handleContractSort} />
                    <SortableTableHead field="responsible" label="Ответственный" sort={contractSort} onSort={handleContractSort} />
                    <TableHead className="w-[80px] text-right sticky right-0 bg-background">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id}>
                       <TableCell className="font-medium">
                        <button onClick={() => onOpenClient?.(c.client_name)} className="hover:underline hover:text-primary text-left transition-colors cursor-pointer">
                          {c.client_name}
                        </button>
                      </TableCell>
                      <TableCell>
                        {c.contract_number ? (
                          <button onClick={() => openDocs(c)} className="font-mono hover:underline hover:text-primary transition-colors cursor-pointer">
                            {c.contract_number}
                          </button>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{c.contract_date ? new Date(c.contract_date).toLocaleDateString("ru-RU") : "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusColor(c.payment_status)}
                          className="cursor-pointer hover:opacity-80 transition-opacity select-none"
                          onClick={() => togglePaymentStatus.mutate({ id: c.id, current: c.payment_status })}
                        >{c.payment_status || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <PaidUntilQuickEdit
                          contract={c}
                          isExpired={isPaidUntilExpired(c.paid_until)}
                          isSoon={isPaidUntilSoon(c.paid_until)}
                          onSave={(next) => updatePaidUntil.mutateAsync({ id: c.id, paidUntil: next })}
                        />
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
                            <DropdownMenuItem onClick={() => openDocs(c)}>
                              <FileText className="w-4 h-4 mr-2" /> Договор и счёт
                            </DropdownMenuItem>
                            {c.file_path && (
                              <DropdownMenuItem onClick={() => downloadFile(c.file_path!)}>
                                <Download className="w-4 h-4 mr-2" /> Скачать файл
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openResend(c)}>
                              <Send className="w-4 h-4 mr-2" /> Отправить повторно
                            </DropdownMenuItem>
                            {isPaid(c.payment_status) && !isArchive && (
                              <DropdownMenuItem onClick={() => createActAndSend(c)}>
                                <FileCheck className="w-4 h-4 mr-2" /> Сделать акт и отправить
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input placeholder="Поиск по названию, номеру, email..." value={search} onChange={(e) => handleSearch(e.target.value)} className="flex-1" />
        <Select value={validityFilter} onValueChange={(value) => handleValidityFilter(value as ContractValidityFilter)}>
          <SelectTrigger className="w-full sm:w-[220px]" aria-label="Фильтр по сроку действия">
            <span className="flex min-w-0 items-center gap-2">
              <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Все сроки" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все сроки</SelectItem>
            <SelectItem value="expired">Просрочены</SelectItem>
            <SelectItem value="within-30">До 30 дней</SelectItem>
            <SelectItem value="within-90">31–90 дней</SelectItem>
            <SelectItem value="over-90">Более 90 дней</SelectItem>
            <SelectItem value="no-term">Без срока</SelectItem>
            <SelectItem value="one-time">Единоразовые</SelectItem>
          </SelectContent>
        </Select>
        <Button className="sm:shrink-0" onClick={() => { resetForm(); setContractNumber(getNextContractNumber()); setShowForm(true); }}>
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
            <OrgRequisitesBlock
              clientName={clientName}
              inn={inn}
              defaultOpen={!!editingId}
              onInnDetected={(detected) => { if (!inn) setInn(detected); }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Дата</Label><Input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Статус оплаты</Label><Input value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} placeholder="оплачено / не оплачено" /></div>
              <div className="space-y-2">
                <Label>Оплачено до</Label>
                <Input type="date" value={paidUntil} onChange={(e) => setPaidUntil(e.target.value)} disabled={isOneTime} className={isOneTime ? "opacity-50" : ""} />
                {!isOneTime && contractDate && !paidUntil && (
                  <p className="text-[11px] text-muted-foreground">Авто: {(() => { const d = new Date(contractDate); d.setFullYear(d.getFullYear() + 1); return d.toLocaleDateString("ru-RU"); })()}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Тип договора</Label>
              <Input
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                placeholder="фрдо, разработка..."
                list="contract-type-options"
              />
              <datalist id="contract-type-options">
                <option value="фрдо" />
                <option value="разработка" />
                <option value="лицензирование" />
                <option value="НМО" />
                <option value="реклама" />
                <option value="сопровождение" />
              </datalist>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="is-one-time" checked={isOneTime} onCheckedChange={(v) => { setIsOneTime(!!v); if (v) setPaidUntil(""); }} />
              <Label htmlFor="is-one-time" className="text-sm cursor-pointer">Единоразово (без периода оплаты)</Label>
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
          <TabsTrigger value="development" className="gap-2">
            <FileCheck className="w-4 h-4" />Договор развития
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {renderTable(paginatedItems, false)}
        </TabsContent>
        <TabsContent value="archive" className="mt-4">
          {renderTable(paginatedItems, true)}
        </TabsContent>
        <TabsContent value="development" className="mt-4">
          <DevelopmentContractPanel />
        </TabsContent>
      </Tabs>

      <Dialog open={resendOpen} onOpenChange={setResendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправить договор повторно</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {resendContract?.client_name}
              {resendContract?.contract_number ? ` · №${resendContract.contract_number}` : ""}
            </div>
            <div className="space-y-2">
              <Label>Email клиента</Label>
              <Input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="client@example.com"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="resend-invoice"
                checked={resendIncludeInvoice}
                onCheckedChange={(v) => setResendIncludeInvoice(!!v)}
              />
              <Label htmlFor="resend-invoice" className="text-sm cursor-pointer">
                Приложить счёт (если есть)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Файлы прикрепляются к письму. Если PDF уже сохранён в файлах договора — берём его напрямую (быстро); иначе PDF генерируется из последнего документа в Конструкторе (может занять до 10–20 секунд).
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResendOpen(false)} disabled={resendSending}>
              Отмена
            </Button>
            <Button onClick={doResend} disabled={resendSending || !resendEmail.trim()}>
              {resendSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Документы договора</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {docsContract?.client_name}
              {docsContract?.contract_number ? ` · №${docsContract.contract_number}` : ""}
            </div>

            {docsLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : docsList.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground text-center">
                Документы в Конструкторе ещё не созданы.
              </div>
            ) : (
              <div className="space-y-2">
                {docsList.map((d) => {
                  const label = d.doc_type === "contract" ? "Договор" : d.doc_type === "invoice" ? "Счёт" : d.doc_type === "act" ? "Акт" : d.doc_type;
                  return (
                    <div key={d.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{label} №{d.doc_number}</div>
                        <div className="text-xs text-muted-foreground">{d.doc_date ? new Date(d.doc_date).toLocaleDateString("ru-RU") : ""}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openPreview(d)}>
                          <FileText className="w-3.5 h-3.5 mr-1.5" /> Открыть
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => editDoc(d.id)} title="Редактировать в конструкторе">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => docsContract && createDocFor(docsContract, "contract")}>
                <Plus className="w-4 h-4 mr-1.5" /> Новый договор
              </Button>
              <Button variant="outline" size="sm" onClick={() => docsContract && createDocFor(docsContract, "invoice")}>
                <Plus className="w-4 h-4 mr-1.5" /> Новый счёт
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDocsOpen(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-[60vh] bg-white rounded-md overflow-hidden">
            {previewLoading ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : previewHtml ? (
              <iframe
                title={previewTitle}
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                style={{ minHeight: "60vh" }}
              />
            ) : (
              <div className="flex justify-center items-center h-full text-muted-foreground text-sm">Пусто</div>
            )}
          </div>
          <DialogFooter className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Закрыть</Button>
            {previewDocId && (
              <Button variant="outline" onClick={() => { editDoc(previewDocId); setPreviewOpen(false); }}>
                <Pencil className="w-4 h-4 mr-1.5" /> Редактировать
              </Button>
            )}
            <Button variant="outline" onClick={downloadPreviewPdf} disabled={previewDownloading || !previewHtml}>
              {previewDownloading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
              Скачать PDF
            </Button>
            <Button onClick={sendPreviewByEmail} disabled={!docsContract}>
              <Send className="w-4 h-4 mr-1.5" /> Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsTab;
