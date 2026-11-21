import "server-only";
import { prisma } from "@/core/db/prisma";
import { getSetting } from "@/core/settings";
import type { NewsCategory } from "@/generated/prisma/client";

export const NEWS_CATEGORIES = ["NEWS", "PATCH", "GUIDE", "EVENT"] as const satisfies readonly NewsCategory[];

/** Published AND its publish time has passed (scheduled posts stay hidden until then). */
const live = () => ({ isPublished: true, publishedAt: { lte: new Date() } });

export async function newsEnabled() {
  return (await getSetting("modules.enabled")).news;
}

export async function listPublishedNews({ category, page = 1, pageSize = 12 }: { category?: NewsCategory; page?: number; pageSize?: number } = {}) {
  const where = { ...live(), ...(category ? { category } : {}) };
  try {
    const [total, posts] = await Promise.all([
      prisma.newsPost.count({ where }),
      prisma.newsPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, slug: true, category: true, title: true, excerpt: true, coverImage: true, publishedAt: true },
      }),
    ]);
    return { total, posts, pages: Math.max(1, Math.ceil(total / pageSize)) };
  } catch {
    return { total: 0, posts: [], pages: 1 };
  }
}

export async function getPublishedPost(slug: string) {
  return prisma.newsPost.findFirst({ where: { slug, ...live() } });
}

/** For the sitemap. */
export async function allPublishedSlugs() {
  try {
    return await prisma.newsPost.findMany({ where: live(), select: { slug: true, updatedAt: true } });
  } catch {
    return [];
  }
}
