import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/core/i18n/routing";
import {
  ATTR_COOKIE,
  ATTRIBUTION_MAX_AGE,
  attributionFromUrl,
  REF_CODE_RE,
  REF_COOKIE,
} from "@/core/tracking/cookies";

const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = intl(request);
  const url = request.nextUrl;
  const cookieOpts = { maxAge: ATTRIBUTION_MAX_AGE, httpOnly: true, sameSite: "lax" as const, path: "/" };

  // First touch wins: never overwrite an existing invite or ad click.
  const ref = url.searchParams.get("ref")?.toUpperCase();
  if (ref && REF_CODE_RE.test(ref) && !request.cookies.has(REF_COOKIE)) {
    response.cookies.set(REF_COOKIE, ref, cookieOpts);
  }

  if (!request.cookies.has(ATTR_COOKIE)) {
    const attr = attributionFromUrl(url, request.headers.get("referer"));
    if (attr) response.cookies.set(ATTR_COOKIE, JSON.stringify(attr), cookieOpts);
  }

  return response;
}

export const config = {
  // Everything except API, admin, Next internals and files with an extension.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
