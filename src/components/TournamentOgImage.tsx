// A tournament's picture for social networks (1200×630): its name, the
// rules, the format and the champion or the state, on the felt.

import { ImageResponse } from "next/og";
import { fmt, getDict, type Locale } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { loadTournament } from "./TournamentRoute";

export const OG_SIZE = { width: 1200, height: 630 };

export async function tournamentOgImage(locale: Locale, raw: string) {
  const d = getDict(locale);
  const t = d.tournaments;
  const x = await loadTournament(raw).catch(() => null);
  const name = x?.name ?? t.title;
  const line = x
    ? [x.rules === "brazilian" ? d.common.brazilian : d.common.official, t.formats[x.format], fmt(t.players, { n: x.players })].join("  ·  ")
    : "Snook Legend";
  const big = x?.champion ? `${t.champion}: ${x.champion}` : x ? (t.states[x.state] ?? x.state) : "";
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
          {`Snook Legend · ${t.title}`}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: name.length > 28 ? 68 : 88, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>{name}</div>
          <div style={{ fontSize: 32, color: "#cfe9d9" }}>{line}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: "#f5e1aa" }}>{big}</div>
          {x && x.prizePool > 0 && (
            <div style={{ display: "flex", fontSize: 30, color: "#f5e1aa" }}>
              {`${t.prizePool}: ${fmt(d.common.coins, { n: formatNumber(locale, x.prizePool) })}`}
            </div>
          )}
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
