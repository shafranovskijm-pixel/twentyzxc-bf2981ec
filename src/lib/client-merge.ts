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

const normalizeDigits = (value: unknown): string => String(value || "").replace(/\D/g, "");
const normalizeText = (value: unknown): string => String(value || "").trim().toLowerCase();

/**
 * Find existing clients that can be manually merged with the opened card.
 * With an empty query only likely duplicates are returned; a query searches all
 * other clients by organisation, INN, contact, phone and email.
 */
export function findClientMergeCandidates<T extends MergeableClient>(
  clients: T[],
  sourceClientId: string,
  query: string,
): T[] {
  const source = clients.find((client) => client.id === sourceClientId);
  if (!source) return [];

  const sourceInn = normalizeDigits(source.inn);
  const sourcePhone = normalizeDigits(source.phone);
  const sourceEmail = normalizeText(source.email);
  const sourceName = normalizeClientKey(source.name);
  const sourceCompactName = sourceName.replace(/\s/g, "");
  const queryText = normalizeText(query);
  const queryName = normalizeClientKey(query);
  const queryDigits = normalizeDigits(query);

  const score = (candidate: T): number => {
    const candidateInn = normalizeDigits(candidate.inn);
    const candidatePhone = normalizeDigits(candidate.phone);
    const candidateEmail = normalizeText(candidate.email);
    const candidateName = normalizeClientKey(candidate.name);
    const candidateCompactName = candidateName.replace(/\s/g, "");
    let value = 0;

    if (sourceInn && sourceInn === candidateInn) value += 100;
    if (sourceName && sourceName === candidateName) value += 80;
    else if (sourceCompactName && sourceCompactName === candidateCompactName) value += 70;
    if (sourceEmail && sourceEmail === candidateEmail) value += 60;
    if (sourcePhone.length >= 7 && sourcePhone === candidatePhone) value += 50;

    return value;
  };

  const matchesQuery = (candidate: T): boolean => {
    if (!queryText) return score(candidate) > 0;

    const textValues = [
      candidate.name,
      candidate.inn,
      candidate.contact_person,
      candidate.phone,
      candidate.email,
    ].map(normalizeText);
    const candidateName = normalizeClientKey(candidate.name);
    const candidateDigits = [candidate.inn, candidate.phone].map(normalizeDigits);

    return textValues.some((value) => value.includes(queryText))
      || (!!queryName && candidateName.includes(queryName))
      || (queryDigits.length >= 4 && candidateDigits.some((value) => value.includes(queryDigits)));
  };

  return clients
    .filter((candidate) => candidate.id !== sourceClientId && matchesQuery(candidate))
    .sort((left, right) => {
      const scoreDifference = score(right) - score(left);
      if (scoreDifference) return scoreDifference;
      return left.name.localeCompare(right.name, "ru");
    });
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
