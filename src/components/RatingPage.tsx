import { Plus } from "lucide-react";
import { fmt, getDict, LOCALE_INFO, type Locale } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { ELO, LEAGUE_PRIZES } from "@/lib/rating";
import { rankingPath, TIERS } from "@/lib/ranking";
import { pagePath, pathsOf } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";
import { RatingCalculator } from "./RatingCalculator";
import { Breadcrumbs, DownloadCta, JsonLd, PageHeader, SiteFrame } from "./SiteFrame";

/** The rating calculator, and how the rating and the leagues work. */
export async function RatingPage({ locale }: { locale: Locale }) {
  const d = getDict(locale);
  const t = d.calc;
  const path = pagePath(locale, "rating");
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: t.shortTitle,
      url: SITE_URL + path,
      description: t.description,
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      inLanguage: LOCALE_INFO[locale].htmlLang,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: t.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  return (
    <SiteFrame locale={locale} paths={pathsOf((l) => pagePath(l, "rating"))}>
      <JsonLd data={jsonLd} />
      <Breadcrumbs locale={locale} items={[{ name: d.ranking.title, path: rankingPath(locale) }, { name: t.shortTitle, path }]} />
      <div className="container-page mt-8">
        <PageHeader kicker={t.kicker} title={t.heading} sub={t.sub} />
        <div className="mx-auto mt-12 max-w-5xl">
          <RatingCalculator t={t} tiers={d.ranking.tiers} lang={LOCALE_INFO[locale].htmlLang} />

          <div className="mt-16 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <section aria-labelledby="how">
              <h2 id="how" className="font-display text-2xl font-bold tracking-tight text-cream">
                {t.howTitle}
              </h2>
              <div className="mt-5 space-y-4 text-[16px] leading-[1.75] text-cream/80">
                {t.how.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
            <section aria-labelledby="leagues">
              <h2 id="leagues" className="font-display text-2xl font-bold tracking-tight text-cream">
                {t.leaguesTitle}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-mist">{t.leaguesSub}</p>
              <ol className="mt-5 space-y-2">
                {[...TIERS].reverse().map((tier, i, all) => {
                  const next = all[i - 1];
                  const range =
                    tier.min === -Infinity
                      ? fmt(t.leagueUpTo, { n: (next?.min ?? 0) - 1 })
                      : next
                        ? `${tier.min}–${next.min - 1}`
                        : fmt(t.leagueFrom, { n: tier.min });
                  return (
                    <li key={tier.key} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.06]">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tier.color, boxShadow: `0 0 10px ${tier.color}` }} />
                      <span className="flex-1 font-semibold" style={{ color: tier.color }}>
                        {d.ranking.tiers[tier.key]}
                        {tier.min <= ELO.initialRating && ELO.initialRating < (next?.min ?? Infinity) && (
                          <span className="ml-2 text-[12px] font-normal text-fog">({t.start})</span>
                        )}
                      </span>
                      <span className="tabular-nums text-[14px] text-mist">{range}</span>
                      <span className="w-24 text-right text-[13px] tabular-nums text-gold-200">
                        {LEAGUE_PRIZES[tier.key] ? fmt(t.leaguePrize, { n: formatNumber(locale, LEAGUE_PRIZES[tier.key]) }) : ""}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>

          <section aria-labelledby="calc-faq" className="mt-16">
            <h2 id="calc-faq" className="font-display text-2xl font-bold tracking-tight text-cream">
              {t.faqTitle}
            </h2>
            <div className="mt-5 divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {t.faq.map((f, i) => (
                <details key={i} className="group">
                  <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-left font-display text-lg font-semibold text-cream transition hover:text-gold-200">
                    <h3>{f.q}</h3>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.05] ring-1 ring-white/10 transition duration-300 group-open:rotate-45 group-open:bg-gold-400/15 group-open:text-gold-300">
                      <Plus className="size-4" aria-hidden />
                    </span>
                  </summary>
                  <p className="max-w-3xl pb-6 pr-10 text-[15.5px] leading-relaxed text-mist">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-center">
              <a href={rankingPath(locale)} className="font-semibold text-gold-300 transition hover:text-gold-200">
                {d.player.toRanking} →
              </a>
            </p>
          </section>
        </div>
      </div>
      <DownloadCta locale={locale} text={t.cta} />
    </SiteFrame>
  );
}
