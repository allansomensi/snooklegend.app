import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/LegalPage";
import { isLocale, type Locale } from "@/i18n";
import { buildLegalMetadata } from "@/lib/metadata";
import { LEGAL_DOCS, LEGAL_SLUGS, type LegalDoc } from "@/lib/site";

// The legal pages in Portuguese and Spanish, under each language's own words
// (`/pt/privacidade/`, `/es/terminos/`…); English's are `/privacy/` and `/terms/`.
export const dynamicParams = false;
export function generateStaticParams({ params }: { params: { lang: string } }) {
  const { lang } = params;
  if (!isLocale(lang) || lang === "en") return [];
  return LEGAL_DOCS.map((d) => ({ doc: LEGAL_SLUGS[lang][d] }));
}

function docOf(lang: Locale, slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => LEGAL_SLUGS[lang][d] === slug);
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[doc]">): Promise<Metadata> {
  const { lang, doc } = await params;
  const d = isLocale(lang) ? docOf(lang, doc) : undefined;
  return isLocale(lang) && d ? buildLegalMetadata(lang, d) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/[doc]">) {
  const { lang, doc } = await params;
  if (!isLocale(lang) || lang === "en") notFound();
  const d = docOf(lang, doc);
  if (!d) notFound();
  return <LegalPage locale={lang} doc={d} />;
}
