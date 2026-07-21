import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Loader2, Printer, Search, History, Eye, Download, X, Mail, Send, Pencil, RefreshCw, Package, ChevronDown, FileSignature } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
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
import { generateFrdoContractHtml } from "@/lib/frdo-contract-template";
import { generateNmoContractHtml } from "@/lib/nmo-contract-template";
import { generateReconciliationHtml, type ReconciliationRow } from "@/lib/reconciliation-template";
import { preloadDocumentImages } from "@/lib/document-images";
import { generatePdfBase64 as renderDocumentPdfBase64 } from "@/lib/document-pdf";
import SignPdfCard from "./SignPdfCard";
import { renderTzHtml } from "@/lib/tz/render";
import { mergeHtmlsToPdf } from "@/lib/tz/bundle";

type DocType = "contract" | "invoice" | "act" | "reconciliation";
type ContractSubType = "site" | "frdo" | "nmo" | "other";

const DOC_LABELS: Record<DocType, string> = {
  contract: "Договор",
  invoice: "Счёт на оплату",
  act: "Акт выполненных работ",
  reconciliation: "Акт сверки",
};

const CONTRACT_TYPE_LABELS: Record<ContractSubType, string> = {
  site: "Сайт",
  frdo: "ФРДО",
  nmo: "НМО",
  other: "Прочее",
};

type DateParts = { day: number; month: number; year: number };

const parseDateParts = (value?: string | null): DateParts | null => {
  if (!value) return null;
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  const dmy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);

  let day: number;
  let month: number;
  let year: number;

  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (dmy) {
    day = Number(dmy[1]);
    month = Number(dmy[2]);
    year = Number(dmy[3]);
    if (year < 100) year += 2000;
  } else {
    return null;
  }

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;

  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }

  return { day, month, year };
};

const formatRuDateNumeric = (value?: string | null) => {
  const parsed = parseDateParts(value);
  if (!parsed) return null;
  return `${String(parsed.day).padStart(2, "0")}.${String(parsed.month).padStart(2, "0")}.${parsed.year}`;
};

const formatRuDateLong = (value: string) => {
  const parsed = parseDateParts(value);
  if (!parsed) return "";
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

const datePartsToSerial = (value?: string | null) => {
  const parsed = parseDateParts(value);
  return parsed ? parsed.year * 10000 + parsed.month * 100 + parsed.day : null;
};

const addYearsToRuDate = (value: string, years: number) => {
  const parsed = parseDateParts(value);
  if (!parsed) return null;
  return formatRuDateNumeric(`${parsed.year + years}-${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`);
};

const addDaysToIsoDate = (value: string, days: number) => {
  const parsed = parseDateParts(value);
  if (!parsed) return null;
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  date.setUTCDate(date.getUTCDate() + days);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

const extractRuPeriod = (deadline?: string | null) => {
  if (!deadline) return null;
  const matches = deadline.match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/g) || [];
  if (matches.length < 2) return null;
  const from = formatRuDateNumeric(matches[0]);
  const to = formatRuDateNumeric(matches[1]);
  return from && to ? { from, to } : null;
};

const syncFrdoServicesWithDeadline = (items: ServiceItem[], deadline?: string | null): ServiceItem[] => {
  const period = extractRuPeriod(deadline);
  if (!period) return items;

  let changed = false;
  const synced = items.map((service) => {
    const shouldSync = /ФИС\s*ФРДО/i.test(service.name) && (/за\s+период/i.test(service.name) || /информационно-консультацион/i.test(service.name));
    if (!shouldSync) return service;

    const nextName = /за\s+период\s+с\s+\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s+по\s+\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/i.test(service.name)
      ? service.name.replace(/за\s+период\s+с\s+\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\s+по\s+\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/i, `за период с ${period.from} по ${period.to}`)
      : `${service.name.replace(/\s+$/g, "")} за период с ${period.from} по ${period.to}`;

    if (nextName === service.name) return service;
    changed = true;
    return { ...service, name: nextName };
  });

  return changed ? synced : items;
};

const DocumentsTab = ({ initialContractId, initialDocType, initialClientName, initialAutoSend, initialEditDocId, onMounted, forceDocType, hideTypeSelector }: { initialContractId?: string; initialDocType?: string; initialClientName?: string; initialAutoSend?: boolean; initialEditDocId?: string; onMounted?: () => void; forceDocType?: DocType; hideTypeSelector?: boolean }) => {
  const queryClient = useQueryClient();
  const { settings, isLoading: settingsLoading } = useSiteSettings();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewInvoiceHtml, setPreviewInvoiceHtml] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<string>("contract");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("24@24zxc.ru");
  const [emailSending, setEmailSending] = useState(false);
  const [telegramSending, setTelegramSending] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ step: '', percent: 0 });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const docImagesRef = useRef<{ signature: string; stamp: string } | null>(null);

  // Preload signature & stamp as base64 data URIs
  useEffect(() => {
    preloadDocumentImages().then(imgs => { docImagesRef.current = imgs; }).catch(console.error);
  }, []);

  // Replace image URLs with embedded base64 data URIs
  const embedDocImages = useCallback((html: string): string => {
    const imgs = docImagesRef.current;
    if (!imgs) return html;
    return html
      .replace(new RegExp(`${window.location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/images/signature\\.png`, 'g'), imgs.signature)
      .replace(new RegExp(`${window.location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/images/stamp\\.png`, 'g'), imgs.stamp);
  }, []);

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
        .select("id, contract_number, contract_date, client_name, amount, contract_type")
        .order("contract_number", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [docType, setDocType] = useState<DocType>(forceDocType || "contract");
  const [pendingAutoSend, setPendingAutoSend] = useState(false);
  const [contractSubType, setContractSubType] = useState<ContractSubType>("site");
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Year derived from docDate — used for auto-numbering and reset every Jan 1
  const docYear = useMemo(() => {
    const parsed = parseDateParts(docDate);
    return parsed?.year || new Date().getFullYear();
  }, [docDate]);

  // Replace "/" with "-" so doc_number can be safely used in filenames / storage paths
  const safeFilename = useCallback((num: string) => num.replace(/\//g, "-"), []);

  const parseSequentialNumber = useCallback((value: string | null | undefined, targetYear: number) => {
    if (!value) return null;
    const match = String(value).trim().match(/^(\d+)[/-](\d{4})$/);
    if (!match || match[2] !== String(targetYear)) return null;
    const parsed = parseInt(match[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, []);

  // Auto-generate next doc number for current year. Format: "NNN/YYYY".
  // For contracts we continue the sequence from both generated documents and real contract records,
  // so older entries like "018-2026" are also respected.
  const { data: lastDocNumbers } = useQuery({
    queryKey: ["last-doc-numbers", docYear],
    queryFn: async () => {
      const result: Record<string, string> = {};

      const [{ data: generatedDocs, error: generatedError }, { data: contractRows, error: contractsError }] = await Promise.all([
        supabase.from("generated_documents" as any).select("doc_type, doc_number"),
        supabase.from("contracts").select("contract_number"),
      ]);

      if (generatedError) throw generatedError;
      if (contractsError) throw contractsError;

      for (const type of ["contract", "invoice", "act", "reconciliation"] as DocType[]) {
        let maxNum = 0;

        for (const row of (generatedDocs as any[]) || []) {
          if (row.doc_type !== type) continue;
          const parsed = parseSequentialNumber(row.doc_number, docYear);
          if (parsed !== null && parsed > maxNum) maxNum = parsed;
        }

        if (type === "contract") {
          for (const row of contractRows || []) {
            const parsed = parseSequentialNumber(row.contract_number, docYear);
            if (parsed !== null && parsed > maxNum) maxNum = parsed;
          }
        }

        const next = String(maxNum + 1).padStart(3, "0");
        result[type] = `${next}/${docYear}`;
      }

      return result;
    },
  });

  useEffect(() => {
    if (lastDocNumbers && !docNumber) {
      setDocNumber(lastDocNumbers[docType] || `001/${docYear}`);
    }
  }, [lastDocNumbers, docType, docYear, docNumber]);

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

  // reconciliation-specific
  const [periodFrom, setPeriodFrom] = useState(() => {
    const d = new Date();
    d.setMonth(0, 1);
    return d.toISOString().slice(0, 10);
  });
  const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [reconRows, setReconRows] = useState<ReconciliationRow[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [reconLoading, setReconLoading] = useState(false);

  // discount (invoice-specific)
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountDeadline, setDiscountDeadline] = useState("");

  const [lookingUp, setLookingUp] = useState(false);

  // Deferred override applied AFTER contractSubType-defaults effect runs
  const prevContractPrefillRef = useRef<{ deadline?: string; subject?: string; paymentTerms?: string } | null>(null);

  // Helper: fill client requisites from clients array by client_name.
  // Falls back to a direct DB lookup when the clients cache doesn't have a match
  // (e.g. when this runs during initial mount before the query resolves, or
  // when the stored client_name has minor whitespace/quote differences).
  const fillClientFromName = useCallback(async (name: string) => {
    const norm = (s: string) => (s || "").replace(/[«»"'`\s]+/g, "").toLowerCase();
    const target = norm(name);
    let client: any = clients.find(c => c.name === name)
      || clients.find(c => norm(c.name) === target);
    if (!client && name?.trim()) {
      const { data } = await supabase
        .from("clients")
        .select("name,inn,kpp,ogrn,legal_address,director_name,director_post")
        .ilike("name", name.trim())
        .limit(1)
        .maybeSingle();
      if (data) client = data;
      if (!client) {
        const { data: all } = await supabase
          .from("clients")
          .select("name,inn,kpp,ogrn,legal_address,director_name,director_post");
        client = (all || []).find((c: any) => norm(c.name) === target);
      }
    }
    if (client) {
      setClientInn(client.inn || "");
      setClientKpp(client.kpp || "");
      setClientOgrn(client.ogrn || "");
      setClientAddress(client.legal_address || "");
      setClientDirectorName(client.director_name || "");
      setClientDirectorPost(client.director_post || "Директор");
    }
    return client;
  }, [clients]);

  // Helper: fill services from a contract's generated document or amount
  const fillServicesFromContract = useCallback(async (contractId: string, contract: { contract_number?: string | null; amount?: number | null }) => {
    // Try to find existing generated contract document for this contract_id
    const { data: existingDocs } = await supabase
      .from("generated_documents")
      .select("services")
      .eq("contract_id", contractId)
      .eq("doc_type", "contract")
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingDocs && existingDocs.length > 0) {
      try {
        const parsed = typeof existingDocs[0].services === 'string'
          ? JSON.parse(existingDocs[0].services as string)
          : existingDocs[0].services;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setServices(parsed);
          return;
        }
      } catch { /* fallthrough */ }
    }

    // Fallback: use contract amount
    if (contract.amount) {
      setServices([{
        name: `Услуги по договору №${contract.contract_number || ''}`,
        qty: 1,
        price: Number(contract.amount),
      }]);
    }
  }, []);

  // Reconciliation: load contracts+payments from CRM for selected client and period
  const loadReconciliationFromCRM = useCallback(async () => {
    if (!clientName.trim()) {
      toast.error("Сначала выберите клиента");
      return;
    }
    setReconLoading(true);
    try {
      // Normalize client name: drop legal form prefixes, quotes, punctuation, case
      const normalize = (s: string) => {
        let r = (s || "").toLowerCase().replace(/[«»"'`„“”]/g, " ");
        // Remove org-form prefixes (Cyrillic \b doesn't work in JS regex, so use space/start boundaries)
        r = r.replace(/(^|\s)(ооо|оао|зао|пао|ао|ип|нко|ану|фгуп|муп|гуп|нп|ано|чу|чоу)\.?(\s|$)/g, " ");
        r = r.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
        return r;
      };
      const targetKey = normalize(clientName);
      const matches = (n?: string | null) => !!n && normalize(n) === targetKey;

      const { data: allContracts, error } = await supabase
        .from("contracts")
        .select("contract_number, contract_date, amount, payment_status, paid_until, client_name")
        .order("contract_date", { ascending: true });
      if (error) throw error;
      const clientContracts = (allContracts || []).filter(c => matches(c.client_name));

      const { data: allActs } = await supabase
        .from("generated_documents")
        .select("doc_number, doc_date, total_amount, doc_type, client_name")
        .eq("doc_type", "act")
        .order("doc_date", { ascending: true });
      const acts = (allActs || []).filter(a => matches(a.client_name));

      if (!acts.length && !clientContracts.length) {
        toast.warning("По этому клиенту не найдено ни договоров, ни актов");
      }

      const fromTs = datePartsToSerial(periodFrom);
      const toTs = datePartsToSerial(periodTo);
      const inPeriod = (dStr?: string | null) => {
        if (!dStr || fromTs === null || toTs === null) return false;
        const t = datePartsToSerial(dStr);
        return t !== null && t >= fromTs && t <= toTs;
      };

      const rows: ReconciliationRow[] = [];

      // Дебет — выставленные акты
      for (const a of (acts || [])) {
        if (inPeriod(a.doc_date)) {
          rows.push({
            date: a.doc_date,
            doc: `Акт №${a.doc_number}`,
            debit: Number(a.total_amount) || 0,
            credit: 0,
          });
        }
      }

      // Кредит — отметки об оплате (payment_status = 'оплачено')
      for (const c of (clientContracts || [])) {
        if (c.payment_status === "оплачено" && inPeriod(c.contract_date)) {
          rows.push({
            date: c.contract_date as string,
            doc: `Оплата по договору №${c.contract_number || ""}`,
            debit: 0,
            credit: Number(c.amount) || 0,
          });
        }
      }

      // Если актов вообще нет — выставим начисления по самим договорам
      if (!rows.some(r => r.debit > 0)) {
        for (const c of (clientContracts || [])) {
          if (inPeriod(c.contract_date)) {
            rows.push({
              date: c.contract_date as string,
              doc: `Договор №${c.contract_number || ""}`,
              debit: Number(c.amount) || 0,
              credit: 0,
            });
          }
        }
      }

      rows.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      setReconRows(rows);
      toast.success(`Загружено ${rows.length} операций`);
    } catch (e: any) {
      console.error("[Recon] load failed:", e);
      toast.error(e.message || "Не удалось загрузить операции");
    } finally {
      setReconLoading(false);
    }
  }, [clientName, periodFrom, periodTo]);

  const addReconRow = () => setReconRows(prev => [...prev, { date: new Date().toISOString().slice(0, 10), doc: "", debit: 0, credit: 0 }]);
  const updateReconRow = (i: number, field: keyof ReconciliationRow, value: string | number) => {
    setReconRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } as ReconciliationRow : r));
  };
  const removeReconRow = (i: number) => setReconRows(prev => prev.filter((_, idx) => idx !== i));

  // Pre-fill from planner task
  useEffect(() => {
    if (initialContractId && contracts.length > 0 && clients.length > 0) {
      const contract = contracts.find(c => c.id === initialContractId);
      if (contract) {
        setLinkedContractId(contract.id);
        setClientName(contract.client_name || "");
        fillClientFromName(contract.client_name || "");
        fillServicesFromContract(contract.id, contract);
      }
      if (initialDocType && ["contract", "invoice", "act"].includes(initialDocType)) {
        setDocType(initialDocType as DocType);
        if (lastDocNumbers) {
          setDocNumber(lastDocNumbers[initialDocType] || `001/${docYear}`);
        }
      }
      if (initialAutoSend) setPendingAutoSend(true);
      onMounted?.();
    }
  }, [initialContractId, contracts, clients]);

  // Pre-fill from client card navigation
  useEffect(() => {
    if (initialClientName && !initialContractId && clients.length > 0) {
      setClientName(initialClientName);
      fillClientFromName(initialClientName);
      if (initialDocType && ["contract", "invoice", "act"].includes(initialDocType)) {
        setDocType(initialDocType as DocType);
        if (lastDocNumbers) {
          setDocNumber(lastDocNumbers[initialDocType] || `001/${docYear}`);
        }
      }
      // For act: auto-find latest contract and fill services
      if (initialDocType === "act" && contracts.length > 0) {
        const clientContracts = contracts.filter(c => c.client_name === initialClientName);
        if (clientContracts.length > 0) {
          const latest = clientContracts.sort((a, b) => (b.contract_date || "").localeCompare(a.contract_date || ""))[0];
          setLinkedContractId(latest.id);
          fillServicesFromContract(latest.id, latest);
        }
      }
      // For new contract: pull "Период оказания услуг" (deadline) from the
      // most recent generated contract document for this client.
      if (initialDocType === "contract") {
        (async () => {
          // 1) Try to build deadline from the latest actual contract row
          //    (matches what the user sees in the client card).
          const { data: lastContracts } = await supabase
            .from("contracts")
            .select("contract_date, paid_until, contract_type")
            .eq("client_name", initialClientName)
            .order("contract_date", { ascending: false })
            .limit(1);
          const lc = lastContracts?.[0];
          let contractDeadline: string | undefined;
          if (lc?.contract_date) {
            const from = formatRuDateNumeric(lc.contract_date);
            let to = formatRuDateNumeric(lc.paid_until);
            if (!to && from) {
              to = addYearsToRuDate(from, 1);
            }
            if (from && to) contractDeadline = `${from} по ${to}`;
          }

          // 2) Also read metadata for subtype/subject/paymentTerms fallback.
          const { data } = await supabase
            .from("generated_documents")
            .select("metadata")
            .eq("client_name", initialClientName)
            .eq("doc_type", "contract")
            .order("created_at", { ascending: false })
            .limit(1);
          const meta = data?.[0]?.metadata;
          const parsed = meta ? (typeof meta === "string" ? JSON.parse(meta) : meta) : null;
          const prevDeadline = contractDeadline || (parsed?.deadline as string | undefined);
          const prevSubType = (parsed?.contractSubType as ContractSubType | undefined)
            || (lc?.contract_type?.toLowerCase() === "фрдо" ? "frdo" as ContractSubType : undefined);
          if (!prevDeadline && !prevSubType) return;
          prevContractPrefillRef.current = { deadline: prevDeadline };
          if (prevSubType && prevSubType !== contractSubType) {
            setContractSubType(prevSubType);
          } else if (prevDeadline) {
            // Same subtype — apply immediately (subtype effect won't fire)
            setDeadline(prevDeadline);
            prevContractPrefillRef.current = null;
          }
        })();
      }
      onMounted?.();
    }
  }, [initialClientName, clients]);

  // Auto-flow: when "Сделать акт и отправить" is triggered, generate doc then open email dialog
  useEffect(() => {
    if (!pendingAutoSend) return;
    if (docType !== "act") return;
    if (!clientName) return;
    const hasService = services.some(s => s.name.trim());
    if (!hasService) return;
    // Step 1: generate preview if not already
    if (!previewHtml) {
      generate("act");
      return;
    }
    // Step 2: open email dialog with prefilled email
    const client = clients.find(c => c.name === clientName);
    setEmailTo(client?.email || "");
    setEmailDialogOpen(true);
    setPendingAutoSend(false);
  }, [pendingAutoSend, docType, clientName, services, previewHtml, clients]);

  // Auto-fill template data when contract subtype changes
  useEffect(() => {
    if (contractSubType === "nmo") {
      setSubject("Разработка документов для непрерывного медицинского образования (НМО)");
      setDeadline("с момента подписания договора по 31.12." + new Date().getFullYear());
      setPaymentTerms("авансом в размере 100%");
      setServices([
        { name: "Разработка комплекта документов для НМО (образовательные программы, учебные планы, методические материалы)", qty: 1, price: 35000 },
        { name: "Сопровождение аккредитации на портале НМО", qty: 1, price: 15000 },
        { name: "Синхронизация данных с порталом НМО", qty: 1, price: 10000 },
      ]);
    } else if (contractSubType === "frdo") {
      setSubject("Оказание услуг по внесению сведений в ФИС ФРДО");
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      const dateFrom = `${dd}.${mm}.${yyyy}`;
      const dateTo = `${dd}.${mm}.${yyyy + 1}`;
      setDeadline(`${dateFrom} по ${dateTo}`);
      setPaymentTerms("авансом в размере 100%");
      setServices([
        { name: "Выгрузка данных в ФИС ФРДО (разовая)", qty: 1, price: 3500 },
        {
          name: `Услуги по выгрузке данных заказчика о выданных документах об образовании и (или) о квалификации на портал Федеральной информационной системы «Федеральный реестр сведений о документах об образовании и (или) о квалификации, документах об обучении» (ФИС ФРДО) и информационно-консультационная поддержка Заказчика по работе в ФИС ФРДО за период с ${dateFrom} по ${dateTo}`,
          qty: 1,
          price: 24000,
        },
      ]);
    } else if (contractSubType === "site") {
      setSubject("Разработка веб-сайта");
      setDeadline("30 рабочих дней");
      setPaymentTerms("100% предоплата");
      setServices([
        {
          name: "Разработка веб-сайта в соответствии с требованиям Приказа Рособрнадзора от 04.08.2023 № 1493 (с изменениями)",
          qty: 1,
          price: 0,
        },
      ]);
    } else {
      setSubject("");
      setDeadline("");
      setPaymentTerms("");
      setServices([{ name: "", qty: 1, price: 0 }]);
    }
  }, [contractSubType]);

  // Apply deferred prefill (from previous contract) AFTER the subtype-defaults
  // effect above has populated deadline/subject/paymentTerms.
  useEffect(() => {
    const p = prevContractPrefillRef.current;
    if (!p) return;
    if (p.deadline) setDeadline(p.deadline);
    if (p.subject) setSubject(p.subject);
    if (p.paymentTerms) setPaymentTerms(p.paymentTerms);
    // Sync FRDO service description date range with the applied deadline
    if (p.deadline && contractSubType === "frdo") {
      setServices(prev => syncFrdoServicesWithDeadline(prev, p.deadline));
    }
    prevContractPrefillRef.current = null;
  }, [contractSubType]);

  useEffect(() => {
    if (docType !== "contract" || contractSubType !== "frdo") return;
    setServices(prev => syncFrdoServicesWithDeadline(prev, deadline));
  }, [deadline, docType, contractSubType]);

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
    return formatRuDateLong(iso);
  };

  const generate = async (typeOverride?: DocType) => {
    const effectiveType: DocType = typeOverride || docType;
    // When user generates a different doc type via the secondary buttons,
    // auto-pick the next free number for that type and switch state so that
    // downstream save/send uses the right values.
    let effectiveNumber = docNumber;
    if (typeOverride && typeOverride !== docType) {
      const nextNumber = (lastDocNumbers && lastDocNumbers[typeOverride]) || `001/${docYear}`;
      effectiveNumber = nextNumber;
      setDocType(typeOverride);
      setDocNumber(nextNumber);
    }
    console.log("[DOC] generate called", { effectiveType, effectiveNumber, clientName, services });
    if (!effectiveNumber.trim()) return toast.error("Укажите номер документа");
    if (!clientName.trim()) return toast.error("Укажите клиента");
    if (effectiveType !== "reconciliation" && services.every(s => !s.name.trim())) {
      return toast.error("Добавьте хотя бы одну услугу");
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
      name: clientName,
      inn: clientInn,
      kpp: clientKpp,
      ogrn: clientOgrn,
      address: clientAddress,
      director_name: clientDirectorName,
      director_post: clientDirectorPost,
    };

    const linkedContract = contracts.find(c => c.id === linkedContractId);

    const effectiveServices = contractSubType === "frdo"
      ? syncFrdoServicesWithDeadline(services, deadline)
      : services;
    if (effectiveServices !== services) {
      setServices(effectiveServices);
    }

    const docData: DocumentData = {
      type: effectiveType,
      number: effectiveNumber,
      date: formatDate(docDate),
      company,
      client,
      services: effectiveServices.filter(s => s.name.trim()),
      subject,
      deadline,
      paymentTerms,
      contractNumber: linkedContract?.contract_number || "",
      contractDate: linkedContract?.contract_date ? formatDate(linkedContract.contract_date) : "",
      appendixRef: (linkedContract as any)?.appendix_ref || undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      discountDeadline: discountDeadline ? formatDate(discountDeadline) : undefined,
    };

    let html = "";
    try {
      switch (effectiveType) {
        case "contract":
          if (contractSubType === "frdo") {
            html = generateFrdoContractHtml(docData);
          } else if (contractSubType === "nmo") {
            html = generateNmoContractHtml(docData);
          } else {
            html = generateContractHtml(docData);
          }
          break;
        case "invoice": html = generateInvoiceHtml(docData); break;
        case "act": html = generateActHtml(docData); break;
        case "reconciliation":
          html = generateReconciliationHtml({
            number: effectiveNumber,
            periodFrom,
            periodTo,
            company,
            client,
            rows: reconRows,
            openingBalance,
          });
          break;
      }
    } catch (templateErr) {
      console.error("[DOC] Template generation error:", templateErr);
      toast.error(`Ошибка генерации шаблона: ${templateErr instanceof Error ? templateErr.message : String(templateErr)}`);
      return;
    }

    // Generate invoice HTML upfront if contract type
    let invoiceHtml: string | null = null;
    if (effectiveType === "contract") {
      try {
        const invoiceDocData = { ...docData, type: "invoice" as const };
        invoiceHtml = generateInvoiceHtml(invoiceDocData);
        console.log("[DOC] Invoice HTML generated alongside contract");
      } catch (invoiceErr) {
        console.error("[DOC] Invoice template error:", invoiceErr);
      }
    }

    // Show preview immediately (both tabs)
    setPreviewHtml(embedDocImages(html));
    setPreviewInvoiceHtml(invoiceHtml ? embedDocImages(invoiceHtml) : null);
    setPreviewTab("contract");

    // Auto-save/update client card with entered requisites (so they persist on next open)
    if (clientName.trim()) {
      try {
        const existingClient = clients.find(c => c.name === clientName);
        const payload: Record<string, any> = {
          name: clientName,
          inn: clientInn || existingClient?.inn || null,
          kpp: clientKpp || existingClient?.kpp || null,
          ogrn: clientOgrn || existingClient?.ogrn || null,
          legal_address: clientAddress || existingClient?.legal_address || null,
          director_name: clientDirectorName || existingClient?.director_name || null,
          director_post: clientDirectorPost || existingClient?.director_post || null,
        };
        if (existingClient) {
          await supabase.from("clients").update(payload).eq("id", existingClient.id);
        } else {
          await supabase.from("clients").insert(payload as any);
        }
        queryClient.invalidateQueries({ queryKey: ["doc-clients"] });
        queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
        queryClient.invalidateQueries({ queryKey: ["planner-clients"] });
      } catch (e) {
        console.error("[DOC] Failed to sync client card on generate:", e);
      }
    }

    toast.success("Документ сформирован, реквизиты сохранены в карточке клиента.");
  };

  // Save document to DB with upsert logic (called on send)
  const saveDocumentToDB = async (html: string, invoiceHtml: string | null) => {
    let targetContractId = linkedContractId || null;
    const servicesForSave = contractSubType === "frdo"
      ? syncFrdoServicesWithDeadline(services, deadline)
      : services;
    const filteredServices = docType === "reconciliation"
      ? (reconRows as any[])
      : servicesForSave.filter(s => s.name.trim());
    const reconTotal = reconRows.reduce((s, r) => s + (Number(r.debit) || 0) - (Number(r.credit) || 0), 0);

    // Step 1: Upsert main document (check by doc_type + doc_number)
    console.log("[DOC] Step 1: Upsert document...");
    const { data: existing } = await supabase
      .from("generated_documents")
      .select("id")
      .eq("doc_type", docType)
      .eq("doc_number", docNumber)
      .maybeSingle();

    const docPayload = {
      doc_type: docType,
      doc_number: docNumber,
      doc_date: docDate,
      client_name: clientName,
      client_inn: clientInn || null,
      contract_id: targetContractId,
      total_amount: docType === "reconciliation" ? Math.abs(reconTotal) : total,
      services: JSON.stringify(filteredServices),
      html_content: html,
      metadata: JSON.stringify({
        contractSubType, subject, deadline, paymentTerms,
        discountAmount, discountDeadline,
        clientKpp: clientKpp, clientOgrn: clientOgrn, clientAddress: clientAddress,
        clientDirectorName, clientDirectorPost,
        periodFrom: docType === "reconciliation" ? periodFrom : undefined,
        periodTo: docType === "reconciliation" ? periodTo : undefined,
        openingBalance: docType === "reconciliation" ? openingBalance : undefined,
      }),
    };

    if (existing) {
      const { error: updateError } = await supabase.from("generated_documents").update(docPayload).eq("id", existing.id);
      if (updateError) {
        console.error("[DOC] Update FAILED:", updateError);
        toast.error(`Ошибка обновления документа: ${updateError.message}`);
        return null;
      }
      console.log("[DOC] Step 1 OK — updated existing", existing.id);
    } else {
      const { error: insertError } = await supabase.from("generated_documents").insert(docPayload);
      if (insertError) {
        console.error("[DOC] Insert FAILED:", insertError);
        toast.error(`Ошибка сохранения документа: ${insertError.message}`);
        return null;
      }
      console.log("[DOC] Step 1 OK — inserted new");
    }
    queryClient.invalidateQueries({ queryKey: ["generated-documents"] });

    // Parse service deadline from "Период оказания услуг" (used for both clients.service_deadline and contracts.paid_until)
    let parsedServiceDeadline: string | null = null;
    if (deadline) {
      const poMatch = deadline.match(/по\s+(\d{2})\.(\d{2})\.(\d{4})/);
      if (poMatch) {
        parsedServiceDeadline = `${poMatch[3]}-${poMatch[2]}-${poMatch[1]}`;
      } else {
        const singleMatch = deadline.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        if (singleMatch) {
          parsedServiceDeadline = `${singleMatch[3]}-${singleMatch[2]}-${singleMatch[1]}`;
        } else {
          const daysMatch = deadline.match(/(\d+)\s*(рабоч|календар|дн)/i);
          if (daysMatch && docDate) {
            const days = parseInt(daysMatch[1]);
            parsedServiceDeadline = addDaysToIsoDate(docDate, days);
          }
        }
      }
    }

    // Step 2: Auto-create contract record (or update paid_until on existing)
    if (docType === "contract" && !linkedContractId) {
      console.log("[DOC] Step 2: Auto-creating contract...");
      // docNumber already includes year suffix (e.g. "001/2026") — use as-is
      const contractNumber = docNumber;
      const { data: newContract, error: contractError } = await supabase.from("contracts").insert({
        client_name: clientName,
        contract_number: contractNumber,
        contract_date: docDate,
        amount: total || null,
        contract_type: CONTRACT_TYPE_LABELS[contractSubType] || null,
        payment_status: "не оплачено",
        paid_until: parsedServiceDeadline,
      }).select("id").single();
      if (contractError) {
        console.error("[DOC] Step 2 FAILED:", contractError);
      } else {
        console.log("[DOC] Step 2 OK, contract id:", newContract.id, "paid_until:", parsedServiceDeadline);
        targetContractId = newContract.id;
        setLinkedContractId(newContract.id);
        queryClient.invalidateQueries({ queryKey: ["doc-contracts"] });
        queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      }
    } else if (docType === "contract" && linkedContractId && parsedServiceDeadline) {
      // Sync paid_until on already linked contract
      const { error: updErr } = await supabase
        .from("contracts")
        .update({ paid_until: parsedServiceDeadline })
        .eq("id", linkedContractId);
      if (updErr) console.error("[DOC] Failed to sync paid_until on linked contract:", updErr);
      else {
        console.log("[DOC] Synced paid_until on contract", linkedContractId, "→", parsedServiceDeadline);
        queryClient.invalidateQueries({ queryKey: ["doc-contracts"] });
        queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      }
    }

    // Step 2.5: Auto-create or update client (+ service_deadline)
    const existingClient = clients.find(c => c.name === clientName);

    if (clientName.trim()) {
      const clientData: Record<string, any> = {
        name: clientName,
        inn: clientInn || null,
        kpp: clientKpp || null,
        ogrn: clientOgrn || null,
        legal_address: clientAddress || null,
        director_name: clientDirectorName || null,
        director_post: clientDirectorPost || null,
      };
      if (parsedServiceDeadline) {
        clientData.service_deadline = parsedServiceDeadline;
      }
      if (!existingClient) {
        const { error: clientError } = await supabase.from("clients").insert(clientData as any);
        if (!clientError) console.log("[DOC] Client auto-created:", clientName);
      } else {
        const updateData: Record<string, any> = {
          inn: clientInn || existingClient.inn || null,
          kpp: clientKpp || existingClient.kpp || null,
          ogrn: clientOgrn || existingClient.ogrn || null,
          legal_address: clientAddress || existingClient.legal_address || null,
          director_name: clientDirectorName || existingClient.director_name || null,
          director_post: clientDirectorPost || existingClient.director_post || null,
        };
        if (parsedServiceDeadline) {
          updateData.service_deadline = parsedServiceDeadline;
        }
        await supabase.from("clients").update(updateData).eq("id", existingClient.id);
      }
      queryClient.invalidateQueries({ queryKey: ["doc-clients"] });
      queryClient.invalidateQueries({ queryKey: ["planner-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    }

    // Step 3: Save files to storage
    if (targetContractId) {
      const translitDocLabel = (type: DocType) => type === "contract" ? "Dogovor" : type === "invoice" ? "Schet" : "Akt";

      const saveFileToFolder = async (content: Blob, displayName: string, storageFileName: string, contractId: string) => {
        const storagePath = `${contractId}/${Date.now()}-${storageFileName}`;
        const { error: uploadErr } = await supabase.storage.from("contracts").upload(storagePath, content);
        if (uploadErr) {
          console.error(`[DOC] Upload FAILED for ${displayName}:`, uploadErr);
          return null;
        }
        await supabase.from("contract_files").insert({
          contract_id: contractId,
          file_name: displayName,
          file_path: storagePath,
          file_size: content.size,
        });
        return storagePath;
      };

      try {
        const pdfBase64 = await generatePdfBase64(html);
        const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const safeNum = safeFilename(docNumber);
        const pdfDisplayName = `${DOC_LABELS[docType]}_${safeNum}_${docDate}.pdf`;
        const pdfStorageName = `${translitDocLabel(docType)}_${safeNum}_${docDate}.pdf`;
        await saveFileToFolder(pdfBlob, pdfDisplayName, pdfStorageName, targetContractId);

        if (docType === "contract" && invoiceHtml) {
          const invoicePdfBase64 = await generatePdfBase64(invoiceHtml);
          const invoicePdfBytes = Uint8Array.from(atob(invoicePdfBase64), c => c.charCodeAt(0));
          const invoicePdfBlob = new Blob([invoicePdfBytes], { type: 'application/pdf' });
          await saveFileToFolder(invoicePdfBlob, `Счёт_${safeNum}_${docDate}.pdf`, `Schet_${safeNum}_${docDate}.pdf`, targetContractId);

          // Upsert invoice document too
          const { data: existingInvoice } = await supabase
            .from("generated_documents")
            .select("id")
            .eq("doc_type", "invoice")
            .eq("doc_number", docNumber)
            .eq("contract_id", targetContractId)
            .maybeSingle();

          const invoicePayload = {
            doc_type: "invoice" as string,
            doc_number: docNumber,
            doc_date: docDate,
            client_name: clientName,
            client_inn: clientInn || null,
            contract_id: targetContractId,
            total_amount: total,
            services: JSON.stringify(filteredServices),
            html_content: invoiceHtml,
          };

          if (existingInvoice) {
            // Не перезаписываем уже выставленный счёт при повторном сохранении договора,
            // чтобы правки суммы/услуг в договоре не «уплывали» в счёт задним числом.
            toast.info(`Счёт №${docNumber} не обновлён автоматически. Перегенерируйте вручную во вкладке «Счёт», если нужно.`);
          } else {
            await supabase.from("generated_documents").insert(invoicePayload);
          }
        }

        queryClient.invalidateQueries({ queryKey: ["contract-files"] });
        queryClient.invalidateQueries({ queryKey: ["contract-file-counts"] });
        queryClient.invalidateQueries({ queryKey: ["files-contracts"] });
        queryClient.invalidateQueries({ queryKey: ["generated-documents"] });
      } catch (pdfErr) {
        console.error("[DOC] PDF generation/save error:", pdfErr);
      }
    }

    return targetContractId;
  };

  const generatePdfBase64 = async (htmlContent: string): Promise<string> => {
    return renderDocumentPdfBase64(htmlContent);
  };

  const downloadPdfFromHtml = async (htmlContent: string, filename: string) => {
    try {
      toast.info("Генерация PDF...");
      const base64 = await generatePdfBase64(htmlContent);
      const byteChars = atob(base64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF скачан");
    } catch (e) {
      console.error('PDF download error:', e);
      toast.error("Не удалось сгенерировать PDF");
    }
  };

  // Build a complete deal package (Договор + Счёт + Акт + ТЗ) and download as one PDF.
  const [packageBusy, setPackageBusy] = useState(false);
  const [tzPickerOpen, setTzPickerOpen] = useState(false);
  const [tzPickerCandidates, setTzPickerCandidates] = useState<any[]>([]);
  const [tzPickerSelected, setTzPickerSelected] = useState<string>("");
  const [tzPickerLink, setTzPickerLink] = useState(true);
  const [tzPickerContractId, setTzPickerContractId] = useState<string>("");

  const buildPackageWithTz = async (tz: any, contractId: string) => {
    try {
      // Build Act HTML on the fly from the same form data.
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
        name: clientName, inn: clientInn, kpp: clientKpp, ogrn: clientOgrn,
        address: clientAddress, director_name: clientDirectorName, director_post: clientDirectorPost,
      };
      const actDocData: DocumentData = {
        type: "act",
        number: docNumber,
        date: formatDate(docDate),
        company, client,
        services: services.filter(s => s.name.trim()),
        subject, deadline, paymentTerms,
        contractNumber: docNumber,
        contractDate: formatDate(docDate),
      };
      const actHtml = embedDocImages(generateActHtml(actDocData));

      const tzHtml = renderTzHtml((tz.payload || {}) as any, {
        tzNumber: tz.tz_number,
        tzDate: tz.tz_date,
        title: tz.title,
        appendixNumber: tz.appendix_number || tz.tz_number,
        contractNumber: docNumber,
        contractDate: formatDate(docDate),
      });

      const parts: { label: string; html: string }[] = [
        { label: "Договор", html: previewHtml },
      ];
      if (previewInvoiceHtml) parts.push({ label: "Счёт", html: previewInvoiceHtml });
      parts.push({ label: "Акт", html: actHtml });
      parts.push({ label: "ТЗ", html: tzHtml });

      toast.info("Сборка пакета PDF…");
      await mergeHtmlsToPdf(parts, `Пакет_${safeFilename(docNumber)}.pdf`);
      toast.success("Пакет PDF скачан");
    } catch (e: any) {
      console.error("[Package] build failed:", e);
      toast.error(`Не удалось собрать пакет: ${e?.message || e}`);
    }
  };

  const confirmTzPicker = async () => {
    const tz = tzPickerCandidates.find(t => t.id === tzPickerSelected);
    if (!tz) { toast.error("Выберите ТЗ"); return; }
    setTzPickerOpen(false);
    setPackageBusy(true);
    try {
      if (tzPickerLink && tzPickerContractId) {
        try {
          await supabase.from("tz_documents" as any)
            .update({ contract_id: tzPickerContractId } as any)
            .eq("id", tz.id);
        } catch (e) { console.error("[Package] link failed", e); }
      }
      await buildPackageWithTz(tz, tzPickerContractId);
    } finally {
      setPackageBusy(false);
    }
  };

  const downloadFullPackage = async () => {
    if (!previewHtml) return;
    if (docType !== "contract") {
      toast.error("Пакет собирается только из договора");
      return;
    }
    setPackageBusy(true);
    try {
      // 1. Save current contract (creates contracts row if missing).
      try { await saveDocumentToDB(previewHtml, previewInvoiceHtml || null); } catch (e) { console.error("[Package] save failed", e); }

      // 2. Resolve real contract id (linkedContractId may have just been auto-created).
      let contractId = linkedContractId;
      if (!contractId) {
        const { data: cRow } = await supabase
          .from("contracts")
          .select("id")
          .eq("contract_number", docNumber)
          .maybeSingle();
        contractId = cRow?.id || "";
      }

      // 3. Resolve TZ.
      // 3a. If contract has explicitly linked TZ — use it silently.
      let tz: any = null;
      if (contractId) {
        const { data } = await supabase.from("tz_documents" as any)
          .select("*").eq("contract_id", contractId).maybeSingle();
        tz = data;
      }
      // 3b. Otherwise look at all client's TZ.
      if (!tz) {
        if (!clientInn) {
          toast.error("Не указан ИНН клиента — не могу найти ТЗ.");
          return;
        }
        const { data: list } = await supabase.from("tz_documents" as any)
          .select("*").eq("client_inn", clientInn)
          .order("created_at", { ascending: false });
        const candidates = (list as any[]) || [];
        if (candidates.length === 0) {
          toast.error("У клиента нет ТЗ. Сначала создайте его во вкладке «ТЗ».");
          return;
        }
        if (candidates.length === 1) {
          tz = candidates[0];
        } else {
          // Open picker; pause here.
          setTzPickerCandidates(candidates);
          setTzPickerSelected(candidates[0].id);
          setTzPickerLink(true);
          setTzPickerContractId(contractId);
          setTzPickerOpen(true);
          return; // builder will run after user confirms
        }
      }

      await buildPackageWithTz(tz, contractId);
    } catch (e: any) {
      console.error("[Package] failed:", e);
      toast.error(`Не удалось собрать пакет: ${e?.message || e}`);
    } finally {
      setPackageBusy(false);
    }
  };

  const downloadSampleDocument = async (type: DocType) => {
    const company: CompanyRequisites = {
      company_name: settings.company_name || "ООО «Ваша компания»",
      company_short_name: settings.company_short_name || "ООО «Ваша компания»",
      company_inn: settings.company_inn || "0000000000",
      company_kpp: settings.company_kpp || "000000000",
      company_ogrn: settings.company_ogrn || "0000000000000",
      company_legal_address: settings.company_legal_address || "г. Москва",
      company_actual_address: settings.company_actual_address || "г. Москва",
      company_bank_account: settings.company_bank_account || "40702810000000000000",
      company_bank_bik: settings.company_bank_bik || "044525000",
      company_bank_corr: settings.company_bank_corr || "30101810000000000000",
      company_bank_name: settings.company_bank_name || "Банк",
      company_director_name: settings.company_director_name || "Иванов И.И.",
      company_director_post: settings.company_director_post || "Директор",
      company_phone: settings.company_phone || "",
      company_email: settings.company_email || "",
    };
    const client: ClientRequisites = {
      name: "ООО «Образец»",
      inn: "1234567890",
      kpp: "123456789",
      ogrn: "1234567890123",
      address: "г. Москва, ул. Примерная, д. 1",
      director_name: "Петров Пётр Петрович",
      director_post: "Директор",
    };
    const sampleServices: ServiceItem[] = [
      { name: "Пример услуги", qty: 1, price: 10000 },
    ];
    const docData: DocumentData = {
      type,
      number: "000",
      date: formatDate(new Date().toISOString().slice(0, 10)),
      company,
      client,
      services: sampleServices,
      subject: "Пример предмета договора",
      deadline: "30 рабочих дней",
      paymentTerms: "100% предоплата",
      contractNumber: "000",
      contractDate: formatDate(new Date().toISOString().slice(0, 10)),
    };
    let html = "";
    switch (type) {
      case "contract": html = generateContractHtml(docData); break;
      case "invoice": html = generateInvoiceHtml(docData); break;
      case "act": html = generateActHtml(docData); break;
    }
    html = embedDocImages(html);
    await downloadPdfFromHtml(html, `Образец_${DOC_LABELS[type]}.pdf`);
  };

  const sendDocumentEmail = async () => {
    if (!emailTo.trim() || !previewHtml) return toast.error("Укажите email получателя");
    setEmailSending(true);
    setEmailProgress({ step: 'Сохранение документа...', percent: 5 });

    // Save/update document in DB before sending
    try {
      await saveDocumentToDB(previewHtml, previewInvoiceHtml || null);
    } catch (e) {
      console.error("[Email] saveDocumentToDB failed:", e);
    }
    try {
      const safeNum = safeFilename(docNumber);
      const pdfFilename = `${DOC_LABELS[docType]}_${safeNum}_${docDate}.pdf`;
      const pdfStorageName = `${docType === "contract" ? "Dogovor" : docType === "invoice" ? "Schet" : "Akt"}_${safeNum}_${docDate}.pdf`;

      // 1. Generate main PDF
      setEmailProgress({ step: 'Генерация PDF...', percent: 15 });
      let pdfBase64: string;
      try {
        pdfBase64 = await generatePdfBase64(previewHtml);
      } catch (pdfErr) {
        console.error('[Email] PDF generation failed:', pdfErr);
        throw new Error('Не удалось сгенерировать PDF');
      }

      // 1b. Generate invoice PDF if exists (contract type)
      let invoicePdfBase64: string | null = null;
      if (previewInvoiceHtml && docType === "contract") {
        setEmailProgress({ step: 'Генерация PDF счёта...', percent: 25 });
        try {
          invoicePdfBase64 = await generatePdfBase64(previewInvoiceHtml);
        } catch (pdfErr) {
          console.error('[Email] Invoice PDF generation failed:', pdfErr);
          // Don't throw — send contract without invoice
          toast.error('Не удалось сгенерировать PDF счёта, отправляем только договор');
        }
      }

      setEmailProgress({ step: 'Прикрепление файлов...', percent: 50 });

      // Send email with PDF(s) attached directly (no Storage links — клиенты часто без VPN)
      const docLabel = `${DOC_LABELS[docType]} №${docNumber} от ${formatDate(docDate)}`;
      const invoiceFilename = `Счёт_${safeNum}_${docDate}.pdf`;
      const hasInvoice = !!invoicePdfBase64;

      const attachments: { filename: string; base64: string; contentType: string }[] = [
        { filename: pdfFilename, base64: pdfBase64, contentType: 'application/pdf' },
      ];
      if (invoicePdfBase64) {
        attachments.push({ filename: invoiceFilename, base64: invoicePdfBase64, contentType: 'application/pdf' });
      }

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Добрый день!</p>
          <p>Направляем Вам документ${hasInvoice ? 'ы' : ''} <strong>${docLabel}</strong>${hasInvoice ? ' (договор и счёт)' : ''} во вложении.</p>
          <p style="color: #6b7280; font-size: 13px;">Если файл${hasInvoice ? 'ы' : ''} не открыва${hasInvoice ? 'ются' : 'ется'}, ответьте на это письмо — пришлём повторно.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">Синтагма — автоматизированная система документооборота</p>
        </div>
      `;

      setEmailProgress({ step: 'Постановка письма в отправку...', percent: 70 });

      const recipients = [emailTo.trim(), ...(emailCc.trim() ? [emailCc.trim()] : [])].filter(Boolean);
      const { data, error } = await supabase.functions.invoke('send-document-email', {
        body: {
          to: recipients.join(','),
          subject: docLabel,
          html: emailHtml,
          attachments,
          async: true,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Ошибка отправки');

      setEmailProgress({ step: 'Сохранение...', percent: 90 });
      const client = clients.find(c => c.name === clientName);
      if (client && emailTo.trim()) {
        await supabase.from("clients").update({ email: emailTo.trim() }).eq("id", client.id);
        queryClient.invalidateQueries({ queryKey: ["doc-clients"] });
        queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      }

      setEmailProgress({ step: 'Готово!', percent: 100 });
      toast.success(`Документ${hasInvoice ? 'ы' : ''} поставлен${hasInvoice ? 'ы' : ''} в отправку на ${emailTo}`);
      setTimeout(() => {
        setEmailDialogOpen(false);
        setEmailTo("");
        setEmailProgress({ step: '', percent: 0 });
      }, 500);
    } catch (err: any) {
      console.error('[Email] Error:', err);
      toast.error(err.message || "Не удалось отправить письмо");
      setEmailProgress({ step: '', percent: 0 });
    }
    setEmailSending(false);
  };

  const sendDocumentTelegram = async () => {
    if (!previewHtml) return;
    setTelegramSending(true);
    try {
      // Save/update document in DB before sending
      try {
        await saveDocumentToDB(previewHtml, previewInvoiceHtml || null);
      } catch (e) {
        console.error("[Telegram] saveDocumentToDB failed:", e);
      }

      toast.info("Генерация PDF...");
      const pdfBase64 = await generatePdfBase64(previewHtml);
      const tgSafeNum = safeFilename(docNumber);
      const pdfFilename = `${DOC_LABELS[docType]}_${tgSafeNum}_${docDate}.pdf`;

      const documents: { pdfBase64: string; filename: string }[] = [
        { pdfBase64, filename: pdfFilename },
      ];

      // Include invoice if present (contract type)
      if (previewInvoiceHtml && docType === "contract") {
        try {
          const invoiceBase64 = await generatePdfBase64(previewInvoiceHtml);
          documents.push({
            pdfBase64: invoiceBase64,
            filename: `Счёт_${tgSafeNum}_${docDate}.pdf`,
          });
        } catch (e) {
          console.error("Invoice PDF failed for Telegram:", e);
        }
      }

      toast.info("Отправка в Telegram...");
      const caption = `📄 ${DOC_LABELS[docType]} №${docNumber} от ${formatDate(docDate)}\n👤 ${clientName}`;

      const { data, error } = await supabase.functions.invoke('send-telegram-document', {
        body: { documents, caption },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Ошибка отправки");

      toast.success(`Документ${documents.length > 1 ? 'ы' : ''} отправлен${documents.length > 1 ? 'ы' : ''} в Telegram`);
    } catch (err: any) {
      console.error("[Telegram] Error:", err);
      toast.error(err.message || "Не удалось отправить в Telegram");
    }
    setTelegramSending(false);
  };

  const loadDocumentForEdit = useCallback((doc: any) => {
    setDocType(doc.doc_type as DocType);
    setDocNumber(doc.doc_number);
    setDocDate(doc.doc_date);
    setClientName(doc.client_name);
    setClientInn(doc.client_inn || "");
    setLinkedContractId(doc.contract_id || "");

    try {
      const parsed = typeof doc.services === 'string' ? JSON.parse(doc.services) : doc.services;
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (doc.doc_type === "reconciliation") {
          setReconRows(parsed as ReconciliationRow[]);
        } else {
          setServices(parsed);
        }
      }
    } catch { /* keep current */ }

    if (doc.metadata) {
      try {
        const meta = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
        if (meta.contractSubType) setContractSubType(meta.contractSubType as ContractSubType);
        if (meta.subject !== undefined) setSubject(meta.subject);
        if (meta.deadline !== undefined) setDeadline(meta.deadline);
        if (meta.paymentTerms !== undefined) setPaymentTerms(meta.paymentTerms);
        if (meta.discountAmount !== undefined) setDiscountAmount(meta.discountAmount || 0);
        if (meta.discountDeadline !== undefined) setDiscountDeadline(meta.discountDeadline || "");
        if (meta.clientKpp) setClientKpp(meta.clientKpp);
        if (meta.clientOgrn) setClientOgrn(meta.clientOgrn);
        if (meta.clientAddress) setClientAddress(meta.clientAddress);
        if (meta.clientDirectorName) setClientDirectorName(meta.clientDirectorName);
        if (meta.clientDirectorPost) setClientDirectorPost(meta.clientDirectorPost);
        if (meta.periodFrom) setPeriodFrom(meta.periodFrom);
        if (meta.periodTo) setPeriodTo(meta.periodTo);
        if (meta.openingBalance !== undefined) setOpeningBalance(Number(meta.openingBalance) || 0);
        // If any key client requisite is missing/empty in metadata, fall back to the client card.
        const hasClientReqs = ["clientKpp","clientOgrn","clientAddress","clientDirectorName"]
          .every(k => meta[k] && String(meta[k]).trim().length > 0);
        if (!hasClientReqs) void fillClientFromName(doc.client_name);
      } catch { void fillClientFromName(doc.client_name); }
    } else {
      void fillClientFromName(doc.client_name);
    }

    toast.info("Документ загружен в редактор");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fillClientFromName]);

  // Load an existing generated document into the editor when navigated with an ID
  useEffect(() => {
    if (!initialEditDocId) return;
    (async () => {
      const { data, error } = await supabase
        .from("generated_documents")
        .select("*")
        .eq("id", initialEditDocId)
        .maybeSingle();
      if (error || !data) {
        toast.error("Документ не найден");
        onMounted?.();
        return;
      }
      loadDocumentForEdit(data);
      onMounted?.();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditDocId]);

  if (settingsLoading || clientsLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Document type & number */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Тип и номер документа</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {!hideTypeSelector && (
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
          )}
          {docType === "contract" && (
            <div className="space-y-1">
              <Label>Тип договора</Label>
              <Select value={contractSubType} onValueChange={v => setContractSubType(v as ContractSubType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONTRACT_TYPE_LABELS) as ContractSubType[]).map(k => (
                    <SelectItem key={k} value={k}>{CONTRACT_TYPE_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label>Номер</Label>
            <div className="flex gap-2">
              <Input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder={`001/${docYear}`} />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Подставить актуальный следующий номер"
                onClick={async () => {
                  const res = await queryClient.refetchQueries({ queryKey: ["last-doc-numbers", docYear] });
                  const fresh = (res?.[0]?.data as Record<string, string> | undefined) || lastDocNumbers;
                  const next = (fresh && fresh[docType]) || `001/${docYear}`;
                  setDocNumber(next);
                  toast.success(`Подставлен номер ${next}`);
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Формат: NNN/{docYear}. Для договоров номер продолжается по реестру договоров за этот год.</p>
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
      {docType === "contract" && contractSubType !== "frdo" && (
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

      {/* FRDO contract-specific */}
      {docType === "contract" && contractSubType === "frdo" && (
        <Card>
          <CardHeader><CardTitle>Условия договора ФРДО</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Период оказания услуг</Label>
                <Input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="05.03.2026 по 05.03.2027" />
              </div>
              <div className="space-y-1">
                <Label>Условия оплаты</Label>
                <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="авансом в размере 100%" />
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
              <Select value={linkedContractId} onValueChange={(val) => {
                setLinkedContractId(val);
                const contract = contracts.find(c => c.id === val);
                if (contract) {
                  setClientName(contract.client_name || "");
                  fillClientFromName(contract.client_name || "");
                  fillServicesFromContract(contract.id, contract);
                }
              }}>
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

      {/* Reconciliation-specific */}
      {docType === "reconciliation" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Период и операции</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadReconciliationFromCRM} disabled={reconLoading}>
                  {reconLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                  Подтянуть из CRM
                </Button>
                <Button variant="outline" size="sm" onClick={addReconRow}><Plus className="w-4 h-4 mr-1" />Строка</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Период с</Label>
                <Input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Период по</Label>
                <Input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Сальдо начальное (+ в нашу пользу)</Label>
                <Input type="number" value={openingBalance || ""} onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              {reconRows.length === 0 && (
                <p className="text-sm text-muted-foreground">Нет операций. Нажмите «Подтянуть из CRM» или добавьте строку вручную.</p>
              )}
              {reconRows.map((r, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_120px_120px_auto] gap-2 items-end">
                  <div className="space-y-1">
                    {i === 0 && <Label className="hidden sm:block">Дата</Label>}
                    <Input type="date" value={r.date} onChange={e => updateReconRow(i, "date", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="hidden sm:block">Документ</Label>}
                    <Input value={r.doc} onChange={e => updateReconRow(i, "doc", e.target.value)} placeholder="Акт №… / Оплата по договору №…" />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="hidden sm:block">Дебет (нач.)</Label>}
                    <Input type="number" min={0} value={r.debit || ""} onChange={e => updateReconRow(i, "debit", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="hidden sm:block">Кредит (опл.)</Label>}
                    <Input type="number" min={0} value={r.credit || ""} onChange={e => updateReconRow(i, "credit", parseFloat(e.target.value) || 0)} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeReconRow(i)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            {reconRows.length > 0 && (() => {
              const td = reconRows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
              const tc = reconRows.reduce((s, r) => s + (Number(r.credit) || 0), 0);
              const fin = openingBalance + td - tc;
              return (
                <div className="text-right text-sm space-y-1 pt-2 border-t">
                  <div>Обороты: дебет <strong>{td.toLocaleString("ru-RU")}</strong> ₽ / кредит <strong>{tc.toLocaleString("ru-RU")}</strong> ₽</div>
                  <div className="font-semibold text-base">
                    Сальдо конечное: {fin === 0 ? "0 (закрыто)" : `${Math.abs(fin).toLocaleString("ru-RU")} ₽ ${fin > 0 ? "в нашу пользу" : "в пользу клиента"}`}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Services table */}
      {docType !== "reconciliation" && (
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
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="sm:hidden">Наименование</Label>
                  {i === 0 && <Label className="hidden sm:block">Наименование</Label>}
                  <Input value={s.name} onChange={e => updateService(i, "name", e.target.value)} placeholder="Услуга..." />
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] sm:contents gap-2">
                  <div className="space-y-1">
                    <Label className="sm:hidden">Кол-во</Label>
                    {i === 0 && <Label className="hidden sm:block">Кол-во</Label>}
                    <Input type="number" min={1} value={s.qty} onChange={e => updateService(i, "qty", parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="sm:hidden">Цена, ₽</Label>
                    {i === 0 && <Label className="hidden sm:block">Цена, ₽</Label>}
                    <Input type="number" min={0} value={s.price} onChange={e => updateService(i, "price", parseFloat(e.target.value) || 0)} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeService(i)} disabled={services.length <= 1} className="self-end">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right font-semibold text-lg">
            Итого: {total.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽
          </div>

          {(docType === "invoice" || docType === "contract") && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <Label className="text-sm font-medium">Скидка при досрочной оплате</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Сумма скидки, ₽</Label>
                  <Input type="number" min={0} value={discountAmount || ""} onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Оплата до</Label>
                  <Input type="date" value={discountDeadline} onChange={e => setDiscountDeadline(e.target.value)} />
                </div>
              </div>
              {discountAmount > 0 && (
                <div className="text-right text-sm text-muted-foreground">
                  Сумма со скидкой: <span className="font-semibold text-foreground">{(total - discountAmount).toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽</span>
                  {discountDeadline && <span> (при оплате до {formatDate(discountDeadline)})</span>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Generate */}
      <Button onClick={() => generate()} size="lg" className="w-full">
        <Printer className="w-5 h-5 mr-2" />
        Сформировать {DOC_LABELS[docType]}
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {docType !== "invoice" && (
          <Button onClick={() => generate("invoice")} variant="outline" size="default" className="w-full">
            <Printer className="w-4 h-4 mr-2" />
            Сформировать Счёт
          </Button>
        )}
        {docType !== "act" && (
          <Button onClick={() => generate("act")} variant="outline" size="default" className="w-full">
            <Printer className="w-4 h-4 mr-2" />
            Сформировать Акт
          </Button>
        )}
      </div>


      {/* Document Preview Modal */}
      <Dialog open={!!previewHtml} onOpenChange={(open) => { if (!open) { setPreviewHtml(null); setPreviewInvoiceHtml(null); } }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <DialogTitle className="text-base sm:text-lg">Предпросмотр</DialogTitle>
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.print();
                    }
                  }}
                >
                  <Printer className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Печать</span>
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
                  <Mail className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">На почту</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={telegramSending}
                  onClick={sendDocumentTelegram}
                >
                  {telegramSending ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <Send className="w-4 h-4 sm:mr-2" />}
                  <span className="hidden sm:inline">{telegramSending ? 'Отправка...' : 'В Telegram'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={emailSending}
                  onClick={async () => {
                    if (!previewHtml) return;
                    const currentHtml = previewTab === "invoice" && previewInvoiceHtml ? previewInvoiceHtml : previewHtml;
                    const label = previewTab === "invoice" ? "Счёт" : DOC_LABELS[docType];
                    const fileName = `${label}_${safeFilename(docNumber)}_${docDate}.pdf`;
                    // Save to client/contract/DB just like when sending
                    try {
                      await saveDocumentToDB(previewHtml, previewInvoiceHtml || null);
                      toast.success("Документ сохранён в базе");
                    } catch (e) {
                      console.error("[Download] saveDocumentToDB failed:", e);
                    }
                    downloadPdfFromHtml(currentHtml, fileName);
                  }}
                >
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Скачать PDF</span>
                </Button>
                {docType === "contract" && (
                  <Button
                    size="sm"
                    disabled={packageBusy}
                    onClick={downloadFullPackage}
                    title="Договор + Счёт + Акт + ТЗ одним PDF"
                  >
                    {packageBusy
                      ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                      : <Package className="w-4 h-4 sm:mr-2" />}
                    <span className="hidden sm:inline">Договор + ТЗ + Счёт + Акт</span>
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            {previewInvoiceHtml ? (
              <Tabs value={previewTab} onValueChange={setPreviewTab} className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="mx-3 sm:mx-6 mt-2 shrink-0 w-fit">
                  <TabsTrigger value="contract">Договор</TabsTrigger>
                  <TabsTrigger value="invoice">Счёт</TabsTrigger>
                </TabsList>
                <TabsContent value="contract" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
                  <iframe
                    ref={previewTab === "contract" ? iframeRef : undefined}
                    srcDoc={previewHtml || ""}
                    className="w-full h-full border-0 bg-white"
                    title="Договор"
                  />
                </TabsContent>
                <TabsContent value="invoice" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
                  <iframe
                    ref={previewTab === "invoice" ? iframeRef : undefined}
                    srcDoc={previewInvoiceHtml}
                    className="w-full h-full border-0 bg-white"
                    title="Счёт"
                  />
                </TabsContent>
              </Tabs>
            ) : (
              previewHtml && (
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  className="w-full h-full border-0 bg-white"
                  title="Предпросмотр документа"
                />
              )
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
                disabled={emailSending}
              />
            </div>
            <div className="space-y-1">
              <Label>Копия</Label>
              <Input
                type="email"
                value={emailCc}
                onChange={e => setEmailCc(e.target.value)}
                placeholder="copy@example.com"
                onKeyDown={e => { if (e.key === 'Enter') sendDocumentEmail(); }}
                disabled={emailSending}
              />
            </div>
            {emailSending && emailProgress.step && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{emailProgress.step}</span>
                  <span className="text-muted-foreground font-mono">{emailProgress.percent}%</span>
                </div>
                <Progress value={emailProgress.percent} className="h-2" />
              </div>
            )}
            <Button onClick={sendDocumentEmail} disabled={emailSending} className="w-full">
              {emailSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              {emailSending ? emailProgress.step || 'Отправка...' : 'Отправить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={tzPickerOpen} onOpenChange={setTzPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Выберите ТЗ для пакета</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              У клиента несколько ТЗ. Выберите, какое включить в пакет.
            </p>
            <Select value={tzPickerSelected} onValueChange={setTzPickerSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите ТЗ" />
              </SelectTrigger>
              <SelectContent>
                {tzPickerCandidates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {(t.tz_number || "—")} · {t.tz_date || ""} · {t.title || "Без названия"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tzPickerContractId && (
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={tzPickerLink}
                  onChange={(e) => setTzPickerLink(e.target.checked)}
                  className="mt-1"
                />
                <span>Привязать это ТЗ к договору, чтобы в следующий раз не спрашивать</span>
              </label>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTzPickerOpen(false)}>Отмена</Button>
              <Button onClick={confirmTzPicker} disabled={!tzPickerSelected}>Собрать пакет</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collapsed helpers */}
      <Collapsible>
        <Card>
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors [&[data-state=open]>svg:last-child]:rotate-180">
              <span className="flex items-center gap-2 text-sm font-medium"><Download className="w-4 h-4" />Скачать образец</span>
              <ChevronDown className="w-4 h-4 transition-transform" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadSampleDocument("contract")}>
                <FileText className="w-4 h-4 mr-1" />Образец договора
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadSampleDocument("invoice")}>
                <FileText className="w-4 h-4 mr-1" />Образец счёта
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadSampleDocument("act")}>
                <FileText className="w-4 h-4 mr-1" />Образец акта
              </Button>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <button type="button" className="w-full flex items-center justify-between rounded-lg border bg-card px-6 py-3 hover:bg-muted/30 transition-colors [&[data-state=open]>svg:last-child]:rotate-180">
            <span className="flex items-center gap-2 text-sm font-medium"><FileSignature className="w-4 h-4" />Подписать готовый PDF</span>
            <ChevronDown className="w-4 h-4 transition-transform" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <SignPdfCard />
        </CollapsibleContent>
      </Collapsible>

      {/* Recent Documents History */}
      <RecentDocuments onEdit={loadDocumentForEdit} />
    </div>
  );
};

/* ─── Inline Recent Documents Component ─── */
const DOC_TYPE_LABELS_HIST: Record<string, { label: string; color: string }> = {
  contract: { label: "Договор", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  invoice: { label: "Счёт", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  act: { label: "Акт", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  reconciliation: { label: "Акт сверки", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

const RecentDocuments = ({ onEdit }: { onEdit?: (doc: any) => void }) => {
  const queryClient = useQueryClient();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const docImagesRef = useRef<{ signature: string; stamp: string } | null>(null);

  useEffect(() => {
    preloadDocumentImages().then(imgs => { docImagesRef.current = imgs; }).catch(console.error);
  }, []);

  const embedDocImages = useCallback((html: string): string => {
    const imgs = docImagesRef.current;
    if (!imgs) return html;
    return html
      .replace(new RegExp(`${window.location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/images/signature\\.png`, 'g'), imgs.signature)
      .replace(new RegExp(`${window.location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/images/stamp\\.png`, 'g'), imgs.stamp);
  }, []);

  const downloadPdfFromHtml = async (htmlContent: string, filename: string) => {
    try {
      toast.info("Генерация PDF...");
      const base64 = await renderDocumentPdfBase64(htmlContent);
      const byteChars = atob(base64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF скачан");
    } catch (e) {
      console.error('PDF download error:', e);
      toast.error("Не удалось сгенерировать PDF");
    }
  };

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["generated-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_documents" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const deleteDoc = async (id: string) => {
    const { error } = await supabase.from("generated_documents" as any).delete().eq("id", id);
    if (error) { toast.error("Ошибка удаления"); return; }
    queryClient.invalidateQueries({ queryKey: ["generated-documents"] });
    toast.success("Документ удалён");
  };

  if (isLoading) return null;
  if (!docs.length) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4" />Последние документы
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile */}
          <div className="sm:hidden divide-y divide-border">
            {docs.map((doc: any) => {
              const typeInfo = DOC_TYPE_LABELS_HIST[doc.doc_type] || { label: doc.doc_type, color: "" };
              return (
                <div key={doc.id} className="py-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge>
                      <span className="font-mono text-xs">№{doc.doc_number}</span>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {onEdit && <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => onEdit(doc)} title="Редактировать"><Pencil className="w-3.5 h-3.5" /></Button>}
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setPreviewHtml(embedDocImages(doc.html_content))}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => {
                        const label = DOC_TYPE_LABELS_HIST[doc.doc_type]?.label || doc.doc_type;
                        downloadPdfFromHtml(embedDocImages(doc.html_content), `${label}_${doc.doc_number}_${doc.doc_date}.pdf`);
                      }}><Download className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => deleteDoc(doc.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{formatRuDateNumeric(doc.doc_date) || doc.doc_date}</span>
                    <span>{doc.client_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип</TableHead>
                  <TableHead>Номер</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead className="w-36"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc: any) => {
                  const typeInfo = DOC_TYPE_LABELS_HIST[doc.doc_type] || { label: doc.doc_type, color: "" };
                  return (
                    <TableRow key={doc.id}>
                      <TableCell><Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge></TableCell>
                      <TableCell className="font-mono">№{doc.doc_number}</TableCell>
                      <TableCell>{formatRuDateNumeric(doc.doc_date) || doc.doc_date}</TableCell>
                      <TableCell>{doc.client_name}</TableCell>
                      <TableCell>{doc.total_amount ? Number(doc.total_amount).toLocaleString("ru-RU", { minimumFractionDigits: 2 }) + " ₽" : "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {onEdit && <Button variant="ghost" size="icon" onClick={() => onEdit(doc)} title="Редактировать"><Pencil className="w-4 h-4" /></Button>}
                          <Button variant="ghost" size="icon" onClick={() => setPreviewHtml(embedDocImages(doc.html_content))} title="Открыть"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            const label = DOC_TYPE_LABELS_HIST[doc.doc_type]?.label || doc.doc_type;
                            downloadPdfFromHtml(embedDocImages(doc.html_content), `${label}_${doc.doc_number}_${doc.doc_date}.pdf`);
                          }} title="Скачать PDF"><Download className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc.id)} className="text-destructive hover:text-destructive" title="Удалить"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!previewHtml} onOpenChange={(open) => { if (!open) setPreviewHtml(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Просмотр документа</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewHtml(null)}><X className="w-4 h-4" /></Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 p-2 sm:p-4">
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml || ""}
              className="w-full h-full min-h-[600px] bg-white rounded border"
              style={{ border: "none" }}
            />
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default DocumentsTab;
