import "server-only";
import { cookies, headers } from "next/headers";
import {
  ATTR_COOKIE,
  CONSENT_COOKIE,
  REF_CODE_RE,
  REF_COOKIE,
  type AttributionCookie,
} from "./cookies";

export interface SignupContext {
  refCode: string | null;
  attribution: AttributionCookie | null;
  consent: boolean;
  ip: string | null;
  userAgent: string | null;
  /** Meta browser id cookie, if the pixel set one */
  fbp: string | null;
}

/** Read what the visitor's browser carried into the OAuth callback. Never throws. */
export async function readSignupContext(): Promise<SignupContext> {
  try {
    const [c, h] = await Promise.all([cookies(), headers()]);
    const ref = c.get(REF_COOKIE)?.value?.toUpperCase() ?? null;
    let attribution: AttributionCookie | null = null;
    try {
      const raw = c.get(ATTR_COOKIE)?.value;
      attribution = raw ? (JSON.parse(raw) as AttributionCookie) : null;
    } catch {
      attribution = null;
    }
    const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
    return {
      refCode: ref && REF_CODE_RE.test(ref) ? ref : null,
      attribution,
      consent: c.get(CONSENT_COOKIE)?.value === "all",
      ip: ip ?? null,
      userAgent: h.get("user-agent"),
      fbp: c.get("_fbp")?.value ?? null,
    };
  } catch {
    return { refCode: null, attribution: null, consent: false, ip: null, userAgent: null, fbp: null };
  }
}
