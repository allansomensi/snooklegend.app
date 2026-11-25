import { supportersMetadata, SupportersRoutePage } from "@/components/PageRoutes";

export const revalidate = 60;
export const metadata = supportersMetadata("en");

export default function Page() {
  return <SupportersRoutePage locale="en" />;
}
