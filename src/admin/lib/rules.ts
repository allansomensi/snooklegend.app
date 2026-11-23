// The two rules every game is played under, Brazilian first (as the server
// lists them). Each has its own rating, tiers and ranking.
import type { PerRules, Records, RulesId } from "./types";

export const RULES: RulesId[] = ["brazilian", "official"];

export interface Standing {
  rating: number;
  peak_rating: number;
  tier: string;
  games: number;
  wins: number;
}

/** A player's record under the rules: an account's `records`, or a player
 * online's `standings`. */
export function recordOf(p: { records?: Records; standings?: Records }, r: RulesId): Standing {
  const x = p.records?.[r] || p.standings?.[r] || {};
  return {
    rating: x.rating ?? 1200,
    peak_rating: x.peak_rating ?? x.rating ?? 1200,
    tier: x.tier || "",
    games: x.games || 0,
    wins: x.wins || 0,
  };
}

/** The games of a list under each of the rules. */
export const gamesByRules = (rooms: { rules: RulesId }[]): PerRules => ({
  brazilian: rooms.filter((r) => r.rules !== "official").length,
  official: rooms.filter((r) => r.rules === "official").length,
});
