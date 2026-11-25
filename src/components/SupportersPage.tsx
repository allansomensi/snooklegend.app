import { Crown, Heart } from "lucide-react";
import { fmt, getDict, type Locale } from "@/i18n";
import { countryName, formatMonth } from "@/lib/format";
import { pagePath, pathsOf, playerPath } from "@/lib/routes";
import type { Supporter } from "@/lib/supporters";
import { Flag } from "./Flag";
import { Breadcrumbs, DownloadCta, PageHeader, SiteFrame } from "./SiteFrame";

/** The players who help keep the game running (VIP now or before) and chose to appear here. `list` null: no answer (while building). */
export async function SupportersPage({ locale, list }: { locale: Locale; list: Supporter[] | null }) {
  const d = getDict(locale);
  const t = d.supporters;
  return (
    <SiteFrame locale={locale} paths={pathsOf((l) => pagePath(l, "supporters"))}>
      <Breadcrumbs locale={locale} items={[{ name: t.shortTitle, path: pagePath(locale, "supporters") }]} />
      <div className="container-page mt-8">
        <PageHeader
          kicker={t.kicker}
          title={
            <span className="inline-flex items-center gap-4">
              {t.heading}
              <Heart className="size-10 fill-[#e2685a] text-[#e2685a] drop-shadow-[0_8px_24px_rgb(226_104_90/0.5)] sm:size-12" aria-hidden />
            </span>
          }
          sub={t.sub}
        />
        <section aria-label={t.shortTitle} className="mx-auto mt-14 max-w-5xl">
          {list === null ? (
            <p className="mx-auto max-w-lg rounded-3xl bg-ink-850/70 px-8 py-12 text-center text-cream ring-1 ring-white/[0.07]">{t.unavailable}</p>
          ) : list.length === 0 ? (
            <p className="mx-auto max-w-lg rounded-3xl bg-ink-850/70 px-8 py-12 text-center text-cream ring-1 ring-white/[0.07]">{t.empty}</p>
          ) : (
            <>
              <p className="text-center text-[13px] text-fog">{fmt(t.count, { n: list.length })}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => {
                  const country = countryName(locale, s.country);
                  return (
                    <li key={s.username}>
                      <a
                        href={playerPath(locale, s.username)}
                        className={`flex items-center gap-3.5 rounded-2xl p-4 ring-1 transition hover:-translate-y-0.5 ${
                          s.vip ? "bg-gradient-to-br from-gold-400/[0.09] to-transparent ring-gold-400/25 hover:ring-gold-400/50" : "bg-white/[0.03] ring-white/[0.07] hover:ring-white/20"
                        }`}
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-800 ring-1 ring-white/10">
                          {s.country ? <Flag code={s.country} height={18} title={country || undefined} /> : <Heart className="size-5 text-[#e2685a]" aria-hidden />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-display text-lg font-bold text-cream">{s.username}</span>
                            {s.vip && <Crown className="size-4 shrink-0 text-gold-300" aria-label={t.vipNow} />}
                          </span>
                          <span className="block truncate text-[13px] text-mist">
                            {[s.months > 0 ? (s.months === 1 ? t.oneMonth : fmt(t.months, { n: s.months })) : null, s.since > 0 ? fmt(t.since, { date: formatMonth(locale, s.since) }) : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
        <section aria-labelledby="how" className="mx-auto mt-16 max-w-3xl rounded-3xl bg-white/[0.03] p-7 ring-1 ring-white/[0.07] sm:p-9">
          <h2 id="how" className="font-display text-2xl font-bold tracking-tight text-cream">
            {t.howTitle}
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-cream/80">{t.how}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-mist">{t.also}</p>
        </section>
      </div>
      <DownloadCta locale={locale} text={t.cta} />
    </SiteFrame>
  );
}
