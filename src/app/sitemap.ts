import type { MetadataRoute } from "next";
import { LOCALE_INFO, LOCALES } from "@/i18n";
import { LEGAL_DOCS, legalPath, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((l) => [LOCALE_INFO[l].htmlLang, SITE_URL + LOCALE_INFO[l].path]));
  const home: MetadataRoute.Sitemap = LOCALES.map((l) => ({
    url: SITE_URL + LOCALE_INFO[l].path,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: l === "en" ? 1 : 0.9,
    alternates: { languages },
  }));
  // The privacy policy and the terms of use, in each language.
  const legal: MetadataRoute.Sitemap = LEGAL_DOCS.flatMap((doc) => {
    const alternates = Object.fromEntries(LOCALES.map((l) => [LOCALE_INFO[l].htmlLang, SITE_URL + legalPath(l, doc)]));
    return LOCALES.map((l) => ({
      url: SITE_URL + legalPath(l, doc),
      changeFrequency: "yearly" as const,
      priority: 0.3,
      alternates: { languages: alternates },
    }));
  });
  return [...home, ...legal];
}
