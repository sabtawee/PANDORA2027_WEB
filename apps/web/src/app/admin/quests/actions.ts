"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import { requireRole } from "@/core/rbac";

const schema = z.object({
  id: z.string().min(1),
  titleTh: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().max(120),
  descTh: z.string().trim().max(300),
  descEn: z.string().trim().max(300),
  points: z.coerce.number().int().min(0).max(100_000),
  maxPerUser: z.coerce.number().int().min(0).max(100_000),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export async function saveQuest(formData: FormData) {
  const user = await requireRole("ADMIN");
  const s = (k: string) => String(formData.get(k) ?? "");
  const q = schema.parse({
    id: s("id"),
    titleTh: s("titleTh"),
    titleEn: s("titleEn"),
    descTh: s("descTh"),
    descEn: s("descEn"),
    points: s("points"),
    maxPerUser: s("maxPerUser"),
    sortOrder: s("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });

  const before = await prisma.quest.findUniqueOrThrow({ where: { id: q.id } });
  const data = {
    title: { th: q.titleTh, en: q.titleEn },
    description: { th: q.descTh, en: q.descEn },
    points: q.points,
    maxPerUser: q.maxPerUser,
    sortOrder: q.sortOrder,
    isActive: q.isActive,
  };
  await prisma.quest.update({ where: { id: q.id }, data });
  await audit(user.id, "quest.update", before.key, { before: { points: before.points, isActive: before.isActive }, after: data });

  revalidatePath("/", "layout");
  redirect("/admin/quests?ok=1");
}
