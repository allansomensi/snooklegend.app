import type { MetadataRoute } from "next";
import { LOCALE_INFO, LOCALES, type Locale } from "@/i18n";
import { getJson } from "@/lib/api";
import { parseRanking, rankingPath, RULES } from "@/lib/ranking";
import { languagesOf, pagePath, playerPath, tournamentPath, type PageKey } from "@/lib/routes";
import { LEGAL_DOCS, legalPath, SITE_URL } from "@/lib/site";
import { fetchTournaments } from "@/lib/tournaments";

// Made again every hour: the best players and the latest tournaments change.
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/** A page in each language, each listing the others. */
function everyLanguage(pathOf: (l: Locale) => string, rest: Omit<Entry, "url" | "alternates" | "priority">, priority: (l: Locale) => number): Entry[] {
  const languages = languagesOf(pathOf, true);
  return LOCALES.map((l) => ({ url: SITE_URL + pathOf(l), ...rest, priority: priority(l), alternates: { languages } }));
}

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
  const home = everyLanguage((l) => LOCALE_INFO[l].path, { lastModified: new Date(), changeFrequency: "weekly" }, (l) => (l === "en" ? 1 : 0.9));
  const ranking = everyLanguage(rankingPath, { changeFrequency: "daily" }, same(0.7));
  const pages = (
    [
      ["rules", "monthly", 0.8],
      ["tournaments", "daily", 0.7],
      ["rating", "monthly", 0.6],
      ["supporters", "weekly", 0.4],
    ] as [PageKey, Entry["changeFrequency"], number][]
  ).flatMap(([page, changeFrequency, p]) => everyLanguage((l) => pagePath(l, page), { changeFrequency }, same(p)));
  const legal = LEGAL_DOCS.flatMap((doc) => everyLanguage((l) => legalPath(l, doc), { changeFrequency: "yearly" }, same(0.3)));

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
  return [...home, ...ranking, ...pages, ...tournamentPages, ...playerPages, ...legal];
}
