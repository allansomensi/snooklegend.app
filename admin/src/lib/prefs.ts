// The staff member's language and theme, remembered in this browser.
import { browserLang, isLang, type Lang } from "@/i18n";

export type Theme = "dark" | "light";
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

function apply(p: Prefs) {
  document.documentElement.dataset.theme = p.theme;
  document.documentElement.lang = p.lang;
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
