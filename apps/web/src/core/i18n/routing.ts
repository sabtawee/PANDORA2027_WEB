import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["th", "en"],
  defaultLocale: "th",
  localePrefix: "always",
  // Many Thai players run English-language browsers; always land on /th
  // and let them switch, instead of guessing from Accept-Language.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
