import { describe, expect, it } from "vitest";
import {
  attemptStats, attemptStatus, clockTime, fourPlayers, givenBack, parseClockAttempts, parseClockRemoved, parseClockWeek, parseDoublesDetail, parseDoublesPage,
  parseDoublesRatings, sideOf, teamName, weekDate, weekOf, weekOfDate, weekParam, weekStart,
} from "./modes";

// As docs/ADMIN-API.md shows them.
const stored = {
  id: 120, room: 1795280000456, teams: [["ana", "bia"], ["caio", "duda"]], countries: [["BR", "BR"], ["PT", "BR"]], player_ids: [[12, 13], [14, 15]],
  winner: 0, reason: "eight_ball", rated: true, rules: "official", deltas: [[14, 10], [-12, -12]], shots: 41, ended_at: 1795290000, replay: true, voided_at: null,
};
const live = { id: 1795289000123, teams: [["ana", "bia"], ["caio", "duda"]], rated: true, rules: "official", shots: 14, finished: false };

describe("doubles games", () => {
  it("are read as the server sends them", () => {
    const p = parseDoublesPage({ live: [live], games: [stored], next: null });
    expect(p.live[0]).toEqual({ ...live, rules: "official" });
    expect(p.games[0].teams).toEqual([["ana", "bia"], ["caio", "duda"]]);
    expect(p.games[0].deltas[1]).toEqual([-12, -12]);
    expect(p.games[0].winner).toBe(0);
    expect(p.games[0].voided_at).toBeNull();
    expect(p.next).toBeNull();
  });

  it("keep the next page and drop what isn't a game", () => {
    const p = parseDoublesPage({ live: [null, { teams: [] }], games: [stored, "x", { ...stored, id: 119, rules: "brazilian", winner: 1, room: null }], next: 119 });
    expect(p.live).toEqual([]);
    expect(p.games.map((g) => [g.id, g.rules, g.winner, g.room])).toEqual([[120, "official", 0, 1795280000456], [119, "brazilian", 1, null]]);
    expect(p.next).toBe(119);
    expect(parseDoublesPage(null)).toEqual({ live: [], games: [], next: null });
  });

  it("fill what an older server leaves out", () => {
    const g = parseDoublesPage({ games: [{ id: 7, teams: [["a"]] }] }).games[0];
    expect(g.teams).toEqual([["a", ""], ["", ""]]);
    expect(g.deltas).toEqual([[0, 0], [0, 0]]);
    expect(g.rated).toBe(false);
    expect(g.rules).toBe("brazilian");
    expect(g.replay).toBe(false);
  });

  it("come with their replay, or without", () => {
    const d = parseDoublesDetail({ game: { ...stored, voided_at: 1795291300, strokes: 41, replay_data: { seed: 9, strokes: [] } } });
    expect(d?.strokes).toBe(41);
    expect(d?.replay_data).toEqual({ seed: 9, strokes: [] });
    expect(d?.voided_at).toBe(1795291300);
    const none = parseDoublesDetail({ game: { ...stored, replay: false, strokes: null, replay_data: null } });
    expect(none?.strokes).toBeNull();
    expect(none?.replay_data).toBeNull();
    expect(parseDoublesDetail({ ok: true })).toBeNull();
  });

  it("are seen from each of the four players", () => {
    const g = parseDoublesPage({ games: [stored] }).games[0];
    expect(sideOf(g, "BIA")).toEqual({ team: 0, place: 1, partner: "ana", opponents: ["caio", "duda"], won: true, delta: 10 });
    expect(sideOf(g, "caio")?.won).toBe(false);
    expect(sideOf(g, "caio")?.delta).toBe(-12);
    expect(sideOf(g, "edu")).toBeNull();
  });

  it("name the teams and the four players as the server tells them", () => {
    const g = parseDoublesPage({ games: [stored] }).games[0];
    expect(teamName(g.teams[1])).toBe("caio & duda");
    expect(fourPlayers(g)).toEqual(["ana", "bia", "caio", "duda"]);
    expect(givenBack(g)).toEqual([{ name: "ana", back: -14 }, { name: "bia", back: -10 }, { name: "caio", back: 12 }, { name: "duda", back: 12 }]);
  });
});

describe("a player's doubles ratings", () => {
  it("are read under each of the rules", () => {
    const r = parseDoublesRatings({
      brazilian: { rating: 1200, peak_rating: 1200, games: 0, wins: 0 },
      official: { rating: 1214, peak_rating: 1230, games: 9, wins: 5 },
    });
    expect(r.official).toEqual({ rating: 1214, peak_rating: 1230, games: 9, wins: 5 });
    expect(r.brazilian.games).toBe(0);
  });

  it("start at 1200 when the server sends none", () => {
    expect(parseDoublesRatings(undefined)).toEqual({
      brazilian: { rating: 1200, peak_rating: 1200, games: 0, wins: 0 },
      official: { rating: 1200, peak_rating: 1200, games: 0, wins: 0 },
    });
    expect(parseDoublesRatings({ official: { rating: 1300 } }).official.peak_rating).toBe(1300);
  });
});

describe("the weeks against the clock", () => {
  it("start on Monday at midnight UTC, as the game counts them", () => {
    // 2026-11-23 is a Monday.
    const monday = Date.UTC(2026, 10, 23) / 1000;
    expect(weekStart(weekOf(monday))).toBe(monday);
    expect(weekOf(monday - 1)).toBe(weekOf(monday) - 1);
    expect(weekOf(monday + 7 * 86400 - 1)).toBe(weekOf(monday));
    // Week 0 holds 1970-01-01, a Thursday: it started on Monday 29 December 1969.
    expect(weekOf(0)).toBe(0);
    expect(weekStart(0)).toBe(-3 * 86400);
    expect(new Date(weekStart(weekOf(Date.UTC(2026, 10, 25) / 1000)) * 1000).getUTCDay()).toBe(1);
  });

  it("come from a date field and go back to one", () => {
    expect(weekOfDate("2026-11-29")).toBe(weekOf(Date.UTC(2026, 10, 23) / 1000));
    expect(weekDate(weekOfDate("2026-11-29")!)).toBe("2026-11-23");
    expect(weekOfDate("29/11/2026")).toBeNull();
  });

  it("are read from the address", () => {
    expect(weekParam("2946")).toBe(2946);
    expect(weekParam("")).toBeNull();
    expect(weekParam("-3")).toBeNull();
    expect(weekParam("abc")).toBeNull();
  });

  it("show times as the game does", () => {
    expect(clockTime(45210)).toBe("0:45.2");
    expect(clockTime(61000)).toBe("1:01.0");
    expect(clockTime(600000)).toBe("10:00.0");
  });
});

describe("a week's table", () => {
  it("is read as the server sends it", () => {
    const w = parseClockWeek({
      week: 2946, this_week: 2946, starts_at: 1795737600, ends_at: 1796342400, players: 37, prizes: [100, 60, 30],
      board: [{ place: 1, user_id: 12, username: "ana", country: "BR", ms: 45210, time: "0:45.2", at: 1795740000 }, { place: 2 }],
    });
    expect(w.week).toBe(2946);
    expect(w.prizes).toEqual([100, 60, 30]);
    expect(w.board).toEqual([{ place: 1, user_id: 12, username: "ana", country: "BR", ms: 45210, time: "0:45.2", at: 1795740000 }]);
    expect(w.players).toBe(37);
  });

  it("works out the week's days when they are left out", () => {
    const w = parseClockWeek({ week: 2940, this_week: 2946, board: [{ place: 1, username: "bia", ms: 61000 }] });
    expect(w.starts_at).toBe(weekStart(2940));
    expect(w.ends_at).toBe(weekStart(2941));
    expect(w.board[0].time).toBe("1:01.0");
    expect(w.players).toBe(1);
  });
});

describe("a player's attempts", () => {
  const base = {
    id: 881, username: "bia", day: 20620, started_ms: 1795740000000, finished_ms: 1795740061000, ms: 61000, time: "1:01.0", shots: 12, fouls: 1, week: 2946,
    at: 1795740061, counted: true, removed_at: null, removed_reason: null,
  };

  it("are read as the server sends them", () => {
    const a = parseClockAttempts({ username: "bia", this_week: { week: 2946, best_ms: 61000, place: 4 }, attempts: [base, { nope: 1 }] });
    expect(a.this_week).toEqual({ week: 2946, best_ms: 61000, place: 4 });
    expect(a.attempts).toHaveLength(1);
    expect(a.attempts[0]).toEqual(base);
  });

  it("say where each stands", () => {
    const [counted, removed, unsent, failed] = parseClockAttempts({
      attempts: [
        base,
        { ...base, id: 880, counted: false, removed_at: 1795741000, removed_reason: "Times impossible for a human" },
        { ...base, id: 879, finished_ms: null, ms: null, time: null, shots: null, fouls: null, week: null, at: null, counted: false },
        { ...base, id: 878, ms: null, time: null, shots: null, fouls: null, week: null, at: null, counted: false },
      ],
    }).attempts;
    expect([counted, removed, unsent, failed].map(attemptStatus)).toEqual(["counted", "removed", "unsent", "failed"]);
    expect(removed.removed_reason).toBe("Times impossible for a human");
    expect(unsent.time).toBeNull();
    expect(attemptStats([counted, removed, unsent, failed, { ...base, id: 877, ms: 59000 }])).toEqual({ attempts: 5, cleared: 3, counted: 2, removed: 1, best: 59000 });
  });

  it("know an attempt taken off and the best left", () => {
    const r = parseClockRemoved({ ok: true, attempt: { ...base, counted: false, removed_at: 1795741000 }, best_ms: null });
    expect(r?.attempt.counted).toBe(false);
    expect(r?.best_ms).toBeNull();
    expect(parseClockRemoved({ ok: true })).toBeNull();
  });
});
