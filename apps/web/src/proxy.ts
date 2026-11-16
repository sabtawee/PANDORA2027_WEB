import createMiddleware from "next-intl/middleware";
import { routing } from "@/core/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Everything except API, admin, Next internals and files with an extension.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
