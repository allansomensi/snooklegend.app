"use client";

import { useLocale } from "../providers/locale";
import { useToasts } from "../providers/toasts";

/** Copies a text, and says whether it worked. */
export function useCopy() {
  const { t } = useLocale();
  const { toast } = useToasts();
  return (text: string) => {
    if (!navigator.clipboard?.writeText) {
      toast(t("Couldn't copy."), "error");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => toast(t("Copied.")),
      () => toast(t("Couldn't copy."), "error"),
    );
  };
}
