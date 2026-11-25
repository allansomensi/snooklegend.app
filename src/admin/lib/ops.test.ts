import { describe, expect, it } from "vitest";
import {
  checkSetting, clashes, countdownParts, exportRange, heatLevel, itemsOnDay, monthGrid, offsetLabel, sameValue, seriesKeys, seriesValue,
  sinkParts, toDateInput, topWithRest, weekOrder, zoneOffset,
} from "./ops";
import type { CalendarItem, CoinDay } from "./types";

describe("a setting typed in", () => {
  it("is a whole number within its range", () => {
    const s = { type: "int" as const, range: { min: 10, max: 120 } };
    expect(checkSetting(s, "45")).toEqual({ value: 45 });
    expect(checkSetting(s, " 10 ")).toEqual({ value: 10 });
    expect(checkSetting(s, "9")).toEqual({ error: "range" });
    expect(checkSetting(s, "121")).toEqual({ error: "range" });
    expect(checkSetting(s, "4.5")).toEqual({ error: "number" });
    expect(checkSetting({ type: "int", range: { min: -720, max: 840 } }, "-180")).toEqual({ value: -180 });
  });

  it("is a time of day", () => {
    const s = { type: "time" as const, range: { format: "HH:MM" } };
    expect(checkSetting(s, "8:05")).toEqual({ value: "08:05" });
    expect(checkSetting(s, "20:00")).toEqual({ value: "20:00" });
    expect(checkSetting(s, "24:00")).toEqual({ error: "time" });
    expect(checkSetting(s, "8h")).toEqual({ error: "time" });
  });

  it("is one of the options, a short enough text, or a switch", () => {
    expect(checkSetting({ type: "choice", range: { options: ["4", "8"] } }, "8")).toEqual({ value: "8" });
    expect(checkSetting({ type: "choice", range: { options: ["4", "8"] } }, "64")).toEqual({ error: "choice" });
    expect(checkSetting({ type: "text", range: { max_length: 5 } }, "two\nlines")).toEqual({ error: "length" });
    expect(checkSetting({ type: "text", range: { max_length: 9 } }, "two\nlines")).toEqual({ value: "two lines" });
    expect(checkSetting({ type: "bool", range: null }, true)).toEqual({ value: true });
    expect(checkSetting({ type: "item", range: null }, " cue_dragon ")).toEqual({ value: "cue_dragon" });
  });

  it("is the same as its number", () => {
    expect(sameValue(45, "45")).toBe(true);
    expect(sameValue("", null)).toBe(true);
    expect(sameValue(true, false)).toBe(false);
  });
});

describe("time zones", () => {
  it("know their offset", () => {
    expect(zoneOffset("UTC", 1795291200)).toBe(0);
    // Brasília has had no summer time since 2019.
    expect(zoneOffset("America/Sao_Paulo", 1795291200)).toBe(-180);
    expect(zoneOffset("Asia/Kolkata", 1795291200)).toBe(330);
    // Lisbon: winter, then summer.
    expect(zoneOffset("Europe/Lisbon", 1795291200)).toBe(0);
    expect(zoneOffset("Europe/Lisbon", 1783000000)).toBe(60);
  });

  it("read as UTC±HH:MM", () => {
    expect(offsetLabel(-180)).toBe("UTC−03:00");
    expect(offsetLabel(330)).toBe("UTC+05:30");
    expect(offsetLabel(0)).toBe("UTC+00:00");
  });
});

describe("a month's page", () => {
  it("is whole weeks from the week of the 1st", () => {
    // November 2026 starts on a Sunday and has 30 days.
    const sunday = monthGrid(2026, 10, 0);
    expect(sunday.length).toBe(35);
    expect(sunday[0].getDate()).toBe(1);
    expect(sunday[29].getDate()).toBe(30);
    const monday = monthGrid(2026, 10, 1);
    expect(monday[0].getMonth()).toBe(9);
    expect(monday[0].getDate()).toBe(26);
    expect(monday.length).toBe(42);
  });

  it("lists what is on each day", () => {
    const d = new Date(2026, 10, 21);
    const at = (h: number) => Math.floor(new Date(2026, 10, 21, h).getTime() / 1000);
    const items = [
      { starts_at: at(20), ends_at: at(22) },
      { starts_at: at(-30), ends_at: at(1) },
      { starts_at: at(24), ends_at: at(26) },
      { starts_at: at(-2), ends_at: at(0) },
    ];
    expect(itemsOnDay(items, d)).toEqual([items[0], items[1]]);
  });

  it("orders the weekdays as the language does", () => {
    expect(weekOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(weekOrder(0)[0]).toBe(0);
  });
});

describe("clashes", () => {
  const item = (kind: CalendarItem["kind"], s: number, e: number, status: CalendarItem["status"] = "scheduled"): CalendarItem => ({ kind, title: kind, starts_at: s, ends_at: e, id: s, status });

  it("are two tournaments at once, or anything during a maintenance", () => {
    const cup = item("weekly_cup", 100, 200);
    const tour = item("tournament", 150, 250);
    const stop = item("maintenance", 240, 300);
    const sale = item("promotion", 0, 1000);
    const found = clashes([cup, tour, stop, sale]);
    expect(found.map((c) => [c.a.kind, c.b.kind, c.why])).toEqual([
      ["weekly_cup", "tournament", "same"],
      ["tournament", "maintenance", "maintenance"],
      ["maintenance", "promotion", "maintenance"],
    ]);
  });

  it("are never with what was called off, ended, or only touches", () => {
    expect(clashes([item("tournament", 100, 200), item("tournament", 200, 300)])).toEqual([]);
    expect(clashes([item("tournament", 100, 200), item("tournament", 150, 300, "cancelled")])).toEqual([]);
    expect(clashes([item("maintenance", 100, 200, "ended"), item("auction", 150, 300)])).toEqual([]);
    expect(clashes([item("vip_item", 0, 1000), item("maintenance", 10, 20)])).toEqual([]);
    expect(clashes([item("promotion", 0, 100), item("auction", 50, 150)])).toEqual([]);
  });
});

describe("an export's dates", () => {
  it("run from the first day's start to the last day's end", () => {
    const r = exportRange("2026-11-01", "2026-11-30");
    expect(r).not.toBeNull();
    const [a, b] = r!;
    expect(new Date(a * 1000).getDate()).toBe(1);
    expect(new Date(b * 1000).getMonth()).toBe(11);
    expect(new Date(b * 1000).getDate()).toBe(1);
  });

  it("are refused backwards or not dates", () => {
    expect(exportRange("2026-11-30", "2026-11-01")).toBeNull();
    expect(exportRange("", "2026-11-01")).toBeNull();
  });

  it("go back into a date field", () => {
    expect(toDateInput(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("the coins' series", () => {
  const day = (by_source: Record<string, number>, by_sink: Record<string, number>): CoinDay => ({ day: 0, date: "", created: 0, spent: 0, net: 0, by_source, by_sink, supply: 0 });
  const days = [day({ games: 10, missions: 5 }, { "shop:cue": 8 }), day({ games: 20, staff: 1, daily_bonus: 7 }, { auctions: 3, "shop:cue": 1 })];

  it("are the largest first", () => {
    expect(seriesKeys(days, "by_source")).toEqual(["games", "daily_bonus", "missions", "staff"]);
    expect(seriesKeys(days, "by_sink")).toEqual(["shop:cue", "auctions"]);
  });

  it("put the smallest together", () => {
    const keys = topWithRest(seriesKeys(days, "by_source"), 3);
    expect(keys).toEqual(["games", "daily_bonus", "*"]);
    expect(seriesValue(days[1], "by_source", "*", keys)).toBe(1);
    expect(seriesValue(days[0], "by_source", "*", keys)).toBe(5);
    expect(seriesValue(days[1], "by_source", "games", keys)).toBe(20);
  });

  it("split a shop's sink from its category", () => {
    expect(sinkParts("shop:cue")).toEqual(["shop", "cue"]);
    expect(sinkParts("auctions")).toEqual(["auctions", null]);
  });
});

describe("shades and countdowns", () => {
  it("shade against the busiest", () => {
    expect(heatLevel(0, 10)).toBe(0);
    expect(heatLevel(0.1, 10)).toBe(1);
    expect(heatLevel(10, 10)).toBe(5);
    expect(heatLevel(6, 10)).toBe(3);
    expect(heatLevel(3, 0)).toBe(0);
  });

  it("count down in days, hours, minutes and seconds", () => {
    expect(countdownParts(90061)).toEqual([1, 1, 1, 1]);
    expect(countdownParts(-5)).toEqual([0, 0, 0, 0]);
  });
});
