"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

function subscribeClock(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
// Whole seconds, so the snapshot is stable between calls within a tick
const clockSnapshot = () => Math.floor(Date.now() / 1000) * 1000;

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

export function Countdown({ target }: { target: string | null }) {
  const t = useTranslations("countdown");
  // null on the server, so server HTML and hydration match
  const now = useSyncExternalStore(subscribeClock, clockSnapshot, () => null);

  const targetMs = target ? Date.parse(target) : NaN;

  return (
    <div className="text-center">
      {/* No letter-spacing: it breaks Thai vowel/tone marks */}
      <p className="mb-3 text-sm text-muted">{t("title")}</p>
      {Number.isNaN(targetMs) ? (
        <p className="font-display text-2xl text-gilded">{t("tbd")}</p>
      ) : (
        <div className="flex justify-center gap-2 sm:gap-4" aria-live="off">
          {(["days", "hours", "minutes", "seconds"] as const).map((unit) => {
            const value = now === null ? null : parts(targetMs - now)[unit];
            return (
              <div key={unit} className="panel w-[4.5rem] py-3 sm:w-24 sm:py-4">
                <div className="font-display text-3xl tabular-nums text-gilded sm:text-4xl">
                  {value === null ? "--" : String(value).padStart(2, "0")}
                </div>
                <div className="mt-1 text-xs text-faint">{t(unit)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
