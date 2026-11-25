import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { rulesMetadata, RulesRoutePage } from "@/components/PageRoutes";
import { isLocale } from "@/i18n";

// Only in the language(s) whose word this is.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "pt" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/regras">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) && lang !== "en" ? rulesMetadata(lang) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/regras">) {
  const { lang } = await params;
  if (!isLocale(lang) || lang === "en") notFound();
  return <RulesRoutePage locale={lang} />;
}
