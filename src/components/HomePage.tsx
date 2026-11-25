import { getDict, LOCALE_INFO, type Locale } from "@/i18n";
import { getLatestRelease } from "@/lib/release";
import { ASSETS, GITHUB_URL, latestAsset, SITE_URL } from "@/lib/site";
import { DownloadSection } from "./DownloadSection";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";
import { Gallery } from "./Gallery";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Opponents } from "./Opponents";
import { PlaySection } from "./PlaySection";
import { PlatformProvider } from "./PlatformProvider";
import { RevealObserver } from "./RevealObserver";
import { Rules } from "./Rules";
import { SectionHeading } from "./Section";
import { Stats } from "./Stats";

export async function HomePage({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const release = await getLatestRelease();
  const shotsDir = `/shots/${locale}`;
  const htmlLang = LOCALE_INFO[locale].htmlLang;
  const releasedOn = new Intl.DateTimeFormat(htmlLang, { dateStyle: "long", timeZone: "UTC" }).format(new Date(release.date));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["VideoGame", "SoftwareApplication"],
    name: "Snook Legend",
    url: SITE_URL + LOCALE_INFO[locale].path,
    description: t.meta.description,
    image: `${SITE_URL}/og.jpg`,
    screenshot: `${SITE_URL}${shotsDir}/01-aim-1920.webp`,
    applicationCategory: "GameApplication",
    genre: ["Sports", "Billiards", "Pool"],
    gamePlatform: ["Windows", "macOS", "Linux"],
    operatingSystem: "Windows 10, Windows 11, macOS 11+, Linux",
    playMode: ["SinglePlayer", "MultiPlayer"],
    softwareVersion: release.version,
    datePublished: release.date,
    downloadUrl: latestAsset(ASSETS.winMsi),
    fileSize: "20MB",
    inLanguage: htmlLang,
    license: "https://opensource.org/licenses/MIT",
    sameAs: [GITHUB_URL],
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Snook Legend",
    url: SITE_URL + LOCALE_INFO[locale].path,
    inLanguage: htmlLang,
  };

  return (
    <PlatformProvider t={{ modal: t.modal, download: t.download, os: t.os }} release={release} locale={htmlLang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, siteLd, faqLd]).replace(/</g, "\\u003c") }} />
      <Header t={{ nav: t.nav, hero: t.hero, os: t.os }} locale={locale} />
      <main id="main">
        <Hero t={t} locale={htmlLang} shotsDir={shotsDir} />
        <Stats t={t} />
        <Features t={t} shotsDir={shotsDir} />
        <PlaySection t={t} />
        <Rules t={t} shotsDir={shotsDir} locale={locale} />
        <Opponents t={t} />
        <section id="gallery" aria-labelledby="gallery-title" className="defer-render relative py-24 [--defer-size:1800px] sm:py-32">
          <div className="container-page">
            <SectionHeading id="gallery-title" kicker={t.gallery.kicker} title={t.gallery.title} sub={t.gallery.sub} />
            <Gallery t={t.gallery} shotsDir={shotsDir} />
          </div>
        </section>
        <DownloadSection
          t={{ download: t.download, os: t.os, requirements: t.requirements }}
          locale={htmlLang}
          releasedOn={{ tag: release.tag, text: releasedOn }}
        />
        <Faq t={t} />
        <FinalCta t={t} locale={htmlLang} />
      </main>
      <Footer t={t} locale={locale} version={release.version} />
      <RevealObserver />
    </PlatformProvider>
  );
}
