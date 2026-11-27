"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronLeft, ChevronRight, Coins, History, Timer, Users } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/admin/components/providers/locale";
import { AlertBox, Badge, Btn, Card, CardHead, DataTable, Empty, Flag, Kpi, PageHead, PersonLink, Updated, playerHref } from "@/admin/components/ui/bits";
import { Loaded } from "@/admin/components/ui/loaded";
import { api } from "@/admin/lib/api";
import { useQueryParams } from "@/admin/lib/hooks";
import { parseClockWeek, weekDate, weekOfDate, weekParam } from "@/admin/lib/modes";
import type { ClockWeek } from "@/admin/lib/types";
import "@/admin/styles/modes.css";

const SHORT = 100;
const LONG = 500;

/** Against the clock: a week's table (this week's, or any other), each
 * player's best, quickest first, with the prizes of the first three. */
export default function TimeAttackPage() {
  const { t } = useLocale();
  const { get, set } = useQueryParams();
  const week = weekParam(get("week"));
  const limit = get("all") ? LONG : SHORT;
  const q = useQuery({
    queryKey: ["/time-attack", week, limit],
    queryFn: async ({ signal }) =>
      parseClockWeek(await api("/time-attack?" + new URLSearchParams({ limit: String(limit), ...(week !== null ? { week: String(week) } : {}) }), { signal })),
    placeholderData: (prev) => prev,
    refetchInterval: 60000,
  });
  return (
    <div className="modes-page">
      <PageHead title={t("Against the clock")} sub={t("Each player's best of the week, quickest first, as the game shows it (banned and deleted players left out)")}>
        {q.data ? <Updated at={q.dataUpdatedAt} onRefresh={() => void q.refetch()} /> : null}
      </PageHead>
      <Loaded queries={[q]}>{(w) => <Week w={w} stale={q.isFetching} limit={limit} onWeek={(n) => set({ week: n, all: null })} onAll={() => set({ all: 1 })} />}</Loaded>
    </div>
  );
}

function Week({ w, stale, limit, onWeek, onAll }: { w: ClockWeek; stale: boolean; limit: number; onWeek: (week: number | null) => void; onAll: () => void }) {
  const { t, tf, tn, fmtNum, fmtDate, fmtDateOnly, ago } = useLocale();
  const current = w.week === w.this_week;
  const future = w.week > w.this_week;
  const go = (n: number) => onWeek(n === w.this_week ? null : n);
  const lastDay = w.ends_at - 86400;
  const prize = (place: number) => (place >= 1 && place <= w.prizes.length && w.prizes[place - 1] > 0 ? w.prizes[place - 1] : 0);
  return (
    <div className="stack">
      <Card>
        <div className="card-body row between">
          <div className="week-head">
            <b className="week-name">{tf("{from} to {to}", { from: fmtDateOnly(w.starts_at), to: fmtDateOnly(lastDay) })}</b>
            <span className="faint">{tf("Week {n} · Monday to Sunday, UTC", { n: w.week })}</span>
          </div>
          <div className="week-picker" role="group" aria-label={t("Week")}>
            <Btn label={t("The week before")} kind="sm" icon={ChevronLeft} iconOnly onClick={() => go(w.week - 1)} />
            <input className="input" type="date" aria-label={t("A day of the week to show")} value={weekDate(w.week)}
              onChange={(e) => {
                const n = weekOfDate(e.target.value);
                if (n !== null) go(n);
              }} />
            <Btn label={t("The week after")} kind="sm" icon={ChevronRight} iconOnly disabled={w.week >= w.this_week} onClick={() => go(w.week + 1)} />
            {current ? <Badge kind="success dot">{t("This week")}</Badge> : <Btn label={t("This week")} kind="sm" icon={CalendarClock} onClick={() => onWeek(null)} />}
          </div>
        </div>
      </Card>

      {future ? <AlertBox tone="info" title={t("This week hasn't started")} text={t("Nobody can have played it yet.")} /> : null}
      {!current && !future ? (
        <AlertBox tone="info" title={t("A past week")}
          text={tf("Its prizes were paid with the settings of its Monday, not those shown here: the coin ledger has them (reference time_attack:{week}:1, :2, :3).", { week: w.week })} />
      ) : null}

      <div className="kpis">
        <Kpi label={t("Players")} value={fmtNum(w.players)} sub={current ? tf("ends {when}", { when: ago(w.ends_at) }) : tf("ended {when}", { when: fmtDate(w.ends_at) })} icon={Users} tone="success" />
        <Kpi label={t("Quickest")} value={w.board[0] ? <span className="clock-time">{w.board[0].time}</span> : "—"} sub={w.board[0]?.username || t("nobody yet")} icon={Timer} tone="info" />
        <Kpi label={current ? t("Prizes") : t("Prizes set now")} value={w.prizes.some((p) => p > 0) ? w.prizes.map((p) => fmtNum(p)).join(" · ") : t("None")}
          sub={t("coins to the first three, paid on Monday")} icon={Coins} tone="warning" href="/admin/settings#group-economy" />
      </div>

      <Card className={stale ? "loading-soft" : ""}>
        <CardHead title={t("The table")} sub={tn(w.players, "{n} player", "{n} players")} />
        {w.board.length ? (
          <>
            <DataTable lead={2} headers={[{ label: t("Place"), cls: "num" }, t("Player"), { label: t("Best time"), cls: "num" }, t("Set"), { label: t("Prize"), cls: "num" }, ""]}>
              {w.board.map((r) => (
                <tr key={r.user_id || r.username}>
                  <td className="num"><span className={"place" + (r.place <= 3 ? " p" + r.place : "")}>{r.place}</span></td>
                  <td><span className="who"><PersonLink name={r.username} /><Flag code={r.country} /></span></td>
                  <td className="num"><span className="clock-time">{r.time}</span></td>
                  <td className="nowrap">{fmtDate(r.at)}</td>
                  <td className="num">{prize(r.place) ? tf("{n} coins", { n: fmtNum(prize(r.place)) }) : <span className="faint">—</span>}</td>
                  <td className="actions-cell">
                    <Link className="btn sm ghost" href={playerHref(r.username, "clock")} aria-label={tf("{name}'s attempts", { name: r.username })}>
                      <History className="icon" aria-hidden />{t("Attempts")}
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
            <div className="pager">
              <span>{tf("{n} of {all} shown", { n: fmtNum(w.board.length), all: fmtNum(w.players) })}</span>
              {w.players > w.board.length && limit < LONG ? <Btn label={tf("Show up to {n}", { n: fmtNum(LONG) })} kind="sm primary" onClick={onAll} /> : null}
            </div>
          </>
        ) : (
          <Empty icon={Timer} title={t("Nobody in this week's table")} text={future ? null : t("A time counts once a player clears the table against the clock.")} />
        )}
      </Card>
    </div>
  );
}
