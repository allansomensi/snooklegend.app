import { SearchX } from "lucide-react";
import { getDict, LOCALE_INFO, type Locale } from "@/i18n";
import { rankingPath } from "@/lib/ranking";
import { pagePath, pathsOf } from "@/lib/routes";
import { SiteFrame } from "./SiteFrame";

/** The 404 of a player or a tournament that isn't there, in the site's frame and the page's language. */
export async function NotFoundView({ locale, kind }: { locale: Locale; kind: "player" | "tournament" }) {
  const t = getDict(locale);
  const words = kind === "player" ? t.player : t.tournaments;
  const back =
    kind === "player"
      ? { href: rankingPath(locale), label: t.player.toRanking, paths: pathsOf(rankingPath) }
      : { href: pagePath(locale, "tournaments"), label: t.tournaments.allTournaments, paths: pathsOf((l) => pagePath(l, "tournaments")) };
  return (
    <SiteFrame locale={locale} paths={back.paths}>
      <div className="container-page grid min-h-[50vh] place-items-center text-center">
        <div className="max-w-lg">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/[0.04] text-gold-300 ring-1 ring-white/[0.08]">
            <SearchX className="size-7" aria-hidden />
          </span>
          <p className="mt-6 font-display text-6xl font-extrabold text-gold">404</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-cream">{words.notFoundTitle}</h1>
          <p className="mt-3 text-pretty text-mist">{words.notFoundText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={back.href} className="btn btn-felt h-12 px-6">
              {back.label}
            </a>
            <a href={LOCALE_INFO[locale].path} className="btn btn-ghost h-12 px-5">
              {t.common.backHome}
            </a>
          </div>
        </div>
      </div>
    </SiteFrame>
  );
}
