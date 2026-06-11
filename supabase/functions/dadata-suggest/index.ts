import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DADATA_KEY = Deno.env.get("DADATA_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { query, count = 7 } = await req.json().catch(() => ({ query: "" }));
    const q = String(query ?? "").trim();
    if (q.length < 2) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!DADATA_KEY) {
      return new Response(JSON.stringify({ error: "DADATA_API_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${DADATA_KEY}`,
      },
      body: JSON.stringify({ query: q, count, status: ["ACTIVE"] }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ error: "dadata_failed", status: r.status, body: txt.slice(0, 300) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await r.json();
    const suggestions = (j?.suggestions ?? []).map((s: any) => ({
      value: s.value,
      name: s.data?.name?.short_with_opf || s.data?.name?.full_with_opf || s.value,
      inn: s.data?.inn ?? null,
      kpp: s.data?.kpp ?? null,
      ogrn: s.data?.ogrn ?? null,
      address: s.data?.address?.unrestricted_value ?? null,
      management: s.data?.management?.name ?? null,
      email: s.data?.emails?.[0]?.value ?? null,
      phone: s.data?.phones?.[0]?.value ?? null,
    }));
    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dadata-suggest error", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});