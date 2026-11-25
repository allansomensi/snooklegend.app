import { ratingMetadata, RatingRoutePage } from "@/components/PageRoutes";

export const metadata = ratingMetadata("en");

export default function Page() {
  return <RatingRoutePage locale="en" />;
}
