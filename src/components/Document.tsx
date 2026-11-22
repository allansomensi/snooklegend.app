import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { LOCALE_INFO, type Locale } from "@/i18n";
import "../app/globals.css";

// Latin covers English, Portuguese and Spanish; both faces are variable fonts
// (one file each). The monospaced one is only for commands, further down.
const body = Geist({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display-face", display: "swap" });
const code = Geist_Mono({ subsets: ["latin"], variable: "--font-code", display: "swap", preload: false });

/**
 * Runs before the page paints: marks that scripts run (for the scroll-in
 * animations) and, on the English home page, sends a first-time visitor
 * whose browser speaks Portuguese or Spanish to their language.
 */
function bootScript(locale: Locale, redirect: boolean) {
  const go =
    locale === "en" && redirect
      ? `var s=null;try{s=localStorage.getItem('sl-lang')}catch(e){}
if(!s){var l=((navigator.languages&&navigator.languages[0])||navigator.language||'').toLowerCase();
if(l.indexOf('pt')===0)s='pt';else if(l.indexOf('es')===0)s='es';}
if(s==='pt'||s==='es'){location.replace('/'+s+'/'+location.search+location.hash);}`
      : "";
  return `(function(){document.documentElement.classList.add('js');${go}})();`;
}

export function Document({ locale, children, redirect = true }: { locale: Locale; children: ReactNode; redirect?: boolean }) {
  return (
    <html
      lang={LOCALE_INFO[locale].htmlLang}
      className={`${body.variable} ${display.variable} ${code.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript(locale, redirect) }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
