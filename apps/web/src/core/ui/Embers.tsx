/** Floating light particles. Positions are fixed (not random) so SSR and client match. */
const EMBERS = [
  [6, 0, 9, 3], [14, 2.5, 11, 2], [22, 5, 8, 4], [31, 1, 12, 2], [39, 6.5, 10, 3],
  [47, 3, 9, 2], [55, 7.5, 13, 3], [63, 0.5, 10, 2], [71, 4, 8, 4], [79, 2, 12, 2],
  [86, 6, 11, 3], [93, 3.5, 9, 2],
];

export function Embers() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {EMBERS.map(([left, delay, duration, size], i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full animate-rise"
          style={{
            left: `${left}%`,
            width: size,
            height: size,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            background: i % 3 === 0 ? "var(--arcane-bright)" : "var(--gold-bright)",
            boxShadow: `0 0 ${size * 3}px ${i % 3 === 0 ? "var(--arcane)" : "var(--gold)"}`,
          }}
        />
      ))}
    </div>
  );
}
