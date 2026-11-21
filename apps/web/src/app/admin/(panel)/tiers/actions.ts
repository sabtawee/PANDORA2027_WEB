"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import { requireAdmin } from "@/core/admin/session";
import { parseItemLines } from "@/modules/rewards/items";

const schema = z.object({
  id: z.string().optional(),
  key: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,30}$/, "key: a-z 0-9 -"),
  titleTh: z.string().trim().min(1).max(60),
  titleEn: z.string().trim().max(60),
  minPoints: z.coerce.number().int().min(0).max(10_000_000),
  items: z.string().transform(parseItemLines),
  isActive: z.boolean(),
});

export async function saveTier(formData: FormData) {
  const user = await requireAdmin("ADMIN");
  const s = (k: string) => String(formData.get(k) ?? "");
  const t = schema.parse({
    id: s("id") || undefined,
    key: s("key"),
    titleTh: s("titleTh"),
    titleEn: s("titleEn"),
    minPoints: s("minPoints"),
    items: s("items"),
    isActive: formData.get("isActive") === "on",
  });
  const data = {
    key: t.key,
    title: { th: t.titleTh, en: t.titleEn },
    minPoints: t.minPoints,
    items: t.items,
    sortOrder: t.minPoints,
    isActive: t.isActive,
  };
  const before = t.id ? await prisma.rewardTier.findUnique({ where: { id: t.id } }) : null;
  const saved = t.id ? await prisma.rewardTier.update({ where: { id: t.id }, data }) : await prisma.rewardTier.create({ data });
  await audit({ adminId: user.id, op: t.id ? "UPDATE" : "CREATE", action: t.id ? "tier.update" : "tier.create", target: saved.key, before, after: saved });

  revalidatePath("/", "layout");
  redirect("/admin/tiers?ok=1");
}

export async function deleteTier(formData: FormData) {
  const user = await requireAdmin("ADMIN");
  const id = z.string().min(1).parse(formData.get("id"));
  const before = await prisma.rewardTier.delete({ where: { id } });
  await audit({ adminId: user.id, op: "DELETE", action: "tier.delete", target: before.key, before });

  revalidatePath("/", "layout");
  redirect("/admin/tiers?ok=1");
}
