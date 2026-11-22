// The portal's words. English is the key: the Portuguese (Brazil) and
// Spanish are in pt-BR.json and es.json. Every text shown goes through
// the functions t, tf and tn, or msg for tables of labels (a test checks that each
// has both translations).
import es from "./es.json";
import ptBR from "./pt-BR.json";

export const LANGS = [
  ["pt-BR", "Português (Brasil)"],
  ["en", "English"],
  ["es", "Español"],
] as const;

export type Lang = (typeof LANGS)[number][0];

const DICT: Record<Lang, Record<string, string>> = { "pt-BR": ptBR, es, en: {} };

export const isLang = (s: unknown): s is Lang => LANGS.some(([c]) => c === s);

/** The language of the browser, when the staff member chose none. */
export function browserLang(): Lang {
  const list = typeof navigator === "undefined" ? [] : navigator.languages || [navigator.language];
  for (const l of list) {
    const s = String(l).toLowerCase();
    if (s.startsWith("pt")) return "pt-BR";
    if (s.startsWith("es")) return "es";
    if (s.startsWith("en")) return "en";
  }
  return "en";
}

/** Marks a text to translate later (tables of labels): it stays English. */
export const msg = (s: string): string => s;

export type Vars = Record<string, string | number>;

export interface Translator {
  lang: Lang;
  /** A text in the chosen language (English is the key). */
  t: (s: string) => string;
  /** A text with {placeholders}. */
  tf: (s: string, vars: Vars) => string;
  /** "1 game" / "5 games": `one` and `many` carry {n}. */
  tn: (n: number, one: string, many: string) => string;
}

export function translator(lang: Lang): Translator {
  const d = DICT[lang];
  const t = (s: string) => d[s] || s;
  const tf = (s: string, vars: Vars) =>
    t(s).replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
  const num = new Intl.NumberFormat(lang);
  const tn = (n: number, one: string, many: string) => tf(n === 1 ? one : many, { n: num.format(n) });
  return { lang, t, tf, tn };
}
