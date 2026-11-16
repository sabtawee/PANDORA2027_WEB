"use client";

import { useEffect } from "react";

type Fn = (...args: unknown[]) => void;
declare global {
  interface Window {
    fbq?: Fn;
    gtag?: Fn;
    ttq?: { track: Fn };
  }
}

/**
 * Fires the sign-up conversion once per user in the browser. `eventId` matches
 * the server-side Meta CAPI event, so Meta counts the two as one conversion.
 * Waits a few seconds for consent-gated pixels to finish loading.
 */
export function RegistrationPixel({ eventId }: { eventId: string }) {
  useEffect(() => {
    const key = `pd_conv_${eventId}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      /* storage blocked: still fire, worst case a duplicate Meta dedupes */
    }

    let tries = 0;
    const id = setInterval(() => {
      tries++;
      const ready = window.fbq || window.gtag || window.ttq;
      if (!ready && tries < 10) return;
      clearInterval(id);
      if (!ready) return; // no consent / no pixels configured
      window.fbq?.("track", "CompleteRegistration", {}, { eventID: eventId });
      window.gtag?.("event", "sign_up", { method: "oauth" });
      window.ttq?.track("CompleteRegistration", { event_id: eventId });
      try {
        localStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
    }, 500);
    return () => clearInterval(id);
  }, [eventId]);

  return null;
}
