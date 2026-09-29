import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../integrations/supabase/types";

const CARD_DOCUMENT_FIELDS = "id,doc_type,doc_number,doc_date,total_amount,html_content,created_at";

/** Legal document snapshots keep their original names when a client is renamed. */
export async function loadClientCardDocuments(db: SupabaseClient<Database>, clientId: string, clientName: string) {
  if (!clientId) return [];
  const [linked, names] = await Promise.all([
    db.from("generated_documents").select(CARD_DOCUMENT_FIELDS).eq("client_id", clientId)
      .order("created_at", { ascending: false }).order("id").limit(20),
    db.from("clients").select("id").eq("name", clientName).limit(2),
  ]);
  if (linked.error) throw linked.error;
  if (names.error) throw names.error;
  // A name-only legacy association is usable only when it identifies this exact
  // saved card. Never include a document already linked to a different UUID.
  if (names.data?.length !== 1 || names.data[0].id !== clientId) return linked.data || [];
  const legacy = await db.from("generated_documents").select(CARD_DOCUMENT_FIELDS)
    .is("client_id", null).eq("client_name", clientName)
    .order("created_at", { ascending: false }).order("id").limit(20);
  if (legacy.error) throw legacy.error;
  return [...(linked.data || []), ...(legacy.data || [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id))
    .slice(0, 20);
}
