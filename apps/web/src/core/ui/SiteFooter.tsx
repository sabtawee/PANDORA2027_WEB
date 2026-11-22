import { getTranslations } from "next-intl/server";
import { getSetting } from "@/core/settings";

export async function SiteFooter() {
  const [t, links] = await Promise.all([getTranslations("footer"), getSetting("site.links")]);
  const social = [
    { key: "facebook", href: links.facebook, label: "Facebook" },
    { key: "discord", href: links.discord, label: "Discord" },
    { key: "tiktok", href: links.tiktok, label: "TikTok" },
    { key: "youtube", href: links.youtube, label: "YouTube" },
  ].filter((s) => s.href);

  return (
    <footer className="mt-24 border-t border-line/70">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-faint">
        {social.length > 0 && (
          <nav aria-label={t("follow")} className="mb-4 flex flex-wrap justify-center gap-4 text-sm">
            {social.map((s) => (
              <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-gold">
                {s.label}
              </a>
            ))}
          </nav>
        )}
        <p>{t("disclaimer")}</p>
        <p className="mt-2">{t("rights", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
