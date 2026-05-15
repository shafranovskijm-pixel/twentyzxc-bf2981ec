import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { History, Eye, Download, Trash2, Loader2, X, Search, FileSignature, FileText, FileSpreadsheet, Receipt, FileCheck, ClipboardList } from "lucide-react";
import TablePagination from "./TablePagination";
import { preloadDocumentImages } from "@/lib/document-images";

type DocKind =
  | "contract" | "invoice" | "act" | "reconciliation"
  | "signed" | "contract_file" | "nmo" | "tz";

const KIND_META: Record<DocKind, { label: string; color: string; Icon: any }> = {
  contract:      { label: "Договор",         color: "bg-blue-500/20 text-blue-300 border-blue-500/40",      Icon: FileText },
  invoice:       { label: "Счёт",            color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", Icon: Receipt },
  act:           { label: "Акт",             color: "bg-amber-500/20 text-amber-300 border-amber-500/40",   Icon: FileCheck },
  reconciliation:{ label: "Акт сверки",      color: "bg-purple-500/20 text-purple-300 border-purple-500/40", Icon: FileSpreadsheet },
  signed:        { label: "Подписанный PDF", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", Icon: FileSignature },
  contract_file: { label: "Файл договора",   color: "bg-slate-500/20 text-slate-300 border-slate-500/40",   Icon: FileText },
  nmo:           { label: "НМО",             color: "bg-teal-500/20 text-teal-300 border-teal-500/40",      Icon: FileText },
  tz:            { label: "ТЗ",              color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40", Icon: ClipboardList },
};

type UnifiedRow = {
  id: string;
  source: "generated_documents" | "contract_files" | "nmo_documents" | "tz_documents";
  kind: DocKind;
  doc_number: string | null;
  doc_date: string;          // ISO
  client_name: string;
  total_amount?: number | null;
  html_content?: string | null;
  file_path?: string | null; // storage path
  bucket?: "contracts" | "nmo-documents";
  file_name?: string;
};

const generatePdfBase64 = async (html: string): Promise<string> => {
  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:white;";
  container.innerHTML = html;
  document.body.appendChild(container);
  const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff" });
  document.body.removeChild(container);
  const imgWidth = 210, pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF("p", "mm", "a4");
  let heightLeft = imgHeight, position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  return pdf.output("datauristring").split(",")[1];
};

const HistoryTab = () => {
  const queryClient = useQueryClient();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const docImagesRef = useRef<{ signature: string; stamp: string } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<DocKind | "all">("all");
  const [periodFilter, setPeriodFilter] = useState<"7" | "30" | "90" | "all">("all");

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

  const { data: rows = [], isLoading, error: historyError } = useQuery({
    queryKey: ["unified-documents"],
    queryFn: async (): Promise<UnifiedRow[]> => {
      const [genRes, fileRes, nmoRes, contractsRes, nmoRegsRes, tzRes] = await Promise.all([
        supabase.from("generated_documents" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("contract_files" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("nmo_documents" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("contracts" as any).select("id, client_name, contract_number"),
        supabase.from("nmo_registrations" as any).select("id, organization_name"),
        supabase.from("tz_documents" as any).select("*").order("created_at", { ascending: false }),
      ]);

      const contractsById = new Map<string, any>((contractsRes.data || []).map((c: any) => [c.id, c]));
      const nmoById = new Map<string, any>((nmoRegsRes.data || []).map((n: any) => [n.id, n]));

      const out: UnifiedRow[] = [];

      for (const d of (genRes.data || []) as any[]) {
        const kind = (d.doc_type as DocKind) in KIND_META ? (d.doc_type as DocKind) : "contract_file";
        out.push({
          id: `gd:${d.id}`,
          source: "generated_documents",
          kind,
          doc_number: d.doc_number,
          doc_date: d.doc_date || d.created_at,
          client_name: d.client_name || "—",
          total_amount: d.total_amount,
          html_content: d.html_content,
        });
      }

      for (const f of (fileRes.data || []) as any[]) {
        const isSigned = f.metadata?.signed === true;
        const c = f.contract_id ? contractsById.get(f.contract_id) : null;
        out.push({
          id: `cf:${f.id}`,
          source: "contract_files",
          kind: isSigned ? "signed" : "contract_file",
          doc_number: c?.contract_number || null,
          doc_date: f.created_at,
          client_name: c?.client_name || f.metadata?.client_name || "—",
          file_path: f.file_path,
          bucket: "contracts",
          file_name: f.file_name,
        });
      }

      for (const n of (nmoRes.data || []) as any[]) {
        const reg = n.registration_id ? nmoById.get(n.registration_id) : null;
        out.push({
          id: `nmo:${n.id}`,
          source: "nmo_documents",
          kind: "nmo",
          doc_number: null,
          doc_date: n.created_at,
          client_name: reg?.organization_name || "—",
          file_path: n.file_path,
          bucket: "nmo-documents",
          file_name: n.file_name,
        });
      }

      for (const t of (tzRes.data || []) as any[]) {
        out.push({
          id: `tz:${t.id}`,
          source: "tz_documents",
          kind: "tz",
          doc_number: t.tz_number,
          doc_date: t.tz_date || t.created_at,
          client_name: t.client_name || "—",
          html_content: t.html_content,
        });
      }

      out.sort((a, b) => new Date(b.doc_date).getTime() - new Date(a.doc_date).getTime());
      return out;
    },
    retry: 1,
    staleTime: 60_000,
  });

  // Apply filters
  const filtered = useMemo(() => {
    const now = Date.now();
    const periodMs = periodFilter === "all" ? Infinity : Number(periodFilter) * 86400_000;
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (kindFilter !== "all" && r.kind !== kindFilter) return false;
      if (periodMs !== Infinity && (now - new Date(r.doc_date).getTime()) > periodMs) return false;
      if (q) {
        const hay = `${r.doc_number || ""} ${r.client_name} ${r.file_name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, kindFilter, periodFilter, search]);

  // Counts per kind for badges
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of filtered) c[r.kind] = (c[r.kind] || 0) + 1;
    return c;
  }, [filtered]);

  useEffect(() => { setCurrentPage(1); }, [search, kindFilter, periodFilter]);

  const deleteRow = async (row: UnifiedRow) => {
    if (!window.confirm("Удалить документ?")) return;
    try {
      if (row.source === "generated_documents") {
        const id = row.id.slice(3);
        const { error } = await supabase.from("generated_documents" as any).delete().eq("id", id);
        if (error) throw error;
      } else if (row.source === "contract_files") {
        const id = row.id.slice(3);
        if (row.file_path) await supabase.storage.from("contracts").remove([row.file_path]);
        const { error } = await supabase.from("contract_files" as any).delete().eq("id", id);
        if (error) throw error;
      } else if (row.source === "nmo_documents") {
        const id = row.id.slice(4);
        if (row.file_path) await supabase.storage.from("nmo-documents").remove([row.file_path]);
        const { error } = await supabase.from("nmo_documents" as any).delete().eq("id", id);
        if (error) throw error;
      } else if (row.source === "tz_documents") {
        const id = row.id.slice(3);
        const { error } = await supabase.from("tz_documents" as any).delete().eq("id", id);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["unified-documents"] });
      queryClient.invalidateQueries({ queryKey: ["generated-documents"] });
      queryClient.invalidateQueries({ queryKey: ["contract-files"] });
      toast.success("Документ удалён");
    } catch (e: any) {
      toast.error(e?.message || "Ошибка удаления");
    }
  };

  const openSignedUrl = async (row: UnifiedRow): Promise<string | null> => {
    if (!row.file_path || !row.bucket) return null;
    const { data, error } = await supabase.storage.from(row.bucket).createSignedUrl(row.file_path, 60 * 10);
    if (error) { toast.error("Не удалось получить ссылку"); return null; }
    return data.signedUrl;
  };

  const handleView = async (row: UnifiedRow) => {
    if (row.html_content) {
      setPreviewHtml(embedDocImages(row.html_content));
      return;
    }
    const url = await openSignedUrl(row);
    if (url) setPreviewPdfUrl(url);
  };

  const handleDownload = async (row: UnifiedRow) => {
    if (row.html_content) {
      try {
        toast.info("Генерация PDF...");
        const base64 = await generatePdfBase64(embedDocImages(row.html_content));
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${KIND_META[row.kind].label}_${(row.doc_number || "").replace(/\//g, "-")}_${row.doc_date.slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("PDF скачан");
      } catch {
        toast.error("Не удалось сгенерировать PDF");
      }
      return;
    }
    const url = await openSignedUrl(row);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = row.file_name || "document.pdf";
    a.click();
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (historyError) {
    return (
      <Card>
        <CardContent className="text-center py-6 space-y-2">
          <p className="text-sm text-destructive">Ошибка загрузки истории: {(historyError as any).message}</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ["unified-documents"] })} className="text-sm text-primary underline">Повторить</button>
        </CardContent>
      </Card>
    );
  }

  const KIND_ORDER: DocKind[] = ["contract", "invoice", "act", "reconciliation", "signed", "contract_file", "nmo"];

  return (
    <>
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" />История документов</CardTitle>

          {/* Filters bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск по клиенту, номеру или имени файла..."
                  className="pl-9"
                />
              </div>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">За 7 дней</SelectItem>
                  <SelectItem value="30">За 30 дней</SelectItem>
                  <SelectItem value="90">За 90 дней</SelectItem>
                  <SelectItem value="all">За всё время</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={kindFilter === "all" ? "default" : "outline"}
                onClick={() => setKindFilter("all")}
                className="h-8"
              >
                Все <span className="ml-1.5 text-xs opacity-70">({filtered.length})</span>
              </Button>
              {KIND_ORDER.map(k => {
                const meta = KIND_META[k];
                const count = counts[k] || 0;
                const Icon = meta.Icon;
                return (
                  <Button
                    key={k}
                    size="sm"
                    variant={kindFilter === k ? "default" : "outline"}
                    onClick={() => setKindFilter(k)}
                    className="h-8 gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                    <span className="text-xs opacity-70">({count})</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <History className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">По выбранным фильтрам ничего не найдено</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y">
                {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(row => {
                  const meta = KIND_META[row.kind];
                  return (
                    <div key={row.id} className="py-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                          {row.doc_number && <span className="font-mono text-xs">№{row.doc_number}</span>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleView(row)}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleDownload(row)}><Download className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => deleteRow(row)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{new Date(row.doc_date).toLocaleDateString("ru-RU")}</span>
                        <span className="text-foreground">{row.client_name}</span>
                        {row.total_amount != null && <span className="font-medium text-foreground">{Number(row.total_amount).toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽</span>}
                        {row.file_name && !row.total_amount && <span className="truncate max-w-[180px]">{row.file_name}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тип</TableHead>
                      <TableHead>Номер / Файл</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(row => {
                      const meta = KIND_META[row.kind];
                      return (
                        <TableRow key={row.id}>
                          <TableCell><Badge variant="outline" className={meta.color}>{meta.label}</Badge></TableCell>
                          <TableCell className="font-mono text-xs max-w-[260px] truncate">
                            {row.doc_number ? `№${row.doc_number}` : (row.file_name || "—")}
                          </TableCell>
                          <TableCell>{new Date(row.doc_date).toLocaleDateString("ru-RU")}</TableCell>
                          <TableCell className="max-w-[280px] truncate" title={row.client_name}>{row.client_name}</TableCell>
                          <TableCell>{row.total_amount != null ? Number(row.total_amount).toLocaleString("ru-RU", { minimumFractionDigits: 2 }) + " ₽" : "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleView(row)} title="Открыть"><Eye className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDownload(row)} title="Скачать"><Download className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteRow(row)} className="text-destructive hover:text-destructive" title="Удалить"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

      {/* HTML Preview */}
      <Dialog open={!!previewHtml} onOpenChange={(open) => { if (!open) setPreviewHtml(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Просмотр документа</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewHtml(null)}><X className="w-4 h-4" /></Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 p-2 sm:p-4">
            <iframe ref={iframeRef} srcDoc={previewHtml || ""} className="w-full h-full min-h-[600px] bg-white rounded border" style={{ border: "none" }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Preview */}
      <Dialog open={!!previewPdfUrl} onOpenChange={(open) => { if (!open) setPreviewPdfUrl(null); }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Просмотр PDF</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewPdfUrl(null)}><X className="w-4 h-4" /></Button>
            </DialogTitle>
          </DialogHeader>
          <iframe src={previewPdfUrl || ""} className="flex-1 w-full bg-white" style={{ border: "none" }} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HistoryTab;
