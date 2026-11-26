// The metadata and pages of the download page, the rules guide, the rating
// calculator and the supporters, shared by their address in each language.

import type { Metadata } from "next";
import { getDict, type Locale } from "@/i18n";
import { BUILDING, ServerUnavailable } from "@/lib/api";
import { pageMetadata } from "@/lib/metadata";
import { pagePath } from "@/lib/routes";
import { RULES_UPDATED } from "@/lib/rules-guide";
import { fetchSupporters } from "@/lib/supporters";
import { DownloadPage } from "./DownloadPage";
import { RatingPage } from "./RatingPage";
import { RulesGuide } from "./RulesGuide";
import { SupportersPage } from "./SupportersPage";

export function downloadMetadata(locale: Locale): Metadata {
  const p = getDict(locale).downloadPage;
  return pageMetadata({ locale, pathOf: (l) => pagePath(l, "download"), title: p.title, description: p.description });
}

export function rulesMetadata(locale: Locale): Metadata {
  const g = getDict(locale).guide;
  return pageMetadata({
    locale,
    pathOf: (l) => pagePath(l, "rules"),
    title: g.title,
    description: g.description,
    type: "article",
    dates: { modified: `${RULES_UPDATED}T12:00:00Z` },
  });
}

export function ratingMetadata(locale: Locale): Metadata {
  const c = getDict(locale).calc;
  return pageMetadata({ locale, pathOf: (l) => pagePath(l, "rating"), title: c.title, description: c.description });
}

export function supportersMetadata(locale: Locale): Metadata {
  const s = getDict(locale).supporters;
  return pageMetadata({ locale, pathOf: (l) => pagePath(l, "supporters"), title: s.title, description: s.description });
}

export function DownloadRoutePage({ locale }: { locale: Locale }) {
  return <DownloadPage locale={locale} />;
}

export function RulesRoutePage({ locale }: { locale: Locale }) {
  return <RulesGuide locale={locale} />;
}

export function RatingRoutePage({ locale }: { locale: Locale }) {
  return <RatingPage locale={locale} />;
}

export async function SupportersRoutePage({ locale }: { locale: Locale }) {
  const res = await fetchSupporters();
  // While building, made without the list (and again a minute later); afterwards a failure keeps the last good page.
  if (!res.ok && !BUILDING) throw new ServerUnavailable("supporters", res.status);
  return <SupportersPage locale={locale} list={res.ok ? res.data : null} />;
}
