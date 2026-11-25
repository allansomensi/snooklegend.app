import { getDict, LOCALE_INFO, LOCALES, type Locale } from "@/i18n";
import { rankingPath } from "@/lib/ranking";
import { getLatestRelease } from "@/lib/release";
import { DownloadButton } from "./DownloadButton";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { PlatformProvider } from "./PlatformProvider";
import { RankingBoard } from "./RankingBoard";
import { Breadcrumbs } from "./SiteFrame";
import { pagePath } from "@/lib/routes";

/**
 * The world ranking: the top 100 under the Brazilian and the official rules,
 * read live from the game server in the visitor's browser (the page itself is
 * prerendered, like the rest of the site).
 */
export async function RankingPage({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const r = t.ranking;
  const release = await getLatestRelease();
  const htmlLang = LOCALE_INFO[locale].htmlLang;
  const paths = Object.fromEntries(LOCALES.map((l) => [l, rankingPath(l)])) as Record<Locale, string>;

  return (
    <PlatformProvider t={{ modal: t.modal, download: t.download, os: t.os }} release={release} locale={htmlLang}>
      <Header t={{ nav: t.nav, hero: t.hero, os: t.os }} locale={locale} paths={paths} />
      <main id="main" className="relative overflow-hidden pb-24 pt-[calc(var(--header-h)+2rem)] sm:pt-[calc(var(--header-h)+3rem)]">
        {/* The felt's glow behind the title, as on the home page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(60%_55%_at_50%_0%,rgb(24_138_74/0.28),transparent_70%)]"
        />
        <Breadcrumbs locale={locale} items={[{ name: r.title, path: rankingPath(locale) }]} />
        <div className="container-page mt-8">
          <header className="mx-auto max-w-3xl text-center">
            <p className="kicker justify-center">{r.kicker}</p>
            <h1 className="mt-4 text-balance font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] text-cream sm:text-6xl">
              {r.heading}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-[17px] leading-relaxed text-mist sm:text-lg">{r.sub}</p>
          </header>

          <div className="mx-auto mt-10 max-w-5xl sm:mt-12">
            <RankingBoard t={r} locale={locale} />
            <p className="mt-6 text-center text-[13px] text-fog">
              {r.note}{" "}
              <a href={pagePath(locale, "rating")} className="font-semibold text-gold-300 hover:text-gold-200">
                {t.calc.shortTitle} →
              </a>
            </p>
          </div>

          <div className="mx-auto mt-20 flex max-w-3xl flex-col items-center gap-5 rounded-3xl bg-gradient-to-b from-felt-800/40 to-ink-900/60 px-8 py-10 text-center ring-1 ring-felt-500/20">
            <p className="text-balance font-display text-2xl font-bold tracking-tight text-cream">{r.cta}</p>
            <DownloadButton t={{ hero: t.hero, os: t.os }} locale={locale} size="md" />
          </div>
        </div>
      </main>
      <Footer t={t} locale={locale} version={release.version} paths={paths} />
    </PlatformProvider>
  );
}
