"use client";

import { useEffect, useState, type ReactNode } from "react";
import { deviceFingerprint } from "@/core/security/fingerprint";
import { TURNSTILE_SITE_KEY, TurnstileWidget } from "@/core/security/TurnstileWidget";
import { loginAction } from "./actions";

export function LoginForm({ locale, google, discord }: { locale: string; google: ReactNode; discord: ReactNode }) {
  const [fp, setFp] = useState("");
  const [verified, setVerified] = useState(!TURNSTILE_SITE_KEY);

  useEffect(() => {
    deviceFingerprint().then((v) => v && setFp(v));
  }, []);

  return (
    <form action={loginAction} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="fp" value={fp} />
      <button
        type="submit"
        name="provider"
        value="google"
        disabled={!verified}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 font-medium text-[#1f1f1f] transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-50"
      >
        {google}
      </button>
      <button
        type="submit"
        name="provider"
        value="discord"
        disabled={!verified}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-[#5865F2] px-5 py-3 font-medium text-white transition hover:bg-[#4752c4] disabled:cursor-wait disabled:opacity-50"
      >
        {discord}
      </button>
      <TurnstileWidget language={locale} onChange={setVerified} />
    </form>
  );
}
