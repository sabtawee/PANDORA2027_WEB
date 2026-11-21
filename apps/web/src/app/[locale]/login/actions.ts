"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/core/auth";
import { routing, type Locale } from "@/core/i18n/routing";
import { rateLimit } from "@/core/security/rate-limit";
import { clientIp } from "@/core/security/request";
import { setHumanCookie, verifyTurnstile } from "@/core/security/turnstile";
import { FP_COOKIE, FP_RE } from "@/core/tracking/cookies";

export async function loginAction(formData: FormData) {
  const localeRaw = String(formData.get("locale") ?? "");
  const locale: Locale = (routing.locales as readonly string[]).includes(localeRaw) ? (localeRaw as Locale) : routing.defaultLocale;
  const provider = String(formData.get("provider") ?? "");
  if (provider !== "google" && provider !== "discord") redirect(`/${locale}/login`);

  const ip = await clientIp();
  if (!rateLimit(`login:${ip ?? "unknown"}`, 10, 60_000).ok) redirect(`/${locale}/login?error=rate`);

  if (!(await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip))) {
    redirect(`/${locale}/login?error=captcha`);
  }
  await setHumanCookie();

  const fp = String(formData.get("fp") ?? "");
  if (FP_RE.test(fp)) {
    (await cookies()).set(FP_COOKIE, fp, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 });
  }

  await signIn(provider, { redirectTo: `/${locale}/dashboard` });
}
