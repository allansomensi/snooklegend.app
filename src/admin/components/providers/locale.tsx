"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { translator, type Lang, type Translator } from "@/admin/i18n";
import { setApiWords } from "@/admin/lib/api";
import { formatters, type Formatters } from "@/admin/lib/format";
import { prefs, type Prefs, type Theme } from "@/admin/lib/prefs";

export interface Locale extends Translator, Formatters {
  theme: Theme;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
}

const LocaleContext = createContext<Locale | null>(null);

const SERVER_PREFS: Prefs = { lang: "en", theme: "dark" };

/** The language and theme, with the words and formats of the language. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const p = useSyncExternalStore(prefs.subscribe, prefs.get, () => SERVER_PREFS);
  const value = useMemo<Locale>(() => {
    const tr = translator(p.lang);
    setApiWords(tr);
    return {
      ...tr,
      ...formatters(tr),
      theme: p.theme,
      setLang: (lang) => prefs.set({ lang }),
      setTheme: (theme) => prefs.set({ theme }),
    };
  }, [p]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** The words (t, tf, tn) and formats (fmtNum, fmtDate…) of the language. */
export function useLocale(): Locale {
  const l = useContext(LocaleContext);
  if (!l) throw new Error("useLocale outside LocaleProvider");
  return l;
}
