import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const FIRECRAWL = 'https://api.firecrawl.dev/v2';
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /(?:\+7|8)[\s\-(]*\d{3}[\s\-)]*\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g;
const BAD = ['sentry.io', 'wixpress.com', 'example.com', 'tilda.cc', 'wix.com'];

function pickEmail(t: string) {
  const all = [...new Set(t.match(EMAIL_RE) ?? [])];
  return all.find(e => {
    const d = e.split('@')[1].toLowerCase();
    return !BAD.some(b => d.includes(b)) && !/\.(png|jpg|jpeg|svg|webp|gif)$/i.test(e);
  }) ?? null;
}
function pickPhone(t: string) { const m = t.match(PHONE_RE); return m ? m[0].trim() : null; }

async function scrape(url: string, apiKey: string): Promise<string> {
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
    const { website } = await req.json();
    if (!website) throw new Error('website required');

    let host = website;
    try { host = new URL(website.startsWith('http') ? website : 'https://' + website).origin; } catch {}

    let text = await scrape(host, apiKey);
    let email = pickEmail(text);
    let phone = pickPhone(text);
    if (!email || !phone) {
      for (const p of ['/contacts', '/contact', '/kontakty', '/about']) {
        const t = await scrape(host + p, apiKey);
        if (t) {
          email = email || pickEmail(t);
          phone = phone || pickPhone(t);
          if (email && phone) break;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, email, phone, website: host }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});