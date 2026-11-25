import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supportersMetadata, SupportersRoutePage } from "@/components/PageRoutes";
import { isLocale } from "@/i18n";

export const revalidate = 60;
// Only in the language(s) whose word this is.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "es" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/mecenas">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) && lang !== "en" ? supportersMetadata(lang) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/mecenas">) {
  const { lang } = await params;
  if (!isLocale(lang) || lang === "en") notFound();
  return <SupportersRoutePage locale={lang} />;
}
