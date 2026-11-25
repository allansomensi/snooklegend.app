import { notFound } from "next/navigation";
import { tournamentMetadata, TournamentRoutePage } from "@/components/TournamentRoute";

// A tournament's page (`/[lang]/torneios/<id>/`), made when first asked for and then kept a minute.
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/torneios/[id]">) {
  const { lang, id } = await params;
  return lang === "pt" ? tournamentMetadata("pt", id) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/torneios/[id]">) {
  const { lang, id } = await params;
  if (lang !== "pt") notFound();
  return <TournamentRoutePage locale="pt" raw={id} />;
}
