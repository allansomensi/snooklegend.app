import { describe, expect, it } from "vitest";
import ana from "./fixtures/player-ana.json";
import bob from "./fixtures/player-bob.json";
import supporters from "./fixtures/supporters.json";
import t42 from "./fixtures/tournament-42.json";
import t43 from "./fixtures/tournament-43.json";
import t44 from "./fixtures/tournament-44.json";
import tournaments from "./fixtures/tournaments.json";
import { achievementText, avatarSrc, cueName, frameOf, mainRating, parsePlayer, plausibleName, winRateOf } from "./player";
import { playerPath, tournamentPath, pagePath, languagesOf } from "./routes";
import { parseSupporters } from "./supporters";
import { fullBracket, parseTournament, parseTournaments, reached, roundCount, roundKind } from "./tournaments";

// The examples of the public API's contract, as written.
const CONTRACT_PLAYER = {
  username: "ana", country: "BR", avatar: "a12", vip: true, supporter: true,
  role: "player", created_at: 1700000000, last_seen_days: 2, level: 23,
  frame: "frame_gold", cue: "cue_dragon", cue_rarity: "legendary",
  ratings: [
    { rules: "brazilian", rating: 1650, peak: 1702, tier: "gold", games: 120, wins: 70, rank: 12 },
    { rules: "official", rating: 1500, peak: 1500, tier: "silver", games: 0, wins: 0, rank: null },
  ],
  achievements: [{ code: "golden_break", name: "Golden break", description: "…", unlocked_at: 1700000000, medal: "ruby", secret: false }],
  trophies: [{ kind: "tournament", name: "Saturday Cup", players: 16, at: 1700000000, tournament_id: 42 }],
  recent: [{ id: 9001, at: 1700000000, rules: "official", rated: true, opponent: "bob", opponent_country: "PT", won: true, delta: 12, reason: "eight_ball" }],
  career: { games: 140, wins: 80, break_and_runs: 3, best_streak: 7 },
};

describe("players", () => {
  it("reads the contract's example", () => {
    const p = parsePlayer(CONTRACT_PLAYER)!;
    expect(p.username).toBe("ana");
    expect(p.vip && p.supporter).toBe(true);
    expect(p.ratings.map((r) => r.rules)).toEqual(["brazilian", "official"]);
    // "gold" and "silver" aren't leagues of the game: the rating's league stands in.
    expect(p.ratings[0]).toMatchObject({ rating: 1650, peak: 1702, tier: "expert", rank: 12 });
    expect(p.ratings[1]).toMatchObject({ tier: "expert", rank: null, games: 0 });
    expect(p.achievements[0]).toMatchObject({ code: "golden_break", medal: "ruby", unlockedAt: 1700000000 });
    expect(p.trophies[0]).toEqual({ kind: "tournament", name: "Saturday Cup", players: 16, at: 1700000000, tournamentId: 42 });
    expect(p.recent[0]).toMatchObject({ opponent: "bob", opponentCountry: "PT", won: true, delta: 12, rated: true });
    expect(p.career).toEqual({ games: 140, wins: 80, breakAndRuns: 3, bestStreak: 7 });
    expect(p.cueRarity).toBe("legendary");
  });

  it("reads the fixtures, the rarest medals first", () => {
    const p = parsePlayer(ana)!;
    expect(p.achievements[0].medal).toBe("ruby");
    expect(p.achievements.at(-1)!.medal).toBe(null);
    expect(mainRating(p).rules).toBe("brazilian");
    const b = parsePlayer(bob)!;
    // A player with games under one set of rules only still has both.
    expect(b.ratings.map((r) => [r.rules, r.games])).toEqual([["brazilian", 0], ["official", 9]]);
    expect(b.role).toBe("moderator");
    expect(mainRating(b).rules).toBe("official");
  });

  it("refuses what isn't a player, and survives missing fields", () => {
    expect(parsePlayer(null)).toBe(null);
    expect(parsePlayer({ error: "not found" })).toBe(null);
    expect(parsePlayer([])).toBe(null);
    const p = parsePlayer({ username: "zé" })!;
    expect(p).toMatchObject({ level: 1, vip: false, country: "", achievements: [], recent: [], career: null, cueRarity: null });
    expect(p.ratings).toHaveLength(2);
  });

  it("names pictures, cues and achievements", () => {
    expect(avatarSrc("pic_crown")).toBe("/avatars/pic_crown.webp");
    expect(avatarSrc("ana")).toBe("/avatars/pic_thirteen.webp");
    expect(avatarSrc("a12")).toBe(null);
    expect(avatarSrc("")).toBe(null);
    expect(cueName("cue_dragon", "en")).toBe("Dragon scale");
    expect(cueName("cue_dragon", "pt")).toBe("Escama de dragão");
    expect(cueName("cue_winter_2026", "en")).toBe("Winter 2026");
    expect(frameOf("frame_gold")?.shine).toBe(true);
    expect(frameOf("frame_none")).toBe(null);
    expect(achievementText({ code: "golden_break", name: "x", description: "y" }, "es").name).toBe("Saque de oro");
    expect(achievementText({ code: "new_one", name: "New", description: "Desc" }, "pt")).toEqual({ name: "New", description: "Desc" });
    expect(winRateOf(70, 120)).toBe(58);
    expect(winRateOf(0, 0)).toBe(0);
  });

  it("has an address in each language", () => {
    expect(playerPath("en", "ana")).toBe("/player/ana/");
    expect(playerPath("pt", "ana")).toBe("/jogador/ana/");
    expect(playerPath("es", "Ana_1")).toBe("/es/jugador/Ana_1/");
    expect(playerPath("en", "a b")).toBe("/player/a%20b/");
    expect(plausibleName("ana")).toBe(true);
    expect(plausibleName("a/b")).toBe(false);
    expect(plausibleName("x".repeat(40))).toBe(false);
    expect(languagesOf((l) => playerPath(l, "ana"))).toEqual({
      "x-default": "/player/ana/",
      en: "/player/ana/",
      "pt-BR": "/jogador/ana/",
      es: "/es/jugador/ana/",
    });
  });
});

describe("tournaments", () => {
  it("reads the contract's examples", () => {
    const list = parseTournaments([
      { id: 42, name: "Saturday Cup", rules: "official", format: "knockout", size: 16, players: 14, state: "finished",
        starts_at: 1700000000, ends_at: 1700003600, champion: "ana", runner_up: "bob", prize_pool: 3400, entry_fee: 100, rated: true },
    ])!;
    expect(list[0]).toMatchObject({ id: 42, players: 14, champion: "ana", runnerUp: "bob", prizePool: 3400, entryFee: 100, startsAt: 1700000000 });
    const t = parseTournament({
      id: 42, name: "…", rules: "official", format: "knockout", size: 16, state: "finished",
      starts_at: 0, ends_at: 0, rated: true, entry_fee: 100, prize_pool: 3400, prizes: [2380, 1020],
      item_prize: "cue_winter_2026", champion: "ana", runner_up: "bob",
      players: [{ username: "ana", country: "BR", seed: 1 }],
      rounds: [[{ a: "ana", b: "bob", winner: "ana", match_id: 9001, score: "" }]],
      standings: [{ username: "ana", points: 12, games: 5, streak: 3 }],
    })!;
    expect(t).toMatchObject({ startsAt: null, endsAt: null, prizes: [2380, 1020], itemPrize: "cue_winter_2026", players: 1 });
    expect(t.rounds[0][0]).toEqual({ a: "ana", b: "bob", winner: "ana", matchId: 9001, score: "" });
    expect(t.standings[0]).toEqual({ username: "ana", points: 12, games: 5, streak: 3 });
    expect(parseTournaments({})).toBe(null);
    expect(parseTournament({ name: "no id" })).toBe(null);
  });

  it("reads the fixtures", () => {
    expect(parseTournaments(tournaments)!.length).toBe(5);
    const k = parseTournament(t42)!;
    expect(k.rounds.map((r) => r.length)).toEqual([8, 4, 2, 1]);
    expect(k.runnerUp).not.toBe(k.champion);
    const a = parseTournament(t43)!;
    expect(a.format).toBe("arena");
    expect(a.standings[0].username).toBe("diego");
  });

  it("draws the whole bracket, played or not", () => {
    const t = parseTournament(t44)!;
    const b = fullBracket(t.rounds, t.size);
    expect(b.map((r) => r.length)).toEqual([4, 2, 1]);
    expect(b[1][0].a).toBe("ana");
    expect(b[1][1]).toEqual({ a: null, b: null, winner: null, matchId: null, score: "" });
    expect(fullBracket([], 4).map((r) => r.length)).toEqual([2, 1]);
    expect(roundCount(16)).toBe(4);
    expect(roundCount(8)).toBe(3);
    expect(roundKind(3, 4)).toEqual({ kind: "final", of: 2 });
    expect(roundKind(2, 4).kind).toBe("semi");
    expect(roundKind(1, 4).kind).toBe("quarter");
    expect(roundKind(0, 4)).toEqual({ kind: "round", of: 16 });
  });

  it("knows how far each player went", () => {
    const k = parseTournament(t42)!;
    const r = reached(k.rounds);
    expect(r.get(k.champion!)).toBe(4);
    expect(r.get(k.runnerUp!)).toBe(3);
  });

  it("has an address in each language", () => {
    expect(tournamentPath("en", 42)).toBe("/tournaments/42/");
    expect(tournamentPath("pt", 42)).toBe("/pt/torneios/42/");
    expect(tournamentPath("es", 42)).toBe("/es/torneos/42/");
    expect(pagePath("pt", "supporters")).toBe("/pt/apoiadores/");
    expect(pagePath("es", "rules")).toBe("/es/reglas/");
  });
});

describe("supporters", () => {
  it("reads them, the longest-standing first", () => {
    const s = parseSupporters(supporters)!;
    expect(s[0]).toMatchObject({ username: "carla", months: 12, vip: false });
    expect(parseSupporters([{ username: "" }, { nope: 1 }, { username: "x", country: "br" }])).toEqual([
      { username: "x", country: "BR", since: 0, months: 0, vip: false },
    ]);
    expect(parseSupporters(null)).toBe(null);
  });
});
