// A stroke of a replay in words: who did what, and the details (calls,
// balls made, fouls…), in the chosen language.
import type { Translator } from "@/admin/i18n";
import { msg } from "@/admin/i18n";
import type { RulesId, Stroke } from "@/admin/lib/types";

const POCKETS: Record<string, string> = {
  "head left corner": msg("the head-left corner"),
  "head right corner": msg("the head-right corner"),
  "left side": msg("the left side pocket"),
  "right side": msg("the right side pocket"),
  "foot left corner": msg("the foot-left corner"),
  "foot right corner": msg("the foot-right corner"),
};

/** A player's answer after some breaks of the official rules. */
const CHOICES: Record<string, string> = {
  play_on: msg("chose to play on"),
  cue_ball_in_hand: msg("chose the cue ball in hand behind the head string"),
  break_again: msg("chose to break again"),
  opponent_breaks: msg("chose to have the other player break"),
};

/** What a break left to decide (the official rules, 4.3). */
const BREAK_CHOICES: Record<string, string> = {
  illegal_break: msg("Illegal break: the other player chooses how the game goes on"),
  eight_on_break: msg("The 8 on the break: it is spotted, and the breaker chooses how the game goes on"),
  eight_on_foul_break: msg("The 8 on a foul break: it is spotted, and the other player chooses how the game goes on"),
  ball_off_on_break: msg("A ball off the table on the break: the other player chooses how the game goes on"),
};

export const isFoulStroke = (s: Stroke) =>
  s.kind === "resign" || s.kind === "abandon" || s.kind === "time_foul" || (s.kind === "shot" && (s.fouls?.length || 0) > 0);

export function strokeWords({ t, tf }: Translator) {
  const pocketName = (p: unknown) => t(POCKETS[String(p)] || String(p));

  /** A foul as the server describes it, in the chosen language. */
  function foulText(f: string) {
    let m = f.match(/^Wrong ball hit first \((.+)\)$/);
    if (m) return tf("Wrong ball hit first ({id})", { id: m[1] });
    m = f.match(/^The (.+) left the table$/);
    if (m) return tf("The {id} left the table", { id: m[1] });
    m = f.match(/^The (.+) behind the head string was hit without crossing it first$/);
    if (m) return tf("The {id} behind the head string was hit without crossing it first", { id: m[1] });
    return t(f);
  }

  function breakChoiceText(c: Stroke["choice"]) {
    const k = typeof c === "string" ? c : Object.keys(c || {})[0];
    return BREAK_CHOICES[k] ? t(BREAK_CHOICES[k]) : k;
  }

  /** [who, what] */
  function summary(s: Stroke, names: string[]): [string, string] {
    const who = names[s.seat] || tf("Player {n}", { n: s.seat + 1 });
    if (s.kind === "resign") return [who, t("resigned")];
    if (s.kind === "abandon") return [who, t("left the game")];
    if (s.kind === "time_foul") return [who, t("ran out of time")];
    if (s.kind === "choice") return [who, t(CHOICES[String(s.option)] || String(s.option))];
    const made = (s.pocketed || []).filter((p) => p.ball !== 0).map((p) => p.ball);
    const parts: string[] = [];
    if (s.break) parts.push(t("break"));
    parts.push(made.length ? tf("made {balls}", { balls: made.join(", ") }) : s.first === null ? t("hit nothing") : t("made nothing"));
    if (s.fouls?.length) parts.push(t("foul"));
    return [who, parts.join(" · ")];
  }

  function details(s: Stroke, rules: RulesId): string[] {
    if (s.kind !== "shot") return [];
    const out: string[] = [];
    // The official rules call every shot but the break (no call: a safety);
    // the Brazilian rules call only the 8.
    if (rules === "official" && !s.break) out.push(s.called ? tf("Called {pocket}", { pocket: pocketName(s.called) }) : t("No call: a safety"));
    else if (s.called) out.push(tf("8-ball called in {pocket}", { pocket: pocketName(s.called) }));
    for (const p of s.pocketed || []) {
      out.push(p.ball === 0 ? tf("The cue ball in {pocket}", { pocket: pocketName(p.pocket) }) : tf("The {n} in {pocket}", { n: p.ball, pocket: pocketName(p.pocket) }));
    }
    for (const f of s.fouls || []) out.push(tf("Foul: {foul}", { foul: foulText(f) }));
    if (s.penalty?.length) out.push(tf("Penalty: {balls} off the table", { balls: s.penalty.join(", ") }));
    if (s.break_again) out.push(t("The break is played again"));
    if (s.choice) out.push(breakChoiceText(s.choice));
    if (s.in_hand) out.push(t("ball in hand"));
    if (s.timeout) out.push(t("played by the shot clock"));
    out.push(tf("power {n}%", { n: s.power ?? 0 }));
    return out;
  }

  return { pocketName, foulText, summary, details };
}
