const SERVICE_PRESETS: Record<string, string> = {
  landing: "Сайт под ключ",
  corporate: "Сайт под ключ",
  "site-direct": "Сайт + Яндекс Директ",
  direct: "Яндекс Директ",
  frdo: "ФИС ФРДО",
  license: "Лицензирование",
  nmo: "НМО Портал",
  sintagma: "Синтагма",
  procurement: "Закупка / коммерческое предложение",
};

const ATTRIBUTION_KEYS = [
  "yclid",
  "_openstat",
  "gclid",
  "gbraid",
  "wbraid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_landing",
] as const;

export type LandingAttribution = Partial<
  Record<(typeof ATTRIBUTION_KEYS)[number], string>
>;

export function getServicePresetFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const content = params.get("utm_content")?.toLowerCase();

  // Keep the existing FIS FRDO links working while the source landing is
  // migrated from the legacy `key=license` value to `key=frdo`.
  if (content === "fis-frdo") return "ФИС ФРДО";

  const key = params.get("key")?.toLowerCase();
  return key ? SERVICE_PRESETS[key] : undefined;
}

export function getLandingAttribution(search: string): LandingAttribution {
  const params = new URLSearchParams(search);
  const result: LandingAttribution = {};

  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) result[key] = value;
  }

  return result;
}

export function isSintagmaAttribution(attribution: LandingAttribution) {
  return (
    attribution.utm_source === "24sintagma" ||
    attribution.utm_landing?.startsWith("24sintagma") === true
  );
}

export function buildGoalParams(
  service: string,
  attribution: LandingAttribution,
) {
  return {
    service,
    utm_source: attribution.utm_source ?? "direct",
    utm_medium: attribution.utm_medium ?? "none",
    utm_campaign: attribution.utm_campaign ?? "none",
    utm_content: attribution.utm_content ?? "none",
    utm_landing: attribution.utm_landing ?? "none",
    has_yclid: Boolean(attribution.yclid),
  };
}
