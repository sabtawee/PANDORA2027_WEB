import type { MetadataRoute } from "next";
import { routing } from "@/core/i18n/routing";
import { languageAlternates, localeUrl } from "@/core/seo";
import { allPublishedSlugs, newsEnabled } from "@/modules/news/service";

export const revalidate = 3600;

const PUBLIC_PATHS = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/leaderboard", priority: 0.5, changeFrequency: "daily" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: { path: string; priority: number; changeFrequency: "daily" | "weekly"; lastModified?: Date }[] = [...PUBLIC_PATHS];
  if (await newsEnabled()) {
    pages.push({ path: "/news", priority: 0.8, changeFrequency: "daily" });
    for (const p of await allPublishedSlugs()) {
      pages.push({ path: `/news/${p.slug}`, priority: 0.6, changeFrequency: "weekly", lastModified: p.updatedAt });
    }
  }

  return pages.flatMap(({ path, priority, changeFrequency, lastModified }) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: lastModified ?? new Date(),
      changeFrequency,
      priority,
      alternates: { languages: languageAlternates(path) },
    })),
  );
}
