import { OG_SIZE, tournamentOgImage } from "@/components/TournamentOgImage";

export const revalidate = 60;
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Snook Legend";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  return tournamentOgImage("pt", (await params).id);
}
