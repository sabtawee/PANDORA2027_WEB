import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pickLocale } from "@/core/i18n/localized";
import { Link } from "@/core/i18n/navigation";
import type { Locale } from "@/core/i18n/routing";
import { buildMetadata } from "@/core/seo";
import { CATEGORY_LABEL } from "@/modules/news/categories";
import { listPublishedNews, NEWS_CATEGORIES, newsEnabled } from "@/modules/news/service";

export const revalidate = 300;

/** Placeholder tint per category when a post has no cover image. */
const CATEGORY_TINT = { NEWS: "#c9a24a", PATCH: "#5fb8e6", GUIDE: "#7ccf6a", EVENT: "#e8805a" } as const;

type Cat = (typeof NEWS_CATEGORIES)[number];
const parseCat = (v: unknown): Cat | undefined => (NEWS_CATEGORIES as readonly string[]).includes(String(v).toUpperCase()) ? (String(v).toUpperCase() as Cat) : undefined;

export async function generateMetadata({ params, searchParams }: PageProps<"/[locale]/news">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "news" });
  const meta = buildMetadata({ locale, path: "/news", title: t("title"), description: t("subtitle") });
  // Filtered / paged lists canonicalise to the main list
  return sp.category || sp.page ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function NewsListPage({ params, searchParams }: PageProps<"/[locale]/news">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  if (!(await newsEnabled())) notFound();

  const sp = await searchParams;
  const category = parseCat(sp.category);
  const page = Math.max(1, Number(sp.page) || 1);
  const [t, { posts, pages }] = await Promise.all([getTranslations("news"), listPublishedNews({ category, page })]);
  const dateFmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
  const qs = (p: { category?: Cat; page?: number }) => {
    const q = new URLSearchParams();
    if (p.category) q.set("category", p.category.toLowerCase());
    if (p.page && p.page > 1) q.set("page", String(p.page));
    const s = q.toString();
    return s ? `/news?${s}` : "/news";
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 data-reveal className="text-center font-display text-3xl text-gilded sm:text-4xl">{t("title")}</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted">{t("subtitle")}</p>

      <nav className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
        {[undefined, ...NEWS_CATEGORIES].map((c) => (
          <Link
            key={c ?? "all"}
            href={qs({ category: c })}
            className={`rounded-full border px-4 py-1.5 ${c === category ? "border-gold bg-gold/10 text-gold-bright" : "border-line text-muted hover:text-text"}`}
          >
            {c ? CATEGORY_LABEL[c][locale] : t("all")}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="py-16 text-center text-faint">{t("empty")}</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <div key={p.id} data-reveal className="flex" style={{ "--reveal-delay": `${(i % 3) * 110}ms` } as React.CSSProperties}>
            <Link href={`/news/${p.slug}`} className="panel lift group flex w-full flex-col overflow-hidden">
              {p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImage} alt="" loading="lazy" className="aspect-[1200/630] w-full object-cover" />
              ) : (
                <div
                  className="grid aspect-[1200/630] w-full place-items-center"
                  style={{ background: `radial-gradient(120% 120% at 75% 20%, ${CATEGORY_TINT[p.category]}55, transparent 60%), var(--bg-sunken)` }}
                >
                  <span className={`font-display text-2xl opacity-80 ${locale === "en" ? "tracking-[0.2em] uppercase" : ""}`} style={{ color: CATEGORY_TINT[p.category] }}>
                    {CATEGORY_LABEL[p.category][locale]}
                  </span>
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs text-gold">
                  {CATEGORY_LABEL[p.category][locale]} · {p.publishedAt && dateFmt.format(p.publishedAt)}
                </p>
                <h2 className="mt-1 font-medium group-hover:text-gold-bright">{pickLocale(p.title, locale)}</h2>
                {pickLocale(p.excerpt, locale) && <p className="mt-2 line-clamp-3 text-sm text-muted">{pickLocale(p.excerpt, locale)}</p>}
              </div>
            </Link>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-10 flex justify-between text-sm">
          {page > 1 ? <Link href={qs({ category, page: page - 1 })} className="text-gold-bright">{t("prev")}</Link> : <span />}
          {page < pages ? <Link href={qs({ category, page: page + 1 })} className="text-gold-bright">{t("next")}</Link> : <span />}
        </div>
      )}
    </section>
  );
}
