import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { Loader2, Search, ChevronsUpDown, FileText, FileType, GraduationCap, Building2, Plus, Trash2, Eye } from "lucide-react";
import {
  generateDevelopmentContractHtml,
  type DevelopmentContractInput,
  type DevelopmentClient,
} from "@/lib/development-contract-template";
import { generatePdfBlob } from "@/lib/document-pdf";

interface ClientRow {
  id: string;
  name: string;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  legal_address: string | null;
  director_name: string | null;
  director_post: string | null;
  phone: string | null;
  email: string | null;
}

interface StudentRow { fio: string; snils: string; }

const DEFAULT_PROGRAM = "Микробиологические методы анализа воды. Обеспечение качества измерений. Биобезопасность работы с микроорганизмами 3-4 группы патогенности";

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

export const DevelopmentContractPanel = () => {
  const [selected, setSelected] = useState<DevelopmentClient | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [innQuery, setInnQuery] = useState("");
  const [innLoading, setInnLoading] = useState(false);

  const [number, setNumber] = useState("");
  const [date, setDate] = useState(todayIso());
  const [programName, setProgramName] = useState(DEFAULT_PROGRAM);
  const [hours, setHours] = useState("72");
  const [form, setForm] = useState("дистанционная");
  const [studentsCount, setStudentsCount] = useState("1");
  const [pricePerStudent, setPricePerStudent] = useState("10000");
  const [students, setStudents] = useState<StudentRow[]>([{ fio: "", snils: "" }]);

  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Список клиентов CRM для выбора
  const { data: clients = [] } = useQuery({
    queryKey: ["dev-contract-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, inn, kpp, ogrn, legal_address, director_name, director_post, phone, email")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as ClientRow[];
    },
    staleTime: 60_000,
  });

  // Автонумерация NNN/YYYY по последним договорам
  const { data: existingNumbers = [] } = useQuery({
    queryKey: ["dev-contract-next-number"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("contract_number");
      if (error) throw error;
      return (data || []).map((r: any) => r.contract_number as string | null);
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (number) return;
    const year = new Date().getFullYear();
    let max = 0;
    existingNumbers.forEach((n) => {
      if (!n) return;
      const m = n.match(/^(\d+)\/(\d{4})$/);
      if (m && parseInt(m[2], 10) === year) {
        const v = parseInt(m[1], 10);
        if (v > max) max = v;
      }
    });
    setNumber(`${String(max + 1).padStart(3, "0")}/${year}`);
  }, [existingNumbers, number]);

  // Синхронизируем кол-во строк слушателей с studentsCount
  useEffect(() => {
    const n = Math.max(1, parseInt(studentsCount || "1", 10) || 1);
    setStudents((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n) return [...prev, ...Array.from({ length: n - prev.length }, () => ({ fio: "", snils: "" }))];
      return prev.slice(0, n);
    });
  }, [studentsCount]);

  const pickClient = (c: ClientRow) => {
    setSelected({
      name: c.name,
      inn: c.inn,
      kpp: c.kpp,
      ogrn: c.ogrn,
      legal_address: c.legal_address,
      director_name: c.director_name,
      director_post: c.director_post,
      phone: c.phone,
      email: c.email,
    });
    setPickerOpen(false);
  };

  const lookupByInn = async () => {
    const val = innQuery.trim();
    if (!val) return toast.error("Введите ИНН или название");
    setInnLoading(true);
    try {
      const isInn = /^\d{10,12}$/.test(val);
      const { data, error } = await supabase.functions.invoke("dadata-lookup", {
        body: isInn ? { inn: val } : { query: val },
      });
      if (error) throw error;
      if (!data?.found) return toast.error("Не найдено");
      setSelected({
        name: data.name_short || data.name || val,
        inn: data.inn || null,
        kpp: data.kpp || null,
        ogrn: data.ogrn || null,
        legal_address: data.address || null,
        director_name: data.management_name || null,
        director_post: data.management_post || null,
        phone: null,
        email: null,
      });
      toast.success(`Найдено: ${data.name_short || data.name}`);
    } catch {
      toast.error("Ошибка запроса");
    } finally {
      setInnLoading(false);
    }
  };

  const updateStudent = (i: number, patch: Partial<StudentRow>) => {
    setStudents((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const totalAmount = useMemo(() => {
    const p = parseFloat(pricePerStudent) || 0;
    const c = parseInt(studentsCount, 10) || 0;
    return p * c;
  }, [pricePerStudent, studentsCount]);

  const canGenerate = !!selected?.name && !!number && !!date && !!programName && parseFloat(pricePerStudent) > 0;

  const buildContractInput = (emptyStudents = false): DevelopmentContractInput => ({
      number,
      date,
      client: selected!,
      programName,
      hours: parseInt(hours, 10) || 72,
      form,
      studentsCount: parseInt(studentsCount, 10) || 1,
      pricePerStudent: parseFloat(pricePerStudent) || 0,
      students: emptyStudents
        ? Array.from({ length: Math.max(1, parseInt(studentsCount, 10) || 1) }, () => ({ fio: "", snils: "" }))
        : students,
    });

  const buildHtml = (emptyStudents = false) => generateDevelopmentContractHtml(buildContractInput(emptyStudents));

  const downloadBlob = (blob: Blob, extension: "pdf" | "docx" | "doc") => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Договор ${number.replace("/", "-")} ${selected!.name.slice(0, 40)}.${extension}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const openPreview = () => {
    if (!selected) return toast.error("Выберите организацию");
    if (!canGenerate) return toast.error("Заполните обязательные поля");
    setPreviewHtml(buildHtml(false));
  };

  const generate = async () => {
    if (!selected) return toast.error("Выберите организацию");
    if (!canGenerate) return toast.error("Заполните обязательные поля");
    setGenerating(true);
    const tid = toast.loading("Генерирую договор...");
    try {
      const html = buildHtml(false);
      const blob = await generatePdfBlob(html);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      downloadBlob(blob, "pdf");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success("Договор сгенерирован", { id: tid });
    } catch (e: any) {
      console.error(e);
      toast.error(`Ошибка: ${e?.message || "не удалось"}`, { id: tid });
    } finally {
      setGenerating(false);
    }
  };

  const generateOnServer = async (format: "docx" | "doc") => {
    if (!selected) return toast.error("Выберите организацию");
    if (!canGenerate) return toast.error("Заполните обязательные поля");
    setGenerating(true);
    const tid = toast.loading(`Формирую Word (.${format}) на сервере...`);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-development-contract",
        { body: { format, data: buildContractInput(true) } },
      );
      if (error) throw error;
      let blob: Blob;
      if (data instanceof Blob) blob = data;
      else if (data instanceof ArrayBuffer) blob = new Blob([data]);
      else if (data && typeof data === "object" && "error" in (data as any)) {
        throw new Error((data as any).error);
      } else {
        blob = new Blob([data as BlobPart]);
      }
      if (!blob || blob.size < 500) throw new Error("сервер вернул пустой файл");
      const mime = format === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword;charset=utf-8";
      downloadBlob(new Blob([blob], { type: mime }), format);
      toast.success(`Word (.${format}) готов с текстом договора`, { id: tid });
    } catch (e: any) {
      console.error(e);
      toast.error(`Ошибка ${format.toUpperCase()}: ${e?.message || "не удалось сформировать файл"}`, { id: tid });
    } finally {
      setGenerating(false);
    }
  };

  const generateWord = () => generateOnServer("docx");
  const generateDoc = () => generateOnServer("doc");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          Договор развития (от АНО ДПО и С «Институт развития»)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Информация об Исполнителе */}
        <div className="text-xs text-muted-foreground bg-muted/30 border border-border/60 rounded-md px-3 py-2 space-y-0.5">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <Building2 className="w-3.5 h-3.5" /> Исполнитель:
          </div>
          <div>АНО ДПО и С «Институт развития» · ИНН 3900024056</div>
          <div>ген. дир. Яхненко В.П. · Лицензия № Л035-01236-39/01327849</div>
        </div>

        {/* Заказчик */}
        <div className="space-y-2">
          <Label>Заказчик *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="justify-between h-10 font-normal">
                  {selected?.name || <span className="text-muted-foreground">Выбрать из клиентов CRM...</span>}
                  <ChevronsUpDown className="w-4 h-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Поиск по названию или ИНН..." />
                  <CommandList>
                    <CommandEmpty>Не найдено. Введите ИНН ниже.</CommandEmpty>
                    <CommandGroup>
                      {clients.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.name} ${c.inn || ""}`}
                          onSelect={() => pickClient(c)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {c.inn ? `ИНН ${c.inn}` : "без ИНН"}
                              {c.director_name ? ` · ${c.director_name}` : ""}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Или введите ИНН / название для поиска в DaData"
              value={innQuery}
              onChange={(e) => setInnQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupByInn()}
            />
            <Button variant="outline" onClick={lookupByInn} disabled={innLoading}>
              {innLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          {selected && (
            <div className="text-xs text-muted-foreground bg-muted/40 border rounded-md p-2 space-y-0.5">
              <div className="font-medium text-foreground">{selected.name}</div>
              {selected.inn && <div>ИНН {selected.inn}{selected.kpp ? ` / КПП ${selected.kpp}` : ""}</div>}
              {selected.legal_address && <div>{selected.legal_address}</div>}
              {selected.director_name && <div>{selected.director_post || "Директор"}: {selected.director_name}</div>}
            </div>
          )}
        </div>

        {/* Параметры договора */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>№ договора</Label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="275/2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Дата</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Форма обучения</Label>
            <Input value={form} onChange={(e) => setForm(e.target.value)} placeholder="дистанционная" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Программа обучения</Label>
          <Textarea rows={2} value={programName} onChange={(e) => setProgramName(e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Кол-во часов</Label>
            <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Кол-во слушателей</Label>
            <Input type="number" min={1} value={studentsCount} onChange={(e) => setStudentsCount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Цена за слушателя, ₽</Label>
            <Input type="number" value={pricePerStudent} onChange={(e) => setPricePerStudent(e.target.value)} />
          </div>
        </div>

        <div className="text-sm text-right text-muted-foreground">
          Итого: <span className="font-semibold text-foreground">{totalAmount.toLocaleString("ru-RU")} ₽</span> (НДС не облагается)
        </div>

        {/* Слушатели (Приложение 2) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Слушатели (для Приложения №2)</Label>
            <Button variant="ghost" size="sm" onClick={() => setStudents((p) => [...p, { fio: "", snils: "" }])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Ещё
            </Button>
          </div>
          <div className="space-y-2">
            {students.map((s, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_180px_auto] gap-2 items-center">
                <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                <Input placeholder="ФИО слушателя" value={s.fio} onChange={(e) => updateStudent(i, { fio: e.target.value })} />
                <Input placeholder="СНИЛС" value={s.snils} onChange={(e) => updateStudent(i, { snils: e.target.value })} />
                <Button variant="ghost" size="icon" onClick={() => setStudents((p) => p.filter((_, idx) => idx !== i))} disabled={students.length <= 1}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          <Button onClick={openPreview} disabled={!canGenerate} size="lg" variant="secondary">
            <Eye className="w-4 h-4 mr-2" />
            Предпросмотр
          </Button>
          <Button onClick={generate} disabled={generating || !canGenerate} size="lg">
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
            Сгенерировать PDF
          </Button>
          <Button onClick={generateWord} disabled={generating || !canGenerate} size="lg" variant="outline">
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileType className="w-4 h-4 mr-2" />}
            Скачать .docx
          </Button>
          <Button onClick={generateDoc} disabled={generating || !canGenerate} size="lg" variant="outline">
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileType className="w-4 h-4 mr-2" />}
            Скачать .doc
          </Button>
        </div>

        <Dialog open={!!previewHtml} onOpenChange={(o) => !o && setPreviewHtml(null)}>
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>Предпросмотр договора №{number}</DialogTitle>
            </DialogHeader>
            <iframe
              title="Предпросмотр"
              srcDoc={previewHtml || ""}
              className="flex-1 w-full border-0 rounded-b-lg bg-white"
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DevelopmentContractPanel;
