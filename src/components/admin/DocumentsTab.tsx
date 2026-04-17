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
import { FileText, Plus, Trash2, Loader2, Printer, Search, History, Eye, Download, X, Mail, Send, Pencil } from "lucide-react";
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
import { preloadDocumentImages } from "@/lib/document-images";

type DocType = "contract" | "invoice" | "act";
type ContractSubType = "site" | "frdo" | "nmo" | "other";

const DOC_LABELS: Record<DocType, string> = {
  contract: "Договор",
  invoice: "Счёт на оплату",
  act: "Акт выполненных работ",
};

const CONTRACT_TYPE_LABELS: Record<ContractSubType, string> = {
  site: "Сайт",
  frdo: "ФРДО",
  nmo: "НМО",
  other: "Прочее",
};

const DocumentsTab = ({ initialContractId, initialDocType, initialClientName, initialAutoSend, onMounted }: { initialContractId?: string; initialDocType?: string; initialClientName?: string; initialAutoSend?: boolean; onMounted?: () => void }) => {
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

  const [docType, setDocType] = useState<DocType>("contract");
  const [pendingAutoSend, setPendingAutoSend] = useState(false);
  const [contractSubType, setContractSubType] = useState<ContractSubType>("site");
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Year derived from docDate — used for auto-numbering and reset every Jan 1
  const docYear = useMemo(() => {
    const y = new Date(docDate).getFullYear();
    return isNaN(y) ? new Date().getFullYear() : y;
  }, [docDate]);

  // Replace "/" with "-" so doc_number can be safely used in filenames / storage paths
  const safeFilename = useCallback((num: string) => num.replace(/\//g, "-"), []);

  // Auto-generate next doc number for current year. Format: "NNN/YYYY".
  // Numeration resets to 001 each new year because we filter by current year.
  const { data: lastDocNumbers } = useQuery({
    queryKey: ["last-doc-numbers", docYear],
    queryFn: async () => {
      const result: Record<string, string> = {};
      const yearSuffix = `/${docYear}`;
      for (const type of ["contract", "invoice", "act"] as DocType[]) {
        // Fetch all current-year doc numbers for this type, then compute max prefix
        const { data } = await supabase
          .from("generated_documents" as any)
          .select("doc_number")
          .eq("doc_type", type)
          .like("doc_number", `%${yearSuffix}`);
        let maxNum = 0;
        if (data && data.length > 0) {
          for (const row of data as any[]) {
            const match = String(row.doc_number).match(/^(\d+)\/(\d{4})$/);
            if (match && match[2] === String(docYear)) {
              const n = parseInt(match[1], 10);
              if (!isNaN(n) && n > maxNum) maxNum = n;
            }
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

  // discount (invoice-specific)
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountDeadline, setDiscountDeadline] = useState("");

  const [lookingUp, setLookingUp] = useState(false);

  // Helper: fill client requisites from clients array by client_name
  const fillClientFromName = useCallback((name: string) => {
    const client = clients.find(c => c.name === name);
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
      setDeadline("05.03." + new Date().getFullYear() + " по 05.03." + (new Date().getFullYear() + 1));
      setPaymentTerms("авансом в размере 100%");
      setServices([
        { name: "Выгрузка данных в ФИС ФРДО (разовая)", qty: 1, price: 3500 },
        { name: "Ежегодное сопровождение ФИС ФРДО", qty: 1, price: 24000 },
      ]);
    } else if (contractSubType === "site") {
      setSubject("Разработка веб-сайта");
      setDeadline("30 рабочих дней");
      setPaymentTerms("100% предоплата");
      setServices([{ name: "", qty: 1, price: 0 }]);
    } else {
      setSubject("");
      setDeadline("");
      setPaymentTerms("");
      setServices([{ name: "", qty: 1, price: 0 }]);
    }
  }, [contractSubType]);

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
      type: effectiveType,
      number: effectiveNumber,
      date: formatDate(docDate),
      company,
      client,
      services: services.filter(s => s.name.trim()),
      subject,
      deadline,
      paymentTerms,
      contractNumber: linkedContract?.contract_number || "",
      contractDate: linkedContract?.contract_date ? formatDate(linkedContract.contract_date) : "",
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
    setPreviewInvoiceHtml(embedDocImages(invoiceHtml));
    setPreviewTab("contract");

    toast.success("Документ сформирован. Для сохранения отправьте на email или в Telegram.");
  };

  // Save document to DB with upsert logic (called on send)
  const saveDocumentToDB = async (html: string, invoiceHtml: string | null) => {
    let targetContractId = linkedContractId || null;
    const filteredServices = services.filter(s => s.name.trim());

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
      total_amount: total,
      services: JSON.stringify(filteredServices),
      html_content: html,
      metadata: JSON.stringify({
        contractSubType, subject, deadline, paymentTerms,
        discountAmount, discountDeadline,
        clientKpp: clientKpp, clientOgrn: clientOgrn, clientAddress: clientAddress,
        clientDirectorName, clientDirectorPost,
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

    // Step 2: Auto-create contract record
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
      }).select("id").single();
      if (contractError) {
        console.error("[DOC] Step 2 FAILED:", contractError);
      } else {
        console.log("[DOC] Step 2 OK, contract id:", newContract.id);
        targetContractId = newContract.id;
        queryClient.invalidateQueries({ queryKey: ["doc-contracts"] });
        queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      }
    }

    // Step 2.5: Auto-create or update client (+ service_deadline)
    const existingClient = clients.find(c => c.name === clientName);
    
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
            const start = new Date(docDate);
            start.setDate(start.getDate() + days);
            parsedServiceDeadline = start.toISOString().split("T")[0];
          }
        }
      }
    }

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
            await supabase.from("generated_documents").update(invoicePayload).eq("id", existingInvoice.id);
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
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '794px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    iframe.srcdoc = htmlContent;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Iframe load timeout')), 10000);
      iframe.onload = () => { clearTimeout(timeout); resolve(); };
    });
    await new Promise(r => setTimeout(r, 200));
    
    const body = iframe.contentDocument!.body;
    iframe.style.height = body.scrollHeight + 'px';
    
    const canvas = await Promise.race([
      html2canvas(body, {
        scale: 1.2,
        useCORS: true,
        width: 794,
        height: body.scrollHeight,
        windowWidth: 794,
        windowHeight: body.scrollHeight,
        logging: false,
        imageTimeout: 5000,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('html2canvas timeout')), 15000)),
    ]);
    document.body.removeChild(iframe);
    
    const imgData = canvas.toDataURL('image/jpeg', 0.65);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    const margin = 10; // mm margins top/bottom
    const usableHeight = pdfHeight - margin * 2;
    let heightLeft = imgHeight;
    let srcY = 0;
    let page = 0;

    while (heightLeft > 0) {
      if (page > 0) pdf.addPage();
      const sliceHeight = Math.min(usableHeight, heightLeft);
      const sliceCanvasHeight = (sliceHeight / imgHeight) * canvas.height;
      
      // Create a slice canvas for this page
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceCanvasHeight;
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceCanvasHeight, 0, 0, canvas.width, sliceCanvasHeight);
      
      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.65);
      pdf.addImage(sliceData, 'JPEG', 0, margin, pdfWidth, sliceHeight);
      
      srcY += sliceCanvasHeight;
      heightLeft -= sliceHeight;
      page++;
    }
    
    const pdfOutput = pdf.output('datauristring');
    return pdfOutput.split(',')[1];
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

      setEmailProgress({ step: 'PDF готов, сохранение в файлы...', percent: 35 });

      // 2. Upload main PDF
      const b64ToBlob = (b64: string) => {
        const byteChars = atob(b64);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
        return new Blob([byteArray], { type: 'application/pdf' });
      };

      const pdfBlob = b64ToBlob(pdfBase64);
      const storagePath = linkedContractId
        ? `${linkedContractId}/${pdfStorageName}`
        : `documents/${pdfStorageName}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(storagePath, pdfBlob, { upsert: true });
      if (uploadError) throw new Error(`Ошибка загрузки файла: ${uploadError.message}`);

      // 2b. Upload invoice PDF if exists
      let invoiceStoragePath: string | null = null;
      const invoiceFilename = `Счёт_${docNumber}_${docDate}.pdf`;
      const invoiceStorageName = `Schet_${docNumber}_${docDate}.pdf`;
      if (invoicePdfBase64) {
        const invoiceBlob = b64ToBlob(invoicePdfBase64);
        invoiceStoragePath = linkedContractId
          ? `${linkedContractId}/${invoiceStorageName}`
          : `documents/${invoiceStorageName}`;

        const { error: invoiceUploadError } = await supabase.storage
          .from('contracts')
          .upload(invoiceStoragePath, invoiceBlob, { upsert: true });
        if (invoiceUploadError) {
          console.error('[Email] Invoice upload failed:', invoiceUploadError);
          toast.error('Не удалось загрузить счёт, отправляем только договор');
          invoiceStoragePath = null;
        }
      }

      setEmailProgress({ step: 'Файлы сохранены, получение ссылок...', percent: 50 });

      // 3. Record in contract_files if linked to a contract
      if (linkedContractId) {
        await supabase.from('contract_files').insert({
          contract_id: linkedContractId,
          file_name: pdfFilename,
          file_path: storagePath,
          file_size: pdfBlob.size,
        });
        if (invoiceStoragePath && invoicePdfBase64) {
          const invoiceBlob = b64ToBlob(invoicePdfBase64);
          await supabase.from('contract_files').insert({
            contract_id: linkedContractId,
            file_name: invoiceFilename,
            file_path: invoiceStoragePath,
            file_size: invoiceBlob.size,
          });
        }
        queryClient.invalidateQueries({ queryKey: ['contract-files'] });
      }

      // 4. Get signed URLs (7 days)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('contracts')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
      if (signedError || !signedData?.signedUrl) throw new Error('Не удалось создать ссылку на файл');

      let invoiceSignedUrl: string | null = null;
      if (invoiceStoragePath) {
        const { data: invoiceSignedData } = await supabase.storage
          .from('contracts')
          .createSignedUrl(invoiceStoragePath, 60 * 60 * 24 * 7);
        invoiceSignedUrl = invoiceSignedData?.signedUrl || null;
      }

      setEmailProgress({ step: 'Отправка письма...', percent: 70 });

      // 5. Send email with download links
      const docLabel = `${DOC_LABELS[docType]} №${docNumber} от ${formatDate(docDate)}`;
      const invoiceLink = invoiceSignedUrl
        ? `<a href="${invoiceSignedUrl}" 
               style="display: inline-block; padding: 12px 24px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">
              📎 Скачать Счёт (PDF)
            </a>`
        : '';
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Добрый день!</p>
          <p>Направляем Вам документ${invoiceSignedUrl ? 'ы' : ''}: <strong>${docLabel}</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${signedData.signedUrl}" 
               style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">
              📎 Скачать ${DOC_LABELS[docType]} (PDF)
            </a>
          </p>
          ${invoiceLink ? `<p style="margin: 24px 0;">${invoiceLink}</p>` : ''}
          <p style="color: #6b7280; font-size: 13px;">Ссылки действительны 7 дней.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">Синтагма — автоматизированная система документооборота</p>
        </div>
      `;

      const recipients = [emailTo.trim(), ...(emailCc.trim() ? [emailCc.trim()] : [])].filter(Boolean);
      const { data, error } = await supabase.functions.invoke('send-document-email', {
        body: {
          to: recipients.join(','),
          subject: docLabel,
          html: emailHtml,
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
      toast.success(`Документ${invoiceSignedUrl ? 'ы' : ''} отправлен${invoiceSignedUrl ? 'ы' : ''} на ${emailTo} (PDF сохранён в файлы)`);
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
      const pdfFilename = `${DOC_LABELS[docType]}_${docNumber}_${docDate}.pdf`;

      const documents: { pdfBase64: string; filename: string }[] = [
        { pdfBase64, filename: pdfFilename },
      ];

      // Include invoice if present (contract type)
      if (previewInvoiceHtml && docType === "contract") {
        try {
          const invoiceBase64 = await generatePdfBase64(previewInvoiceHtml);
          documents.push({
            pdfBase64: invoiceBase64,
            filename: `Счёт_${docNumber}_${docDate}.pdf`,
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
      if (Array.isArray(parsed) && parsed.length > 0) setServices(parsed);
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
        if (meta.clientKpp !== undefined) setClientKpp(meta.clientKpp);
        if (meta.clientOgrn !== undefined) setClientOgrn(meta.clientOgrn);
        if (meta.clientAddress !== undefined) setClientAddress(meta.clientAddress);
        if (meta.clientDirectorName !== undefined) setClientDirectorName(meta.clientDirectorName);
        if (meta.clientDirectorPost !== undefined) setClientDirectorPost(meta.clientDirectorPost);
      } catch { /* keep current */ }
    } else {
      fillClientFromName(doc.client_name);
    }

    toast.info("Документ загружен в редактор");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fillClientFromName]);

  if (settingsLoading || clientsLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Sample download buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5" />Скачать образец</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
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
        </CardContent>
      </Card>

      {/* Document type & number */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Тип и номер документа</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {discountDeadline && <span> (при оплате до {new Date(discountDeadline).toLocaleDateString("ru-RU")})</span>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
                  onClick={() => {
                    if (!previewHtml) return;
                    const currentHtml = previewTab === "invoice" && previewInvoiceHtml ? previewInvoiceHtml : previewHtml;
                    const label = previewTab === "invoice" ? "Счёт" : DOC_LABELS[docType];
                    const fileName = `${label}_${docNumber}_${docDate}.pdf`;
                    downloadPdfFromHtml(currentHtml, fileName);
                  }}
                >
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Скачать PDF</span>
                </Button>
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
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:white;";
      container.innerHTML = htmlContent;
      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff" });
      document.body.removeChild(container);
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const base64 = pdf.output("datauristring").split(",")[1];
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
                    <span>{new Date(doc.doc_date).toLocaleDateString("ru-RU")}</span>
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
                      <TableCell>{new Date(doc.doc_date).toLocaleDateString("ru-RU")}</TableCell>
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
