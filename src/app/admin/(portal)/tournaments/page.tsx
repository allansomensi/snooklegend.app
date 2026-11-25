"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Crown, ExternalLink, Settings2, Trophy, Users, X } from "lucide-react";
import Link from "next/link";
import { EventDialog } from "@/admin/components/events/event-dialog";
import { eventWhat } from "@/admin/components/events/event-words";
import { ItemLabel, useCatalog } from "@/admin/components/items";
import { Progress, Section, StatusBadge, useWhen } from "@/admin/components/ops/schedule";
import { useRefresh } from "@/admin/components/providers";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import {
  AlertBox, Badge, Btn, Card, CardHead, DataTable, Empty, Kpi, PageHead, PersonLink, RulesBadge, Updated, useBusy,
} from "@/admin/components/ui/bits";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { api, seg } from "@/admin/lib/api";
import { apiBase } from "@/admin/lib/config";
import { useApi, useIsAdmin } from "@/admin/lib/hooks";
import type { EventLimits, GameEvent, OfficialLive, Officials } from "@/admin/lib/types";
import { tournamentPath } from "@/lib/routes";
import "@/admin/styles/moderation.css";
import "@/admin/styles/ops.css";

/** The website's list of finished official tournaments: their champions' names. */
interface PublicTournament {
  id: number;
  champion: string | null;
  runner_up: string | null;
}

export default function TournamentsPage() {
  const { t, tf, fmtNum, ago } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const q = useApi<Officials>("/tournaments/official", { refetchInterval: 30000 });
  const events = useApi<{ limits: EventLimits }>("/events");
  // The public API names the champions (the staff API gives their ids).
  const names = useQuery({
    queryKey: ["public-tournaments"],
    queryFn: async ({ signal }) => {
      const r = await fetch(apiBase() + "/api/tournaments?limit=200", { signal, credentials: "omit" });
      return r.ok ? ((await r.json()) as PublicTournament[]) : [];
    },
    staleTime: 60000,
  });
  return (
    <Loaded queries={[q, events]}>
      {(d, ev) => {
        const champions = new Map((names.data || []).map((x) => [x.id, x]));
        const pools = d.live.reduce((a, x) => a + (x.prize_pool || 0), 0);
        const scheduled = [...d.scheduled].filter((e) => !e.cancelled_at).sort((a, b) => a.starts_at - b.starts_at);
        return (
          <div>
            <PageHead title={t("Official tournaments")} sub={t("The weekly cup and the staff's tournaments: scheduled, open with their prize pool, finished")}>
              <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
              <Link className="btn" href="/admin/events"><CalendarDays className="icon" aria-hidden />{t("Events")}</Link>
              {admin ? (
                <Btn label={t("New official tournament")} kind="primary" icon={Trophy}
                  onClick={() => dialogs.open((close) => <EventDialog tournament limits={ev.limits} houseCut={d.house_cut_percent} onClose={close} />)} />
              ) : null}
            </PageHead>
            {admin ? null : <AlertBox tone="info" title={t("Only administrators schedule tournaments")} text={t("They take entry fees and pay prizes.")} />}
            <div className={"kpis" + (admin ? "" : " section")}>
              <Kpi label={t("The weekly cup")} value={d.weekly_cup ? ago(d.weekly_cup.next_start) : t("Off")} sub={d.weekly_cup ? d.weekly_cup.name : t("not organised")} icon={Trophy}
                tone={d.weekly_cup ? "success" : ""} href="/admin/settings#group-weekly_cup" />
              <Kpi label={t("Open or running")} value={fmtNum(d.live.length)} sub={pools ? tf("{n} coins in prize pools", { n: fmtNum(pools) }) : t("no prize pool now")} icon={Users} tone="info" />
              <Kpi label={t("Coming up")} value={fmtNum(scheduled.length)} sub={scheduled.length ? tf("the next {when}", { when: ago(scheduled[0].starts_at) }) : t("nothing scheduled")} icon={CalendarDays} />
              <Kpi label={t("The house's cut")} value={d.house_cut_percent + "%"} sub={t("of the entry fees, out of the economy")} icon={Settings2} href="/admin/settings#group-tournaments" />
            </div>
            {d.weekly_cup ? <WeeklyCup cup={d.weekly_cup} /> : null}
            <Section title={t("Open or running")} empty={<Card><Empty icon={Trophy} title={t("No official tournament right now")} /></Card>}>
              {d.live.map((x) => <LiveCard key={x.id} x={x} now={d.now} />)}
            </Section>
            <Section title={t("Scheduled")} sub={t("They open for sign-up two hours before they start")} empty={<Card><Empty icon={CalendarDays} title={t("Nothing scheduled")} /></Card>}>
              {scheduled.map((e) => <ScheduledCard key={e.id} e={e} now={d.now} />)}
            </Section>
            <Section title={t("Finished")} sub={t("The latest 100, kept for the website")} empty={<Card><Empty icon={Crown} title={t("No official tournament finished yet")} /></Card>}>
              {d.finished.length ? [
                <Card key="table">
                  <DataTable headers={[t("Tournament"), t("When"), t("Game"), { label: t("Players"), cls: "num" }, { label: t("Prize pool"), cls: "num" }, t("Champion"), t("Runner-up"), ""]}>
                    {d.finished.map((f) => {
                      const c = champions.get(f.id);
                      return (
                        <tr key={f.id}>
                          <td>
                            <b>{f.name}</b>
                            {f.item_prize ? <div><ItemPrize code={f.item_prize} /></div> : null}
                          </td>
                          <td className="nowrap"><span title={String(f.starts_at)}>{ago(f.ends_at)}</span></td>
                          <td>
                            <span className="badges">
                              <RulesBadge rules={f.rules} />
                              <Badge kind="info">{f.format === "arena" ? t("Arena") : tf("Knockout · {n} seats", { n: f.size })}</Badge>
                              {f.rated ? <Badge kind="accent">{t("Rated")}</Badge> : null}
                            </span>
                          </td>
                          <td className="num">{fmtNum(f.players)}</td>
                          <td className="num">{fmtNum(f.prize_pool)}<div className="faint">{f.prizes.map((p) => fmtNum(p)).join(" · ")}</div></td>
                          <td>{c?.champion ? <PersonLink name={c.champion} /> : <span className="faint">{f.champion_id ? "#" + f.champion_id : "—"}</span>}</td>
                          <td>{c?.runner_up ? <PersonLink name={c.runner_up} /> : <span className="faint">{f.runner_up_id ? "#" + f.runner_up_id : "—"}</span>}</td>
                          <td className="actions-cell">
                            <a className="btn sm ghost icon-only" href={tournamentPath("en", f.id)} target="_blank" rel="noopener" title={t("Its page on the website")} aria-label={t("Its page on the website")}>
                              <ExternalLink className="icon" aria-hidden />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </DataTable>
                </Card>,
              ] : []}
            </Section>
          </div>
        );
      }}
    </Loaded>
  );
}

function ItemPrize({ code }: { code: string }) {
  const { t } = useLocale();
  const catalog = useCatalog();
  const i = catalog.data?.catalog.find((x) => x.code === code);
  return <span className="row faint">{t("Item for the champion:")}<ItemLabel code={code} name={i?.name} rarity={i?.rarity} showCode={false} /></span>;
}

function WeeklyCup({ cup }: { cup: NonNullable<Officials["weekly_cup"]> }) {
  const { t, tf, fmtNum, fmtDate } = useLocale();
  return (
    <Card className="section">
      <CardHead title={<span className="row"><Trophy className="icon" aria-hidden />{cup.name}</span>} sub={t("The weekly cup, organised by the server")}>
        <Link className="btn sm" href="/admin/settings#group-weekly_cup"><Settings2 className="icon" aria-hidden />{t("Its settings")}</Link>
      </CardHead>
      <div className="card-body row">
        <b>{tf("Next: {when}", { when: fmtDate(cup.next_start) })}</b>
        <RulesBadge rules={cup.rules} />
        <Badge kind="info">{cup.format === "arena" ? t("Arena") : t("Knockout")}</Badge>
        <span className="muted">{cup.entry_fee ? tf("entry {n} coins", { n: fmtNum(cup.entry_fee) }) : t("free entry")}</span>
        {cup.house_prize ? <span className="muted">{tf("the house adds {n} coins", { n: fmtNum(cup.house_prize) })}</span> : null}
      </div>
    </Card>
  );
}

function LiveCard({ x, now }: { x: OfficialLive; now: number }) {
  const { t, tf, fmtNum } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const when = useWhen();
  const [busy, run] = useBusy();
  const status = x.state;
  const cancel = async () => {
    const ok = await dialogs.confirm({
      title: tf("Call off “{name}”?", { name: x.name }),
      text: t("Every entry fee goes back and the players are told. It can't be undone."),
      confirm: t("Call off"),
    });
    if (ok && (await run(() => attempt(() => api("/tournaments/" + seg(x.id) + "/cancel", { method: "POST" }), t("Tournament called off."))))) void refresh();
  };
  return (
    <Card>
      <div className="card-head">
        <div>
          <h3 className="row">{x.name}<StatusBadge status={status} /><RulesBadge rules={x.rules} />
            <Badge kind="info">{x.format === "arena" ? t("Arena") : tf("Knockout · {n} seats", { n: x.size })}</Badge></h3>
          <div className="sub">
            {[tf("{n} of {size} players", { n: x.players, size: x.size }), x.entry_fee ? tf("entry {n} coins", { n: fmtNum(x.entry_fee) }) : t("free entry"),
              x.starts_at && x.ends_at ? when(status === "registering" ? "scheduled" : "live", x.starts_at, x.ends_at) : null].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div className="row">
          <Link className="btn sm" href="/admin/live?tab=tournaments">{t("Live")}</Link>
          {admin && status === "registering" ? <Btn label={t("Call off")} kind="sm danger-soft" icon={X} busy={busy} onClick={() => void cancel()} /> : null}
        </div>
      </div>
      <div className="card-body stack">
        <div className="row">
          <b>{tf("Prize pool now: {n} coins", { n: fmtNum(x.prize_pool) })}</b>
          {x.prizes.length ? <span className="muted">{tf("champion {first} · runner-up {second}", { first: fmtNum(x.prizes[0] || 0), second: fmtNum(x.prizes[1] || 0) })}</span> : null}
          {x.item_prize ? <ItemPrize code={x.item_prize} /> : null}
        </div>
        {status === "running" && x.starts_at && x.ends_at ? <Progress from={x.starts_at} to={x.ends_at} now={now} tone="info" label={when("live", x.starts_at, x.ends_at)} /> : null}
      </div>
    </Card>
  );
}

function ScheduledCard({ e, now }: { e: GameEvent; now: number }) {
  const l = useLocale();
  const { t, tf, fmtDate, ago } = l;
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const [busy, run] = useBusy();
  const cancel = async () => {
    const ok = await dialogs.confirm({
      title: tf("Call off the event “{name}”?", { name: e.title }),
      text: t("If its tournament is open for sign-up, it is called off and every entry fee goes back."),
      confirm: t("Call off the event"),
    });
    if (ok && (await run(() => attempt(() => api("/events/" + seg(e.id) + "/cancel", { method: "POST" }), t("Event called off."))))) void refresh();
  };
  return (
    <Card>
      <div className="card-head">
        <div className="row">
          <span className="event-icon info"><Trophy className="icon" aria-hidden /></span>
          <div>
            <h3>{e.title}</h3>
            <div className="sub">{eventWhat(e, l)}</div>
          </div>
        </div>
        <div className="row">
          <StatusBadge status={e.starts_at <= now ? "live" : "scheduled"} />
          {admin ? <Btn label={t("Call off")} kind="sm danger-soft" icon={X} busy={busy} onClick={() => void cancel()} /> : null}
        </div>
      </div>
      <div className="card-body stack">
        <div className="row between">
          <span className="num">{fmtDate(e.starts_at) + " → " + fmtDate(e.ends_at)}</span>
          <span className="muted">{tf("starts {when}", { when: ago(e.starts_at) })}</span>
        </div>
        {e.item_prize ? <ItemPrize code={e.item_prize} /> : null}
        <div className="faint">{tf("Scheduled by {name}, {when}", { name: e.created_by || "?", when: ago(e.created_at) })}</div>
      </div>
    </Card>
  );
}
