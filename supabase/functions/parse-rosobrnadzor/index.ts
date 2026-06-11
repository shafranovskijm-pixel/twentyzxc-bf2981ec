const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

async function fetchDadataViaInternal(inn: string) {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/dadata-lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
        apikey: SERVICE_ROLE,
      },
      body: JSON.stringify({ inn }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.found ? j : null;
  } catch (e) { console.error("dadata-lookup call", e); return null; }
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
    const [dd, lic] = await Promise.all([fetchDadataViaInternal(inn), getCachedLicense(inn)]);
    console.log("[parse] got both", { dadata: !!dd, cache: !!lic });

    const result: ParseResult = {
      inn,
      found: !!(dd || lic?.license_number),
      org_name: dd?.name_short || dd?.name || lic?.org_name || null,
      address: dd?.address || lic?.address || null,
      kpp: dd?.kpp ?? null,
      ogrn: dd?.ogrn ?? null,
      management_name: dd?.management_name ?? null,
      management_post: dd?.management_post ?? null,
      license_number: lic?.license_number ?? null,
      license_date: lic?.license_date ?? null,
      license_status: lic?.license_status ?? null,
      registry_url: lic?.registry_url ?? `https://islod.obrnadzor.gov.ru/rlic/?query=${inn}`,
      email: null,
      phone: null,
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