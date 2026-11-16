import { getTranslations } from "next-intl/server";
import { Link } from "@/core/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

/** No session read here, so the header never makes a page dynamic. */
export async function SiteHeader() {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-display text-lg tracking-wider text-gilded">
          PANDORA<span className="text-muted">·RO</span>
        </Link>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link href="/dashboard" className="btn-ghost whitespace-nowrap px-3 text-sm sm:px-5">
            {t("dashboard")}
          </Link>
        </div>
      </div>
    </header>
  );
}
