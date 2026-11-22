"use client";

import { Activity, Clock, ListOrdered, MemoryStick, Plug, Server, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useLocale } from "@/components/providers/locale";
import {
  Badge, Card, CardHead, DataTable, Empty, HealthRow, Kpi, PageHead, PersonLink, RoleBadge, RulesBadge, TimeAgo, Updated, clickable, playerHref, usePerRules,
} from "@/components/ui/bits";
import { Loaded, updatedAt } from "@/components/ui/loaded";
import { useApi } from "@/lib/hooks";
import type { System, UsersPage } from "@/lib/types";

export default function SystemPage() {
  const system = useApi<System>("/system", { refetchInterval: 30000 });
  const staff = useApi<UsersPage>("/users?filter=staff&sort=name", { refetchInterval: 30000 });
  return (
    <Loaded queries={[system, staff]}>
      {(s, st) => <SystemView s={s} staff={st} at={updatedAt(system, staff)} onRefresh={() => [system, staff].forEach((q) => void q.refetch())} />}
    </Loaded>
  );
}

function Kv({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function SystemView({ s, staff, at, onRefresh }: { s: System; staff: UsersPage; at: number; onRefresh: () => void }) {
  const { t, tf, tn, lang, fmtNum, fmtDate, fmtDuration, fmtMinutes, fmtBytes } = useLocale();
  const perRules = usePerRules();
  const router = useRouter();
  const r = s.settings;
  const weekday = (d: number) => new Intl.DateTimeFormat(lang, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + d)));
  const oneAddress = s.online >= 4 && s.addresses === 1;
  const offset = (min: number) => (min >= 0 ? "+" : "−") + Math.abs(min / 60);
  return (
    <div className="stack">
      <PageHead title={t("Server")} sub={t("What runs, how it is set up, how busy it is")}>
        <Updated at={at} onRefresh={onRefresh} />
      </PageHead>
      <div className="kpis">
        <Kpi label={t("Version")} value={s.version} sub={tf("protocol {p}", { p: s.protocol })} icon={Server} />
        <Kpi label={t("Up for")} value={fmtDuration(s.uptime_secs)} sub={tf("since {when}", { when: fmtDate(s.now - s.uptime_secs) })} icon={Clock} tone="success" />
        <Kpi label={t("Memory")} value={fmtBytes(s.memory_bytes)} icon={MemoryStick} tone="info" />
        <Kpi label={t("Connections")} value={fmtNum(s.online)} sub={tn(s.addresses, "{n} address", "{n} addresses") + " · " + perRules(s.online_by_rules)} icon={Plug} />
        <Kpi label={t("Games now")} value={fmtNum(s.games)} sub={tn(s.tables, "{n} open table", "{n} open tables")} icon={Activity} tone="warning" />
        <Kpi label={t("Writes waiting")} value={fmtNum(s.pending_writes)} sub={t("results, saves and payments on their way to the database")} icon={ListOrdered}
          tone={s.pending_writes > 50 ? "danger" : ""} />
      </div>
      <div className="grid-2">
        <Card>
          <CardHead title={t("Health")} />
          <div className="card-body health">
            <HealthRow ok={s.persistent} text={s.persistent ? t("Accounts and games are saved in PostgreSQL") : t("Everything is kept in memory: nothing is saved")} />
            <HealthRow ok={!s.draining} text={s.draining ? t("Restarting: no new games") : t("Taking new games")} />
            <HealthRow ok={!oneAddress} warnOnly
              text={oneAddress ? t("Every player comes from one address: set SNOOK_LEGEND_CLIENT_IP_HEADER") : t("Players' addresses are told apart")} />
            <HealthRow ok={s.stripe} warnOnly text={s.stripe ? t("Card payments (Stripe) are on") : t("Card payments (Stripe) are off")} />
            <HealthRow ok={s.msstore} warnOnly text={s.msstore ? t("Microsoft Store purchases are on") : t("Microsoft Store purchases are off")} />
            <HealthRow ok={s.pending_writes <= 50} warnOnly text={tn(s.pending_writes, "{n} write waiting", "{n} writes waiting")} />
            <HealthRow ok text={tf("Only version {p} of the game is let in", { p: s.oldest_protocol === s.protocol ? s.protocol : s.oldest_protocol + "–" + s.protocol })} />
          </div>
        </Card>
        <Card>
          <CardHead title={t("Server settings")} />
          <div className="card-body">
            <Kv rows={[
              [t("Shot clock"), tf("{s} s", { s: r.shot_clock_secs })],
              [t("Time to come back after a drop"), tf("{s} s", { s: r.reconnect_grace_secs })],
              [t("Lounge chat kept"), tn(r.chat_history, "{n} line", "{n} lines")],
              [t("Connections per address"), fmtNum(r.max_connections_per_ip)],
              [t("Tournament no-show"), tf("{s} s", { s: r.tournament_no_show_secs })],
              [t("Open tournaments at most"), fmtNum(r.max_open_tournaments)],
              [t("“Looking for a game” notes last"), fmtDuration(r.seek_lifetime_secs)],
              [t("Local network server"), r.lan ? t("Yes") : t("No")],
            ]} />
          </div>
        </Card>
      </div>
      <div className="grid-2">
        <Card>
          <CardHead title={t("Weekly cup")} />
          <div className="card-body">
            {r.cup ? (
              <Kv rows={[
                [t("Name"), r.cup.name],
                [t("When"), tf("{day} at {time} (UTC{offset})", {
                  day: weekday(r.cup.weekday),
                  time: String(r.cup.hour).padStart(2, "0") + ":" + String(r.cup.minute).padStart(2, "0"),
                  offset: offset(r.cup.utc_offset),
                })],
                [t("Lasts"), fmtMinutes(r.cup.minutes)],
                [t("Entry"), r.cup.entry_fee ? tf("{n} coins", { n: fmtNum(r.cup.entry_fee) }) : t("free")],
                [t("Rules"), <RulesBadge key="rules" rules={r.cup.rules} long />],
              ]} />
            ) : (
              <p className="faint">{t("No weekly cup is set up (SNOOK_LEGEND_CUP).")}</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHead title={t("Staff")} sub={tn(staff.total, "{n} member", "{n} members")} />
          {staff.users.length ? (
            <DataTable headers={[t("Name"), t("Role"), t("Last seen")]}>
              {staff.users.map((u) => (
                <tr key={u.id} className="click" {...clickable(() => router.push(playerHref(u.username)))}>
                  <td><PersonLink name={u.username} /></td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>{u.online ? <Badge kind="success dot">{t("Online")}</Badge> : <TimeAgo at={u.last_seen} />}</td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <Empty icon={Shield} title={t("No staff yet")} />
          )}
        </Card>
      </div>
    </div>
  );
}
