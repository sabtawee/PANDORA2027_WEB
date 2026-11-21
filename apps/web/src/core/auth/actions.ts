"use server";

import { signOut } from "@/core/auth";
import { routing, type Locale } from "@/core/i18n/routing";

/** Navbar "log out". Sends the player back to the home page in their language. */
export async function logoutAction(formData: FormData) {
  const raw = String(formData.get("locale") ?? "");
  const locale: Locale = (routing.locales as readonly string[]).includes(raw) ? (raw as Locale) : routing.defaultLocale;
  await signOut({ redirectTo: `/${locale}` });
}
