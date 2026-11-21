"use server";

import { redirect } from "next/navigation";
import { audit } from "@/core/audit";
import { hashPassword, passwordProblem, verifyPassword } from "@/core/admin/password";
import { requireAdmin } from "@/core/admin/session";
import { prisma } from "@/core/db/prisma";

export type PasswordState = { error: string | null };

export async function changePasswordAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const me = await requireAdmin("EDITOR", { allowPasswordChange: true });
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const admin = await prisma.adminUser.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await verifyPassword(current, admin.passwordHash))) return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  if (next !== confirm) return { error: "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน" };
  if (next === current) return { error: "รหัสผ่านใหม่ต้องไม่ซ้ำรหัสเดิม" };
  const problem = passwordProblem(next, admin.username);
  if (problem) return { error: problem };

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: await hashPassword(next), mustChangePassword: false, passwordChangedAt: new Date() },
    }),
    // Sign out every other browser; keep this one
    prisma.adminSession.deleteMany({ where: { adminId: admin.id, id: { not: me.sessionId } } }),
  ]);
  await audit({ adminId: me.id, op: "SECURITY", action: "admin.password.change", entity: "admin", target: admin.username });

  redirect(admin.role === "EDITOR" ? "/admin/news?ok=1" : "/admin?ok=1");
}
