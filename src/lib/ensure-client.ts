import { supabase } from "@/integrations/supabase/client";

export const normalizeClientName = (value: string) => value.toLowerCase().replace(/[^a-zа-яё0-9]/g, "");

export async function ensureClient(input: {
  name: string; inn?: string; kpp?: string; ogrn?: string;
  legal_address?: string; director_name?: string; director_post?: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Укажите организацию");
  // Read fresh data rather than relying on a possibly stale editor cache.
  const rows: { id: string; name: string; inn: string | null }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("clients").select("id,name,inn").order("id").range(offset, offset + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const existing = (input.inn ? rows.find(c => c.inn === input.inn.trim()) : undefined)
    || rows.find(c => normalizeClientName(c.name) === normalizeClientName(name));
  const fields = Object.fromEntries(Object.entries(input).filter(([key, value]) => key !== "name" && value?.trim()).map(([key, value]) => [key, value?.trim()]));
  const result = existing
    ? await supabase.from("clients").update(fields).eq("id", existing.id).select("id,name").single()
    : await supabase.from("clients").insert({ name, ...fields }).select("id,name").single();
  if (result.error) throw result.error;
  return result.data;
}