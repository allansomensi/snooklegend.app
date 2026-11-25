"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Activity, Swords, Trophy, Undo2, Users, X } from "lucide-react";
import { DoublesTable, LiveDoublesTable } from "@/admin/components/modes/doubles";
import { Section } from "@/admin/components/ops/schedule";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { AlertBox, Btn, Card, Empty, ErrorPage, Kpi, PageHead, PageLoading, Updated, playerHref } from "@/admin/components/ui/bits";
import { ApiError, api } from "@/admin/lib/api";
import { useDebouncedParam, useQueryParams } from "@/admin/lib/hooks";
import { parseDoublesPage } from "@/admin/lib/modes";
import Link from "next/link";
import "@/admin/styles/business.css";
import "@/admin/styles/modes.css";
import "@/admin/styles/ops.css";

const PAGE = 50;

/** The doubles games: those being played on this server (or just over),
 * then the stored ones, newest first, a player's only if asked. */
export default function DoublesPage() {
  const { t, tf, tn, fmtNum } = useLocale();
  const { toast } = useToasts();
  const { get, set } = useQueryParams();
  const [search, setSearch] = useDebouncedParam("player", 400);
  const player = get("player");

  const q = useInfiniteQuery({
    queryKey: ["/doubles", player],
    initialPageParam: null as number | null,
    queryFn: async ({ pageParam, signal }) =>
      parseDoublesPage(await api("/doubles?" + new URLSearchParams({ limit: String(PAGE), ...(player ? { player } : {}), ...(pageParam ? { before: String(pageParam) } : {}) }), { signal })),
    getNextPageParam: (last) => last.next ?? undefined,
    placeholderData: (prev) => prev,
    refetchInterval: 20000,
  });
  const loadMore = async () => {
    const r = await q.fetchNextPage();
    if (r.isError) toast(r.error instanceof Error ? r.error.message : String(r.error), "error");
  };

  const toolbar = (
    <div className="toolbar">
      <input className="input wide" type="search" placeholder={t("A player's games: their username")} aria-label={t("Player")} value={search}
        onChange={(e) => setSearch(e.target.value)} />
      {player ? (
        <span className="badge accent">
          {tf("Player: {name}", { name: player })}
          <Btn label={t("Clear")} kind="sm ghost" icon={X} iconOnly onClick={() => { setSearch(""); set({ player: null }); }} />
        </span>
      ) : null}
      {player ? <Link className="btn sm" href={playerHref(player, "doubles")}>{t("Their page")}</Link> : null}
    </div>
  );

  let body;
  if (q.isError && !q.data) {
    body = q.error instanceof ApiError && q.error.status === 404 && player ? (
      <AlertBox tone="warning" title={tf("No player is called “{name}”", { name: player })} text={t("Check the name, or clear the filter.")} />
    ) : (
      <ErrorPage error={q.error} onRetry={() => void q.refetch()} />
    );
  } else if (!q.data) {
    body = <PageLoading />;
  } else {
    const first = q.data.pages[0];
    const games = q.data.pages.flatMap((p) => p.games);
    const playing = first.live.filter((g) => !g.finished);
    const annulled = games.filter((g) => g.voided_at).length;
    body = (
      <>
        <div className="kpis">
          <Kpi label={t("Being played")} value={fmtNum(playing.length)} sub={tn(first.live.length - playing.length, "{n} just over", "{n} just over")} icon={Activity} tone="success" />
          <Kpi label={t("Rated now")} value={fmtNum(playing.filter((g) => g.rated).length)} sub={t("of the games being played")} icon={Swords} tone="info" />
          <Kpi label={t("Finished, shown")} value={fmtNum(games.length)} sub={q.hasNextPage ? t("more to load") : t("all of them")} icon={Trophy} />
          <Kpi label={t("Annulled, shown")} value={fmtNum(annulled)} icon={Undo2} tone={annulled ? "danger" : ""} />
        </div>
        <Section title={t("Being played")} count={first.live.length} sub={t("On this server · refreshes every 20 seconds")}
          empty={<Card><Empty icon={Users} title={player ? tf("{name} isn't playing doubles now", { name: player }) : t("No doubles game now")} /></Card>}>
          {first.live.length ? [<Card key="live"><LiveDoublesTable games={first.live} /></Card>] : []}
        </Section>
        <Section title={t("Finished")} sub={t("Newest first")}
          empty={<Card><Empty icon={Trophy} title={t("No doubles game yet")} text={player ? t("They haven't finished a doubles game.") : t("Finished doubles games show up here.")} /></Card>}>
          {games.length ? [
            <Card key="games" className={q.isFetching && !q.isFetchingNextPage ? "loading-soft" : ""}>
              <DoublesTable games={games} player={player || undefined} />
              <div className="pager">
                <span>{tn(games.length, "{n} game shown", "{n} games shown")}</span>
                {q.hasNextPage ? <Btn label={t("Load more")} kind="sm primary" busy={q.isFetchingNextPage} onClick={() => void loadMore()} /> : null}
              </div>
            </Card>,
          ] : []}
        </Section>
      </>
    );
  }

  return (
    <div>
      <PageHead title={t("Doubles")} sub={t("Two against two: the games being played and those finished")}>
        {q.data ? <Updated at={q.dataUpdatedAt} live onRefresh={() => void q.refetch()} /> : null}
      </PageHead>
      {toolbar}
      {body}
    </div>
  );
}
