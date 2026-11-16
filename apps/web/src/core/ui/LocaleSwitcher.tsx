"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/core/i18n/navigation";
import { routing } from "@/core/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  return (
    <div role="group" aria-label={t("language")} className="flex rounded-full border border-line-strong p-0.5 text-xs">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={l === locale}
          onClick={() =>
            // @ts-expect-error -- params always match the current pathname
            router.replace({ pathname, params }, { locale: l })
          }
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
            l === locale ? "bg-gold text-[#1a1206] font-semibold" : "text-muted hover:text-text"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
