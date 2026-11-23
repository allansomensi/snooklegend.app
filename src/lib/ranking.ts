// The world ranking, as the game server publishes it (`GET /api/leaderboard`,
// public, the top 100 under each set of rules), and the leagues the game
// draws ratings in (crates/proto/src/lib.rs `Tier`, crates/client/src/ui.rs
// `tier_color`): keep both in step with the game.

import { apiBase } from "@/admin/lib/config";
import { LOCALE_INFO, type Locale } from "@/i18n";

export const RULES = ["brazilian", "official"] as const;
export type Rules = (typeof RULES)[number];

/** One line of the ranking (`LeaderboardEntry` in the game's protocol). */
export type RankingEntry = {
  rank: number;
  username: string;
  rating: number;
  games: number;
  wins: number;
  country?: string;
  vip?: boolean;
  admin?: boolean;
};

export type TierKey = "rookie" | "amateur" | "skilled" | "expert" | "master" | "grandmaster" | "legend";

/** The leagues, lowest first: where each starts and its colour in the game. */
export const TIERS: readonly { key: TierKey; min: number; color: string }[] = [
  { key: "rookie", min: -Infinity, color: "#b8b8bd" },
  { key: "amateur", min: 1250, color: "#ede3cc" },
  { key: "skilled", min: 1300, color: "#73db85" },
  { key: "expert", min: 1500, color: "#6bb8ff" },
  { key: "master", min: 1700, color: "#c78fff" },
  { key: "grandmaster", min: 1900, color: "#ffa138" },
  { key: "legend", min: 2100, color: "#ffd44d" },
];

export function tierOf(rating: number) {
  let tier = TIERS[0];
  for (const t of TIERS) if (rating >= t.min) tier = t;
  return tier;
}

/** Administrators' names are red in the game (and no one else's is). */
export const ADMIN_RED = "#ff5245";

/** The ranking's page in each language: `/ranking/`, `/pt/ranking/`, `/es/ranking/`. */
export function rankingPath(locale: Locale): string {
  return `${LOCALE_INFO[locale].path}ranking/`;
}

/** The ranking under `rules`, on the game server (the staff portal's API host). */
export function leaderboardUrl(rules: Rules): string {
  return `${apiBase()}/api/leaderboard?rules=${rules}`;
}

/** Wins over games, rounded down (as the game shows it); 0 without games. */
export function winRate(e: Pick<RankingEntry, "wins" | "games">): number {
  return e.games > 0 ? Math.floor((e.wins * 100) / e.games) : 0;
}

/** Reads the server's answer, keeping only well-formed lines. */
export function parseRanking(data: unknown): RankingEntry[] {
  if (!Array.isArray(data)) return [];
  return data.filter(
    (e): e is RankingEntry =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as RankingEntry).username === "string" &&
      typeof (e as RankingEntry).rating === "number" &&
      typeof (e as RankingEntry).rank === "number",
  );
}
