import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="mt-24 border-t border-line/70">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-faint">
        <p>{t("disclaimer")}</p>
        <p className="mt-2">{t("rights", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
