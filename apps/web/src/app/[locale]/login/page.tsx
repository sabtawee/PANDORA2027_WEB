import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/core/auth";
import { redirect } from "@/core/i18n/navigation";
import type { Locale } from "@/core/i18n/routing";
import { buildMetadata } from "@/core/seo";
import { LoginForm } from "./LoginForm";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "login" });
  return buildMetadata({ locale, path: "/login", title: t("title"), description: t("subtitle"), noindex: true });
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const locale = (await params).locale as Locale;
  const { error } = await searchParams;
  const errorKey = error === "captcha" ? "errorCaptcha" : error === "rate" ? "errorRate" : error === "AccessDenied" ? "errorDenied" : error ? "errorGeneric" : null;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user) redirect({ href: "/dashboard", locale });

  const t = await getTranslations("login");

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-24">
      <div className="panel p-8 text-center">
        <h1 className="font-display text-2xl text-gilded">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>

        {errorKey && (
          <p role="alert" className="mt-6 rounded-md border border-ember/50 bg-ember/10 px-3 py-2 text-sm text-ember">
            {t(errorKey)}
          </p>
        )}

        <div className="mt-8">
          <LoginForm
            locale={locale}
            google={
              <>
                <GoogleIcon />
                {t("google")}
              </>
            }
            discord={
              <>
                <DiscordIcon />
                {t("discord")}
              </>
            }
          />
        </div>

        <p className="mt-6 text-xs leading-relaxed text-faint">{t("terms")}</p>
      </div>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.3 18.3 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.8-9.7-3.6-13.7zM8 15.4c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.6 8 10.6s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z" />
    </svg>
  );
}
