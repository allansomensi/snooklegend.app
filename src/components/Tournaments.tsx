import { CalendarDays, Coins, Crown, Flame, Globe, Swords, Ticket, Trophy, Users } from "lucide-react";
import { fmt, getDict, type Dict, type Locale } from "@/i18n";
import { formatDateTime, formatNumber, isoDate } from "@/lib/format";
import { cueName, frameOf } from "@/lib/player";
import { pagePath, pathsOf, playerPath, tournamentPath } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";
import {
  ARENA_POINTS,
  fullBracket,
  reached,
  roundKind,
  type Match,
  type Tournament,
  type TournamentSummary,
} from "@/lib/tournaments";
import { CopyLink } from "./CopyLink";
import { Flag } from "./Flag";
import { Breadcrumbs, DownloadCta, JsonLd, PageHeader, SiteFrame } from "./SiteFrame";

type T = Dict["tournaments"];

// ── The list ────────────────────────────────────────────────────────────────

/** The official tournaments: being played, coming up and finished. `list` null: the server didn't answer (while building). */
export async function TournamentsPage({ locale, list }: { locale: Locale; list: TournamentSummary[] | null }) {
  const d = getDict(locale);
  const t = d.tournaments;
  const live = list?.filter((x) => x.state === "running") ?? [];
  const upcoming = (list?.filter((x) => x.state === "registering") ?? []).sort((a, b) => (a.startsAt ?? 0) - (b.startsAt ?? 0));
  const past = list?.filter((x) => x.state !== "running" && x.state !== "registering") ?? [];
  const groups = [
    { id: "live", title: t.live, items: live },
    { id: "upcoming", title: t.upcoming, items: upcoming },
    { id: "past", title: t.past, items: past },
  ].filter((g) => g.items.length > 0);

  const jsonLd = list?.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: t.title,
        itemListElement: list.slice(0, 30).map((x, i) => ({ "@type": "ListItem", position: i + 1, url: SITE_URL + tournamentPath(locale, x.id), name: x.name })),
      }
    : null;

  return (
    <SiteFrame locale={locale} paths={pathsOf((l) => pagePath(l, "tournaments"))}>
      {jsonLd && <JsonLd data={jsonLd} />}
      <Breadcrumbs locale={locale} items={[{ name: t.title, path: pagePath(locale, "tournaments") }]} />
      <div className="container-page mt-8">
        <PageHeader kicker={t.kicker} title={t.heading} sub={t.sub} />
        <div className="mx-auto mt-14 max-w-5xl space-y-14">
          {list === null ? (
            <Note>{t.unavailable}</Note>
          ) : groups.length === 0 ? (
            <Note>{t.empty}</Note>
          ) : (
            groups.map((g) => (
              <section key={g.id} aria-labelledby={`t-${g.id}`}>
                <h2 id={`t-${g.id}`} className="flex items-center gap-3 font-display text-2xl font-bold tracking-tight text-cream">
                  {g.id === "live" && (
                    <span className="relative flex size-2.5" aria-hidden>
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-felt-400 opacity-60" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-felt-400" />
                    </span>
                  )}
                  {g.title}
                </h2>
                <ul className="mt-5 grid gap-4 md:grid-cols-2">
                  {g.items.map((x) => (
                    <li key={x.id}>
                      <TournamentCard x={x} d={d} locale={locale} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
      <DownloadCta locale={locale} text={t.cta} />
    </SiteFrame>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mx-auto max-w-lg rounded-3xl bg-ink-850/70 px-8 py-12 text-center text-cream ring-1 ring-white/[0.07]">{children}</p>;
}

function TournamentCard({ x, d, locale }: { x: TournamentSummary; d: Dict; locale: Locale }) {
  const t = d.tournaments;
  const when = x.state === "registering" ? (x.startsAt ? fmt(t.starts, { date: formatDateTime(locale, x.startsAt) }) : null) : x.startsAt ? formatDateTime(locale, x.startsAt) : null;
  return (
    <a
      href={tournamentPath(locale, x.id)}
      className="group card noise flex h-full flex-col gap-4 p-6 ring-1 ring-white/[0.05] transition hover:-translate-y-0.5 hover:ring-gold-400/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold tracking-tight text-cream transition group-hover:text-gold-200">{x.name}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-mist">
            <RulesMark rules={x.rules} />
            {x.rules === "brazilian" ? d.common.brazilian : d.common.official} · {t.formats[x.format]}
          </p>
        </div>
        <StateBadge state={x.state} t={t} />
      </div>
      {x.champion && (
        <p className="flex items-center gap-2 text-[15px] text-cream">
          <Crown className="size-4 text-gold-300" aria-hidden />
          <span className="text-mist">{t.champion}:</span> <span className="font-semibold text-gold-200">{x.champion}</span>
        </p>
      )}
      <dl className="mt-auto flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-mist">
        <Fact icon={<Users className="size-3.5" aria-hidden />} label={t.entrants}>
          {x.state === "registering" && x.format === "knockout" ? fmt(t.places, { n: x.players, size: x.size }) : fmt(t.players, { n: x.players })}
        </Fact>
        {x.prizePool > 0 && (
          <Fact icon={<Coins className="size-3.5" aria-hidden />} label={t.prizePool}>
            {fmt(d.common.coins, { n: formatNumber(locale, x.prizePool) })}
          </Fact>
        )}
        {when && (
          <Fact icon={<CalendarDays className="size-3.5" aria-hidden />} label={t.played}>
            {when}
          </Fact>
        )}
      </dl>
    </a>
  );
}

function Fact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <dt className="text-gold-300/80">
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function RulesMark({ rules }: { rules: string }) {
  return rules === "brazilian" ? <Flag code="BR" height={11} /> : <Globe className="size-3.5 text-sky-300" aria-hidden />;
}

function StateBadge({ state, t }: { state: string; t: T }) {
  const tone =
    state === "running"
      ? "bg-felt-500/15 text-felt-300 ring-felt-400/30"
      : state === "registering"
        ? "bg-sky-400/10 text-sky-200 ring-sky-300/30"
        : "bg-white/[0.05] text-mist ring-white/10";
  return (
    <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${tone}`}>
      {t.states[state] ?? state}
    </span>
  );
}

// ── One tournament ──────────────────────────────────────────────────────────

export async function TournamentPage({ locale, x }: { locale: Locale; x: Tournament }) {
  const d = getDict(locale);
  const t = d.tournaments;
  const path = tournamentPath(locale, x.id);
  const countries = new Map(x.entrants.map((e) => [e.username, e.country]));
  const rulesName = x.rules === "brazilian" ? d.common.brazilian : d.common.official;
  const finished = x.state === "finished";
  const item = x.itemPrize ? (frameOf(x.itemPrize)?.name[locale] ?? cueName(x.itemPrize, locale)) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: x.name,
    url: SITE_URL + path,
    description: describe(x, d),
    sport: "Eight-ball pool",
    ...(x.startsAt ? { startDate: isoDate(x.startsAt) } : {}),
    ...(x.endsAt ? { endDate: isoDate(x.endsAt) } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: { "@type": "VirtualLocation", url: SITE_URL + path },
    organizer: { "@type": "Organization", name: "Snook Legend", url: SITE_URL },
    ...(x.entrants.length
      ? { competitor: x.entrants.slice(0, 64).map((e) => ({ "@type": "Person", name: e.username, url: SITE_URL + playerPath(locale, e.username) })) }
      : {}),
    ...(x.entryFee > 0 ? { offers: { "@type": "Offer", price: 0, priceCurrency: "USD", description: fmt(t.entryText, { n: x.entryFee }) } } : {}),
  };

  return (
    <SiteFrame locale={locale} paths={pathsOf((l) => tournamentPath(l, x.id))}>
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        locale={locale}
        items={[
          { name: t.title, path: pagePath(locale, "tournaments") },
          { name: x.name, path },
        ]}
      />
      <div className="container-page mt-8">
        <header className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="kicker">{t.formats[x.format]}</p>
            <StateBadge state={x.state} t={t} />
          </div>
          <h1 className="mt-4 text-balance font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-cream sm:text-6xl">{x.name}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-mist">
            <RulesMark rules={x.rules} /> {rulesName}
            {x.startsAt && <> · {formatDateTime(locale, x.startsAt)}</>}
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Box icon={<Users className="size-4" aria-hidden />} label={t.entrants} value={x.format === "knockout" && x.size ? fmt(t.places, { n: x.players, size: x.size }) : String(x.players)} />
            <Box icon={<Coins className="size-4" aria-hidden />} label={t.prizePool} value={x.prizePool ? fmt(d.common.coins, { n: formatNumber(locale, x.prizePool) }) : "–"} />
            <Box icon={<Ticket className="size-4" aria-hidden />} label={t.entry} value={x.entryFee ? fmt(d.common.coins, { n: formatNumber(locale, x.entryFee) }) : t.free} />
            <Box icon={<Swords className="size-4" aria-hidden />} label={x.rated ? t.rated : t.casual} value={rulesName} />
          </dl>
          <div className="mt-6">
            <CopyLink url={SITE_URL + path} label={d.common.copyLink} done={d.common.copied} title={x.name} />
          </div>
        </header>

        {(x.champion || (finished && x.runnerUp)) && (
          <section aria-label={t.champion} className="mx-auto mt-10 max-w-5xl">
            <div className="vip-frame relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
              <div aria-hidden className="vip-backdrop" />
              <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                <span className="grid size-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-gold-200 to-gold-600 text-ink-950 shadow-[0_16px_40px_-12px_rgb(232_188_94/0.8)]">
                  <Trophy className="size-10" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-300">{t.champion}</p>
                  {x.champion && (
                    <p className="mt-1 flex items-center justify-center gap-3 sm:justify-start">
                      <Flag code={countries.get(x.champion)} height={18} />
                      <a href={playerPath(locale, x.champion)} className="font-display text-4xl font-extrabold tracking-tight text-gold hover:underline">
                        {x.champion}
                      </a>
                    </p>
                  )}
                  {x.runnerUp && (
                    <p className="mt-2 text-[15px] text-mist">
                      {t.runnerUp}:{" "}
                      <a href={playerPath(locale, x.runnerUp)} className="font-semibold text-cream hover:text-gold-200">
                        {x.runnerUp}
                      </a>
                    </p>
                  )}
                </div>
                {x.prizes[0] > 0 && (
                  <p className="font-display text-2xl font-bold text-gold-200">+{fmt(d.common.coins, { n: formatNumber(locale, x.prizes[0]) })}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {x.format === "knockout" ? (
          <section aria-labelledby="bracket" className="mt-14">
            <h2 id="bracket" className="mx-auto max-w-5xl font-display text-2xl font-bold tracking-tight text-cream">
              {t.bracket}
            </h2>
            {x.rounds.length === 0 && x.entrants.length === 0 ? (
              <p className="mx-auto mt-5 max-w-5xl text-mist">{t.noEntrants}</p>
            ) : (
              <Bracket x={x} t={t} locale={locale} countries={countries} />
            )}
          </section>
        ) : (
          <section aria-labelledby="standings" className="mx-auto mt-14 max-w-5xl">
            <h2 id="standings" className="font-display text-2xl font-bold tracking-tight text-cream">
              {t.standings}
            </h2>
            <Standings x={x} t={t} locale={locale} countries={countries} />
          </section>
        )}

        <div className="mx-auto mt-14 grid max-w-5xl gap-10 lg:grid-cols-2">
          {x.format === "knockout" && finished && x.rounds.length > 0 && <Placings x={x} t={t} locale={locale} countries={countries} />}
          <section aria-labelledby="how">
            <h2 id="how" className="font-display text-2xl font-bold tracking-tight text-cream">
              {t.rules}
            </h2>
            <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-cream/85">
              <li>{x.format === "knockout" ? t.knockoutText : t.arenaText}</li>
              <li>
                {fmt(t.rulesText, { rules: d.common.rulesOf[x.rules] })}{" "}
                <a href={pagePath(locale, "rules")} className="font-semibold text-gold-300 hover:text-gold-200">
                  {d.guide.shortTitle} →
                </a>
              </li>
              <li>{x.rated ? t.ratedText : t.casualText}</li>
              <li>{x.entryFee ? fmt(t.entryText, { n: formatNumber(locale, x.entryFee) }) : t.freeText}</li>
            </ul>
            {(x.prizes.length > 0 || item) && (
              <>
                <h3 className="mt-8 font-display text-lg font-bold text-cream">{t.prizes}</h3>
                <ol className="mt-3 space-y-2">
                  {x.prizes.map((p, i) => (
                    <li key={i} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-2.5 text-[15px] ring-1 ring-white/[0.06]">
                      <span className="text-mist">{t.prizePlace[i] ?? `${i + 1}.`}</span>
                      <span className="font-semibold tabular-nums text-gold-200">{fmt(d.common.coins, { n: formatNumber(locale, p) })}</span>
                    </li>
                  ))}
                </ol>
                {item && <p className="mt-3 text-[14px] text-mist">{fmt(t.itemPrize, { item })}</p>}
              </>
            )}
          </section>
          {x.format === "arena" || !finished ? (
            <Entrants x={x} t={t} locale={locale} />
          ) : null}
        </div>

        <p className="mx-auto mt-14 max-w-5xl text-center">
          <a href={pagePath(locale, "tournaments")} className="font-semibold text-gold-300 transition hover:text-gold-200">
            ← {t.allTournaments}
          </a>
        </p>
      </div>
      <DownloadCta locale={locale} text={t.cta} />
    </SiteFrame>
  );
}

/** One line about a tournament (its page's description). */
export function describe(x: Tournament | TournamentSummary, d: Dict): string {
  const t = d.tournaments;
  return fmt(t.detailDescription, {
    name: x.name,
    format: t.formats[x.format].toLowerCase(),
    rules: d.common.rulesOf[x.rules],
    players: x.players ? fmt(t.detailPlayers, { n: x.players }) : "",
    champion: x.champion ? fmt(t.detailChampion, { name: x.champion }) : "",
  });
}

function Box({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] px-4 py-3.5 ring-1 ring-white/[0.06]">
      <dt className="flex items-center gap-2 text-[12px] font-medium text-fog">
        <span className="text-gold-300/80">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 truncate font-display text-lg font-bold text-cream">{value}</dd>
    </div>
  );
}

function roundTitle(t: T, index: number, total: number): string {
  const k = roundKind(index, total);
  return k.kind === "round" ? fmt(t.rounds.round, { n: k.of }) : t.rounds[k.kind];
}

/**
 * The bracket: a column per round, each match half-way between the two it
 * comes from, joined by lines. On a phone it scrolls sideways, a round at a
 * time.
 */
function Bracket({ x, t, locale, countries }: { x: Tournament; t: T; locale: Locale; countries: Map<string, string> }) {
  const rounds = fullBracket(x.rounds, x.size);
  const live = x.state === "running";
  return (
    <div className="mt-6 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:thin] [scroll-snap-type:x_mandatory]" role="region" aria-label={t.bracketLabel} tabIndex={0}>
      <div className="mx-auto flex w-max min-w-full justify-center gap-8 px-4 sm:px-6 lg:max-w-[76rem]">
        {rounds.map((round, r) => {
          const pairs: Match[][] = [];
          for (let i = 0; i < round.length; i += 2) pairs.push(round.slice(i, i + 2));
          const last = r === rounds.length - 1;
          return (
            <section key={r} className="flex w-[15.5rem] shrink-0 snap-start flex-col sm:w-[16.5rem]" aria-label={roundTitle(t, r, rounds.length)}>
              <h3 className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300/90">{roundTitle(t, r, rounds.length)}</h3>
              <ol className="flex flex-1 flex-col">
                {pairs.map((pair, p) => (
                  <li key={p} className="relative flex flex-1 flex-col">
                    {pair.map((m, i) => (
                      <div key={i} className="relative flex flex-1 items-center py-1.5">
                        {r > 0 && <span aria-hidden className="absolute -left-4 top-1/2 w-4 border-t border-white/15" />}
                        <MatchCard m={m} t={t} locale={locale} countries={countries} live={live} />
                      </div>
                    ))}
                    {!last && pair.length === 2 && (
                      <span aria-hidden className="absolute -right-4 bottom-1/4 top-1/4 w-4 rounded-r-lg border-y border-r border-white/15" />
                    )}
                    {!last && pair.length === 1 && <span aria-hidden className="absolute -right-4 top-1/2 w-4 border-t border-white/15" />}
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MatchCard({ m, t, locale, countries, live }: { m: Match; t: T; locale: Locale; countries: Map<string, string>; live: boolean }) {
  const playing = live && m.a && m.b && !m.winner;
  const scores = m.score.split(/[-–:]/).map((s) => s.trim());
  const bye = (m.a === null) !== (m.b === null) && m.winner !== null;
  return (
    <div className={`w-full overflow-hidden rounded-xl bg-ink-850 ring-1 ${playing ? "ring-felt-400/50 shadow-[0_0_24px_-8px_rgb(63_192_118/0.6)]" : "ring-white/[0.08]"}`}>
      {[m.a, m.b].map((name, i) => {
        const won = name !== null && m.winner === name;
        const lost = m.winner !== null && name !== null && !won;
        return (
          <div key={i} className={`flex h-9 items-center gap-2 px-3 text-[14px] ${i === 1 ? "border-t border-white/[0.06]" : ""} ${won ? "bg-gold-400/[0.08]" : ""}`}>
            {name ? (
              <>
                <Flag code={countries.get(name)} height={11} />
                <a
                  href={playerPath(locale, name)}
                  className={`min-w-0 flex-1 truncate hover:underline ${won ? "font-bold text-gold-100" : lost ? "text-fog line-through decoration-white/20" : "font-medium text-cream"}`}
                >
                  {name}
                </a>
                {scores.length === 2 && scores[i] !== "" && <span className="tabular-nums text-mist">{scores[i]}</span>}
                {won && <Crown className="size-3.5 shrink-0 text-gold-300" aria-label={t.winner} />}
              </>
            ) : (
              <span className="flex-1 truncate italic text-fog">{bye ? t.bye : t.tbd}</span>
            )}
            {playing && i === 0 && (
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-felt-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-felt-400" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Standings({ x, t, locale, countries }: { x: Tournament; t: T; locale: Locale; countries: Map<string, string> }) {
  if (x.standings.length === 0) return <p className="mt-5 text-mist">{t.standingsEmpty}</p>;
  return (
    <div className="mt-5 overflow-hidden rounded-3xl bg-ink-900/80 ring-1 ring-white/[0.07]">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-[0.14em] text-fog">
            <th scope="col" className="w-12 py-3.5 pl-5 pr-2 text-right">
              #
            </th>
            <th scope="col" className="px-3 py-3.5">
              {t.entrants}
            </th>
            <th scope="col" className="px-3 py-3.5 text-right">
              {t.points}
            </th>
            <th scope="col" className="hidden px-3 py-3.5 text-right sm:table-cell">
              {t.games}
            </th>
            <th scope="col" className="py-3.5 pl-3 pr-5 text-right">
              {t.streak}
            </th>
          </tr>
        </thead>
        <tbody>
          {x.standings.map((s, i) => (
            <tr key={s.username} className={`border-b border-white/[0.04] last:border-0 ${i === 0 ? "bg-gold-400/[0.06]" : ""}`}>
              <td className="py-3 pl-5 pr-2 text-right font-display font-bold tabular-nums text-fog">{i + 1}</td>
              <td className="max-w-0 px-3 py-3">
                <span className="flex min-w-0 items-center gap-2">
                  <Flag code={countries.get(s.username)} height={12} />
                  <a href={playerPath(locale, s.username)} className="truncate font-semibold text-cream hover:text-gold-200">
                    {s.username}
                  </a>
                  {i === 0 && <Crown className="size-4 shrink-0 text-gold-300" aria-hidden />}
                </span>
              </td>
              <td className="px-3 py-3 text-right font-display text-lg font-extrabold tabular-nums text-cream">{s.points}</td>
              <td className="hidden px-3 py-3 text-right tabular-nums text-mist sm:table-cell">{s.games}</td>
              <td className="py-3 pl-3 pr-5 text-right tabular-nums text-mist">
                {s.streak >= ARENA_POINTS.streakFrom - 1 && s.streak > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[#ffa138]" title={s.streak >= ARENA_POINTS.streakFrom ? t.onStreak : undefined}>
                    <Flame className="size-4" aria-hidden />
                    {s.streak}
                  </span>
                ) : (
                  s.streak
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A finished knockout's placings: the champion, the runner-up, then by the round each one reached. */
function Placings({ x, t, locale, countries }: { x: Tournament; t: T; locale: Locale; countries: Map<string, string> }) {
  const total = x.rounds.length;
  const far = [...reached(x.rounds).entries()].sort((a, b) => b[1] - a[1]);
  return (
    <section aria-labelledby="placings">
      <h2 id="placings" className="font-display text-2xl font-bold tracking-tight text-cream">
        {t.results}
      </h2>
      <ol className="mt-5 divide-y divide-white/[0.05] overflow-hidden rounded-2xl bg-white/[0.025] ring-1 ring-white/[0.06]">
        {far.map(([name, r], i) => {
          const label =
            r >= total ? t.champion : r === total - 1 ? t.runnerUp : (() => {
              const k = roundKind(r, total);
              return k.kind === "round" ? fmt(t.reachedRound.round, { n: k.of }) : t.reachedRound[k.kind];
            })();
          return (
            <li key={name} className="flex items-center gap-3 px-4 py-2.5 text-[14.5px]">
              <span className="w-6 text-right font-display font-bold tabular-nums text-fog">{i + 1}</span>
              <Flag code={countries.get(name)} height={12} />
              <a href={playerPath(locale, name)} className={`min-w-0 flex-1 truncate font-semibold hover:underline ${r >= total ? "text-gold-200" : "text-cream"}`}>
                {name}
              </a>
              <span className="shrink-0 text-[12.5px] text-mist">{label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Entrants({ x, t, locale }: { x: Tournament; t: T; locale: Locale }) {
  return (
    <section aria-labelledby="entrants">
      <h2 id="entrants" className="font-display text-2xl font-bold tracking-tight text-cream">
        {t.entrants}
      </h2>
      {x.entrants.length === 0 ? (
        <p className="mt-5 text-mist">{t.noEntrants}</p>
      ) : (
        <ul className="mt-5 flex flex-wrap gap-2">
          {[...x.entrants]
            .sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999))
            .map((e) => (
              <li key={e.username}>
                <a
                  href={playerPath(locale, e.username)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-[14px] text-cream ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]"
                  title={e.seed ? fmt(t.seed, { n: e.seed }) : undefined}
                >
                  <Flag code={e.country} height={11} />
                  {e.username}
                </a>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
