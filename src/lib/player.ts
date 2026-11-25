// A player's public profile, as the game server publishes it
// (`GET /api/players/{name}`: case-insensitive; 404 for an unknown, banned or
// deleted account, and for a former name).

import type { Locale } from "@/i18n";
import { bool, getJson, isObj, list, num, numOrNull, str, strOrNull, type Obj } from "./api";
import { ACHIEVEMENTS, AVATARS, CUES, FRAMES, RETIRED_AVATARS } from "./game-data";
import { RULES, tierOf, TIERS, type Rules, type TierKey } from "./ranking";

export const MEDALS = ["bronze", "silver", "gold", "diamond", "ruby"] as const;
export type Medal = (typeof MEDALS)[number];

export const RARITIES = ["common", "rare", "epic", "legendary"] as const;
export type Rarity = (typeof RARITIES)[number];

/** The rarities' colours, as the game draws them (crates/proto/src/shop.rs `Rarity::color`). */
export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#a8b0ba",
  rare: "#4094ff",
  epic: "#b05cff",
  legendary: "#ffb020",
};

/** The medals' colours (the game's achievements screen). */
export const MEDAL_COLOR: Record<Medal, { from: string; to: string; ink: string }> = {
  bronze: { from: "#f0b27a", to: "#9a5a2c", ink: "#3a1d08" },
  silver: { from: "#f3f5f8", to: "#8f98a6", ink: "#1f2430" },
  gold: { from: "#fbe39a", to: "#c08a24", ink: "#3a2604" },
  diamond: { from: "#e6fbff", to: "#5fb8e8", ink: "#06304a" },
  ruby: { from: "#ff9aa8", to: "#b3122e", ink: "#fff3f5" },
};

export type PlayerRating = {
  rules: Rules;
  rating: number;
  peak: number;
  tier: TierKey;
  games: number;
  wins: number;
  /** Place in the world ranking (null: not in it). */
  rank: number | null;
};

export type PlayerAchievement = {
  code: string;
  /** English, from the server (the site has its own names for the codes it knows). */
  name: string;
  description: string;
  unlockedAt: number;
  medal: Medal | null;
  secret: boolean;
};

export type Trophy = {
  kind: string;
  name: string;
  players: number | null;
  at: number;
  tournamentId: number | null;
};

export type RecentGame = {
  id: number;
  at: number;
  rules: Rules;
  rated: boolean;
  opponent: string;
  opponentCountry: string;
  won: boolean;
  delta: number | null;
  reason: string;
};

export type Player = {
  username: string;
  country: string;
  avatar: string;
  vip: boolean;
  supporter: boolean;
  role: "player" | "moderator" | "admin";
  createdAt: number;
  lastSeenDays: number | null;
  level: number;
  frame: string;
  cue: string;
  cueRarity: Rarity | null;
  ratings: PlayerRating[];
  achievements: PlayerAchievement[];
  trophies: Trophy[];
  recent: RecentGame[];
  career: { games: number; wins: number; breakAndRuns: number; bestStreak: number } | null;
};

const isRules = (v: unknown): v is Rules => typeof v === "string" && (RULES as readonly string[]).includes(v);
const oneOf = <T extends string>(v: unknown, of: readonly T[]): T | null =>
  typeof v === "string" && (of as readonly string[]).includes(v) ? (v as T) : null;

function parseRating(r: Obj): PlayerRating | null {
  if (!isRules(r.rules)) return null;
  const rating = num(r.rating, 1200);
  return {
    rules: r.rules,
    rating,
    peak: Math.max(num(r.peak, rating), rating),
    // The server's league, or the one the rating is in.
    tier: oneOf(r.tier, TIERS.map((t) => t.key)) ?? tierOf(rating).key,
    games: num(r.games),
    wins: num(r.wins),
    rank: numOrNull(r.rank),
  };
}

/** Reads the server's answer; `null` if it isn't a player. */
export function parsePlayer(data: unknown): Player | null {
  if (!isObj(data) || typeof data.username !== "string" || data.username === "") return null;
  const ratings = list(data.ratings).filter(isObj).map(parseRating).filter((r) => r !== null);
  // Both sets of rules, always in the same order (a missing one: no games yet).
  const byRules = RULES.map(
    (rules) =>
      ratings.find((r) => r.rules === rules) ?? { rules, rating: 1200, peak: 1200, tier: "rookie" as TierKey, games: 0, wins: 0, rank: null },
  );
  const career = isObj(data.career)
    ? {
        games: num(data.career.games),
        wins: num(data.career.wins),
        breakAndRuns: num(data.career.break_and_runs),
        bestStreak: num(data.career.best_streak),
      }
    : null;
  return {
    username: data.username,
    country: str(data.country).toUpperCase(),
    avatar: str(data.avatar),
    vip: bool(data.vip),
    supporter: bool(data.supporter),
    role: oneOf(data.role, ["player", "moderator", "admin"] as const) ?? "player",
    createdAt: num(data.created_at),
    lastSeenDays: numOrNull(data.last_seen_days),
    level: Math.max(1, num(data.level, 1)),
    frame: str(data.frame),
    cue: str(data.cue),
    cueRarity: oneOf(data.cue_rarity, RARITIES),
    ratings: byRules,
    achievements: list(data.achievements)
      .filter(isObj)
      .filter((a) => typeof a.code === "string")
      .map((a) => ({
        code: str(a.code),
        name: str(a.name, str(a.code)),
        description: str(a.description),
        unlockedAt: num(a.unlocked_at),
        medal: oneOf(a.medal, MEDALS),
        secret: bool(a.secret),
      }))
      // The rarest first, then the newest.
      .sort((a, b) => medalRank(b.medal) - medalRank(a.medal) || b.unlockedAt - a.unlockedAt),
    trophies: list(data.trophies)
      .filter(isObj)
      .map((t) => ({
        kind: str(t.kind, "tournament"),
        name: str(t.name),
        players: numOrNull(t.players),
        at: num(t.at),
        tournamentId: numOrNull(t.tournament_id),
      }))
      .sort((a, b) => b.at - a.at),
    recent: list(data.recent)
      .filter(isObj)
      .filter((g) => isRules(g.rules) && typeof g.opponent === "string")
      .map((g) => ({
        id: num(g.id),
        at: num(g.at),
        rules: g.rules as Rules,
        rated: bool(g.rated),
        opponent: str(g.opponent),
        opponentCountry: str(g.opponent_country),
        won: bool(g.won),
        delta: numOrNull(g.delta),
        reason: str(g.reason),
      })),
    career,
  };
}

function medalRank(m: Medal | null): number {
  return m ? MEDALS.indexOf(m) + 1 : 0;
}

/** The player from the game server. */
export function fetchPlayer(name: string) {
  return getJson(`/api/players/${encodeURIComponent(name)}`, parsePlayer);
}

/** A name that could be a player's (anything else is a 404 without asking the server). */
export function plausibleName(name: string): boolean {
  return name.length >= 1 && name.length <= 32 && !/[\s/\\?#<>"']/.test(name);
}

/** The picture shown for `code` (a retired face is shown as today's picture), or null: a silhouette. */
export function avatarSrc(code: string): string | null {
  const shown = RETIRED_AVATARS[code] ?? code;
  return AVATARS.includes(shown) ? `/avatars/${shown}.webp` : null;
}

/** A shop item's name in `locale` (its code, tidied, for one the site doesn't know yet). */
export function cueName(code: string, locale: Locale): string {
  return CUES[code]?.name[locale] ?? tidyCode(code, "cue_");
}

export function frameOf(code: string) {
  return FRAMES[code] && code !== "frame_none" ? FRAMES[code] : null;
}

/** An achievement's name and description in `locale` (the server's English for one the site doesn't know). */
export function achievementText(a: Pick<PlayerAchievement, "code" | "name" | "description">, locale: Locale) {
  const known = ACHIEVEMENTS[a.code];
  return {
    name: known?.name[locale] ?? a.name,
    description: known?.description[locale] ?? a.description,
  };
}

function tidyCode(code: string, prefix: string): string {
  const s = code.startsWith(prefix) ? code.slice(prefix.length) : code;
  return s.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Wins over games, rounded down (as the game shows it). */
export function winRateOf(wins: number, games: number): number {
  return games > 0 ? Math.floor((wins * 100) / games) : 0;
}

/** The rules a player plays most (their profile opens on them). */
export function mainRating(p: Player): PlayerRating {
  return [...p.ratings].sort((a, b) => b.games - a.games)[0];
}
