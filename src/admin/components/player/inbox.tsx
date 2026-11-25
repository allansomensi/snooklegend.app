"use client";

import { Award, Bell, Check, CheckCheck, Clock, EyeOff, Gift, Mail, Pin, Scale, ShieldAlert, Trophy, TriangleAlert, type LucideIcon } from "lucide-react";
import { seg } from "@/admin/lib/api";
import { nowSecs } from "@/admin/lib/format";
import { useApi, useMe, useQueryParams } from "@/admin/lib/hooks";
import { flatNotification, isPinned, isRead, pinnedForGood } from "@/admin/lib/inbox";
import type { Notification, UserDetail } from "@/admin/lib/types";
import { usePlayerActions } from "../player-dialogs";
import { CATEGORIES, useActionWords } from "../preview";
import { useLocale } from "../providers/locale";
import { Badge, Btn, Card, CardHead, Empty, Kpi, Segmented, TimeAgo } from "../ui/bits";
import { Loaded } from "../ui/loaded";
import "@/admin/styles/ops.css";

/** Each filter of the inbox: its icon and colour. */
const LOOK: Record<string, [LucideIcon, string]> = {
  staff: [Mail, "info"], punishment: [ShieldAlert, "danger"], gift: [Gift, "success"], tournament: [Trophy, "warning"],
  achievement: [Award, "success"], game: [Bell, ""],
};

/** A notification's look by its kind (a warning stands out from a message). */
export function notificationLook(n: Pick<Notification, "kind" | "category">): [LucideIcon, string] {
  if (n.kind === "warning") return [TriangleAlert, "warning"];
  if (n.kind === "rating_adjusted") return [Scale, "danger"];
  return LOOK[n.category || ""] || [Bell, ""];
}

/** Whether the player read it, confirmed it, or took it out. */
export function ReadState({ n }: { n: Notification }) {
  const { t, tf, ago, fmtDate } = useLocale();
  if (n.deleted_at) {
    return <Badge icon={EyeOff} title={fmtDate(n.deleted_at)}>{tf("taken out of the inbox {when}", { when: ago(n.deleted_at) })}</Badge>;
  }
  if (isRead(n)) {
    return (
      <Badge kind="success" icon={n.important ? CheckCheck : Check} title={fmtDate(n.read_at)}>
        {n.important ? tf("confirmed {when}", { when: ago(n.read_at) }) : tf("read {when}", { when: ago(n.read_at) })}
      </Badge>
    );
  }
  return <Badge kind={n.important ? "warning" : ""} icon={Clock}>{n.important ? t("not confirmed yet") : t("not read yet")}</Badge>;
}

/** A notification as the staff see it: what it said, its button, when it
 * was sent and by whom, and whether it was read. */
export function NotificationRow({ n }: { n: Notification }) {
  const { t, tf, fmtDate } = useLocale();
  const actionWords = useActionWords();
  const [Icon, tone] = notificationLook(n);
  const button = actionWords(n.action);
  const now = nowSecs();
  return (
    <div className={"notif-row" + (n.deleted_at ? " deleted" : "")}>
      <span className={"tl-dot " + tone}><Icon className="icon" aria-hidden /></span>
      <div className="nr-main">
        <span className="row">
          <b>{n.title || n.kind}</b>
          {n.important ? <Badge kind="warning">{t("Important")}</Badge> : null}
          {isPinned(n, now) ? (
            <Badge kind="info" icon={Pin}>{pinnedForGood(n.pinned_until) ? t("pinned") : tf("pinned until {when}", { when: fmtDate(n.pinned_until) })}</Badge>
          ) : null}
        </span>
        {n.body ? <span className="nr-text">{n.body}</span> : n.text ? <span className="nr-text">{n.text}</span> : null}
        {button ? <span className="faint">{tf("Button: {action}", { action: button })}</span> : null}
      </div>
      <div className="nr-side">
        <ReadState n={n} />
        <span className="faint">
          {n.from ? tf("by {name}", { name: n.from }) : t("by the game")} · <TimeAgo at={n.created_at} />
        </span>
      </div>
    </div>
  );
}

/** The player's inbox: everything the staff and the game told them, with
 * when each was read; a message from the staff. */
export function PlayerInbox({ d }: { d: UserDetail }) {
  const { t, tn, fmtNum } = useLocale();
  const me = useMe();
  const actions = usePlayerActions();
  const { get, set } = useQueryParams();
  const u = d.user;
  const q = useApi<{ notifications: Notification[] }>("/users/" + seg(u.username) + "/notifications?limit=200", { refetchInterval: 30000 });
  const isSelf = me.username.toLowerCase() === u.username.toLowerCase();
  const cat = get("cat", "all");
  return (
    <Loaded queries={[q]}>
      {({ notifications: raw }) => {
        const all = raw.map(flatNotification);
        const now = nowSecs();
        const list = all.filter((n) => cat === "all" || n.category === cat);
        const unread = all.filter((n) => !isRead(n) && !n.deleted_at).length;
        const waiting = all.filter((n) => n.important && !isRead(n) && !n.deleted_at).length;
        const pinned = all.filter((n) => isPinned(n, now) && !n.deleted_at).length;
        const fromStaff = all.filter((n) => !!n.from).length;
        const cats = Object.keys(CATEGORIES).filter((c) => all.some((n) => n.category === c));
        return (
          <div className="stack">
            <div className="kpis">
              <Kpi label={t("Notifications")} value={fmtNum(all.length)} sub={tn(fromStaff, "{n} from the staff", "{n} from the staff")} icon={Bell} tone="info" />
              <Kpi label={t("Not read")} value={fmtNum(unread)} icon={Clock} tone={unread ? "warning" : "success"} />
              <Kpi label={t("Important, not confirmed")} value={fmtNum(waiting)} icon={TriangleAlert} tone={waiting ? "danger" : "success"} />
              <Kpi label={t("Pinned now")} value={fmtNum(pinned)} icon={Pin} />
            </div>
            <Card>
              <CardHead title={t("Their inbox")} sub={t("Newest first, also what they took out; worded in English as the game words it")}>
                {isSelf || u.deleted_at ? null : <Btn label={t("Send a message")} kind="sm primary" icon={Mail} onClick={() => actions.message(u)} />}
              </CardHead>
              {all.length ? (
                <>
                  <div className="card-body toolbar-in">
                    <Segmented<string> name={t("Filter")} value={cat} onChange={(v) => set({ cat: v === "all" ? null : v })}
                      options={[["all", t("All"), all.length], ...cats.map((c) => [c, t(CATEGORIES[c]), all.filter((n) => n.category === c).length] as [string, string, number])]} />
                  </div>
                  {list.length ? list.map((n) => <NotificationRow key={n.id} n={n} />) : <Empty icon={Bell} title={t("Nothing of this kind")} />}
                </>
              ) : (
                <Empty icon={Bell} title={t("Nothing sent yet")} text={t("Warnings, mutes, presents and messages from the staff show up here, with when they were read.")} />
              )}
            </Card>
          </div>
        );
      }}
    </Loaded>
  );
}
