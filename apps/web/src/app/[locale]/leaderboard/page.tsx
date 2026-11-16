import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/core/i18n/navigation";
import type { Locale } from "@/core/i18n/routing";
import { buildMetadata } from "@/core/seo";
import { getSetting } from "@/core/settings";
import { getLeaderboard, weekStartBangkok, type LeaderRow } from "@/modules/referral/leaderboard";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]/leaderboard">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "leaderboard" });
  return buildMetadata({ locale, path: "/leaderboard", title: t("title"), description: t("subtitle") });
}

const MEDAL = ["#f1cf7a", "#c9cfd8", "#c08457"];

function Board({ rows, empty, unit }: { rows: LeaderRow[]; empty: string; unit: (n: number) => string }) {
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-faint">{empty}</p>;
  return (
    <ol className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.userId} className="flex items-center gap-4 py-3">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums"
            style={r.rank <= 3 ? { background: MEDAL[r.rank - 1], color: "#1a1206" } : { border: "1px solid var(--line-strong)" }}
          >
            {r.rank}
          </span>
          <span className="flex-1">{r.name}</span>
          <span className="text-sm tabular-nums text-gold-bright">{unit(r.count)}</span>
        </li>
      ))}
    </ol>
  );
}

export default async function LeaderboardPage({ params }: PageProps<"/[locale]/leaderboard">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);

  const [t, weekly, allTime, cfg] = await Promise.all([
    getTranslations("leaderboard"),
    getLeaderboard(weekStartBangkok()),
    getLeaderboard(null),
    getSetting("leaderboard"),
  ]);
  const prize = locale === "th" ? cfg.prizeTh : cfg.prizeEn || cfg.prizeTh;
  const unit = (n: number) => t("friends", { count: n });

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-center font-display text-3xl text-gilded sm:text-4xl">{t("title")}</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted">{t("subtitle")}</p>
      {prize && (
        <p className="mx-auto mt-5 max-w-xl rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-center text-sm text-gold-bright">
          🏆 {prize}
        </p>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="panel p-5">
          <h2 className="font-medium">{t("weekly")}</h2>
          <p className="text-xs text-faint">{t("weeklyHint")}</p>
          <Board rows={weekly} empty={t("empty")} unit={unit} />
        </div>
        <div className="panel p-5">
          <h2 className="font-medium">{t("allTime")}</h2>
          <p className="text-xs text-faint">{t("allTimeHint")}</p>
          <Board rows={allTime} empty={t("empty")} unit={unit} />
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/dashboard" className="btn-gold">
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
