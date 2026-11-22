"use client";

import { CircleCheck, Target, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/locale";
import { AlertBox, Badge, Card, DataTable, Empty, Kpi, PageHead, PersonLink, Updated, clickable, playerHref } from "@/components/ui/bits";
import { Loaded, updatedAt } from "@/components/ui/loaded";
import { useApi } from "@/lib/hooks";
import type { FairPlay } from "@/lib/types";

export default function FairPlayPage() {
  const { t, tf, tn, fmtNum, fmtPct } = useLocale();
  const router = useRouter();
  const q = useApi<FairPlay>("/aim");
  return (
    <Loaded queries={[q]}>
      {(d) => (
        <div>
          <PageHead title={t("Fair play")} sub={t("Players who make far more hard shots than their tier")}>
            <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
          </PageHead>
          <AlertBox
            tone="info"
            title={t("How it works")}
            text={tf(
              "Hard shots are cuts of 45° or more over 1.5 m, under either of the rules. Only players with {n} or more of them are compared, each with the players of their tier (by the higher of their two ratings). Nobody is punished by this list: open the player, watch their games, and decide.",
              { n: d.min_attempts },
            )}
          />
          <div className="kpis section">
            <Kpi label={t("Players compared")} value={fmtNum(d.players)} icon={Users} />
            <Kpi label={t("Standing out")} value={fmtNum(d.flagged.length)} icon={Target} tone={d.flagged.length ? "danger" : "success"} />
          </div>
          <div className="section">
            <Card>
              {d.flagged.length ? (
                <DataTable
                  headers={[t("Player"), { label: t("Higher rating"), cls: "num" }, { label: t("Hard shots made"), cls: "num" }, { label: t("Rate"), cls: "num" },
                    { label: t("Tier average"), cls: "num" }, { label: t("Above the tier"), cls: "num" }]}
                >
                  {d.flagged.map((r) => (
                    <tr key={r.username} className="click" {...clickable(() => router.push(playerHref(r.username)))}>
                      <td><PersonLink name={r.username} /></td>
                      <td className="num">{fmtNum(r.rating)}<div className="faint">{t(r.tier)}</div></td>
                      <td className="num">{tf("{made} of {attempts}", { made: fmtNum(r.made), attempts: fmtNum(r.attempts) })}</td>
                      <td className="num"><b>{fmtPct(r.rate * 100, 0)}</b></td>
                      <td className="num">{fmtPct(r.tier_mean * 100, 0)}<div className="faint">{tn(r.tier_players, "{n} player", "{n} players")}</div></td>
                      <td className="num"><Badge kind={r.z >= 5 ? "danger" : "warning"}>{"+" + r.z.toFixed(1) + "σ"}</Badge></td>
                    </tr>
                  ))}
                </DataTable>
              ) : (
                <Empty icon={CircleCheck} title={t("Nobody stands out")} text={t("No player's hard shots are out of line with their tier.")} />
              )}
            </Card>
          </div>
        </div>
      )}
    </Loaded>
  );
}
