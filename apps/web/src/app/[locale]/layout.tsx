import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Cinzel, Kanit } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/core/i18n/routing";
import { buildMetadata, SITE_URL } from "@/core/seo";
import { SiteHeader } from "@/core/ui/SiteHeader";
import { SiteFooter } from "@/core/ui/SiteFooter";
import { RevealObserver } from "@/core/motion/RevealObserver";
import { getSetting } from "@/core/settings";
import { ConsentBanner } from "@/modules/tracking/ConsentBanner";
import { Trackers } from "@/modules/tracking/Trackers";
import "../globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#0b0812" };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: "PANDORA-RO",
    ...buildMetadata({ locale, title: t("title"), description: t("description") }),
    title: { default: t("title"), template: `%s | ${t("siteName")}` },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const trackingIds = await getSetting("tracking");

  return (
    <html lang={locale} className={`${kanit.variable} ${cinzel.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <RevealObserver />
          <ConsentBanner />
          <Trackers ids={trackingIds} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
