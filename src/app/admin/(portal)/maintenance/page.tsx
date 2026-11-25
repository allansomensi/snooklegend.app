"use client";

import { BellRing, CalendarClock, Check, Power, Wrench, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { fromLocalInput, toLocalInput, zoneLabel } from "@/admin/components/events/event-words";
import { StatusBadge } from "@/admin/components/ops/schedule";
import { useRefresh } from "@/admin/components/providers";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { AlertBox, Badge, Btn, Card, CardHead, DataTable, Empty, PageHead, PersonLink, Segmented, Updated, useBusy } from "@/admin/components/ui/bits";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { api, seg } from "@/admin/lib/api";
import { charCount } from "@/admin/lib/format";
import { useApi, useIsAdmin } from "@/admin/lib/hooks";
import { countdownParts } from "@/admin/lib/ops";
import type { Maintenance, Maintenances } from "@/admin/lib/types";
import "@/admin/styles/ops.css";

export default function MaintenancePage() {
  const { t } = useLocale();
  const admin = useIsAdmin();
  const q = useApi<Maintenances>("/maintenance", { refetchInterval: 15000 });
  return (
    <Loaded queries={[q]}>
      {(d) => {
        const planned = d.maintenance.find((m) => m.status === "scheduled" || m.status === "due" || m.status === "started");
        const past = d.maintenance.filter((m) => m !== planned);
        return (
          <div className="stack">
            <PageHead title={t("Maintenance")} sub={t("A planned stop: players get a countdown, no new games start, the games in progress finish, the server restarts")}>
              <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
            </PageHead>
            {d.draining ? <AlertBox tone="warning" title={t("The server is restarting")} text={t("No new games start; the games in progress move to the next server.")} /> : null}
            {planned ? <Planned m={planned} d={d} /> : admin ? <ScheduleForm d={d} /> : (
              <Card><Empty icon={Wrench} title={t("No maintenance planned")} text={t("Only administrators plan one.")} /></Card>
            )}
            <Card>
              <CardHead title={t("Before")} sub={t("The latest 50")} />
              {past.length ? (
                <DataTable headers={[t("When"), { label: t("Length"), cls: "num" }, t("Message"), t("Status"), t("Planned by")]}>
                  {past.map((m) => <PastRow key={m.id} m={m} />)}
                </DataTable>
              ) : (
                <Empty icon={CalendarClock} title={t("None yet")} />
              )}
            </Card>
          </div>
        );
      }}
    </Loaded>
  );
}

function PastRow({ m }: { m: Maintenance }) {
  const { fmtDate, fmtMinutes } = useLocale();
  return (
    <tr className={m.status === "cancelled" ? "dim" : ""}>
      <td className="nowrap">{fmtDate(m.at)}</td>
      <td className="num">{fmtMinutes(m.minutes)}</td>
      <td className="wrap">{m.message || <span className="faint">—</span>}</td>
      <td><StatusBadge status={m.status} /></td>
      <td><PersonLink name={m.created_by} /></td>
    </tr>
  );
}

/** Seconds from now to `at`, kept current every second. */
function useCountdown(at: number) {
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(h);
  }, []);
  return at - now;
}

function Planned({ m, d }: { m: Maintenance; d: Maintenances }) {
  const { t, tf, tn, fmtDate, fmtMinutes, fmtNum } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const [busy, run] = useBusy();
  const left = useCountdown(m.at);
  const [days, hours, minutes, seconds] = countdownParts(left);
  const cancel = async () => {
    const ok = await dialogs.confirm({
      title: t("Call off the maintenance?"),
      text: t("The players' countdown banner goes away at once and no more lounge notices are sent."),
      confirm: t("Call it off"),
      tone: "warning",
    });
    if (ok && (await run(() => attempt(() => api("/maintenance/" + seg(m.id) + "/cancel", { method: "POST" }), t("Maintenance called off."))))) void refresh();
  };
  const started = m.status !== "scheduled";
  return (
    <Card className="maintenance-card">
      <CardHead title={<span className="row"><Power className="icon" aria-hidden />{t("Planned stop")}<StatusBadge status={m.status} /></span>}
        sub={tf("Planned by {name}", { name: m.created_by })}>
        {admin && m.status === "scheduled" ? <Btn label={t("Call it off")} kind="sm danger-soft" icon={X} busy={busy} onClick={() => void cancel()} /> : null}
      </CardHead>
      <div className="card-body stack">
        <div className="countdown" role="timer" aria-live="off" aria-label={t("Time left")}>
          {started ? (
            <b>{m.status === "due" ? t("Stopping now: no new games, the games in progress finish") : t("Under way")}</b>
          ) : (
            <>
              {days ? <span><b>{fmtNum(days)}</b>{t("d")}</span> : null}
              <span><b>{String(hours).padStart(2, "0")}</b>{t("h")}</span>
              <span><b>{String(minutes).padStart(2, "0")}</b>{t("min")}</span>
              <span><b>{String(seconds).padStart(2, "0")}</b>{t("s")}</span>
            </>
          )}
        </div>
        <div className="row">
          <b>{fmtDate(m.at)}</b>
          <span className="muted">{tf("for about {time}", { time: fmtMinutes(m.minutes) })}</span>
        </div>
        {m.message ? <div className="preview-box"><span className="faint">{t("The message players see")}</span>{m.message}</div> : null}
        <div>
          <div className="hint">{t("Lounge notices")}</div>
          <div className="chips">
            {d.notices_minutes.map((n) => {
              const sent = left <= n * 60;
              return (
                <Badge key={n} kind={sent ? "success" : ""} icon={sent ? Check : BellRing}>{tn(n, "{n} minute before", "{n} minutes before")}</Badge>
              );
            })}
          </div>
        </div>
        <div className="hint">{t("Players got a banner with the countdown when it was planned.")}</div>
      </div>
    </Card>
  );
}

const nextHour = () => {
  const d = new Date(Date.now() + 3600000);
  d.setMinutes(0, 0, 0);
  return Math.floor(d.getTime() / 1000);
};

function ScheduleForm({ d }: { d: Maintenances }) {
  const { t, tf, fmtNum, fmtDate, fmtMinutes, ago } = useLocale();
  const dialogs = useDialogs();
  const { toast } = useToasts();
  const refresh = useRefresh();
  const uid = useId();
  const [at, setAt] = useState(() => toLocalInput(nextHour()));
  const [minutes, setMinutes] = useState(20);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, run] = useBusy();
  const when = fromLocalInput(at);
  const n = charCount(message);
  const submit = () =>
    run(async () => {
      setError(null);
      const now = Date.now() / 1000;
      if (!Number.isFinite(when) || when < now + 60) return setError(t("A maintenance starts at least a minute from now."));
      if (when > now + 90 * 86400) return setError(t("Schedule maintenance within 90 days."));
      if (!(minutes >= 1 && minutes <= d.limits.max_minutes)) return setError(tf("From 1 to {n} minutes.", { n: fmtNum(d.limits.max_minutes) }));
      if (n > d.limits.max_message) return setError(tf("“{field}” is too long.", { field: t("Message") }));
      const ok = await dialogs.confirm({
        title: tf("Stop the server {when}?", { when: ago(when) }),
        text: tf("{date}, for about {time}. Every player gets a countdown banner now and lounge notices before; at the time no new games start, games in progress finish and the server restarts.", { date: fmtDate(when), time: fmtMinutes(minutes) }),
        confirm: t("Plan the stop"),
        tone: "warning",
        icon: Wrench,
      });
      if (!ok) return;
      try {
        await api("/maintenance", { method: "POST", body: { at: when, minutes, message: message.trim() } });
        toast(t("Maintenance planned."));
        void refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  return (
    <Card>
      <CardHead title={t("Plan a stop")} sub={tf("Times in your time zone ({zone}).", { zone: zoneLabel() })} />
      <div className="card-body stack">
        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor={uid + "-at"}>{t("When")}</label>
            <input id={uid + "-at"} className="input" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
            <div className="hint">{Number.isFinite(when) ? ago(when) : ""}</div>
          </div>
          <div className="field">
            <label className="label" htmlFor={uid + "-m"}>{t("Expected length")}</label>
            <div className="row">
              <Segmented<number> name={t("Expected length")} value={minutes} onChange={setMinutes} options={[5, 10, 20, 30, 60].map((m) => [m, fmtMinutes(m)])} />
              <input id={uid + "-m"} className="input num w-num" type="number" min={1} max={d.limits.max_minutes} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor={uid + "-msg"}>
            <span>{t("Message")}<span className="faint"> · {t("optional")}</span></span>
            <span className={"counter" + (n > d.limits.max_message ? " over" : "")}>{fmtNum(n)} / {fmtNum(d.limits.max_message)}</span>
          </label>
          <input id={uid + "-msg"} className="input" placeholder={t("New tables")} value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="hint">{t("Shown with the countdown, as written (in one language).")}</div>
        </div>
        <div className="preview-box">
          <span className="faint">{t("Players see")}</span>
          <b>{Number.isFinite(when) ? tf("Maintenance {when}, for about {time}", { when: ago(when), time: fmtMinutes(minutes) }) : "…"}</b>
          {message.trim() ? <div>{message.trim()}</div> : null}
          <div className="muted">{tf("Lounge notices {list} minutes before.", { list: d.notices_minutes.join(", ") })}</div>
        </div>
        {error ? <AlertBox tone="danger" title={error} /> : null}
        <div className="row">
          <Btn label={t("Plan the stop")} kind="primary" icon={Wrench} busy={busy} onClick={() => void submit()} />
        </div>
      </div>
    </Card>
  );
}
