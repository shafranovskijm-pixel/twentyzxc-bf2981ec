import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { History, Eye, Download, Trash2, Loader2, X } from "lucide-react";
import TablePagination from "./TablePagination";
import { preloadDocumentImages } from "@/lib/document-images";

const DOC_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  contract: { label: "Договор", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  invoice: { label: "Счёт", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  act: { label: "Акт", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
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

  return pdf.output("datauristring").split(",")[1];
};

const HistoryTab = () => {
  const queryClient = useQueryClient();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const { data: docs = [], isLoading, error: historyError } = useQuery({
    queryKey: ["generated-documents"],
    queryFn: async () => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout after 10s")), 10000)
      );
      const queryPromise = supabase
        .from("generated_documents" as any)
        .select("*")
        .order("created_at", { ascending: false });
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      if (error) throw error;
      return data as any[];
    },
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  const deleteDoc = async (id: string) => {
    const { error } = await supabase.from("generated_documents" as any).delete().eq("id", id);
    if (error) { toast.error("Ошибка удаления"); return; }
    queryClient.invalidateQueries({ queryKey: ["generated-documents"] });
    toast.success("Документ удалён");
  };

  const handleView = (html: string) => {
    setPreviewHtml(embedDocImages(html));
  };

  const handleDownload = (html: string, doc: any) => {
    const typeLabel = DOC_TYPE_LABELS[doc.doc_type]?.label || doc.doc_type;
    const filename = `${typeLabel}_${doc.doc_number}_${doc.doc_date}.pdf`;
    downloadPdfFromHtml(embedDocImages(html), filename);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (historyError) {
    return (
      <Card>
        <CardContent className="text-center py-6 space-y-2">
          <p className="text-sm text-destructive">Ошибка загрузки истории: {historyError.message}</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ["generated-documents"] })} className="text-sm text-primary underline">Повторить</button>
        </CardContent>
      </Card>
    );
  }

  if (docs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <History className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Документов пока нет</p>
          <p className="text-sm text-muted-foreground mt-1">Сформируйте документ во вкладке «Документы»</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" />История документов</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile cards */}
          <div className="sm:hidden divide-y">
            {docs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((doc: any) => {
              const typeInfo = DOC_TYPE_LABELS[doc.doc_type] || { label: doc.doc_type, color: "" };
              return (
                <div key={doc.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge>
                      <span className="font-mono text-xs ml-2">№{doc.doc_number}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleView(doc.html_content)}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleDownload(doc.html_content, doc)} title="Скачать PDF"><Download className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => deleteDoc(doc.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{new Date(doc.doc_date).toLocaleDateString("ru-RU")}</span>
                    <span>{doc.client_name}</span>
                    {doc.total_amount && <span className="font-medium text-foreground">{Number(doc.total_amount).toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽</span>}
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
                  <TableHead>Номер</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((doc: any) => {
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
                          <Button variant="ghost" size="icon" onClick={() => handleView(doc.html_content)} title="Открыть">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.html_content, doc)} title="Скачать PDF">
                            <Download className="w-4 h-4" />
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
          </div>
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={docs.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(v) => { setPageSize(v); setCurrentPage(1); }}
          />
        </CardContent>
      </Card>

      {/* Preview Modal */}
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

export default HistoryTab;
