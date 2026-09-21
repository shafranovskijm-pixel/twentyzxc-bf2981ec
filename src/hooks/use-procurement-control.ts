import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const NAMESPACE = "24zxc.procurement-control";
const COLUMNS = "id,title,description,updated_at";
export type ProcurementDecision = "work" | "hold" | "watch";
export type ProcurementPriority = "normal" | "high";
export type ProcurementInstruction = {
  decision: ProcurementDecision;
  priority: ProcurementPriority;
  note: string;
};
export type ProcurementControl = ProcurementInstruction & {
  id: string;
  number: string;
  sourceHref: string;
  updatedAt: string;
};
export type ProcurementReference = { number: string; title: string; href: string };
type TaskRow = { id: string; title: string; description: string | null; updated_at: string };

export const instructionPrefix = (number: string) => `[Тендер:${number}] `;
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

// UUIDv8 reserves one new task ID per exact tender number. The existing tasks
// primary key makes concurrent first inserts atomic without a schema change.
// Historical tasks keep their original IDs through the verified mapping below.
export async function procurementTaskId(number: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${NAMESPACE}:1:${number}`))).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function readProcurementControl(row: TaskRow, number: string): ProcurementControl | null {
  if (!row.title.startsWith(instructionPrefix(number)) || !row.description || !row.id || !row.updated_at) return null;
  try {
    const data = JSON.parse(row.description);
    if (data.namespace !== NAMESPACE || data.version !== 1 || data.number !== number
      || !["work", "hold", "watch"].includes(data.decision)
      || !["normal", "high"].includes(data.priority)
      || typeof data.note !== "string" || data.note.length > 4000 || typeof data.sourceHref !== "string") return null;
    return { id: row.id, number, decision: data.decision, priority: data.priority, note: data.note, sourceHref: data.sourceHref, updatedAt: row.updated_at };
  } catch { return null; }
}

async function matchingTasks(number: string) {
  const { data, error } = await supabase.from("tasks").select(COLUMNS)
    .like("title", `${escapeLike(instructionPrefix(number))}%`).limit(100);
  if (error) throw new Error("Не удалось прочитать поручения из CRM. Проверьте вход администратора и повторите обновление.");
  if (!data || data.length >= 100) throw new Error("CRM не вернула однозначный список поручений. Сохранение остановлено.");
  return (data as TaskRow[]).flatMap((row) => {
    const control = readProcurementControl(row, number);
    return control ? [{ row, control }] : [];
  });
}

export async function saveProcurementInstruction(
  tender: ProcurementReference,
  input: ProcurementInstruction,
  expected?: ProcurementControl,
): Promise<ProcurementControl> {
  if (!tender.number || tender.number.length > 200 || !tender.title || tender.title.length > 1000
    || !["work", "hold", "watch"].includes(input.decision)
    || !["normal", "high"].includes(input.priority) || input.note.length > 4000) {
    throw new Error("Проверьте решение, приоритет и длину заметки (до 4000 символов).");
  }
  const source = new URL(tender.href);
  if (source.protocol !== "https:" || source.username || source.password) throw new Error("Источник должен быть публичной HTTPS-ссылкой.");
  const existing = await matchingTasks(tender.number);
  if (existing.length > 1) throw new Error("В CRM несколько поручений по этому номеру. Сначала устраните дубликаты в планере.");
  const current = existing[0];
  if (expected ? (!current || current.control.id !== expected.id || current.control.updatedAt !== expected.updatedAt) : Boolean(current)) {
    throw new Error("Поручение изменилось в CRM. Обновите поручения и проверьте данные перед сохранением.");
  }
  const payload = {
    namespace: NAMESPACE, version: 1, number: tender.number,
    decision: input.decision, priority: input.priority, note: input.note.trim(), sourceHref: tender.href,
  };
  const fields = { title: `${instructionPrefix(tender.number)}${tender.title}`, description: JSON.stringify(payload), updated_at: new Date().toISOString() };
  const expectedId = current?.row.id ?? await procurementTaskId(tender.number);
  const response = current
    ? await supabase.from("tasks").update(fields).eq("id", current.row.id)
      .eq("updated_at", current.row.updated_at).eq("title", current.row.title)
      .eq("description", current.row.description!).select(COLUMNS).single()
    : await supabase.from("tasks").insert({ id: expectedId, ...fields, status: "todo", sort_order: 0,
      task_date: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Vladivostok" }),
      client_id: null, contract_id: null }).select(COLUMNS).single();
  if (response.error || !response.data) throw new Error("CRM не подтвердила сохранение. Возможно, запись уже изменена. Обновите поручения перед повторной попыткой.");
  const saved = readProcurementControl(response.data as TaskRow, tender.number);
  if (!saved || saved.id !== expectedId
    || saved.decision !== payload.decision || saved.priority !== payload.priority
    || saved.note !== payload.note || saved.sourceHref !== payload.sourceHref
    || response.data.title !== fields.title || !Number.isFinite(Date.parse(saved.updatedAt))) {
    throw new Error("Ответ CRM не совпал с поручением. Сохранение не подтверждено; обновите данные.");
  }
  return saved;
}

export function useProcurementControl({ enabled, userId, numbers }: { enabled: boolean; userId?: string; numbers: string[] }) {
  const queryClient = useQueryClient();
  const canRead = enabled && Boolean(userId);
  const uniqueNumbers = [...new Set(numbers)].sort();
  const queryKey = ["procurement-control", userId ?? "anonymous", uniqueNumbers];
  const query = useQuery({
    queryKey,
    enabled: canRead,
    staleTime: 30_000,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // The runtime guard also protects explicit refetch calls while signed out.
      if (!canRead) throw new Error("Для поручений нужен вход администратора.");
      const items = await Promise.all(uniqueNumbers.map(async (number) => ({ number, rows: await matchingTasks(number) })));
      const byNumber: Record<string, ProcurementControl> = {};
      const conflicts: string[] = [];
      for (const { number, rows } of items) {
        if (rows.length > 1) conflicts.push(number);
        else if (rows.length === 1) byNumber[number] = rows[0].control;
      }
      return { byNumber, conflicts };
    },
  });
  const mutation = useMutation({
    mutationFn: async ({ tender, input, expected }: { tender: ProcurementReference; input: ProcurementInstruction; expected?: ProcurementControl }) => {
      if (!canRead) throw new Error("Для сохранения нужен вход администратора.");
      return saveProcurementInstruction(tender, input, expected);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, (previous: { byNumber: Record<string, ProcurementControl>; conflicts: string[] } | undefined) => ({
        byNumber: { ...previous?.byNumber, [saved.number]: saved }, conflicts: previous?.conflicts ?? [],
      }));
      void queryClient.invalidateQueries({ queryKey: ["planner-tasks"] });
    },
  });
  return {
    controls: canRead ? query.data?.byNumber ?? {} : {},
    conflicts: canRead ? query.data?.conflicts ?? [] : [],
    isLoading: canRead && query.isPending,
    isRefreshing: canRead && query.isFetching,
    error: canRead ? query.error : null,
    refetch: async () => { if (canRead) return query.refetch(); },
    save: mutation.mutateAsync,
    isSaving: canRead && mutation.isPending,
  };
}
