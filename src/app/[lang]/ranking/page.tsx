import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RankingPage } from "@/components/RankingPage";
import { isLocale } from "@/i18n";
import { buildRankingMetadata } from "@/lib/metadata";

// The ranking in Portuguese and Spanish (`/pt/ranking/`, `/es/ranking/`);
// English's is `/ranking/`. Made with the ranking in it, then again at most
// every five minutes (RANKING_REVALIDATE); the browser keeps it live.
export const revalidate = 300;
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "pt" }, { lang: "es" }];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/ranking">): Promise<Metadata> {
  const { lang } = await params;
  return isLocale(lang) ? buildRankingMetadata(lang) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/ranking">) {
  const { lang } = await params;
  if (!isLocale(lang) || lang === "en") notFound();
  return <RankingPage locale={lang} />;
}
