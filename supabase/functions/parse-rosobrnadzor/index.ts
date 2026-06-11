import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DADATA_KEY = Deno.env.get("DADATA_API_KEY");
const DADATA_SECRET = Deno.env.get("DADATA_SECRET_KEY");

interface ParseResult {
  inn: string;
  found: boolean;
  org_name?: string | null;
  address?: string | null;
  license_number?: string | null;
  license_date?: string | null;
  license_status?: string | null;
  registry_url?: string | null;
  email?: string | null;
  phone?: string | null;
  raw?: unknown;
}

async function fetchDadata(inn: string) {
  if (!DADATA_KEY) return null;
  try {
    const r = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${DADATA_KEY}`,
      },
      body: JSON.stringify({ query: inn, count: 1 }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.suggestions?.[0] ?? null;
  } catch {
    return null;
  }
}

// Rosobrnadzor public search (open data of accreditation/license registry)
// The portal isga.obrnadzor.gov.ru exposes JSON via /api/v1/search
async function fetchRosobr(inn: string) {
  const tryUrls = [
    `https://isga.obrnadzor.gov.ru/api/v1/search?inn=${encodeURIComponent(inn)}`,
    `https://islod.obrnadzor.gov.ru/api/v1/search?inn=${encodeURIComponent(inn)}`,
  ];
  for (const url of tryUrls) {
    try {
      const r = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; 24zxc-crm/1.0)",
        },
      });
      if (!r.ok) continue;
      const text = await r.text();
      try {
        const j = JSON.parse(text);
        return { url, data: j };
      } catch {
        // not JSON — return raw HTML so caller can still cache the registry URL
        return { url, data: { raw_html_len: text.length } };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function pickLicense(rosobr: any) {
  if (!rosobr) return {};
  const item = Array.isArray(rosobr?.items) ? rosobr.items[0]
    : Array.isArray(rosobr?.data) ? rosobr.data[0]
    : Array.isArray(rosobr?.result) ? rosobr.result[0]
    : null;
  if (!item) return {};
  return {
    license_number: item.RegNumber ?? item.regNumber ?? item.number ?? null,
    license_date: item.RegDate ?? item.regDate ?? item.date ?? null,
    license_status: item.StatusName ?? item.statusName ?? item.status ?? null,
    org_name: item.FullName ?? item.fullName ?? item.name ?? null,
    address: item.Address ?? item.address ?? null,
  };
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

    const [dadata, rosobr] = await Promise.all([fetchDadata(inn), fetchRosobr(inn)]);

    const lic = pickLicense(rosobr?.data);
    const dd = dadata?.data ?? null;

    const result: ParseResult = {
      inn,
      found: !!(dd || lic.license_number),
      org_name: lic.org_name || dd?.name?.short_with_opf || dd?.name?.full_with_opf || null,
      address: lic.address || dd?.address?.unrestricted_value || null,
      license_number: lic.license_number ?? null,
      license_date: lic.license_date ?? null,
      license_status: lic.license_status ?? null,
      registry_url: rosobr?.url ?? `https://isga.obrnadzor.gov.ru/?inn=${inn}`,
      email: dd?.emails?.[0]?.value ?? null,
      phone: dd?.phones?.[0]?.value ?? null,
      raw: { dadata: dd, rosobr: rosobr?.data ?? null },
    };

    // cache
    await supabase.from("rosobrnadzor_licenses").upsert({
      inn,
      org_name: result.org_name,
      license_number: result.license_number,
      license_date: result.license_date && /^\d{4}-\d{2}-\d{2}/.test(String(result.license_date))
        ? String(result.license_date).slice(0, 10)
        : null,
      license_status: result.license_status,
      address: result.address,
      registry_url: result.registry_url,
      raw_json: result.raw as any,
      fetched_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});