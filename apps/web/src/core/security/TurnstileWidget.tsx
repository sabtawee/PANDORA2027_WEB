"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile widget. Adds a hidden `cf-turnstile-response` input to
 * the surrounding form. Renders nothing when no site key is configured.
 */
export function TurnstileWidget({ language, onChange }: { language: string; onChange: (verified: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Explicit render so the widget also appears after client-side navigation.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ref.current || !(scriptReady || window.turnstile)) return;
    const id = window.turnstile!.render(ref.current, {
      sitekey: TURNSTILE_SITE_KEY,
      language,
      theme: "dark",
      callback: () => onChange(true),
      "expired-callback": () => onChange(false),
      "error-callback": () => onChange(false),
    });
    return () => window.turnstile?.remove(id);
  }, [scriptReady, language, onChange]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={ref} className="flex min-h-[65px] justify-center pt-2" />
    </>
  );
}
