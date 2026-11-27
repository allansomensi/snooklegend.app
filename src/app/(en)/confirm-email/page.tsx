import { confirmEmailMetadata, ConfirmEmailPage } from "@/components/AccountPages";

export const metadata = confirmEmailMetadata("en");

export default function Page() {
  return <ConfirmEmailPage locale="en" />;
}
