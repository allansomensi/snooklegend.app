"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Crown, Download, Eye, Film, Undo2 } from "lucide-react";
import Link from "next/link";
import { use, type ReactNode } from "react";
import { useModeActions } from "@/admin/components/modes/actions";
import { Delta, DoublesStatus } from "@/admin/components/modes/doubles";
import { useLocale } from "@/admin/components/providers/locale";
import { useViewer } from "@/admin/components/providers/viewer";
import { AlertBox, Badge, Btn, Card, CardHead, Flag, PageHead, PersonLink, RulesBadge, playerHref } from "@/admin/components/ui/bits";
import { Loaded } from "@/admin/components/ui/loaded";
import { api, seg } from "@/admin/lib/api";
import { saveFile } from "@/admin/lib/download";
import { useGameEnd } from "@/admin/lib/games";
import { useIsAdmin } from "@/admin/lib/hooks";
import { parseDoublesDetail, parseDoublesPage, teamName } from "@/admin/lib/modes";
import type { DoublesDetail } from "@/admin/lib/types";
import "@/admin/styles/modes.css";
import "@/admin/styles/ops.css";

const TEAM_CLS = ["c-accent", "c-info"];

/** A stored doubles game: the two teams, who won, each player's rating
 * change, its replay; annulling it (administrators). */
export default function DoublesGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, tf } = useLocale();
  const q = useQuery({
    queryKey: ["/doubles/" + id],
    queryFn: async ({ signal }) => {
      const g = parseDoublesDetail(await api("/doubles/" + seg(id), { signal }));
      if (!g) throw new Error(t("No such doubles game."));
      return g;
    },
  });
  return (
    <div>
      <nav className="crumbs" aria-label={t("Doubles")}>
        <Link href="/admin/doubles">{t("Doubles")}</Link>
        <ChevronRight className="icon" aria-hidden />
        <span aria-current="page">{tf("Doubles game #{id}", { id })}</span>
      </nav>
      <Loaded queries={[q]}>{(g) => <Game g={g} />}</Loaded>
    </div>
  );
}

function Game({ g }: { g: DoublesDetail }) {
  const { t, tf, tn, fmtDate, fmtNum } = useLocale();
  const admin = useIsAdmin();
  const actions = useModeActions();
  const viewer = useViewer();
  const gameEnd = useGameEnd();
  // Its room, while it is still on this server, can be watched.
  const live = useQuery({
    queryKey: ["doubles-live"],
    queryFn: async ({ signal }) => parseDoublesPage(await api("/doubles?limit=1", { signal })).live,
    refetchInterval: 30000,
  });
  const room = g.room !== null ? live.data?.find((x) => x.id === g.room) : undefined;
  const download = () =>
    saveFile("snook-legend-doubles-" + g.id + ".json", new Blob([JSON.stringify({
      id: g.id, teams: g.teams, countries: g.countries, winner: g.winner, rated: g.rated, rules: g.rules, deltas: g.deltas, ended_at: g.ended_at, ...g.replay_data,
    }, null, 2)], { type: "application/json" }));

  const facts: [string, ReactNode][] = [
    [t("Game"), <span key="id" className="mono">#{g.id}</span>],
    [t("Room"), g.room !== null ? <span key="room" className="mono">{g.room}</span> : "—"],
    [t("Rules"), <RulesBadge key="rules" rules={g.rules} long />],
    [t("Status"), <DoublesStatus key="status" g={g} />],
    [t("Ended"), fmtDate(g.ended_at)],
    [t("How it ended"), gameEnd(g.reason)],
    [t("Strokes"), fmtNum(g.shots)],
    [t("Replay"), g.replay ? (g.strokes !== null ? tn(g.strokes, "kept · {n} stroke", "kept · {n} strokes") : t("kept")) : t("not kept")],
  ];
  if (g.voided_at) facts.push([t("Annulled"), fmtDate(g.voided_at)]);

  return (
    <div className="stack">
      <PageHead
        title={<span className="row">{tf("Doubles game #{id}", { id: g.id })}<RulesBadge rules={g.rules} long /><DoublesStatus g={g} /></span>}
        sub={tf("Ended {when} · {how} · {n}", { when: fmtDate(g.ended_at), how: gameEnd(g.reason), n: tn(g.shots, "{n} stroke", "{n} strokes") })}
      >
        {room ? <Btn label={room.finished ? t("Replay") : t("Watch")} kind="primary" icon={Eye} onClick={() => viewer.open("/live/" + room.id + "/view")} /> : null}
        {g.replay_data ? <Btn label={t("Download")} icon={Download} onClick={download} /> : null}
        {admin && g.rated && !g.voided_at ? <Btn label={t("Annul the game")} kind="danger-soft" icon={Undo2} onClick={() => actions.voidDoubles(g)} /> : null}
      </PageHead>
      {g.voided_at ? (
        <AlertBox tone="warning" title={tf("Annulled {when}", { when: fmtDate(g.voided_at) })}
          text={t("The four players got their doubles rating change back; it no longer counts as a rated game.")} />
      ) : null}
      {!g.rated ? <AlertBox tone="info" title={t("A casual game")} text={t("No rating changed: there is nothing to annul.")} /> : null}

      <div className="grid-2">
        {([0, 1] as const).map((k) => <TeamCard key={k} g={g} k={k} />)}
      </div>

      <div className="grid-2">
        <Card>
          <CardHead title={t("The game")} />
          <div className="card-body">
            <dl className="kv">
              {facts.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Card>
        <Card>
          <CardHead title={<span className="row"><Film className="icon" aria-hidden />{t("Replay")}</span>} />
          <div className="card-body stack">
            {room ? (
              <p>{room.finished ? t("Its room is still on this server: the replay viewer shows it.") : t("It is being played on this server: watch it live.")}</p>
            ) : g.replay_data ? (
              <p className="muted">{t("The portal's viewer shows a doubles game while its room is on this server. This one is kept for the game: download it to keep a copy of its strokes.")}</p>
            ) : (
              <p className="muted">{t("Only the result was kept.")}</p>
            )}
            <div className="row">
              {room ? <Btn label={room.finished ? t("Replay") : t("Watch")} kind="sm primary" icon={Eye} onClick={() => viewer.open("/live/" + room.id + "/view")} /> : null}
              {g.replay_data ? <Btn label={t("Download")} kind="sm" icon={Download} onClick={download} /> : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TeamCard({ g, k }: { g: DoublesDetail; k: 0 | 1 }) {
  const { t, tf } = useLocale();
  const won = g.winner === k;
  return (
    <Card className={"seat-card team-card " + TEAM_CLS[k] + (g.voided_at ? " voided" : "")}>
      <CardHead title={<span className="row">{k === 0 ? t("Team 1") : t("Team 2")}{won ? <Badge kind="success" icon={Crown}>{t("Winner")}</Badge> : null}</span>}
        sub={teamName(g.teams[k])} />
      <div className="card-body team-players">
        {([0, 1] as const).map((p) => {
          const name = g.teams[k][p];
          return (
            <div key={p} className="team-player">
              <span className="tp-name">
                <PersonLink name={name} />
                <Flag code={g.countries[k][p]} />
                <span className="tp-place">{p === 0 ? t("first player") : t("partner")}</span>
              </span>
              <span className="tp-side">
                {g.rated ? <Delta n={g.deltas[k][p]} /> : <span className="faint">—</span>}
                <Link className="btn sm ghost" href={playerHref(name, "doubles")} aria-label={tf("{name}'s doubles games", { name })}>{t("Their games")}</Link>
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
