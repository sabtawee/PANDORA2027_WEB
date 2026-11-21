import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/core/i18n/navigation";
import { getSetting } from "@/core/settings";
import { LocaleSwitcher } from "./LocaleSwitcher";

/** No session read here, so the header never makes a page dynamic. */
export async function SiteHeader() {
  const [t, modules] = await Promise.all([getTranslations("nav"), getSetting("modules.enabled")]);
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label="PANDORA-RO">
          <Image src="/brand/logo.png" alt="PANDORA Classic RO" width={1200} height={605} sizes="96px" className="h-12 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          {modules.news && (
            <Link href="/news" className="hidden text-sm text-muted hover:text-text sm:inline">
              {t("news")}
            </Link>
          )}
          <Link href="/leaderboard" className="hidden text-sm text-muted hover:text-text sm:inline">
            {t("leaderboard")}
          </Link>
          <LocaleSwitcher />
          <Link href="/dashboard" className="btn-ghost whitespace-nowrap px-3 text-sm sm:px-5">
            {t("dashboard")}
          </Link>
        </div>
      </div>
    </header>
  );
}
