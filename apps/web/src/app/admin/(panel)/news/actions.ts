"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import { requireAdmin } from "@/core/admin/session";
import { NEWS_CATEGORIES } from "@/modules/news/service";
import { Prisma } from "@/generated/prisma/client";

const text = (max: number) => z.string().trim().max(max);
const imageUrl = z.union([z.literal(""), z.string().trim().regex(/^(https?:\/\/|\/)\S+$/, "invalid image url").max(300)]);

const schema = z.object({
  id: z.string(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug: a-z 0-9 และ - เท่านั้น")
    .max(160),
  category: z.enum(NEWS_CATEGORIES),
  titleTh: text(200).min(1),
  titleEn: text(200),
  excerptTh: text(300),
  excerptEn: text(300),
  contentTh: text(60_000).min(1),
  contentEn: text(60_000),
  coverImage: imageUrl,
  seoTitleTh: text(70),
  seoTitleEn: text(70),
  seoDescTh: text(170),
  seoDescEn: text(170),
  isPublished: z.boolean(),
  // datetime-local is entered in Thai time
  publishedAt: z
    .string()
    .trim()
    .transform((v) => (v ? new Date(`${v.length === 16 ? `${v}:00` : v}+07:00`) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "invalid date"),
});

const pair = (th: string, en: string) => ({ th, en });
const optPair = (th: string, en: string) => (th || en ? { th, en } : Prisma.DbNull);

export async function saveNews(formData: FormData) {
  const user = await requireAdmin("EDITOR");
  const s = (k: string) => String(formData.get(k) ?? "");
  const v = schema.parse({
    ...Object.fromEntries(
      ["id", "slug", "category", "titleTh", "titleEn", "excerptTh", "excerptEn", "contentTh", "contentEn", "coverImage", "seoTitleTh", "seoTitleEn", "seoDescTh", "seoDescEn", "publishedAt"].map((k) => [k, s(k)]),
    ),
    isPublished: formData.get("isPublished") === "on",
  });

  const data = {
    slug: v.slug,
    category: v.category,
    title: pair(v.titleTh, v.titleEn),
    excerpt: optPair(v.excerptTh, v.excerptEn),
    content: pair(v.contentTh, v.contentEn),
    coverImage: v.coverImage || null,
    seoTitle: optPair(v.seoTitleTh, v.seoTitleEn),
    seoDesc: optPair(v.seoDescTh, v.seoDescEn),
    isPublished: v.isPublished,
    // Publishing with no date = publish now
    publishedAt: v.publishedAt ?? (v.isPublished ? new Date() : null),
  };

  let id = v.id;
  const before = v.id ? await prisma.newsPost.findUnique({ where: { id: v.id } }) : null;
  try {
    if (id) {
      await prisma.newsPost.update({ where: { id }, data });
    } else {
      id = (await prisma.newsPost.create({ data })).id;
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      redirect(`/admin/news/${v.id || "new"}?error=slug`);
    }
    throw err;
  }
  const after = await prisma.newsPost.findUnique({ where: { id } });
  await audit({ adminId: user.id, op: v.id ? "UPDATE" : "CREATE", action: v.id ? "news.update" : "news.create", target: id, before, after });

  revalidatePath("/", "layout");
  redirect(`/admin/news/${id}?ok=1`);
}

export async function deleteNews(formData: FormData) {
  const user = await requireAdmin("EDITOR");
  const id = z.string().min(1).parse(String(formData.get("id") ?? ""));
  const post = await prisma.newsPost.delete({ where: { id } });
  await audit({ adminId: user.id, op: "DELETE", action: "news.delete", target: id, before: post });
  revalidatePath("/", "layout");
  redirect("/admin/news?ok=1");
}
