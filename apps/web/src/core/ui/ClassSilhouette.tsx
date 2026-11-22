/**
 * Original placeholder character art (generic fantasy silhouettes, not game
 * assets). One shared figure plus a weapon/prop per class. Replace with
 * commissioned art later.
 */
export type ClassKey = "swordman" | "mage" | "archer" | "acolyte" | "thief" | "merchant";

export const CLASS_TINT: Record<ClassKey, string> = {
  swordman: "#e0644c",
  mage: "#8f6bff",
  archer: "#5fbf7a",
  acolyte: "#f1cf7a",
  thief: "#4fb3c9",
  merchant: "#d98b3a",
};

function Prop({ k }: { k: ClassKey }) {
  const metal = "url(#cs-metal)";
  switch (k) {
    case "swordman": // greatsword held upright
      return (
        <g>
          <path d="M 150 40 L 158 52 L 158 168 L 142 168 L 142 52 Z" fill={metal} />
          <rect x="128" y="166" width="44" height="8" rx="3" fill="url(#cs-gold)" />
          <rect x="146" y="174" width="8" height="26" rx="3" fill="#3a2a1c" />
          <circle cx="150" cy="204" r="6" fill="url(#cs-gold)" />
        </g>
      );
    case "mage": // staff with a glowing orb
      return (
        <g>
          <rect x="146" y="70" width="7" height="170" rx="3" fill="#4a3324" />
          <path d="M 138 74 Q 150 46 162 74" fill="none" stroke="url(#cs-gold)" strokeWidth="4" />
          <circle cx="150" cy="60" r="14" fill="var(--cs-tint)" opacity="0.9" />
          <circle cx="150" cy="60" r="26" fill="var(--cs-tint)" opacity="0.25" />
        </g>
      );
    case "archer": // drawn bow and arrow
      return (
        <g>
          <path d="M 140 50 Q 182 130 140 210" fill="none" stroke="#6b4a2c" strokeWidth="6" strokeLinecap="round" />
          <path d="M 140 50 L 118 130 L 140 210" fill="none" stroke="#d9d4e4" strokeWidth="1.5" />
          <path d="M 118 130 L 176 130" stroke="#d9d4e4" strokeWidth="2.5" />
          <path d="M 176 130 l -9 -5 v 10 Z" fill={metal} />
        </g>
      );
    case "acolyte": // staff topped with a star and a halo of light
      return (
        <g>
          <circle cx="100" cy="52" r="30" fill="none" stroke="var(--cs-tint)" strokeWidth="2" opacity="0.6" />
          <rect x="147" y="78" width="6" height="160" rx="3" fill="#e9e2cf" />
          <path d="M 150 50 l 6 14 l 15 1 l -12 9 l 4 15 l -13 -8 l -13 8 l 4 -15 l -12 -9 l 15 -1 Z" fill="url(#cs-gold)" />
        </g>
      );
    case "thief": // two daggers, crossed low
      return (
        <g>
          <g transform="rotate(-35 128 186)">
            <path d="M 128 132 L 134 142 L 134 180 L 122 180 L 122 142 Z" fill={metal} />
            <rect x="116" y="180" width="24" height="5" rx="2" fill="#2c2a3a" />
            <rect x="125" y="185" width="6" height="16" rx="2" fill="#2c2a3a" />
          </g>
          <g transform="rotate(35 72 186)">
            <path d="M 72 132 L 78 142 L 78 180 L 66 180 L 66 142 Z" fill={metal} />
            <rect x="60" y="180" width="24" height="5" rx="2" fill="#2c2a3a" />
            <rect x="69" y="185" width="6" height="16" rx="2" fill="#2c2a3a" />
          </g>
        </g>
      );
    case "merchant": // axe over the shoulder and a coin pouch
      return (
        <g>
          <rect x="138" y="60" width="7" height="130" rx="3" fill="#5a3d26" transform="rotate(18 141 125)" />
          <path d="M 152 58 q 30 6 26 34 q -20 -6 -34 -2 Z" fill={metal} transform="rotate(18 141 125)" />
          <path d="M 52 196 q -12 4 -10 18 q 2 14 18 14 q 16 0 18 -14 q 2 -14 -10 -18 Z" fill="#7a5530" />
          <circle cx="60" cy="214" r="4" fill="url(#cs-gold)" />
        </g>
      );
  }
}

export function ClassSilhouette({ k, className }: { k: ClassKey; className?: string }) {
  return (
    <svg viewBox="0 0 200 260" className={className} style={{ "--cs-tint": CLASS_TINT[k] } as React.CSSProperties} aria-hidden>
      <defs>
        <linearGradient id="cs-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f0f7" />
          <stop offset="1" stopColor="#8d88a0" />
        </linearGradient>
        <linearGradient id="cs-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1cf7a" />
          <stop offset="1" stopColor="#8f6b22" />
        </linearGradient>
        <linearGradient id={`cs-body-${k}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2140" />
          <stop offset="1" stopColor="#0f0b18" />
        </linearGradient>
        <radialGradient id={`cs-aura-${k}`} cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor={CLASS_TINT[k]} stopOpacity="0.55" />
          <stop offset="1" stopColor={CLASS_TINT[k]} stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="140" rx="95" ry="115" fill={`url(#cs-aura-${k})`} />
      <ellipse cx="100" cy="248" rx="58" ry="8" fill="#000" opacity="0.45" />

      {/* Figure: hooded head, cloak, legs. The rim stroke picks up the class colour. */}
      <g stroke={CLASS_TINT[k]} strokeOpacity="0.55" strokeWidth="1.5" fill={`url(#cs-body-${k})`}>
        <path d="M 74 236 L 84 176 L 96 176 L 92 240 Z" />
        <path d="M 126 236 L 116 176 L 104 176 L 108 240 Z" />
        <path d="M 100 84 C 70 84 58 110 54 140 C 50 172 56 196 64 206 L 136 206 C 144 196 150 172 146 140 C 142 110 130 84 100 84 Z" />
        <path d="M 100 34 C 82 34 72 48 72 64 C 72 82 84 94 100 94 C 116 94 128 82 128 64 C 128 48 118 34 100 34 Z" />
      </g>
      {/* Face shadow and eyes */}
      <path d="M 84 58 Q 100 50 116 58 L 114 80 Q 100 88 86 80 Z" fill="#06040b" />
      <circle cx="93" cy="68" r="2.2" fill={CLASS_TINT[k]} />
      <circle cx="107" cy="68" r="2.2" fill={CLASS_TINT[k]} />
      {/* Belt */}
      <rect x="64" y="160" width="72" height="7" rx="3" fill="url(#cs-gold)" opacity="0.8" />

      <Prop k={k} />
    </svg>
  );
}
