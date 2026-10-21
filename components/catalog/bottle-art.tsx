/** Decorative bottle outline in gold. Pure SVG, so the shop looks finished before any photos exist. */
export function BottleArt({ className = "", glow = true }: { className?: string; glow?: boolean }) {
  return (
    <svg viewBox="0 0 120 220" className={`overflow-visible ${className}`} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id="bottle-gold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f0d79b" />
          <stop offset="0.55" stopColor="#c9a35a" />
          <stop offset="1" stopColor="#8a6a2f" />
        </linearGradient>
        <radialGradient id="bottle-glow" cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#8e2a40" stopOpacity="0.55" />
          <stop offset="1" stopColor="#8e2a40" stopOpacity="0" />
        </radialGradient>
      </defs>
      {glow && <ellipse cx="60" cy="130" rx="70" ry="86" fill="url(#bottle-glow)" />}
      <rect x="51" y="6" width="18" height="16" rx="3" fill="url(#bottle-gold)" />
      <path d="M49 24h22v34c0 15 24 22 24 48v86a14 14 0 0 1-14 14H39a14 14 0 0 1-14-14v-86c0-26 24-33 24-48z" stroke="url(#bottle-gold)" strokeWidth="2.5" fill="rgb(255 255 255 / 0.03)" />
      <rect x="37" y="118" width="46" height="52" rx="3" stroke="url(#bottle-gold)" strokeWidth="1.5" opacity="0.7" />
      <path d="M45 134h30M45 144h30M45 154h18" stroke="url(#bottle-gold)" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}
