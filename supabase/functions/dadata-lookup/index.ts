import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DADATA_API_KEY = Deno.env.get('DADATA_API_KEY');
    const DADATA_SECRET_KEY = Deno.env.get('DADATA_SECRET_KEY');

    if (!DADATA_API_KEY || !DADATA_SECRET_KEY) {
      throw new Error('DaData credentials not configured');
    }

    const { inn, query } = await req.json();
    const searchValue = inn || query;
    if (!searchValue || typeof searchValue !== 'string') {
      return new Response(JSON.stringify({ error: 'INN or query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If it looks like an INN (digits only), use findById; otherwise use suggest
    const isInn = /^\d{10,12}$/.test(searchValue.trim());
    const url = isInn
      ? 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party'
      : 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${DADATA_API_KEY}`,
        'X-Secret': DADATA_SECRET_KEY,
      },
      body: JSON.stringify({ query: searchValue.trim(), count: 1 }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`DaData API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    const suggestion = data.suggestions?.[0];
    if (!suggestion) {
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = {
      found: true,
      name: suggestion.value,
      name_short: suggestion.data?.name?.short_with_opf || suggestion.value,
      inn: suggestion.data?.inn,
      kpp: suggestion.data?.kpp,
      ogrn: suggestion.data?.ogrn,
      address: suggestion.data?.address?.unrestricted_value || suggestion.data?.address?.value,
      management_name: suggestion.data?.management?.name,
      management_post: suggestion.data?.management?.post,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('DaData lookup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
