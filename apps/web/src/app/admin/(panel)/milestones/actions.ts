"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import { requireAdmin } from "@/core/admin/session";
import { parseItemLines } from "@/modules/rewards/items";

const items = z.string().transform(parseItemLines);

const schema = z.object({
  id: z.string().optional(),
  target: z.coerce.number().int().min(1).max(10_000_000),
  titleTh: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().max(120),
  descTh: z.string().trim().max(300),
  descEn: z.string().trim().max(300),
  items,
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

function parse(formData: FormData) {
  const s = (k: string) => String(formData.get(k) ?? "");
  return schema.parse({
    id: s("id") || undefined,
    target: s("target"),
    titleTh: s("titleTh"),
    titleEn: s("titleEn"),
    descTh: s("descTh"),
    descEn: s("descEn"),
    items: s("items"),
    sortOrder: s("sortOrder") || "0",
    isActive: formData.get("isActive") === "on",
  });
}

export async function saveMilestone(formData: FormData) {
  const user = await requireAdmin("ADMIN");
  const m = parse(formData);
  const before = m.id ? await prisma.milestone.findUnique({ where: { id: m.id } }) : null;
  const data = {
    target: m.target,
    title: { th: m.titleTh, en: m.titleEn },
    description: { th: m.descTh, en: m.descEn },
    items: m.items,
    sortOrder: m.sortOrder,
    isActive: m.isActive,
  };
  const saved = m.id
    ? await prisma.milestone.update({ where: { id: m.id }, data })
    : await prisma.milestone.create({ data });
  await audit({ adminId: user.id, op: m.id ? "UPDATE" : "CREATE", action: m.id ? "milestone.update" : "milestone.create", target: saved.id, before, after: saved });

  revalidatePath("/", "layout");
  redirect("/admin/milestones?ok=1");
}

export async function deleteMilestone(formData: FormData) {
  const user = await requireAdmin("ADMIN");
  const id = z.string().min(1).parse(formData.get("id"));
  const before = await prisma.milestone.delete({ where: { id } });
  await audit({ adminId: user.id, op: "DELETE", action: "milestone.delete", target: id, before });

  revalidatePath("/", "layout");
  redirect("/admin/milestones?ok=1");
}
