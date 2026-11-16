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
import { getBalance } from "@/modules/points/service";
import { getUserQuests } from "@/modules/quests/service";
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
  const [t, tn, tq, ts, balance, accounts, quests, referrals, links, user] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("nav"),
    getTranslations("quests"),
    getTranslations("share"),
    getBalance(userId),
    prisma.account.findMany({ where: { userId }, select: { provider: true } }),
    getUserQuests(userId),
    getReferralStats(userId),
    getSetting("site.links"),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { createdAt: true } }),
  ]);
  const providers = new Set(accounts.map((a) => a.provider));
  const inviteUrl = `${localeUrl(locale)}?ref=${session.user.referralCode}`;
  const isNewUser = isFreshSignup(user.createdAt);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      {isNewUser && <RegistrationPixel eventId={`reg_${userId}`} />}

      <h1 className="font-display text-3xl text-gilded">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("welcome", { name: session.user.name ?? "" })}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="panel p-6">
          <p className="text-sm text-muted">{t("balance")}</p>
          <p className="mt-2 font-display text-5xl tabular-nums text-gilded">{balance.toLocaleString()}</p>
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
      </div>

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
