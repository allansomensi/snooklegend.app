"use client";

import { useId, useMemo, useState } from "react";
import { fmt, type Dict } from "@/i18n";
import { ELO, kFactor, opponentsAround, stakes } from "@/lib/rating";
import { tierOf } from "@/lib/ranking";

type T = Dict["calc"];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

/**
 * The calculator: your rating and rated games, an opponent, and what a win
 * and a loss are worth against them and against everyone around you.
 */
export function RatingCalculator({ t, tiers, lang }: { t: T; tiers: Dict["ranking"]["tiers"]; lang: string }) {
  const [ratingText, setRatingText] = useState("1500");
  const [gamesText, setGamesText] = useState("30");
  const [oppText, setOppText] = useState("1600");
  const ids = { rating: useId(), games: useId(), opp: useId(), slider: useId() };

  const num = (s: string, fallback: number) => (Number.isFinite(Number.parseInt(s, 10)) ? Number.parseInt(s, 10) : fallback);
  const rating = clamp(num(ratingText, 1200), ELO.floor, 3000);
  const games = clamp(num(gamesText, 0), 0, 100000);
  const opponent = clamp(num(oppText, rating), ELO.floor, 3000);
  const me = { rating, games };
  const k = kFactor(me);
  const why = games < ELO.provisionalGames ? fmt(t.kWhy.provisional, { n: ELO.provisionalGames }) : rating >= ELO.eliteThreshold ? fmt(t.kWhy.elite, { n: ELO.eliteThreshold }) : t.kWhy.standard;
  const pick = stakes(me, opponent);
  const pctFmt = useMemo(() => new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 0 }), [lang]);

  const chart = opponentsAround(rating, 600, 50);
  const table = opponentsAround(rating, 500, 100);
  const rows = chart.map((r) => ({ r, ...stakes(me, r) }));
  const max = Math.max(ELO.kProvisional, ...rows.map((x) => Math.max(x.win, -x.loss)));

  const input = "w-full rounded-xl bg-ink-950/70 px-4 py-3 font-display text-2xl font-bold tabular-nums text-cream ring-1 ring-white/[0.1] outline-none transition focus:ring-2 focus:ring-gold-400/70";

  return (
    <div className="space-y-10">
      <div className="card noise grid gap-6 p-6 ring-1 ring-white/[0.05] sm:p-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <div>
            <label htmlFor={ids.rating} className="text-[13px] font-semibold text-mist">
              {t.yourRating}
            </label>
            <input id={ids.rating} type="number" inputMode="numeric" min={ELO.floor} max={3000} step={1} value={ratingText} onChange={(e) => setRatingText(e.target.value)} className={`${input} mt-1.5`} style={{ color: tierOf(rating).color }} />
            <input
              id={ids.slider}
              type="range"
              min={ELO.floor}
              max={2600}
              step={10}
              value={rating}
              onChange={(e) => setRatingText(e.target.value)}
              aria-label={t.yourRating}
              className="mt-3 w-full accent-[var(--color-gold-400)]"
            />
            <p className="mt-1 text-[13px]" style={{ color: tierOf(rating).color }}>
              {tiers[tierOf(rating).key]}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={ids.games} className="text-[13px] font-semibold text-mist">
                {t.yourGames}
              </label>
              <input id={ids.games} type="number" inputMode="numeric" min={0} step={1} value={gamesText} onChange={(e) => setGamesText(e.target.value)} className={`${input} mt-1.5`} />
            </div>
            <div>
              <label htmlFor={ids.opp} className="text-[13px] font-semibold text-mist">
                {t.opponent}
              </label>
              <input id={ids.opp} type="number" inputMode="numeric" min={ELO.floor} max={3000} step={1} value={oppText} onChange={(e) => setOppText(e.target.value)} className={`${input} mt-1.5`} style={{ color: tierOf(opponent).color }} />
            </div>
          </div>
          <p className="text-[13.5px] text-mist">
            {fmt(t.kFactor, { k })} <span className="text-fog">({why})</span>
          </p>
        </div>

        {/* The match chosen. */}
        <div className="flex flex-col justify-center rounded-2xl bg-ink-950/50 p-6 ring-1 ring-white/[0.06]" aria-live="polite">
          <p className="text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-fog">{fmt(t.against, { rating: opponent })}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-felt-500/10 px-3 py-5 ring-1 ring-felt-400/25">
              <p className="text-[13px] text-felt-300">{t.ifWin}</p>
              <p className="mt-1 font-display text-5xl font-extrabold tabular-nums text-felt-300">{signed(pick.win)}</p>
            </div>
            <div className="rounded-2xl bg-[#e2685a]/10 px-3 py-5 ring-1 ring-[#e2685a]/25">
              <p className="text-[13px] text-[#f19a90]">{t.ifLose}</p>
              <p className="mt-1 font-display text-5xl font-extrabold tabular-nums text-[#f19a90]">{signed(pick.loss)}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-[13px]">
              <span className="text-mist">{t.chance}</span>
              <span className="font-semibold tabular-nums text-cream">{pctFmt.format(pick.chance)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e2685a]/30" aria-hidden>
              <div className="h-full rounded-full bg-felt-400" style={{ width: `${pick.chance * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* The chart: a bar up for a win, a bar down for a loss, per opponent. */}
      <section aria-labelledby="chart-title">
        <h2 id="chart-title" className="font-display text-2xl font-bold tracking-tight text-cream">
          {t.chartTitle}
        </h2>
        <div className="mt-5 rounded-2xl bg-ink-900/80 p-4 ring-1 ring-white/[0.07] sm:p-6">
          <svg viewBox="0 0 500 220" className="h-auto w-full" role="img" aria-label={fmt(t.chartLabel, { from: chart[0], to: chart.at(-1)! })}>
            <line x1="0" x2="500" y1="110" y2="110" stroke="rgb(255 255 255 / 0.15)" />
            {rows.map((x, i) => {
              const w = 500 / rows.length;
              const cx = i * w + w / 2;
              const up = (x.win / max) * 90;
              const down = (-x.loss / max) * 90;
              const here = x.r === Math.round(opponent / 50) * 50;
              const same = x.r === Math.round(rating / 50) * 50;
              return (
                <g key={x.r}>
                  {here && <rect x={i * w + 1} y="8" width={w - 2} height="204" rx="3" fill="rgb(232 188 94 / 0.1)" />}
                  <rect x={cx - w * 0.32} y={110 - up} width={w * 0.64} height={Math.max(up, 0.5)} rx="1.5" fill="#3fc076" opacity={here ? 1 : 0.75} />
                  <rect x={cx - w * 0.32} y={110} width={w * 0.64} height={Math.max(down, 0.5)} rx="1.5" fill="#e2685a" opacity={here ? 1 : 0.7} />
                  {(i % 4 === 0 || same) && (
                    <text x={cx} y="216" textAnchor="middle" fontSize="9" fill={same ? "#efcf82" : "#74867b"}>
                      {same ? t.you : x.r}
                    </text>
                  )}
                  {here && (
                    <>
                      <text x={cx} y={104 - up} textAnchor="middle" fontSize="10" fontWeight="700" fill="#6fd99a">
                        {signed(x.win)}
                      </text>
                      <text x={cx} y={124 + down} textAnchor="middle" fontSize="10" fontWeight="700" fill="#f19a90">
                        {signed(x.loss)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* The table: every 100 points around you. */}
      <section aria-labelledby="table-title">
        <h2 id="table-title" className="font-display text-2xl font-bold tracking-tight text-cream">
          {t.tableTitle}
        </h2>
        <div className="mt-5 overflow-hidden rounded-2xl bg-ink-900/80 ring-1 ring-white/[0.07]">
          <table className="w-full border-collapse text-left text-[15px]">
            <caption className="sr-only">{t.tableCaption}</caption>
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-[0.12em] text-fog">
                <th scope="col" className="px-4 py-3">
                  {t.opponentCol}
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  {t.chance}
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  {t.ifWin}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t.ifLose}
                </th>
              </tr>
            </thead>
            <tbody>
              {table.map((r) => {
                const s = stakes(me, r);
                const tier = tierOf(r);
                const same = r === Math.round(rating / 100) * 100;
                return (
                  <tr key={r} className={`border-b border-white/[0.04] last:border-0 ${same ? "bg-gold-400/[0.06]" : ""}`}>
                    <th scope="row" className="px-4 py-2.5 font-normal">
                      <span className="font-display font-bold tabular-nums" style={{ color: tier.color }}>
                        {r}
                      </span>{" "}
                      <span className="hidden text-[13px] text-fog sm:inline">{tiers[tier.key]}</span>
                    </th>
                    <td className="px-3 py-2.5 text-right tabular-nums text-mist">{pctFmt.format(s.chance)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-felt-300">{signed(s.win)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-[#f19a90]">{signed(s.loss)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
