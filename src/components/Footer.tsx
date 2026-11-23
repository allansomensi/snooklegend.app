import { LOCALE_INFO, LOCALES, type Dict, type Locale } from "@/i18n";
import {
  CHANGELOG_URL,
  GITHUB_URL,
  ISSUES_URL,
  legalPath,
  LICENSE_URL,
  RELEASES_URL,
  TRANSLATIONS_URL,
} from "@/lib/site";
import { rankingPath } from "@/lib/ranking";
import { GithubIcon } from "./icons";
import { LiveVersion } from "./LiveVersion";

export function Footer({
  t,
  locale,
  version,
  paths,
}: {
  t: Dict;
  locale: Locale;
  version: string;
  /** This page in each language (the home page's when left out). */
  paths?: Record<Locale, string>;
}) {
  const l = t.footer.links;
  const home = LOCALE_INFO[locale].path;
  const cols = [
    {
      title: t.footer.game,
      links: [
        { href: `${home}#download`, label: l.download },
        { href: rankingPath(locale), label: l.ranking },
        { href: `${home}#features`, label: l.features },
        { href: `${home}#rules`, label: l.rules },
        { href: `${home}#faq`, label: l.faq },
      ],
    },
    {
      title: t.footer.help,
      links: [
        { href: CHANGELOG_URL, label: l.changelog, ext: true },
        { href: RELEASES_URL, label: l.releases, ext: true },
        { href: ISSUES_URL, label: l.issues, ext: true },
        { href: legalPath(locale, "terms"), label: l.terms },
        { href: legalPath(locale, "privacy"), label: l.privacy },
      ],
    },
    {
      title: t.footer.project,
      links: [
        { href: GITHUB_URL, label: l.github, ext: true },
        { href: TRANSLATIONS_URL, label: l.translations, ext: true },
        { href: LICENSE_URL, label: l.license, ext: true },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-white/[0.07] bg-ink-950">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-16 sm:grid-cols-3 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-12">
        <div className="col-span-2 sm:col-span-3 md:col-span-1">
          <a href={LOCALE_INFO[locale].path} className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/icon-128.webp" alt="" width={44} height={44} loading="lazy" className="size-11 rounded-xl" />
            <span className="font-display text-xl font-bold text-cream">
              Snook <span className="text-gold">Legend</span>
            </span>
          </a>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">{t.footer.tagline}</p>
          <div className="mt-6 flex items-center gap-2">
            {LOCALES.map((code) => (
              <a
                key={code}
                href={paths?.[code] ?? LOCALE_INFO[code].path}
                hrefLang={LOCALE_INFO[code].htmlLang}
                lang={LOCALE_INFO[code].htmlLang}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  code === locale ? "bg-white/10 text-cream" : "text-mist hover:bg-white/[0.05] hover:text-cream"
                }`}
              >
                {LOCALE_INFO[code].name}
              </a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300/90">{c.title}</h3>
            <ul className="mt-3 space-y-0.5">
              {c.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    {...("ext" in link && link.ext ? { target: "_blank", rel: "noopener" } : {})}
                    className="inline-block py-1.5 text-sm text-cream/70 transition hover:text-cream"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-fog sm:flex-row">
          <p>
            © {new Date().getFullYear()} Snook Legend · <LiveVersion built={version} /> · {t.footer.made}
          </p>
          <a href={GITHUB_URL} target="_blank" rel="noopener" className="flex items-center gap-2 py-1 transition hover:text-cream">
            <GithubIcon className="size-4" aria-hidden="true" /> allansomensi/snook-legend
          </a>
        </div>
      </div>
    </footer>
  );
}
