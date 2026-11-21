import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/core/db/prisma";
import type { AdminRole } from "@/generated/prisma/client";
import { requestMeta } from "./request";
import { adminHasRole } from "./roles";

/** Scoped to /admin so the cookie is never sent to player pages. */
export const ADMIN_COOKIE = "pd_admin";
const ABSOLUTE_TTL_MS = 12 * 3600_000; // sign in again at least every 12 hours
const IDLE_TTL_MS = 2 * 3600_000; // or after 2 hours with no activity
const TOUCH_EVERY_MS = 5 * 60_000;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const { ip, userAgent } = await requestMeta();
  await prisma.adminSession.create({
    data: { tokenHash: sha256(token), adminId, ip, userAgent, expiresAt: new Date(Date.now() + ABSOLUTE_TTL_MS) },
  });
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: ABSOLUTE_TTL_MS / 1000,
  });
}

export type CurrentAdmin = {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
  mustChangePassword: boolean;
  sessionId: string;
};

/**
 * The signed-in staff member, or null. Deliberately NOT wrapped in React cache():
 * a server action that changes the admin (e.g. password) re-renders in the same
 * request and must see the new values.
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { admin: true },
  });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now || now - session.lastSeenAt.getTime() > IDLE_TTL_MS || !session.admin.isActive) {
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (now - session.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    await prisma.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }

  const a = session.admin;
  return { id: a.id, username: a.username, displayName: a.displayName, role: a.role, mustChangePassword: a.mustChangePassword, sessionId: session.id };
}

/**
 * Gate for every admin page AND server action (actions are public endpoints).
 * Signed out → login; role too low → 404; temporary password → must change it first.
 */
export async function requireAdmin(min: AdminRole = "EDITOR", opts: { allowPasswordChange?: boolean } = {}): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword && !opts.allowPasswordChange) redirect("/admin/account?force=1");
  if (!adminHasRole(admin.role, min)) notFound();
  return admin;
}

/** Sign out this browser. Returns who it was, for the login log. */
export async function destroyCurrentSession() {
  const admin = await getCurrentAdmin();
  if (admin) await prisma.adminSession.delete({ where: { id: admin.sessionId } }).catch(() => {});
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  return admin;
}
