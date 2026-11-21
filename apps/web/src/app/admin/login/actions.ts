"use server";

import { redirect } from "next/navigation";
import { logAdminLogin } from "@/core/admin/login-log";
import { burnPasswordCheck, verifyPassword } from "@/core/admin/password";
import { requestMeta } from "@/core/admin/request";
import { createAdminSession, destroyCurrentSession, getCurrentAdmin } from "@/core/admin/session";
import { prisma } from "@/core/db/prisma";
import { rateLimit } from "@/core/security/rate-limit";
import { verifyTurnstile } from "@/core/security/turnstile";

const MAX_FAILS = 5; // wrong passwords in a row before the account locks
const LOCK_MS = 15 * 60_000;
const IP_FAILS_WINDOW_MS = 15 * 60_000;
const IP_MAX_FAILS = 20; // failed attempts from one IP (any username) in the window

export type LoginState = { error: string | null; username: string };

const GENERIC = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";

export async function adminLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (await getCurrentAdmin()) redirect("/admin");

  const username = String(formData.get("username") ?? "").trim().toLowerCase().slice(0, 80);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const { ip } = await requestMeta();
  const fail = async (reason: string, adminId: string | null, error = GENERIC): Promise<LoginState> => {
    await logAdminLogin({ adminId, username: username || "(empty)", event: "LOGIN_FAILED", reason });
    return { error, username };
  };

  if (!username || !password) return { error: "กรอกชื่อผู้ใช้และรหัสผ่าน", username };

  // Brute-force guards: fast in-memory window + a DB count that survives restarts
  const recentIpFails = ip
    ? await prisma.adminLoginLog.count({ where: { ip, event: "LOGIN_FAILED", createdAt: { gte: new Date(Date.now() - IP_FAILS_WINDOW_MS) } } })
    : 0;
  if (!rateLimit(`admin-login:${ip ?? "unknown"}`, 10, 60_000).ok || recentIpFails >= IP_MAX_FAILS) {
    return fail("RATE_LIMIT", null, "ลองเข้าระบบบ่อยเกินไป รอ 15 นาทีแล้วลองใหม่");
  }

  if (!(await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip))) {
    return fail("CAPTCHA", null, "ยืนยันว่าไม่ใช่บอทไม่ผ่าน ลองใหม่อีกครั้ง");
  }

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) {
    await burnPasswordCheck(password);
    return fail("UNKNOWN_USER", null);
  }
  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return fail("LOCKED", admin.id, "ใส่รหัสผิดหลายครั้ง บัญชีถูกล็อกชั่วคราว 15 นาที");
  }

  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) {
    const fails = admin.failedAttempts + 1;
    const lock = fails >= MAX_FAILS;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: lock ? { failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } : { failedAttempts: fails },
    });
    return fail(lock ? "BAD_PASSWORD_LOCKED" : "BAD_PASSWORD", admin.id);
  }
  // Only reveal "disabled" once the password is proven correct
  if (!admin.isActive) return fail("DISABLED", admin.id, "บัญชีนี้ถูกปิดใช้งาน ติดต่อ Super Admin");

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip },
  });
  await createAdminSession(admin.id);
  await logAdminLogin({ adminId: admin.id, username, event: "LOGIN_SUCCESS", reason: "OK" });

  redirect(admin.mustChangePassword ? "/admin/account?force=1" : admin.role === "EDITOR" ? "/admin/news" : "/admin");
}

export async function logoutAction() {
  const admin = await destroyCurrentSession();
  if (admin) await logAdminLogin({ adminId: admin.id, username: admin.username, event: "LOGOUT", reason: "LOGOUT" });
  redirect("/admin/login");
}
