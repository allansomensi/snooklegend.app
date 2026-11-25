// The game's rating (crates/core/src/rating.rs), for the rating calculator.
// Keep it in step with the game: the tests (rating.test.ts) hold numbers
// worked out by the Rust code itself.
//
// Elo, as in chess: the expected score of A against B is
// E = 1 / (1 + 10^((Rb − Ra) / 400)), and after a game Ra' = Ra + K·(S − E),
// S being 1 for a win and 0 for a loss. Like FIDE, K is larger for new
// players (their rating settles quickly) and smaller at the top.

export const ELO = {
  initialRating: 1200,
  /** Players with fewer rated games than this use `kProvisional`. */
  provisionalGames: 10,
  kProvisional: 24,
  kStandard: 14,
  /** Players at or above `eliteThreshold` use `kElite`. */
  kElite: 8,
  eliteThreshold: 1900,
  /** Ratings never drop below this floor (by losing). */
  floor: 100,
} as const;

/** A player's rating and their rated games under one set of rules. */
export type Rating = { rating: number; games: number };

export type RatingChange = { winner: Rating; loser: Rating; winnerDelta: number; loserDelta: number };

const I32_MIN = -2147483648;
const I32_MAX = 2147483647;
const U32_MAX = 4294967295;

const clampI32 = (v: number) => Math.min(I32_MAX, Math.max(I32_MIN, v));

/** Rust's `f64::round`: halves away from zero (JavaScript's go up). */
function round(v: number): number {
  return Math.sign(v) * Math.round(Math.abs(v));
}

export function isProvisional(r: Rating): boolean {
  return r.games < ELO.provisionalGames;
}

/** How fast a rating moves: faster for new players, slower at the top. */
export function kFactor(r: Rating): number {
  if (r.games < ELO.provisionalGames) return ELO.kProvisional;
  if (r.rating >= ELO.eliteThreshold) return ELO.kElite;
  return ELO.kStandard;
}

/** The probability that a player rated `a` beats a player rated `b`. */
export function expectedScore(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

/** Both ratings after `winner` beat `loser` (`apply_result` in the game). */
export function applyResult(winner: Rating, loser: Rating): RatingChange {
  const expectedW = expectedScore(winner.rating, loser.rating);
  const expectedL = 1 - expectedW;
  const gain = round(kFactor(winner) * (1 - expectedW));
  const loss = round(kFactor(loser) * expectedL);
  const newW = { rating: clampI32(winner.rating + gain), games: Math.min(U32_MAX, winner.games + 1) };
  // The floor stops a fall; it never lifts a loser who is already below it.
  const floor = Math.min(ELO.floor, loser.rating);
  const newL = { rating: Math.max(clampI32(loser.rating - loss), floor), games: Math.min(U32_MAX, loser.games + 1) };
  return {
    winner: newW,
    loser: newL,
    winnerDelta: newW.rating - winner.rating,
    loserDelta: newL.rating - loser.rating,
  };
}

/** What `me` wins by beating, and loses by losing to, a player rated `opponent`. */
export function stakes(me: Rating, opponent: number): { win: number; loss: number; chance: number } {
  // The opponent's games change only their own K, not this player's points.
  const other = { rating: opponent, games: ELO.provisionalGames };
  return {
    win: applyResult(me, other).winnerDelta,
    loss: applyResult(other, me).loserDelta,
    chance: expectedScore(me.rating, opponent),
  };
}

/** The opponents' ratings the calculator shows, around `rating`, every `step`. */
export function opponentsAround(rating: number, span = 600, step = 50): number[] {
  const base = Math.round(rating / step) * step;
  const out: number[] = [];
  for (let r = base - span; r <= base + span; r += step) if (r >= ELO.floor) out.push(r);
  return out;
}
