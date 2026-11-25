"use client";

import { CalendarDays, Coins, Star, Trophy, X } from "lucide-react";
import Link from "next/link";
import { EventDialog } from "@/admin/components/events/event-dialog";
import { EVENT_STATUS, eventKind, eventWhat } from "@/admin/components/events/event-words";
import { useRefresh } from "@/admin/components/providers";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { AlertBox, Badge, Btn, Card, Empty, Kpi, PageHead, Updated, useBusy } from "@/admin/components/ui/bits";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { api, seg } from "@/admin/lib/api";
import { useApi, useIsAdmin } from "@/admin/lib/hooks";
import type { EventLimits, GameEvent } from "@/admin/lib/types";
import "@/admin/styles/moderation.css";

export default function EventsPage() {
  const { t, tf, fmtNum, ago } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const q = useApi<{ now: number; events: GameEvent[]; limits: EventLimits }>("/events", { refetchInterval: 30000 });
  return (
    <Loaded queries={[q]}>
      {(d) => {
        const live = d.events.filter((e) => e.status === "live").sort((a, b) => a.ends_at - b.ends_at);
        const next = d.events.filter((e) => e.status === "scheduled").sort((a, b) => a.starts_at - b.starts_at);
        const past = d.events.filter((e) => e.status === "ended" || e.status === "cancelled").slice(0, 20);
        const boostNow = (kind: string) => Math.max(1, ...live.filter((e) => e.kind === kind).map((e) => e.multiplier));
        const section = (title: string, sub: string | null, list: GameEvent[], emptyTitle: string, emptyText: string | null) => (
          <div className="section">
            <div className="section-head">
              <h2>{title}</h2>
              {sub ? <span className="sub">{sub}</span> : null}
            </div>
            {list.length ? (
              <div className="stack">{list.map((e) => <EventCard key={e.id} e={e} now={d.now} />)}</div>
            ) : (
              <Card><Empty icon={CalendarDays} title={emptyTitle} text={emptyText} /></Card>
            )}
          </div>
        );
        return (
          <div>
            <PageHead title={t("Events")} sub={t("Experience or coins that count more for a while, and themed tournaments")}>
              <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
              <Link className="btn" href="/admin/tournaments"><Trophy className="icon" aria-hidden />{t("Official tournaments")}</Link>
              {admin ? (
                <Btn label={t("New event")} kind="primary" icon={CalendarDays}
                  onClick={() => dialogs.open((close) => <EventDialog limits={d.limits} onClose={close} />)} />
              ) : null}
            </PageHead>
            {admin ? null : <AlertBox tone="info" title={t("Only administrators schedule events")} text={t("They change what the game pays out.")} />}
            <div className={"kpis" + (admin ? "" : " section")}>
              <Kpi label={t("Experience now")} value={"×" + boostNow("xp")} sub={boostNow("xp") > 1 ? t("a boost is running") : t("as usual")} icon={Star} tone={boostNow("xp") > 1 ? "success" : ""} />
              <Kpi label={t("Coins from games now")} value={"×" + boostNow("coins")} sub={boostNow("coins") > 1 ? t("a boost is running") : t("as usual")} icon={Coins}
                tone={boostNow("coins") > 1 ? "warning" : ""} />
              <Kpi label={t("Coming up")} value={fmtNum(next.length)} sub={next.length ? tf("the next {when}", { when: ago(next[0].starts_at) }) : t("nothing scheduled")}
                icon={CalendarDays} tone="info" />
            </div>
            {section(t("Running now"), null, live, t("No event is running"), admin ? t("Schedule one with “New event”.") : null)}
            {section(t("Coming up"), t("Players see what starts within two weeks"), next, t("Nothing scheduled"), null)}
            {past.length ? section(t("Past"), t("The latest 20"), past, "", null) : null}
          </div>
        );
      }}
    </Loaded>
  );
}

function EventCard({ e, now }: { e: GameEvent; now: number }) {
  const l = useLocale();
  const { t, tf, ago, fmtDate } = l;
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const [busy, run] = useBusy();
  const [, Icon, tone] = eventKind(e.kind);
  const [st, stTone] = EVENT_STATUS[e.status] || [e.status, ""];
  const when =
    e.status === "live" ? tf("ends {when}", { when: ago(e.ends_at) })
      : e.status === "scheduled" ? tf("starts {when}", { when: ago(e.starts_at) })
        : e.status === "cancelled" ? tf("called off {when}", { when: ago(e.cancelled_at) }) : tf("ended {when}", { when: ago(e.ends_at) });
  const progress = Math.max(1, Math.min(100, ((now - e.starts_at) * 100) / Math.max(1, e.ends_at - e.starts_at)));
  const cancel = async () => {
    const ok = await dialogs.confirm({
      title: tf("Call off the event “{name}”?", { name: e.title }),
      text: e.kind === "tournament" ? t("If its tournament is open for sign-up, it is called off and every entry fee goes back.") : t("The boost stops at once."),
      confirm: t("Call off the event"),
    });
    if (ok && (await run(() => attempt(() => api("/events/" + seg(e.id) + "/cancel", { method: "POST" }), t("Event called off."))))) void refresh();
  };
  return (
    <Card className={e.status === "ended" || e.status === "cancelled" ? "faded" : ""}>
      <div className="card-head">
        <div className="row">
          <span className={"event-icon " + tone}><Icon className="icon" aria-hidden /></span>
          <div>
            <h3>{e.title}</h3>
            <div className="sub">{eventWhat(e, l)}</div>
          </div>
        </div>
        <div className="row">
          <Badge kind={stTone}>{t(st)}</Badge>
          {admin && (e.status === "live" || e.status === "scheduled") ? (
            <Btn label={t("Call off the event")} kind="sm danger-soft" icon={X} busy={busy} onClick={() => void cancel()} />
          ) : null}
        </div>
      </div>
      <div className="card-body stack">
        <div className="row between">
          <span className="num">{fmtDate(e.starts_at) + " → " + fmtDate(e.ends_at)}</span>
          <span className="muted">{when}</span>
        </div>
        {e.status === "live" ? (
          <div className="event-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label={when}>
            <div className={tone} style={{ width: progress + "%" }} />
          </div>
        ) : null}
        <div className="faint">{tf("Scheduled by {name}, {when}", { name: e.created_by || "?", when: ago(e.created_at) })}</div>
      </div>
    </Card>
  );
}
