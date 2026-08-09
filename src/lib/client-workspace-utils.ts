/** Pure helpers for the client workspace (Sheet) and CRM ↔ proposals navigation. */

export type ProposalLike = {
  id: string;
  client_org?: string | null;
  client_name?: string | null;
};

/** Normalize a name for comparison: trim, collapse spaces, lowercase, drop quotes. */
export function normalizeOrgName(value: string | null | undefined): string {
  return (value || "")
    .replace(/[«»"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Pick only the proposals that belong to a CRM client.
 * Primary match is `client_org` vs the CRM organisation name; when a proposal has
 * no organisation we fall back to `client_name` (organisation or contact person).
 */
export function matchClientProposals<T extends ProposalLike>(
  proposals: T[],
  client: { name: string; contactPerson?: string | null },
): T[] {
  const org = normalizeOrgName(client.name);
  if (!org) return [];
  const contact = normalizeOrgName(client.contactPerson);
  return proposals.filter((p) => {
    const pOrg = normalizeOrgName(p.client_org);
    if (pOrg) return pOrg === org;
    const pName = normalizeOrgName(p.client_name);
    if (!pName) return false;
    return pName === org || (!!contact && pName === contact);
  });
}

export type ProposalsEntry = { view: "list" | "editor"; editingId: string | null };

/** Decide what the proposals section should show when entered with navigation params. */
export function resolveProposalsEntry(params: {
  initialProposalId?: string | null;
  autoOpenNew?: boolean;
}): ProposalsEntry {
  if (params.initialProposalId) return { view: "editor", editingId: params.initialProposalId };
  if (params.autoOpenNew) return { view: "editor", editingId: null };
  return { view: "list", editingId: null };
}

/** Prefill payload for a brand-new proposal opened from a CRM client. */
export function buildProposalPrefill(client: {
  name?: string | null;
  contact_person?: string | null;
  director_name?: string | null;
  email?: string | null;
  phone?: string | null;
} | null | undefined) {
  if (!client) return null;
  return {
    clientOrg: client.name || "",
    clientName: client.contact_person || client.director_name || "",
    clientEmail: client.email || "",
    clientPhone: client.phone || "",
  };
}
