import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSignature, Loader2, Download, Eye, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { signPdf } from "@/lib/pdf-signer";

const SignPdfCard = () => {
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedName, setSignedName] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [anchorsFound, setAnchorsFound] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Нужен PDF-файл");
      return;
    }
    setBusy(true);
    setSignedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    try {
      const { bytes, anchorsFound } = await signPdf(file);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setSignedUrl(url);
      setSignedName(`${baseName}_подписан.pdf`);
      setAnchorsFound(anchorsFound);
      if (anchorsFound > 0) {
        toast.success(`Подписано: найдено ${anchorsFound} место${anchorsFound === 1 ? "" : "(а)"} «М.П.»`);
      } else {
        toast.warning("Не нашёл «М.П.» в документе — поставил подпись и печать в левом нижнем углу последней страницы");
      }
    } catch (e) {
      console.error("[SignPdf]", e);
      toast.error("Не удалось обработать PDF");
    } finally {
      setBusy(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const downloadSigned = () => {
    if (!signedUrl) return;
    const a = document.createElement("a");
    a.href = signedUrl;
    a.download = signedName;
    a.click();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5" />
            Подписать готовый PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !busy && inputRef.current?.click()}
            className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
            } ${busy ? "opacity-60 pointer-events-none" : ""}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            {busy ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" /> Распознаю и накладываю подпись с печатью…
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-7 h-7 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Перетащите PDF сюда или нажмите, чтобы выбрать</p>
                <p className="text-xs text-muted-foreground">
                  Подпись и печать поставятся автоматически рядом с «М.П.» (например, в акте сверки)
                </p>
              </div>
            )}
          </div>

          {signedUrl && !busy && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">{signedName}</span>
                {anchorsFound > 0 && (
                  <span className="text-xs text-muted-foreground">· {anchorsFound} подпись/печать</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                  <Eye className="w-4 h-4 mr-1" /> Превью
                </Button>
                <Button size="sm" onClick={downloadSigned}>
                  <Download className="w-4 h-4 mr-1" /> Скачать
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{signedName}</span>
              <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-muted/30">
            {signedUrl && (
              <iframe src={signedUrl} className="w-full h-full" style={{ border: "none" }} title="Подписанный PDF" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignPdfCard;
