"use client";

import { RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n";
import { EightBall } from "./icons";

// Its words here, not from the dictionaries: they'd all come to the browser with it.
const WORDS: Record<Locale, { home: string; unavailable: string; retry: string; backHome: string }> = {
  en: {
    home: "/",
    unavailable: "The game server didn't answer. It may be waking up: try again in a minute.",
    retry: "Try again",
    backHome: "Back to the home page",
  },
  pt: {
    home: "/pt/",
    unavailable: "O servidor do jogo não respondeu. Ele pode estar acordando: tente de novo em um minuto.",
    retry: "Tentar de novo",
    backHome: "Voltar para o início",
  },
  es: {
    home: "/es/",
    unavailable: "El servidor del juego no respondió. Puede estar despertando: vuelve a intentarlo en un minuto.",
    retry: "Reintentar",
    backHome: "Volver al inicio",
  },
};

/** The language of the page at `path`. */
function localeOf(path: string): Locale {
  if (path.startsWith("/pt/") || path.startsWith("/jogador/")) return "pt";
  if (path.startsWith("/es/")) return "es";
  return "en";
}

/** When the game server didn't answer for a page that needs it (the server may be waking up). */
export function ErrorView({ reset }: { reset: () => void }) {
  const locale = localeOf(usePathname() ?? "/");
  const t = WORDS[locale];
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-md">
        <EightBall className="mx-auto size-20 animate-float drop-shadow-[0_20px_30px_rgb(0_0_0/0.6)]" />
        <p className="mt-8 text-pretty text-lg text-cream">{t.unavailable}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-felt h-12 px-6">
            <RefreshCw className="size-4" aria-hidden /> {t.retry}
          </button>
          <a href={t.home} className="btn btn-ghost h-12 px-5">
            {t.backHome}
          </a>
        </div>
      </div>
    </main>
  );
}
