import { tournamentCard } from "@/components/TournamentOgImage";

// The tournament's picture for social networks (the page's og:image), at an
// address ending in .png, which the trailing-slash redirect leaves alone.
export const revalidate = 60;

export async function GET(_request: Request, { params }: RouteContext<"/tournaments/[id]/card.png">) {
  return tournamentCard("en", (await params).id);
}
