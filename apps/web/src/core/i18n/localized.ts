import type { Locale } from "./routing";

/** Bilingual JSON field stored in the DB: { th, en }. */
export type LocalizedText = Partial<Record<Locale, string>>;

/** Pick the requested language, falling back to Thai, then to any value present. */
export function pickLocale(value: unknown, locale: Locale): string {
  if (!value || typeof value !== "object") return typeof value === "string" ? value : "";
  const v = value as LocalizedText;
  return v[locale] || v.th || Object.values(v).find(Boolean) || "";
}
