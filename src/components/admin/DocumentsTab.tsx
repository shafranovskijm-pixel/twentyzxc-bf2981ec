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
import { FileText, Plus, Trash2, Loader2, Printer, Search, History, Eye, Download, X, Mail } from "lucide-react";
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

const DocumentsTab = ({ initialContractId, initialDocType, onMounted }: { initialContractId?: string; initialDocType?: string; onMounted?: () => void }) => {
  const queryClient = useQueryClient();
  const { settings, isLoading: settingsLoading } = useSiteSettings();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewInvoiceHtml, setPreviewInvoiceHtml] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<string>("contract");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("24@24zxc.ru");
  const [emailSending, setEmailSending] = useState(false);
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
  const [contractSubType, setContractSubType] = useState<ContractSubType>("site");
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
          setDocNumber(lastDocNumbers[initialDocType] || "001");
        }
      }
      onMounted?.();
    }
  }, [initialContractId, contracts, clients]);

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

  const generate = async () => {
    console.log("[DOC] generate called", { docNumber, clientName, services });
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
    try {
      switch (docType) {
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
    if (docType === "contract") {
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

    // Save to DB in background
    let targetContractId = linkedContractId || null;
    try {
      const filteredServices = services.filter(s => s.name.trim());
      
      // Step 1: Save main document
      console.log("[DOC] Step 1: Saving document to generated_documents...");
      const { error: insertError } = await supabase.from("generated_documents").insert({
        doc_type: docType,
        doc_number: docNumber,
        doc_date: docDate,
        client_name: clientName,
        client_inn: clientInn || null,
        contract_id: targetContractId,
        total_amount: total,
        services: JSON.stringify(filteredServices),
        html_content: html,
      });
      if (insertError) {
        console.error("[DOC] Step 1 FAILED:", insertError);
        toast.error(`Ошибка сохранения документа: ${insertError.message}`);
      } else {
        console.log("[DOC] Step 1 OK");
        queryClient.invalidateQueries({ queryKey: ["generated-documents"] });

        // Step 2: Auto-create contract record
        if (docType === "contract" && !linkedContractId) {
          console.log("[DOC] Step 2: Auto-creating contract...");
          const year = new Date(docDate).getFullYear();
          const contractNumber = `${docNumber}-${year}`;
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
            toast.error(`Договор не создан в CRM: ${contractError.message}`);
          } else {
            console.log("[DOC] Step 2 OK, contract id:", newContract.id);
            targetContractId = newContract.id;
            queryClient.invalidateQueries({ queryKey: ["doc-contracts"] });
            queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
          }
        }

        // Step 3: Save PDFs to storage
        if (targetContractId) {
          try {
            console.log("[DOC] Step 3: Generating contract PDF...");
            const pdfBase64 = await generatePdfBase64(html);
            const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            const pdfFileName = `${DOC_LABELS[docType]}_${docNumber}_${docDate}.pdf`;
            const storagePath = `${targetContractId}/${Date.now()}-${pdfFileName}`;

            const { error: uploadErr } = await supabase.storage.from("contracts").upload(storagePath, pdfBlob);
            if (uploadErr) {
              console.error("[DOC] Step 3 upload FAILED:", uploadErr);
              toast.error(`PDF не загружен: ${uploadErr.message}`);
            } else {
              console.log("[DOC] Step 3 upload OK");
              await supabase.from("contract_files").insert({
                contract_id: targetContractId,
                file_name: pdfFileName,
                file_path: storagePath,
                file_size: pdfBlob.size,
              });
            }

            // Step 4: Save invoice PDF if contract
            if (docType === "contract" && invoiceHtml) {
              try {
                console.log("[DOC] Step 4: Generating invoice PDF...");
                const invoicePdfBase64 = await generatePdfBase64(invoiceHtml);
                const invoicePdfBytes = Uint8Array.from(atob(invoicePdfBase64), c => c.charCodeAt(0));
                const invoicePdfBlob = new Blob([invoicePdfBytes], { type: 'application/pdf' });
                const invoiceFileName = `Счёт_${docNumber}_${docDate}.pdf`;
                const invoiceStoragePath = `${targetContractId}/${Date.now()}-${invoiceFileName}`;

                const { error: invoiceUploadErr } = await supabase.storage.from("contracts").upload(invoiceStoragePath, invoicePdfBlob);
                if (invoiceUploadErr) {
                  console.error("[DOC] Step 4 upload FAILED:", invoiceUploadErr);
                } else {
                  console.log("[DOC] Step 4 upload OK");
                  await supabase.from("contract_files").insert({
                    contract_id: targetContractId,
                    file_name: invoiceFileName,
                    file_path: invoiceStoragePath,
                    file_size: invoicePdfBlob.size,
                  });
                }

                // Save invoice to generated_documents
                console.log("[DOC] Step 4b: Saving invoice to generated_documents...");
                await supabase.from("generated_documents").insert({
                  doc_type: "invoice",
                  doc_number: docNumber,
                  doc_date: docDate,
                  client_name: clientName,
                  client_inn: clientInn || null,
                  contract_id: targetContractId,
                  total_amount: total,
                  services: JSON.stringify(filteredServices),
                  html_content: invoiceHtml,
                });
              } catch (invoiceErr) {
                console.error("[DOC] Step 4 error:", invoiceErr);
                toast.error("Счёт-PDF не удалось сохранить");
              }
            }

            queryClient.invalidateQueries({ queryKey: ["contract-files"] });
            queryClient.invalidateQueries({ queryKey: ["contract-file-counts"] });
            queryClient.invalidateQueries({ queryKey: ["files-contracts"] });
            queryClient.invalidateQueries({ queryKey: ["generated-documents"] });
            toast.success("Документы сохранены и добавлены в файлы");
          } catch (pdfErr) {
            console.error("[DOC] PDF generation error:", pdfErr);
            toast.error("Документ сохранён, но PDF не удалось создать");
          }
        } else {
          toast.success("Документ сохранён");
        }
      }
    } catch (err) {
      console.error("[DOC] Save exception:", err);
      toast.error("Не удалось сохранить документ");
    }
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
    setEmailProgress({ step: 'Подготовка документа...', percent: 10 });
    try {
      const pdfFilename = `${DOC_LABELS[docType]}_${docNumber}_${docDate}.pdf`;

      // 1. Generate PDF
      setEmailProgress({ step: 'Генерация PDF...', percent: 20 });
      let pdfBase64: string;
      try {
        pdfBase64 = await generatePdfBase64(previewHtml);
      } catch (pdfErr) {
        console.error('[Email] PDF generation failed:', pdfErr);
        throw new Error('Не удалось сгенерировать PDF');
      }
      setEmailProgress({ step: 'PDF готов, сохранение в файлы...', percent: 40 });

      // 2. Convert base64 to Blob and upload to storage
      const byteChars = atob(pdfBase64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

      const storagePath = linkedContractId
        ? `${linkedContractId}/${pdfFilename}`
        : `documents/${docType}_${docNumber}_${docDate}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(storagePath, pdfBlob, { upsert: true });
      if (uploadError) throw new Error(`Ошибка загрузки файла: ${uploadError.message}`);

      setEmailProgress({ step: 'Файл сохранён, получение ссылки...', percent: 55 });

      // 3. Record in contract_files if linked to a contract
      if (linkedContractId) {
        await supabase.from('contract_files').insert({
          contract_id: linkedContractId,
          file_name: pdfFilename,
          file_path: storagePath,
          file_size: pdfBlob.size,
        });
        queryClient.invalidateQueries({ queryKey: ['contract-files'] });
      }

      // 4. Get signed URL (7 days)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('contracts')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
      if (signedError || !signedData?.signedUrl) throw new Error('Не удалось создать ссылку на файл');

      setEmailProgress({ step: 'Отправка письма...', percent: 70 });

      // 5. Send email with download link (no attachment)
      const docLabel = `${DOC_LABELS[docType]} №${docNumber} от ${formatDate(docDate)}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Добрый день!</p>
          <p>Направляем Вам документ: <strong>${docLabel}</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${signedData.signedUrl}" 
               style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">
              📎 Скачать PDF
            </a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">Ссылка действительна 7 дней.</p>
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
      if (client && !client.email && emailTo.trim()) {
        await supabase.from("clients").update({ email: emailTo.trim() }).eq("id", client.id);
        queryClient.invalidateQueries({ queryKey: ["doc-clients"] });
        queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      }

      setEmailProgress({ step: 'Готово!', percent: 100 });
      toast.success(`Документ отправлен на ${emailTo} (PDF сохранён в файлы)`);
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

  if (settingsLoading || clientsLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
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
        </CardContent>
      </Card>

      {/* Generate */}
      <Button onClick={generate} size="lg" className="w-full">
        <Printer className="w-5 h-5 mr-2" />
        Сформировать {DOC_LABELS[docType]}
      </Button>


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
    </div>
  );
};

export default DocumentsTab;
