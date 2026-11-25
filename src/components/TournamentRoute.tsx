// What the tournament pages of every language share (`/tournaments/`,
// `/pt/torneios/`, `/es/torneos/`, and `…/<id>/`): made from the game
// server's data, then kept a minute (ISR).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fmt, getDict, type Locale } from "@/i18n";
import { BUILDING, ServerUnavailable } from "@/lib/api";
import { pageMetadata } from "@/lib/metadata";
import { pagePath, tournamentPath } from "@/lib/routes";
import { fetchTournament, fetchTournaments } from "@/lib/tournaments";
import { describe, TournamentPage, TournamentsPage } from "./Tournaments";

export function tournamentsMetadata(locale: Locale): Metadata {
  const t = getDict(locale).tournaments;
  return pageMetadata({ locale, pathOf: (l) => pagePath(l, "tournaments"), title: t.title, description: t.description });
}

export async function TournamentsRoutePage({ locale }: { locale: Locale }) {
  const res = await fetchTournaments();
  // While building (the server may be out of reach) the page is made
  // without the list, and made again a minute later; afterwards a failure
  // keeps the last good page.
  if (!res.ok && !BUILDING) throw new ServerUnavailable("tournaments", res.status);
  return <TournamentsPage locale={locale} list={res.ok ? res.data : null} />;
}

/** The number in the address, or null for something that isn't one. */
function idOf(raw: string): number | null {
  return /^\d{1,12}$/.test(raw) ? Number(raw) : null;
}

const loadTournament = cache(async (raw: string) => {
  const id = idOf(raw);
  if (id === null) return null;
  const res = await fetchTournament(id);
  if (res.ok) return res.data;
  if (res.status === 404) return null;
  throw new ServerUnavailable(`tournament ${id}`, res.status);
});

export async function tournamentMetadata(locale: Locale, raw: string): Promise<Metadata> {
  const x = await loadTournament(raw).catch(() => null);
  const d = getDict(locale);
  if (!x) return { title: d.tournaments.notFoundTitle, robots: { index: false, follow: true } };
  return pageMetadata({
    locale,
    pathOf: (l) => tournamentPath(l, x.id),
    title: fmt(d.tournaments.detailTitle, { name: x.name, format: d.tournaments.formats[x.format].toLowerCase() }),
    description: describe(x, d),
    // The picture is the page's own (opengraph-image.tsx).
    image: false,
  });
}

export async function TournamentRoutePage({ locale, raw }: { locale: Locale; raw: string }) {
  const x = await loadTournament(raw);
  if (!x) notFound();
  return <TournamentPage locale={locale} x={x} />;
}

export { loadTournament };
