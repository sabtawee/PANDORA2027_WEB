import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * ImageResponse's built-in font has no Thai glyphs. Fetch a Kanit subset
 * containing just the characters on the card (a few KB). Google returns TTF
 * to non-browser user agents, which is what Satori needs.
 */
async function loadKanit(text: string, weight: 400 | 600): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Kanit:wght@${weight}&text=${encodeURIComponent(text)}`,
      { next: { revalidate: 86400 } },
    ).then((r) => r.text());
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src, { next: { revalidate: 86400 } });
    return res.ok ? res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export interface OgCardProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: { label: string; color: string };
  footer: string;
}

/** The one card design every OG image uses. */
export async function renderOgCard({ eyebrow, title, subtitle, badge, footer }: OgCardProps) {
  const text = `PANDORA-RO${eyebrow}${title}${subtitle}${badge?.label ?? ""}${footer}0123456789`;
  const [regular, bold] = await Promise.all([loadKanit(text, 400), loadKanit(text, 600)]);
  const fonts = [
    ...(regular ? [{ name: "Kanit", data: regular, weight: 400 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: "Kanit", data: bold, weight: 600 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          fontFamily: "Kanit",
          color: "#f3ecdc",
          background:
            "radial-gradient(900px 500px at 78% 40%, rgba(212,168,75,0.35), transparent 70%), radial-gradient(900px 600px at 20% -10%, rgba(123,75,212,0.45), transparent 70%), #0b0812",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, color: "#a982ff", letterSpacing: 4 }}>{eyebrow}</div>
            <div style={{ fontSize: 92, fontWeight: 600, color: "#f1cf7a", marginTop: 12, lineHeight: 1 }}>PANDORA-RO</div>
            <div style={{ fontSize: 54, fontWeight: 600, marginTop: 24, lineHeight: 1.25, maxWidth: 720 }}>{title}</div>
            <div style={{ fontSize: 30, color: "#b7aecb", marginTop: 18, maxWidth: 700, lineHeight: 1.4 }}>{subtitle}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {badge && (
              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  fontWeight: 600,
                  color: badge.color,
                  border: `3px solid ${badge.color}`,
                  borderRadius: 999,
                  padding: "8px 26px",
                }}
              >
                {badge.label}
              </div>
            )}
            <div style={{ fontSize: 28, color: "#d4a84b" }}>{footer}</div>
          </div>
        </div>

        {/* Emblem: the chained box, drawn with plain shapes */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 330 }}>
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 260,
              height: 230,
              border: "6px solid #d4a84b",
              borderRadius: 18,
              background: "linear-gradient(180deg, #2b1f45, #120c1f)",
              boxShadow: "0 0 120px rgba(241,207,122,0.45)",
            }}
          >
            <div style={{ position: "absolute", left: -18, right: -18, top: -6, height: 54, border: "6px solid #d4a84b", borderRadius: 14, background: "#3a2a5e" }} />
            {/* Crossed chains (SVG: Satori rotates divs around the wrong origin) */}
            <svg width="248" height="218" viewBox="0 0 248 218" style={{ position: "absolute", left: 0, top: 0 }}>
              <line x1="14" y1="78" x2="234" y2="188" stroke="#9e97ad" strokeWidth="13" strokeLinecap="round" strokeDasharray="22 7" />
              <line x1="14" y1="188" x2="234" y2="78" stroke="#9e97ad" strokeWidth="13" strokeLinecap="round" strokeDasharray="22 7" />
            </svg>
            <div style={{ position: "absolute", left: 98, top: 107, width: 52, height: 52, borderRadius: 26, background: "#0b0812", border: "5px solid #f1cf7a" }} />
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}

/** Whole days from now until an ISO date, or null if unset/past. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso) - Date.now();
  return Number.isNaN(ms) || ms < 0 ? null : Math.ceil(ms / 86_400_000);
}
