import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth, signIn, signOut } from "@/core/auth";
import { prisma } from "@/core/db/prisma";
import { pickLocale } from "@/core/i18n/localized";
import { redirect } from "@/core/i18n/navigation";
import type { Locale } from "@/core/i18n/routing";
import { buildMetadata, localeUrl } from "@/core/seo";
import { getSetting } from "@/core/settings";
import { RegistrationPixel } from "@/modules/tracking/RegistrationPixel";
import { VerifyDiscordButton } from "@/modules/discord/VerifyDiscordButton";
import { getBalance, getHistory, getLifetimeEarned } from "@/modules/points/service";
import { getActiveTiers, resolveTier, TIER_COLORS } from "@/modules/rewards/tiers";
import { getUserQuests } from "@/modules/quests/service";
import { invitePath } from "@/modules/referral/invite";
import { getReferralStats } from "@/modules/referral/service";
import { ShareButtons } from "@/modules/share/ShareButtons";
import { isFreshSignup } from "@/modules/tracking/conversion";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return buildMetadata({ locale, path: "/dashboard", title: t("title"), description: t("title"), noindex: true });
}

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) return redirect({ href: "/login", locale });

  const userId = session.user.id;
  const [t, tn, tq, ts, tt, balance, lifetime, history, tiers, accounts, quests, referrals, links, user] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("nav"),
    getTranslations("quests"),
    getTranslations("share"),
    getTranslations("tiers"),
    getBalance(userId),
    getLifetimeEarned(userId),
    getHistory(userId),
    getActiveTiers(),
    prisma.account.findMany({ where: { userId }, select: { provider: true } }),
    getUserQuests(userId),
    getReferralStats(userId),
    getSetting("site.links"),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { createdAt: true } }),
  ]);
  const providers = new Set(accounts.map((a) => a.provider));
  // /i/CODE carries a personal OG card, so the share preview shows the inviter's name and tier
  const inviteUrl = localeUrl(locale, invitePath(session.user.referralCode));
  const isNewUser = isFreshSignup(user.createdAt);
  const tier = resolveTier(lifetime, tiers);
  const reasonLabel = (reason: string) =>
    (["SIGNUP", "DISCORD_JOIN", "REFERRAL", "ADMIN_ADJUST"] as const).includes(reason as never)
      ? t(`reason.${reason as "SIGNUP"}`)
      : reason;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      {isNewUser && <RegistrationPixel eventId={`reg_${userId}`} />}

      <h1 className="font-display text-3xl text-gilded">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("welcome", { name: session.user.name ?? "" })}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="panel p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{t("balance")}</p>
              <p className="mt-2 font-display text-5xl tabular-nums text-gilded">{balance.toLocaleString()}</p>
            </div>
            {tier.current && (
              <span
                className="rounded-full border px-3 py-1 text-sm font-medium"
                style={{ color: TIER_COLORS[tier.current.key] ?? "var(--gold)", borderColor: "currentColor" }}
              >
                {pickLocale(tier.current.title, locale)}
              </span>
            )}
          </div>
          {tier.next ? (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-bg-sunken">
                <div className="h-full rounded-full bg-gradient-to-r from-arcane to-gold" style={{ width: `${tier.percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-faint">
                {tt("toNext", { points: tier.next.minPoints - lifetime, tier: pickLocale(tier.next.title, locale) })}
              </p>
            </div>
          ) : (
            tier.current && <p className="mt-4 text-xs text-gold">{tt("top")}</p>
          )}
        </div>

        <div className="panel p-6">
          <p className="text-sm text-muted">{t("linkedAccounts")}</p>
          <ul className="mt-3 space-y-2">
            {(["google", "discord"] as const).map((p) => (
              <li key={p} className="flex items-center justify-between">
                <span className="capitalize">{p}</span>
                {providers.has(p) ? (
                  <span className="text-sm text-success">✓ {t("linked")}</span>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await signIn(p, { redirectTo: `/${locale}/dashboard` });
                    }}
                  >
                    <button type="submit" className="btn-ghost py-1 text-sm">
                      {p === "discord" ? t("linkDiscord") : "Google"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ───── Quests ───── */}
      <div className="panel mt-4 p-6">
        <h2 className="font-medium">{tq("title")}</h2>
        <ul className="mt-4 divide-y divide-line">
          {quests.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                    q.completed ? "bg-success text-bg" : "border border-line-strong text-faint"
                  }`}
                >
                  {q.completed ? "✓" : ""}
                </span>
                <div>
                  <p className={q.completed ? "text-muted line-through decoration-faint" : ""}>{pickLocale(q.title, locale)}</p>
                  <p className="text-xs text-gold">{tq("points", { points: q.points })}</p>
                </div>
              </div>
              {q.type === "DISCORD_JOIN" && !q.completed && providers.has("discord") && (
                <VerifyDiscordButton inviteUrl={links.discord} />
              )}
              {q.type === "REFERRAL" && (
                <p className="text-sm text-muted">
                  {tq("referralCount", { qualified: referrals.qualified, pending: referrals.pending })}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ───── Invite ───── */}
      <div className="panel mt-4 p-6">
        <h2 className="font-medium">{t("referralLink")}</h2>
        <p className="mt-1 mb-4 text-sm text-muted">{ts("hint")}</p>
        <ShareButtons url={inviteUrl} text={ts("message")} />
        {links.facebook && (
          <a
            href={links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ background: "#1877F2" }}
          >
            {ts("followPage")}
          </a>
        )}
      </div>

      {/* ───── Point history ───── */}
      {history.length > 0 && (
        <div className="panel mt-4 p-6">
          <h2 className="font-medium">{t("history")}</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p>{reasonLabel(h.reason)}</p>
                  <p className="text-xs text-faint">
                    {h.createdAt.toLocaleString(locale === "th" ? "th-TH" : "en-GB", {
                      timeZone: "Asia/Bangkok",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <span className={`tabular-nums ${h.amount >= 0 ? "text-success" : "text-ember"}`}>
                  {h.amount >= 0 ? "+" : ""}
                  {h.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="mt-8"
        action={async () => {
          "use server";
          await signOut({ redirectTo: `/${locale}` });
        }}
      >
        <button type="submit" className="btn-ghost text-sm">
          {tn("logout")}
        </button>
      </form>
    </section>
  );
}
