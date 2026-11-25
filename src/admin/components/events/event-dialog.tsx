"use client";

import { CalendarDays, TriangleAlert } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { useRefresh } from "@/admin/components/providers";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { ItemLabel, ItemPicker, fromCatalog, useCatalog } from "@/admin/components/items";
import { Btn, Segmented, Spinner } from "@/admin/components/ui/bits";
import { Modal } from "@/admin/components/ui/modal";
import { api } from "@/admin/lib/api";
import { charCount, nowSecs } from "@/admin/lib/format";
import { prizeSplit } from "@/admin/lib/ops";
import { RULES } from "@/admin/lib/rules";
import type { EventLimits, GameEvent, RulesId } from "@/admin/lib/types";
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

export function EventDialog({ limits, onClose, tournament: only, houseCut = 10 }: {
  limits: EventLimits;
  onClose: () => void;
  /** Only an official tournament (the Official tournaments page). */
  tournament?: boolean;
  /** The house's share of the entry fees, percent (for the prize pool shown). */
  houseCut?: number;
}) {
  const l = useLocale();
  const { t, tf, tn, fmtNum, fmtDate, fmtDuration, fmtMinutes } = l;
  const catalog = useCatalog();
  const { toast } = useToasts();
  const refresh = useRefresh();
  const uid = useId();
  const [kind, setKind] = useState<Kind>(only ? "tournament" : "xp");
  const [mult, setMult] = useState(2);
  const [format, setFormat] = useState<Format>("arena");
  const [size, setSize] = useState(limits.knockout_sizes.includes(8) ? 8 : limits.knockout_sizes[0]);
  const [rules, setRules] = useState<RulesId>("brazilian");
  const [title, setTitle] = useState("");
  const [rated, setRated] = useState(true);
  const [fee, setFee] = useState("0");
  const [prize, setPrize] = useState("0");
  const [share, setShare] = useState("0");
  const [itemPrize, setItemPrize] = useState("");
  const [pickItem, setPickItem] = useState(false);
  const [[starts, ends], setTimes] = useState<[string, string]>(() => defaultTimes(only ? "tournament" : "xp", "arena").map(toLocalInput) as [string, string]);
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
  const shareN = share.trim() === "" ? 0 : Number(share);
  const shape = { kind, multiplier: mult, format, size, rules, rated, entry_fee: Number(fee) || 0, prize: Number(prize) || 0, starts_at: a, ends_at: b, champion_share: shareN, item_prize: itemPrize };
  const earned = (catalog.data?.catalog || []).filter((i) => i.how === "earned").map(fromCatalog);
  const prizeItem = catalog.data?.catalog.find((i) => i.code === itemPrize);
  // The prize pool if every seat is taken (an arena: as many as a knockout of 16).
  const seats = format === "knockout" ? size : 16;
  const fees = Math.floor(((Number(fee) || 0) * seats * (100 - houseCut)) / 100);
  const [first, second] = prizeSplit(fees, Number(prize) || 0, shareN);
  const setArena = (min: number) => {
    const s0 = fromLocalInput(starts) || defaultTimes("tournament", "arena")[0];
    setSecs(s0, s0 + min * 60);
  };

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
    else if (tour && shareN !== 0 && !(Number.isInteger(shareN) && shareN >= 50 && shareN <= 100)) problem = { text: t("The champion's share is 50% to 100% of the prizes.") };
    else if (tour && format === "arena" && limits.arena_minutes && (b - start < limits.arena_minutes[0] * 60 || b - start > limits.arena_minutes[1] * 60)) {
      problem = { text: tf("An arena lasts from {min} to {max}.", { min: fmtMinutes(limits.arena_minutes[0]), max: fmtMinutes(limits.arena_minutes[1]) }) };
    }
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
        body: {
          kind, title: title.trim(), multiplier: mult, starts_at: start, ends_at: b, format, size, rules, rated, entry_fee: tour ? entryFee : 0, prize: tour ? housePrize : 0,
          ...(tour ? { champion_share: shareN, item_prize: itemPrize } : {}),
        },
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
      title={only ? t("New official tournament") : t("New event")}
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
      {only ? null : field(t("Kind of event"), (
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
            : field(t("Arena length"), (
              <div className="chips" role="group" aria-label={t("Arena length")}>
                {[30, 60, 90, 120, 180].filter((m) => !limits.arena_minutes || (m >= limits.arena_minutes[0] && m <= limits.arena_minutes[1])).map((m) => (
                  <button key={m} type="button" className={"chip" + (b - a === m * 60 ? " on" : "")} onClick={() => setArena(m)}>{fmtMinutes(m)}</button>
                ))}
              </div>
            ), { hint: limits.arena_minutes ? tf("From the start to the end: {min} to {max}.", { min: fmtMinutes(limits.arena_minutes[0]), max: fmtMinutes(limits.arena_minutes[1]) }) : null })}
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
          {field(t("The champion's share"), (
            <div className="row">
              <Segmented<string> name={t("The champion's share")} value={["0", "60", "70", "80", "100"].includes(share) ? share : "custom"}
                onChange={(v) => setShare(v === "custom" ? "75" : v)} options={[["0", t("Usual")], ["60", "60%"], ["70", "70%"], ["80", "80%"], ["100", "100%"], ["custom", t("Other")]]} />
              {["0", "60", "70", "80", "100"].includes(share) ? null : (
                <input className="input num w-num" type="number" min={50} max={100} aria-label={t("The champion's share")} value={share} onChange={(e) => setShare(e.target.value)} />
              )}
            </div>
          ), { hint: shareN ? tf("The champion gets {n}% of the prizes, the runner-up the rest.", { n: shareN }) : t("The usual: 70% and 20% of the fees after the house's cut; 70% and 30% of the house's prize.") })}
          {field(t("An item for the champion"), (
            <div className="stack">
              <div className="row">
                {itemPrize ? <ItemLabel code={itemPrize} name={prizeItem?.name} rarity={prizeItem?.rarity} /> : <span className="faint">{t("None")}</span>}
                <Btn label={pickItem ? t("Done") : t("Choose…")} kind="sm" onClick={() => setPickItem((x) => !x)} disabled={!catalog.data} />
                {itemPrize ? <Btn label={t("Remove")} kind="sm ghost" onClick={() => setItemPrize("")} /> : null}
              </div>
              {pickItem ? <ItemPicker label={t("An item for the champion")} items={earned} value={itemPrize} onChange={(v) => setItemPrize(String(v))} height={200} /> : null}
            </div>
          ), { hint: t("Only an item that is only won (never sold): the champion keeps it in their collection.") })}
          <div className="hint">
            {t("The tournament opens for sign-up two hours before it starts, in Tournaments; signed-up players are reminded in their inbox 10 minutes before. The house's prize is paid only to players who won at the table.")}
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
        {tour && (fees || Number(prize)) ? (
          <div className="muted">
            {tf("Prize pool with {n}: {pool} coins · champion {first}, runner-up {second}", {
              n: tn(seats, "{n} player", "{n} players"), pool: fmtNum(fees + (Number(prize) || 0)), first: fmtNum(first), second: fmtNum(second),
            })}
            {" "}{tf("(the house keeps {n}% of the fees)", { n: houseCut })}
          </div>
        ) : null}
        {tour && prizeItem ? <div className="muted">{tf("The champion also wins {item}", { item: prizeItem.name })}</div> : null}
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
