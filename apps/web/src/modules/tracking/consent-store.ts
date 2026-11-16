"use client";

import { CONSENT_COOKIE, type ConsentValue } from "@/core/tracking/cookies";

const listeners = new Set<() => void>();
const ONE_YEAR = 60 * 60 * 24 * 365;

export function getConsent(): ConsentValue | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(all|necessary)`));
  return (m?.[1] as ConsentValue) ?? null;
}

export function setConsent(value: ConsentValue) {
  // Readable by the server too (auth events check it before sending Meta CAPI)
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax`;
  listeners.forEach((l) => l());
}

export function subscribeConsent(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Server snapshot: unknown, so nothing loads before hydration. */
export const serverConsent = () => undefined;
