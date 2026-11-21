"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import { requireAdmin } from "@/core/admin/session";
import { awardPoints, getBalance } from "@/modules/points/service";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const reasonField = z.string().trim().min(3, "ต้องใส่เหตุผล").max(200);

const adjustSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce
    .number()
    .int()
    .min(-1_000_000)
    .max(1_000_000)
    .refine((n) => n !== 0, "amount must not be 0"),
  reason: reasonField,
});

/** Manual point change. Always a new ledger row, never an edit; reason is required. */
export async function adjustPoints(formData: FormData) {
  const admin = await requireAdmin("ADMIN");
  const a = adjustSchema.parse({ userId: s(formData, "userId"), amount: s(formData, "amount"), reason: s(formData, "reason") });
  await prisma.user.findUniqueOrThrow({ where: { id: a.userId }, select: { id: true } });

  const before = await getBalance(a.userId);
  await awardPoints({
    userId: a.userId,
    amount: a.amount,
    reason: "ADMIN_ADJUST",
    refId: admin.id,
    note: a.reason,
    dedupeKey: `admin:${randomUUID()}`,
  });
  await audit({ adminId: admin.id, op: "CREATE", action: "user.points.adjust", entity: "user", target: a.userId, before: { balance: before }, after: { balance: before + a.amount }, data: { amount: a.amount, reason: a.reason } });

  revalidatePath(`/admin/users/${a.userId}`);
  redirect(`/admin/users/${a.userId}?ok=1`);
}

const statusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "BANNED"]),
  reason: reasonField,
});

/** Ban signs the player out everywhere (deletes their sessions); sign-in is refused while banned. */
export async function setUserStatus(formData: FormData) {
  const admin = await requireAdmin("ADMIN");
  const v = statusSchema.parse({ userId: s(formData, "userId"), status: s(formData, "status"), reason: s(formData, "reason") });
  const before = await prisma.user.findUniqueOrThrow({ where: { id: v.userId }, select: { status: true } });
  await prisma.$transaction([
    prisma.user.update({ where: { id: v.userId }, data: { status: v.status } }),
    ...(v.status === "BANNED" ? [prisma.session.deleteMany({ where: { userId: v.userId } })] : []),
  ]);
  await audit({ adminId: admin.id, op: "UPDATE", action: v.status === "BANNED" ? "user.ban" : "user.unban", entity: "user", target: v.userId, before: { status: before.status }, after: { status: v.status }, data: { reason: v.reason } });

  revalidatePath("/", "layout");
  redirect(`/admin/users/${v.userId}?ok=1`);
}
