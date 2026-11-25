import type { Metadata } from "next";
import { tournamentsMetadata, TournamentsRoutePage } from "@/components/TournamentRoute";

// The tournaments in this page's language only (`/[lang]/torneos/`).
export const revalidate = 60;
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: "es" }];
}

export const metadata: Metadata = tournamentsMetadata("es");

export default function Page() {
  return <TournamentsRoutePage locale="es" />;
}
