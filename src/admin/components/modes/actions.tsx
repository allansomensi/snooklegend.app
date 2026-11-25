"use client";

import { Timer, Undo2 } from "lucide-react";
import { msg } from "@/admin/i18n";
import { api, seg } from "@/admin/lib/api";
import { oneLine } from "@/admin/lib/format";
import { clockTime, fourPlayers, givenBack, parseClockRemoved, teamName } from "@/admin/lib/modes";
import type { ClockAttempt, DoublesGame } from "@/admin/lib/types";
import { previewCall } from "../player-dialogs";
import { useRefresh } from "../providers";
import { useDialogs } from "../providers/dialogs";
import { useLocale } from "../providers/locale";
import { useToasts } from "../providers/toasts";
import { FormDialog } from "../ui/form-dialog";
import "@/admin/styles/modes.css";

/** Reasons offered for taking an attempt off the ranking. */
const CLOCK_REASONS = [msg("Times impossible for a human"), msg("Cheating"), msg("A bug of the game"), msg("Played on someone else's account")];

/** What administrators do to 0.12's modes: annul a doubles game, take an
 * attempt against the clock off the ranking. Each asks first. */
export function useModeActions() {
  const { t, tf, fmtNum } = useLocale();
  const dialogs = useDialogs();
  const { toast } = useToasts();
  const refresh = useRefresh();
  const done = (after?: () => void) => (after ? after() : void refresh());

  return {
    /** Annuls a rated doubles game: the four get their rating change back
     * and are told (the preview shows each one's notification). */
    voidDoubles(g: Pick<DoublesGame, "id" | "teams" | "deltas">, after?: () => void) {
      const back = givenBack(g);
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("Annul doubles game #{id}?", { id: g.id })} icon={Undo2} tone="danger" wide
          text={tf("{a} and {b} get their doubles rating change back; it leaves their rated games and wins, and a peak it made goes back. Once only: it can't be undone.",
            { a: teamName(g.teams[0]), b: teamName(g.teams[1]) })}
          fields={[
            { type: "node", name: "given-back", node: (
              <div className="given-back" role="group" aria-label={t("Given back")}>
                <span className="gb-title">{t("Given back")}</span>
                {back.map((b) => (
                  <span key={b.name} className="gb">
                    <span>{b.name}</span>
                    <b className={"delta" + (b.back > 0 ? " up" : b.back < 0 ? " down" : "")}>{(b.back > 0 ? "+" : "") + fmtNum(b.back)}</b>
                  </span>
                ))}
              </div>
            ) },
            { name: "reason", label: t("Reason (shown to the four players)"), type: "textarea", rows: 2, required: true, max: 300 },
          ]}
          preview={(v) => previewCall("/doubles/" + seg(g.id) + "/void", { reason: oneLine(v.reason) })}
          previewNames={fourPlayers(g)}
          submit={t("Annul the game")} submitKind="danger"
          onSubmit={async (v) => {
            await api("/doubles/" + seg(g.id) + "/void", { method: "POST", body: { reason: oneLine(v.reason) } });
            toast(t("Doubles game annulled."), "success");
            done(after);
          }} />
      ));
    },

    /** Takes a counted attempt off its week's ranking: the player's best of
     * that week is worked out again from their other attempts. */
    removeAttempt(a: Pick<ClockAttempt, "id" | "username" | "ms" | "time" | "week">, after?: () => void) {
      const time = a.time || (a.ms !== null ? clockTime(a.ms) : "—");
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("Take {name}'s {time} off the ranking?", { name: a.username, time })} icon={Timer} tone="danger"
          text={t("Their best of that week is worked out again from their other attempts (none left: they leave its table). A prize already paid isn't taken back: adjust the wallet for that. Once only.")}
          fields={[
            { type: "chips", name: "chips-reason", target: "reason", options: CLOCK_REASONS.map((r) => t(r)) },
            { name: "reason", label: t("Reason (kept in the audit log)"), type: "textarea", rows: 2, required: true, max: 300, placeholder: t("Write the reason, or pick one above") },
          ]}
          submit={t("Take it off")} submitKind="danger"
          onSubmit={async (v) => {
            const r = parseClockRemoved(await api("/time-attack/attempts/" + seg(a.id) + "/remove", { method: "POST", body: { reason: oneLine(v.reason) } }));
            const best = r?.best_ms ?? null;
            toast(best === null
              ? tf("Taken off. {name} has no other time that week.", { name: a.username })
              : tf("Taken off. {name}'s best of that week is now {time}.", { name: a.username, time: clockTime(best) }), "success");
            done(after);
          }} />
      ));
    },
  };
}
