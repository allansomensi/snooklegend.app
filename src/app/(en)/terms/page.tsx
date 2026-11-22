import { LegalPage } from "@/components/LegalPage";
import { buildLegalMetadata } from "@/lib/metadata";

export const metadata = buildLegalMetadata("en", "terms");

export default function Page() {
  return <LegalPage locale="en" doc="terms" />;
}
