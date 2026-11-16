import type { Metadata } from "next";
import { routing, type Locale } from "@/core/i18n/routing";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const OG_LOCALE: Record<Locale, string> = { th: "th_TH", en: "en_US" };

/** Absolute URL for a locale + path, e.g. ("en", "/news") → https://site/en/news */
export function localeUrl(locale: Locale, path = "") {
  const clean = path === "/" ? "" : path;
  return `${SITE_URL}/${locale}${clean}`;
}

/** hreflang map for one path across every locale, plus x-default. */
export function languageAlternates(path = "") {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = localeUrl(l, path);
  languages["x-default"] = localeUrl(routing.defaultLocale, path);
  return languages;
}

interface PageSeo {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
}

export function buildMetadata({ locale, path = "", title, description, image, noindex }: PageSeo): Metadata {
  const url = localeUrl(locale, path);
  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "PANDORA-RO",
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
