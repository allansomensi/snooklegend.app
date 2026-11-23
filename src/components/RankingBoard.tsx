"use client";

import { Crown, Globe, RefreshCw, Search, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fmt, LOCALE_INFO, type Dict, type Locale } from "@/i18n";
import {
  ADMIN_RED,
  leaderboardUrl,
  parseRanking,
  RULES,
  tierOf,
  winRate,
  type RankingEntry,
  type Rules,
} from "@/lib/ranking";
import { Flag } from "./Flag";

type T = Dict["ranking"];

type Board = { entries: RankingEntry[]; at: number };

/** How often the ranking is read again while the page is open. */
const REFRESH_MS = 60_000;
/** After this long, a first load says the server may be waking up. */
const WAKING_MS = 5_000;

/** The rules a link names (`#official`), the Brazilian ones otherwise. */
function rulesFromHash(): Rules {
  if (typeof window === "undefined") return "brazilian";
  return window.location.hash === "#official" ? "official" : "brazilian";
}

/** The ranking under `which` from the game server, or `null` if it failed. */
async function fetchRanking(which: Rules): Promise<RankingEntry[] | null> {
  try {
    const res = await fetch(leaderboardUrl(which), { signal: AbortSignal.timeout(70_000) });
    if (!res.ok) return null;
    return parseRanking(await res.json());
  } catch {
    return null;
  }
}

export function RankingBoard({ t, locale }: { t: T; locale: Locale }) {
  const [rules, setRules] = useState<Rules>("brazilian");
  const [boards, setBoards] = useState<Partial<Record<Rules, Board>>>({});
  // The rules whose last load failed (and nothing to show for them).
  const [failed, setFailed] = useState<Partial<Record<Rules, boolean>>>({});
  const [slow, setSlow] = useState(false);
  const [query, setQuery] = useState("");

  // The rules in the address (shared links open on them).
  useEffect(() => {
    const sync = () => setRules(rulesFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  /** What a load brought: the ranking, or `null` when it failed. */
  const apply = useCallback((which: Rules, entries: RankingEntry[] | null) => {
    if (entries) {
      setBoards((b) => ({ ...b, [which]: { entries, at: Date.now() } }));
    }
    setFailed((f) => ({ ...f, [which]: entries === null }));
    setSlow(false);
  }, []);

  const load = useCallback((which: Rules) => fetchRanking(which).then((e) => apply(which, e)), [apply]);

  const board = boards[rules];
  const loaded = board !== undefined;
  const status = loaded ? "ready" : failed[rules] ? "error" : "loading";

  // The rules shown: loaded when first chosen, then again every minute while
  // the page is in view.
  useEffect(() => {
    let alive = true;
    if (!loaded) {
      fetchRanking(rules).then((e) => {
        if (alive) apply(rules, e);
      });
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(rules);
    }, REFRESH_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [rules, loaded, load, apply]);

  // A first load that takes a while: the free server is waking up.
  useEffect(() => {
    if (status !== "loading") return;
    const timer = window.setTimeout(() => setSlow(true), WAKING_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  const retry = () => {
    setFailed((f) => ({ ...f, [rules]: false }));
    void load(rules);
  };

  const choose = (r: Rules) => {
    setRules(r);
    setQuery("");
    setSlow(false);
    const url = r === "official" ? "#official" : window.location.pathname;
    window.history.replaceState(null, "", url);
  };

  const entries = useMemo(() => board?.entries ?? [], [board]);
  const q = query.trim().toLowerCase();
  const filtered = q ? entries.filter((e) => e.username.toLowerCase().includes(q)) : entries;
  // The podium for the top three; the table goes on from the fourth (all
  // the matches while searching).
  const podium = q ? [] : entries.slice(0, 3);
  const rest = q ? filtered : entries.slice(3);
  const htmlLang = LOCALE_INFO[locale].htmlLang;
  const time = board ? new Intl.DateTimeFormat(htmlLang, { timeStyle: "short" }).format(board.at) : "";

  return (
    <div>
      {/* The rules, as in the game's own switch. */}
      <div className="flex flex-col items-center gap-4">
        <div
          role="tablist"
          aria-label={`${t.brazilian} / ${t.official}`}
          className="inline-flex rounded-full bg-ink-850/90 p-1.5 ring-1 ring-white/[0.08] shadow-[0_10px_30px_-12px_rgb(0_0_0/0.8)]"
        >
          {RULES.map((r) => {
            const on = r === rules;
            return (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => choose(r)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2.5 text-[13.5px] font-semibold transition sm:gap-2.5 sm:px-6 sm:text-[15px] ${
                  on
                    ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-950 shadow-[0_6px_18px_-6px_rgb(232_188_94/0.7)]"
                    : "text-cream/70 hover:bg-white/[0.05] hover:text-cream"
                }`}
              >
                {r === "brazilian" ? (
                  <Flag code="BR" height={14} />
                ) : (
                  <Globe className={`size-[18px] ${on ? "text-ink-950" : "text-sky-300"}`} />
                )}
                {r === "brazilian" ? (
                  t.brazilian
                ) : (
                  <>
                    {/* "(WPA)" only where there is room for it. */}
                    <span className="sm:hidden">{t.official.replace(/\s*\(WPA\)/, "")}</span>
                    <span className="hidden sm:inline">{t.official}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-12 sm:mt-16">
        {status === "error" ? (
          <Message>
            <p className="text-cream">{t.error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-5 py-2.5 text-sm font-semibold text-cream ring-1 ring-white/10 transition hover:bg-white/[0.12]"
            >
              <RefreshCw className="size-4" /> {t.retry}
            </button>
          </Message>
        ) : !board ? (
          <Loading t={t} slow={slow} />
        ) : entries.length === 0 ? (
          <Message>
            <Trophy className="mx-auto mb-4 size-10 text-gold/60" />
            <p className="text-cream">{t.empty}</p>
          </Message>
        ) : (
          <>
            {podium.length > 0 && <Podium entries={podium} t={t} />}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block w-full sm:max-w-xs">
                <span className="sr-only">{t.search}</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fog" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.search}
                  className="w-full rounded-full bg-ink-850/80 py-2.5 pl-11 pr-4 text-[15px] text-cream placeholder:text-fog ring-1 ring-white/[0.08] outline-none transition focus:ring-gold-400/60"
                />
              </label>
              <p className="flex items-center gap-2 text-[13px] text-fog">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-felt-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-felt-400" />
                </span>
                {fmt(t.updated, { time })}
              </p>
            </div>
            {rest.length > 0 ? (
              <Table entries={rest} t={t} />
            ) : (
              q && (
                <Message>
                  <p className="text-cream">{fmt(t.noMatch, { q: query.trim() })}</p>
                </Message>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-4 max-w-lg rounded-3xl bg-ink-850/70 px-8 py-12 text-center ring-1 ring-white/[0.07]">
      {children}
    </div>
  );
}

function Loading({ t, slow }: { t: T; slow: boolean }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">{t.loading}</p>
      <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
        {[0, 1, 2].map((k) => (
          <div
            key={k}
            className={`animate-pulse rounded-3xl bg-white/[0.04] ring-1 ring-white/[0.05] ${
              k === 1 ? "h-64 sm:order-first sm:h-56" : k === 0 ? "h-56 sm:order-none sm:h-64" : "h-56 sm:h-48"
            }`}
          />
        ))}
      </div>
      <div className="mt-10 space-y-2">
        {Array.from({ length: 6 }, (_, k) => (
          <div key={k} className="h-14 animate-pulse rounded-2xl bg-white/[0.035]" style={{ animationDelay: `${k * 80}ms` }} />
        ))}
      </div>
      {slow && <p className="mt-6 text-center text-sm text-mist">{t.waking}</p>}
    </div>
  );
}

/** A name in its league's colour (red for the staff), with a crown for VIP. */
function Name({ e, t, className = "" }: { e: RankingEntry; t: T; className?: string }) {
  const color = e.admin ? ADMIN_RED : tierOf(e.rating).color;
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <Flag code={e.country} height={14} />
      <span className="truncate font-semibold" style={{ color }} title={e.username}>
        {e.username}
      </span>
      {e.vip && <Crown className="size-4 shrink-0 text-gold-400" aria-label={t.vip} />}
      {e.admin && (
        <span className="shrink-0 rounded-full bg-[#ff5245]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ff8a80]">
          {t.staff}
        </span>
      )}
    </span>
  );
}

function League({ rating, t }: { rating: number; t: T }) {
  const tier = tierOf(rating);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ color: tier.color, backgroundColor: `${tier.color}1a`, boxShadow: `inset 0 0 0 1px ${tier.color}40` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: tier.color }} />
      {t.tiers[tier.key]}
    </span>
  );
}

const MEDALS = [
  { ring: "from-gold-200 via-gold-400 to-gold-600", glow: "rgb(232 188 94 / 0.35)", text: "text-ink-950" },
  { ring: "from-slate-100 via-slate-300 to-slate-500", glow: "rgb(203 213 225 / 0.22)", text: "text-ink-950" },
  { ring: "from-orange-200 via-orange-400 to-amber-700", glow: "rgb(251 146 60 / 0.22)", text: "text-ink-950" },
];

/** The top three, the first in the middle and highest. */
function Podium({ entries, t }: { entries: RankingEntry[]; t: T }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-3 sm:items-end">
      {entries.map((e, i) => {
        const m = MEDALS[i];
        const first = i === 0;
        return (
          <li
            key={e.username}
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-ink-800 to-ink-900 px-6 text-center ring-1 ring-white/[0.08] ${
              first ? "pb-7 pt-7 sm:order-2 sm:pb-12 sm:pt-12" : i === 1 ? "pb-6 pt-6 sm:order-1 sm:pb-8 sm:pt-9" : "pb-6 pt-6 sm:order-3 sm:pb-8 sm:pt-9"
            }`}
            style={{ boxShadow: `0 30px 60px -30px ${m.glow}, inset 0 1px 0 rgb(255 255 255 / 0.05)` }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-24 mx-auto size-56 rounded-full blur-3xl"
              style={{ background: m.glow }}
            />
            <div className="relative">
              <div
                className={`mx-auto grid place-items-center rounded-full bg-gradient-to-br ${m.ring} ${
                  first ? "size-13 sm:size-16" : "size-11 sm:size-13"
                } shadow-[0_8px_24px_-8px_rgb(0_0_0/0.8)]`}
              >
                {first ? (
                  <Crown className={`size-7 ${m.text}`} />
                ) : (
                  <span className={`font-display text-xl font-extrabold ${m.text}`}>{e.rank}</span>
                )}
              </div>
              {first && <p className="mt-3 font-display text-sm font-bold tracking-widest text-gold-300">#1</p>}
              <div className={`${first ? "mt-2" : "mt-4"} flex justify-center`}>
                <Name e={e} t={t} className="max-w-full text-lg" />
              </div>
              <p
                className={`mt-2 font-display font-extrabold tracking-tight text-cream sm:mt-3 ${first ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}
              >
                {e.rating}
              </p>
              <div className="mt-3 flex justify-center">
                <League rating={e.rating} t={t} />
              </div>
              <p className="mt-4 text-[13px] text-mist">
                {fmt(t.record, { wins: e.wins, games: e.games })} · {winRate(e)}%
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Table({ entries, t }: { entries: RankingEntry[]; t: T }) {
  return (
    <div className="mt-4 overflow-hidden rounded-3xl bg-ink-900/80 ring-1 ring-white/[0.07]">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-[0.14em] text-fog">
            <th scope="col" className="w-14 py-4 pl-5 pr-2 text-right sm:w-20 sm:pl-6">
              #
            </th>
            <th scope="col" className="px-3 py-4">
              {t.player}
            </th>
            <th scope="col" className="hidden px-3 py-4 md:table-cell">
              {t.league}
            </th>
            <th scope="col" className="px-3 py-4 text-right">
              {t.rating}
            </th>
            <th scope="col" className="hidden px-3 py-4 text-right sm:table-cell">
              {t.games}
            </th>
            <th scope="col" className="hidden py-4 pl-3 pr-6 text-right lg:table-cell">
              {t.winRate}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const rate = winRate(e);
            return (
              <tr
                key={e.username}
                className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03]"
              >
                <td className="py-3.5 pl-5 pr-2 text-right font-display text-[15px] font-bold tabular-nums text-fog sm:pl-6">
                  {e.rank}
                </td>
                <td className="max-w-0 px-3 py-3.5">
                  <Name e={e} t={t} className="max-w-full text-[15px]" />
                  <span className="mt-1 block md:hidden">
                    <League rating={e.rating} t={t} />
                  </span>
                </td>
                <td className="hidden px-3 py-3.5 md:table-cell">
                  <League rating={e.rating} t={t} />
                </td>
                <td className="px-3 py-3.5 text-right font-display text-lg font-extrabold tabular-nums text-cream">
                  {e.rating}
                </td>
                <td className="hidden px-3 py-3.5 text-right tabular-nums text-mist sm:table-cell">
                  {e.games}
                </td>
                <td className="hidden py-3.5 pl-3 pr-6 lg:table-cell">
                  <div className="flex items-center justify-end gap-3">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.07]">
                      <div className="h-full rounded-full bg-felt-400" style={{ width: `${rate}%` }} />
                    </div>
                    <span className="w-10 text-right tabular-nums text-mist">{rate}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
