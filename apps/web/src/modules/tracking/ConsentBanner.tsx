"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { getConsent, serverConsent, setConsent, subscribeConsent } from "./consent-store";

/** PDPA cookie notice. "Essential only" is as easy to pick as "Accept all". */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const consent = useSyncExternalStore(subscribeConsent, getConsent, serverConsent);

  // undefined = not hydrated yet, string = already answered
  if (consent !== null) return null;

  return (
    <div role="dialog" aria-live="polite" aria-label="Cookie consent" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="panel mx-auto flex max-w-3xl flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted">{t("text")}</p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setConsent("necessary")} className="btn-ghost py-2 text-sm">
            {t("necessary")}
          </button>
          <button type="button" onClick={() => setConsent("all")} className="btn-gold px-5 py-2 text-sm">
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
