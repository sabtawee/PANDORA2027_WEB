import { getTranslations } from "next-intl/server";
import { pickLocale } from "@/core/i18n/localized";
import type { Locale } from "@/core/i18n/routing";
import { daysUntil, OG_SIZE, renderOgCard } from "@/core/seo/og";
import { getSetting } from "@/core/settings";
import { getInviteCard } from "@/modules/referral/invite";
import { TIER_COLORS } from "@/modules/rewards/tiers";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PANDORA-RO invite";
export const revalidate = 3600;

/** Personal share card: "<name> invites you", their tier, days to launch. */
export default async function Image({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale: l, code } = await params;
  const locale = l as Locale;
  const [t, card, launch] = await Promise.all([
    getTranslations({ locale, namespace: "og" }),
    getInviteCard(code),
    getSetting("site.launch"),
  ]);
  const days = daysUntil(launch.obtAt);

  return renderOgCard({
    eyebrow: t("eyebrow"),
    title: card?.firstName ? t("inviteTitleNamed", { name: card.firstName }) : t("inviteTitle"),
    subtitle: t("inviteSubtitle"),
    badge: card?.tier
      ? { label: pickLocale(card.tier.title, locale), color: TIER_COLORS[card.tier.key] ?? "#f1cf7a" }
      : undefined,
    footer: days !== null ? t("daysLeft", { days }) : t("comingSoon"),
  });
}
