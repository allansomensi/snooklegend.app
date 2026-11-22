import type { MetadataRoute } from "next";
import { LOCALE_INFO, LOCALES } from "@/i18n";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((l) => [LOCALE_INFO[l].htmlLang, SITE_URL + LOCALE_INFO[l].path]));
  return LOCALES.map((l) => ({
    url: SITE_URL + LOCALE_INFO[l].path,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: l === "en" ? 1 : 0.9,
    alternates: { languages },
  }));
}
