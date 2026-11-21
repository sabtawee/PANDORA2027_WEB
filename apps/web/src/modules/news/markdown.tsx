import type { ReactNode } from "react";

/**
 * Tiny, safe Markdown subset for news posts. Builds React elements (never raw
 * HTML), so editors can't inject scripts. Supports: # / ## / ### headings,
 * - and 1. lists, > quotes, ![alt](url) images, **bold**, *italic*, `code`,
 * [text](url) links, and --- dividers.
 */

const safeUrl = (u: string) => (/^(https?:\/\/|\/)/i.test(u.trim()) ? u.trim() : null);

function inline(text: string, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[2]) out.push(<strong key={k}>{inline(m[2], k)}</strong>);
    else if (m[3]) out.push(<em key={k}>{inline(m[3], k)}</em>);
    else if (m[4]) out.push(<code key={k}>{m[4]}</code>);
    else if (m[5]) {
      const href = safeUrl(m[6]);
      const external = href?.startsWith("http");
      out.push(
        href ? (
          <a key={k} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
            {inline(m[5], k)}
          </a>
        ) : (
          m[5]
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function withBreaks(lines: string[], key: string): ReactNode[] {
  return lines.flatMap((l, i) => (i === 0 ? inline(l, `${key}-${i}`) : [<br key={`${key}-br${i}`} />, ...inline(l, `${key}-${i}`)]));
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        const lines = block.split("\n");
        const h = /^(#{1,3})\s+(.*)$/.exec(block);
        if (h && lines.length === 1) {
          const Tag = (["h2", "h3", "h4"] as const)[h[1].length - 1];
          return <Tag key={key}>{inline(h[2], key)}</Tag>;
        }
        if (/^-{3,}$/.test(block)) return <hr key={key} />;
        const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(block);
        if (img) {
          const src = safeUrl(img[2]);
          // eslint-disable-next-line @next/next/no-img-element
          return src ? <img key={key} src={src} alt={img[1]} loading="lazy" /> : null;
        }
        if (lines.every((l) => /^[-*]\s+/.test(l)))
          return <ul key={key}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^[-*]\s+/, ""), `${key}-${j}`)}</li>)}</ul>;
        if (lines.every((l) => /^\d+\.\s+/.test(l)))
          return <ol key={key}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\.\s+/, ""), `${key}-${j}`)}</li>)}</ol>;
        if (lines.every((l) => l.startsWith(">")))
          return <blockquote key={key}>{withBreaks(lines.map((l) => l.replace(/^>\s?/, "")), key)}</blockquote>;
        return <p key={key}>{withBreaks(lines, key)}</p>;
      })}
    </>
  );
}

/** Plain-text excerpt fallback (for meta description when none is set). */
export function plainText(source: string, max = 160) {
  const t = source
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*`_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
