export interface IncomingLead {
  id: string;
  source: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: string | null;
  created_at: string | null;
}

export const INCOMING_LEAD_FIELDS = "id,source,name,phone,email,message,status,created_at";
export const INCOMING_LEADS_BATCH_SIZE = 200;

type LeadPage = { data: IncomingLead[] | null; error: unknown };
type LoadPage = (from: number, to: number) => PromiseLike<LeadPage>;

// Supabase limits a single response. Read each batch so older enquiries remain
// searchable; keep the search term in memory instead of adding PII to URLs.
export async function loadIncomingLeads(loadPage: LoadPage, signal?: AbortSignal): Promise<IncomingLead[]> {
  const leads = new Map<string, IncomingLead>();
  for (let from = 0; ; from += INCOMING_LEADS_BATCH_SIZE) {
    signal?.throwIfAborted();
    const { data, error } = await loadPage(from, from + INCOMING_LEADS_BATCH_SIZE - 1);
    if (error) throw error;
    if (!data) throw new Error("Incoming enquiries could not be loaded");
    for (const lead of data) leads.set(lead.id, lead);
    if (data.length < INCOMING_LEADS_BATCH_SIZE) return [...leads.values()];
  }
}

export function filterIncomingLeads(leads: IncomingLead[], status: string, search: string): IncomingLead[] {
  const query = search.trim().toLocaleLowerCase("ru-RU");
  const phoneQuery = /^[+\d\s().-]+$/.test(query) ? query.replace(/\D/g, "") : "";
  return leads.filter((lead) => {
    if (status !== "all" && lead.status !== status) return false;
    if (!query) return true;
    const text = [lead.id, lead.name, lead.email, lead.phone, lead.message, lead.source]
      .filter(Boolean).join("\n").toLocaleLowerCase("ru-RU");
    return text.includes(query) ||
      (phoneQuery.length >= 3 && (lead.phone || "").replace(/\D/g, "").includes(phoneQuery));
  });
}
