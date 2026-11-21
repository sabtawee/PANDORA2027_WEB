"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import { requireRole } from "@/core/rbac";
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
  const admin = await requireRole("ADMIN");
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
  await audit(admin.id, "user.points.adjust", a.userId, { amount: a.amount, reason: a.reason, balanceBefore: before });

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
  const admin = await requireRole("ADMIN");
  const v = statusSchema.parse({ userId: s(formData, "userId"), status: s(formData, "status"), reason: s(formData, "reason") });
  if (v.userId === admin.id) throw new Error("You cannot ban yourself");

  const before = await prisma.user.findUniqueOrThrow({ where: { id: v.userId }, select: { status: true } });
  await prisma.$transaction([
    prisma.user.update({ where: { id: v.userId }, data: { status: v.status } }),
    ...(v.status === "BANNED" ? [prisma.session.deleteMany({ where: { userId: v.userId } })] : []),
  ]);
  await audit(admin.id, v.status === "BANNED" ? "user.ban" : "user.unban", v.userId, {
    before: before.status,
    reason: v.reason,
  });

  revalidatePath("/", "layout");
  redirect(`/admin/users/${v.userId}?ok=1`);
}

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "EDITOR", "GM", "ADMIN"]),
});

export async function setUserRole(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const v = roleSchema.parse({ userId: s(formData, "userId"), role: s(formData, "role") });
  if (v.userId === admin.id) throw new Error("You cannot change your own role");

  const before = await prisma.user.findUniqueOrThrow({ where: { id: v.userId }, select: { role: true } });
  await prisma.user.update({ where: { id: v.userId }, data: { role: v.role } });
  await audit(admin.id, "user.role", v.userId, { before: before.role, after: v.role });

  redirect(`/admin/users/${v.userId}?ok=1`);
}
