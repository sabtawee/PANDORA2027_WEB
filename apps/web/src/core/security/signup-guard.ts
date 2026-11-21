import "server-only";
import { cookies } from "next/headers";
import { audit } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import { getSetting } from "@/core/settings";
import { clientIp } from "./request";
import { HUMAN_COOKIE, hasValidHumanCookie } from "./turnstile";

/** True when the request carries a live Auth.js database session (account linking). */
export async function hasActiveSession(): Promise<boolean> {
  const c = await cookies();
  const token = c.get("__Secure-authjs.session-token")?.value ?? c.get("authjs.session-token")?.value;
  if (!token) return false;
  const s = await prisma.session.findUnique({ where: { sessionToken: token }, select: { expires: true } });
  return !!s && s.expires > new Date();
}

/**
 * Gate for creating a new account. Refusals are written to the audit log
 * (actor = none) so admins can see blocked attempts.
 */
export async function checkNewSignup(): Promise<boolean> {
  const ip = await clientIp();

  if (!(await hasValidHumanCookie())) {
    await audit({ adminId: null, op: "SECURITY", action: "signup.blocked.captcha", entity: "signup", target: ip });
    return false;
  }

  const { maxSignupsPerIp24h } = await getSetting("fraud");
  if (ip && maxSignupsPerIp24h > 0) {
    const recent = await prisma.user.count({
      where: { signupIp: ip, createdAt: { gte: new Date(Date.now() - 24 * 3600_000) } },
    });
    if (recent >= maxSignupsPerIp24h) {
      await audit({ adminId: null, op: "SECURITY", action: "signup.blocked.ip_cap", entity: "signup", target: ip, data: { recent, limit: maxSignupsPerIp24h } });
      return false;
    }
  }
  // One bot check = one new account
  (await cookies()).delete(HUMAN_COOKIE);
  return true;
}
