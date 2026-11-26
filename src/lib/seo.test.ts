import { describe, expect, it } from "vitest";
import { getDict, LOCALE_INFO, LOCALES } from "@/i18n";
import { buildMetadata, homeMetadata, pageMetadata, TITLE_SUFFIX } from "./metadata";
import { FALLBACK_RELEASE } from "./release";
import { pagePath, PAGE_SLUGS, playerPath, type PageKey } from "./routes";
import { SOCIAL_PROFILES } from "./site";
import { homeGraph, ORG_ID, videoGame } from "./structured-data";

describe("search engines", () => {
  it("gives every page a canonical address and the same alternates in every language", () => {
    for (const page of Object.keys(PAGE_SLUGS) as PageKey[]) {
      const all = LOCALES.map((l) =>
        pageMetadata({ locale: l, pathOf: (x) => pagePath(x, page), title: "T", description: "D" }),
      );
      all.forEach((m, i) => {
        expect(m.alternates?.canonical).toBe(pagePath(LOCALES[i], page));
        // Each version points at all of them, itself included, and English for everyone else.
        expect(m.alternates?.languages).toEqual(all[0].alternates?.languages);
        expect(Object.values(m.alternates?.languages ?? {})).toContain(pagePath(LOCALES[i], page));
      });
      expect(all[0].alternates?.languages).toMatchObject({ "x-default": pagePath("en", page), "pt-BR": pagePath("pt", page), pt: pagePath("pt", page) });
    }
  });

  it("puts the name after a page's title, but not twice on the home page", () => {
    const m = pageMetadata({ locale: "pt", pathOf: (l) => playerPath(l, "ana"), title: "ana", description: "D" });
    expect(m.title).toBe("ana");
    expect(m.openGraph?.title).toBe(`ana${TITLE_SUFFIX}`);
    expect(buildMetadata("pt").title).toMatchObject({ template: `%s${TITLE_SUFFIX}` });
    for (const l of LOCALES) {
      const home = homeMetadata(l);
      expect(home.title).toEqual({ absolute: getDict(l).meta.title });
      expect(getDict(l).meta.title.startsWith("Snook Legend")).toBe(true);
      expect(home.alternates?.canonical).toBe(LOCALE_INFO[l].path);
    }
  });

  it("keeps titles and descriptions to what search results show", () => {
    for (const l of LOCALES) {
      const d = getDict(l);
      const titles = [d.meta.title, ...[d.ranking.metaTitle, d.tournaments.metaTitle, d.guide.title, d.calc.title, d.downloadPage.title].map((t) => t + TITLE_SUFFIX)];
      for (const t of titles) expect(t.length, t).toBeLessThanOrEqual(70);
      for (const desc of [d.meta.description, d.ranking.description, d.tournaments.description, d.guide.description, d.calc.description, d.downloadPage.description]) {
        expect(desc.length, desc).toBeGreaterThanOrEqual(70);
        expect(desc.length, desc).toBeLessThanOrEqual(175);
      }
    }
  });

  it("says only what's true about the game, with the official profiles", () => {
    const graph = homeGraph("pt", FALLBACK_RELEASE);
    const json = JSON.stringify(graph);
    // Valid JSON, and no ratings or reviews nobody gave.
    expect(JSON.parse(json)).toEqual(graph);
    expect(json).not.toMatch(/aggregateRating|"review"/);
    const org = graph["@graph"].find((n) => n["@id"] === ORG_ID) as { sameAs: string[] };
    expect(org.sameAs).toEqual(SOCIAL_PROFILES.filter((p) => p.url).map((p) => p.url));
    const game = videoGame("en", FALLBACK_RELEASE);
    expect(game.offers.every((o) => o.price === "0")).toBe(true);
    expect(game.screenshot).toHaveLength(getDict("en").gallery.items.length);
    expect(game.softwareVersion).toBe(FALLBACK_RELEASE.version);
  });
});
