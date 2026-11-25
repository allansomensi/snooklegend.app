import { playerMetadata, PlayerRoutePage } from "@/components/PlayerRoute";

// A player's page, made when first asked for and then kept a minute.
export const revalidate = 60;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/jogador/[name]">) {
  return playerMetadata("pt", (await params).name);
}

export default async function Page({ params }: PageProps<"/jogador/[name]">) {
  return <PlayerRoutePage locale="pt" raw={(await params).name} />;
}
