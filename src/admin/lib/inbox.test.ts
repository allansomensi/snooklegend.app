import { describe, expect, it } from "vitest";
import { flatNotification, isPinned, isRead, minutesUntil, parsePreview, pinnedForGood, ratingChange, splitNames, strokeStats } from "./inbox";
import type { MatchStroke } from "./types";

const rendered = {
  en: { title: "Warning from the staff", body: "Mind your words." },
  pt: { title: "Advertência da equipe", body: "Mind your words." },
  es: { title: "Advertencia del equipo", body: "Mind your words." },
};
const notification = { id: 0, kind: "warning", text: "Mind your words.", from: "boss", created_at: 1795291200, read_at: 0, important: true, pinned_until: 1795896000, action: { to: "none" } };

describe("a preview", () => {
  it("is read as the server sends it", () => {
    const p = parsePreview({ preview: true, category: "staff", notification, rendered });
    expect(p?.category).toBe("staff");
    expect(p?.rendered.pt.title).toBe("Advertência da equipe");
    expect(p?.notification.kind).toBe("warning");
    expect(p?.players).toBeUndefined();
  });

  it("keeps both players' when a game is annulled", () => {
    const one = { preview: true, category: "punishment", notification: { ...notification, kind: "match_voided", opponent: "bob" }, rendered };
    const two = { ...one, notification: { ...one.notification, opponent: "ana" } };
    const p = parsePreview({ ...one, players: [one, two] });
    expect(p?.players?.map((x) => x.notification.opponent)).toEqual(["bob", "ana"]);
  });

  it("is null for anything else", () => {
    expect(parsePreview({ ok: true, id: 41 })).toBeNull();
    expect(parsePreview({ preview: true, notification, rendered: { en: rendered.en } })).toBeNull();
    expect(parsePreview(null)).toBeNull();
    expect(parsePreview("preview")).toBeNull();
  });
});

describe("read receipts and pins", () => {
  it("know read from not read", () => {
    expect(isRead({ read_at: 0 })).toBe(false);
    expect(isRead({ read_at: null })).toBe(false);
    expect(isRead({ read_at: 1795291260 })).toBe(true);
  });

  it("know a pin that still holds, and one for good", () => {
    expect(isPinned({ pinned_until: 200 }, 100)).toBe(true);
    expect(isPinned({ pinned_until: 50 }, 100)).toBe(false);
    expect(isPinned({ pinned_until: 0 }, 100)).toBe(false);
    expect(pinnedForGood(9223372036854775807)).toBe(true);
    expect(pinnedForGood(1795896000)).toBe(false);
  });
});

describe("names pasted for presents", () => {
  it("are split as the server splits them, each once", () => {
    const { names, repeated } = splitNames("ana, bob\n@caio;dani\tAna  edu,,");
    expect(names).toEqual(["ana", "bob", "caio", "dani", "edu"]);
    expect(repeated).toEqual(["Ana"]);
  });

  it("are none in an empty text", () => {
    expect(splitNames("  \n , ").names).toEqual([]);
  });
});

describe("a rating put right", () => {
  it("adds or takes points", () => {
    expect(ratingChange(1500, "delta", "-40")).toEqual({ delta: -40, after: 1460 });
    expect(ratingChange(1500, "delta", "+25")).toEqual({ delta: 25, after: 1525 });
  });

  it("puts a rating", () => {
    expect(ratingChange(1500, "rating", "1420")).toEqual({ delta: -80, after: 1420 });
  });

  it("refuses nothing, too much, or not a number", () => {
    expect(ratingChange(1500, "delta", "0")).toEqual({ error: "zero" });
    expect(ratingChange(1500, "rating", "1500")).toEqual({ error: "zero" });
    expect(ratingChange(150, "delta", "-60")).toEqual({ error: "range" });
    expect(ratingChange(1500, "rating", "4001")).toEqual({ error: "range" });
    expect(ratingChange(1500, "delta", "ten")).toEqual({ error: "number" });
    expect(ratingChange(1500, "delta", "1.5")).toEqual({ error: "number" });
  });
});

describe("a mute until a time", () => {
  it("is whole minutes, at least one", () => {
    expect(minutesUntil(1000 + 3600, 1000)).toBe(60);
    expect(minutesUntil(1000 + 61, 1000)).toBe(2);
    expect(minutesUntil(900, 1000)).toBe(1);
  });
});

describe("a game's strokes in numbers", () => {
  const strokes: MatchStroke[] = [
    { index: 0, kind: "shot", seat: 0, power: 6, think_secs: 4, potted: [{ ball: 3, pocket: "x" }, { ball: 0, pocket: "y" }], fouls: ["Scratch"] },
    { index: 1, kind: "shot", seat: 1, power: 2, think_secs: 10, potted: [], fouls: [] },
    { index: 2, kind: "time_foul", seat: 0, think_secs: null },
    { index: 3, kind: "shot", seat: 1, power: 4, think_secs: 20, potted: [{ ball: 5, pocket: "x" }, { ball: 6, pocket: "x" }], fouls: [], timeout: true },
  ];

  it("are counted for each seat", () => {
    const [a, b] = strokeStats(strokes);
    expect(a).toMatchObject({ shots: 1, potting: 1, balls: 1, fouls: 2, avgPower: 6, maxPower: 6, avgThink: 4, timeouts: 1 });
    expect(b).toMatchObject({ shots: 2, potting: 1, balls: 2, fouls: 0, avgPower: 3, maxPower: 4, avgThink: 15, maxThink: 20, timeouts: 1 });
  });

  it("have no averages without the numbers", () => {
    const [a] = strokeStats([{ index: 0, kind: "resign", seat: 0 }]);
    expect(a.avgPower).toBeNull();
    expect(a.avgThink).toBeNull();
  });
});

describe("avatars", async () => {
  const { avatarSrc } = await import("./avatars");
  it("are the game's pictures", () => {
    expect(avatarSrc("pic_crown")).toBe("/avatars/pic_crown.webp");
    expect(avatarSrc("ana")).toBe("/avatars/pic_thirteen.webp");
    expect(avatarSrc("")).toBeNull();
    expect(avatarSrc("nobody_knows")).toBeNull();
  });
});

describe("export files", async () => {
  const { exportName } = await import("./download");
  it("are named after what they hold and their days", () => {
    const a = Math.floor(new Date(2026, 10, 1).getTime() / 1000);
    const b = Math.floor(new Date(2026, 11, 1).getTime() / 1000);
    expect(exportName("ledger", a, b)).toBe("snook-legend-ledger-2026-11-01-2026-11-30.csv");
  });
});

describe("a notification from the staff lists", () => {
  it("has its kind's fields at the top", () => {
    const n = flatNotification({ id: 3, kind: { kind: "staff_gift", coins: 0, item: "cue_dragon", vip_days: 0 }, created_at: 1, text: "Winter cup" });
    expect(n.kind).toBe("staff_gift");
    expect(n.item).toBe("cue_dragon");
    expect(n.text).toBe("Winter cup");
  });

  it("stays as it is when flat already", () => {
    expect(flatNotification({ id: 1, kind: "warning", created_at: 1 }).kind).toBe("warning");
  });
});
