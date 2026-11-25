// The official tournaments (the weekly cup, the staff's, events), as the
// game server publishes them: `GET /api/tournaments?limit=50` (newest first)
// and `GET /api/tournaments/{id}`.

import { bool, getJson, isObj, list, num, numOrNull, str, strOrNull, type Obj } from "./api";
import { RULES, type Rules } from "./ranking";

export type TournamentFormat = "knockout" | "arena";
/** As the game has them; anything else the server may add is shown as it comes. */
export type TournamentState = "registering" | "running" | "finished" | (string & {});

export type TournamentSummary = {
  id: number;
  name: string;
  rules: Rules;
  format: TournamentFormat;
  /** Places (4, 8 or 16 in a knockout). */
  size: number;
  /** Players who entered. */
  players: number;
  state: TournamentState;
  startsAt: number | null;
  endsAt: number | null;
  champion: string | null;
  runnerUp: string | null;
  prizePool: number;
  entryFee: number;
  rated: boolean;
};

export type Entrant = { username: string; country: string; seed: number | null };

export type Match = {
  /** Null: a bye (or not known yet). */
  a: string | null;
  b: string | null;
  winner: string | null;
  matchId: number | null;
  score: string;
};

export type Standing = { username: string; points: number; games: number; streak: number };

export type Tournament = Omit<TournamentSummary, "players"> & {
  players: number;
  prizes: number[];
  itemPrize: string | null;
  entrants: Entrant[];
  /** Knockouts: the rounds, the first one first. */
  rounds: Match[][];
  /** Arenas: best first. */
  standings: Standing[];
};

function base(t: Obj): Omit<TournamentSummary, "players"> | null {
  if (typeof t.id !== "number" || typeof t.name !== "string") return null;
  return {
    id: t.id,
    name: t.name,
    rules: (RULES as readonly string[]).includes(str(t.rules)) ? (t.rules as Rules) : "brazilian",
    format: t.format === "arena" ? "arena" : "knockout",
    size: num(t.size),
    state: str(t.state, "finished"),
    startsAt: numOrNull(t.starts_at) || null,
    endsAt: numOrNull(t.ends_at) || null,
    champion: strOrNull(t.champion),
    runnerUp: strOrNull(t.runner_up),
    prizePool: num(t.prize_pool),
    entryFee: num(t.entry_fee),
    rated: bool(t.rated),
  };
}

export function parseTournaments(data: unknown): TournamentSummary[] | null {
  if (!Array.isArray(data)) return null;
  return data
    .filter(isObj)
    .map((t) => {
      const b = base(t);
      return b && { ...b, players: num(t.players) };
    })
    .filter((t) => t !== null);
}

function parseMatch(m: unknown): Match {
  const o = isObj(m) ? m : {};
  return {
    a: strOrNull(o.a),
    b: strOrNull(o.b),
    winner: strOrNull(o.winner),
    matchId: numOrNull(o.match_id),
    score: str(o.score),
  };
}

export function parseTournament(data: unknown): Tournament | null {
  if (!isObj(data)) return null;
  const b = base(data);
  if (!b) return null;
  const entrants = list(data.players)
    .filter(isObj)
    .filter((p) => typeof p.username === "string")
    .map((p) => ({ username: str(p.username), country: str(p.country).toUpperCase(), seed: numOrNull(p.seed) }));
  const rounds = list(data.rounds).map((r) => list(r).map(parseMatch));
  return {
    ...b,
    // The champion and runner-up, from the final when the server leaves them out.
    champion: b.champion ?? (b.state === "finished" ? finalOf(rounds)?.winner ?? null : null),
    runnerUp: b.runnerUp ?? runnerUpOf(rounds),
    players: entrants.length,
    prizes: list(data.prizes).map((p) => num(p)).filter((p) => p > 0),
    itemPrize: strOrNull(data.item_prize),
    entrants,
    rounds,
    standings: list(data.standings)
      .filter(isObj)
      .filter((s) => typeof s.username === "string")
      .map((s) => ({ username: str(s.username), points: num(s.points), games: num(s.games), streak: num(s.streak) }))
      .sort((x, y) => y.points - x.points),
  };
}

function finalOf(rounds: Match[][]): Match | undefined {
  const last = rounds[rounds.length - 1];
  return last?.length === 1 ? last[0] : undefined;
}

function runnerUpOf(rounds: Match[][]): string | null {
  const f = finalOf(rounds);
  if (!f?.winner) return null;
  return (f.a === f.winner ? f.b : f.a) ?? null;
}

export function fetchTournaments(limit = 50) {
  return getJson(`/api/tournaments?limit=${limit}`, parseTournaments);
}

export function fetchTournament(id: number) {
  return getJson(`/api/tournaments/${id}`, parseTournament);
}

/** How many rounds a knockout of `size` places has (4 → 2, 8 → 3, 16 → 4). */
export function roundCount(size: number): number {
  return size > 1 ? Math.ceil(Math.log2(size)) : 1;
}

/**
 * The whole bracket, played or not: every round with all its matches (the
 * ones not drawn yet are empty), so it is drawn at its full size from the
 * start.
 */
export function fullBracket(rounds: Match[][], size: number): Match[][] {
  const n = Math.max(roundCount(size || 2), rounds.length);
  const firstRound = Math.max(rounds[0]?.length ?? 0, Math.ceil((size || 2) / 2));
  const out: Match[][] = [];
  for (let r = 0, count = firstRound; r < n; r++, count = Math.max(1, Math.ceil(count / 2))) {
    const played = rounds[r] ?? [];
    out.push(
      Array.from(
        { length: Math.max(count, played.length) },
        (_, i) => played[i] ?? { a: null, b: null, winner: null, matchId: null, score: "" },
      ),
    );
  }
  return out;
}

/** A round's name: the final, the semi-finals, the quarter-finals, or "round of N". */
export function roundKind(index: number, total: number): { kind: "final" | "semi" | "quarter" | "round"; of: number } {
  const left = total - index;
  if (left === 1) return { kind: "final", of: 2 };
  if (left === 2) return { kind: "semi", of: 4 };
  if (left === 3) return { kind: "quarter", of: 8 };
  return { kind: "round", of: 2 ** left };
}

/** Each player's furthest round in a knockout (for the results table): 0-based, `rounds` for the champion. */
export function reached(rounds: Match[][]): Map<string, number> {
  const out = new Map<string, number>();
  rounds.forEach((round, r) =>
    round.forEach((m) => {
      for (const p of [m.a, m.b]) if (p) out.set(p, Math.max(out.get(p) ?? 0, r));
      if (m.winner && r === rounds.length - 1 && round.length === 1) out.set(m.winner, rounds.length);
    }),
  );
  return out;
}

/** Arena points: a win is 2, 4 on a winning streak (from the third win in a row). */
export const ARENA_POINTS = { win: 2, streak: 4, streakFrom: 3 } as const;
