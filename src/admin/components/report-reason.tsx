"use client";

import { msg } from "@/admin/i18n";
import { useLocale } from "./providers/locale";
import { Badge } from "./ui/bits";

// Reports keep their reason as the game names it (in English).
export const REPORT_REASONS: [string, string][] = [
  ["Harassment", msg("Harassment")],
  ["Cheating or abuse", msg("Cheating or abuse")],
  ["Offensive name", msg("Offensive name")],
  ["Spam", msg("Spam")],
  ["Other", msg("Other")],
];

const TONE: Record<string, string> = { "Cheating or abuse": "danger", Harassment: "warning", "Offensive name": "info", Spam: "accent" };

export function ReasonBadge({ reason }: { reason: string }) {
  const { t } = useLocale();
  return <Badge kind={TONE[reason] || ""}>{t(REPORT_REASONS.find(([v]) => v === reason)?.[1] || reason)}</Badge>;
}
