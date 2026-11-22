import { Document } from "@/components/Document";
import { buildMetadata, VIEWPORT } from "@/lib/metadata";

export const metadata = buildMetadata("en");
export const viewport = VIEWPORT;

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <Document locale="en">{children}</Document>;
}
