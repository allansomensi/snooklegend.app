import { notFound } from "next/navigation";
import { tournamentMetadata, TournamentRoutePage } from "@/components/TournamentRoute";

// A tournament's page (`/[lang]/torneos/<id>/`), made when first asked for and then kept a minute.
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/torneos/[id]">) {
  const { lang, id } = await params;
  return lang === "es" ? tournamentMetadata("es", id) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/torneos/[id]">) {
  const { lang, id } = await params;
  if (lang !== "es") notFound();
  return <TournamentRoutePage locale="es" raw={id} />;
}
