"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleSlash, Timer, Trophy, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api, seg } from "@/admin/lib/api";
import { useIsAdmin } from "@/admin/lib/hooks";
import { attemptStats, attemptStatus, clockTime, parseClockAttempts, type AttemptStatus } from "@/admin/lib/modes";
import type { ClockAttempt, UserDetail } from "@/admin/lib/types";
import { useModeActions } from "../modes/actions";
import { useLocale } from "../providers/locale";
import { Badge, Btn, Card, CardHead, DataTable, Empty, Kpi } from "../ui/bits";
import { Loaded } from "../ui/loaded";
import "@/admin/styles/modes.css";

const SHORT = 100;
const LONG = 500;

/** A player's attempts against the clock: this week's best and place, and
 * every attempt (time, strokes, fouls, week, taken off or not). */
export function PlayerClock({ d }: { d: UserDetail }) {
  const name = d.user.username;
  const [limit, setLimit] = useState(SHORT);
  const q = useQuery({
    queryKey: ["/users/" + name + "/time-attack", limit],
    queryFn: async ({ signal }) => parseClockAttempts(await api("/users/" + seg(name) + "/time-attack?limit=" + limit, { signal })),
    placeholderData: (prev) => prev,
  });
  return (
    <Loaded queries={[q]}>
      {(a) => <Attempts list={a.attempts} best={a.this_week} more={a.attempts.length >= limit && limit < LONG} onMore={() => setLimit(LONG)} stale={q.isFetching} />}
    </Loaded>
  );
}

function Attempts({ list, best, more, onMore, stale }: {
  list: ClockAttempt[];
  best: { week: number; best_ms: number | null; place: number | null };
  more: boolean;
  onMore: () => void;
  stale: boolean;
}) {
  const { t, tf, tn, fmtNum } = useLocale();
  const s = attemptStats(list);
  return (
    <div className="stack modes-page">
      <div className="kpis">
        <Kpi label={t("This week")} value={best.best_ms !== null ? <span className="clock-time">{clockTime(best.best_ms)}</span> : "—"}
          sub={best.place ? tf("place {n} in the table", { n: fmtNum(best.place) }) : t("not in this week's table")} icon={Trophy} tone="success"
          href={"/admin/time-attack"} />
        <Kpi label={t("Attempts")} value={fmtNum(s.attempts)} sub={tn(s.cleared, "{n} cleared", "{n} cleared")} icon={Timer} tone="info" />
        <Kpi label={t("In a ranking")} value={fmtNum(s.counted)} sub={s.best !== null ? tf("quickest {time}", { time: clockTime(s.best) }) : null} icon={CircleCheck} />
        <Kpi label={t("Taken off")} value={fmtNum(s.removed)} sub={t("by the staff")} icon={Undo2} tone={s.removed ? "danger" : ""} />
      </div>
      <Card className={stale ? "loading-soft" : ""}>
        <CardHead title={t("Attempts against the clock")} sub={tn(list.length, "{n} attempt, newest first", "{n} attempts, newest first")} />
        {list.length ? (
          <>
            <AttemptTable list={list} />
            {more ? (
              <div className="pager">
                <span />
                <Btn label={tf("Show up to {n}", { n: fmtNum(LONG) })} kind="sm primary" onClick={onMore} />
              </div>
            ) : null}
          </>
        ) : (
          <Empty icon={Timer} title={t("No attempt against the clock yet")} />
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ a, status }: { a: ClockAttempt; status: AttemptStatus }) {
  const { t, fmtDate } = useLocale();
  switch (status) {
    case "counted":
      return <Badge kind="success" icon={CircleCheck}>{t("Counted")}</Badge>;
    case "removed":
      return <Badge kind="danger" icon={Undo2} title={fmtDate(a.removed_at)}>{t("Taken off")}</Badge>;
    case "unsent":
      return <Badge icon={CircleSlash}>{t("Never sent")}</Badge>;
    case "failed":
      return <Badge kind="warning" icon={CircleSlash}>{t("Not cleared")}</Badge>;
    default:
      return <Badge>{t("Not counted")}</Badge>;
  }
}

function AttemptTable({ list }: { list: ClockAttempt[] }) {
  const { t, tf, fmtNum, fmtDate } = useLocale();
  const admin = useIsAdmin();
  const actions = useModeActions();
  return (
    <DataTable headers={[t("Started"), { label: t("Time on the clock"), cls: "num" }, { label: t("Strokes"), cls: "num" }, { label: t("Fouls"), cls: "num" }, t("Week"), t("Status"), ""]}>
      {list.map((a) => {
        const status = attemptStatus(a);
        return (
          <tr key={a.id} className={status === "removed" ? "attempt-removed" : ""}>
            <td className="nowrap">{fmtDate(a.started_ms / 1000)}</td>
            <td className="num">{a.time ? <span className="clock-time">{a.time}</span> : <span className="faint">—</span>}</td>
            <td className="num">{a.shots !== null ? fmtNum(a.shots) : "—"}</td>
            <td className="num">{a.fouls !== null ? (a.fouls ? <span title={t("10 seconds added for each")}>{fmtNum(a.fouls)}</span> : "0") : "—"}</td>
            <td className="nowrap">{a.week !== null ? <Link href={"/admin/time-attack?week=" + a.week}>{tf("Week {n}", { n: a.week })}</Link> : <span className="faint">—</span>}</td>
            <td>
              <StatusBadge a={a} status={status} />
              {status === "removed" && a.removed_reason ? <div className="removed-why">{a.removed_reason}</div> : null}
            </td>
            <td className="actions-cell">
              {admin && a.counted ? (
                <Btn label={t("Take off the ranking")} kind="sm ghost" icon={Undo2} iconOnly onClick={() => actions.removeAttempt(a)} />
              ) : null}
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
