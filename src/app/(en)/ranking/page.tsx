import { RankingPage } from "@/components/RankingPage";
import { buildRankingMetadata } from "@/lib/metadata";

export const metadata = buildRankingMetadata("en");

export default function Page() {
  return <RankingPage locale="en" />;
}
