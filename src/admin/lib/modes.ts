// 0.12's modes as plain functions: the staff API's answers about doubles
// games and against the clock read into their types (whatever the server
// left out gets a safe value), the weeks of the clock's ranking, and a
// doubles game seen from one of its players.
import type {
  ClockAttempt, ClockAttempts, ClockRemoved, ClockRow, ClockWeek, DoublesDetail, DoublesGame, DoublesPage, DoublesRatings, DoublesRecord, LiveDoubles,
  Pair, RulesId,
} from "./types";

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);

/** A number, or `fallback` for anything else. */
const num = (x: unknown, fallback = 0): number => {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && x.trim() !== "" && Number.isFinite(Number(x))) return Number(x);
  return fallback;
};
/** A number, or null (absent, null or not a number). */
const numOrNull = (x: unknown): number | null => (x === null || x === undefined || typeof x === "boolean" ? null : Number.isFinite(num(x, NaN)) ? num(x) : null);
const text = (x: unknown): string => (typeof x === "string" ? x : x === null || x === undefined ? "" : String(x));
const textOrNull = (x: unknown): string | null => (typeof x === "string" ? x : null);
const list = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const pair = <T>(x: unknown, each: (v: unknown) => T): Pair<T> => {
  const a = list(x);
  return [each(a[0]), each(a[1])];
};
const rulesOf = (x: unknown): RulesId => (x === "official" ? "official" : "brazilian");

// ---------------------------------------------------------------- doubles

const teams = (x: unknown) => pair(x, (t) => pair(t, text));

export function parseLiveDoubles(x: unknown): LiveDoubles | null {
  if (!isObj(x) || numOrNull(x.id) === null) return null;
  return {
    id: num(x.id),
    teams: teams(x.teams),
    rated: x.rated === true,
    rules: rulesOf(x.rules),
    shots: num(x.shots),
    finished: x.finished === true,
  };
}

export function parseDoublesGame(x: unknown): DoublesGame | null {
  if (!isObj(x) || numOrNull(x.id) === null) return null;
  return {
    id: num(x.id),
    room: numOrNull(x.room),
    teams: teams(x.teams),
    countries: pair(x.countries, (t) => pair(t, text)),
    player_ids: pair(x.player_ids, (t) => pair(t, (v) => num(v))),
    winner: num(x.winner) === 1 ? 1 : 0,
    reason: text(x.reason),
    rated: x.rated === true,
    rules: rulesOf(x.rules),
    deltas: pair(x.deltas, (t) => pair(t, (v) => num(v))),
    shots: num(x.shots),
    ended_at: num(x.ended_at),
    replay: x.replay === true,
    voided_at: numOrNull(x.voided_at),
  };
}

/** `GET /doubles/{id}`'s game (null when the answer has none). */
export function parseDoublesDetail(x: unknown): DoublesDetail | null {
  const raw = isObj(x) && "game" in x ? x.game : x;
  const g = parseDoublesGame(raw);
  if (!g || !isObj(raw)) return null;
  return { ...g, strokes: numOrNull(raw.strokes), replay_data: isObj(raw.replay_data) ? raw.replay_data : null };
}

/** `GET /doubles`: the games being played and a page of the stored ones. */
export function parseDoublesPage(x: unknown): DoublesPage {
  const o = isObj(x) ? x : {};
  return {
    live: list(o.live).map(parseLiveDoubles).filter((g): g is LiveDoubles => !!g),
    games: list(o.games).map(parseDoublesGame).filter((g): g is DoublesGame => !!g),
    next: numOrNull(o.next),
  };
}

const DEFAULT_RATING = 1200;

/** A player's `doubles_ratings` (a player who never played doubles has
 * 1200 and no games under each of the rules). */
export function parseDoublesRatings(x: unknown): DoublesRatings {
  const one = (r: unknown): DoublesRecord => {
    const o = isObj(r) ? r : {};
    const rating = num(o.rating, DEFAULT_RATING);
    return { rating, peak_rating: num(o.peak_rating, rating), games: num(o.games), wins: num(o.wins) };
  };
  const o = isObj(x) ? x : {};
  return { brazilian: one(o.brazilian), official: one(o.official) };
}

/** A team in words, as the game names it: "ana & bia". */
export const teamName = (team: Pair<string>) => team.join(" & ");

/** The four players in the order the server tells them (the first team's
 * first, then its second, then the other team's). */
export const fourPlayers = (g: Pick<DoublesGame, "teams">): string[] => [...g.teams[0], ...g.teams[1]];

export interface DoublesSide {
  team: 0 | 1;
  place: 0 | 1;
  partner: string;
  opponents: Pair<string>;
  won: boolean;
  delta: number;
}

/** A doubles game seen from one of its players (whatever the case of the
 * name), or null when they didn't play it. */
export function sideOf(g: Pick<DoublesGame, "teams" | "winner" | "deltas">, name: string): DoublesSide | null {
  const n = name.trim().toLowerCase();
  for (const team of [0, 1] as const) {
    for (const place of [0, 1] as const) {
      if (g.teams[team][place].toLowerCase() !== n) continue;
      return {
        team,
        place,
        partner: g.teams[team][1 - place],
        opponents: g.teams[1 - team],
        won: g.winner === team,
        delta: g.deltas[team][place],
      };
    }
  }
  return null;
}

/** What the game being annulled gives back: each player's change (the
 * points they won are taken, those they lost given back). */
export const givenBack = (g: Pick<DoublesGame, "teams" | "deltas">): { name: string; back: number }[] =>
  ([0, 1] as const).flatMap((team) => ([0, 1] as const).map((place) => ({ name: g.teams[team][place], back: -g.deltas[team][place] })));

// ---------------------------------------------------------- against the clock

const DAY = 86400;

/** The week of a time (Unix seconds): weeks start on Monday 00:00 UTC, as
 * the game counts them (`time_attack::week_of`). */
export const weekOf = (t: number) => Math.floor((Math.floor(t / DAY) + 3) / 7);

/** When a week starts (Monday 00:00 UTC, Unix seconds). */
export const weekStart = (week: number) => (week * 7 - 3) * DAY;

/** The week of a `YYYY-MM-DD` date field (that day in UTC), or null. */
export function weekOfDate(v: string): number | null {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 1000;
  return Number.isFinite(t) ? weekOf(t) : null;
}

/** A week's Monday as a `YYYY-MM-DD` date field. */
export const weekDate = (week: number) => new Date(weekStart(week) * 1000).toISOString().slice(0, 10);

/** A time against the clock as the game shows it: "1:01.0". */
export function clockTime(ms: number): string {
  const tenths = Math.floor(Math.max(0, ms) / 100);
  return `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, "0")}.${tenths % 10}`;
}

/** The week asked for in the address (`?week=2946`), or null for this one. */
export function weekParam(v: string): number | null {
  if (!/^\d{1,6}$/.test(v.trim())) return null;
  return Number(v.trim());
}

const parseRow = (x: unknown): ClockRow | null => {
  if (!isObj(x) || !x.username) return null;
  const ms = num(x.ms);
  return {
    place: num(x.place),
    user_id: num(x.user_id),
    username: text(x.username),
    country: text(x.country),
    ms,
    time: textOrNull(x.time) || clockTime(ms),
    at: num(x.at),
  };
};

/** `GET /time-attack`: a week's table. */
export function parseClockWeek(x: unknown): ClockWeek {
  const o = isObj(x) ? x : {};
  const thisWeek = num(o.this_week, weekOf(Date.now() / 1000));
  const week = num(o.week, thisWeek);
  const board = list(o.board).map(parseRow).filter((r): r is ClockRow => !!r);
  return {
    week,
    this_week: thisWeek,
    starts_at: num(o.starts_at, weekStart(week)),
    ends_at: num(o.ends_at, weekStart(week + 1)),
    players: num(o.players, board.length),
    prizes: list(o.prizes).map((p) => num(p)),
    board,
  };
}

export function parseClockAttempt(x: unknown): ClockAttempt | null {
  if (!isObj(x) || numOrNull(x.id) === null) return null;
  const ms = numOrNull(x.ms);
  const week = numOrNull(x.week);
  const removed = numOrNull(x.removed_at);
  return {
    id: num(x.id),
    username: text(x.username),
    day: num(x.day),
    started_ms: num(x.started_ms),
    finished_ms: numOrNull(x.finished_ms),
    ms,
    time: textOrNull(x.time) || (ms === null ? null : clockTime(ms)),
    shots: numOrNull(x.shots),
    fouls: numOrNull(x.fouls),
    week,
    at: numOrNull(x.at),
    counted: typeof x.counted === "boolean" ? x.counted : week !== null && removed === null,
    removed_at: removed,
    removed_reason: textOrNull(x.removed_reason),
  };
}

/** `GET /users/{name}/time-attack`: a player's attempts, newest first. */
export function parseClockAttempts(x: unknown): ClockAttempts {
  const o = isObj(x) ? x : {};
  const w = isObj(o.this_week) ? o.this_week : {};
  return {
    username: text(o.username),
    this_week: { week: num(w.week, weekOf(Date.now() / 1000)), best_ms: numOrNull(w.best_ms), place: numOrNull(w.place) },
    attempts: list(o.attempts).map(parseClockAttempt).filter((a): a is ClockAttempt => !!a),
  };
}

/** The answer to `POST /time-attack/attempts/{id}/remove`, or null. */
export function parseClockRemoved(x: unknown): ClockRemoved | null {
  if (!isObj(x)) return null;
  const attempt = parseClockAttempt(x.attempt);
  return attempt ? { attempt, best_ms: numOrNull(x.best_ms) } : null;
}

/** Where an attempt stands: in its week's ranking, taken off by the staff,
 * cleared but not in a ranking, not cleared (or refused), never sent. */
export type AttemptStatus = "counted" | "removed" | "uncounted" | "failed" | "unsent";

export function attemptStatus(a: Pick<ClockAttempt, "counted" | "removed_at" | "finished_ms" | "ms">): AttemptStatus {
  if (a.removed_at !== null) return "removed";
  if (a.counted) return "counted";
  if (a.finished_ms === null) return "unsent";
  if (a.ms === null) return "failed";
  return "uncounted";
}

/** A player's attempts in numbers: how many, cleared, in a ranking, taken
 * off, and the quickest counted. */
export function attemptStats(list: ClockAttempt[]) {
  const counted = list.filter((a) => a.counted);
  const times = counted.map((a) => a.ms).filter((m): m is number => m !== null);
  return {
    attempts: list.length,
    cleared: list.filter((a) => a.ms !== null).length,
    counted: counted.length,
    removed: list.filter((a) => a.removed_at !== null).length,
    best: times.length ? Math.min(...times) : null,
  };
}
