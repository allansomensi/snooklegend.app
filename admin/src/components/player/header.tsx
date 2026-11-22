"use client";

import {
  Ban, CalendarDays, Clock, Coins, Copy, Ellipsis, Gift, Key, LogOut, MicOff, Pencil, Shield, Star, StickyNote, Trash2, TriangleAlert, Undo2, UserX,
} from "lucide-react";
import { useIsAdmin, useMe } from "@/lib/hooks";
import { FOREVER, nowSecs } from "@/lib/format";
import { RULES, recordOf } from "@/lib/rules";
import type { UserDetail } from "@/lib/types";
import { usePlayerActions } from "../player-dialogs";
import { useDialogs } from "../providers/dialogs";
import { useLocale } from "../providers/locale";
import { AlertBox, Avatar, Btn, Card, Country, DropMenu, RulesBadge, UserBadges, type MenuItem } from "../ui/bits";
import { useCopy } from "./copy";

/** The player's card: who they are, their ratings, and the actions on them. */
export function PlayerHeader({ d }: { d: UserDetail }) {
  const { t, tf, fmtNum, fmtDate, fmtDateOnly, ago } = useLocale();
  const me = useMe();
  const admin = useIsAdmin();
  const actions = usePlayerActions();
  const dialogs = useDialogs();
  const copy = useCopy();
  const u = d.user;
  const now = nowSecs();
  const banned = !!u.banned_until && u.banned_until > now;
  const muted = !!u.muted_until && u.muted_until > now;
  const isSelf = me.username.toLowerCase() === u.username.toLowerCase();

  const more: (MenuItem | "-" | { group: string } | null)[] = [
    { label: t("Copy the name"), icon: Copy, onSelect: () => copy(u.username) },
    { label: t("Add a staff note"), icon: StickyNote, onSelect: () => actions.note(u, "note") },
    u.status_message ? { label: t("Clear the status message"), icon: Trash2, onSelect: () => void actions.quick(u, "clear-status", {}, t("Status message cleared.")) } : null,
    {
      label: t("Sign out everywhere"),
      icon: LogOut,
      onSelect: async () => {
        const ok = await dialogs.confirm({
          title: tf("Sign {name} out everywhere?", { name: u.username }),
          text: t("Every session of the account ends; the player signs in again."),
          confirm: t("Sign out"),
          tone: "warning",
        });
        if (ok) void actions.quick(u, "logout-all", {}, t("Signed out everywhere."));
      },
    },
    ...(admin
      ? ([
          "-",
          { group: t("Administrators") },
          { label: t("Rename…"), icon: Pencil, onSelect: () => actions.rename(u) },
          { label: t("Change the role…"), icon: Shield, onSelect: () => actions.role(u) },
          { label: t("Set a new password…"), icon: Key, onSelect: () => actions.password(u) },
          { label: t("Give coins…"), icon: Coins, onSelect: () => actions.coins(u) },
          { label: t("Give an item…"), icon: Gift, onSelect: () => void actions.item(u) },
          { label: t("Give VIP days…"), icon: Star, onSelect: () => actions.vip(u) },
        ] as const)
      : []),
  ];

  return (
    <>
      <Card>
        <div className="card-body profile-head">
          <Avatar name={u.username} size="lg" />
          <div className="who">
            <h1>
              {u.username}
              <UserBadges u={u} />
            </h1>
            <div className="facts">
              <span><Country code={u.country} /></span>
              {RULES.map((r) => {
                const x = recordOf(u, r);
                return (
                  <span key={r} className="fact-rating">
                    <RulesBadge rules={r} />
                    {fmtNum(x.rating) + (x.tier ? " · " + t(x.tier) : "")}
                  </span>
                );
              })}
              <span><CalendarDays className="icon" aria-hidden />{tf("joined {when}", { when: fmtDateOnly(u.created_at) })}</span>
              <span title={u.online ? undefined : fmtDate(u.last_seen)}>
                <Clock className="icon" aria-hidden />
                {u.online ? t("online now") : tf("seen {when}", { when: ago(u.last_seen) })}
              </span>
              <span className="faint mono">ID {u.id}</span>
            </div>
          </div>
          {u.deleted_at ? null : (
            <div className="action-bar">
              {isSelf ? null : <Btn label={t("Warn")} icon={TriangleAlert} onClick={() => actions.note(u, "warning")} />}
              {isSelf ? null : muted ? (
                <Btn label={t("Unmute")} icon={Undo2} onClick={() => void actions.quick(u, "unmute", {}, t("Unmuted."))} />
              ) : (
                <Btn label={t("Mute")} icon={MicOff} onClick={() => actions.mute(u)} />
              )}
              {!isSelf && u.online ? <Btn label={t("Disconnect")} icon={UserX} onClick={() => actions.kick(u)} /> : null}
              {isSelf ? null : banned ? (
                <Btn label={t("Lift the ban")} icon={Undo2} onClick={() => actions.unban(u)} />
              ) : (
                <Btn label={t("Ban")} kind="danger-soft" icon={Ban} onClick={() => actions.ban(u)} />
              )}
              <DropMenu
                trigger={
                  <button type="button" className="btn">
                    <Ellipsis className="icon" aria-hidden />
                    {t("More")}
                  </button>
                }
                items={more}
              />
            </div>
          )}
        </div>
      </Card>
      {banned || muted || u.deleted_at ? (
        <div className="stack section">
          {u.deleted_at ? <AlertBox tone="info" title={t("Account deleted")} text={tf("Deleted and anonymised on {when}.", { when: fmtDate(u.deleted_at) })} /> : null}
          {banned ? (
            <AlertBox
              tone="danger"
              title={u.banned_until! >= FOREVER ? t("Banned for good") : tf("Banned until {when}", { when: fmtDate(u.banned_until) })}
              text={u.ban_reason ? tf("Reason: {reason}", { reason: u.ban_reason }) : null}
            />
          ) : null}
          {muted ? <AlertBox tone="warning" title={tf("Muted until {when}", { when: fmtDate(u.muted_until) })} text={t("They can play but not write in the chat.")} /> : null}
        </div>
      ) : null}
    </>
  );
}
