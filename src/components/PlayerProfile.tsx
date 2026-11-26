import { Crown, Flame, Globe, HeartHandshake, Shield, Trophy, Zap } from "lucide-react";
import { fmt, getDict, type Dict, type Locale } from "@/i18n";
import { countryName, formatDate, formatNumber, isoDate, signed } from "@/lib/format";
import {
  achievementText,
  avatarSrc,
  cueName,
  frameOf,
  mainRating,
  winRateOf,
  type Player,
  type PlayerRating,
  type RecentGame,
} from "@/lib/player";
import { ELO } from "@/lib/rating";
import { ADMIN_RED, rankingPath, tierOf, TIERS } from "@/lib/ranking";
import { pagePath, pathsOf, playerPath, tournamentPath } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";
import { WEBSITE_ID } from "@/lib/structured-data";
import { CopyLink } from "./CopyLink";
import { Flag } from "./Flag";
import { Avatar, CueArt, Medal } from "./GameArt";
import { Breadcrumbs, DownloadCta, JsonLd, SiteFrame } from "./SiteFrame";

type T = Dict["player"];

/** A player's public profile page. */
export async function PlayerProfile({ player: p, locale }: { player: Player; locale: Locale }) {
  const d = getDict(locale);
  const t = d.player;
  const main = mainRating(p);
  const nameColor = p.role === "admin" ? ADMIN_RED : tierColor(main);
  const country = countryName(locale, p.country);
  const frame = frameOf(p.frame);
  const url = SITE_URL + playerPath(locale, p.username);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    name: fmt(t.title, { name: p.username }),
    ...(p.createdAt ? { dateCreated: isoDate(p.createdAt) } : {}),
    inLanguage: locale === "pt" ? "pt-BR" : locale,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "Person",
      name: p.username,
      alternateName: p.username,
      identifier: p.username,
      url,
      ...(avatarSrc(p.avatar) ? { image: SITE_URL + avatarSrc(p.avatar) } : {}),
      ...(country ? { nationality: { "@type": "Country", name: country } } : {}),
      ...(p.trophies.length ? { award: p.trophies.map((tr) => tr.name).slice(0, 20) } : {}),
      // The games this player won (an action of theirs).
      agentInteractionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WinAction",
        userInteractionCount: p.career?.wins ?? p.ratings.reduce((n, r) => n + r.wins, 0),
      },
    },
  };

  return (
    <SiteFrame locale={locale} paths={pathsOf((l) => playerPath(l, p.username))}>
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        locale={locale}
        items={[
          { name: d.ranking.title, path: rankingPath(locale) },
          { name: p.username, path: playerPath(locale, p.username) },
        ]}
      />

      <div className="container-page mt-6">
        {/* The player's card. VIP members get the gold frame. */}
        <section
          aria-labelledby="player-name"
          className={`relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] ${p.vip ? "vip-frame" : "card noise ring-1 ring-white/[0.06]"}`}
        >
          {p.vip && <div aria-hidden className="vip-backdrop" />}
          <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
              <div
                className="relative shrink-0 rounded-full p-[5px]"
                style={{
                  background: frame
                    ? `linear-gradient(145deg, ${frame.a}, ${frame.b})`
                    : p.vip
                      ? "linear-gradient(145deg, var(--color-gold-200), var(--color-gold-600))"
                      : "linear-gradient(145deg, rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.04))",
                  boxShadow: frame?.shine || p.vip ? `0 0 38px -6px ${frame?.a ?? "var(--color-gold-400)"}` : undefined,
                }}
              >
                <Avatar
                  code={p.avatar}
                  size={128}
                  priority
                  alt={avatarSrc(p.avatar) ? fmt(t.avatarAlt, { name: p.username }) : fmt(t.noAvatar, { name: p.username })}
                  className="block size-28 bg-ink-900 sm:size-32"
                />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink-950 px-2.5 py-0.5 font-display text-[12px] font-bold text-gold-200 ring-1 ring-gold-400/40">
                  {fmt(t.level, { n: p.level })}
                </span>
              </div>
              <div className="min-w-0">
                <p className="kicker justify-center sm:justify-start">{p.vip ? t.vipFrame : t.kicker}</p>
                <h1
                  id="player-name"
                  className="mt-2 break-words font-display text-4xl font-extrabold tracking-[-0.02em] sm:text-5xl"
                  style={{ color: nameColor }}
                >
                  {p.username}
                </h1>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {country && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1 text-[13px] text-cream/85 ring-1 ring-white/[0.08]">
                      <Flag code={p.country} height={13} />
                      {country}
                    </span>
                  )}
                  {p.vip && (
                    <Badge className="bg-gold-400/15 text-gold-200 ring-gold-400/35">
                      <Crown className="size-3.5" aria-hidden /> {t.vip}
                    </Badge>
                  )}
                  {p.supporter && (
                    <Badge className="bg-rose-400/10 text-rose-200 ring-rose-300/30">
                      <HeartHandshake className="size-3.5" aria-hidden />
                      <a href={pagePath(locale, "supporters")} className="hover:underline">
                        {t.supporter}
                      </a>
                    </Badge>
                  )}
                  {p.role !== "player" && (
                    <Badge className="bg-[#ff5245]/12 text-[#ff8a80] ring-[#ff5245]/30">
                      <Shield className="size-3.5" aria-hidden /> {t.roles[p.role]}
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-[13.5px] text-mist">
                  {p.createdAt > 0 && fmt(t.since, { date: formatDate(locale, p.createdAt, "long") })}
                  {p.createdAt > 0 && p.lastSeenDays !== null && " · "}
                  {p.lastSeenDays !== null && seen(t, p.lastSeenDays)}
                </p>
              </div>
            </div>

            {/* The cue they play with. */}
            {p.cue && (
              <div className="rounded-2xl bg-ink-950/40 p-5 ring-1 ring-white/[0.06]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fog">{t.cue}</p>
                <CueArt
                  code={p.cue}
                  rarity={p.cueRarity}
                  label={fmt(t.cueAlt, { name: p.username, cue: cueName(p.cue, locale) })}
                  className="mt-4"
                />
                <p className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-display text-lg font-bold text-cream">{cueName(p.cue, locale)}</span>
                  {p.cueRarity && (
                    <span className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: rarityText(p.cueRarity) }}>
                      {d.common.rarities[p.cueRarity]}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
          <div className="relative flex flex-wrap items-center justify-center gap-3 border-t border-white/[0.06] px-6 py-4 sm:justify-end sm:px-9">
            <CopyLink url={url} label={d.common.copyLink} done={d.common.copied} title={p.username} />
          </div>
        </section>

        {/* Ratings, one card per set of rules. */}
        <section aria-labelledby="ratings" className="mx-auto mt-14 max-w-5xl">
          <SectionTitle id="ratings">{t.ratings}</SectionTitle>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {p.ratings.map((r) => (
              <RatingCard key={r.rules} r={r} d={d} locale={locale} primary={r.rules === main.rules} />
            ))}
          </div>
          {p.career && (
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: t.careerGames, value: p.career.games, icon: <Globe className="size-4" aria-hidden /> },
                { label: t.careerWins, value: p.career.wins, icon: <Trophy className="size-4" aria-hidden /> },
                { label: t.breakAndRuns, value: p.career.breakAndRuns, icon: <Zap className="size-4" aria-hidden /> },
                { label: t.bestStreak, value: p.career.bestStreak, icon: <Flame className="size-4" aria-hidden /> },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/[0.03] px-4 py-4 ring-1 ring-white/[0.06]">
                  <dt className="flex items-center gap-2 text-[12px] font-medium text-fog">
                    <span className="text-gold-300/80">{s.icon}</span>
                    {s.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-2xl font-extrabold tabular-nums text-cream">{formatNumber(locale, s.value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <div className="mx-auto mt-14 grid max-w-5xl gap-14 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
          {/* Achievements */}
          <section aria-labelledby="achievements">
            <SectionTitle id="achievements" aside={p.achievements.length ? fmt(t.achievementsCount, { n: p.achievements.length }) : undefined}>
              {t.achievements}
            </SectionTitle>
            {p.achievements.length === 0 ? (
              <Empty>{t.noAchievements}</Empty>
            ) : (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {p.achievements.map((a) => {
                  const text = achievementText(a, locale);
                  const medal = a.medal ? d.common.medals[a.medal] : undefined;
                  return (
                    <li
                      key={a.code}
                      className="flex gap-3.5 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06]"
                      style={a.medal === "ruby" ? { boxShadow: "inset 0 0 0 1px rgb(237 51 84 / 0.35), 0 10px 30px -18px rgb(237 51 84 / 0.6)" } : undefined}
                    >
                      <span className="shrink-0 pt-0.5">
                        <Medal medal={a.medal} size={42} title={medal} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold leading-snug text-cream">
                          {text.name}
                          {a.secret && <span className="sr-only"> ({t.secret})</span>}
                        </span>
                        <span className="mt-0.5 block text-[13.5px] leading-snug text-mist">{text.description}</span>
                        {a.unlockedAt > 0 && (
                          <span className="mt-1.5 block text-[12px] text-fog">{fmt(t.unlocked, { date: formatDate(locale, a.unlockedAt) })}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="space-y-14">
            {/* Trophies */}
            <section aria-labelledby="trophies">
              <SectionTitle id="trophies">{t.trophies}</SectionTitle>
              {p.trophies.length === 0 ? (
                <Empty>{t.noTrophies}</Empty>
              ) : (
                <ul className="mt-5 space-y-3">
                  {p.trophies.map((tr, i) => {
                    const body = (
                      <>
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-200 to-gold-600 text-ink-950 shadow-[0_8px_20px_-8px_rgb(232_188_94/0.7)]">
                          <Trophy className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-cream">{tr.name || t.trophyKinds[tr.kind] || tr.kind}</span>
                          <span className="block text-[13px] text-mist">
                            {[t.trophyKinds[tr.kind] ?? tr.kind, tr.players ? fmt(t.trophyPlayers, { n: tr.players }) : null, tr.at ? formatDate(locale, tr.at) : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </>
                    );
                    return (
                      <li key={`${tr.name}-${tr.at}-${i}`}>
                        {tr.tournamentId !== null ? (
                          <a
                            href={tournamentPath(locale, tr.tournamentId)}
                            className="flex items-center gap-3.5 rounded-2xl bg-white/[0.03] p-3.5 ring-1 ring-white/[0.06] transition hover:bg-white/[0.06] hover:ring-gold-400/30"
                            title={t.seeTournament}
                          >
                            {body}
                          </a>
                        ) : (
                          <div className="flex items-center gap-3.5 rounded-2xl bg-white/[0.03] p-3.5 ring-1 ring-white/[0.06]">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Latest games */}
            <section aria-labelledby="recent">
              <SectionTitle id="recent">{t.recent}</SectionTitle>
              {p.recent.length === 0 ? (
                <Empty>{t.noRecent}</Empty>
              ) : (
                <ol className="mt-5 divide-y divide-white/[0.05] overflow-hidden rounded-2xl bg-white/[0.025] ring-1 ring-white/[0.06]">
                  {p.recent.map((g) => (
                    <GameRow key={g.id || `${g.at}-${g.opponent}`} g={g} d={d} locale={locale} />
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>

        <p className="mx-auto mt-14 max-w-5xl text-center">
          <a href={rankingPath(locale)} className="font-semibold text-gold-300 transition hover:text-gold-200">
            {t.toRanking} →
          </a>
        </p>
      </div>
      <DownloadCta locale={locale} text={fmt(t.cta, { name: p.username })} />
    </SiteFrame>
  );
}

function tierColor(r: PlayerRating): string {
  return TIERS.find((x) => x.key === r.tier)?.color ?? tierOf(r.rating).color;
}

/** A rarity's colour, light enough to read on the dark page. */
function rarityText(r: NonNullable<Player["cueRarity"]>): string {
  return { common: "#c4cad2", rare: "#7fb6ff", epic: "#c99aff", legendary: "#ffc552" }[r];
}

function seen(t: T, days: number): string {
  if (days <= 0) return t.seen.today;
  if (days === 1) return t.seen.yesterday;
  if (days <= 60) return fmt(t.seen.days, { n: days });
  return t.seen.long;
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ring-1 ${className}`}>{children}</span>;
}

function SectionTitle({ id, children, aside }: { id: string; children: React.ReactNode; aside?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.07] pb-3">
      <h2 id={id} className="font-display text-2xl font-bold tracking-tight text-cream">
        {children}
      </h2>
      {aside && <span className="text-[13px] text-fog">{aside}</span>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 rounded-2xl bg-white/[0.025] px-5 py-6 text-[15px] text-mist ring-1 ring-white/[0.05]">{children}</p>;
}

function RatingCard({ r, d, locale, primary }: { r: PlayerRating; d: Dict; locale: Locale; primary: boolean }) {
  const t = d.player;
  const color = tierColor(r);
  const rate = winRateOf(r.wins, r.games);
  const rulesName = r.rules === "brazilian" ? d.common.brazilian : d.common.official;
  return (
    <article
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-ink-800 to-ink-900 p-6 ring-1 sm:p-7 ${primary ? "ring-white/[0.1]" : "ring-white/[0.06]"}`}
      aria-label={rulesName}
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-20 blur-3xl" style={{ background: color }} />
      <div className="relative">
        <h3 className="flex items-center gap-2.5 text-[15px] font-semibold text-cream/90">
          {r.rules === "brazilian" ? <Flag code="BR" height={13} /> : <Globe className="size-4 text-sky-300" aria-hidden />}
          {rulesName}
        </h3>
        {r.games === 0 ? (
          <p className="mt-6 text-[15px] text-mist">{t.noGames}</p>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-fog">{t.rating}</p>
                <p className="font-display text-5xl font-extrabold tabular-nums tracking-tight" style={{ color }}>
                  {r.rating}
                </p>
              </div>
              <span
                className="mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold"
                style={{ color, backgroundColor: `${color}1a`, boxShadow: `inset 0 0 0 1px ${color}40` }}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
                {d.ranking.tiers[r.tier]}
              </span>
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
              <Stat label={t.peak} value={String(r.peak)} />
              <Stat
                label={t.rank}
                value={r.rank !== null ? `#${r.rank}` : "–"}
                title={r.rank === null ? t.unranked : undefined}
                href={r.rank !== null ? `${rankingPath(locale)}${r.rules === "official" ? "#official" : ""}` : undefined}
              />
              <Stat label={t.games} value={formatNumber(locale, r.games)} />
            </dl>
            <div className="mt-6">
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-mist">{fmt(t.record, { wins: r.wins, losses: Math.max(0, r.games - r.wins) })}</span>
                <span className="font-semibold tabular-nums text-cream">
                  {t.winRate} {rate}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden>
                <div className="h-full rounded-full bg-gradient-to-r from-felt-500 to-felt-300" style={{ width: `${rate}%` }} />
              </div>
            </div>
            {r.games < ELO.provisionalGames && (
              <p className="mt-4 text-[12.5px] text-fog">
                <a href={pagePath(locale, "rating")} className="underline decoration-white/20 underline-offset-2 hover:text-cream">
                  {fmt(t.provisional, { n: ELO.provisionalGames })}
                </a>
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}

function Stat({ label, value, title, href }: { label: string; value: string; title?: string; href?: string }) {
  // The link goes inside the <dd>: a <dl>'s groups hold only <dt> and <dd>.
  return (
    <div className="rounded-2xl bg-white/[0.03] px-2 py-3 ring-1 ring-white/[0.05]" title={title}>
      <dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-fog">{label}</dt>
      <dd className="mt-1 font-display text-xl font-bold tabular-nums text-cream">
        {href ? (
          <a href={href} className="block rounded transition hover:text-gold-200">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function GameRow({ g, d, locale }: { g: RecentGame; d: Dict; locale: Locale }) {
  const t = d.player;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className={`grid h-7 w-14 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
          g.won ? "bg-felt-500/15 text-felt-300 ring-1 ring-felt-400/30" : "bg-[#e2685a]/12 text-[#f19a90] ring-1 ring-[#e2685a]/25"
        }`}
      >
        {g.won ? t.win : t.loss}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2 text-[14.5px]">
          <span className="sr-only">{fmt(t.against, { name: "" })}</span>
          <Flag code={g.opponentCountry} height={12} />
          <a href={playerPath(locale, g.opponent)} className="truncate font-semibold text-cream transition hover:text-gold-200">
            {g.opponent}
          </a>
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-fog">
          {[g.rules === "brazilian" ? d.common.brazilian : d.common.official, g.rated ? t.rated : t.casual, t.reasons[g.reason] ?? null, g.at ? formatDate(locale, g.at) : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      {g.rated && g.delta !== null && (
        <span className={`shrink-0 font-display text-[15px] font-bold tabular-nums ${g.delta >= 0 ? "text-felt-300" : "text-[#f19a90]"}`}>
          {signed(g.delta)}
        </span>
      )}
    </li>
  );
}
