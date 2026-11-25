// Numbers, dates and countries in the visitor's language.

import { LOCALE_INFO, type Locale } from "@/i18n";

const lang = (locale: Locale) => LOCALE_INFO[locale].htmlLang;

/** A date (Unix seconds), as "25 Nov 2026" in the page's language (UTC, so the server and the browser agree). */
export function formatDate(locale: Locale, unix: number, style: "medium" | "long" = "medium"): string {
  return new Intl.DateTimeFormat(lang(locale), { dateStyle: style, timeZone: "UTC" }).format(new Date(unix * 1000));
}

/** A date and time (Unix seconds), UTC, with the zone named. */
export function formatDateTime(locale: Locale, unix: number): string {
  return new Intl.DateTimeFormat(lang(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(unix * 1000));
}

/** A month and year: "March 2026". */
export function formatMonth(locale: Locale, unix: number): string {
  return new Intl.DateTimeFormat(lang(locale), { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(unix * 1000));
}

export function formatNumber(locale: Locale, n: number): string {
  return new Intl.NumberFormat(lang(locale)).format(n);
}

/** A change of rating: "+12", "−8" (a real minus sign), "0". */
export function signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0";
}

/** A country's name from its code ("BR" → "Brazil", "Brasil"), or "" for none. */
export function countryName(locale: Locale, code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  try {
    return new Intl.DisplayNames([lang(locale)], { type: "region" }).of(code) ?? "";
  } catch {
    return "";
  }
}

/** An ISO 8601 date (for structured data). */
export function isoDate(unix: number): string {
  return new Date(unix * 1000).toISOString();
}
