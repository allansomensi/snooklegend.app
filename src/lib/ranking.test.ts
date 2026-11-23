import { describe, expect, it } from "vitest";
import { parseRanking, rankingPath, tierOf, winRate } from "./ranking";

describe("ranking", () => {
  it("puts ratings in the game's leagues", () => {
    expect(tierOf(1200).key).toBe("rookie");
    expect(tierOf(1249).key).toBe("rookie");
    expect(tierOf(1250).key).toBe("amateur");
    expect(tierOf(1300).key).toBe("skilled");
    expect(tierOf(1500).key).toBe("expert");
    expect(tierOf(1700).key).toBe("master");
    expect(tierOf(1900).key).toBe("grandmaster");
    expect(tierOf(2100).key).toBe("legend");
    expect(tierOf(2600).key).toBe("legend");
  });

  it("rounds the win rate down, and is 0 without games", () => {
    expect(winRate({ wins: 2, games: 3 })).toBe(66);
    expect(winRate({ wins: 0, games: 0 })).toBe(0);
  });

  it("keeps only well-formed lines", () => {
    const ok = { rank: 1, username: "ana", rating: 1300, games: 4, wins: 3, country: "BR" };
    expect(parseRanking([ok, { rank: 2 }, null, "x"])).toEqual([ok]);
    expect(parseRanking({ error: true })).toEqual([]);
  });

  it("has a page in each language", () => {
    expect(rankingPath("en")).toBe("/ranking/");
    expect(rankingPath("pt")).toBe("/pt/ranking/");
    expect(rankingPath("es")).toBe("/es/ranking/");
  });
});

describe("flags", () => {
  it("lists every flag of the game's atlas, in its order", async () => {
    const { FLAG_CODES } = await import("@/admin/lib/countries");
    // crates/proto/src/countries.rs: 249 countries (16 a row in public/flags.png).
    expect(FLAG_CODES.length).toBe(249);
    expect(new Set(FLAG_CODES).size).toBe(FLAG_CODES.length);
    // Saint Helena and South Georgia (long names over several lines in the
    // game's source) were once left out, shifting every flag after them.
    expect(FLAG_CODES.indexOf("SH")).toBe(184);
    expect(FLAG_CODES.indexOf("GS")).toBe(205);
    expect(FLAG_CODES.indexOf("US")).toBe(234);
  });
});
