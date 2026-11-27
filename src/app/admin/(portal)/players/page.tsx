"use client";

import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/admin/components/providers/locale";
import {
  Avatar, Badge, Btn, Card, Country, DataTable, Empty, PageHead, RulesMark, Segmented, TimeAgo, UserBadges, clickable, playerHref,
  useRulesNames, type Header,
} from "@/admin/components/ui/bits";
import { Loaded } from "@/admin/components/ui/loaded";
import { msg } from "@/admin/i18n";
import { useApi, useDebouncedParam, useQueryParams } from "@/admin/lib/hooks";
import { RULES, recordOf } from "@/admin/lib/rules";
import type { RulesId, UserRow, UsersPage } from "@/admin/lib/types";
import "@/admin/styles/players.css";

const FILTERS: [string, string][] = [
  ["all", msg("All")], ["online", msg("Online")], ["staff", msg("Staff")], ["banned", msg("Banned")], ["muted", msg("Muted")], ["deleted", msg("Deleted")],
];
const SORTS: [string, string][] = [
  ["newest", msg("Newest accounts")], ["last_seen", msg("Seen most recently")], ["rating-brazilian", msg("Highest rating, Brazilian rules")],
  ["rating-official", msg("Highest rating, official rules")], ["name", msg("Name")],
];

export default function PlayersPage() {
  const { t, tn } = useLocale();
  const { get, set } = useQueryParams();
  const [search, setSearch] = useDebouncedParam("q", 350);
  const q = get("q");
  const filter = get("filter", "all");
  const sort = get("sort", "newest");
  const pageNo = Math.max(0, Number(get("page")) || 0);
  const users = useApi<UsersPage>("/users?" + new URLSearchParams({ q, filter, sort, page: String(pageNo) }), { placeholderData: (prev) => prev });
  return (
    <div>
      <PageHead title={t("Players")} sub={users.data ? tn(users.data.total, "{n} account", "{n} accounts") : " "} />
      <div className="toolbar">
        <input className="input wide" type="search" placeholder={t("Name, or a recovery e-mail")} aria-label={t("Search players")}
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <Segmented options={FILTERS.map(([v, l]) => [v, t(l)] as [string, string])} value={filter} onChange={(v) => set({ filter: v === "all" ? null : v, page: null })} name={t("Filter")} />
        <select className="select" aria-label={t("Order")} value={sort} onChange={(e) => set({ sort: e.target.value === "newest" ? null : e.target.value, page: null })}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
        </select>
      </div>
      <Loaded queries={[users]}>
        {(d) => <PlayerList d={d} q={q} pageNo={pageNo} stale={users.isPlaceholderData} onPage={(p) => set({ page: p || null })} />}
      </Loaded>
    </div>
  );
}

function PlayerList({ d, q, pageNo, stale, onPage }: { d: UsersPage; q: string; pageNo: number; stale: boolean; onPage: (p: number) => void }) {
  const { t, tf, fmtNum } = useLocale();
  const router = useRouter();
  const { rulesShort } = useRulesNames();
  const pages = Math.max(1, Math.ceil(d.total / d.per_page));
  const from = d.total ? pageNo * d.per_page + 1 : 0;
  const to = Math.min(d.total, (pageNo + 1) * d.per_page);
  const rulesHead = (r: RulesId): Header => ({ label: <span className="th-rules"><RulesMark rules={r} />{rulesShort(r)}</span>, text: rulesShort(r), cls: "num" });
  return (
    <Card className={stale ? "is-stale" : ""}>
      {d.users.length ? (
        <DataTable headers={[t("Player"), t("Country"), ...RULES.map(rulesHead), t("Joined"), t("Last seen")]}>
          {d.users.map((u) => (
            <tr key={u.id} className="click" {...clickable(() => router.push(playerHref(u.username)))}>
              <td>
                <span className="person">
                  <Avatar name={u.username} code={u.avatar} />
                  <span className="person-name"><b className="name">{u.username}</b><UserBadges u={u} online={false} /></span>
                </span>
              </td>
              <td><Country code={u.country} /></td>
              {RULES.map((r) => <RatingCell key={r} u={u} r={r} />)}
              <td className="nowrap"><TimeAgo at={u.created_at} /></td>
              <td className="nowrap">{u.online ? <Badge kind="success dot">{t("Online")}</Badge> : <TimeAgo at={u.last_seen} />}</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <Empty icon={Users} title={t("No players found")} text={q ? t("Try another name, or another filter.") : t("Nobody matches this filter.")} />
      )}
      {d.total > d.per_page ? (
        <nav className="pager" aria-label={tf("Page {n} of {total}", { n: pageNo + 1, total: pages })}>
          <span>{tf("{from}–{to} of {total}", { from: fmtNum(from), to: fmtNum(to), total: fmtNum(d.total) })}</span>
          <div className="row">
            <Btn label={t("Previous")} kind="sm" icon={ChevronLeft} disabled={pageNo === 0} onClick={() => onPage(pageNo - 1)} />
            <span className="muted">{tf("Page {n} of {total}", { n: pageNo + 1, total: pages })}</span>
            <button type="button" className="btn sm" disabled={pageNo + 1 >= pages} onClick={() => onPage(pageNo + 1)}>
              {t("Next")}
              <ChevronRight className="icon" aria-hidden />
            </button>
          </div>
        </nav>
      ) : null}
    </Card>
  );
}

/** A rating under one of the rules: the tier and the record under it
 * (faint when they never played those rules rated). */
function RatingCell({ u, r }: { u: UserRow; r: RulesId }) {
  const { t, tf, tn, fmtNum, fmtPct } = useLocale();
  const x = recordOf(u, r);
  const rate = x.games ? fmtPct((x.wins * 100) / x.games, 0) : "—";
  return (
    <td className={"num rating-cell" + (x.games ? "" : " unplayed")} title={tf("{wins} wins · {rate}", { wins: fmtNum(x.wins), rate })}>
      <b>{fmtNum(x.rating)}</b>
      <div className="faint">{x.games ? t(x.tier) + " · " + tn(x.games, "{n} game", "{n} games") : t("not played yet")}</div>
    </td>
  );
}
