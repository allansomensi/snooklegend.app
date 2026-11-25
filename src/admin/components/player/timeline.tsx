"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Coins, CreditCard, Flag, Globe, History, Link2, ListTree, Pencil, Trophy, UserPlus, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { msg } from "@/admin/i18n";
import { api, seg } from "@/admin/lib/api";
import { useGameEnd } from "@/admin/lib/games";
import { flatNotification } from "@/admin/lib/inbox";
import { useIsAdmin, useQueryParams } from "@/admin/lib/hooks";
import type { TimelineItem, TimelinePage, TimelineType, UserDetail } from "@/admin/lib/types";
import { auditLook, useAuditWords } from "../audit";
import { useLocale } from "../providers/locale";
import { useToasts } from "../providers/toasts";
import { Badge, Btn, Card, CardHead, Country, Empty, ErrorPage, PageLoading, PersonLink, RulesBadge, Segmented, TimeAgo } from "../ui/bits";
import { ReadState, notificationLook } from "./inbox";

/** The kinds of the timeline, for its filter (several types each). */
const FILTERS: [string, string, TimelineType[]][] = [
  ["all", msg("All"), []],
  ["matches", msg("Games"), ["match"]],
  ["staff", msg("Staff actions"), ["staff_action"]],
  ["inbox", msg("Notifications"), ["notification"]],
  ["money", msg("Purchases"), ["purchase", "payment"]],
  ["reports", msg("Reports"), ["report_sent", "report_received"]],
  ["profile", msg("Name, country, accounts"), ["profile_change", "linked_account", "account"]],
];

const PAGE = 60;

function Entry({ icon: Icon, tone = "", title, text, meta, at }: { icon: LucideIcon; tone?: string; title: ReactNode; text?: ReactNode; meta?: ReactNode; at: number }) {
  return (
    <li className="tl-item">
      <div className={"tl-dot " + tone}><Icon className="icon" aria-hidden /></div>
      <div className="tl-body">
        <span className="tl-title">{title}</span>
        {text ? <span className="tl-text">{text}</span> : null}
        <span className="tl-meta">{meta ? <>{meta} · </> : null}<TimeAgo at={at} /></span>
      </div>
    </li>
  );
}

/** One thing that happened, in words. */
function TimelineEntry({ it }: { it: TimelineItem }) {
  const { t, tf, fmtNum, money, countryName } = useLocale();
  const { auditLabel } = useAuditWords();
  const gameEnd = useGameEnd();
  const status = (s: number) => (s === 0 ? <Badge kind="warning">{t("Open")}</Badge> : s === 1 ? <Badge kind="success">{t("Action taken")}</Badge> : <Badge>{t("Dismissed")}</Badge>);
  switch (it.type) {
    case "notification": {
      const [Icon, tone] = notificationLook(it);
      return <Entry icon={Icon} tone={tone} at={it.at} title={<span className="row">{tf("Notification: {title}", { title: it.title || it.kind })}<ReadState n={it} /></span>}
        text={it.body || it.text} meta={it.from ? tf("by {name}", { name: it.from }) : t("by the game")} />;
    }
    case "staff_action": {
      const [tone, Icon] = auditLook(it.action);
      return <Entry icon={Icon} tone={tone} at={it.at} title={auditLabel(it.action)} text={it.details} meta={tf("by {name}", { name: it.staff })} />;
    }
    case "match":
      return (
        <Entry icon={Trophy} tone={it.won ? "success" : ""} at={it.at}
          title={<span className="row">{it.won ? tf("Won against {name}", { name: it.opponent }) : tf("Lost to {name}", { name: it.opponent })}<RulesBadge rules={it.rules} />
            {it.rated ? <b className={"delta" + (it.delta > 0 ? " up" : it.delta < 0 ? " down" : "")}>{(it.delta > 0 ? "+" : "") + fmtNum(it.delta)}</b> : <Badge>{t("Casual")}</Badge>}
            {it.correspondence ? <Badge kind="info">{t("By correspondence")}</Badge> : null}</span>}
          text={gameEnd(it.reason)}
          meta={<Link href={"/admin/matches/" + it.match_id}>{tf("Game #{id}, shot by shot", { id: it.match_id })}</Link>} />
      );
    case "purchase":
      return <Entry icon={Coins} tone={it.coins < 0 ? "warning" : "success"} at={it.at} title={(it.coins > 0 ? "+" : "") + tf("{n} coins", { n: fmtNum(it.coins) })} text={it.reason} />;
    case "payment":
      return (
        <Entry icon={CreditCard} tone="success" at={it.at}
          title={<span className="row">{money(it.amount, it.currency)} · {it.kind === "vip" ? "VIP" : tf("{n} coins", { n: fmtNum(it.coins) })}
            {it.refunded ? <Badge kind="danger">{t("Refunded")}</Badge> : null}{it.test ? <Badge kind="warning">{t("Test")}</Badge> : null}</span>} />
      );
    case "report_sent":
      return <Entry icon={Flag} tone="info" at={it.at} title={<span className="row">{tf("Reported {name}", { name: it.target })}{status(it.status)}</span>} text={it.reason} meta={"#" + it.id} />;
    case "report_received":
      return <Entry icon={Flag} tone="danger" at={it.at} title={<span className="row">{tf("Reported by {name}", { name: it.reporter })}{status(it.status)}</span>} text={it.reason} meta={"#" + it.id} />;
    case "profile_change":
      return (
        <Entry icon={it.kind === "country" ? Globe : Pencil} tone="info" at={it.at}
          title={it.kind === "country" ? tf("Country: {old} → {new}", { old: countryName(it.old), new: countryName(it.new) }) : tf("Name: {old} → {new}", { old: it.old, new: it.new })}
          meta={it.by ? tf("by {name}", { name: it.by }) : t("by the player")} />
      );
    case "linked_account":
      return <Entry icon={Link2} tone="warning" at={it.at} title={<span className="row">{t("Another account from the same address")}<PersonLink name={it.username} /></span>} />;
    case "account":
      return <Entry icon={UserPlus} tone="success" at={it.at} title={tf("Account {name} made", { name: it.username })} text={it.country ? <Country code={it.country} /> : null} />;
    default:
      return <Entry icon={History} at={(it as { at: number }).at} title={(it as { type: string }).type} />;
  }
}

/** Everything about the player in order, newest first, a page at a time. */
export function PlayerTimeline({ d }: { d: UserDetail }) {
  const { t, tn } = useLocale();
  const admin = useIsAdmin();
  const { toast } = useToasts();
  const { get, set } = useQueryParams();
  const name = d.user.username;
  const kind = get("kind", "all");
  const q = useInfiniteQuery({
    queryKey: ["/timeline", name],
    initialPageParam: null as number | null,
    queryFn: ({ pageParam, signal }) =>
      api<TimelinePage>("/users/" + seg(name) + "/timeline?" + new URLSearchParams({ limit: String(PAGE), ...(pageParam ? { before: String(pageParam) } : {}) }), { signal }),
    getNextPageParam: (last) => last.next ?? undefined,
  });
  if (q.isError && !q.data) return <ErrorPage error={q.error} onRetry={() => void q.refetch()} />;
  if (!q.data) return <PageLoading />;
  const all = q.data.pages.flatMap((p) => p.items).map((i) => (i.type === "notification" ? flatNotification(i) : i));
  const types = FILTERS.find((f) => f[0] === kind)?.[2] || [];
  const list = types.length ? all.filter((i) => types.includes(i.type)) : all;
  const more = async () => {
    const r = await q.fetchNextPage();
    if (r.isError) toast(r.error instanceof Error ? r.error.message : String(r.error), "error");
  };
  return (
    <Card>
      <CardHead title={t("Timeline")} sub={admin ? t("Everything about the account, newest first") : t("Everything about the account, newest first (payments: administrators)")} />
      <div className="card-body toolbar-in">
        <Segmented<string> name={t("Filter")} value={kind} onChange={(v) => set({ kind: v === "all" ? null : v })}
          options={FILTERS.map(([id, label, ts]) => [id, t(label), ts.length ? all.filter((i) => ts.includes(i.type)).length : all.length] as [string, string, number])} />
      </div>
      <div className="card-body">
        {list.length ? (
          <ol className="timeline">{list.map((it, k) => <TimelineEntry key={it.type + it.at + k} it={it} />)}</ol>
        ) : (
          <Empty icon={ListTree} title={t("Nothing of this kind")} text={q.hasNextPage ? t("Load older entries to look further back.") : null} />
        )}
      </div>
      <div className="pager">
        <span>{tn(all.length, "{n} entry loaded", "{n} entries loaded")}</span>
        {q.hasNextPage ? <Btn label={t("Load older")} kind="sm primary" busy={q.isFetchingNextPage} onClick={() => void more()} /> : <span className="faint">{t("The account's beginning")}</span>}
      </div>
    </Card>
  );
}
