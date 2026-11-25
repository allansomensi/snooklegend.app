import type { ReactNode } from "react";
import { getDict, LOCALE_INFO, type Locale } from "@/i18n";
import { getLatestRelease } from "@/lib/release";
import { SITE_URL } from "@/lib/site";
import { DownloadButton } from "./DownloadButton";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { PlatformProvider } from "./PlatformProvider";

/**
 * A page of the site (not the home page): the header, the page, the footer.
 * `paths`: this page in each language, for the language switches.
 */
export async function SiteFrame({
  locale,
  paths,
  children,
  glow = true,
}: {
  locale: Locale;
  paths: Record<Locale, string>;
  children: ReactNode;
  /** The felt's glow at the top, as on the home page. */
  glow?: boolean;
}) {
  const t = getDict(locale);
  const release = await getLatestRelease();
  const htmlLang = LOCALE_INFO[locale].htmlLang;
  return (
    <PlatformProvider t={{ modal: t.modal, download: t.download, os: t.os }} release={release} locale={htmlLang}>
      <Header t={{ nav: t.nav, hero: t.hero, os: t.os }} locale={locale} paths={paths} />
      <main id="main" className="relative overflow-x-clip pb-24 pt-[calc(var(--header-h)+2rem)] sm:pt-[calc(var(--header-h)+3rem)]">
        {glow && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(60%_55%_at_50%_0%,rgb(24_138_74/0.28),transparent_70%)]"
          />
        )}
        {children}
      </main>
      <Footer t={t} locale={locale} version={release.version} paths={paths} />
    </PlatformProvider>
  );
}

/** A page's title block: the kicker, the heading (the page's only `h1`) and a line under it. */
export function PageHeader({
  kicker,
  title,
  sub,
  children,
  align = "center",
}: {
  kicker: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  align?: "center" | "left";
}) {
  const center = align === "center";
  return (
    <header className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className={`kicker ${center ? "justify-center" : ""}`}>{kicker}</p>
      <h1 className="mt-4 text-balance font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-[-0.03em] text-cream sm:text-6xl">
        {title}
      </h1>
      {sub && <p className={`mt-5 text-pretty text-[17px] leading-relaxed text-mist sm:text-lg ${center ? "mx-auto max-w-2xl" : ""}`}>{sub}</p>}
      {children}
    </header>
  );
}

/** Structured data for search engines (JSON-LD), safe inside a script tag. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export type Crumb = { name: string; path: string };

/** The way here from the home page: shown small above the title, and told to search engines. */
export function Breadcrumbs({ locale, items }: { locale: Locale; items: Crumb[] }) {
  const t = getDict(locale);
  const all: Crumb[] = [{ name: t.common.home, path: LOCALE_INFO[locale].path }, ...items];
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: SITE_URL + c.path })),
  };
  return (
    <>
      <JsonLd data={data} />
      <nav aria-label={t.common.breadcrumbs} className="container-page">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fog">
          {all.map((c, i) => (
            <li key={c.path} className="flex min-w-0 items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i < all.length - 1 ? (
                <a href={c.path} className="rounded transition hover:text-cream">
                  {c.name}
                </a>
              ) : (
                <span aria-current="page" className="truncate text-mist">
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** The closing call to download the game. */
export function DownloadCta({ locale, text }: { locale: Locale; text: string }) {
  const t = getDict(locale);
  return (
    <div className="container-page">
      <div className="mx-auto mt-20 flex max-w-3xl flex-col items-center gap-5 rounded-3xl bg-gradient-to-b from-felt-800/40 to-ink-900/60 px-6 py-10 text-center ring-1 ring-felt-500/20 sm:px-8">
        <p className="text-balance font-display text-2xl font-bold tracking-tight text-cream">{text}</p>
        <DownloadButton t={{ hero: t.hero, os: t.os }} locale={locale} size="md" />
      </div>
    </div>
  );
}
