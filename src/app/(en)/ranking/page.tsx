import { RankingPage } from "@/components/RankingPage";
import { buildRankingMetadata } from "@/lib/metadata";

// Made with the ranking in it, then again at most every five minutes
// (RANKING_REVALIDATE); the browser keeps it live.
export const revalidate = 300;
export const metadata = buildRankingMetadata("en");

export default function Page() {
  return <RankingPage locale="en" />;
}
