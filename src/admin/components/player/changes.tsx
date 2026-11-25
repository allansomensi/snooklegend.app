"use client";

import { Globe, Pencil, Scale } from "lucide-react";
import Link from "next/link";
import { useIsAdmin, useMe } from "@/admin/lib/hooks";
import type { UserDetail } from "@/admin/lib/types";
import { usePlayerActions } from "../player-dialogs";
import { useLocale } from "../providers/locale";
import { Badge, Btn, Card, CardHead, Country, DataTable, Empty, PersonLink, RulesBadge } from "../ui/bits";

/** Their names and countries over time, and the ratings put right by the
 * staff (or given back with a game annulled). */
export function PlayerChanges({ d }: { d: UserDetail }) {
  const { t, tn, fmtNum, fmtDate } = useLocale();
  const admin = useIsAdmin();
  const me = useMe();
  const actions = usePlayerActions();
  const u = d.user;
  const renames = d.renames || [];
  const adjustments = d.rating_adjustments || [];
  const isSelf = me.username.toLowerCase() === u.username.toLowerCase();
  return (
    <div className="stack">
      <Card>
        <CardHead title={t("Names and countries")} sub={t("Kept from 0.12 on; the player sees them on their profile")} />
        {renames.length ? (
          <DataTable headers={[t("When"), t("What changed"), t("Before"), t("After"), t("By")]}>
            {renames.map((c, k) => (
              <tr key={k}>
                <td className="nowrap">{fmtDate(c.at)}</td>
                <td>{c.kind === "country" ? <Badge kind="info" icon={Globe}>{t("Country")}</Badge> : <Badge kind="accent" icon={Pencil}>{t("Name")}</Badge>}</td>
                <td>{c.kind === "country" ? <Country code={c.old} /> : <span className="mono">{c.old || "—"}</span>}</td>
                <td>{c.kind === "country" ? <Country code={c.new} /> : <b className="mono">{c.new}</b>}</td>
                <td>{c.by ? <PersonLink name={c.by} /> : <span className="faint">{t("the player")}</span>}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty icon={Pencil} title={t("No change of name or country")} text={t("Changes made by the player or the staff show up here.")} />
        )}
      </Card>
      <Card>
        <CardHead title={t("Rating adjustments")} sub={tn(adjustments.length, "{n} adjustment", "{n} adjustments")}>
          {admin && !isSelf && !u.deleted_at ? <Btn label={t("Adjust the rating")} kind="sm" icon={Scale} onClick={() => actions.rating(u, d.history)} /> : null}
        </CardHead>
        {adjustments.length ? (
          <DataTable headers={[t("When"), t("Rules"), { label: t("Change"), cls: "num" }, { label: t("After"), cls: "num" }, t("Reason"), t("Game"), t("Staff")]}>
            {adjustments.map((a) => (
              <tr key={a.id}>
                <td className="nowrap">{fmtDate(a.at)}</td>
                <td><RulesBadge rules={a.rules} /></td>
                <td className="num"><b className={"delta" + (a.delta > 0 ? " up" : a.delta < 0 ? " down" : "")}>{(a.delta > 0 ? "+" : "") + fmtNum(a.delta)}</b></td>
                <td className="num">{fmtNum(a.rating_after)}</td>
                <td className="wrap">{a.reason}</td>
                <td>{a.match_id ? <Link className="mono" href={"/admin/matches/" + a.match_id}>#{a.match_id}</Link> : <span className="faint">—</span>}</td>
                <td>{a.staff ? <PersonLink name={a.staff} /> : <span className="faint">—</span>}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty icon={Scale} title={t("No rating adjusted")} text={t("Ratings put right by the staff, and games annulled, show up here.")} />
        )}
      </Card>
    </div>
  );
}
