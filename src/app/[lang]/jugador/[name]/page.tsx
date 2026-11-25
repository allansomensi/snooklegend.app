import { notFound } from "next/navigation";
import { playerMetadata, PlayerRoutePage } from "@/components/PlayerRoute";

// A player's page in Spanish (`/es/jugador/<name>/`), made when first asked
// for and then kept a minute. In Portuguese it's `/jogador/<name>/`.
export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/jugador/[name]">) {
  const { lang, name } = await params;
  return lang === "es" ? playerMetadata("es", name) : {};
}

export default async function Page({ params }: PageProps<"/[lang]/jugador/[name]">) {
  const { lang, name } = await params;
  if (lang !== "es") notFound();
  return <PlayerRoutePage locale="es" raw={name} />;
}
