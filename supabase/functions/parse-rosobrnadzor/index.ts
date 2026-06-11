// Парсер реестра лицензий islod.obrnadzor.gov.ru
// Поддерживает: lookup по ИНН (POST /search) + fetch детальной карточки /view/{id}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const UA = "Mozilla/5.0 (compatible; 24zxc-crm/2.0)";
const REGISTRY_BASE = "https://islod.obrnadzor.gov.ru";

type LicenseRow = {
  view_id: string;
  org_name: string;
  reg_number: string;
  order_text: string;
  order_date: string | null; // ISO yyyy-mm-dd
  validity: string;
  status: string;
};

function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(s: string) {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function parseDate(s: string): string | null {
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function parseRows(html: string): LicenseRow[] {
  const rows: LicenseRow[] = [];
  const tbody = html.match(/<tbody[^>]*id="licenses"[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbody) return rows;
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = trRe.exec(tbody[1])) !== null) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x => x[1]);
    if (tds.length < 5) continue;
    const idMatch = tds[0].match(/\/view\/(\d+)/);
    const orderText = stripTags(tds[2]);
    rows.push({
      view_id: idMatch?.[1] ?? "",
      org_name: stripTags(tds[0]),
      reg_number: stripTags(tds[1]),
      order_text: orderText,
      order_date: parseDate(orderText),
      validity: stripTags(tds[3]),
      status: stripTags(tds[4]),
    });
  }
  return rows;
}

async function searchRegistry(params: Record<string, string>): Promise<LicenseRow[]> {
  const body = new URLSearchParams(params).toString();
  const r = await fetch(`${REGISTRY_BASE}/search`, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${REGISTRY_BASE}/rlic`,
      Accept: "*/*",
    },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`registry ${r.status}`);
  const html = await r.text();
  return parseRows(html);
}

async function fetchDetail(viewId: string): Promise<Record<string, string>> {
  const r = await fetch(`${REGISTRY_BASE}/view/${viewId}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return {};
  const html = await r.text();
  const fields: Record<string, string> = {};
  // Парсим пары: <label class="form-label">KEY</label>...<form-field...>VAL</...>
  const re = /form-label[^>]*>([^<]+)<\/label>[\s\S]{0,400}?form-field[^>]*>([\s\S]{0,600}?)<\/div>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const key = stripTags(m[1]).toLowerCase().replace(/\s+/g, "_");
    const val = stripTags(m[2]);
    if (val && !fields[key]) fields[key] = val;
  }
  // Резервный извлекатель: вытащим ИНН/ОГРН/email/телефон из всего HTML
  const plain = stripTags(html);
  if (!fields["инн"]) {
    const m1 = plain.match(/ИНН[^\d]{0,10}(\d{10}|\d{12})/i);
    if (m1) fields["инн"] = m1[1];
  }
  if (!fields["огрн"]) {
    const m2 = plain.match(/ОГРН[^\d]{0,10}(\d{13}|\d{15})/i);
    if (m2) fields["огрн"] = m2[1];
  }
  const em = plain.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (em) fields["email"] = em[0];
  const ph = plain.match(/(?:\+7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/);
  if (ph) fields["phone"] = ph[0].replace(/\s+/g, " ");
  return fields;
}

async function upsertCache(payload: Record<string, unknown>) {
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
    const mode = String(body?.mode ?? "by_inn");

    // === Режим: поиск по ИНН (или по названию) ===
    if (mode === "by_inn") {
      const query = String(body?.inn ?? body?.query ?? "").trim();
      if (!query) {
        return new Response(JSON.stringify({ error: "inn or query required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const rows = await searchRegistry({ eoName: query, p: "1" });
      // Выбираем «лучшую»: активную (Действующая) с самой свежей датой приказа
      const active = rows.filter(r => /действующ/i.test(r.status));
      const sorted = (active.length ? active : rows).sort((a, b) =>
        (b.order_date ?? "").localeCompare(a.order_date ?? "")
      );
      const best = sorted[0] ?? null;
      let detail: Record<string, string> = {};
      if (best?.view_id && body?.fetchDetail !== false) {
        detail = await fetchDetail(best.view_id);
      }

      const result = {
        found: !!best,
        query,
        rows,
        best,
        detail,
        // плоские поля для удобства фронта
        license_number: best?.reg_number ?? null,
        license_date: best?.order_date ?? null,
        license_status: best?.status ?? null,
        org_name: best?.org_name ?? null,
        registry_url: best ? `${REGISTRY_BASE}/view/${best.view_id}` : `${REGISTRY_BASE}/rlic`,
        address: detail["место_нахождения_организации"] ?? null,
        phone_email: detail["телефон,_адрес_электронной_почты"] ?? null,
      };

      // Кэшируем только если есть валидный ИНН (10/12 цифр)
      if (best && /^\d{10}$|^\d{12}$/.test(query)) {
        await upsertCache({
          inn: query,
          org_name: best.org_name,
          license_number: best.reg_number,
          license_date: best.order_date,
          license_status: best.status,
          address: result.address,
          registry_url: result.registry_url,
          raw_json: { rows, detail },
          fetched_at: new Date().toISOString(),
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Режим: свежие лицензии по региону ===
    if (mode === "recent") {
      const region = String(body?.region ?? "77"); // Москва по умолчанию
      const pages = Math.min(Math.max(1, Number(body?.pages ?? 3)), 10);
      const limit = Math.min(Math.max(1, Number(body?.limit ?? 10)), 50);
      const withDetails = body?.withDetails !== false;
      const since = body?.since ? String(body.since) : null; // 'YYYY-MM-DD'
      const all: LicenseRow[] = [];
      for (let p = 1; p <= pages; p++) {
        try {
          const rows = await searchRegistry({ region, status: "6", p: String(p) });
          if (!rows.length) break;
          all.push(...rows);
        } catch (e) { console.error("search page", p, e); break; }
        if (all.length >= limit * 2) break;
        await new Promise(r => setTimeout(r, 250));
      }
      const filtered = since
        ? all.filter(r => r.order_date && r.order_date >= since)
        : all;
      filtered.sort((a, b) => (b.order_date ?? "").localeCompare(a.order_date ?? ""));
      const top = filtered.slice(0, limit);
      const enriched: any[] = [];
      for (const row of top) {
        let detail: Record<string, string> = {};
        if (withDetails && row.view_id) {
          try { detail = await fetchDetail(row.view_id); } catch {}
          await new Promise(r => setTimeout(r, 200));
        }
        enriched.push({
          ...row,
          registry_url: `${REGISTRY_BASE}/view/${row.view_id}`,
          inn: detail["инн"] ?? null,
          ogrn: detail["огрн"] ?? null,
          address: detail["место_нахождения_организации"] ?? detail["место_нахождения"] ?? null,
          email: detail["email"] ?? null,
          phone: detail["phone"] ?? null,
          director: detail["руководитель"] ?? null,
          detail,
        });
      }
      return new Response(JSON.stringify({ region, total: all.length, results: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown mode" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-rosobrnadzor error", e);
    return new Response(JSON.stringify({ error: String((e as any)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});