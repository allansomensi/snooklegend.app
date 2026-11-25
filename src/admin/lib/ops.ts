// The operations pages' plain functions: settings checked as the server
// checks them, time zones, the calendar's month and clashes, date ranges
// for the exports, and the coin economy's series.
import type { CalendarItem, CoinDay, CoinHealth, Setting, SettingValue } from "./types";

// --------------------------------------------------------------- settings

/** A setting's value as typed in the form, checked the server's way:
 * the value to send, or the problem ("number", "range", "time", "length",
 * "choice"). */
export function checkSetting(s: Pick<Setting, "type" | "range">, raw: string | boolean): { value: SettingValue } | { error: string } {
  const r = s.range || {};
  switch (s.type) {
    case "bool":
      return { value: !!raw };
    case "int": {
      const v = String(raw).trim();
      if (!/^-?\d+$/.test(v)) return { error: "number" };
      const n = Number(v);
      if ((r.min !== undefined && n < r.min) || (r.max !== undefined && n > r.max)) return { error: "range" };
      return { value: n };
    }
    case "time": {
      const m = String(raw).trim().match(/^(\d{1,2}):(\d{2})$/);
      if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return { error: "time" };
      return { value: m[1].padStart(2, "0") + ":" + m[2] };
    }
    case "choice": {
      const v = String(raw);
      if (r.options && !r.options.includes(v)) return { error: "choice" };
      return { value: v };
    }
    case "text": {
      const v = String(raw).replace(/\s*\n\s*/g, " ").trim();
      if (r.max_length !== undefined && [...v].length > r.max_length) return { error: "length" };
      return { value: v };
    }
    default:
      return { value: String(raw).trim() };
  }
}

/** Two setting values are the same (a number and its text, too). */
export const sameValue = (a: SettingValue | null | undefined, b: SettingValue | null | undefined) => String(a ?? "") === String(b ?? "");

// ------------------------------------------------------------- time zones

/** The browser's time zone ("America/Sao_Paulo"), or "UTC". */
export function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Minutes from UTC of `timeZone` at `at` (Unix seconds): −180 for Brasília. */
export function zoneOffset(timeZone: string, at = Date.now() / 1000): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(at * 1000));
    const get = (k: string) => Number(parts.find((p) => p.type === k)?.value);
    const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
    return Math.round((local - Math.floor(at / 60) * 60000) / 60000);
  } catch {
    return 0;
  }
}

/** "UTC−03:00" for −180. */
export function offsetLabel(minutes: number): string {
  const a = Math.abs(minutes);
  const pad = (n: number) => String(n).padStart(2, "0");
  return "UTC" + (minutes >= 0 ? "+" : "−") + pad(Math.floor(a / 60)) + ":" + pad(a % 60);
}

/** Time zones to choose from: the browser's first, then the usual ones. */
export const ZONES = [
  "UTC", "America/Sao_Paulo", "America/Manaus", "America/Argentina/Buenos_Aires", "America/Santiago", "America/Bogota",
  "America/Mexico_City", "America/New_York", "America/Los_Angeles", "Europe/Lisbon", "Europe/London", "Europe/Madrid",
  "Africa/Luanda", "Africa/Maputo", "Asia/Tokyo", "Australia/Sydney",
];

// -------------------------------------------------------------- calendar

const DAY = 86400;

/** The days of a month's page: whole weeks (starting on `weekStart`, 0
 * Sunday) from the one with the 1st to the one with the last day, each a
 * local date at midnight. */
export function monthGrid(year: number, month: number, weekStart = 0): Date[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() - weekStart + 7) % 7;
  const last = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((lead + last) / 7) * 7;
  return Array.from({ length: cells }, (_, k) => new Date(year, month, 1 - lead + k));
}

/** Unix seconds of a local date's midnight. */
export const dayStart = (d: Date) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000);

/** The items of the calendar that are on during the local day `d`. */
export function itemsOnDay<T extends Pick<CalendarItem, "starts_at" | "ends_at">>(items: T[], d: Date): T[] {
  const a = dayStart(d);
  const b = dayStart(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  return items.filter((i) => i.starts_at < b && Math.max(i.ends_at, i.starts_at + 1) > a);
}

/** Kinds that clash with each other when they run at once. */
const CLASH_GROUP: Record<string, string> = {
  tournament: "tournament", weekly_cup: "tournament", event: "boost", promotion: "promotion", auction: "auction",
};

export interface Clash {
  a: CalendarItem;
  b: CalendarItem;
  /** "maintenance": something runs while the server stops; "same": two of
   * a kind at once (tournaments, boosts, promotions, auctions). */
  why: "maintenance" | "same";
}

/** What runs at the same time and shouldn't: anything during a maintenance,
 * two tournaments (the weekly cup included), two boosts, two promotions or
 * two auctions. Called-off and finished things never clash. */
export function clashes(items: CalendarItem[]): Clash[] {
  const on = items.filter((i) => i.status !== "cancelled" && i.status !== "ended" && i.kind !== "vip_item");
  const out: Clash[] = [];
  for (let x = 0; x < on.length; x++) {
    for (let y = x + 1; y < on.length; y++) {
      const a = on[x];
      const b = on[y];
      if (!(a.starts_at < b.ends_at && b.starts_at < a.ends_at)) continue;
      if (a.kind === "maintenance" || b.kind === "maintenance") {
        if (a.kind !== b.kind) out.push({ a, b, why: "maintenance" });
      } else if (CLASH_GROUP[a.kind] && CLASH_GROUP[a.kind] === CLASH_GROUP[b.kind]) {
        out.push({ a, b, why: "same" });
      }
    }
  }
  return out;
}

/** A key for a calendar item (several may have no id). */
export const itemKey = (i: CalendarItem) => i.kind + ":" + (i.id ?? "") + ":" + i.starts_at;

// ---------------------------------------------------------------- exports

/** A `YYYY-MM-DD` date field as local midnight, in Unix seconds (NaN when not a date). */
export function dateInput(v: string): number {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return NaN;
  return Math.floor(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() / 1000);
}

/** A local date as a `YYYY-MM-DD` date field. */
export function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The range of an export, from the first day's start to the end of the
 * last day (both local), or null when it isn't one. */
export function exportRange(from: string, to: string): [number, number] | null {
  const a = dateInput(from);
  const b = dateInput(to);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  const end = new Date(b * 1000);
  return [a, Math.floor(new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).getTime() / 1000)];
}

// ---------------------------------------------------------------- coins

/** The keys of `field` over the days, largest total first. */
export function seriesKeys(days: CoinDay[], field: "by_source" | "by_sink"): string[] {
  const total = new Map<string, number>();
  for (const d of days) for (const [k, v] of Object.entries(d[field] || {})) total.set(k, (total.get(k) || 0) + v);
  return [...total.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k]) => k);
}

/** The top `n` keys, the rest summed as "other" (`*`). */
export function topWithRest(keys: string[], n: number): string[] {
  return keys.length > n ? [...keys.slice(0, n - 1), "*"] : keys;
}

/** A day's value of a key of `seriesKeys`/`topWithRest` ("*": the rest). */
export function seriesValue(d: CoinDay, field: "by_source" | "by_sink", key: string, shown: string[]): number {
  const m = d[field] || {};
  if (key !== "*") return m[key] || 0;
  return Object.entries(m).filter(([k]) => !shown.includes(k)).reduce((a, [, v]) => a + v, 0);
}

/** The colour of the economy's health. */
export const healthTone = (h: CoinHealth): string =>
  ({ healthy: "success", watch: "warning", inflating: "danger", deflating: "info", unknown: "" } as Record<string, string>)[h] ?? "";

/** A shop sink's parts: "shop:cue" → ["shop", "cue"]. */
export const sinkParts = (k: string): [string, string | null] => {
  const i = k.indexOf(":");
  return i < 0 ? [k, null] : [k.slice(0, i), k.slice(i + 1)];
};

// --------------------------------------------------------------- heatmap

/** A cell's shade, 0 (none) to 5, against the busiest cell. */
export function heatLevel(v: number, max: number): number {
  if (!(v > 0) || !(max > 0)) return 0;
  return Math.max(1, Math.min(5, Math.ceil((v / max) * 5)));
}

/** Weekdays in the order of the week as the language starts it (0 Sunday). */
export const weekOrder = (weekStart: number) => Array.from({ length: 7 }, (_, k) => (weekStart + k) % 7);

/** The first day of the week in `lang` (0 Sunday, 1 Monday). */
export function weekStartOf(lang: string): number {
  try {
    const info = (new Intl.Locale(lang) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } });
    const first = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    if (first) return first % 7;
  } catch {
    /* an old browser */
  }
  return lang.startsWith("en") || lang.startsWith("pt") ? 0 : 1;
}

/** Seconds as [days, hours, minutes, seconds] (a countdown). */
export function countdownParts(secs: number): [number, number, number, number] {
  const s = Math.max(0, Math.floor(secs));
  return [Math.floor(s / DAY), Math.floor((s % DAY) / 3600), Math.floor((s % 3600) / 60), s % 60];
}

// ----------------------------------------------------------- tournaments

/** A tournament's prizes [champion, runner-up] from the entry fees left
 * after the house's cut and the house's prize: with a champion's share
 * (50–100 %), that share of both and the rest; else the usual, 70 % and
 * 20 % of the fees, 70 % and 30 % of the house's prize. */
export function prizeSplit(fees: number, house: number, share: number): [number, number] {
  if (share >= 50) {
    const pool = fees + house;
    const first = Math.floor((pool * share) / 100);
    return [first, pool - first];
  }
  const h = Math.floor(house * 0.7);
  return [Math.floor(fees * 0.7) + h, Math.floor(fees * 0.2) + (house - h)];
}
