import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ratingMetadata, RatingRoutePage } from "@/components/PageRoutes";
import { isLocale } from "@/i18n";

// Only in the language(s) whose word this is.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "pt" }, { lang: "es" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/rating">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) && lang !== "en" ? ratingMetadata(lang) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/rating">) {
  const { lang } = await params;
  if (!isLocale(lang) || lang === "en") notFound();
  return <RatingRoutePage locale={lang} />;
}
