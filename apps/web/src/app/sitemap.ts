import type { MetadataRoute } from "next";
import { routing } from "@/core/i18n/routing";
import { languageAlternates, localeUrl } from "@/core/seo";

// Public, indexable pages. News posts get added here when the news module ships.
const PUBLIC_PATHS = [{ path: "", priority: 1, changeFrequency: "daily" as const }];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap(({ path, priority, changeFrequency }) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { languages: languageAlternates(path) },
    })),
  );
}
