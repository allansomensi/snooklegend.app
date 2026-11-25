import type { Metadata } from "next";
import { tournamentsMetadata, TournamentsRoutePage } from "@/components/TournamentRoute";

// The tournaments in this page's language only (`/[lang]/torneios/`).
export const revalidate = 60;
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "pt" }];
}

export const metadata: Metadata = tournamentsMetadata("pt");

export default function Page() {
  return <TournamentsRoutePage locale="pt" />;
}
