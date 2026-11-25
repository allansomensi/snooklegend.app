// Small pictures of the game's things, drawn as the game draws them:
// profile pictures, achievement medals and cues.

import { CUES } from "@/lib/game-data";
import { avatarSrc, MEDAL_COLOR, RARITY_COLOR, type Medal as MedalKind, type Rarity } from "@/lib/player";

/** A player's profile picture (a silhouette for none), `size` pixels across. */
export function Avatar({ code, size, alt, className = "", priority = false }: { code: string; size: number; alt: string; className?: string; priority?: boolean }) {
  const src = avatarSrc(code);
  if (!src) {
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={alt} className={`rounded-full ${className}`}>
        <circle cx="32" cy="32" r="32" fill="#1b3326" />
        <circle cx="32" cy="25" r="11" fill="#74867b" />
        <path d="M11 56c3-11 11-17 21-17s18 6 21 17a32 32 0 0 1-42 0z" fill="#74867b" />
      </svg>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a 4 KB picture, already the right size
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`rounded-full ${className}`}
    />
  );
}

/** An achievement's medal: a ribbon and a disc of its metal, with a star (a ruby set in gold). */
export function Medal({ medal, size = 44, title }: { medal: MedalKind | null; size?: number; title?: string }) {
  const c = MEDAL_COLOR[medal ?? "bronze"];
  const id = `m-${medal ?? "none"}`;
  const ruby = medal === "ruby";
  const disc = ruby ? MEDAL_COLOR.gold : c;
  return (
    <svg
      viewBox="0 0 40 48"
      width={(size * 40) / 48}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={medal ? "" : "opacity-40 grayscale"}
    >
      <defs>
        <linearGradient id={`${id}-d`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={disc.from} />
          <stop offset="1" stopColor={disc.to} />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={c.to} />
          <stop offset="0.5" stopColor={c.from} />
          <stop offset="1" stopColor={c.to} />
        </linearGradient>
      </defs>
      <path d="M9 0h9l6 16h-9zM31 0h-9l-6 16h9z" fill={`url(#${id}-r)`} opacity="0.95" />
      <circle cx="20" cy="30" r="15" fill={`url(#${id}-d)`} />
      <circle cx="20" cy="30" r="11.5" fill="none" stroke={disc.ink} strokeOpacity="0.28" strokeWidth="1.2" />
      {ruby ? (
        <path d="M20 21.5l7 6-7 11-7-11z" fill={`url(#${id}-r)`} stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" />
      ) : (
        <path
          d="M20 22.6l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5-3.7-3.4 5-.6z"
          fill={disc.ink}
          fillOpacity="0.55"
        />
      )}
      <ellipse cx="15" cy="24" rx="5" ry="2.6" fill="#fff" opacity="0.35" transform="rotate(-30 15 24)" />
      {medal === "diamond" && <path d="M31 17l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#fff" />}
    </svg>
  );
}

/**
 * A cue seen from the side, in its colours (from the game's shop), with a
 * glow of its rarity behind it.
 */
export function CueArt({ code, rarity, label, className = "" }: { code: string; rarity: Rarity | null; label: string; className?: string }) {
  const cue = CUES[code] ?? CUES.cue_classic;
  const shaft = cue.carbon ? "#1a1b1e" : "#debe87";
  const glow = rarity ? RARITY_COLOR[rarity] : null;
  const id = `cue-${code}`;
  return (
    <svg viewBox="0 6 400 28" role="img" aria-label={label} className={`w-full overflow-visible ${className}`}>
      <defs>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        {glow && (
          <filter id={`${id}-glow`} x="-10%" y="-200%" width="120%" height="500%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        )}
      </defs>
      {glow && <path d="M8 20 L392 20" stroke={glow} strokeWidth="18" strokeLinecap="round" opacity="0.55" filter={`url(#${id}-glow)`} />}
      {/* Butt (the thick end, on the left), the wrap, the joint ring, the shaft and the tip. */}
      <path d="M6 12.5 L150 14.6 L150 25.4 L6 27.5 Q2 20 6 12.5z" fill={cue.butt} />
      <path d="M60 13.3 L118 14.2 L118 25.8 L60 26.7z" fill={cue.accent} opacity="0.9" />
      <path d="M70 13.5 L96 20 L70 26.5z M108 14 L84 20 L108 26z" fill={cue.butt} opacity="0.5" />
      <rect x="150" y="14.6" width="6" height="10.8" fill={cue.ring} />
      <path d="M156 14.8 L384 17.6 L384 22.4 L156 25.2z" fill={shaft} />
      <rect x="384" y="17.6" width="6" height="4.8" fill="#f4f1e8" />
      <rect x="390" y="17.9" width="3" height="4.2" rx="1" fill="#3b6fb6" />
      <path d="M6 12.5 L384 17.6 L384 22.4 L6 27.5 Q2 20 6 12.5z" fill={`url(#${id}-shade)`} />
    </svg>
  );
}
