import { describe, expect, it } from "vitest";
import { applyResult, expectedScore, kFactor, opponentsAround, stakes } from "./rating";

// [winner rating, winner games, loser rating, loser games, winner delta, loser delta],
// printed by the game's own `apply_result` (crates/core/src/rating.rs).
const FROM_RUST: [number, number, number, number, number, number][] = [
  [1500, 100, 1500, 100, 7, -7],
  [1800, 100, 1400, 100, 1, -1],
  [1400, 100, 1800, 100, 13, -13],
  [1200, 0, 1200, 100, 12, -7],
  [1200, 9, 1600, 50, 22, -13],
  [1200, 10, 1600, 50, 13, -13],
  [1900, 30, 1700, 30, 2, -3],
  [1899, 30, 2300, 30, 13, -7],
  [2100, 500, 2600, 10, 8, -8],
  [110, 100, 105, 50, 7, -5],
  [400, 100, 60, 100, 2, 0],
  [1350, 3, 1000, 200, 3, -2],
  [1650, 120, 1702, 5, 8, -14],
  [1234, 7, 1987, 40, 24, -8],
  [2000, 15, 1250, 2, 0, 0],
  [1000, 40, 3000, 40, 14, -8],
  [3000, 40, 1000, 40, 0, 0],
  [1500, 10, 1513, 10, 7, -7],
];

describe("rating", () => {
  it("gives the game's numbers", () => {
    for (const [wr, wg, lr, lg, wd, ld] of FROM_RUST) {
      const r = applyResult({ rating: wr, games: wg }, { rating: lr, games: lg });
      expect([wr, wg, lr, lg, r.winnerDelta, r.loserDelta]).toEqual([wr, wg, lr, lg, wd, ld]);
      expect(r.winner.games).toBe(wg + 1);
      expect(r.loser.games).toBe(lg + 1);
    }
  });

  it("expects as the game does", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5, 12);
    expect(expectedScore(1800, 1400)).toBeCloseTo(0.909090909090909, 12);
    expect(expectedScore(1200, 1650)).toBeCloseTo(0.069758287358906, 12);
    expect(expectedScore(2100, 1300)).toBeCloseTo(0.99009900990099, 12);
  });

  it("moves new players faster and the top slower", () => {
    expect(kFactor({ rating: 2500, games: 9 })).toBe(24);
    expect(kFactor({ rating: 1899, games: 10 })).toBe(14);
    expect(kFactor({ rating: 1900, games: 10 })).toBe(8);
  });

  it("holds the floor, and never lifts a loser below it", () => {
    expect(applyResult({ rating: 110, games: 100 }, { rating: 105, games: 50 }).loser.rating).toBe(100);
    expect(applyResult({ rating: 400, games: 100 }, { rating: 60, games: 100 }).loser.rating).toBe(60);
  });

  it("does not overflow at the ends of an i32", () => {
    const r = applyResult({ rating: 2147483647, games: 100 }, { rating: -2147483648, games: 100 });
    expect([r.winnerDelta, r.loserDelta]).toEqual([0, 0]);
  });

  it("works out the stakes against each opponent", () => {
    expect(stakes({ rating: 1500, games: 100 }, 1500)).toMatchObject({ win: 7, loss: -7 });
    expect(stakes({ rating: 1400, games: 100 }, 1800)).toMatchObject({ win: 13, loss: -1 });
    expect(stakes({ rating: 1200, games: 0 }, 1200)).toMatchObject({ win: 12, loss: -12 });
    expect(opponentsAround(1234, 100, 50)).toEqual([1150, 1200, 1250, 1300, 1350]);
    expect(opponentsAround(150, 100, 50)[0]).toBe(100);
  });
});
