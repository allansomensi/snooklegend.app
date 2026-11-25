import { rulesMetadata, RulesRoutePage } from "@/components/PageRoutes";

export const metadata = rulesMetadata("en");

export default function Page() {
  return <RulesRoutePage locale="en" />;
}
