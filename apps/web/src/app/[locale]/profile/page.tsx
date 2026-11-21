import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth, signIn } from "@/core/auth";
import { prisma } from "@/core/db/prisma";
import { redirect } from "@/core/i18n/navigation";
import { routing, type Locale } from "@/core/i18n/routing";
import { buildMetadata, localeUrl } from "@/core/seo";
import { ImageField } from "@/core/ui/ImageField";
import { RefreshMe } from "@/core/ui/UserMenu";
import { invitePath } from "@/modules/referral/invite";
import { ShareButtons } from "@/modules/share/ShareButtons";
import { saveProfile } from "./actions";

export async function generateMetadata({ params }: PageProps<"/[locale]/profile">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "profile" });
  return buildMetadata({ locale, path: "/profile", title: t("title"), description: t("title"), noindex: true });
}

const ERRORS = ["name", "image", "rate"] as const;

export default async function ProfilePage({ params, searchParams }: PageProps<"/[locale]/profile">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) return redirect({ href: "/login", locale });
  const userId = session.user.id;

  const [t, ts, sp, user, accounts] = await Promise.all([
    getTranslations("profile"),
    getTranslations("share"),
    searchParams,
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true, image: true, locale: true, createdAt: true } }),
    prisma.account.findMany({ where: { userId }, select: { provider: true } }),
  ]);
  const providers = new Set(accounts.map((a) => a.provider));
  const error = ERRORS.find((e) => e === sp.error);
  const inviteUrl = localeUrl(locale, invitePath(session.user.referralCode));

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl text-gilded">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">
        {t("memberSince", {
          date: user.createdAt.toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok", dateStyle: "long" }),
        })}
      </p>

      {sp.ok && <RefreshMe />}
      {sp.ok && <p className="mt-6 rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm text-success">{t("saved")}</p>}
      {error && <p className="mt-6 rounded-lg border border-ember/40 bg-ember/10 px-4 py-2 text-sm text-ember">{t(`error.${error}`)}</p>}

      {/* ───── Profile form ───── */}
      <form action={saveProfile} className="panel mt-6 space-y-6 p-6">
        <ImageField
          current={user.image}
          round
          label={t("avatar")}
          texts={{ pick: t("avatarPick"), hint: t("avatarHint"), pending: t("avatarPending"), remove: t("avatarRemove"), tooBig: t("avatarTooBig") }}
        />

        <label className="block">
          <span className="text-sm text-muted">{t("name")}</span>
          <input
            name="name"
            defaultValue={user.name ?? ""}
            required
            minLength={2}
            maxLength={24}
            className="mt-1 w-full rounded-lg border border-line-strong bg-bg-sunken px-3 py-2 outline-none focus:border-gold"
          />
          <span className="mt-1 block text-xs text-faint">{t("nameHint")}</span>
        </label>

        <label className="block">
          <span className="text-sm text-muted">{t("language")}</span>
          <select
            name="locale"
            defaultValue={routing.locales.includes(user.locale as Locale) ? user.locale : locale}
            className="mt-1 w-full rounded-lg border border-line-strong bg-bg-sunken px-3 py-2 outline-none focus:border-gold"
          >
            <option value="th">ไทย</option>
            <option value="en">English</option>
          </select>
        </label>

        {user.email && (
          <div>
            <span className="text-sm text-muted">{t("email")}</span>
            <p className="mt-1 text-sm">{user.email}</p>
          </div>
        )}

        <button type="submit" className="btn-gold">
          {t("save")}
        </button>
      </form>

      {/* ───── Linked accounts ───── */}
      <div className="panel mt-4 p-6">
        <h2 className="font-medium">{t("linkedAccounts")}</h2>
        <p className="mt-1 text-sm text-muted">{t("linkedHint")}</p>
        <ul className="mt-4 divide-y divide-line">
          {(["google", "discord"] as const).map((p) => (
            <li key={p} className="flex items-center justify-between py-3">
              <span className="capitalize">{p}</span>
              {providers.has(p) ? (
                <span className="text-sm text-success">✓ {t("linked")}</span>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await signIn(p, { redirectTo: `/${locale}/profile` });
                  }}
                >
                  <button type="submit" className="btn-ghost py-1 text-sm">
                    {t("link", { provider: p === "google" ? "Google" : "Discord" })}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ───── Invite link ───── */}
      <div className="panel mt-4 p-6">
        <h2 className="font-medium">{t("referral")}</h2>
        <p className="mt-1 mb-4 text-sm text-muted">{ts("hint")}</p>
        <ShareButtons url={inviteUrl} text={ts("message")} />
      </div>
    </section>
  );
}
