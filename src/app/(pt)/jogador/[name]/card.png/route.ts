import { playerCard } from "@/components/PlayerOgImage";

// The player's picture for social networks (the page's og:image), at an
// address ending in .png, which the trailing-slash redirect leaves alone.
export const revalidate = 60;

export async function GET(_request: Request, { params }: RouteContext<"/jogador/[name]/card.png">) {
  return playerCard("pt", (await params).name);
}
