const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DADATA_KEY = Deno.env.get("DADATA_API_KEY");
const DADATA_SECRET = Deno.env.get("DADATA_SECRET_KEY");

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
  console.log("[dadata] fetching", inn);
  try {
    const ctrl = AbortSignal.timeout(10000);
    const r = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${DADATA_KEY}`,
        ...(DADATA_SECRET ? { "X-Secret": DADATA_SECRET } : {}),
      },
      body: JSON.stringify({ query: inn, count: 1 }),
      signal: ctrl,
    });
    console.log("[dadata] status", r.status);
    if (!r.ok) return null;
    const j = await r.json();
    return j?.suggestions?.[0] ?? null;
  } catch (e) {
    console.error("dadata error", e);
    return null;
  }
}

async function getCachedLicense(inn: string) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rosobrnadzor_licenses?inn=eq.${inn}&select=*`, {
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const arr = await r.json();
    return Array.isArray(arr) ? arr[0] ?? null : null;
  } catch (e) { console.error("cache read", e); return null; }
}

async function upsertLicense(payload: Record<string, unknown>) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rosobrnadzor_licenses?on_conflict=inn`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) { console.error("cache write", e); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const inn = String(body?.inn ?? "").trim();
    console.log("[parse] start", inn);
    if (!/^\d{10}$|^\d{12}$/.test(inn)) {
      return new Response(JSON.stringify({ error: "Bad INN" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[parse] calling dadata + cache");
    const [dadataSug, lic] = await Promise.all([fetchDadataById(inn), getCachedLicense(inn)]);
    console.log("[parse] got both", { dadata: !!dadataSug, cache: !!lic });

    const dd = dadataSug?.data ?? null;

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

    if (dd) {
      await upsertLicense({
        inn,
        org_name: result.org_name,
        address: result.address,
        registry_url: result.registry_url,
        raw_json: { dadata: dd },
        fetched_at: new Date().toISOString(),
      });
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