// What the staff tell a player (the inbox) and the moderation tools around
// it, as plain functions: reading the server's answers, the names pasted
// for presents, a rating put right, a game's strokes in numbers.
import type { MatchStroke, Notification, Preview, PreviewLang } from "./types";

export const PREVIEW_LANGS: PreviewLang[] = ["pt", "en", "es"];

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);

/** The answer of a `"preview": true` call, or null when it isn't one. */
export function parsePreview(x: unknown): Preview | null {
  if (!isObj(x) || x.preview !== true || !isObj(x.notification) || !isObj(x.rendered)) return null;
  const rendered = {} as Preview["rendered"];
  for (const l of PREVIEW_LANGS) {
    const r = x.rendered[l];
    if (!isObj(r)) return null;
    rendered[l] = { title: String(r.title ?? ""), body: String(r.body ?? "") };
  }
  const n = x.notification as unknown as Notification;
  const players = Array.isArray(x.players) ? x.players.map(parsePreview).filter((p): p is Preview => !!p) : undefined;
  return {
    preview: true,
    category: typeof x.category === "string" ? x.category : n.category || "",
    notification: n,
    rendered,
    ...(players && players.length ? { players } : {}),
  };
}

/** Whether a notification was read (an important one: confirmed). */
export const isRead = (n: Pick<Notification, "read_at">) => !!n.read_at && n.read_at > 0;

/** Pinned at the top of the inbox at `now` (Unix seconds). */
export const isPinned = (n: Pick<Notification, "pinned_until">, now: number) => !!n.pinned_until && n.pinned_until > now;

/** A pin "until taken down" (the server's i64::MAX, or anything past year 9999). */
export const pinnedForGood = (until?: number) => !!until && until > 253402300799;

/** The names in a pasted list, as the server reads them (commas,
 * semicolons, spaces, tabs and new lines; a leading "@"), each once
 * whatever its case, in order. `repeated` are those given again. */
export function splitNames(text: string): { names: string[]; repeated: string[] } {
  const seen = new Set<string>();
  const names: string[] = [];
  const repeated: string[] = [];
  for (const raw of text.split(/[,; \n\t\r]/)) {
    const n = raw.trim().replace(/^@+/, "");
    if (!n) continue;
    const k = n.toLowerCase();
    if (seen.has(k)) repeated.push(n);
    else {
      seen.add(k);
      names.push(n);
    }
  }
  return { names, repeated };
}

/** The lowest and highest rating the staff may put. */
export const RATING_RANGE: [number, number] = [100, 4000];

export type RatingChange = { delta: number; after: number } | { error: "number" | "zero" | "range" };

/** A rating put right: points to add (`mode` "delta", negative to take)
 * or the rating to put ("rating"), from the `current` one. */
export function ratingChange(current: number, mode: "delta" | "rating", raw: string): RatingChange {
  const v = raw.trim();
  if (!/^[+-]?\d+$/.test(v)) return { error: "number" };
  const n = Number(v);
  const delta = mode === "delta" ? n : n - current;
  if (delta === 0) return { error: "zero" };
  const after = current + delta;
  if (after < RATING_RANGE[0] || after > RATING_RANGE[1]) return { error: "range" };
  return { delta, after };
}

/** Whole minutes from `now` to `until` (Unix seconds), at least 1. */
export const minutesUntil = (until: number, now: number) => Math.max(1, Math.ceil((until - now) / 60));

/** The longest mute the server allows: 30 days. */
export const MAX_MUTE_MINUTES = 30 * 24 * 60;

export interface SeatStats {
  shots: number;
  /** Shots that made at least one ball (not the cue ball). */
  potting: number;
  balls: number;
  fouls: number;
  avgPower: number | null;
  maxPower: number | null;
  avgThink: number | null;
  maxThink: number | null;
  timeouts: number;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Each seat's shots in numbers: how many, what they made, fouls, power and
 * thinking time (only the strokes that have them). */
export function strokeStats(strokes: MatchStroke[]): [SeatStats, SeatStats] {
  const out = [0, 1].map((seat) => {
    const mine = strokes.filter((s) => s.seat === seat);
    const shots = mine.filter((s) => s.kind === "shot");
    const powers = shots.map((s) => s.power).filter((p): p is number => typeof p === "number");
    const thinks = mine.map((s) => s.think_secs).filter((t): t is number => typeof t === "number");
    const balls = shots.reduce((a, s) => a + (s.potted || []).filter((p) => p.ball !== 0).length, 0);
    return {
      shots: shots.length,
      potting: shots.filter((s) => (s.potted || []).some((p) => p.ball !== 0)).length,
      balls,
      fouls: mine.filter((s) => (s.fouls?.length || 0) > 0 || s.kind === "time_foul").length,
      avgPower: mean(powers),
      maxPower: powers.length ? Math.max(...powers) : null,
      avgThink: mean(thinks),
      maxThink: thinks.length ? Math.max(...thinks) : null,
      timeouts: mine.filter((s) => s.timeout || s.kind === "time_foul").length,
    };
  });
  return [out[0], out[1]];
}

/** A stroke's aim as a compass-like arrow angle and its spin as a point in
 * the cue ball's face (both for drawing). */
export function spinPoint(spin?: { side: number; top: number } | null): [number, number] {
  const clamp = (v: number) => Math.max(-1, Math.min(1, Number(v) || 0));
  return [clamp(spin?.side ?? 0), clamp(spin?.top ?? 0)];
}
