"use client";

import { useLocale } from "@/admin/components/providers/locale";
import { msg } from "@/admin/i18n";

/** How a game ended, as the server names it. */
export const GAME_ENDS: Record<string, string> = {
  pocketed_eight: msg("8-ball made"),
  eight_pocketed_early: msg("8-ball made too early"),
  eight_in_wrong_pocket: msg("8-ball in the wrong pocket"),
  eight_pocketed_on_foul: msg("8-ball made on a foul"),
  eight_off_table: msg("8-ball off the table"),
  eight_with_another_ball: msg("8-ball with another ball"),
  resignation: msg("Resigned"),
  abandoned: msg("Left the game"),
};

/** How a game ended, in words of the chosen language. */
export function useGameEnd(): (reason: string) => string {
  const { t } = useLocale();
  return (reason: string) => t(GAME_ENDS[reason] || String(reason).replaceAll("_", " "));
}
