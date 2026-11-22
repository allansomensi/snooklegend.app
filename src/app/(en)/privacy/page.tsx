import { LegalPage } from "@/components/LegalPage";
import { buildLegalMetadata } from "@/lib/metadata";

export const metadata = buildLegalMetadata("en", "privacy");

export default function Page() {
  return <LegalPage locale="en" doc="privacy" />;
}
