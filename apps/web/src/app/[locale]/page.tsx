import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/core/i18n/navigation";
import type { Locale } from "@/core/i18n/routing";
import { pickLocale } from "@/core/i18n/localized";
import { buildMetadata, localeUrl, SITE_URL } from "@/core/seo";
import { JsonLd } from "@/core/seo/JsonLd";
import { getSetting } from "@/core/settings";
import { Countdown } from "@/core/ui/Countdown";
import { Embers } from "@/core/ui/Embers";
import { MilestoneTimeline } from "@/core/ui/MilestoneTimeline";
import { PandoraBox } from "@/core/ui/PandoraBox";
import { ClassShowcase } from "@/core/ui/ClassShowcase";
import { HeroScrollFx } from "@/core/motion/HeroScrollFx";
import { getActiveQuests, getPreregisterStats } from "@/modules/preregister/service";

// Landing is static and refreshed every minute (registration count, milestones).
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta" });
  return buildMetadata({ locale, title: t("title"), description: t("description") });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);

  const [t, tm, tq, meta, stats, quests, launch] = await Promise.all([
    getTranslations("hero"),
    getTranslations("milestones"),
    getTranslations("quests"),
    getTranslations("meta"),
    getPreregisterStats(),
    getActiveQuests(),
    getSetting("site.launch"),
  ]);

  const broken = stats.milestones.filter((m) => m.unlocked).length;

  return (
    <>
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebSite", name: "PANDORA-RO", url: SITE_URL, inLanguage: ["th", "en"] },
          {
            "@context": "https://schema.org",
            "@type": "VideoGame",
            name: "PANDORA-RO 1.0-4.0",
            url: localeUrl(locale),
            description: meta("description"),
            genre: ["MMORPG"],
            gamePlatform: "PC",
            playMode: "MultiPlayer",
          },
        ]}
      />

      {/* ───── Hero ───── */}
      {/* GSAP pins #hero by moving it into a .pin-spacer; this React-owned wrapper keeps
          React's DOM removal (navigating away, HMR) from hitting the moved node. */}
      <div>
      <section id="hero" className="relative overflow-hidden md:flex md:min-h-[calc(100svh-4rem)] md:items-center">
        {/* Key-art background. The art has its own logo in the middle, so the scrims
            keep the text side dark enough to read and leave the characters visible. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[75svh] md:inset-0 md:h-auto">
          <Image
            src="/brand/hero.png"
            alt=""
            fill
            preload
            sizes="100vw"
            quality={80}
            className="object-cover object-[82%_center] md:object-right"
          />
          <div className="hero-scrim absolute inset-0" />
        </div>
        <Embers />
        <HeroScrollFx />
        {/* Scroll scene layers (see HeroScrollFx); invisible unless the scene runs */}
        <div
          aria-hidden
          data-hero-burst
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{ background: "radial-gradient(circle closest-side at 50% 50%, rgb(255 243 207 / 0.9), rgb(212 168 75 / 0.35) 35%, rgb(123 75 212 / 0.15) 65%, transparent 100%)" }}
        />
        <div aria-hidden data-hero-finale className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-4 text-center opacity-0">
          <div>
            <p className="font-display text-4xl text-gilded sm:text-6xl">{t("finaleTitle")}</p>
            <p className="mt-4 text-lg text-text sm:text-2xl">{t("registered", { count: stats.registered })}</p>
          </div>
        </div>
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-12 pb-16 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div data-hero-text className="text-center md:text-left">
            <p className="enter text-xs tracking-[0.25em] text-arcane-bright uppercase sm:text-sm">{t("eyebrow")}</p>
            {/* entrance animation on a wrapper: on the gilded h1 itself it un-hides the sr-only text */}
            <div style={{ "--enter-delay": "120ms" } as React.CSSProperties} className="enter">
            <h1 className="mt-4 font-display text-4xl leading-tight text-gilded sm:text-6xl">
              <span className="sr-only">PANDORA-RO</span>
              <Image
                src="/brand/logo.png"
                alt="PANDORA Classic RO — Pre-Renewal 1.0-4.0"
                width={1200}
                height={605}
                preload
                sizes="(min-width: 768px) 520px, 90vw"
                className="mx-auto w-full max-w-[520px] drop-shadow-[0_0_30px_rgba(80,140,255,0.35)] md:mx-0"
              />
              <span className="mt-4 block text-2xl text-text sm:text-4xl">{t("title")}</span>
            </h1>
            </div>
            <p style={{ "--enter-delay": "280ms" } as React.CSSProperties} className="enter mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted md:mx-0 sm:text-lg">{t("subtitle")}</p>
            <div style={{ "--enter-delay": "420ms" } as React.CSSProperties} className="enter mt-8 flex flex-col items-center gap-4 sm:flex-row md:justify-start">
              <Link href="/login" className="btn-gold text-lg">
                {t("cta")}
              </Link>
              <p className="text-sm text-muted">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-success align-middle" />
                {t("registered", { count: stats.registered })}
              </p>
            </div>
          </div>
          <div style={{ "--enter-delay": "200ms" } as React.CSSProperties} className="enter flex justify-center">
            <div data-hero-box className="flex w-full justify-center will-change-transform">
              <PandoraBox chains={stats.milestones.length || 5} broken={broken} />
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* ───── Countdown ───── */}
      <section data-reveal className="mx-auto max-w-6xl px-4">
        <Countdown target={launch.obtAt} />
      </section>

      {/* ───── Milestones ───── */}
      {stats.milestones.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4">
          <h2 data-reveal className="text-center font-display text-3xl text-gilded">{tm("title")}</h2>
          <p data-reveal style={{ "--reveal-delay": "100ms" } as React.CSSProperties} className="mx-auto mt-3 max-w-2xl text-center text-muted">{tm("subtitle")}</p>

          <div className="mt-10">
            <MilestoneTimeline registered={stats.registered} milestones={stats.milestones} locale={locale} />
          </div>
        </section>
      )}

      {/* ───── Classes ───── */}
      <ClassShowcase />

      {/* ───── Quests ───── */}
      {quests.length > 0 && (
        <section className="mx-auto mt-20 max-w-3xl px-4">
          <h2 data-reveal className="text-center font-display text-3xl text-gilded">{tq("title")}</h2>
          <ul className="mt-8 space-y-3">
            {quests.map((q, i) => (
              <li key={q.id} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
                <div className="panel lift flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{pickLocale(q.title, locale)}</p>
                  {q.description != null && <p className="mt-1 text-sm text-muted">{pickLocale(q.description, locale)}</p>}
                </div>
                <span className="shrink-0 rounded-full border border-gold/40 px-3 py-1 text-sm text-gold-bright">
                  {tq("points", { points: q.points })}
                </span>
                </div>
              </li>
            ))}
          </ul>
          <div data-reveal className="mt-10 text-center">
            <Link href="/login" className="btn-gold">
              {t("cta")}
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
