import { Document } from "@/components/Document";
import { buildMetadata, VIEWPORT } from "@/lib/metadata";

// The Portuguese pages that live outside `/pt/`: a player's page is
// `/jogador/<name>/` (the address the game and its players share).
export const metadata = buildMetadata("pt");
export const viewport = VIEWPORT;

export default function PortugueseRootLayout({ children }: { children: React.ReactNode }) {
  return <Document locale="pt">{children}</Document>;
}
