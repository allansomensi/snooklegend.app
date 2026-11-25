import { tournamentsMetadata, TournamentsRoutePage } from "@/components/TournamentRoute";

export const revalidate = 60;
export const metadata = tournamentsMetadata("en");

export default function Page() {
  return <TournamentsRoutePage locale="en" />;
}
