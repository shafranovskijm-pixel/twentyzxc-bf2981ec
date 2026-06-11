import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const FIRECRAWL = 'https://api.firecrawl.dev/v2';

type LeadOut = {
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  source: string;
  category: string;
};

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(?:\+7|8)[\s\-(]*\d{3}[\s\-)]*\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g;

const BAD_EMAIL_DOMAINS = ['sentry.io', 'wixpress.com', 'example.com', 'tilda.cc', 'wix.com'];

function pickEmail(text: string): string | null {
  const all = [...new Set(text.match(EMAIL_RE) ?? [])];
  const good = all.find(e => {
    const d = e.split('@')[1].toLowerCase();
    return !BAD_EMAIL_DOMAINS.some(b => d.includes(b)) && !/\.(png|jpg|jpeg|svg|webp|gif)$/i.test(e);
  });
  return good ?? null;
}
function pickPhone(text: string): string | null {
  const m = text.match(PHONE_RE);
  return m ? m[0].trim() : null;
}

async function fcSearch(query: string, limit: number, apiKey: string) {
  const r = await fetch(`${FIRECRAWL}/search`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit, lang: 'ru', country: 'ru' }),
  });
  if (!r.ok) throw new Error(`Firecrawl search ${r.status}: ${await r.text()}`);
  const j = await r.json();
  // v2 may return { data: { web: [...] } } or { data: [...] }
  const data = j?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.web)) return data.web;
  return [];
}

async function fcScrape(url: string, apiKey: string): Promise<string> {
  try {
    const r = await fetch(`${FIRECRAWL}/scrape`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: false, waitFor: 800 }),
    });
    if (!r.ok) return '';
    const j = await r.json();
    return j?.data?.markdown ?? j?.markdown ?? '';
  } catch { return ''; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) throw new Error('FIRECRAWL_API_KEY is not configured');

    const body = await req.json().catch(() => ({}));
    const region: string = body.region || 'Москва';
    const orgType: string = body.orgType || 'учебный центр ДПО';
    const extra: string = body.extra || '';
    const limit: number = Math.min(Math.max(Number(body.limit) || 10, 1), 25);
    const enrich: boolean = body.enrich !== false;

    const query = [orgType, region, extra, 'контакты email телефон'].filter(Boolean).join(' ');
    const results = await fcSearch(query, limit, apiKey);

    const leads: LeadOut[] = [];
    for (const r of results) {
      const url: string = r.url || r.link || '';
      const title: string = r.title || r.name || url;
      const descr: string = r.description || r.snippet || '';
      if (!url) continue;

      let host = '';
      try { host = new URL(url).origin; } catch {}

      let text = `${title}\n${descr}`;
      let email: string | null = null;
      let phone: string | null = null;

      if (enrich && host) {
        const main = await fcScrape(host, apiKey);
        text += '\n' + main;
        email = pickEmail(text);
        phone = pickPhone(text);
        // Try /contacts page if missing
        if (!email || !phone) {
          for (const path of ['/contacts', '/contact', '/kontakty', '/о-нас', '/about']) {
            const extra = await fcScrape(host + path, apiKey);
            if (extra) {
              text += '\n' + extra;
              email = email || pickEmail(extra);
              phone = phone || pickPhone(extra);
              if (email && phone) break;
            }
          }
        }
      } else {
        email = pickEmail(text);
        phone = pickPhone(text);
      }

      leads.push({
        name: title.replace(/\s*[-—|]\s*.+$/, '').slice(0, 200),
        website: host || url,
        email,
        phone,
        address: null,
        city: region,
        region,
        source: `Firecrawl: ${orgType}`,
        category: 'education',
      });
    }

    return new Response(JSON.stringify({ success: true, leads, query }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});