// The staff member's language and theme, remembered in this browser.
import { browserLang, isLang, type Lang } from "@/admin/i18n";

export type Theme = "dark" | "light";
/** Each theme's background (--bg in src/app/admin/globals.css): the colour
 * of a phone's bars around the portal (`theme-color`). */
export const THEME_COLORS: Record<Theme, string> = { dark: "#0e0c0a", light: "#f4f1ec" };
export const KEYS = { lang: "snook-legend-admin-lang", theme: "snook-legend-admin-theme" } as const;

export interface Prefs {
  lang: Lang;
  theme: Theme;
}

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode */
  }
};

let state: Prefs | null = null;
const listeners = new Set<() => void>();

function initial(): Prefs {
  const lang = read(KEYS.lang);
  const theme = read(KEYS.theme);
  return {
    lang: isLang(lang) ? lang : browserLang(),
    theme: theme === "light" || theme === "dark" ? theme : matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark",
  };
}

/** A phone's bars in the chosen theme's colour: the layout gives one per
 * system theme, the one chosen in the portal wins (src/app/admin/pwa.tsx
 * paints them again when a page change puts them back). */
export function paintThemeColor(theme: Theme) {
  for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    if (m.content !== THEME_COLORS[theme]) m.content = THEME_COLORS[theme];
  }
}

function apply(p: Prefs) {
  document.documentElement.dataset.theme = p.theme;
  document.documentElement.lang = p.lang;
  paintThemeColor(p.theme);
}

export const prefs = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get(): Prefs {
    if (!state) {
      state = initial();
      apply(state);
    }
    return state;
  },
  set(next: Partial<Prefs>) {
    state = { ...prefs.get(), ...next };
    if (next.lang) write(KEYS.lang, next.lang);
    if (next.theme) write(KEYS.theme, next.theme);
    apply(state);
    for (const l of listeners) l();
  },
};

/** Sets the theme before the first paint (an inline script with the page's
 * nonce), so a light-theme user never sees a dark flash. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(KEYS.theme)});if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t}catch(e){}`;
