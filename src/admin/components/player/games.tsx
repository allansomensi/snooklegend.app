"use client";

import { Download, ListOrdered, Play, Trophy, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { downloadReplay } from "@/admin/lib/download";
import { useGameEnd } from "@/admin/lib/games";
import { RULES } from "@/admin/lib/rules";
import { useIsAdmin } from "@/admin/lib/hooks";
import type { GameRow, RulesId, UserDetail } from "@/admin/lib/types";
import { usePlayerActions } from "../player-dialogs";
import { useLocale } from "../providers/locale";
import { useToasts } from "../providers/toasts";
import { useViewer } from "../providers/viewer";
import { Badge, Btn, Card, CardHead, DataTable, Empty, PersonLink, RulesBadge, Segmented, useRulesNames } from "../ui/bits";

function GameLine({ h, name }: { h: GameRow; name: string }) {
  const { t, fmtNum, fmtDate } = useLocale();
  const admin = useIsAdmin();
  const actions = usePlayerActions();
  const gameEnd = useGameEnd();
  const viewer = useViewer();
  const { attempt } = useToasts();
  return (
    <tr>
      <td className="nowrap">{fmtDate(h.at)}</td>
      <td><RulesBadge rules={h.rules} /></td>
      <td><PersonLink name={h.opponent} /></td>
      <td>{h.won ? <Badge kind="success">{t("Won")}</Badge> : <Badge kind="danger">{t("Lost")}</Badge>}</td>
      <td>{gameEnd(h.reason)}</td>
      <td className="num">
        {h.rated ? (
          <b className={"delta" + (h.delta > 0 ? " up" : h.delta < 0 ? " down" : "")}>{(h.delta > 0 ? "+" : "") + fmtNum(h.delta)}</b>
        ) : (
          <Badge>{t("Casual")}</Badge>
        )}
      </td>
      <td className="num">{h.rated ? fmtNum(h.rating_after) : "—"}</td>
      <td className="actions-cell">
        <span className="row">
          {h.replay ? (
            <>
              <Btn label={t("Watch")} kind="sm" icon={Play} onClick={() => viewer.open("/replay/" + h.match_id + "/view")} />
              <Btn label={t("Download")} kind="sm ghost" icon={Download} iconOnly onClick={() => void attempt(() => downloadReplay(h.match_id))} />
            </>
          ) : (
            <span className="faint">{t("no replay")}</span>
          )}
          <Link className="btn sm ghost icon-only" href={"/admin/matches/" + h.match_id} title={t("Shot by shot")} aria-label={t("Shot by shot")}>
            <ListOrdered className="icon" aria-hidden />
          </Link>
          {admin && h.rated ? (
            <Btn label={t("Annul the game")} kind="sm ghost" icon={Undo2} iconOnly onClick={() => actions.voidMatch({ id: h.match_id, names: [name, h.opponent] })} />
          ) : null}
        </span>
      </td>
    </tr>
  );
}

export function PlayerGames({ d }: { d: UserDetail }) {
  const { t, tn } = useLocale();
  const { rulesShort } = useRulesNames();
  const [only, setOnly] = useState<"all" | RulesId>("all");
  if (!d.history.length) {
    return (
      <Card>
        <Empty icon={Trophy} title={t("No games yet")} text={t("Their online games show up here.")} />
      </Card>
    );
  }
  const count = (r: RulesId) => d.history.filter((h) => h.rules === r).length;
  const list = d.history.filter((h) => only === "all" || h.rules === only);
  return (
    <Card>
      <CardHead title={t("Latest games")} sub={tn(d.history.length, "{n} game", "{n} games")}>
        <Segmented<"all" | RulesId>
          options={[["all", t("All"), d.history.length], ...RULES.map((r) => [r, rulesShort(r), count(r)] as ["all" | RulesId, string, number])]}
          value={only}
          onChange={setOnly}
          name={t("Rules")}
        />
      </CardHead>
      {list.length ? (
        <DataTable headers={[t("When"), t("Rules"), t("Opponent"), t("Result"), t("How it ended"), { label: t("Rating"), cls: "num" }, { label: t("After"), cls: "num" }, ""]}>
          {list.map((h) => <GameLine key={h.match_id} h={h} name={d.user.username} />)}
        </DataTable>
      ) : (
        <Empty icon={Trophy} title={t("No games under these rules")} />
      )}
    </Card>
  );
}
