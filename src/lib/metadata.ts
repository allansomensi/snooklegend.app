// What search engines and social networks read in every page's <head>: the
// title (" | Snook Legend" after it), the description, the canonical address
// and the same page in the other languages (hreflang), the cards for social
// networks and the robots' instructions.

import type { Metadata, Viewport } from "next";
import { getDict, LOCALE_INFO, LOCALES, type Locale } from "@/i18n";
import { LEGAL_UPDATED } from "./legal";
import { rankingPath } from "./ranking";
import { languagesOf } from "./routes";
import { legalPath, SITE_NAME, SITE_URL, X_HANDLE, type LegalDoc } from "./site";

export const VIEWPORT: Viewport = {
  themeColor: "#040907",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** What every page's title is followed by (the home pages' titles start with the name instead). */
export const TITLE_SUFFIX = ` | ${SITE_NAME}`;

/** The site's picture for social networks (1200×630): a pool table in a dim pool hall. */
export const OG_IMAGE = { url: "/og.jpg", width: 1200, height: 630, type: "image/jpeg" } as const;

/** A page for search engines: indexed, with large image previews and full snippets. */
export const ROBOTS_INDEX = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
} satisfies Metadata["robots"];

/** A page kept out of search results (its links are still followed). */
export const ROBOTS_NOINDEX = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
} satisfies Metadata["robots"];

/**
 * Search Console's and Bing's ownership checks, from the environment
 * (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`), when set.
 */
function verification(): Metadata["verification"] {
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.BING_SITE_VERIFICATION?.trim();
  if (!google && !bing) return undefined;
  return { ...(google ? { google } : {}), ...(bing ? { other: { "msvalidate.01": bing } } : {}) };
}

/**
 * What every page of a language starts from (its root layout's). No address
 * of its own: each page gives its canonical address and its versions in the
 * other languages, so a page that gives none (a 404) doesn't borrow the home
 * page's.
 */
export function buildMetadata(locale: Locale): Metadata {
  const t = getDict(locale);
  const info = LOCALE_INFO[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.title, template: `%s${TITLE_SUFFIX}` },
    description: t.meta.description,
    applicationName: SITE_NAME,
    keywords: t.meta.keywords,
    authors: [{ name: SITE_NAME, url: `${SITE_URL}/` }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "games",
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: info.og,
      images: [{ ...OG_IMAGE, alt: t.meta.ogAlt }],
    },
    twitter: { card: "summary_large_image", site: X_HANDLE, creator: X_HANDLE, images: [{ url: OG_IMAGE.url, alt: t.meta.ogAlt }] },
    // No `robots` here: each page says its own (a page that isn't there must not say "index").
    formatDetection: { telephone: false, email: false, address: false },
    verification: verification(),
  };
}

/**
 * A page's metadata (on top of its language's, from the layout): its title
 * (the layout's template adds " | Snook Legend"; `absoluteTitle` keeps it as
 * it is), description, canonical address and the same page in the other
 * languages, and its cards for social networks. `image: false` leaves the
 * picture to an `opengraph-image` next to the page.
 */
export function pageMetadata({
  locale,
  pathOf,
  title,
  description,
  absoluteTitle = false,
  type = "website",
  image = OG_IMAGE,
  imageAlt,
  index = true,
  profile,
  dates,
}: {
  locale: Locale;
  pathOf: (l: Locale) => string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
  type?: "website" | "article" | "profile";
  image?: { url: string; width: number; height: number; type?: string } | false;
  imageAlt?: string;
  index?: boolean;
  /** A player's page: their name. */
  profile?: { username: string };
  /** An article's dates (ISO 8601). */
  dates?: { modified?: string; published?: string };
}): Metadata {
  const t = getDict(locale);
  const info = LOCALE_INFO[locale];
  const full = absoluteTitle ? title : `${title}${TITLE_SUFFIX}`;
  const alt = imageAlt ?? t.meta.ogAlt;
  const url = pathOf(locale);
  const og = {
    url,
    siteName: SITE_NAME,
    title: full,
    description,
    locale: info.og,
    alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_INFO[l].og),
    ...(image ? { images: [{ ...image, alt }] } : {}),
  };
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: languagesOf(pathOf) },
    openGraph:
      type === "profile"
        ? { ...og, type, ...(profile ? { username: profile.username } : {}) }
        : type === "article"
          ? { ...og, type, ...(dates?.modified ? { modifiedTime: dates.modified } : {}), ...(dates?.published ? { publishedTime: dates.published } : {}) }
          : { ...og, type },
    twitter: {
      card: "summary_large_image",
      site: X_HANDLE,
      creator: X_HANDLE,
      title: full,
      description,
      ...(image ? { images: [{ url: image.url, alt }] } : {}),
    },
    robots: index ? ROBOTS_INDEX : ROBOTS_NOINDEX,
  };
}

/** A page that isn't there (a player or a tournament): its title, out of search results. */
export function notFoundMetadata(title: string, description?: string): Metadata {
  return { title, ...(description ? { description } : {}), robots: ROBOTS_NOINDEX };
}

/** A home page: `/`, `/pt/`, `/es/`. */
export function homeMetadata(locale: Locale): Metadata {
  const t = getDict(locale);
  return pageMetadata({
    locale,
    pathOf: (l) => LOCALE_INFO[l].path,
    title: t.meta.title,
    description: t.meta.description,
    absoluteTitle: true,
  });
}

/** A legal page's metadata (the privacy policy, the terms of use). */
export function buildLegalMetadata(locale: Locale, doc: LegalDoc): Metadata {
  const t = getDict(locale);
  return pageMetadata({
    locale,
    pathOf: (l) => legalPath(l, doc),
    title: t.legal[doc],
    description: doc === "privacy" ? t.legal.privacyDescription : t.legal.termsDescription,
    type: "article",
    dates: { modified: `${LEGAL_UPDATED[doc]}T12:00:00Z` },
  });
}

/** The world ranking's metadata. */
export function buildRankingMetadata(locale: Locale): Metadata {
  const r = getDict(locale).ranking;
  return pageMetadata({ locale, pathOf: rankingPath, title: r.metaTitle, description: r.description });
}
