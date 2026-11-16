"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

const noopSubscribe = () => () => {};

/**
 * Every share carries the user's personal invite link, so points are paid
 * for real sign-ups through it — never for the share itself (Facebook
 * forbids rewarding likes/shares, and they can't be verified anyway).
 */
export function ShareButtons({ url, text }: { url: string; text: string }) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  // false on the server, real value after hydration — no mismatch
  const canNativeShare = useSyncExternalStore(noopSubscribe, () => "share" in navigator, () => false);
  const u = encodeURIComponent(url);
  const msg = encodeURIComponent(text);

  const targets = [
    { key: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, bg: "#1877F2" },
    { key: "line", label: "LINE", href: `https://social-plugins.line.me/lineit/share?url=${u}&text=${msg}`, bg: "#06C755" },
    { key: "x", label: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${msg}`, bg: "#000000" },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("copyPrompt"), url);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ url, text });
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={t("linkLabel")}
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg-sunken px-3 py-2 font-mono text-sm text-gold-bright"
        />
        <button type="button" onClick={copy} className="btn-gold shrink-0 px-4 py-2 text-sm">
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {targets.map((s) => (
          <a
            key={s.key}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: s.bg }}
          >
            {s.label}
          </a>
        ))}
        {canNativeShare && (
          <button type="button" onClick={nativeShare} className="btn-ghost py-1.5 text-sm">
            {t("more")}
          </button>
        )}
      </div>
    </div>
  );
}
