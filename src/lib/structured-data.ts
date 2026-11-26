// Structured data (JSON-LD, schema.org) for search engines: who makes the
// game, the site, and the game itself. Everything here is true of the game
// and the site: no ratings or reviews that nobody gave.
//
// The nodes have fixed `@id`s, so any page can point at them ("this page is
// part of the site", "the organizer is Snook Legend") without repeating them.

import { getDict, LOCALE_INFO, LOCALES, type Locale } from "@/i18n";
import type { ReleaseInfo } from "./release";
import { ASSETS, GITHUB_URL, ITCH_URL, latestAsset, MS_STORE_URL, SITE_NAME, SITE_URL, socialProfiles } from "./site";

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const GAME_ID = `${SITE_URL}/#game`;
const LOGO_ID = `${SITE_URL}/#logo`;

/** The screenshots, in the order of the captions in the dictionaries (`gallery.items`). */
const SHOTS = ["01-aim", "04-hall", "02-top", "03-elevation", "05-opponents", "06-lounge", "10-drills", "08-rules", "09-menu", "07-pictures"];

/** The Microsoft Store's page for the game (if `MS_STORE_URL` is a product page, not a search). */
const storePage = () => (/^https:\/\/apps\.microsoft\.com\/detail\//.test(MS_STORE_URL) ? MS_STORE_URL : null);

/** Snook Legend, who makes the game and the site, with its official profiles. */
export function organization() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", "@id": LOGO_ID, url: `${SITE_URL}/brand/icon-512.png`, width: 512, height: 512, caption: SITE_NAME },
    image: { "@id": LOGO_ID },
    sameAs: socialProfiles().map((p) => p.url),
  };
}

/** The site, in its three languages. */
export function website() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    alternateName: "snooklegend.app",
    inLanguage: LOCALES.map((l) => LOCALE_INFO[l].htmlLang),
    publisher: { "@id": ORG_ID },
  };
}

/** The game: a free 3D eight-ball pool game for Windows, macOS and Linux. */
export function videoGame(locale: Locale, release: ReleaseInfo) {
  const t = getDict(locale);
  const home = SITE_URL + LOCALE_INFO[locale].path;
  const msi = release.assets[ASSETS.winMsi]?.size;
  const store = storePage();
  return {
    "@type": ["VideoGame", "SoftwareApplication"],
    "@id": GAME_ID,
    name: SITE_NAME,
    url: home,
    description: t.meta.description,
    image: `${SITE_URL}/og.jpg`,
    screenshot: SHOTS.map((name, i) => ({
      "@type": "ImageObject",
      url: `${SITE_URL}/shots/${locale}/${name}-1920.webp`,
      width: 1920,
      height: 1080,
      caption: t.gallery.items[i],
    })),
    applicationCategory: "GameApplication",
    applicationSubCategory: "Billiards",
    genre: ["Sports", "Billiards", "Pool"],
    gamePlatform: ["PC", "Windows", "macOS", "Linux"],
    operatingSystem: "Windows 10, Windows 11, macOS 11+, Linux",
    playMode: ["SinglePlayer", "MultiPlayer"],
    storageRequirements: "25 MB",
    softwareVersion: release.version,
    dateModified: release.date,
    downloadUrl: latestAsset(ASSETS.winMsi),
    installUrl: `${home}#download`,
    ...(msi ? { fileSize: `${Math.round(msi / (1024 * 1024))} MB` } : {}),
    isAccessibleForFree: true,
    // Free, from this site and from the Microsoft Store.
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${home}#download` },
      ...(store
        ? [{ "@type": "Offer", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock", url: store, seller: { "@type": "Organization", name: "Microsoft Store" } }]
        : []),
    ],
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    license: "https://opensource.org/licenses/MIT",
    // The game's own pages elsewhere: its source, its Microsoft Store page and its itch.io page.
    sameAs: [GITHUB_URL, ...(store ? [store] : []), ITCH_URL],
  };
}

/** A question-and-answer list (the page's own, as shown on it). */
export function faqEntities(items: readonly { q: string; a: string }[]) {
  return items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }));
}

/** The home page: the organization, the site, the game, and the page itself with its questions. */
export function homeGraph(locale: Locale, release: ReleaseInfo) {
  const t = getDict(locale);
  const home = SITE_URL + LOCALE_INFO[locale].path;
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization(),
      website(),
      videoGame(locale, release),
      {
        "@type": ["WebPage", "FAQPage"],
        "@id": `${home}#webpage`,
        url: home,
        name: t.meta.title,
        description: t.meta.description,
        inLanguage: LOCALE_INFO[locale].htmlLang,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": GAME_ID },
        mainEntity: faqEntities(t.faq.items),
        primaryImageOfPage: { "@type": "ImageObject", url: `${SITE_URL}/og.jpg`, width: 1200, height: 630 },
      },
    ],
  };
}
