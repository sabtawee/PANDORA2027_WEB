import { getTranslations } from "next-intl/server";
import { pickLocale } from "@/core/i18n/localized";
import type { Locale } from "@/core/i18n/routing";
import type { MilestoneView } from "@/modules/preregister/service";
import { CountUp } from "@/core/motion/CountUp";

/**
 * Where the progress line ends, in "node units": 0 = first node, n-1 = last.
 * Between two nodes it moves in proportion to sign-ups between their targets.
 */
function linePosition(registered: number, ms: MilestoneView[]) {
  const last = ms.findLastIndex((m) => registered >= m.target);
  if (last < 0) return 0;
  if (last === ms.length - 1) return ms.length - 1;
  const from = ms[last].target;
  const to = ms[last + 1].target;
  return last + Math.min(1, (registered - from) / (to - from));
}

/** Horizontal sign-up timeline: one node per milestone, with its reward image. Scrolls sideways on phones. */
export async function MilestoneTimeline({ registered, milestones, locale }: { registered: number; milestones: MilestoneView[]; locale: Locale }) {
  const t = await getTranslations("milestones");
  const n = milestones.length;
  const nextIdx = milestones.findIndex((m) => !m.unlocked);
  const next = nextIdx >= 0 ? milestones[nextIdx] : null;
  const prevTarget = nextIdx > 0 ? milestones[nextIdx - 1].target : 0;
  const nextPercent = next ? Math.floor(Math.min(99, ((registered - prevTarget) / (next.target - prevTarget)) * 100)) : 100;

  // The line runs from the centre of the first column to the centre of the last.
  const inset = 50 / n;
  const fill = n > 1 ? (linePosition(registered, milestones) / (n - 1)) * (100 - 2 * inset) : 0;

  return (
    <div>
      <div className="text-center" data-reveal>
        <p className="font-display text-2xl text-gilded sm:text-3xl">{t.rich("registered", { n: () => <CountUp value={registered} locale={locale} /> })}</p>
        <p className="mt-1 text-sm text-muted">{next ? t("toNext", { count: next.target - registered }) : t("allUnlocked")}</p>
      </div>

      <div className="-mx-4 mt-8 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
        <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(150px, 1fr))`, minWidth: `${n * 150}px` }}>
          {/* track + progress, behind the images (images are 96px tall, centre at 48px) */}
          <li aria-hidden className="pointer-events-none absolute top-[46px] h-1 rounded-full bg-line-strong" style={{ left: `${inset}%`, right: `${inset}%` }} />
          <li
            aria-hidden
            data-reveal="line"
            className="pointer-events-none absolute top-[46px] h-1 rounded-full bg-gradient-to-r from-arcane to-gold shadow-[0_0_12px_rgba(241,207,122,0.5)]"
            style={{ left: `${inset}%`, width: `${fill}%` }}
          />

          {milestones.map((m, i) => {
            const state = m.unlocked ? "unlocked" : i === nextIdx ? "next" : "locked";
            const title = pickLocale(m.title, locale);
            const desc = pickLocale(m.description, locale);
            return (
              <li key={m.id} data-reveal style={{ "--reveal-delay": `${i * 120}ms` } as React.CSSProperties} className={`relative flex flex-col items-center px-2 text-center ${state === "locked" ? "opacity-60" : ""}`}>
                <div
                  className={`lift relative grid h-24 w-24 place-items-center overflow-hidden rounded-2xl bg-bg-raised ${
                    state === "unlocked"
                      ? "glow-pulse border-2 border-gold shadow-[0_0_24px_rgba(241,207,122,0.35)]"
                      : state === "next"
                        ? "border-2 border-dashed border-gold/70"
                        : "border border-line-strong"
                  }`}
                >
                  {m.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image} alt={title} loading="lazy" className={`h-full w-full object-contain p-1.5 ${state === "locked" ? "grayscale" : ""}`} />
                  ) : (
                    <span className="font-display text-3xl text-gold/70">{i + 1}</span>
                  )}
                  {state === "locked" && (
                    <span className="absolute inset-0 grid place-items-center bg-bg/40 text-xl" aria-hidden>
                      🔒
                    </span>
                  )}
                </div>

                <p className="mt-3 font-display text-lg text-gilded">{t("target", { count: m.target })}</p>
                <p className="mt-0.5 text-sm text-text">{title}</p>
                {desc && <p className="mt-1 line-clamp-2 text-xs text-faint">{desc}</p>}
                <span
                  className={`mt-2 rounded-full px-2.5 py-0.5 text-xs ${
                    state === "unlocked"
                      ? "bg-success/15 text-success"
                      : state === "next"
                        ? "bg-gold/15 text-gold-bright"
                        : "border border-line text-faint"
                  }`}
                >
                  {state === "unlocked" ? t("unlocked") : state === "next" ? t("next", { percent: nextPercent }) : t("locked")}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
