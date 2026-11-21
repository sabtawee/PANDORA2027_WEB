import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Cloudflare Turnstile. The login page verifies a token, then sets a short
 * signed "human" cookie; the Auth.js signIn callback requires that cookie for
 * any NEW account, so calling /api/auth/signin directly doesn't skip the check.
 * With no secret configured (local dev) everything passes.
 */
export const HUMAN_COOKIE = "pd_human";
const HUMAN_TTL_MS = 15 * 60 * 1000;

export function turnstileEnabled() {
  return !!process.env.TURNSTILE_SECRET_KEY && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

export async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (!token || token.length > 2048) return false;
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] verify failed", (err as Error).message);
    return false;
  }
}

const sign = (ts: string) => createHmac("sha256", process.env.AUTH_SECRET ?? "").update(`human:${ts}`).digest("base64url");

export async function setHumanCookie() {
  const ts = String(Date.now());
  (await cookies()).set(HUMAN_COOKIE, `${ts}.${sign(ts)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: HUMAN_TTL_MS / 1000,
  });
}

export async function hasValidHumanCookie(): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  const raw = (await cookies()).get(HUMAN_COOKIE)?.value;
  const [ts, sig] = raw?.split(".") ?? [];
  if (!ts || !sig || Date.now() - Number(ts) > HUMAN_TTL_MS) return false;
  const expected = Buffer.from(sign(ts));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
