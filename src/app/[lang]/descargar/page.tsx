import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { downloadMetadata, DownloadRoutePage } from "@/components/PageRoutes";
import { isLocale } from "@/i18n";

// Only in the language(s) whose word this is.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "es" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/descargar">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) && lang !== "en" ? downloadMetadata(lang) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/descargar">) {
  const { lang } = await params;
  if (!isLocale(lang) || lang === "en") notFound();
  return <DownloadRoutePage locale={lang} />;
}
