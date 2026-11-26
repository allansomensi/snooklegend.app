import { ArrowRight, Plus } from "lucide-react";
import { getDict, LOCALE_INFO, type Locale } from "@/i18n";
import { rankingPath } from "@/lib/ranking";
import { getLatestRelease } from "@/lib/release";
import { pagePath, pathsOf } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";
import { videoGame, WEBSITE_ID } from "@/lib/structured-data";
import { AllPlatformsLink, DownloadButton } from "./DownloadButton";
import { DownloadSection } from "./DownloadSection";
import { Breadcrumbs, JsonLd, PageHeader, SiteFrame } from "./SiteFrame";

/** The home page's questions that are about getting the game onto the computer (the SmartScreen warning… uninstalling). */
const INSTALL_QUESTIONS = [1, 2, 3, 4, 5, 6];

/**
 * The download page (`/download/`, `/pt/baixar/`, `/es/descargar/`): every
 * way to install the game, the system requirements and the questions about
 * installing it, for whoever comes looking for the download itself.
 */
export async function DownloadPage({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const p = t.downloadPage;
  const release = await getLatestRelease();
  const htmlLang = LOCALE_INFO[locale].htmlLang;
  const path = pagePath(locale, "download");
  const releasedOn = new Intl.DateTimeFormat(htmlLang, { dateStyle: "long", timeZone: "UTC" }).format(new Date(release.date));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      videoGame(locale, release),
      {
        "@type": "WebPage",
        "@id": `${SITE_URL + path}#webpage`,
        url: SITE_URL + path,
        name: p.title,
        description: p.description,
        inLanguage: htmlLang,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": `${SITE_URL}/#game` },
      },
    ],
  };
  const next = [
    { href: pagePath(locale, "rules"), label: p.next.rules },
    { href: rankingPath(locale), label: p.next.ranking },
    { href: pagePath(locale, "tournaments"), label: p.next.tournaments },
  ];

  return (
    <SiteFrame locale={locale} paths={pathsOf((l) => pagePath(l, "download"))}>
      <JsonLd data={jsonLd} />
      <Breadcrumbs locale={locale} items={[{ name: p.shortTitle, path }]} />
      <div className="container-page mt-8">
        <PageHeader kicker={p.kicker} title={p.heading} sub={p.sub}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-start">
            <DownloadButton t={{ hero: t.hero, os: t.os }} locale={htmlLang} showMeta />
            <AllPlatformsLink label={t.hero.allPlatforms} />
          </div>
        </PageHeader>
      </div>

      <DownloadSection t={{ download: t.download, os: t.os, requirements: t.requirements }} locale={htmlLang} releasedOn={{ tag: release.tag, text: releasedOn }} />

      <div className="container-page">
        <section aria-labelledby="install-faq" className="mx-auto max-w-3xl">
          <h2 id="install-faq" className="font-display text-3xl font-bold tracking-tight text-cream">
            {p.faqTitle}
          </h2>
          <div className="mt-6 divide-y divide-white/[0.08] border-y border-white/[0.08]">
            {INSTALL_QUESTIONS.map((i) => t.faq.items[i]).map((f, i) => (
              <details key={f.q} className="group" open={i === 0}>
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
        </section>

        <nav aria-labelledby="next-title" className="mx-auto mt-16 max-w-3xl rounded-3xl bg-white/[0.03] p-7 ring-1 ring-white/[0.07] sm:p-9">
          <h2 id="next-title" className="font-display text-2xl font-bold tracking-tight text-cream">
            {p.nextTitle}
          </h2>
          <ul className="mt-4 space-y-1">
            {next.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="group inline-flex items-center gap-2 py-1.5 text-[16px] font-semibold text-gold-300 transition hover:text-gold-200">
                  {n.label}
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </SiteFrame>
  );
}
