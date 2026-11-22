import type { CSSProperties } from "react";

export const BALL_COLORS: Record<number, string> = {
  0: "#f4f1e8",
  1: "#f2b705",
  2: "#1f4fd1",
  3: "#d42a24",
  4: "#5b2a91",
  5: "#f06a12",
  6: "#138a43",
  7: "#7a1d1d",
  8: "#121212",
};

export function ballColor(n: number) {
  return BALL_COLORS[n > 8 ? n - 8 : n];
}

/** A pool ball drawn with gradients: solid (1–8), striped (9–15) or the cue ball (0). */
export function Ball({ n, size = 56, className = "", style }: { n: number; size?: number; className?: string; style?: CSSProperties }) {
  const color = ballColor(n);
  const stripe = n > 8;
  const base = stripe ? BALL_COLORS[0] : color;
  return (
    <div
      aria-hidden="true"
      className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative "}shrink-0 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: stripe
          ? `linear-gradient(180deg, ${base} 0 26%, ${color} 26% 74%, ${base} 74% 100%)`
          : base,
        boxShadow: `inset -${size * 0.12}px -${size * 0.16}px ${size * 0.28}px rgb(0 0 0 / 0.55), inset ${size * 0.05}px ${size * 0.06}px ${size * 0.12}px rgb(255 255 255 / 0.25), 0 ${size * 0.25}px ${size * 0.4}px -${size * 0.12}px rgb(0 0 0 / 0.7)`,
        ...style,
      }}
    >
      {n > 0 && (
        <span
          className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#f7f3ea] font-display font-extrabold text-[#111]"
          style={{ width: size * 0.46, height: size * 0.46, fontSize: size * 0.24, lineHeight: 1 }}
        >
          {n}
        </span>
      )}
      <span
        className="absolute rounded-full"
        style={{
          left: "16%",
          top: "12%",
          width: "34%",
          height: "26%",
          background: "radial-gradient(closest-side, rgb(255 255 255 / 0.85), rgb(255 255 255 / 0))",
          transform: "rotate(-25deg)",
        }}
      />
    </div>
  );
}
