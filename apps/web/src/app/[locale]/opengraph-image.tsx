import { getTranslations } from "next-intl/server";
import type { Locale } from "@/core/i18n/routing";
import { daysUntil, OG_SIZE, renderOgCard } from "@/core/seo/og";
import { getSetting } from "@/core/settings";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PANDORA-RO 1.0-4.0";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const [t, launch] = await Promise.all([getTranslations({ locale, namespace: "og" }), getSetting("site.launch")]);
  const days = daysUntil(launch.obtAt);

  return renderOgCard({
    eyebrow: t("eyebrow"),
    title: t("siteTitle"),
    subtitle: t("siteSubtitle"),
    footer: days !== null ? t("daysLeft", { days }) : t("comingSoon"),
  });
}
