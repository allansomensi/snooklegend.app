"use client";

import { CalendarDays, Crown, Target, Trophy } from "lucide-react";
import type { UserDetail } from "@/admin/lib/types";
import { useLocale } from "../providers/locale";
import { Badge, Card, CardHead, DataTable, Empty, Kpi } from "../ui/bits";

type Medals = [number, number, number];
const sum = (a: Medals) => a[0] + a[1] + a[2];

/** What the player did against the computer: the tour, the medals of its
 * tournaments, the drills and the daily challenges (as the server knows
 * them: progress on the tour before its final stays in the player's game). */
export function PlayerComputer({ d }: { d: UserDetail }) {
  const { t, tf, tn, fmtNum, fmtDate } = useLocale();
  const c = d.computer || {};
  const medals = c.medals || { knockout: [0, 0, 0] as Medals, arena: [0, 0, 0] as Medals };
  const allMedals = sum(medals.knockout) + sum(medals.arena);
  const golds = medals.knockout[0] + medals.arena[0];
  const formatName = (f: string) => (f === "arena" ? t("Arena") : t("Knockout"));
  const placeName = (p: number) => [t("Gold"), t("Silver"), t("Bronze")][p - 1] || String(p);
  const placeTone = (p: number) => ["warning", "", "danger"][p - 1] || "";
  const finals = c.finals || 0;
  const tourSub = c.tour_won_at ? tf("on {when}", { when: fmtDate(c.tour_won_at) }) : finals ? tn(finals, "{n} final played", "{n} finals played") : t("No final played yet");
  const recent = c.recent_medals || [];
  const drills = (c.drills || []).slice().sort((a, b) => b.stars - a.stars || b.best - a.best);
  const stars = { n: c.drill_stars || 0, max: c.drill_stars_max || 0 };
  const medalRow = (label: string, m: Medals) => (
    <tr>
      <td>{label}</td>
      <td className="num">{fmtNum(m[0])}</td>
      <td className="num">{fmtNum(m[1])}</td>
      <td className="num">{fmtNum(m[2])}</td>
      <td className="num"><b>{fmtNum(sum(m))}</b></td>
    </tr>
  );
  return (
    <div className="stack">
      <div className="kpis">
        <Kpi label={t("The tour")} value={c.tour_won_at ? t("Won") : t("Not won yet")} sub={tourSub} icon={Crown} tone={c.tour_won_at ? "success" : ""} />
        <Kpi label={t("Tournament medals")} value={fmtNum(allMedals)} sub={tn(golds, "{n} gold", "{n} gold")} icon={Trophy} tone="warning" />
        <Kpi label={t("Drill stars")} value={tf("{n} of {max}", stars)} sub={tn(drills.length, "{n} drill done", "{n} drills done")} icon={Target} tone="info" />
        <Kpi label={t("Daily challenges topped")} value={fmtNum(c.daily_wins || 0)} icon={CalendarDays} />
      </div>
      <Card>
        <CardHead title={t("The tour")} sub={t("Its final is checked by the server; the stages before it stay in the player's game.")} />
        <div className="card-body stack">
          <div>{c.tour_won_at ? tf("Won the final on {when}: the tour's cue and achievement.", { when: fmtDate(c.tour_won_at) }) : t("Has not won the tour's final yet.")}</div>
          <div className="faint">
            {finals
              ? tf("{n} finals dealt by the server (of the latest {kept} kept), the last on {when}.", { n: fmtNum(finals), kept: c.finals_kept || finals, when: fmtDate(c.last_final) })
              : t("No final dealt yet.")}
          </div>
        </div>
      </Card>
      <Card>
        <CardHead title={t("Medals of the tournaments against the computer")} sub={t("Kept in the account once the player is online; shown only here and on the game's Tournament tab.")} />
        <DataTable cards={false} headers={[t("Format"), { label: t("Gold"), cls: "num" }, { label: t("Silver"), cls: "num" }, { label: t("Bronze"), cls: "num" }, { label: t("Total"), cls: "num" }]}>
          {medalRow(t("Knockout"), medals.knockout)}
          {medalRow(t("Arena"), medals.arena)}
        </DataTable>
      </Card>
      {recent.length ? (
        <Card>
          <CardHead title={t("Latest medals")} sub={tn(recent.length, "{n} shown", "{n} shown")} />
          <DataTable headers={[t("When"), t("Medal"), t("Format"), t("Tournament")]}>
            {recent.map((m, k) => (
              <tr key={k}>
                <td className="nowrap">{fmtDate(m.at)}</td>
                <td><Badge kind={placeTone(m.place)}>{placeName(m.place)}</Badge></td>
                <td>{formatName(m.format)}</td>
                <td className="mono faint">#{m.cup}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
      ) : null}
      <Card>
        <CardHead title={t("Drills")} sub={tf("{n} of {max} stars", stars)} />
        {drills.length ? (
          <DataTable cards={false} headers={[t("Drill"), { label: t("Best"), cls: "num" }, t("Stars")]}>
            {drills.map((x) => (
              <tr key={x.code}>
                <td>{x.name ? t(x.name) : x.code}</td>
                <td className="num">{fmtNum(x.best)}</td>
                <td>
                  <span className="stars" role="img" aria-label={tf("{n} of {max}", { n: x.stars, max: 3 })}>
                    {"★".repeat(x.stars)}
                    <span className="faint">{"☆".repeat(Math.max(0, 3 - x.stars))}</span>
                  </span>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <div className="card-body"><Empty icon={Target} title={t("No drill done yet")} /></div>
        )}
      </Card>
    </div>
  );
}
