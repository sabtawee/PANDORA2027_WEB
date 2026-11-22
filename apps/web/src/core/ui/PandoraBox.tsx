/**
 * The Pandora box, drawn in SVG so it works before any illustrated key art
 * exists. Each chain is one milestone; broken chains fade and fall away.
 * Class names (pb-*) are hooks for the scroll scene in HeroScrollFx: the lid
 * lifts, and each broken chain gets an intact overlay (hidden unless the scene
 * shows it) so it can be seen snapping during the scroll.
 */
export function PandoraBox({ chains, broken }: { chains: number; broken: number }) {
  const total = Math.max(chains, 1);
  const unlocked = Math.min(broken, total);
  const glow = 0.25 + 0.75 * (unlocked / total);

  // Chains alternate diagonals across the box front
  const chainPaths = Array.from({ length: total }, (_, i) => {
    const t = (i + 1) / (total + 1);
    const y = 178 + t * 150;
    return i % 2 === 0
      ? { d: `M 62 ${y - 34} Q 200 ${y + 12} 338 ${y + 30}`, i }
      : { d: `M 62 ${y + 30} Q 200 ${y + 12} 338 ${y - 34}`, i };
  });

  return (
    <svg viewBox="0 0 400 420" className="w-full max-w-[420px] animate-float overflow-visible" role="img" aria-label="Pandora's Box">
      <defs>
        <linearGradient id="pb-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1cf7a" />
          <stop offset="0.55" stopColor="#d4a84b" />
          <stop offset="1" stopColor="#8f6b22" />
        </linearGradient>
        <linearGradient id="pb-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1f45" />
          <stop offset="1" stopColor="#120c1f" />
        </linearGradient>
        <linearGradient id="pb-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a5e" />
          <stop offset="1" stopColor="#1d1530" />
        </linearGradient>
        <radialGradient id="pb-light" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3cf" stopOpacity="1" />
          <stop offset="0.4" stopColor="#d4a84b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#7b4bd4" stopOpacity="0" />
        </radialGradient>
        <pattern id="pb-chain" width="22" height="12" patternUnits="userSpaceOnUse">
          <rect x="1" y="2" width="14" height="8" rx="4" fill="none" stroke="#b9b3c7" strokeWidth="2.4" />
        </pattern>
      </defs>

      {/* Light escaping the box */}
      <g className="pb-light" style={{ transformOrigin: "200px 160px" }}>
        <ellipse cx="200" cy="150" rx="190" ry="120" fill="url(#pb-light)" opacity={glow} className="animate-glow" />
      </g>

      {/* Lid */}
      <g className="pb-lid" style={{ transformOrigin: "200px 172px" }}>
        <path d="M 46 150 L 200 104 L 354 150 L 200 196 Z" fill="url(#pb-lid)" stroke="url(#pb-gold)" strokeWidth="3" />
        <path d="M 46 150 L 46 172 L 200 218 L 354 172 L 354 150 L 200 196 Z" fill="#1a1229" stroke="url(#pb-gold)" strokeWidth="3" />
      </g>
      {/* Glowing seam under the lid */}
      <path d="M 50 176 L 200 222 L 350 176" fill="none" stroke="#f1cf7a" strokeWidth="2" opacity={glow} className="animate-glow" />

      {/* Body */}
      <path d="M 56 180 L 200 224 L 344 180 L 344 336 L 200 388 L 56 336 Z" fill="url(#pb-body)" stroke="url(#pb-gold)" strokeWidth="3" />
      <path d="M 200 224 L 200 388" stroke="url(#pb-gold)" strokeWidth="2" opacity="0.6" />

      {/* Corner ornaments */}
      {[ [56, 180], [344, 180], [56, 336], [344, 336] ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="url(#pb-gold)" />
      ))}

      {/* Keyhole sigil */}
      <g transform="translate(128 300)">
        <circle r="20" fill="#0b0812" stroke="url(#pb-gold)" strokeWidth="2.5" />
        <circle cy="-4" r="5" fill="#f1cf7a" opacity={glow} />
        <path d="M -3 0 L 3 0 L 5 12 L -5 12 Z" fill="#f1cf7a" opacity={glow} />
      </g>

      {/* Chains */}
      {chainPaths.map(({ d, i }) => {
        const isBroken = i < unlocked;
        return (
          <g key={i}>
          <path
            d={d}
            fill="none"
            stroke={isBroken ? "#d4a84b" : "#9e97ad"}
            strokeWidth={isBroken ? 2 : 7}
            strokeDasharray={isBroken ? "4 14" : "14 5"}
            strokeLinecap="round"
            opacity={isBroken ? 0.35 : 0.95}
          />
          {isBroken && (
            <path
              className="pb-chain-intact"
              d={d}
              fill="none"
              stroke="#9e97ad"
              strokeWidth={7}
              strokeDasharray="14 5"
              strokeLinecap="round"
              opacity={0}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          )}
          </g>
        );
      })}

      {/* Padlock — opens when every chain is broken */}
      {unlocked < total && (
        <g className="pb-lock" transform="translate(272 304)">
          <path d="M -12 -6 V -16 a 12 12 0 0 1 24 0 V -6" fill="none" stroke="#c9c3d6" strokeWidth="5" />
          <rect x="-18" y="-8" width="36" height="30" rx="5" fill="#9e97ad" stroke="#5c5670" strokeWidth="2" />
          <circle cy="6" r="4" fill="#3b3550" />
        </g>
      )}
    </svg>
  );
}
