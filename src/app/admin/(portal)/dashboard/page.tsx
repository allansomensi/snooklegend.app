"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, CalendarRange, ChartColumn, ChartNoAxesCombined, CircleCheck, Coins, FileText, Flag, Gavel, ListOrdered, Percent, Timer, Trophy, User, Users, UsersRound, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuditMini } from "@/admin/components/audit";
import { useLocale } from "@/admin/components/providers/locale";
import { ReasonBadge } from "@/admin/components/report-reason";
import {
  AlertBox, Btn, Card, CardHead, Empty, HealthRow, Kpi, PageHead, TimeAgo, Updated, clickable, usePerRules,
} from "@/admin/components/ui/bits";
import { Chart } from "@/admin/components/ui/charts";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { api } from "@/admin/lib/api";
import { useApi, useMe } from "@/admin/lib/hooks";
import { parseClockWeek, parseDoublesPage } from "@/admin/lib/modes";
import { healthTone } from "@/admin/lib/ops";
import type { AuditEntry, CalendarRange as Range, CoinAnalytics, Maintenances, Metrics, Overview, Report } from "@/admin/lib/types";
import { msg } from "@/admin/i18n";

export default function DashboardPage() {
  const overview = useApi<Overview>("/overview", { refetchInterval: 60000 });
  const metrics = useApi<Metrics>("/metrics", { refetchInterval: 60000 });
  const reports = useApi<{ reports: Report[] }>("/reports?status=open");
  const audit = useApi<{ entries: AuditEntry[] }>("/audit");
  const refresh = () => [overview, metrics, reports, audit].forEach((q) => void q.refetch());
  return (
    <Loaded queries={[overview, metrics, reports, audit]}>
      {(o, m, rep, aud) => <Dashboard o={o} m={m} reports={rep.reports} audit={aud.entries} at={updatedAt(overview, metrics, reports, audit)} onRefresh={refresh} />}
    </Loaded>
  );
}

function Dashboard({ o, m, reports, audit, at, onRefresh }: { o: Overview; m: Metrics; reports: Report[]; audit: AuditEntry[]; at: number; onRefresh: () => void }) {
  const { t, tf, tn, lang, fmtNum, fmtPct, fmtDuration, money } = useLocale();
  const me = useMe();
  const router = useRouter();
  const perRules = usePerRules();
  const open = o.stored.open_reports || 0;
  const hour = new Date().getHours();
  const hello = hour < 12 ? t("Good morning, {name}") : hour < 18 ? t("Good afternoon, {name}") : t("Good evening, {name}");
  const today = new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const hours = m.metrics.hours || [];
  const label = (h: number) => String(new Date(h * 3600000).getHours()).padStart(2, "0") + "h";
  const title = (h: number) => new Intl.DateTimeFormat(lang, { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(h * 3600000));
  const revenue = (m.metrics.revenue || []).filter((r) => r[0] !== "msstore");
  const recentAudit = audit.filter((e) => e.action !== "login").slice(0, 8);

  return (
    <div>
      <PageHead title={hello.split("{name}").join(me.username)} sub={today.charAt(0).toUpperCase() + today.slice(1)}>
        <Updated at={at} onRefresh={onRefresh} />
      </PageHead>
      <div className="stack">
        {!o.persistent ? <AlertBox tone="danger" title={t("Nothing is saved")} text={t("This server keeps everything in memory: accounts and games are lost when it stops.")} /> : null}
        {m.draining ? <AlertBox tone="warning" title={t("The server is restarting")} text={t("No new games start; the games in progress move to the next server.")} /> : null}
        {o.online >= 4 && o.addresses === 1 ? (
          <AlertBox tone="warning" title={t("Every player comes from one address")} text={t("Set SNOOK_LEGEND_CLIENT_IP_HEADER (see DEPLOY.md), or the limits per address will turn players away.")} />
        ) : null}
        <MaintenanceAlert />
        {open > 0 ? (
          <AlertBox tone="info" title={tn(open, "{n} report waiting", "{n} reports waiting")} text={t("Players are waiting for an answer.")}
            action={<Btn label={t("Review")} kind="sm" onClick={() => router.push("/admin/reports")} />} />
        ) : null}
      </div>
      <div className="kpis section">
        <Kpi label={t("Online now")} value={fmtNum(o.online)} sub={perRules(o.online_by_rules)} icon={Users} tone="success" href="/admin/live" />
        <Kpi label={t("Games now")} value={fmtNum(o.matches_live)} sub={tn(o.tables_open, "{n} open table", "{n} open tables")} icon={Activity} tone="info" href="/admin/live" />
        <Kpi label={t("In the queue")} value={fmtNum(m.queue.size)} sub={tf("median wait {s} s", { s: fmtNum(m.queue.median_wait_secs) })} icon={ListOrdered} />
        <Kpi label={t("Open reports")} value={fmtNum(open)} sub={open ? t("waiting for review") : t("all caught up")} icon={Flag} tone={open ? "danger" : "success"} href="/admin/reports" />
        <Kpi label={t("Accounts")} value={fmtNum(o.stored.users)} sub={tf("+{n} in 7 days", { n: fmtNum(o.stored.new_users_7d) })} icon={User} href="/admin/players" />
        <Kpi label={t("Active in 7 days")} value={fmtNum(o.stored.active_users_7d)}
          sub={o.stored.users ? fmtPct((o.stored.active_users_7d * 100) / o.stored.users) + " " + t("of the accounts") : null} icon={Activity} tone="success" href="/admin/metrics" />
        <Kpi label={t("Games in 24 h")} value={fmtNum(o.stored.matches_24h)}
          sub={perRules(o.stored.matches_24h_by_rules) + " · " + tf("{n} in all", { n: fmtNum(o.stored.matches_total) })} icon={Trophy} href="/admin/metrics" />
        <Kpi label={t("Revenue in 30 days")} value={revenue.length ? money(revenue[0][1], revenue[0][0]) : "—"}
          sub={revenue.length > 1 ? tf("and {n} other currencies", { n: revenue.length - 1 }) : revenue.length ? tn(revenue[0][2], "{n} payment", "{n} payments") : t("no payments")}
          icon={Coins} tone="warning" href="/admin/economy" />
        <EconomyKpi />
        <DoublesKpi />
        <ClockKpi />
      </div>
      <div className="grid-aside section">
        <div className="stack">
          <Card>
            <CardHead title={t("Activity in the last 48 hours")} sub={t("Players active each hour and the most online at once")} />
            <div className="card-body">
              {hours.some((h) => h.active > 0 || h.peak_players > 0) ? (
                <Chart labels={hours.map((h) => label(h.hour))} titles={hours.map((h) => title(h.hour))}
                  bars={{ values: hours.map((h) => h.active), name: t("Players active"), cls: "c-accent" }}
                  line={{ values: hours.map((h) => h.peak_players), name: t("Most online at once"), cls: "c-info" }} every={6} height={210} />
              ) : (
                <Empty icon={ChartColumn} title={t("No activity yet")} text={t("The server counts who is online every minute: the first hour shows up shortly.")} />
              )}
            </div>
          </Card>
          <Card>
            <CardHead title={t("Staff activity")}>
              <Btn label={t("Audit log")} kind="sm ghost" onClick={() => router.push("/admin/audit")} />
            </CardHead>
            {recentAudit.length ? (
              <div className="mini-list">{recentAudit.map((e) => <AuditMini key={e.id} e={e} />)}</div>
            ) : (
              <Empty icon={FileText} title={t("Nothing yet")} text={t("Every staff action is written here.")} />
            )}
          </Card>
        </div>
        <div className="stack">
          <ComingUp />
          <Card>
            <CardHead title={t("Open reports")}>
              <Btn label={t("See all")} kind="sm ghost" onClick={() => router.push("/admin/reports")} />
            </CardHead>
            {reports.length ? (
              <div className="mini-list">
                {reports.slice(0, 6).map((r) => (
                  <div key={r.id} className="mi click" {...clickable(() => router.push("/admin/reports"))}>
                    <ReasonBadge reason={r.reason} />
                    <div className="mi-main">
                      <b>{r.target}</b>
                      <span className="mi-sub">{tf("by {name}", { name: r.reporter })}</span>
                    </div>
                    <span className="mi-side"><TimeAgo at={r.created_at} /></span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon={CircleCheck} title={t("No open reports")} text={t("Nothing waits for the staff.")} />
            )}
          </Card>
          <Card>
            <CardHead title={t("The server")} />
            <div className="card-body health">
              <HealthRow ok={o.persistent} text={o.persistent ? t("Saved in the database") : t("Kept in memory only")} />
              <HealthRow ok={!m.draining} text={m.draining ? t("Restarting: no new games") : t("Taking new games")} />
              <HealthRow ok text={tf("Up for {time}", { time: fmtDuration(o.uptime_secs) })} side={"v" + o.version} />
              <HealthRow ok text={tn(o.addresses, "Players online from {n} address", "Players online from {n} addresses")} />
              {o.motd ? (
                <div className="preview-box">
                  <span className="faint">{t("Welcome message")}</span>
                  {o.motd}
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** A maintenance planned: when the server stops. */
function MaintenanceAlert() {
  const { t, tf, fmtDate, ago } = useLocale();
  const router = useRouter();
  const q = useApi<Maintenances>("/maintenance", { refetchInterval: 60000 });
  const m = q.data?.maintenance.find((x) => x.status === "scheduled" || x.status === "due" || x.status === "started");
  if (!m) return null;
  return (
    <AlertBox tone="warning" title={tf("Maintenance {when}", { when: ago(m.at) })} text={fmtDate(m.at) + (m.message ? " · " + m.message : "")}
      action={<Btn label={t("Open")} kind="sm" icon={Wrench} onClick={() => router.push("/admin/maintenance")} />} />
  );
}

const HEALTH_WORD: Record<string, string> = {
  healthy: msg("Healthy"), watch: msg("Watch"), inflating: msg("Inflating"), deflating: msg("Deflating"), unknown: msg("Not known"),
};

/** The coin economy's health this week. */
function EconomyKpi() {
  const { t, fmtNum, fmtPct } = useLocale();
  const q = useApi<CoinAnalytics>("/analytics/coins?days=7");
  const d = q.data;
  return (
    <Kpi label={t("Coin economy")} value={d ? t(HEALTH_WORD[d.health] || d.health) : "—"}
      sub={d ? (d.net_7d > 0 ? "+" : "") + fmtNum(d.net_7d) + " · " + fmtPct(d.net_7d_percent, 2) + " " + t("in 7 days") : null}
      icon={ChartNoAxesCombined} tone={d ? healthTone(d.health) : ""} href="/admin/analytics" />
  );
}

/** The doubles games being played now. */
function DoublesKpi() {
  const { t, tn, fmtNum } = useLocale();
  const q = useQuery({
    queryKey: ["doubles-live"],
    queryFn: async ({ signal }) => parseDoublesPage(await api("/doubles?limit=1", { signal })).live,
    refetchInterval: 60000,
  });
  const playing = q.data?.filter((g) => !g.finished) || [];
  return (
    <Kpi label={t("Doubles now")} value={q.data ? fmtNum(playing.length) : "—"}
      sub={q.data ? tn(playing.filter((g) => g.rated).length, "{n} rated", "{n} rated") : null} icon={UsersRound} tone="info" href="/admin/doubles" />
  );
}

/** This week against the clock: how many play it, the quickest. */
function ClockKpi() {
  const { t, tf, tn } = useLocale();
  const q = useQuery({
    queryKey: ["/time-attack", null, 1],
    queryFn: async ({ signal }) => parseClockWeek(await api("/time-attack?limit=1", { signal })),
    refetchInterval: 300000,
  });
  const w = q.data;
  return (
    <Kpi label={t("Against the clock")} value={w ? tn(w.players, "{n} player", "{n} players") : "—"}
      sub={w ? (w.board[0] ? tf("quickest {time} · {name}", { time: w.board[0].time, name: w.board[0].username }) : t("nobody this week yet")) : null}
      icon={Timer} tone="warning" href="/admin/time-attack" />
  );
}

const KIND_ICON: Record<string, typeof Trophy> = { promotion: Percent, auction: Gavel, maintenance: Wrench, tournament: Trophy, weekly_cup: Trophy };

/** What starts or runs in the next 7 days (the calendar). */
function ComingUp() {
  const { t, fmtDate, ago } = useLocale();
  const router = useRouter();
  const q = useApi<Range>("/calendar", { refetchInterval: 300000 });
  const d = q.data;
  const list = d ? d.items.filter((i) => i.status !== "cancelled" && i.status !== "ended" && i.kind !== "vip_item" && i.starts_at < d.now + 7 * 86400).slice(0, 6) : [];
  return (
    <Card>
      <CardHead title={t("This week")}>
        <Btn label={t("Calendar")} kind="sm ghost" icon={CalendarRange} onClick={() => router.push("/admin/calendar")} />
      </CardHead>
      {list.length ? (
        <div className="mini-list">
          {list.map((i) => {
            const Icon = KIND_ICON[i.kind] || CalendarRange;
            return (
              <div key={i.kind + i.starts_at + String(i.id)} className="mi">
                <span className={"tl-dot " + (i.status === "live" ? "success" : "info")}><Icon className="icon" aria-hidden /></span>
                <div className="mi-main">
                  <b className="ellipsis">{i.title}</b>
                  <span className="mi-sub">{fmtDate(i.starts_at)}</span>
                </div>
                <span className="mi-side">{i.status === "live" ? t("Running") : ago(i.starts_at)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={CalendarRange} title={d ? t("Nothing scheduled") : t("Loading…")} />
      )}
    </Card>
  );
}
