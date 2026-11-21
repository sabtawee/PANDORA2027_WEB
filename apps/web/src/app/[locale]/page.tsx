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
import { PandoraBox } from "@/core/ui/PandoraBox";
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
  const next = stats.milestones.find((m) => !m.unlocked);
  const prevTarget = stats.milestones.filter((m) => m.unlocked).at(-1)?.target ?? 0;
  const progress = next ? Math.min(100, ((stats.registered - prevTarget) / (next.target - prevTarget)) * 100) : 100;

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
      <section className="relative overflow-hidden">
        <Embers />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div className="text-center md:text-left">
            <p className="text-xs tracking-[0.25em] text-arcane-bright uppercase sm:text-sm">{t("eyebrow")}</p>
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
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted md:mx-0 sm:text-lg">{t("subtitle")}</p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row md:justify-start">
              <Link href="/login" className="btn-gold text-lg">
                {t("cta")}
              </Link>
              <p className="text-sm text-muted">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-success align-middle" />
                {t("registered", { count: stats.registered })}
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <PandoraBox chains={stats.milestones.length || 5} broken={broken} />
          </div>
        </div>
      </section>

      {/* ───── Countdown ───── */}
      <section className="mx-auto max-w-6xl px-4">
        <Countdown target={launch.obtAt} />
      </section>

      {/* ───── Milestones ───── */}
      {stats.milestones.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl text-gilded">{tm("title")}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">{tm("subtitle")}</p>

          {next && (
            <div className="mx-auto mt-8 max-w-2xl">
              <div className="h-3 overflow-hidden rounded-full border border-line bg-bg-sunken">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-arcane to-gold"
                  style={{ width: `${Math.max(progress, 2)}%` }}
                />
              </div>
              <p className="mt-2 text-right text-xs text-faint">
                {stats.registered.toLocaleString()} / {next.target.toLocaleString()}
              </p>
            </div>
          )}

          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {stats.milestones.map((m, i) => (
              <li
                key={m.id}
                className={`panel p-4 text-center ${m.unlocked ? "border-gold/60" : "opacity-80"}`}
              >
                <p className="text-xs text-faint">#{i + 1}</p>
                <p className="mt-1 font-display text-xl text-gilded">{tm("target", { count: m.target })}</p>
                <p className="mt-2 text-sm text-text">{pickLocale(m.title, locale)}</p>
                <p className={`mt-3 text-xs ${m.unlocked ? "text-success" : "text-faint"}`}>
                  {m.unlocked ? tm("unlocked") : tm("locked")}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ───── Quests ───── */}
      {quests.length > 0 && (
        <section className="mx-auto mt-20 max-w-3xl px-4">
          <h2 className="text-center font-display text-3xl text-gilded">{tq("title")}</h2>
          <ul className="mt-8 space-y-3">
            {quests.map((q) => (
              <li key={q.id} className="panel flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{pickLocale(q.title, locale)}</p>
                  {q.description != null && <p className="mt-1 text-sm text-muted">{pickLocale(q.description, locale)}</p>}
                </div>
                <span className="shrink-0 rounded-full border border-gold/40 px-3 py-1 text-sm text-gold-bright">
                  {tq("points", { points: q.points })}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Link href="/login" className="btn-gold">
              {t("cta")}
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
