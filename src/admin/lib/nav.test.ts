import { describe, expect, it } from "vitest";
import { NAV_ITEMS, navFor, navItemsFor, sectionOf } from "./nav";

describe("the sidebar", () => {
  it("has one shortcut per page, never g itself", () => {
    const keys = NAV_ITEMS.map((n) => n.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain("g");
  });

  it("shows moderators every page but those only administrators use", () => {
    const mod = navItemsFor("moderator").map((n) => n.id);
    expect(mod).toContain("words");
    expect(mod).toContain("calendar");
    expect(mod).not.toContain("gifts");
    expect(mod).not.toContain("exports");
    expect(navItemsFor("admin").map((n) => n.id)).toEqual(NAV_ITEMS.map((n) => n.id));
  });

  it("leaves out a heading with nothing under it", () => {
    for (const role of ["moderator", "admin"] as const) {
      const list = navFor(role);
      list.forEach((n, k) => {
        if (!("id" in n)) expect(list[k + 1] && "id" in list[k + 1]).toBe(true);
      });
    }
  });

  it("knows the section of an address", () => {
    expect(sectionOf("/admin/players/ana/inbox")).toBe("players");
    expect(sectionOf("/admin/matches/9001")).toBe("matches");
    expect(sectionOf("/admin")).toBe("dashboard");
  });
});
