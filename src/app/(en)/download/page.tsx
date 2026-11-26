import { downloadMetadata, DownloadRoutePage } from "@/components/PageRoutes";

export const metadata = downloadMetadata("en");

export default function Page() {
  return <DownloadRoutePage locale="en" />;
}
