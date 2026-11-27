import { resetPasswordMetadata, ResetPasswordPage } from "@/components/AccountPages";

export const metadata = resetPasswordMetadata("en");

export default function Page() {
  return <ResetPasswordPage locale="en" />;
}
