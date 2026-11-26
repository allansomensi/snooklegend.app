// What the player pages of every language share (`/player/<name>/`,
// `/jogador/<name>/`, `/es/jugador/<name>/`): made when first asked for, then
// kept a minute (ISR).

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { fmt, getDict, type Locale } from "@/i18n";
import { ServerUnavailable } from "@/lib/api";
import { countryName } from "@/lib/format";
import { fetchPlayer, mainRating, plausibleName } from "@/lib/player";
import { notFoundMetadata, pageMetadata } from "@/lib/metadata";
import { playerPath } from "@/lib/routes";
import { PlayerProfile } from "./PlayerProfile";

/** The name in the address, as typed (Next.js may hand it over still percent-encoded). */
export function nameParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** The player (once per page made, for the page, its metadata and its picture), or null for a 404. */
export const loadPlayer = cache(async (name: string) => {
  if (!plausibleName(name)) return null;
  const res = await fetchPlayer(name);
  if (res.ok) return res.data;
  if (res.status === 404) return null;
  throw new ServerUnavailable(`player ${name}`, res.status);
});

export async function playerMetadata(locale: Locale, raw: string): Promise<Metadata> {
  const p = await loadPlayer(nameParam(raw)).catch(() => null);
  const t = getDict(locale);
  if (!p) return notFoundMetadata(t.player.notFoundTitle, t.player.notFoundText);
  const main = mainRating(p);
  const country = countryName(locale, p.country);
  const from = country ? fmt(t.player.from, { country }) : "";
  const description =
    main.games > 0
      ? fmt(t.player.description, {
          name: p.username,
          from,
          rating: main.rating,
          tier: t.ranking.tiers[main.tier],
          rules: t.common.rulesOf[main.rules],
          level: p.level,
          wins: main.wins,
          games: main.games,
        })
      : fmt(t.player.descriptionNew, { name: p.username, from, level: p.level });
  return pageMetadata({
    locale,
    pathOf: (l) => playerPath(l, p.username),
    title: fmt(t.player.title, { name: p.username }),
    description,
    type: "profile",
    profile: { username: p.username },
    // The player's card (card.png, next to the page).
    image: { url: `${playerPath(locale, p.username)}card.png`, width: 1200, height: 630, type: "image/png" },
    imageAlt: fmt(t.player.cardAlt, { name: p.username }),
  });
}

export async function PlayerRoutePage({ locale, raw }: { locale: Locale; raw: string }) {
  const name = nameParam(raw);
  const p = await loadPlayer(name);
  if (!p) notFound();
  // One address per player: `/player/ANA/` goes to `/player/ana/`.
  if (p.username !== name) permanentRedirect(playerPath(locale, p.username));
  return <PlayerProfile player={p} locale={locale} />;
}
