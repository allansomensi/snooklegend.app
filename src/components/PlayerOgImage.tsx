// A player's picture for social networks (1200×630, `…/card.png` next to
// their page): their profile picture, name, country, main rating and league,
// level and record, on the felt.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { fmt, getDict, type Locale } from "@/i18n";
import { countryName } from "@/lib/format";
import { avatarSrc, mainRating } from "@/lib/player";
import { ADMIN_RED, TIERS } from "@/lib/ranking";
import { SITE_URL } from "@/lib/site";
import { loadPlayer, nameParam } from "./PlayerRoute";

export const OG_SIZE = { width: 1200, height: 630 };

/** Kept an hour by browsers and the CDN, and served stale for a day while made again. */
export const CARD_CACHE = { "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" };

/**
 * The profile picture as a PNG data URL (the picture drawer can't read WebP;
 * sharp, which Next.js brings for its images, converts it), or null: the
 * card shows the name's initial then. The pictures ship with the function:
 * see `outputFileTracingIncludes`.
 */
async function avatarData(code: string): Promise<string | null> {
  const src = avatarSrc(code);
  if (!src) return null;
  try {
    const file = await readFile(path.join(process.cwd(), "public", src));
    const { default: sharp } = await import("sharp");
    const png = await sharp(file).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

/** The card of the player named in the address (a 404 for no such player). */
export async function playerCard(locale: Locale, raw: string): Promise<Response> {
  const p = await loadPlayer(nameParam(raw)).catch(() => undefined);
  // No such player: no picture. The server didn't answer: the game's own, a minute.
  if (p === null) return new Response(null, { status: 404 });
  if (p === undefined) return Response.redirect(new URL("/og.jpg", SITE_URL), 307);
  const d = getDict(locale);
  const t = d.player;
  const main = mainRating(p);
  const tier = TIERS.find((x) => x.key === main.tier) ?? TIERS[0];
  const country = countryName(locale, p.country);
  const avatar = await avatarData(p.avatar);
  const name = p.username;
  const facts = [fmt(t.level, { n: p.level }), ...(main.games > 0 ? [fmt(t.record, { wins: main.wins, losses: main.games - main.wins })] : [])];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          color: "#f5f0e6",
          background: "radial-gradient(120% 90% at 50% 20%, #1c8a4c 0%, #0b4f2a 55%, #040907 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, color: "#efcf82", fontWeight: 700 }}>
          <div style={{ width: 54, height: 54, borderRadius: 27, background: "#121212", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: "#f7f3ea", color: "#111", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>8</div>
          </div>
          {`Snook Legend · ${t.kicker}`}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div
            style={{
              width: 196,
              height: 196,
              borderRadius: 98,
              padding: 8,
              display: "flex",
              background: p.vip ? "linear-gradient(145deg, #f5e1aa, #b07d1f)" : "linear-gradient(145deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))",
            }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- drawn into a picture, not a page
              <img src={avatar} width={180} height={180} style={{ borderRadius: 90 }} />
            ) : (
              <div style={{ width: 180, height: 180, borderRadius: 90, background: "#0d1210", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 96, color: "#efcf82" }}>
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <div style={{ fontSize: name.length > 14 ? 76 : 96, fontWeight: 800, lineHeight: 1, letterSpacing: -2, color: p.role === "admin" ? ADMIN_RED : tier.color }}>{name}</div>
            {country && <div style={{ fontSize: 34, color: "#cfe9d9" }}>{country}</div>}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {main.games > 0 ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
              <div style={{ fontSize: 88, fontWeight: 800, color: "#f5e1aa", lineHeight: 1 }}>{String(main.rating)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 34, fontWeight: 700, color: tier.color }}>{d.ranking.tiers[main.tier]}</div>
                <div style={{ fontSize: 26, color: "#cfe9d9" }}>{main.rules === "brazilian" ? d.common.brazilian : d.common.official}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
          <div style={{ display: "flex", fontSize: 30, color: "#f5e1aa" }}>{facts.join("  ·  ")}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, headers: CARD_CACHE },
  );
}
