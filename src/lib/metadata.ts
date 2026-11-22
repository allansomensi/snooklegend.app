import type { Metadata, Viewport } from "next";
import { getDict, LOCALE_INFO, LOCALES, type Locale } from "@/i18n";
import { legalPath, SITE_URL, type LegalDoc } from "./site";

export const VIEWPORT: Viewport = {
  themeColor: "#040907",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function buildMetadata(locale: Locale): Metadata {
  const t = getDict(locale);
  const info = LOCALE_INFO[locale];
  const languages: Record<string, string> = { "x-default": "/" };
  for (const l of LOCALES) languages[LOCALE_INFO[l].htmlLang] = LOCALE_INFO[l].path;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.title, template: `%s · ${t.meta.shortTitle}` },
    description: t.meta.description,
    applicationName: "Snook Legend",
    keywords: [
      "Snook Legend",
      "pool",
      "8 ball",
      "eight-ball",
      "billiards",
      "sinuca",
      "bilhar",
      "bola 8",
      "billar",
      "pool online",
      "3D pool game",
      "Windows",
      "macOS",
      "Linux",
    ],
    authors: [{ name: "Snook Legend" }],
    category: "games",
    alternates: { canonical: info.path, languages },
    openGraph: {
      type: "website",
      url: info.path,
      siteName: "Snook Legend",
      title: t.meta.title,
      description: t.meta.description,
      locale: info.og,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_INFO[l].og),
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
      images: ["/og.jpg"],
    },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

/** A legal page's metadata (on top of its language's, from the layout). */
export function buildLegalMetadata(locale: Locale, doc: LegalDoc): Metadata {
  const t = getDict(locale);
  const info = LOCALE_INFO[locale];
  const languages: Record<string, string> = { "x-default": legalPath("en", doc) };
  for (const l of LOCALES) languages[LOCALE_INFO[l].htmlLang] = legalPath(l, doc);
  const title = t.legal[doc];
  const description = doc === "privacy" ? t.legal.privacyDescription : t.legal.termsDescription;
  return {
    title,
    description,
    alternates: { canonical: legalPath(locale, doc), languages },
    openGraph: {
      type: "article",
      url: legalPath(locale, doc),
      siteName: "Snook Legend",
      title: `${title} · Snook Legend`,
      description,
      locale: info.og,
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    twitter: { card: "summary", title: `${title} · Snook Legend`, description },
    robots: { index: true, follow: true },
  };
}
