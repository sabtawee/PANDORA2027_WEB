import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, redirect } from "@/core/i18n/navigation";
import { pickLocale } from "@/core/i18n/localized";
import type { Locale } from "@/core/i18n/routing";
import { buildMetadata, localeUrl } from "@/core/seo";
import { Embers } from "@/core/ui/Embers";
import { PandoraBox } from "@/core/ui/PandoraBox";
import { getPreregisterStats } from "@/modules/preregister/service";
import { getInviteCard } from "@/modules/referral/invite";
import { TIER_COLORS } from "@/modules/rewards/tiers";

// The referral cookie is set by proxy.ts for /:locale/i/:code before this renders.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]/i/[code]">): Promise<Metadata> {
  const { locale, code } = (await params) as { locale: Locale; code: string };
  const [t, card] = await Promise.all([getTranslations({ locale, namespace: "invite" }), getInviteCard(code)]);
  const title = card?.firstName ? t("titleNamed", { name: card.firstName }) : t("title");
  const base = buildMetadata({ locale, path: `/i/${code}`, title, description: t("subtitle"), noindex: true });
  // Personal pages share the landing page's ranking signal
  return { ...base, alternates: { canonical: localeUrl(locale) } };
}

export default async function InvitePage({ params }: PageProps<"/[locale]/i/[code]">) {
  const { locale, code } = (await params) as { locale: Locale; code: string };
  setRequestLocale(locale);

  const card = await getInviteCard(code);
  if (!card) redirect({ href: "/", locale });

  const [t, th, stats] = await Promise.all([getTranslations("invite"), getTranslations("hero"), getPreregisterStats()]);
  const broken = stats.milestones.filter((m) => m.unlocked).length;

  return (
    <section className="relative overflow-hidden">
      <Embers />
      <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
        <div className="text-center md:text-left">
          {card!.tier && (
            <span
              className="inline-block rounded-full border px-3 py-1 text-sm"
              style={{ color: TIER_COLORS[card!.tier.key] ?? "var(--gold)", borderColor: "currentColor" }}
            >
              {pickLocale(card!.tier.title, locale)}
            </span>
          )}
          <h1 className="mt-4 font-display text-3xl leading-snug text-gilded sm:text-5xl">
            {card!.firstName ? t("titleNamed", { name: card!.firstName }) : t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-muted md:mx-0">{t("subtitle")}</p>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm md:mx-0">
            {(["perk1", "perk2", "perk3"] as const).map((k) => (
              <li key={k} className="flex gap-2">
                <span className="text-gold">✦</span>
                {t(k)}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <Link href="/login" className="btn-gold text-lg">
              {t("cta")}
            </Link>
            <p className="text-sm text-muted">{th("registered", { count: stats.registered })}</p>
          </div>
        </div>
        <div className="flex justify-center">
          <PandoraBox chains={stats.milestones.length || 5} broken={broken} />
        </div>
      </div>
    </section>
  );
}
