import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DADATA_KEY = Deno.env.get("DADATA_API_KEY");

interface ParseResult {
  inn: string;
  found: boolean;
  org_name?: string | null;
  address?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  management_name?: string | null;
  management_post?: string | null;
  license_number?: string | null;
  license_date?: string | null;
  license_status?: string | null;
  registry_url?: string | null;
  email?: string | null;
  phone?: string | null;
  raw?: unknown;
}

async function fetchDadataById(inn: string) {
  if (!DADATA_KEY) return null;
  try {
    const ctrl = AbortSignal.timeout(8000);
    const r = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${DADATA_KEY}`,
      },
      body: JSON.stringify({ query: inn, count: 1 }),
      signal: ctrl,
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.suggestions?.[0] ?? null;
  } catch (e) {
    console.error("dadata error", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const inn = String(body?.inn ?? "").trim();
    if (!/^\d{10}$|^\d{12}$/.test(inn)) {
      return new Response(JSON.stringify({ error: "Bad INN" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Parallel: DaData (контакты/реквизиты) + локальный кэш реестра Рособрнадзора
    const [dadataSug, cached] = await Promise.all([
      fetchDadataById(inn),
      supabase.from("rosobrnadzor_licenses").select("*").eq("inn", inn).maybeSingle(),
    ]);

    const dd = dadataSug?.data ?? null;
    const lic = cached.data ?? null;

    const result: ParseResult = {
      inn,
      found: !!(dd || lic?.license_number),
      org_name: dd?.name?.short_with_opf || dd?.name?.full_with_opf || lic?.org_name || null,
      address: dd?.address?.unrestricted_value || lic?.address || null,
      kpp: dd?.kpp ?? null,
      ogrn: dd?.ogrn ?? null,
      management_name: dd?.management?.name ?? null,
      management_post: dd?.management?.post ?? null,
      license_number: lic?.license_number ?? null,
      license_date: lic?.license_date ?? null,
      license_status: lic?.license_status ?? null,
      registry_url: lic?.registry_url ?? `https://islod.obrnadzor.gov.ru/rlic/?query=${inn}`,
      email: dd?.emails?.[0]?.value ?? null,
      phone: dd?.phones?.[0]?.value ?? null,
      raw: { dadata: dd, rosobrnadzor: lic ?? null },
    };

    // Кэшируем минимум — название/адрес из DaData, чтобы при следующем запросе быстро вернуть
    if (dd) {
      await supabase.from("rosobrnadzor_licenses").upsert({
        inn,
        org_name: result.org_name,
        address: result.address,
        registry_url: result.registry_url,
        raw_json: { dadata: dd },
        fetched_at: new Date().toISOString(),
      }, { onConflict: "inn", ignoreDuplicates: false });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-rosobrnadzor error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});