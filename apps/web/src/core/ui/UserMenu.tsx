"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { MeResponse } from "@/app/api/me/route";
import { logoutAction } from "@/core/auth/actions";
import { Link, usePathname } from "@/core/i18n/navigation";

type Me = MeResponse["user"];

/** Window event that makes the navbar reload the signed-in user. */
export const ME_CHANGED = "pd:me-changed";

/** Drop into a page to refresh the navbar user once (e.g. after a profile save). */
export function RefreshMe() {
  useEffect(() => void window.dispatchEvent(new Event(ME_CHANGED)), []);
  return null;
}

export function Avatar({ name, image, size }: { name: string | null; image: string | null; size: number }) {
  const initial = (name?.trim()[0] ?? "?").toUpperCase();
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" width={size} height={size} referrerPolicy="no-referrer" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-arcane/30 font-display text-gold-bright"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  );
}

/**
 * Navbar account area. Loads the session from /api/me after the page renders,
 * so the header (and every page) stays static.
 */
export function UserMenu() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | undefined>(undefined); // undefined = loading
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Refetch on navigation (returning from login, logout redirects) and when a
  // page signals a change with ME_CHANGED (e.g. the profile page after saving).
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`/api/me?locale=${locale}`, { cache: "no-store" })
        .then((r) => r.json() as Promise<MeResponse>)
        .then((d) => alive && setMe(d.user))
        .catch(() => alive && setMe(null));
    load();
    window.addEventListener(ME_CHANGED, load);
    return () => {
      alive = false;
      window.removeEventListener(ME_CHANGED, load);
    };
  }, [pathname, locale]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (me === undefined) return <span aria-hidden className="h-9 w-9 animate-pulse rounded-full bg-line-strong sm:w-28" />;

  if (me === null) {
    return (
      <Link href="/login" className="btn-ghost whitespace-nowrap px-3 text-sm sm:px-5">
        <span className="sm:hidden">{t("login")}</span>
        <span className="hidden sm:inline">{t("loginRegister")}</span>
      </Link>
    );
  }

  const name = me.name || t("player");
  const item = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-bg-raised";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("accountMenu")}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line-strong p-1 transition-colors hover:border-gold sm:pr-3"
      >
        <Avatar name={me.name} image={me.image} size={30} />
        <span className="hidden max-w-[9rem] truncate text-sm sm:inline">{name}</span>
        <svg aria-hidden viewBox="0 0 20 20" className={`hidden h-4 w-4 text-muted transition-transform sm:block ${open ? "rotate-180" : ""}`}>
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="panel absolute right-0 top-full z-40 mt-2 w-64 p-2 shadow-xl">
          <div className="mb-1 flex items-center gap-3 border-b border-line px-3 pb-3 pt-2">
            <Avatar name={me.name} image={me.image} size={40} />
            <div className="min-w-0">
              <p className="truncate font-medium">{name}</p>
              <p className="text-xs text-muted">
                {t("points", { points: me.points })}
                {me.tier && (
                  <>
                    {" · "}
                    <span style={{ color: me.tier.color }}>{me.tier.title}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <Link href="/dashboard" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <span aria-hidden>🎁</span>
            {t("dashboard")}
          </Link>
          <Link href="/profile" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <span aria-hidden>👤</span>
            {t("profile")}
          </Link>
          <form
            action={async (fd) => {
              setOpen(false);
              setMe(null);
              await logoutAction(fd);
            }}
            className="mt-1 border-t border-line pt-1"
          >
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" role="menuitem" className={`${item} text-ember`}>
              <span aria-hidden>⎋</span>
              {t("logout")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
