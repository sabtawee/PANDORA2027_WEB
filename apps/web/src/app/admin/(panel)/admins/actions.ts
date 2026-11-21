"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/core/audit";
import { generateTempPassword, hashPassword } from "@/core/admin/password";
import { requireAdmin } from "@/core/admin/session";
import { prisma } from "@/core/db/prisma";
import { Prisma, type AdminUser } from "@/generated/prisma/client";

/** What goes into the audit log for an admin account (never the password hash). */
const snapshot = (a: AdminUser) => ({
  username: a.username,
  displayName: a.displayName,
  role: a.role,
  isActive: a.isActive,
  mustChangePassword: a.mustChangePassword,
  lockedUntil: a.lockedUntil,
});

const roleEnum = z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

export type TempPasswordState = { error: string | null; username?: string; tempPassword?: string };

const createSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,40}$/, "ชื่อผู้ใช้: a-z 0-9 . _ - ยาว 3-40 ตัว"),
  displayName: z.string().trim().min(1, "ใส่ชื่อที่แสดง").max(80),
  role: roleEnum,
});

/** Creates an account with a one-time temporary password (must be changed at first login). */
export async function createAdminAction(_prev: TempPasswordState, formData: FormData): Promise<TempPasswordState> {
  const me = await requireAdmin("SUPER_ADMIN");
  const parsed = createSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };

  const tempPassword = generateTempPassword();
  try {
    const created = await prisma.adminUser.create({
      data: { ...parsed.data, passwordHash: await hashPassword(tempPassword), mustChangePassword: true, createdById: me.id },
    });
    await audit({ adminId: me.id, op: "CREATE", action: "admin.create", entity: "admin", target: created.username, after: snapshot(created) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return { error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" };
    throw err;
  }
  revalidatePath("/admin/admins");
  return { error: null, username: parsed.data.username, tempPassword };
}

/** New temporary password + sign out everywhere. */
export async function resetPasswordAction(_prev: TempPasswordState, formData: FormData): Promise<TempPasswordState> {
  const me = await requireAdmin("SUPER_ADMIN");
  const id = z.string().min(1).parse(formData.get("id"));
  const before = await prisma.adminUser.findUniqueOrThrow({ where: { id } });

  const tempPassword = generateTempPassword();
  const [after] = await prisma.$transaction([
    prisma.adminUser.update({
      where: { id },
      data: { passwordHash: await hashPassword(tempPassword), mustChangePassword: true, failedAttempts: 0, lockedUntil: null, passwordChangedAt: new Date() },
    }),
    prisma.adminSession.deleteMany({ where: { adminId: id, ...(id === me.id ? { id: { not: me.sessionId } } : {}) } }),
  ]);
  await audit({ adminId: me.id, op: "SECURITY", action: "admin.password.reset", entity: "admin", target: before.username, before: snapshot(before), after: snapshot(after) });
  revalidatePath("/admin/admins");
  return { error: null, username: before.username, tempPassword };
}

const updateSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().trim().min(1).max(80),
  role: roleEnum,
  isActive: z.boolean(),
});

export async function updateAdminAction(formData: FormData) {
  const me = await requireAdmin("SUPER_ADMIN");
  const v = updateSchema.parse({
    id: formData.get("id"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
  });
  const before = await prisma.adminUser.findUniqueOrThrow({ where: { id: v.id } });

  if (v.id === me.id && (v.role !== "SUPER_ADMIN" || !v.isActive)) redirect("/admin/admins?error=self");
  // Never leave the site with no active Super Admin
  if (before.role === "SUPER_ADMIN" && before.isActive && (v.role !== "SUPER_ADMIN" || !v.isActive)) {
    const others = await prisma.adminUser.count({ where: { role: "SUPER_ADMIN", isActive: true, id: { not: v.id } } });
    if (others === 0) redirect("/admin/admins?error=last");
  }

  const after = await prisma.adminUser.update({ where: { id: v.id }, data: { displayName: v.displayName, role: v.role, isActive: v.isActive } });
  if (!v.isActive) await prisma.adminSession.deleteMany({ where: { adminId: v.id } });
  await audit({ adminId: me.id, op: "UPDATE", action: "admin.update", entity: "admin", target: before.username, before: snapshot(before), after: snapshot(after) });

  revalidatePath("/admin/admins");
  redirect("/admin/admins?ok=1");
}

export async function unlockAdminAction(formData: FormData) {
  const me = await requireAdmin("SUPER_ADMIN");
  const id = z.string().min(1).parse(formData.get("id"));
  const before = await prisma.adminUser.findUniqueOrThrow({ where: { id } });
  const after = await prisma.adminUser.update({ where: { id }, data: { failedAttempts: 0, lockedUntil: null } });
  await audit({ adminId: me.id, op: "SECURITY", action: "admin.unlock", entity: "admin", target: before.username, before: snapshot(before), after: snapshot(after) });
  revalidatePath("/admin/admins");
  redirect("/admin/admins?ok=1");
}

export async function revokeSessionsAction(formData: FormData) {
  const me = await requireAdmin("SUPER_ADMIN");
  const id = z.string().min(1).parse(formData.get("id"));
  const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id } });
  const { count } = await prisma.adminSession.deleteMany({ where: { adminId: id, ...(id === me.id ? { id: { not: me.sessionId } } : {}) } });
  await audit({ adminId: me.id, op: "SECURITY", action: "admin.sessions.revoke", entity: "admin", target: admin.username, data: { sessions: count } });
  revalidatePath("/admin/admins");
  redirect("/admin/admins?ok=1");
}
