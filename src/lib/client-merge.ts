/** Pure helpers for detecting and merging duplicate CRM clients. */

export type MergeableClient = {
  id: string;
  name: string;
  created_at?: string | null;
  [key: string]: any;
};

/** Normalize an organisation name for duplicate detection. */
export function normalizeClientKey(value: string | null | undefined): string {
  return (value || "")
    .replace(/ё/gi, "е")
    .replace(/[«»"'`.,()–—-]/g, " ")
    .replace(/\b(ооо|оао|зао|ао|ип|нко|ану|ано|учреждение)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Fields copied from duplicates into the primary record when the primary is empty. */
export const MERGE_FIELDS = [
  "contact_person", "phone", "email", "telegram", "service_type",
  "frdo_login", "frdo_password", "frdo_password_po",
  "payment_date", "service_deadline",
  "inn", "kpp", "ogrn", "legal_address", "director_name", "director_post",
] as const;

/** Group clients that look like the same organisation (same INN, or same normalized name). */
export function findDuplicateGroups<T extends MergeableClient>(clients: T[]): T[][] {
  const parent = clients.map((_, index) => index);
  const find = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };
  const unionAll = (indices: number[]) => {
    for (let index = 1; index < indices.length; index += 1) union(indices[0], indices[index]);
  };

  const byInn = new Map<string, number[]>();
  const byName = new Map<string, number[]>();
  clients.forEach((client, index) => {
    const inn = (client.inn || "").replace(/\D/g, "");
    const name = normalizeClientKey(client.name);
    if (inn) byInn.set(inn, [...(byInn.get(inn) || []), index]);
    if (name) byName.set(name, [...(byName.get(name) || []), index]);
  });

  // A matching INN is definitive even when organisation names were entered differently.
  byInn.forEach(unionAll);

  // A matching name is safe when records have no conflicting INNs. This also catches
  // the common case where one duplicate has requisites and the other does not.
  byName.forEach((indices) => {
    const distinctInns = new Set(
      indices
        .map((index) => (clients[index].inn || "").replace(/\D/g, ""))
        .filter(Boolean),
    );
    if (distinctInns.size <= 1) unionAll(indices);
  });

  const groups = new Map<number, T[]>();
  clients.forEach((client, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) || []), client]);
  });

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => [...group].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || "")));
}

/** Build the update payload for the primary record, filling gaps from duplicates. No data is lost. */
export function buildMergePayload<T extends MergeableClient>(primary: T, duplicates: T[]): Record<string, any> {
  const payload: Record<string, any> = {};
  for (const field of MERGE_FIELDS) {
    const current = primary[field];
    if (current !== null && current !== undefined && String(current).trim() !== "") continue;
    const donor = duplicates.find((d) => {
      const v = d[field];
      return v !== null && v !== undefined && String(v).trim() !== "";
    });
    if (donor) payload[field] = donor[field];
  }
  if (primary.no_deadline === false && duplicates.some((d) => d.no_deadline)) {
    if (!primary.service_deadline && !payload.service_deadline) payload.no_deadline = true;
  }
  const notes = [primary.notes, ...duplicates.map((d) => d.notes)]
    .map((n) => (n || "").trim())
    .filter(Boolean);
  const uniqueNotes = [...new Set(notes)];
  if (uniqueNotes.length) payload.notes = uniqueNotes.join("\n---\n");
  const names = duplicates.map((d) => (d.name || "").trim()).filter((n) => n && n !== primary.name);
  if (names.length) {
    const suffix = `Объединены дубликаты: ${[...new Set(names)].join("; ")}`;
    payload.notes = payload.notes ? `${payload.notes}\n${suffix}` : suffix;
  }
  return payload;
}
