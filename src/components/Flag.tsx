import { FLAG_CODES } from "@/admin/lib/countries";

/**
 * A country's flag from the game's own atlas (public/flags.png: 16 flags a
 * row, 4:3), `height` pixels high. Nothing for an unknown or empty code.
 */
export function Flag({ code, height = 15, title }: { code?: string | null; height?: number; title?: string }) {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null;
  const k = FLAG_CODES.indexOf(code.toUpperCase());
  if (k < 0) return null;
  const w = (height * 4) / 3;
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      title={title}
      className="inline-block shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgb(0_0_0/0.35)]"
      style={{
        width: w,
        height,
        backgroundImage: "url(/flags.png)",
        backgroundRepeat: "no-repeat",
        backgroundSize: `${16 * w}px auto`,
        backgroundPosition: `-${(k % 16) * w}px -${Math.floor(k / 16) * height}px`,
      }}
    />
  );
}
