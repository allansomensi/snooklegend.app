"use client";

import { Eye, ListOrdered, Undo2 } from "lucide-react";
import Link from "next/link";
import { useGameEnd } from "@/admin/lib/games";
import { useIsAdmin } from "@/admin/lib/hooks";
import { sideOf } from "@/admin/lib/modes";
import type { DoublesGame, LiveDoubles, Pair } from "@/admin/lib/types";
import { useLocale } from "../providers/locale";
import { useViewer } from "../providers/viewer";
import { Badge, Btn, DataTable, PersonLink, RulesBadge } from "../ui/bits";
import { useModeActions } from "./actions";
import "@/admin/styles/modes.css";

export const doublesHref = (id: number) => "/admin/doubles/" + id;

/** A team: its two players, each a link to their page. */
export function Team({ team, won, avatars = false }: { team: Pair<string>; won?: boolean; avatars?: boolean }) {
  return (
    <span className={"team" + (won ? " won" : "")}>
      <PersonLink name={team[0]} avatar={avatars} />
      <span className="amp" aria-hidden>&amp;</span>
      <PersonLink name={team[1]} avatar={avatars} />
    </span>
  );
}

/** A rating change: "+14", "−12". */
export function Delta({ n, struck }: { n: number; struck?: boolean }) {
  const { fmtNum } = useLocale();
  return <b className={"delta" + (n > 0 ? " up" : n < 0 ? " down" : "") + (struck ? " faint" : "")}>{(n > 0 ? "+" : "") + fmtNum(n)}</b>;
}

/** Rated, casual or annulled. */
export function DoublesStatus({ g }: { g: Pick<DoublesGame, "rated" | "voided_at"> }) {
  const { t } = useLocale();
  if (g.voided_at) return <Badge kind="danger" icon={Undo2}>{t("Annulled")}</Badge>;
  return g.rated ? <Badge kind="accent">{t("Rated")}</Badge> : <Badge>{t("Casual")}</Badge>;
}

/** Stored doubles games; with `player`, seen from them (their partner,
 * the other team, won or lost, their change). */
export function DoublesTable({ games, player }: { games: DoublesGame[]; player?: string }) {
  const { t, tf, fmtNum, fmtDate } = useLocale();
  const admin = useIsAdmin();
  const actions = useModeActions();
  const gameEnd = useGameEnd();
  const actionsCell = (g: DoublesGame) => (
    <td className="actions-cell">
      <span className="row">
        <Link className="btn sm ghost icon-only" href={doublesHref(g.id)} title={t("Open the game")} aria-label={tf("Open doubles game #{id}", { id: g.id })}>
          <ListOrdered className="icon" aria-hidden />
        </Link>
        {admin && g.rated && !g.voided_at ? (
          <Btn label={t("Annul the game")} kind="sm ghost" icon={Undo2} iconOnly onClick={() => actions.voidDoubles(g)} />
        ) : null}
      </span>
    </td>
  );
  if (player) {
    return (
      <DataTable className="doubles" lead={4} headers={[t("When"), t("Rules"), t("Partner"), t("Opponents"), t("Result"), t("How it ended"), { label: t("Rating"), cls: "num" }, ""]}>
        {games.map((g) => {
          const s = sideOf(g, player);
          return (
            <tr key={g.id}>
              <td className="nowrap"><Link href={doublesHref(g.id)}>{fmtDate(g.ended_at)}</Link></td>
              <td><RulesBadge rules={g.rules} /></td>
              <td>{s ? <PersonLink name={s.partner} /> : "—"}</td>
              <td>{s ? <Team team={s.opponents} /> : "—"}</td>
              <td>{s ? (s.won ? <Badge kind="success">{t("Won")}</Badge> : <Badge kind="danger">{t("Lost")}</Badge>) : "—"}</td>
              <td>{gameEnd(g.reason)}</td>
              <td className="num">
                {g.rated && s ? (
                  <span className="badges">
                    <Delta n={s.delta} struck={!!g.voided_at} />
                    {g.voided_at ? <Badge kind="danger" icon={Undo2}>{t("Annulled")}</Badge> : null}
                  </span>
                ) : (
                  <DoublesStatus g={g} />
                )}
              </td>
              {actionsCell(g)}
            </tr>
          );
        })}
      </DataTable>
    );
  }
  return (
    <DataTable className="doubles" lead={4} headers={["#", t("When"), t("Rules"), t("Teams"), t("How it ended"), { label: t("Strokes"), cls: "num" }, t("Status"), ""]}>
      {games.map((g) => (
        <tr key={g.id}>
          <td className="mono"><Link href={doublesHref(g.id)}>{g.id}</Link></td>
          <td className="nowrap">{fmtDate(g.ended_at)}</td>
          <td><RulesBadge rules={g.rules} /></td>
          <td>
            <div className="teams-cell">
              {[0, 1].map((k) => (
                <span key={k} className="row">
                  <Team team={g.teams[k]} won={g.winner === k} />
                  {g.rated ? <span className="faint">{g.deltas[k].map((d) => (d > 0 ? "+" : "") + fmtNum(d)).join(" / ")}</span> : null}
                </span>
              ))}
            </div>
          </td>
          <td>{gameEnd(g.reason)}</td>
          <td className="num">{fmtNum(g.shots)}</td>
          <td>
            <span className="badges">
              <DoublesStatus g={g} />
              {!g.replay ? <Badge>{t("no replay")}</Badge> : null}
            </span>
          </td>
          {actionsCell(g)}
        </tr>
      ))}
    </DataTable>
  );
}

/** The doubles games being played (or just over) in this server. */
export function LiveDoublesTable({ games }: { games: LiveDoubles[] }) {
  const { t, fmtNum } = useLocale();
  const viewer = useViewer();
  return (
    <DataTable lead={3} headers={[t("Room"), t("Rules"), t("Teams"), { label: t("Strokes so far"), cls: "num" }, t("Status"), ""]}>
      {games.map((g) => (
        <tr key={g.id}>
          <td className="mono">{g.id}</td>
          <td><RulesBadge rules={g.rules} /></td>
          <td>
            <div className="teams-cell">
              <Team team={g.teams[0]} />
              <Team team={g.teams[1]} />
            </div>
          </td>
          <td className="num">{fmtNum(g.shots)}</td>
          <td>
            <span className="badges">
              {g.finished ? <Badge>{t("Just over")}</Badge> : <Badge kind="success dot">{t("Playing")}</Badge>}
              {g.rated ? <Badge kind="accent">{t("Rated")}</Badge> : <Badge>{t("Casual")}</Badge>}
            </span>
          </td>
          <td className="actions-cell">
            <Btn label={g.finished ? t("Replay") : t("Watch")} kind="sm" icon={Eye} onClick={() => viewer.open("/live/" + g.id + "/view")} />
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
