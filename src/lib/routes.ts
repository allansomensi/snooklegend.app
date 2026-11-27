// The site's pages and their address in each language. English lives at
// "/", Portuguese under "/pt/" and Spanish under "/es/", each with its own
// words; one exception, asked for by name: a player's page in Portuguese is
// `/jogador/<name>/` (`/pt/jogador/<name>/` redirects there, next.config.ts).

import { LOCALE_INFO, LOCALES, type Locale } from "@/i18n";
import { SITE_URL } from "./site";

/** The pages with a slug of their own in each language. */
export const PAGE_SLUGS = {
  download: { en: "download", pt: "baixar", es: "descargar" },
  rules: { en: "rules", pt: "regras", es: "reglas" },
  rating: { en: "rating", pt: "rating", es: "rating" },
  supporters: { en: "supporters", pt: "apoiadores", es: "mecenas" },
  tournaments: { en: "tournaments", pt: "torneios", es: "torneos" },
  // Opened from the game server's e-mails (crates/server/src/mail.rs in the
  // game's repository has these addresses too): change them together.
  resetPassword: { en: "reset-password", pt: "redefinir-senha", es: "restablecer-contrasena" },
  confirmEmail: { en: "confirm-email", pt: "confirmar-email", es: "confirmar-correo" },
} as const satisfies Record<string, Record<Locale, string>>;

export type PageKey = keyof typeof PAGE_SLUGS;

/** A page's address: `/rules/`, `/pt/regras/`, `/es/reglas/`… */
export function pagePath(locale: Locale, page: PageKey): string {
  return `${LOCALE_INFO[locale].path}${PAGE_SLUGS[page][locale]}/`;
}

/** The player-page prefix in each language. */
export const PLAYER_PREFIX: Record<Locale, string> = { en: "/player/", pt: "/jogador/", es: "/es/jugador/" };

/** A player's page: `/player/ana/`, `/jogador/ana/`, `/es/jugador/ana/`. */
export function playerPath(locale: Locale, name: string): string {
  return `${PLAYER_PREFIX[locale]}${encodeURIComponent(name)}/`;
}

/** A tournament's page: `/tournaments/42/`, `/pt/torneios/42/`, `/es/torneos/42/`. */
export function tournamentPath(locale: Locale, id: number | string): string {
  return `${pagePath(locale, "tournaments")}${id}/`;
}

/** This page in each language (for the language switches). */
export function pathsOf(pathOf: (l: Locale) => string): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, pathOf(l)])) as Record<Locale, string>;
}

/**
 * `hreflang` alternates: each language (the same on every version of the
 * page, so they point at each other), and English for everyone else.
 */
export function languagesOf(pathOf: (l: Locale) => string, absolute = false): Record<string, string> {
  const base = absolute ? SITE_URL : "";
  const out: Record<string, string> = {};
  for (const l of LOCALES) for (const code of LOCALE_INFO[l].hreflang) out[code] = base + pathOf(l);
  out["x-default"] = base + pathOf("en");
  return out;
}
