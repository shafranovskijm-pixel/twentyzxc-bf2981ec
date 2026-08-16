import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Merge, Search } from "lucide-react";
import { toast } from "sonner";
import { findDuplicateGroups, buildMergePayload, type MergeableClient } from "@/lib/client-merge";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: MergeableClient[];
  onMerged: () => void;
}

/** Tables that reference clients.id and must be repointed before deleting a duplicate. */
const LINKED_TABLES: { table: string; column: string }[] = [
  { table: "client_interactions", column: "client_id" },
  { table: "sales_notes", column: "client_id" },
  { table: "tasks", column: "client_id" },
  { table: "nmo_registrations", column: "client_id" },
  { table: "tz_documents", column: "client_id" },
  { table: "leads", column: "converted_client_id" },
];

/** Legacy CRM records that reference a client by the organisation name. */
const LINKED_NAME_TABLES: { table: string; column: string }[] = [
  { table: "contracts", column: "client_name" },
  { table: "generated_documents", column: "client_name" },
  { table: "tz_documents", column: "client_name" },
  { table: "nmo_registrations", column: "organization_name" },
  { table: "proposals", column: "client_org" },
  { table: "proposals", column: "client_name" },
];

const ClientsMergeDialog = ({ open, onOpenChange, clients, onMerged }: Props) => {
  const groups = useMemo(() => findDuplicateGroups(clients), [clients]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [primaryChoice, setPrimaryChoice] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) => group.some((client) => [
      client.name,
      client.inn,
      client.contact_person,
      client.phone,
      client.email,
    ].some((value) => String(value || "").toLowerCase().includes(query))));
  }, [groups, search]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && busyKey) return;
    if (!nextOpen) {
      setSearch("");
      setPrimaryChoice({});
    }
    onOpenChange(nextOpen);
  };

  const mergeGroup = async (group: MergeableClient[], groupKey: string) => {
    const primaryId = primaryChoice[groupKey] || group[0].id;
    const primary = group.find((c) => c.id === primaryId)!;
    const duplicates = group.filter((c) => c.id !== primaryId);
    setBusyKey(primary.id);
    try {
      const payload = buildMergePayload(primary, duplicates);
      if (Object.keys(payload).length) {
        const { error } = await supabase.from("clients").update(payload as any).eq("id", primary.id);
        if (error) throw error;
      }
      for (const dup of duplicates) {
        for (const link of LINKED_TABLES) {
          const { error } = await supabase
            .from(link.table as any)
            .update({ [link.column]: primary.id } as any)
            .eq(link.column, dup.id);
          if (error) throw error;
        }
        for (const link of LINKED_NAME_TABLES) {
          const { error } = await supabase
            .from(link.table as any)
            .update({ [link.column]: primary.name } as any)
            .eq(link.column, dup.name);
          if (error) throw error;
        }
      }
      const { error: delError } = await supabase
        .from("clients")
        .delete()
        .in("id", duplicates.map((d) => d.id));
      if (delError) throw delError;
      toast.success(`Объединено: ${primary.name} (${duplicates.length + 1} записи)`);
      onMerged();
      setSearch("");
      setPrimaryChoice({});
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Не удалось объединить карточки");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Объединение дубликатов</DialogTitle>
          <DialogDescription>
            Данные не теряются: пустые поля основной карточки заполняются из дубликатов, заметки объединяются,
            договоры, документы, задачи и история переносятся на основную карточку.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Найти дубль по названию, ИНН, телефону..."
            className="pl-9"
            autoFocus
          />
        </div>

        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Дубликаты не найдены</p>
        ) : visibleGroups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">По этому запросу дубликаты не найдены</p>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {visibleGroups.map((group) => {
              const groupKey = group.map((client) => client.id).sort().join(":");
              const primaryId = primaryChoice[groupKey] || group[0].id;
              return (
                <div key={groupKey} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{group[0].name}</span>
                    <Badge variant="outline" className="text-[10px]">{group.length} карточки</Badge>
                  </div>
                  <div className="space-y-1">
                    {group.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 rounded px-1 py-1 text-xs hover:bg-muted cursor-pointer">
                        <input
                          type="radio"
                          name={`primary-${groupKey}`}
                          checked={primaryId === c.id}
                          onChange={() => setPrimaryChoice((state) => ({ ...state, [groupKey]: c.id }))}
                        />
                        <span className="flex-1 truncate">{c.name}</span>
                        {c.inn && <span className="font-mono text-muted-foreground">{c.inn}</span>}
                        <span className="text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString("ru-RU") : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => mergeGroup(group, groupKey)} disabled={!!busyKey} className="gap-1.5">
                      {busyKey === primaryId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Merge className="w-3.5 h-3.5" />}
                      Объединить в выбранную
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientsMergeDialog;
