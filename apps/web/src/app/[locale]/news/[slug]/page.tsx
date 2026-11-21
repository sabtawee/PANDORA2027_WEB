import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pickLocale } from "@/core/i18n/localized";
import { Link } from "@/core/i18n/navigation";
import type { Locale } from "@/core/i18n/routing";
import { buildMetadata, localeUrl, SITE_URL } from "@/core/seo";
import { JsonLd } from "@/core/seo/JsonLd";
import { CATEGORY_LABEL } from "@/modules/news/categories";
import { Markdown, plainText } from "@/modules/news/markdown";
import { getPublishedPost, newsEnabled } from "@/modules/news/service";

export const revalidate = 300;

const absolute = (u: string) => (u.startsWith("/") ? `${SITE_URL}${u}` : u);

export async function generateMetadata({ params }: PageProps<"/[locale]/news/[slug]">): Promise<Metadata> {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  const post = await getPublishedPost(slug).catch(() => null);
  if (!post) return {};
  const title = pickLocale(post.seoTitle, locale) || pickLocale(post.title, locale);
  const description = pickLocale(post.seoDesc, locale) || pickLocale(post.excerpt, locale) || plainText(pickLocale(post.content, locale));
  const meta = buildMetadata({
    locale,
    path: `/news/${post.slug}`,
    title,
    description,
    image: post.coverImage ? absolute(post.coverImage) : undefined,
  });
  return {
    ...meta,
    openGraph: { ...meta.openGraph, type: "article", publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt.toISOString() },
  };
}

export default async function NewsPostPage({ params }: PageProps<"/[locale]/news/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = l as Locale;
  setRequestLocale(locale);
  if (!(await newsEnabled())) notFound();
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const t = await getTranslations("news");
  const title = pickLocale(post.title, locale);
  const dateFmt = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", { dateStyle: "long", timeZone: "Asia/Bangkok" });
  const url = localeUrl(locale, `/news/${post.slug}`);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": post.category === "GUIDE" ? "BlogPosting" : "NewsArticle",
            headline: title,
            datePublished: post.publishedAt?.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            inLanguage: locale,
            mainEntityOfPage: url,
            ...(post.coverImage ? { image: [absolute(post.coverImage)] } : {}),
            publisher: { "@type": "Organization", name: "PANDORA-RO", url: SITE_URL },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "PANDORA-RO", item: localeUrl(locale) },
              { "@type": "ListItem", position: 2, name: t("title"), item: localeUrl(locale, "/news") },
              { "@type": "ListItem", position: 3, name: title, item: url },
            ],
          },
        ]}
      />

      <Link href="/news" className="text-sm text-faint hover:text-text">
        {t("back")}
      </Link>
      <p className="mt-6 text-sm text-gold">
        {CATEGORY_LABEL[post.category][locale]} · {post.publishedAt && dateFmt.format(post.publishedAt)}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-gilded sm:text-4xl">{title}</h1>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" className="mt-8 aspect-[1200/630] w-full rounded-lg object-cover" />
      )}

      <div className="mt-8 space-y-4 leading-relaxed text-text/90 [&_a]:text-gold-bright [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-gold/60 [&_blockquote]:pl-4 [&_blockquote]:text-muted [&_code]:rounded [&_code]:bg-bg-sunken [&_code]:px-1 [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:pt-2 [&_h3]:text-xl [&_h3]:font-medium [&_h4]:font-medium [&_hr]:border-line [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:text-text [&_ul]:list-disc [&_ul]:pl-6">
        <Markdown source={pickLocale(post.content, locale)} />
      </div>

      <div className="mt-12 text-center">
        <Link href="/dashboard" className="btn-gold">
          {t("cta")}
        </Link>
      </div>
    </article>
  );
}
