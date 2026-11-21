import type { Locale } from "@/core/i18n/routing";

export const CATEGORY_LABEL: Record<"NEWS" | "PATCH" | "GUIDE" | "EVENT", Record<Locale, string>> = {
  NEWS: { th: "ข่าว", en: "News" },
  PATCH: { th: "Patch Note", en: "Patch Notes" },
  GUIDE: { th: "คู่มือ", en: "Guide" },
  EVENT: { th: "กิจกรรม", en: "Event" },
};
