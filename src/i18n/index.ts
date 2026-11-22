import en, { type Dict } from "./en";
import es from "./es";
import pt from "./pt";

export type { Dict };

export const LOCALES = ["en", "pt", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_INFO: Record<Locale, { name: string; short: string; htmlLang: string; og: string; path: string }> = {
  en: { name: "English", short: "EN", htmlLang: "en", og: "en_US", path: "/" },
  pt: { name: "Português", short: "PT", htmlLang: "pt-BR", og: "pt_BR", path: "/pt/" },
  es: { name: "Español", short: "ES", htmlLang: "es", og: "es_ES", path: "/es/" },
};

const DICTS: Record<Locale, Dict> = { en, pt, es };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Replaces `{name}` placeholders. */
export function fmt(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => (key in values ? String(values[key]) : `{${key}}`));
}
