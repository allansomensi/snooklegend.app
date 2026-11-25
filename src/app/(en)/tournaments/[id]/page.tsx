import { tournamentMetadata, TournamentRoutePage } from "@/components/TournamentRoute";

// A tournament's page, made when first asked for and then kept a minute.
export const revalidate = 60;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/tournaments/[id]">) {
  return tournamentMetadata("en", (await params).id);
}

export default async function Page({ params }: PageProps<"/tournaments/[id]">) {
  return <TournamentRoutePage locale="en" raw={(await params).id} />;
}
