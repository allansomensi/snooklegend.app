import type { MetadataRoute } from "next";
import { LOCALE_INFO, LOCALES, type Locale } from "@/i18n";
import { getJson } from "@/lib/api";
import { LEGAL_UPDATED } from "@/lib/legal";
import { parseRanking, rankingPath, RULES } from "@/lib/ranking";
import { getLatestRelease } from "@/lib/release";
import { languagesOf, pagePath, playerPath, tournamentPath, type PageKey } from "@/lib/routes";
import { RULES_UPDATED } from "@/lib/rules-guide";
import { LEGAL_DOCS, legalPath, SITE_URL } from "@/lib/site";
import { fetchTournaments } from "@/lib/tournaments";

// Made again every hour: the best players and the latest tournaments change.
// A date is given only where it is known (a page's text, a release, a
// tournament), so search engines can trust the ones there are.
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/** A page in each language, each listing all of them (hreflang). */
function everyLanguage(
  pathOf: (l: Locale) => string,
  rest: Omit<Entry, "url" | "alternates" | "priority" | "images"> & { images?: (l: Locale) => string[] },
  priority: (l: Locale) => number,
): Entry[] {
  const languages = languagesOf(pathOf, true);
  const { images, ...entry } = rest;
  return LOCALES.map((l) => ({
    url: SITE_URL + pathOf(l),
    ...entry,
    priority: priority(l),
    alternates: { languages },
    ...(images ? { images: images(l) } : {}),
  }));
}

/** The screenshots on a language's home page (in that language). */
const SHOTS = ["01-aim", "04-hall", "02-top", "03-elevation", "05-opponents", "06-lounge", "10-drills", "08-rules", "09-menu", "07-pictures"];
const homeImages = (l: Locale) => [`${SITE_URL}/og.jpg`, ...SHOTS.map((s) => `${SITE_URL}/shots/${l}/${s}-1920.webp`)];

/** The top players under both sets of rules (none if the server doesn't answer soon). */
async function topPlayers(): Promise<string[]> {
  const boards = await Promise.all(
    RULES.map((r) => getJson(`/api/leaderboard?rules=${r}`, (d) => parseRanking(d), { timeout: 8_000, revalidate: 3600 })),
  );
  const names = new Set<string>();
  for (const b of boards) if (b.ok) for (const e of b.data.slice(0, 50)) names.add(e.username);
  return [...names];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const same = (n: number) => () => n;
  const release = await getLatestRelease();
  const home = everyLanguage(
    (l) => LOCALE_INFO[l].path,
    { lastModified: release.date, changeFrequency: "weekly", images: homeImages },
    (l) => (l === "en" ? 1 : 0.9),
  );
  const download = everyLanguage((l) => pagePath(l, "download"), { lastModified: release.date, changeFrequency: "weekly" }, same(0.9));
  const ranking = everyLanguage(rankingPath, { changeFrequency: "daily" }, same(0.8));
  const pages = (
    [
      ["rules", "monthly", 0.8, `${RULES_UPDATED}T12:00:00Z`],
      ["tournaments", "daily", 0.7, undefined],
      ["rating", "monthly", 0.6, undefined],
      ["supporters", "weekly", 0.4, undefined],
    ] as [PageKey, Entry["changeFrequency"], number, string | undefined][]
  ).flatMap(([page, changeFrequency, p, lastModified]) =>
    everyLanguage((l) => pagePath(l, page), { changeFrequency, ...(lastModified ? { lastModified } : {}) }, same(p)),
  );
  const legal = LEGAL_DOCS.flatMap((doc) =>
    everyLanguage((l) => legalPath(l, doc), { changeFrequency: "yearly", lastModified: `${LEGAL_UPDATED[doc]}T12:00:00Z` }, same(0.3)),
  );

  // From the game server, failing soft: the sitemap is made all the same.
  const [players, tournaments] = await Promise.all([
    topPlayers().catch(() => []),
    fetchTournaments(30, 3600)
      .then((r) => (r.ok ? r.data : []))
      .catch(() => []),
  ]);
  const playerPages = players.flatMap((name) => everyLanguage((l) => playerPath(l, name), { changeFrequency: "daily" }, same(0.5)));
  const tournamentPages = tournaments.flatMap((x) => {
    const at = x.endsAt ?? x.startsAt;
    return everyLanguage(
      (l) => tournamentPath(l, x.id),
      { changeFrequency: x.state === "finished" ? "monthly" : "hourly", ...(at ? { lastModified: new Date(at * 1000) } : {}) },
      same(0.5),
    );
  });
  return [...home, ...download, ...ranking, ...pages, ...tournamentPages, ...playerPages, ...legal];
}
