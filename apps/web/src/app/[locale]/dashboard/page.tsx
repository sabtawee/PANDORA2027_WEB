import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth, signIn, signOut } from "@/core/auth";
import { prisma } from "@/core/db/prisma";
import { redirect } from "@/core/i18n/navigation";
import type { Locale } from "@/core/i18n/routing";
import { buildMetadata, localeUrl } from "@/core/seo";
import { getBalance } from "@/modules/points/service";

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
  const [t, tn, balance, accounts] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("nav"),
    getBalance(userId),
    prisma.account.findMany({ where: { userId }, select: { provider: true } }),
  ]);
  const providers = new Set(accounts.map((a) => a.provider));
  const inviteUrl = `${localeUrl(locale)}?ref=${session.user.referralCode}`;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
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

      <div className="panel mt-4 p-6">
        <p className="text-sm text-muted">{t("referralLink")}</p>
        <p className="mt-2 break-all rounded-lg border border-line bg-bg-sunken px-3 py-2 font-mono text-sm text-gold-bright">
          {inviteUrl}
        </p>
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
