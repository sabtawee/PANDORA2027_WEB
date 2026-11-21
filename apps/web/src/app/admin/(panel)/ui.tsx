import type { ReactNode } from "react";

/** Small shared building blocks for admin pages. */

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold">{children}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}

export function Card({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel p-5">
      {title && <h2 className="mb-4 font-medium">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-line bg-bg-sunken px-3 py-2 text-sm text-text placeholder:text-faint focus:border-gold focus:outline-none";

export function SaveButton({ children = "บันทึก" }: { children?: ReactNode }) {
  return (
    <button type="submit" className="btn-gold px-5 py-2 text-sm">
      {children}
    </button>
  );
}

export function Flash({ ok }: { ok?: string | string[] }) {
  if (!ok) return null;
  return <p className="mb-4 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">บันทึกแล้ว ✓</p>;
}

const BADGE_TONE = {
  default: "border-line-strong text-muted",
  gold: "border-gold/50 text-gold-bright",
  danger: "border-ember/60 bg-ember/10 text-ember",
  success: "border-success/50 text-success",
};

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: keyof typeof BADGE_TONE }) {
  return <span className={`inline-block rounded border px-1.5 py-0.5 text-xs ${BADGE_TONE[tone]}`}>{children}</span>;
}

/** Admin dates are always shown in Thai time. */
export function fmtDate(d: Date | null | undefined, withTime = true) {
  if (!d) return "-";
  return d.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  });
}

/** Simple ?page= pager that keeps the other query params. */
export function Pager({ page, pages, params }: { page: number; pages: number; params: Record<string, string> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    q.set("page", String(p));
    return `?${q}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      {page > 1 ? <a href={href(page - 1)} className="text-gold-bright hover:underline">← ก่อนหน้า</a> : <span />}
      <span className="text-faint">
        หน้า {page} / {pages}
      </span>
      {page < pages ? <a href={href(page + 1)} className="text-gold-bright hover:underline">ถัดไป →</a> : <span />}
    </div>
  );
}
