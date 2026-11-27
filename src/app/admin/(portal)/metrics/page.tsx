"use client";

import { Activity, ChartColumn, ChartNoAxesCombined, Clock, Download, Globe, ListOrdered, Trophy, Undo2, Users } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/admin/components/providers/locale";
import { AlertBox, Card, CardHead, Country, DataTable, Empty, Kpi, PageHead, Updated, usePerRules } from "@/admin/components/ui/bits";
import { BarList, Chart } from "@/admin/components/ui/charts";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { useApi, useIsAdmin } from "@/admin/lib/hooks";
import { gamesByRules } from "@/admin/lib/rules";
import type { Metrics } from "@/admin/lib/types";
import "@/admin/styles/business.css";

export default function MetricsPage() {
  const q = useApi<Metrics>("/metrics", { refetchInterval: 60000 });
  return <Loaded queries={[q]}>{(d) => <MetricsView d={d} at={updatedAt(q)} onRefresh={() => void q.refetch()} />}</Loaded>;
}

function MetricsView({ d, at, onRefresh }: { d: Metrics; at: number; onRefresh: () => void }) {
  const { t, tf, tn, lang, fmtNum, fmtPct, fmtDay, fmtDayLong, money } = useLocale();
  const perRules = usePerRules();
  const admin = useIsAdmin();
  const m = d.metrics;
  const q = d.queue;
  const hours = m.hours || [];
  const hourLabel = (h: number) => String(new Date(h * 3600000).getHours()).padStart(2, "0") + "h";
  const hourTitle = (h: number) => new Intl.DateTimeFormat(lang, { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(h * 3600000));
  const hourLabels = hours.map((h) => hourLabel(h.hour));
  const hourTitles = hours.map((h) => hourTitle(h.hour));

  const today = Math.floor(d.now / 86400);
  const days = Array.from({ length: 30 }, (_, k) => today - 29 + k);
  const currencies = [...new Set(m.revenue_days.map((r) => r[1]))].filter((c) => c !== "msstore").sort();
  const recent = q.recent || [];
  const week = m.days.slice(-7);
  const perDay = week.length ? week.reduce((a, x) => a + x[2], 0) / week.length : 0;
  const f = m.funnel;
  const countries = d.countries || [];
  const totalActive = countries.reduce((a, c) => a + c[1], 0);
  const level = (x: number | null | undefined) => (x === null || x === undefined ? "h0" : x >= 40 ? "h4" : x >= 25 ? "h3" : x >= 12 ? "h2" : x > 0 ? "h1" : "h0");
  const pct = (x: number | null | undefined) => <td className={"hcell " + level(x)}>{x === null || x === undefined ? "—" : fmtPct(x, 0)}</td>;
  const longest = q.waiting.reduce((a, w) => Math.max(a, w.secs), 0);

  const funnelStep = (label: string, n: number) => (
    <div className="f-step">
      <div className="f-top">
        <span>{label}</span>
        <b>{fmtNum(n) + (f[0] ? " · " + fmtPct((n * 100) / f[0], 0) : "")}</b>
      </div>
      <div className="f-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={f[0] || 0} aria-valuenow={n}>
        <div className="f-fill" style={{ width: (f[0] ? Math.max(n ? 2 : 0, (n * 100) / f[0]) : 0) + "%" }} />
      </div>
    </div>
  );

  return (
    <div className="stack">
      <PageHead title={t("Metrics")} sub={t("How many play, how long they stay, what they pay · refreshes every minute")}>
        <Updated at={at} onRefresh={onRefresh} />
        <Link className="btn" href="/admin/analytics"><ChartNoAxesCombined className="icon" aria-hidden />{t("Analytics")}</Link>
        {admin ? <Link className="btn" href="/admin/exports?kind=daily"><Download className="icon" aria-hidden />{t("Export CSV")}</Link> : null}
      </PageHead>
      {d.draining ? <AlertBox tone="warning" title={t("The server is restarting")} text={t("No new games start; the games in progress move to the next server.")} /> : null}
      <div className="kpis">
        <Kpi label={t("Online now")} value={fmtNum(d.online)} sub={perRules(d.online_by_rules)} icon={Users} tone="success" />
        <Kpi label={t("Games now")} value={fmtNum(d.games)} icon={Activity} tone="info" />
        <Kpi label={t("In the queue")} value={fmtNum(q.size)}
          sub={q.size ? perRules(gamesByRules(q.waiting)) + " · " + tf("longest {s} s", { s: fmtNum(longest) }) : t("nobody waiting")} icon={ListOrdered} />
        <Kpi label={t("Median wait")} value={tf("{s} s", { s: fmtNum(q.median_wait_secs) })}
          sub={tf("average {s} s · {n} pairings", { s: fmtNum(Math.round(q.avg_wait_secs)), n: fmtNum(q.pairs) })} icon={Clock} />
        <Kpi label={t("Back the next day")} value={fmtPct(m.retention_d1)} icon={Undo2} tone="success" />
        <Kpi label={t("Back after 7 days")} value={fmtPct(m.retention_d7)} icon={Undo2} tone="success" />
        <Kpi label={t("Back after 30 days")} value={fmtPct(m.retention_d30)} icon={Undo2} tone="success" />
        <Kpi label={t("Games per day")} value={new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(perDay)} sub={t("average of the last 7 days")} icon={Trophy} tone="warning" />
      </div>

      <Card>
        <CardHead title={t("Players and games, day by day")} sub={t("The last 30 days")} />
        <div className="card-body">
          {m.days.some((x) => x[1] > 0 || x[2] > 0) ? (
            <Chart labels={m.days.map((x) => fmtDay(x[0]))} titles={m.days.map((x) => fmtDayLong(x[0]))}
              bars={{ values: m.days.map((x) => x[1]), name: t("Players active"), cls: "c-accent" }}
              line={{ values: m.days.map((x) => x[2]), name: t("Games"), cls: "c-success" }} />
          ) : (
            <Empty icon={ChartColumn} title={t("Nobody played in the last 30 days")} />
          )}
        </div>
      </Card>

      <div className="grid-2">
        <Card>
          <CardHead title={t("Players by hour")} sub={t("The last 48 hours")} />
          <div className="card-body">
            {hours.some((h) => h.peak_players > 0 || h.active > 0) ? (
              <Chart labels={hourLabels} titles={hourTitles} width={560} every={8}
                bars={{ values: hours.map((h) => h.active), name: t("Players active"), cls: "c-accent" }}
                line={{ values: hours.map((h) => h.peak_players), name: t("Most online at once"), cls: "c-info" }} />
            ) : (
              <Empty icon={ChartColumn} title={t("No samples yet")} text={t("The server counts who is online every minute: the first hour shows up shortly.")} />
            )}
          </div>
        </Card>
        <Card>
          <CardHead title={t("Games by hour")} sub={t("The last 48 hours")} />
          <div className="card-body">
            {hours.some((h) => h.games > 0 || h.peak_games > 0) ? (
              <Chart labels={hourLabels} titles={hourTitles} width={560} every={8}
                bars={{ values: hours.map((h) => h.games), name: t("Games finished"), cls: "c-success" }}
                line={{ values: hours.map((h) => h.peak_games), name: t("Most games at once"), cls: "c-info" }} />
            ) : (
              <Empty icon={Activity} title={t("No games in the last 48 hours")} />
            )}
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <CardHead title={t("From account to player")} sub={t("Accounts made in the last 30 days")} />
          <div className="card-body funnel">
            {funnelStep(t("Accounts made"), f[0])}
            {funnelStep(t("Played a game"), f[1])}
            {funnelStep(t("Played five games"), f[2])}
            <p className="faint">{t("Installs are not counted: the game sends nothing before signing in.")}</p>
          </div>
        </Card>
        <Card>
          <CardHead title={t("Where players come from")} sub={tf("Active in the last 30 days · {n} countries", { n: fmtNum(countries.length) })} />
          <div className="card-body">
            {countries.length ? (
              <BarList
                rows={countries.slice(0, 15).map(([c, n]) => ({ key: c, label: <Country code={c} />, value: n }))}
                format={(v) => fmtNum(v) + (totalActive ? " · " + fmtPct((v * 100) / totalActive, 0) : "")}
              />
            ) : (
              <Empty icon={Globe} title={t("Nobody yet")} />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title={t("Who comes back, by week of sign-up")} sub={t("Back on day N: active exactly N days after the account was made")} />
        {(m.cohorts || []).length ? (
          <DataTable className="heat" cards={false} headers={[t("Accounts made"), { label: t("Accounts"), cls: "num" }, t("Day 1"), t("Day 7"), t("Day 30")]}>
            {(m.cohorts || []).map((c) => (
              <tr key={c.first_day}>
                <td className="nowrap">{fmtDay(c.first_day) + " – " + fmtDay(c.first_day + 6)}</td>
                <td className="num">{fmtNum(c.accounts)}</td>
                {pct(c.d1)}
                {pct(c.d7)}
                {pct(c.d30)}
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty icon={Users} title={t("No accounts yet")} />
        )}
      </Card>

      {currencies.length ? (
        <div>
          <div className="section-head">
            <h2>{t("Revenue by day")}</h2>
            <span className="sub">{t("The last 30 days · test payments left out")}</span>
          </div>
          <div className="grid-2">
            {currencies.map((cur) => {
              const by = new Map(m.revenue_days.filter((r) => r[1] === cur).map((r) => [r[0], r[2]]));
              const total = m.revenue.find((r) => r[0] === cur) || [cur, 0, 0];
              return (
                <Card key={cur}>
                  <CardHead title={cur.toUpperCase()} sub={money(total[1], cur) + " · " + tn(total[2], "{n} payment", "{n} payments")} />
                  <div className="card-body">
                    <Chart labels={days.map(fmtDay)} titles={days.map(fmtDayLong)} height={190} width={520}
                      bars={{ values: days.map((day) => (by.get(day) || 0) / 100), name: t("Revenue"), cls: "c-success",
                        format: (v) => new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(v) }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      <Card>
        <CardHead title={t("“Play now”: the latest waits")} sub={t("Each pairing counts both players")} />
        <div className="card-body">
          {recent.length ? (
            <Chart labels={recent.map(() => "")} titles={recent.map((_, k) => tf("Pairing {n} of the latest {total}", { n: k + 1, total: recent.length }))}
              bars={{ values: recent, name: t("Wait (seconds)"), cls: "c-accent" }} every={0} height={140} unit=" s" />
          ) : (
            <Empty icon={ListOrdered} title={t("Nobody paired yet")} text={t("Nobody has been paired by “Play now” since the server started.")} />
          )}
        </div>
      </Card>
    </div>
  );
}
