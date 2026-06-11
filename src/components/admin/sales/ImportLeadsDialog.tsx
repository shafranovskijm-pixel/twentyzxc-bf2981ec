import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  autoMapColumns, rowToLead, dedupeWithin, type ImportedLead, type RawRow,
} from "./lead-utils";

const FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Организация *" },
  { key: "inn", label: "ИНН" },
  { key: "website", label: "Сайт" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Телефон" },
  { key: "contact_person", label: "Контактное лицо" },
  { key: "city", label: "Город" },
  { key: "region", label: "Регион" },
  { key: "address", label: "Адрес" },
  { key: "license_number", label: "№ лицензии" },
  { key: "license_date", label: "Дата лицензии" },
  { key: "source", label: "Источник" },
  { key: "notes", label: "Комментарий" },
];

export default function ImportLeadsDialog({
  open, onOpenChange, existingHashes, onImported,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existingHashes: Set<string>;
  onImported: () => void;
}) {
  const [rows, setRows] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [filename, setFilename] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [onlyEdu, setOnlyEdu] = useState(true);
  const [onlyWithEmail, setOnlyWithEmail] = useState(false);
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);
  const [defaultSource, setDefaultSource] = useState("");
  const [defaultRegion, setDefaultRegion] = useState("");

  function reset() {
    setRows([]); setHeaders([]); setMapping({}); setFilename("");
    setOnlyEdu(true); setOnlyWithEmail(false); setOnlyWithPhone(false);
    setDefaultSource(""); setDefaultRegion("");
  }

  async function handleFile(file: File) {
    setParsing(true);
    setFilename(file.name);
    try {
      const buf = await file.arrayBuffer();
      let parsedRows: RawRow[] = [];
      let parsedHeaders: string[] = [];

      if (/\.csv$/i.test(file.name)) {
        // Попытка UTF-8, если много "?" — Windows-1251
        let text = new TextDecoder("utf-8").decode(buf);
        if ((text.match(/\uFFFD/g) || []).length > 5) {
          text = new TextDecoder("windows-1251").decode(buf);
        }
        // Снимаем "sep=;" префикс если есть
        text = text.replace(/^sep=.\r?\n/i, "");
        const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true, delimiter: "" });
        parsedRows = (result.data as RawRow[]).filter(r => Object.values(r).some(v => String(v ?? "").trim()));
        parsedHeaders = result.meta.fields ?? [];
      } else {
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        parsedRows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: "" });
        parsedHeaders = parsedRows.length ? Object.keys(parsedRows[0]) : [];
      }

      if (!parsedRows.length) {
        toast.error("Файл пустой или не распознан");
        setParsing(false);
        return;
      }

      setRows(parsedRows);
      setHeaders(parsedHeaders);
      setMapping(autoMapColumns(parsedHeaders));
      toast.success(`Распознано ${parsedRows.length} строк`);
    } catch (e: any) {
      toast.error(`Ошибка парсинга: ${e.message}`);
    } finally {
      setParsing(false);
    }
  }

  const preview = useMemo(() => {
    if (!rows.length || !mapping.name) return { all: [], kept: [] as ImportedLead[], stats: { total: 0, edu: 0, withEmail: 0, withPhone: 0, dupInternal: 0, dupExisting: 0 } };
    const leads: ImportedLead[] = [];
    let edu = 0, withEmail = 0, withPhone = 0;
    for (const r of rows) {
      const l = rowToLead(r, mapping, { source: defaultSource || undefined, region: defaultRegion || undefined });
      if (!l) continue;
      if (l.category === "education") edu++;
      if (l.email) withEmail++;
      if (l.phone) withPhone++;
      leads.push(l);
    }
    const filtered = leads.filter(l => {
      if (onlyEdu && l.category !== "education") return false;
      if (onlyWithEmail && !l.email) return false;
      if (onlyWithPhone && !l.phone) return false;
      return true;
    });
    const { kept, dropped: dupInternal } = dedupeWithin(filtered);
    const finalKept = kept.filter(l => !existingHashes.has(l.dedup_hash));
    const dupExisting = kept.length - finalKept.length;
    return { all: leads, kept: finalKept, stats: { total: leads.length, edu, withEmail, withPhone, dupInternal, dupExisting } };
  }, [rows, mapping, onlyEdu, onlyWithEmail, onlyWithPhone, defaultSource, defaultRegion, existingHashes]);

  async function doImport() {
    if (!preview.kept.length) return toast.error("Нечего импортировать");
    setImporting(true);
    try {
      const userRes = await supabase.auth.getUser();
      const user_id = userRes.data.user?.id;
      if (!user_id) { toast.error("Нет авторизации"); return; }
      const payload = preview.kept.map(l => ({ ...l, user_id, license_cache: null, _matchedField: undefined, _isDup: undefined }));
      // Чанками по 500
      let inserted = 0;
      for (let i = 0; i < payload.length; i += 500) {
        const chunk = payload.slice(i, i + 500).map(({ _matchedField, _isDup, ...rest }: any) => rest);
        const { error } = await supabase.from("sales_leads").insert(chunk);
        if (error) throw error;
        inserted += chunk.length;
      }
      toast.success(`Импортировано ${inserted} лидов`);
      reset();
      onOpenChange(false);
      onImported();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !importing) { reset(); } onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />Импорт лидов из XLSX / CSV
          </DialogTitle>
        </DialogHeader>

        {!rows.length && (
          <div className="space-y-3">
            <Label className="block">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30">
                {parsing
                  ? <><Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" /><div className="text-sm">Парсинг {filename}…</div></>
                  : <><Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-sm">Перетащите или выберите файл .csv / .xlsx</div>
                      <div className="text-xs text-muted-foreground mt-1">Поддерживается выгрузка 2GIS, реестры, любые таблицы с заголовками</div>
                    </>}
                <Input type="file" accept=".csv,.xlsx,.xls" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  disabled={parsing} />
              </div>
            </Label>
          </div>
        )}

        {rows.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm"><b>{filename}</b> · {rows.length} строк</div>
              <Button variant="ghost" size="sm" onClick={reset}>Другой файл</Button>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Сопоставление колонок (поправь, если автоматика ошиблась)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {FIELDS.map(f => (
                  <div key={f.key} className="flex items-center gap-2">
                    <Label className="text-xs w-32 shrink-0">{f.label}</Label>
                    <Select
                      value={mapping[f.key] || "__none__"}
                      onValueChange={(v) => setMapping(m => ({ ...m, [f.key]: v === "__none__" ? "" : v }))}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— не использовать —</SelectItem>
                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Источник по умолчанию</Label><Input value={defaultSource} onChange={e => setDefaultSource(e.target.value)} placeholder={filename || "Импорт"} className="h-9" /></div>
              <div><Label className="text-xs">Регион по умолчанию</Label><Input value={defaultRegion} onChange={e => setDefaultRegion(e.target.value)} placeholder="напр. Москва" className="h-9" /></div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={onlyEdu} onCheckedChange={(v) => setOnlyEdu(!!v)} />
                Только образовательные
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={onlyWithEmail} onCheckedChange={(v) => setOnlyWithEmail(!!v)} />
                Только с email
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={onlyWithPhone} onCheckedChange={(v) => setOnlyWithPhone(!!v)} />
                Только с телефоном
              </label>
            </div>

            <div className="rounded-md border bg-muted/20 p-3 text-xs space-y-1">
              <div>Всего распознано: <b>{preview.stats.total}</b></div>
              <div>Образовательных: <b className="text-emerald-400">{preview.stats.edu}</b> · с email: <b>{preview.stats.withEmail}</b> · с телефоном: <b>{preview.stats.withPhone}</b></div>
              <div>Дубли в файле: <b className="text-amber-400">{preview.stats.dupInternal}</b> · уже в CRM: <b className="text-amber-400">{preview.stats.dupExisting}</b></div>
              <div className="pt-1 border-t border-border/40 mt-1">К импорту: <b className="text-base text-primary">{preview.kept.length}</b></div>
            </div>

            {preview.kept.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-md border text-xs">
                <table className="w-full">
                  <thead className="bg-muted/40 sticky top-0">
                    <tr><th className="text-left p-2">Организация</th><th className="text-left p-2">Email</th><th className="text-left p-2">Телефон</th><th className="text-left p-2">Город</th></tr>
                  </thead>
                  <tbody>
                    {preview.kept.slice(0, 20).map((l, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="p-2 max-w-[260px] truncate" title={l.name}>{l.name}</td>
                        <td className="p-2">{l.email || "—"}</td>
                        <td className="p-2">{l.phone || "—"}</td>
                        <td className="p-2">{l.city || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={importing}>Отмена</Button>
          <Button onClick={doImport} disabled={!preview.kept.length || importing}>
            {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Импортировать {preview.kept.length || ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}