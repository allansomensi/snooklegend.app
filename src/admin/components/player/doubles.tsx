"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import Link from "next/link";
import { api } from "@/admin/lib/api";
import { parseDoublesPage, parseDoublesRatings } from "@/admin/lib/modes";
import { RULES } from "@/admin/lib/rules";
import type { UserDetail } from "@/admin/lib/types";
import { DoublesTable, LiveDoublesTable } from "../modes/doubles";
import { useLocale } from "../providers/locale";
import { useToasts } from "../providers/toasts";
import { Btn, Card, CardHead, DataTable, Empty, ErrorPage, PageLoading, RulesBadge } from "../ui/bits";

/** A player's doubles: their record under each of the rules, the games
 * they play now, and those they finished. */
export function PlayerDoubles({ d }: { d: UserDetail }) {
  const { t, tn, fmtNum, fmtPct } = useLocale();
  const { toast } = useToasts();
  const name = d.user.username;
  const ratings = parseDoublesRatings(d.doubles_ratings);
  const q = useInfiniteQuery({
    queryKey: ["/doubles", name],
    initialPageParam: null as number | null,
    queryFn: async ({ pageParam, signal }) =>
      parseDoublesPage(await api("/doubles?" + new URLSearchParams({ player: name, limit: "50", ...(pageParam ? { before: String(pageParam) } : {}) }), { signal })),
    getNextPageParam: (last) => last.next ?? undefined,
  });
  const loadMore = async () => {
    const r = await q.fetchNextPage();
    if (r.isError) toast(r.error instanceof Error ? r.error.message : String(r.error), "error");
  };
  const games = q.data?.pages.flatMap((p) => p.games) ?? [];
  const live = q.data?.pages[0].live ?? [];
  return (
    <div className="stack modes-page">
      <Card>
        <CardHead title={t("Doubles ratings")} sub={t("Their own, apart from the singles ratings")}>
          <Link className="btn sm ghost" href={"/admin/doubles?player=" + encodeURIComponent(name)}>{t("In the doubles list")}</Link>
        </CardHead>
        <DataTable headers={[t("Rules"), { label: t("Rating"), cls: "num" }, { label: t("Peak"), cls: "num" }, { label: t("Rated games"), cls: "num" },
          { label: t("Wins"), cls: "num" }, { label: t("Won"), cls: "num" }]}>
          {RULES.map((r) => {
            const x = ratings[r];
            return (
              <tr key={r}>
                <td><RulesBadge rules={r} long /></td>
                <td className="num"><b>{fmtNum(x.rating)}</b></td>
                <td className="num">{fmtNum(x.peak_rating)}</td>
                <td className="num">{fmtNum(x.games)}</td>
                <td className="num">{fmtNum(x.wins)}</td>
                <td className="num">{x.games ? fmtPct((x.wins * 100) / x.games, 1) : "—"}</td>
              </tr>
            );
          })}
        </DataTable>
      </Card>
      {live.length ? (
        <Card>
          <CardHead title={t("Playing now")} />
          <LiveDoublesTable games={live} />
        </Card>
      ) : null}
      {q.isError && !q.data ? (
        <ErrorPage error={q.error} onRetry={() => void q.refetch()} />
      ) : !q.data ? (
        <PageLoading />
      ) : (
        <Card>
          <CardHead title={t("Doubles games")} sub={tn(games.length, "{n} game shown", "{n} games shown")} />
          {games.length ? (
            <>
              <DoublesTable games={games} player={name} />
              {q.hasNextPage ? (
                <div className="pager">
                  <span />
                  <Btn label={t("Load more")} kind="sm primary" busy={q.isFetchingNextPage} onClick={() => void loadMore()} />
                </div>
              ) : null}
            </>
          ) : (
            <Empty icon={Users} title={t("No doubles game yet")} text={t("They haven't finished a doubles game.")} />
          )}
        </Card>
      )}
    </div>
  );
}
