"use client";

import { Activity, Eye, ListOrdered, Star, Table, Trophy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Doing, TournamentCard } from "@/components/live/tournament-card";
import { useLocale } from "@/components/providers/locale";
import { useViewer } from "@/components/providers/viewer";
import {
  Avatar, Badge, Btn, Card, Country, DataTable, Empty, Kpi, PageHead, PersonLink, RoleBadge, RulesBadge, Tabs, Updated, clickable, playerHref, usePerRules,
} from "@/components/ui/bits";
import { Loaded, updatedAt } from "@/components/ui/loaded";
import { useApi, useDebouncedParam, useQueryParams } from "@/lib/hooks";
import { gamesByRules, recordOf } from "@/lib/rules";
import type { Live, System } from "@/lib/types";

export default function LivePage() {
  const { t, fmtNum } = useLocale();
  const perRules = usePerRules();
  const { get, set } = useQueryParams();
  const tab = get("tab", "games");
  const live = useApi<Live>("/live", { refetchInterval: 10000 });
  const system = useApi<System>("/system", { refetchInterval: 10000 });
  return (
    <Loaded queries={[live, system]}>
      {(d, s) => {
        const playing = d.rooms.filter((r) => !r.finished);
        return (
          <div>
            <PageHead title={t("Live")} sub={t("What happens on the server right now · refreshes every 10 seconds")}>
              <Updated at={updatedAt(live, system)} live onRefresh={() => { void live.refetch(); void system.refetch(); }} />
            </PageHead>
            <div className="kpis">
              <Kpi label={t("Online now")} value={fmtNum(s.online)} sub={perRules(s.online_by_rules)} icon={Users} tone="success" />
              <Kpi label={t("Games now")} value={fmtNum(s.games)} sub={perRules(gamesByRules(playing))} icon={Activity} tone="info" />
              <Kpi label={t("Open tables")} value={fmtNum(s.tables)} icon={Table} />
              <Kpi label={t("In the queue")} value={fmtNum(s.queue)} icon={ListOrdered} tone="warning" />
              <Kpi label={t("Tournaments")} value={fmtNum(s.tournaments)} icon={Trophy} />
            </div>
            <div className="section">
              <Tabs
                current={tab}
                onChange={(id) => set({ tab: id === "games" ? null : id })}
                items={[
                  { id: "games", label: t("Games"), icon: Activity, count: playing.length },
                  { id: "players", label: t("Players online"), icon: Users, count: d.players.length },
                  { id: "tournaments", label: t("Tournaments"), icon: Trophy, count: d.tournaments.length },
                ]}
              />
              {tab === "players" ? (
                <PlayersTab d={d} />
              ) : tab === "tournaments" ? (
                d.tournaments.length ? (
                  <div className="stack">{d.tournaments.map((tm) => <TournamentCard key={tm.id} tm={tm} />)}</div>
                ) : (
                  <Card><Empty icon={Trophy} title={t("No tournaments now")} /></Card>
                )
              ) : (
                <GamesTab d={d} />
              )}
            </div>
          </div>
        );
      }}
    </Loaded>
  );
}

function GamesTab({ d }: { d: Live }) {
  const { t, fmtNum } = useLocale();
  const viewer = useViewer();
  return (
    <Card>
      {d.rooms.length ? (
        <DataTable headers={["", t("Players"), t("Game"), { label: t("Strokes"), cls: "num" }, t("State"), ""]}>
          {d.rooms.map((r) => (
            <tr key={r.id} className={r.finished ? "dim" : ""}>
              <td className="mono faint">#{r.id}</td>
              <td>
                <span className="row">
                  <PersonLink name={r.players[0]} />
                  <span className="faint">×</span>
                  <PersonLink name={r.players[1]} />
                </span>
              </td>
              <td>
                <span className="badges">
                  <RulesBadge rules={r.rules} />
                  {r.rated ? <Badge kind="accent">{t("Rated")}</Badge> : <Badge>{t("Casual")}</Badge>}
                  {r.tournament ? <Badge kind="info" icon={Trophy}>{t("Tournament")}</Badge> : null}
                </span>
              </td>
              <td className="num">{fmtNum(r.shots)}</td>
              <td>{r.finished ? <Badge>{t("Finished")}</Badge> : <Badge kind="success dot">{t("Playing")}</Badge>}</td>
              <td className="actions-cell">
                <Btn label={t("Watch")} kind="sm" icon={Eye} onClick={() => viewer.open("/live/" + r.id + "/view")} />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <Empty icon={Activity} title={t("No games right now")} text={t("Games appear here as soon as they start.")} />
      )}
    </Card>
  );
}

function PlayersTab({ d }: { d: Live }) {
  const { t, fmtNum } = useLocale();
  const router = useRouter();
  // The filter lives in the address, so the refresh every 10 seconds keeps it.
  const [who, setWho] = useDebouncedParam("who", 150);
  const s = who.trim().toLowerCase();
  const rows = d.players.filter((p) => !s || p.username.toLowerCase().includes(s));
  return (
    <div>
      <div className="toolbar">
        <input className="input wide" type="search" placeholder={t("Filter by name")} aria-label={t("Filter")} value={who} onChange={(e) => setWho(e.target.value)} />
      </div>
      <Card>
        {!d.players.length ? (
          <Empty icon={Users} title={t("Nobody online")} />
        ) : !rows.length ? (
          <Empty icon={Users} title={t("No players found")} text={t("Try another name, or another filter.")} />
        ) : (
          <DataTable headers={[t("Player"), t("Doing"), t("Rules"), { label: t("Rating"), cls: "num" }, t("Country")]}>
            {rows.map((p) => (
              <tr key={p.username} className="click" {...clickable(() => router.push(playerHref(p.username)))}>
                <td>
                  <span className="person">
                    <Avatar name={p.username} />
                    <span className="person-name">
                      <b>{p.username}</b>
                      <span className="badges">
                        {p.role && p.role !== "player" ? <RoleBadge role={p.role} /> : null}
                        {p.vip ? <Badge kind="accent" icon={Star}>VIP</Badge> : null}
                        {p.guest ? <Badge>{t("Guest")}</Badge> : null}
                      </span>
                    </span>
                  </span>
                </td>
                <td><Doing p={p} /></td>
                <td><RulesBadge rules={p.rules} /></td>
                <td className="num">{p.guest ? <span className="faint">—</span> : fmtNum(recordOf(p, p.rules).rating)}</td>
                <td><Country code={p.country} /></td>
              </tr>
            ))}
          </DataTable>
        )}
      </Card>
    </div>
  );
}
