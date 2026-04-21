import { useEffect, useState } from "react";
import { Copy, Check, RefreshCw, UserPlus, ChevronDown, Loader2, Database, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Requisites {
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  legal_address?: string | null;
  director_name?: string | null;
  director_post?: string | null;
}

interface ClientRow extends Requisites {
  id: string;
  name: string;
}

interface Props {
  clientName: string;
  inn?: string | null;
  defaultOpen?: boolean;
  onInnDetected?: (inn: string) => void;
}

const FIELD_LABELS: Record<keyof Requisites, string> = {
  inn: "ИНН",
  kpp: "КПП",
  ogrn: "ОГРН",
  legal_address: "Юр. адрес",
  director_name: "Руководитель",
  director_post: "Должность",
};

const Chip = ({ field, value }: { field: keyof Requisites; value: string | null | undefined }) => {
  const [copied, setCopied] = useState(false);
  const label = FIELD_LABELS[field];
  const display = value && String(value).trim() ? String(value) : "";

  const onCopy = async () => {
    if (!display) {
      toast.error(`Поле «${label}» пустое`);
      return;
    }
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      toast.success(`«${label}» скопировано`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onCopy}
      disabled={!display}
      className="h-auto py-1.5 px-2 text-xs justify-start gap-1.5 font-normal max-w-full"
    >
      {copied ? <Check className="w-3 h-3 text-green-500 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="truncate">{display || "—"}</span>
    </Button>
  );
};

export const OrgRequisitesBlock = ({ clientName, inn, defaultOpen = true, onInnDetected }: Props) => {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<ClientRow | null>(null);
  const [requisites, setRequisites] = useState<Requisites>({});

  // Fetch from CRM clients table on clientName / inn change
  useEffect(() => {
    if (!clientName?.trim() && !inn?.trim()) {
      setClient(null);
      setRequisites({});
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        let query = supabase.from("clients").select("id, name, inn, kpp, ogrn, legal_address, director_name, director_post").limit(5);
        if (inn?.trim()) {
          query = query.eq("inn", inn.trim());
        } else {
          query = query.ilike("name", clientName.trim());
        }
        const { data, error } = await query;
        if (cancelled) return;
        if (error) throw error;
        const found = (data?.[0] as ClientRow) || null;
        setClient(found);
        setRequisites(found ? {
          inn: found.inn, kpp: found.kpp, ogrn: found.ogrn,
          legal_address: found.legal_address, director_name: found.director_name, director_post: found.director_post,
        } : (inn ? { inn } : {}));
        if (found?.inn && !inn) onInnDetected?.(found.inn);
      } catch (e) {
        console.error("[OrgRequisites] fetch", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [clientName, inn]);

  const refreshFromDadata = async () => {
    const search = (requisites.inn || inn || clientName || "").trim();
    if (!search) return toast.error("Нет данных для поиска");
    setRefreshing(true);
    try {
      const isInn = /^\d{10,12}$/.test(search);
      const { data, error } = await supabase.functions.invoke("dadata-lookup", {
        body: isInn ? { inn: search } : { query: search },
      });
      if (error) throw error;
      if (!data?.found) {
        toast.error("Не найдено в DaData");
        return;
      }
      const fresh: Requisites = {
        inn: data.inn || requisites.inn,
        kpp: data.kpp || requisites.kpp,
        ogrn: data.ogrn || requisites.ogrn,
        legal_address: data.address || requisites.legal_address,
        director_name: data.management_name || requisites.director_name,
        director_post: data.management_post || requisites.director_post,
      };
      setRequisites(fresh);
      if (fresh.inn && !inn) onInnDetected?.(fresh.inn);
      toast.success("Реквизиты обновлены из DaData");
    } catch {
      toast.error("Ошибка запроса DaData");
    } finally {
      setRefreshing(false);
    }
  };

  const saveToClients = async () => {
    if (!clientName?.trim()) return toast.error("Укажите название организации");
    setSaving(true);
    try {
      const payload = {
        name: clientName.trim(),
        inn: requisites.inn || null,
        kpp: requisites.kpp || null,
        ogrn: requisites.ogrn || null,
        legal_address: requisites.legal_address || null,
        director_name: requisites.director_name || null,
        director_post: requisites.director_post || null,
      };
      if (client) {
        const { error } = await supabase.from("clients").update(payload).eq("id", client.id);
        if (error) throw error;
        toast.success("Реквизиты клиента обновлены");
      } else {
        const { data, error } = await supabase.from("clients").insert(payload).select("id, name").single();
        if (error) throw error;
        setClient({ ...payload, id: data!.id, name: data!.name } as ClientRow);
        toast.success("Клиент создан в CRM");
      }
    } catch (e: any) {
      toast.error(`Ошибка сохранения: ${e?.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  const hasAny = !!(requisites.inn || requisites.kpp || requisites.ogrn || requisites.legal_address || requisites.director_name);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-border/60 rounded-md bg-muted/20">
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? "" : "-rotate-90"}`} />
            <Database className="w-4 h-4" />
            Реквизиты организации
            {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            {client && <span className="text-[11px] text-muted-foreground">(из CRM)</span>}
          </button>
        </CollapsibleTrigger>
        <Button type="button" variant="ghost" size="sm" onClick={refreshFromDadata} disabled={refreshing || (!requisites.inn && !inn && !clientName)} className="h-7 gap-1.5 text-xs">
          {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          DaData
        </Button>
      </div>
      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-2">
          {!hasAny && !loading ? (
            <p className="text-xs text-muted-foreground">Реквизиты не загружены. Нажмите «DaData» или впишите ИНН выше.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              <Chip field="inn" value={requisites.inn} />
              <Chip field="kpp" value={requisites.kpp} />
              <Chip field="ogrn" value={requisites.ogrn} />
              <Chip field="legal_address" value={requisites.legal_address} />
              <Chip field="director_post" value={requisites.director_post} />
              <Chip field="director_name" value={requisites.director_name} />
            </div>
          )}
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-muted-foreground">
              {client ? "✓ Клиент в CRM" : "ⓘ Клиент не найден в CRM"}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={saveToClients} disabled={saving || !clientName?.trim()} className="h-7 gap-1.5 text-xs">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : client ? <Save className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
              {client ? "Обновить в CRM" : "Сохранить в клиенты"}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default OrgRequisitesBlock;