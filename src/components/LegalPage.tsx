import { getDict, LOCALE_INFO, LOCALES, type Locale } from "@/i18n";
import { legalHtml } from "@/lib/legal";
import { getLatestRelease } from "@/lib/release";
import { legalPath, type LegalDoc } from "@/lib/site";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { PlatformProvider } from "./PlatformProvider";

/** A legal page (the privacy policy, the terms of use) in the site's frame. */
export async function LegalPage({ locale, doc }: { locale: Locale; doc: LegalDoc }) {
  const t = getDict(locale);
  const release = await getLatestRelease();
  const htmlLang = LOCALE_INFO[locale].htmlLang;
  // This page in each language: the language switches go there.
  const paths = Object.fromEntries(LOCALES.map((l) => [l, legalPath(l, doc)])) as Record<Locale, string>;
  const other: LegalDoc = doc === "privacy" ? "terms" : "privacy";

  return (
    <PlatformProvider t={{ modal: t.modal, download: t.download, os: t.os }} release={release} locale={htmlLang}>
      <Header t={{ nav: t.nav, hero: t.hero, os: t.os }} locale={locale} paths={paths} />
      <main id="main" className="container-page pb-24 pt-[calc(var(--header-h)+3rem)] sm:pt-[calc(var(--header-h)+4.5rem)]">
        <article className="legal mx-auto max-w-3xl" dangerouslySetInnerHTML={{ __html: legalHtml(doc, locale) }} />
        <p className="mx-auto mt-16 max-w-3xl border-t border-white/[0.07] pt-8 text-sm text-mist">
          {t.legal.other}:{" "}
          <a href={legalPath(locale, other)} className="font-semibold text-gold-300 transition hover:text-gold-200">
            {t.legal[other]}
          </a>
        </p>
      </main>
      <Footer t={t} locale={locale} version={release.version} paths={paths} />
    </PlatformProvider>
  );
}
