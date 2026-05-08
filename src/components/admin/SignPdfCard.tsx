import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSignature, Loader2, Download, ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import {
  loadPdf,
  renderPagePreview,
  signPdfWithPlacements,
  getOverlayImages,
  STAMP_W_PT,
  SIG_W_PT,
  type LoadedPdf,
  type Placement,
} from "@/lib/pdf-signer";

const TARGET_PREVIEW_WIDTH = 720;

const SignPdfCard = () => {
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<LoadedPdf | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [preview, setPreview] = useState<{ dataUrl: string; widthPx: number; heightPx: number; scale: number } | null>(null);
  const [placements, setPlacements] = useState<Record<number, Placement>>({});
  const [overlay, setOverlay] = useState<{ signature: string; stamp: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Load overlay images once
  useEffect(() => {
    getOverlayImages().then(setOverlay).catch(() => {});
  }, []);

  const reset = () => {
    setFile(null);
    setLoaded(null);
    setPreview(null);
    setPlacements({});
    setPageIndex(0);
  };

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf") && f.type !== "application/pdf") {
      toast.error("Нужен PDF-файл");
      return;
    }
    setBusy(true);
    try {
      const ld = await loadPdf(f);
      setFile(f);
      setLoaded(ld);
      setPlacements(ld.initial);
      setPageIndex(0);
      const anchorPages = Object.keys(ld.initial).length;
      if (anchorPages > 0) {
        toast.success(`Готово. Найдено мест «М.П.»: ${anchorPages}. Можно подвинуть подпись/печать мышкой.`);
      } else {
        toast.message("Не нашёл «М.П.» — поставь подпись и печать руками, перетащив их на нужное место.");
      }
    } catch (e) {
      console.error("[SignPdf load]", e);
      toast.error("Не удалось открыть PDF");
    } finally {
      setBusy(false);
    }
  }, []);

  // Render page preview when page changes
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    setPreview(null);
    renderPagePreview(loaded.buf, pageIndex, TARGET_PREVIEW_WIDTH)
      .then((res) => { if (!cancelled) setPreview(res); })
      .catch((e) => { console.error("[SignPdf render]", e); toast.error("Не удалось отобразить страницу"); });
    return () => { cancelled = true; };
  }, [loaded, pageIndex]);

  const currentPage = loaded?.pages[pageIndex];
  const scale = preview?.scale ?? 1;

  // Default placement for current page (if not set yet — middle of page)
  const placement: Placement | undefined = useMemo(() => {
    if (!currentPage) return undefined;
    if (placements[pageIndex]) return placements[pageIndex];
    // Default for unsigned page: center-bottom area
    const stampX = currentPage.pageWidthPt / 2 - STAMP_W_PT / 2;
    const stampY = 80;
    const sigX = stampX;
    const sigY = stampY + (STAMP_W_PT * (loaded?.stampAspect ?? 1)) + 8;
    return { sigX, sigY, stampX, stampY };
  }, [placements, pageIndex, currentPage, loaded?.stampAspect]);

  const ensurePagePlacement = () => {
    if (placements[pageIndex] || !placement) return placement;
    setPlacements(prev => ({ ...prev, [pageIndex]: placement }));
    return placement;
  };

  const updatePlacement = (patch: Partial<Placement>) => {
    setPlacements(prev => {
      const cur = prev[pageIndex] || placement;
      if (!cur) return prev;
      return { ...prev, [pageIndex]: { ...cur, ...patch } };
    });
  };

  const removePagePlacement = () => {
    setPlacements(prev => {
      const next = { ...prev };
      delete next[pageIndex];
      return next;
    });
  };

  // Drag handler factory
  const dragRef = useRef<{ which: "sig" | "stamp"; startPx: { x: number; y: number }; startPt: { x: number; y: number } } | null>(null);
  const startDrag = (which: "sig" | "stamp") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cur = ensurePagePlacement();
    if (!cur || !currentPage) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      which,
      startPx: { x: e.clientX, y: e.clientY },
      startPt: which === "sig" ? { x: cur.sigX, y: cur.sigY } : { x: cur.stampX, y: cur.stampY },
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !currentPage) return;
    const dxPx = e.clientX - d.startPx.x;
    const dyPx = e.clientY - d.startPx.y;
    // Convert to PDF points; PDF y is bottom-up while screen y is top-down → invert dy.
    const dxPt = dxPx / scale;
    const dyPt = -dyPx / scale;
    let nx = d.startPt.x + dxPt;
    let ny = d.startPt.y + dyPt;
    // Clamp
    const w = d.which === "sig" ? SIG_W_PT : STAMP_W_PT;
    const aspect = d.which === "sig" ? (loaded?.sigAspect ?? 0.4) : (loaded?.stampAspect ?? 1);
    const h = w * aspect;
    nx = Math.max(0, Math.min(currentPage.pageWidthPt - w, nx));
    ny = Math.max(0, Math.min(currentPage.pageHeightPt - h, ny));
    updatePlacement(d.which === "sig" ? { sigX: nx, sigY: ny } : { stampX: nx, stampY: ny });
  };
  const endDrag = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    }
    dragRef.current = null;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const downloadSigned = async () => {
    if (!loaded || !file) return;
    setBusy(true);
    try {
      const bytes = await signPdfWithPlacements(loaded.buf, placements);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "_подписан.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("Подписанный PDF скачан");
    } catch (e) {
      console.error("[SignPdf save]", e);
      toast.error("Не удалось сохранить PDF");
    } finally {
      setBusy(false);
    }
  };

  // Convert PDF-pt placement to CSS px (top-left of overlay div) for the preview canvas.
  const toCss = (which: "sig" | "stamp") => {
    if (!placement || !currentPage || !preview) return null;
    const w = which === "sig" ? SIG_W_PT : STAMP_W_PT;
    const aspect = which === "sig" ? (loaded?.sigAspect ?? 0.4) : (loaded?.stampAspect ?? 1);
    const h = w * aspect;
    const xPt = which === "sig" ? placement.sigX : placement.stampX;
    const yPt = which === "sig" ? placement.sigY : placement.stampY;
    const leftPx = xPt * scale;
    const topPx = (currentPage.pageHeightPt - (yPt + h)) * scale;
    return { leftPx, topPx, widthPx: w * scale, heightPx: h * scale };
  };

  const sigCss = toCss("sig");
  const stampCss = toCss("stamp");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="w-5 h-5" />
          Подписать готовый PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loaded && (
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
                <Loader2 className="w-5 h-5 animate-spin" /> Загружаю PDF…
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-7 h-7 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Перетащите PDF сюда или нажмите, чтобы выбрать</p>
                <p className="text-xs text-muted-foreground">
                  Подпись и печать встанут рядом с «М.П.», после чего их можно подвинуть мышкой.
                </p>
              </div>
            )}
          </div>
        )}

        {loaded && currentPage && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex(i => Math.max(0, i - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm tabular-nums">
                  Стр. {pageIndex + 1} / {loaded.pages.length}
                </span>
                <Button variant="outline" size="sm" disabled={pageIndex >= loaded.pages.length - 1} onClick={() => setPageIndex(i => Math.min(loaded.pages.length - 1, i + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={removePagePlacement} title="Не подписывать эту страницу / сбросить позицию">
                  <RotateCcw className="w-4 h-4 mr-1" /> Сбросить
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="w-4 h-4 mr-1" /> Заменить файл
                </Button>
                <Button size="sm" onClick={downloadSigned} disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                  Скачать PDF
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Перетащите подпись и печать мышкой туда, куда нужно. Позиция сохраняется отдельно для каждой страницы.
              Кнопка «Сбросить» убирает подпись с текущей страницы.
            </p>

            <div className="rounded-lg border bg-muted/30 p-3 overflow-auto">
              <div
                ref={stageRef}
                className="relative mx-auto"
                style={{ width: preview?.widthPx ?? TARGET_PREVIEW_WIDTH, height: preview?.heightPx ?? 1, maxWidth: "100%" }}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                {preview ? (
                  <img src={preview.dataUrl} alt={`Страница ${pageIndex + 1}`} className="block w-full h-auto select-none pointer-events-none" draggable={false} />
                ) : (
                  <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Рендерю страницу…
                  </div>
                )}

                {preview && placements[pageIndex] && overlay && stampCss && (
                  <div
                    onPointerDown={startDrag("stamp")}
                    className="absolute touch-none cursor-move ring-1 ring-primary/40 hover:ring-primary rounded-sm"
                    style={{
                      left: stampCss.leftPx, top: stampCss.topPx,
                      width: stampCss.widthPx, height: stampCss.heightPx,
                      transform: "rotate(-4deg)", transformOrigin: "center",
                    }}
                  >
                    <img src={overlay.stamp} alt="Печать" className="w-full h-full select-none pointer-events-none" draggable={false} style={{ opacity: 0.85 }} />
                  </div>
                )}
                {preview && placements[pageIndex] && overlay && sigCss && (
                  <div
                    onPointerDown={startDrag("sig")}
                    className="absolute touch-none cursor-move ring-1 ring-primary/40 hover:ring-primary rounded-sm"
                    style={{
                      left: sigCss.leftPx, top: sigCss.topPx,
                      width: sigCss.widthPx, height: sigCss.heightPx,
                    }}
                  >
                    <img src={overlay.signature} alt="Подпись" className="w-full h-full select-none pointer-events-none" draggable={false} style={{ opacity: 0.95 }} />
                  </div>
                )}

                {preview && !placements[pageIndex] && (
                  <button
                    type="button"
                    onClick={() => { if (placement) setPlacements(prev => ({ ...prev, [pageIndex]: placement })); }}
                    className="absolute inset-x-0 bottom-3 mx-auto w-fit px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90"
                  >
                    + Подписать эту страницу
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SignPdfCard;
