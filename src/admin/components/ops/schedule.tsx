"use client";

// What the operations pages share: a start and an end with quick picks, a
// running thing's progress, and a status badge.
import type { ReactNode } from "react";
import { fromLocalInput, nextAt, toLocalInput, zoneLabel } from "@/admin/components/events/event-words";
import { useLocale } from "@/admin/components/providers/locale";
import { Badge } from "@/admin/components/ui/bits";
import { msg } from "@/admin/i18n";

export const STATUS: Record<string, [string, string]> = {
  live: [msg("Running"), "success dot"],
  open: [msg("Open"), "success dot"],
  scheduled: [msg("Scheduled"), "info"],
  coming: [msg("Coming"), "info"],
  due: [msg("Starting now"), "warning dot"],
  started: [msg("Under way"), "warning dot"],
  ended: [msg("Ended"), ""],
  cancelled: [msg("Called off"), "danger"],
  registering: [msg("Signing up"), "warning"],
  running: [msg("Running"), "success dot"],
  finished: [msg("Finished"), ""],
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const [label, tone] = STATUS[status] || [status, ""];
  return <Badge kind={tone}>{t(label)}</Badge>;
}

export const minuteNow = () => Math.floor(Date.now() / 60000) * 60;
const secs = (d: Date) => Math.floor(d.getTime() / 1000);

/** The usual starts and ends: now for a day, this weekend, the next 7 days. */
export function useQuickRanges(): [string, () => [number, number]][] {
  const { t } = useLocale();
  return [
    [t("Now, for 24 hours"), () => [minuteNow(), minuteNow() + 86400]],
    [t("This weekend"), () => {
      const day = new Date().getDay();
      const from = day === 6 || day === 0 ? minuteNow() : secs(nextAt(6, 0, 0));
      return [from, secs(nextAt(1, 0, 0, new Date(from * 1000)))];
    }],
    [t("The next 7 days"), () => [minuteNow(), minuteNow() + 7 * 86400]],
  ];
}

/** Two datetime fields (the viewer's time zone) and quick picks. */
export function RangeFields({ starts, ends, onChange, presets, idPrefix }: {
  starts: string;
  ends: string;
  onChange: (starts: string, ends: string) => void;
  presets?: [string, () => [number, number]][];
  idPrefix: string;
}) {
  const { t, tf, fmtDate, fmtDuration } = useLocale();
  const a = fromLocalInput(starts);
  const b = fromLocalInput(ends);
  return (
    <div className="stack">
      {presets?.length ? (
        <div className="chips" role="group" aria-label={t("Quick picks")}>
          {presets.map(([label, go]) => (
            <button key={label} type="button" className="chip" onClick={() => { const [x, y] = go(); onChange(toLocalInput(x), toLocalInput(y)); }}>{label}</button>
          ))}
        </div>
      ) : null}
      <div className="grid-2">
        <div className="field">
          <label className="label" htmlFor={idPrefix + "-s"}>{t("Starts")}</label>
          <input id={idPrefix + "-s"} className="input" type="datetime-local" value={starts} onChange={(e) => onChange(e.target.value, ends)} />
        </div>
        <div className="field">
          <label className="label" htmlFor={idPrefix + "-e"}>{t("Ends")}</label>
          <input id={idPrefix + "-e"} className="input" type="datetime-local" value={ends} onChange={(e) => onChange(starts, e.target.value)} />
        </div>
      </div>
      <div className="hint">
        {tf("Times in your time zone ({zone}).", { zone: zoneLabel() })}
        {a && b && b > a ? " " + tf("{from} → {to} ({length})", { from: fmtDate(a), to: fmtDate(b), length: fmtDuration(b - a) }) : null}
      </div>
    </div>
  );
}

/** How far a running thing is, as a bar. */
export function Progress({ from, to, now, tone = "", label }: { from: number; to: number; now: number; tone?: string; label: string }) {
  const p = Math.max(1, Math.min(100, ((now - from) * 100) / Math.max(1, to - from)));
  return (
    <div className="event-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)} aria-label={label}>
      <div className={tone} style={{ width: p + "%" }} />
    </div>
  );
}

/** When a scheduled thing starts or ends, in words. */
export function useWhen() {
  const { tf, ago } = useLocale();
  return (status: string, starts: number, ends: number, cancelled?: number | null): string =>
    status === "live" || status === "open" || status === "running" ? tf("ends {when}", { when: ago(ends) })
      : status === "scheduled" || status === "coming" || status === "registering" ? tf("starts {when}", { when: ago(starts) })
        : status === "cancelled" ? tf("called off {when}", { when: ago(cancelled) })
          : tf("ended {when}", { when: ago(ends) });
}

/** A titled list of cards, or an empty card. */
export function Section({ title, sub, empty, children, count }: { title: string; sub?: string | null; empty: ReactNode; children: ReactNode[]; count?: number }) {
  return (
    <div className="section">
      <div className="section-head">
        <h2>{title}{count !== undefined ? <span className="faint"> · {count}</span> : null}</h2>
        {sub ? <span className="sub">{sub}</span> : null}
      </div>
      {children.length ? <div className="stack">{children}</div> : empty}
    </div>
  );
}
