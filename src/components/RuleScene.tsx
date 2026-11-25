// An animated table for the rules guide (src/lib/scenes.ts): plain SVG moved
// by CSS animations, drawn on the server. The figure around it (SceneFigure)
// pauses it off screen and gives the play, pause and replay buttons. With
// reduced motion, the scene's last moment is shown, still.

import type { Dict } from "@/i18n";
import { ballColor, BALL_COLORS } from "./Ball";
import { BALL_R, FOOT_SPOT, HEAD_SPOT, placeAt, POCKETS, SCENES, type Key, type Scene, type SceneKey } from "@/lib/scenes";

const EASE = "cubic-bezier(0.2, 0.7, 0.3, 1)";
const pct = (t: number) => `${Math.round(t * 10000) / 100}%`;
const TONES = {
  gold: { bg: "#e8bc5e", fg: "#241703" },
  red: { bg: "#e2685a", fg: "#fff" },
  green: { bg: "#3fc076", fg: "#04160c" },
  plain: { bg: "rgba(4,9,7,0.72)", fg: "#f5f0e6" },
} as const;

/** Keyframes for a moving thing, from its keys (the first and last held to 0% and 100%). */
function keyframes(name: string, keys: Key[]): string {
  const all = [...keys];
  if (all[0][0] > 0) all.unshift([0, all[0][1], all[0][2], all[0][3]]);
  if (all.at(-1)![0] < 1) all.push([1, all.at(-1)![1], all.at(-1)![2], all.at(-1)![3]]);
  const frames = all.map(([t, x, y, o]) => `${pct(t)}{transform:translate(${x}px,${y}px);opacity:${o ?? 1};animation-timing-function:${EASE}}`);
  return `@keyframes ${name}{${frames.join("")}}`;
}

/** Keyframes that show something from `from` to `to`. */
function showFrames(name: string, from: number, to: number): string {
  const a = Math.max(0, from - 0.001);
  const fadeIn = Math.min(from + 0.03, to);
  const fadeOut = Math.min(1, to + 0.03);
  return `@keyframes ${name}{0%{opacity:0}${pct(a)}{opacity:0}${pct(fadeIn)}{opacity:1}${pct(to)}{opacity:1}${to < 1 ? `${pct(fadeOut)}{opacity:0}100%{opacity:0}` : "100%{opacity:1}"}}`;
}

export function RuleScene({ scene: key, labels }: { scene: SceneKey; labels: Dict["guide"]["labels"] }) {
  const s: Scene = SCENES[key];
  const id = `sc-${key}`;
  const dur = `${s.duration}s`;
  const still = 0.97;
  const css: string[] = [
    `@keyframes ${id}-stage{0%{opacity:0}3%{opacity:1}95%{opacity:1}100%{opacity:0}}`,
    `.${id} .anim{animation-duration:${dur};animation-iteration-count:infinite;animation-fill-mode:both}`,
    `.${id} .stage{animation-name:${id}-stage;animation-timing-function:linear}`,
    `@media (prefers-reduced-motion: reduce){.${id} .anim{animation:none!important}}`,
  ];
  s.balls.forEach((b) => css.push(keyframes(`${id}-b${b.n}`, b.keys)));
  if (s.hand) css.push(keyframes(`${id}-hand`, s.hand));
  s.labels?.forEach((l, i) => css.push(showFrames(`${id}-l${i}`, l.from, l.to)));
  s.pockets?.forEach((p, i) => css.push(showFrames(`${id}-p${i}`, p.from, p.to)));
  s.sparks?.forEach((sp, i) => css.push(showFrames(`${id}-s${i}`, sp.at, Math.min(1, sp.at + 0.08))));
  if (s.cue) {
    const { from, strike } = s.cue;
    const back = Math.max(from + 0.01, strike - 0.07);
    css.push(
      `@keyframes ${id}-cue{0%{opacity:0;transform:translateX(-5px)}${pct(Math.max(0, from - 0.001))}{opacity:0;transform:translateX(-5px)}${pct(from + 0.02)}{opacity:1;transform:translateX(-6px)}${pct(back)}{opacity:1;transform:translateX(-20px);animation-timing-function:cubic-bezier(.6,0,.9,.4)}${pct(strike)}{opacity:1;transform:translateX(-1px)}${pct(Math.min(1, strike + 0.06))}{opacity:0;transform:translateX(-1px)}100%{opacity:0}}`,
    );
  }

  const shown = (keys: Key[]) => {
    const [, x, y, o] = placeAt(keys, still);
    return { transform: `translate(${x}px,${y}px)`, opacity: o };
  };
  const visibleAtEnd = (from: number, to: number) => (from <= still && to >= still ? 1 : 0);

  return (
    <svg viewBox="-14 -14 228 128" className={`${id} block h-auto w-full`} role="img" aria-hidden="true">
      <style>{css.join("\n")}</style>
      <defs>
        <radialGradient id={`${id}-felt`} cx="50%" cy="40%" r="75%">
          <stop offset="0" stopColor="#23a35a" />
          <stop offset="1" stopColor="#0d5c31" />
        </radialGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a4a28" />
          <stop offset="1" stopColor="#4b2412" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
        <clipPath id={`${id}-ball`}>
          <circle r={BALL_R} />
        </clipPath>
      </defs>

      {/* The table: rails, cushions, felt, pockets, diamonds. */}
      <rect x="-14" y="-14" width="228" height="128" rx="9" fill={`url(#${id}-wood)`} />
      <rect x="-5" y="-5" width="210" height="110" rx="3" fill="#0b4a28" />
      <rect x="0" y="0" width="200" height="100" fill={`url(#${id}-felt)`} />
      {[25, 50, 75, 125, 150, 175].map((x) => (
        <g key={x} fill="#f5e1aa" opacity="0.7">
          <circle cx={x} cy="-9.5" r="0.9" />
          <circle cx={x} cy="109.5" r="0.9" />
        </g>
      ))}
      {[25, 50, 75].map((y) => (
        <g key={y} fill="#f5e1aa" opacity="0.7">
          <circle cx="-9.5" cy={y} r="0.9" />
          <circle cx="209.5" cy={y} r="0.9" />
        </g>
      ))}
      {POCKETS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5.6" fill="#050505" stroke="#1d130b" strokeWidth="1" />
      ))}
      {s.marks && (
        <g opacity="0.55">
          <line x1="50" y1="0" x2="50" y2="100" stroke="#f5f0e6" strokeWidth="0.5" strokeDasharray="2 2" />
          <circle cx={HEAD_SPOT.x} cy={HEAD_SPOT.y} r="0.9" fill="#f5f0e6" />
          <circle cx={FOOT_SPOT.x} cy={FOOT_SPOT.y} r="0.9" fill="#f5f0e6" />
        </g>
      )}

      <g className="anim stage">
        {s.pockets?.map((p, i) => (
          <circle
            key={i}
            className="anim"
            cx={POCKETS[p.i].x}
            cy={POCKETS[p.i].y}
            r="7.5"
            fill="none"
            stroke={p.tone === "gold" ? "#f5e1aa" : "#6fd99a"}
            strokeWidth="1.4"
            style={{ animationName: `${id}-p${i}`, opacity: visibleAtEnd(p.from, p.to) }}
          />
        ))}
        {s.sparks?.map((sp, i) => (
          <g key={i} className="anim" style={{ animationName: `${id}-s${i}`, opacity: 0 }}>
            <circle cx={sp.x} cy={sp.y} r="4.5" fill="#fbe39a" opacity="0.35" />
            <circle cx={sp.x} cy={sp.y} r="1.8" fill="#fff8dc" />
          </g>
        ))}
        {s.hand && (
          <g className="anim" style={{ animationName: `${id}-hand`, ...shown(s.hand) }}>
            <circle r={BALL_R + 2.2} fill="none" stroke="#6fd99a" strokeWidth="0.8" strokeDasharray="1.6 1.4" />
            <circle r={BALL_R} fill={BALL_COLORS[0]} opacity="0.55" />
          </g>
        )}
        {s.balls.map((b) => (
          <g key={b.n} className="anim" style={{ animationName: `${id}-b${b.n}`, ...shown(b.keys) }}>
            <BallSvg n={b.n} id={id} />
          </g>
        ))}
        {s.cue && (
          <g transform={`translate(${s.cue.at[0]} ${s.cue.at[1]}) rotate(${s.cue.angle})`}>
            <g className="anim" style={{ animationName: `${id}-cue`, opacity: 0 }}>
              <path d={`M${-BALL_R - 1} -0.55 L${-BALL_R - 110} -1.5 L${-BALL_R - 110} 1.5 L${-BALL_R - 1} 0.55 Z`} fill="#debe87" />
              <path d={`M${-BALL_R - 70} -1.15 L${-BALL_R - 110} -1.5 L${-BALL_R - 110} 1.5 L${-BALL_R - 70} 1.15 Z`} fill="#3a1d0e" />
              <rect x={-BALL_R - 2} y="-0.6" width="1.2" height="1.2" fill="#3b6fb6" />
            </g>
          </g>
        )}
        {s.labels?.map((l, i) => {
          const tone = TONES[l.tone ?? "plain"];
          const text = labels[l.key];
          const w = text.length * 3.7 + 6;
          return (
            <g key={i} className="anim" style={{ animationName: `${id}-l${i}`, opacity: visibleAtEnd(l.from, l.to) }}>
              <rect x={l.x - w / 2} y={l.y - 5} width={w} height="10" rx="5" fill={tone.bg} />
              <text
                x={l.x}
                y={l.y + 2.4}
                textAnchor="middle"
                fontSize="6.6"
                fontWeight="700"
                fill={tone.fg}
                style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
              >
                {text}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** A ball at the origin: solid, striped or the cue ball, numbered and lit. */
function BallSvg({ n, id }: { n: number; id: string }) {
  const color = ballColor(n);
  return (
    <>
      <circle r={BALL_R} fill={n > 8 || n === 0 ? BALL_COLORS[0] : color} />
      {n > 8 && <rect x={-BALL_R} y={-BALL_R * 0.52} width={BALL_R * 2} height={BALL_R * 1.04} fill={color} clipPath={`url(#${id}-ball)`} />}
      {n > 0 && (
        <>
          <circle r={BALL_R * 0.48} fill="#f7f3ea" />
          <text y={BALL_R * 0.3} textAnchor="middle" fontSize={BALL_R * 0.78} fontWeight="800" fill="#111" style={{ fontFamily: "system-ui, sans-serif" }}>
            {n}
          </text>
        </>
      )}
      <circle r={BALL_R} fill={`url(#${id}-shine)`} />
    </>
  );
}
