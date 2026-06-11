// Утилиты для импорта/дедупа лидов из XLSX/CSV

export type RawRow = Record<string, any>;

export type ImportedLead = {
  name: string;
  inn: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  city: string | null;
  region: string | null;
  address: string | null;
  license_number: string | null;
  license_date: string | null; // YYYY-MM-DD
  category: "education" | "other";
  source: string;
  notes: string | null;
  dedup_hash: string;
  status: string;
  next_step: string | null;
  _matchedField?: string;
  _isDup?: boolean;
};

// Словарь синонимов для автоматического mapping колонок
const FIELD_SYNONYMS: Record<string, string[]> = {
  name: ["name", "название", "наименование", "организация", "company", "компания", "title", "название организации"],
  inn: ["inn", "инн"],
  ogrn: ["ogrn", "огрн"],
  website: ["website", "сайт", "url", "site", "вебсайт", "веб-сайт"],
  email: ["email", "e-mail", "почта", "эл. почта", "электронная почта", "mail"],
  phone: ["phone", "телефон", "тел", "tel", "phones"],
  fax: ["fax", "факс"],
  contact_person: ["contact_person", "contact", "контактное лицо", "контакт", "руководитель", "директор", "office"],
  city: ["city", "city_name", "город"],
  region: ["region", "регион", "субъект", "область", "край"],
  address: ["address", "адрес", "geometry_name", "post_code", "адрес офиса"],
  license_number: ["license", "license_number", "лицензия", "номер лицензии", "№ лицензии"],
  license_date: ["license_date", "дата лицензии", "дата предоставления лицензии", "дата выдачи"],
  category: ["category", "категория", "subcategory", "тип"],
  source: ["source", "источник"],
  notes: ["notes", "комментарий", "заметки", "примечание"],
  dedup_hash: [],
  status: ["status", "статус"],
  next_step: ["next_step", "следующий шаг", "след. шаг"],
};

/** Авто-маппинг колонок файла -> поля лида */
export function autoMapColumns(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const norm = (s: string) => s.toLowerCase().trim().replace(/[._-]/g, " ");
  for (const h of headers) {
    const nh = norm(h);
    for (const [field, syns] of Object.entries(FIELD_SYNONYMS)) {
      if (syns.some(s => norm(s) === nh || nh.includes(norm(s)))) {
        if (!map[field]) map[field] = h;
        break;
      }
    }
  }
  return map;
}

const EDU_WHITELIST = [
  "учебн", "образоват", "дпо", "автошкол", "школа", "курс",
  "академи", "колледж", "институт", "университет", "тренинг",
  "повышен", "профобуч", "профессиональн", "ано ", "ноу ",
  "ноч у", "чоу ", "ано дпо", "обучение", "семинар", "лекц",
  "репетит", "детск", "развит", "лингв", "языков",
];
const EDU_BLACKLIST = [
  "ремонт", "кафе", "ресторан", "такси", "доставка", "магазин",
  "стоматол", "стройматериал", "автосервис", "автозапчаст",
  "парикмахер", "салон красот", "пицц", "суши", "бар ",
];

/** Определяет, образовательная ли это организация (грубая эвристика) */
export function detectEducation(row: { name?: string; category?: string; subcategory?: string; website?: string }): boolean {
  const text = [row.name, row.category, row.subcategory, row.website].filter(Boolean).join(" ").toLowerCase();
  if (!text) return false;
  if (EDU_BLACKLIST.some(b => text.includes(b))) {
    // если в blacklist, но при этом есть явное «школа/курс/обучение» — оставляем
    if (!["школа", "курс", "обучен", "академ", "образоват"].some(w => text.includes(w))) return false;
  }
  return EDU_WHITELIST.some(w => text.includes(w));
}

const normPhone = (p?: string | null) =>
  p ? p.replace(/\D/g, "").replace(/^8/, "7").slice(-11) : "";
const normEmail = (e?: string | null) => (e ? e.trim().toLowerCase() : "");
const normName = (n?: string | null) =>
  (n || "").toLowerCase().replace(/["«»'`]/g, "").replace(/\s+/g, " ").trim();

export function makeDedupHash(l: Partial<ImportedLead>): string {
  if (l.inn && /^\d{10,12}$/.test(l.inn)) return `inn:${l.inn}`;
  const e = normEmail(l.email);
  if (e && /@/.test(e)) return `email:${e}`;
  const p = normPhone(l.phone);
  if (p.length === 11) return `phone:${p}`;
  return `name:${normName(l.name)}|${normName(l.city)}`;
}

/** Нормализует одну строку из XLSX/CSV в лид */
export function rowToLead(row: RawRow, mapping: Record<string, string>, defaults: { region?: string; source?: string } = {}): ImportedLead | null {
  const pick = (f: string): string | null => {
    const col = mapping[f];
    if (!col) return null;
    const v = row[col];
    if (v == null || v === "") return null;
    return String(v).trim();
  };

  const name = pick("name") || "";
  if (!name || name.length < 2) return null;

  const phone = (pick("phone") || "").split(/[,;]/)[0].trim() || null;
  const email = (pick("email") || "").split(/[,;\s]/)[0].trim().toLowerCase() || null;
  const website = (pick("website") || "").split(/[,;\s]/)[0].trim() || null;
  const inn = (pick("inn") || "").replace(/\D/g, "") || null;

  const cat = pick("category") || "";
  const subcat = (row as any)["subcategory"] || "";
  const isEdu = detectEducation({ name, category: cat, subcategory: subcat, website: website || undefined });

  let licenseDate: string | null = null;
  const ld = pick("license_date");
  if (ld) {
    const m = ld.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
    if (m) licenseDate = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    else if (/^\d{4}-\d{2}-\d{2}/.test(ld)) licenseDate = ld.slice(0, 10);
  }

  const lead: ImportedLead = {
    name,
    inn: inn && (inn.length === 10 || inn.length === 12) ? inn : null,
    website,
    email,
    phone,
    contact_person: pick("contact_person"),
    city: pick("city"),
    region: pick("region") || defaults.region || null,
    address: pick("address"),
    license_number: pick("license_number"),
    license_date: licenseDate,
    category: isEdu ? "education" : "other",
    source: pick("source") || defaults.source || "Импорт CSV/XLSX",
    notes: pick("notes"),
    status: "new",
    next_step: pick("next_step"),
    dedup_hash: "",
  };
  lead.dedup_hash = makeDedupHash(lead);
  return lead;
}

/** Дедуп внутри массива (оставляет первый) */
export function dedupeWithin(leads: ImportedLead[]): { kept: ImportedLead[]; dropped: number } {
  const seen = new Set<string>();
  const kept: ImportedLead[] = [];
  let dropped = 0;
  for (const l of leads) {
    if (seen.has(l.dedup_hash)) { dropped++; continue; }
    seen.add(l.dedup_hash);
    kept.push(l);
  }
  return { kept, dropped };
}

/** Экспорт в CSV для Coldy. UTF-8 BOM + запятая. */
export function toColdyCSV(leads: Array<{ email?: string | null; name?: string; website?: string | null; phone?: string | null; inn?: string | null; region?: string | null; city?: string | null; notes?: string | null }>): string {
  const cols = ["email", "name", "website", "phone", "inn", "region", "city", "notes"] as const;
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = cols.join(",");
  const rows = leads
    .filter(l => (l.email || "").trim())
    .map(l => cols.map(c => esc((l as any)[c])).join(","));
  return "\ufeff" + [head, ...rows].join("\n");
}

export function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}