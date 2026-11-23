import { CalendarDays, Coins, Star, Trophy, type LucideIcon } from "lucide-react";
import { msg, type Translator } from "@/admin/i18n";
import type { Formatters } from "@/admin/lib/format";
import type { GameEvent, RulesId } from "@/admin/lib/types";

export const EVENT_KINDS: Record<string, [string, LucideIcon, string]> = {
  xp: [msg("Experience"), Star, "success"],
  coins: [msg("Coins from games"), Coins, "warning"],
  tournament: [msg("Themed tournament"), Trophy, "info"],
};
export const eventKind = (k: string): [string, LucideIcon, string] => EVENT_KINDS[k] || [k, CalendarDays, ""];

export const EVENT_STATUS: Record<string, [string, string]> = {
  live: [msg("Running"), "success dot"],
  scheduled: [msg("Scheduled"), "info"],
  ended: [msg("Ended"), ""],
  cancelled: [msg("Called off"), "danger"],
};

export type EventShape = Pick<GameEvent, "kind" | "multiplier" | "rules" | "format" | "size" | "rated" | "entry_fee" | "prize" | "starts_at" | "ends_at">;

/** What an event does, in a line. */
export function eventWhat(e: EventShape, l: Translator & Formatters) {
  const { t, tf, fmtNum, fmtMinutes } = l;
  const rulesName = (r: RulesId) => (r === "official" ? t("Official rules") : t("Brazilian rules"));
  if (e.kind === "tournament") {
    return [
      rulesName(e.rules),
      e.format === "arena" ? tf("Arena · {time}", { time: fmtMinutes(Math.round((e.ends_at - e.starts_at) / 60) || 0) }) : tf("Knockout · {n} seats", { n: e.size }),
      e.rated ? t("rated") : t("casual"),
      e.entry_fee ? tf("entry {n} coins", { n: fmtNum(e.entry_fee) }) : t("free entry"),
      e.prize ? tf("the house adds {n} coins", { n: fmtNum(e.prize) }) : null,
    ].filter(Boolean).join(" · ");
  }
  return tf("{what} ×{n}", { what: t(eventKind(e.kind)[0]), n: e.multiplier });
}

const pad2 = (n: number) => String(n).padStart(2, "0");
/** A time for a datetime-local field (the viewer's time zone). */
export const toLocalInput = (secs: number) => {
  const d = new Date(secs * 1000);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
export const fromLocalInput = (v: string) => (v ? Math.floor(new Date(v).getTime() / 1000) : NaN);
/** The viewer's time zone, as "UTC−03:00". */
export function zoneLabel() {
  const off = -new Date().getTimezoneOffset();
  return "UTC" + (off >= 0 ? "+" : "−") + pad2(Math.floor(Math.abs(off) / 60)) + ":" + pad2(Math.abs(off) % 60);
}
/** The next `weekday` (0 Sunday … 6 Saturday) at `hour`:`minute`, local,
 * strictly after `from`. */
export function nextAt(weekday: number, hour: number, minute: number, from = new Date()) {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  let add = (weekday - d.getDay() + 7) % 7;
  if (add === 0 && d <= from) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}
