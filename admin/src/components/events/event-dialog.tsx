"use client";

import { CalendarDays, TriangleAlert } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { useRefresh } from "@/components/providers";
import { useLocale } from "@/components/providers/locale";
import { useToasts } from "@/components/providers/toasts";
import { Segmented, Spinner } from "@/components/ui/bits";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { charCount, nowSecs } from "@/lib/format";
import { RULES } from "@/lib/rules";
import type { EventLimits, GameEvent, RulesId } from "@/lib/types";
import { eventWhat, fromLocalInput, nextAt, toLocalInput, zoneLabel } from "./event-words";

type Kind = GameEvent["kind"];
type Format = GameEvent["format"];

const minuteNow = () => Math.floor(Date.now() / 60000) * 60;
// Two minutes ahead: a tournament must start at least a minute from now.
const soon = () => new Date(Date.now() + 120000);
const secs = (d: Date) => Math.floor(d.getTime() / 1000);

/** Default times for a kind and format: a boost from now for a day; a
 * tournament next Saturday at 8 pm, an hour (arena) or three (knockout). */
function defaultTimes(kind: Kind, format: Format, keepStart?: number): [number, number] {
  if (kind === "tournament") {
    const s0 = keepStart || secs(nextAt(6, 20, 0, soon()));
    return [s0, s0 + (format === "arena" ? 3600 : 3 * 3600)];
  }
  return [minuteNow(), minuteNow() + 86400];
}

export function EventDialog({ limits, onClose }: { limits: EventLimits; onClose: () => void }) {
  const l = useLocale();
  const { t, tf, fmtNum, fmtDate, fmtDuration } = l;
  const { toast } = useToasts();
  const refresh = useRefresh();
  const uid = useId();
  const [kind, setKind] = useState<Kind>("xp");
  const [mult, setMult] = useState(2);
  const [format, setFormat] = useState<Format>("arena");
  const [size, setSize] = useState(limits.knockout_sizes.includes(8) ? 8 : limits.knockout_sizes[0]);
  const [rules, setRules] = useState<RulesId>("brazilian");
  const [title, setTitle] = useState("");
  const [rated, setRated] = useState(true);
  const [fee, setFee] = useState("0");
  const [prize, setPrize] = useState("0");
  const [[starts, ends], setTimes] = useState<[string, string]>(() => defaultTimes("xp", "arena").map(toLocalInput) as [string, string]);
  const [error, setError] = useState<{ text: string; where?: "fee" | "prize" } | null>(null);
  const [sending, setSending] = useState(false);
  const feeRef = useRef<HTMLInputElement>(null);
  const prizeRef = useRef<HTMLInputElement>(null);
  const tour = kind === "tournament";

  const setSecs = (a: number, b: number) => setTimes([toLocalInput(a), toLocalInput(b)]);
  const chooseKind = (k: Kind) => {
    setKind(k);
    setSecs(...defaultTimes(k, format));
  };
  const chooseFormat = (f: Format) => {
    setFormat(f);
    const a = fromLocalInput(starts);
    setSecs(...defaultTimes("tournament", f, a || undefined));
  };

  /** Whole coins from 0 to `max` (empty is 0), or null. */
  const coins = (v: string, max: number) => {
    const n = v.trim() === "" ? 0 : Number(v);
    return Number.isInteger(n) && n >= 0 && n <= max ? n : null;
  };

  const a = fromLocalInput(starts);
  const b = fromLocalInput(ends);
  const name = tour ? t("Name") : t("Title");
  const placeholder = tour ? t("Halloween Cup") : kind === "coins" ? t("Coins weekend") : t("Double XP weekend");
  const shape = { kind, multiplier: mult, format, size, rules, rated, entry_fee: Number(fee) || 0, prize: Number(prize) || 0, starts_at: a, ends_at: b };

  const presets: [string, () => void][] = tour
    ? [
        [t("Tonight at 8 pm"), () => {
          const d = new Date();
          d.setHours(20, 0, 0, 0);
          if (d < soon()) d.setDate(d.getDate() + 1);
          setSecs(...defaultTimes("tournament", format, secs(d)));
        }],
        [t("Saturday at 8 pm"), () => setSecs(...defaultTimes("tournament", format, secs(nextAt(6, 20, 0, soon()))))],
        [t("Sunday at 4 pm"), () => setSecs(...defaultTimes("tournament", format, secs(nextAt(0, 16, 0, soon()))))],
      ]
    : [
        [t("Now, for 24 hours"), () => setSecs(minuteNow(), minuteNow() + 86400)],
        [t("This weekend"), () => {
          const day = new Date().getDay();
          const from = day === 6 || day === 0 ? minuteNow() : secs(nextAt(6, 0, 0));
          // Until Monday 00:00, so the last minute of Sunday counts too.
          setSecs(from, secs(nextAt(1, 0, 0, new Date(from * 1000))));
        }],
        [t("The next 7 days"), () => setSecs(minuteNow(), minuteNow() + 7 * 86400)],
      ];

  async function schedule() {
    if (sending) return;
    setError(null);
    let start = a;
    // The form may have stood open a while: a boost that should have
    // started already starts now.
    if (!tour && start && start <= nowSecs()) start = Math.floor(nowSecs());
    const entryFee = coins(fee, limits.max_entry_fee);
    const housePrize = coins(prize, limits.max_prize);
    let problem: { text: string; where?: "fee" | "prize" } | null = null;
    if (!title.trim()) problem = { text: t("Give the event a title.") };
    else if (charCount(title) > limits.max_title) problem = { text: tf("“{field}” is too long.", { field: name }) };
    else if (!(start && b)) problem = { text: t("Choose when it starts and ends.") };
    else if (b <= start) problem = { text: t("The event must end after it starts.") };
    else if (tour && entryFee === null) problem = { text: tf("The entry fee must be a whole number from 0 to {max}.", { max: fmtNum(limits.max_entry_fee) }), where: "fee" };
    else if (tour && housePrize === null) problem = { text: tf("The house's prize must be a whole number from 0 to {max}.", { max: fmtNum(limits.max_prize) }), where: "prize" };
    if (problem) {
      setError(problem);
      if (problem.where === "fee") feeRef.current?.focus();
      if (problem.where === "prize") prizeRef.current?.focus();
      return;
    }
    setSending(true);
    try {
      await api("/events", {
        method: "POST",
        body: { kind, title: title.trim(), multiplier: mult, starts_at: start, ends_at: b, format, size, rules, rated, entry_fee: tour ? entryFee : 0, prize: tour ? housePrize : 0 },
      });
      toast(t("Event scheduled."));
      void refresh();
      onClose();
    } catch (e) {
      setError({ text: e instanceof Error ? e.message : String(e) });
      setSending(false);
    }
  }

  const field = (label: ReactNode, control: ReactNode, opts: { id?: string; hint?: ReactNode } = {}) => (
    <div className="field">
      {opts.id ? <label className="label" htmlFor={opts.id}>{label}</label> : <div className="label">{label}</div>}
      {control}
      {opts.hint ? <div className="hint">{opts.hint}</div> : null}
    </div>
  );
  const n = charCount(title);

  return (
    <Modal
      title={t("New event")}
      text={tf("Times in your time zone ({zone}).", { zone: zoneLabel() })}
      icon={CalendarDays}
      wide
      onClose={onClose}
      onKeyDown={(e) => {
        const el = e.target as HTMLInputElement;
        if (e.key === "Enter" && el.tagName === "INPUT" && el.type !== "checkbox") {
          e.preventDefault();
          void schedule();
        }
      }}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>{t("Cancel")}</button>
          <button type="button" data-primary className="btn primary" disabled={sending} onClick={() => void schedule()}>
            {sending ? <Spinner /> : null}
            {t("Schedule")}
          </button>
        </>
      }
    >
      {field(t("Kind of event"), (
        <Segmented<Kind> name={t("Kind of event")} value={kind} onChange={chooseKind}
          options={[["xp", t("Experience")], ["coins", t("Coins from games")], ["tournament", t("Themed tournament")]]} />
      ))}
      <div className="field">
        <label className="label" htmlFor={uid + "-title"}>
          <span>{name}</span>
          <span className={"counter" + (n > limits.max_title ? " over" : "")}>{fmtNum(n)} / {fmtNum(limits.max_title)}</span>
        </label>
        <input id={uid + "-title"} className={"input" + (error && !error.where && !title.trim() ? " invalid" : "")} placeholder={placeholder}
          value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="hint">{t("Players see it as written (in one language).")}</div>
      </div>
      {field(t("Quick picks"), (
        <div className="chips" role="group" aria-label={t("Quick picks")}>
          {presets.map(([label, go]) => (
            <button key={label} type="button" className="chip" onClick={go}>{label}</button>
          ))}
        </div>
      ))}
      <div className="grid-2">
        {field(t("Starts"), <input id={uid + "-starts"} className="input" type="datetime-local" value={starts} onChange={(e) => setTimes([e.target.value, ends])} />, { id: uid + "-starts" })}
        {field(t("Ends"), <input id={uid + "-ends"} className="input" type="datetime-local" value={ends} onChange={(e) => setTimes([starts, e.target.value])} />, { id: uid + "-ends" })}
      </div>
      {!tour ? (
        field(t("Multiplier"), (
          <Segmented<number> name={t("Multiplier")} value={mult} onChange={setMult}
            options={([[2, "×2"], [3, "×3"]] as [number, string][]).slice(0, Math.max(1, limits.max_multiplier - 1))} />
        ), { hint: t("Boosts don't add up: the largest one running counts.") })
      ) : (
        <div className="stack">
          {field(t("Rules"), (
            <Segmented<RulesId> name={t("Rules")} value={rules} onChange={setRules}
              options={RULES.map((r) => [r, r === "official" ? t("Official rules") : t("Brazilian rules")])} />
          ), { hint: t("Every game of the tournament is played under these rules; a rated one counts for their rating.") })}
          {field(t("Format"), (
            <Segmented<Format> name={t("Format")} value={format} onChange={chooseFormat} options={[["arena", t("Arena")], ["knockout", t("Knockout")]]} />
          ))}
          {format === "knockout"
            ? field(t("Seats"), <Segmented<number> name={t("Seats")} value={size} onChange={setSize} options={limits.knockout_sizes.map((s) => [s, String(s)])} />)
            : null}
          <label className="check">
            <input type="checkbox" checked={rated} onChange={(e) => setRated(e.target.checked)} />
            {t("Rated")}
          </label>
          <div className="grid-2">
            {field(t("Entry fee (coins)"), (
              <input ref={feeRef} id={uid + "-fee"} className={"input" + (error?.where === "fee" ? " invalid" : "")} type="number" min={0}
                max={limits.max_entry_fee} step={10} value={fee} onChange={(e) => setFee(e.target.value)} />
            ), { id: uid + "-fee" })}
            {field(t("Prize from the house (coins)"), (
              <input ref={prizeRef} id={uid + "-prize"} className={"input" + (error?.where === "prize" ? " invalid" : "")} type="number" min={0}
                max={limits.max_prize} step={100} value={prize} onChange={(e) => setPrize(e.target.value)} />
            ), { id: uid + "-prize" })}
          </div>
          <div className="hint">
            {t("The house's prize goes 70% to the champion and 30% to the runner-up, on top of the entry fees. The tournament opens for sign-up two hours before it starts, in Tournaments.")}
          </div>
        </div>
      )}
      <div className="preview-box" aria-live="polite">
        <span className="faint">{t("Players see")}</span>
        <b>{title || placeholder}</b>
        <div>{eventWhat(shape, l)}</div>
        {a && b && b > a ? (
          <div className="muted">{tf("{from} → {to} ({length})", { from: fmtDate(a), to: fmtDate(b), length: fmtDuration(b - a) })}</div>
        ) : null}
      </div>
      {error ? (
        <div className="alert danger" role="alert">
          <TriangleAlert className="icon" aria-hidden />
          <div>{error.text}</div>
        </div>
      ) : null}
    </Modal>
  );
}
