"use client";

import { Copy, Pencil, Shield, Target, UserX, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { FOREVER, nowSecs } from "@/admin/lib/format";
import { RULES, recordOf } from "@/admin/lib/rules";
import type { RulesId, User, UserDetail } from "@/admin/lib/types";
import { usePlayerActions } from "../player-dialogs";
import { useLocale } from "../providers/locale";
import {
  AdminOnly, Badge, Btn, Card, CardHead, Country, HealthRow, Kpi, RulesBadge, RulesMark, playerHref, useRoleLabel, useRulesNames,
} from "../ui/bits";
import { useCopy } from "./copy";

/** A player's standing under one of the rules: the rating and its tier,
 * the peak, and the record. `now` marks the rules they play right now. */
function RulesStanding({ u, r, now }: { u: User; r: RulesId; now: boolean }) {
  const { t, tn, fmtNum, fmtPct } = useLocale();
  const { rulesName } = useRulesNames();
  const x = recordOf(u, r);
  return (
    <section className={"card rules-card " + r + (x.games ? "" : " unplayed")} aria-label={rulesName(r)}>
      <div className="rc-head">
        <span className="rc-title"><RulesMark rules={r} />{rulesName(r)}</span>
        {now ? <Badge kind="success dot">{t("Playing these now")}</Badge> : null}
      </div>
      <div className="rc-main">
        <span className="rc-rating">{fmtNum(x.rating)}</span>
        {x.tier ? <span className="rc-tier">{t(x.tier)}</span> : null}
        <span className="rc-peak faint">{tn(x.peak_rating, "peak {n}", "peak {n}")}</span>
      </div>
      {x.games ? (
        <div className="rc-stats">
          <span><b>{fmtNum(x.games)}</b> {tn(x.games, "rated game", "rated games")}</span>
          <span><b>{fmtNum(x.wins)}</b> {tn(x.wins, "win", "wins")}</span>
          <span><b>{fmtPct((x.wins * 100) / x.games, 1)}</b> {t("won")}</span>
        </div>
      ) : (
        <div className="rc-stats faint">{t("No rated game under these rules yet.")}</div>
      )}
    </section>
  );
}

export function PlayerOverview({ d }: { d: UserDetail }) {
  const { t, tf, tn, fmtNum, fmtPct, fmtDate } = useLocale();
  const roleLabel = useRoleLabel();
  const actions = usePlayerActions();
  const copy = useCopy();
  const router = useRouter();
  const u = d.user;
  const c = d.career || {};
  const now = nowSecs();
  const pot = c.shots ? fmtPct(((c.potting_shots || 0) * 100) / c.shots) : "—";
  const presence = d.presence
    ? ({ available: t("In the lounge"), waiting: t("At a table, waiting"), playing: t("Playing") } as Record<string, string>)[d.presence.status] || d.presence.status
    : null;
  const banned = !!u.banned_until && u.banned_until > now;
  const muted = !!u.muted_until && u.muted_until > now;
  const openReports = d.reports.filter((r) => r.status === 0).length;
  const warnings = d.notes.filter((n) => n.kind === "warning").length;
  const none = <span className="faint">{t("none")}</span>;
  return (
    <div className="stack">
      <div className="grid-2">
        {RULES.map((r) => <RulesStanding key={r} u={u} r={r} now={d.presence?.rules === r} />)}
      </div>
      <div className="kpis">
        <Kpi label={t("Casual games")} value={fmtNum(u.casual_games)} icon={Users} tone="success" />
        <Kpi label={t("Potting")} value={pot} sub={c.best_run ? tf("best run {n}", { n: c.best_run }) : null} icon={Target} tone="warning" />
        <Kpi label={t("Games left unfinished")} value={fmtNum(u.abandons)} icon={UserX} tone={u.abandons > 3 ? "danger" : ""} />
        <Kpi label={t("Name changes")} value={tf("{n} of {max}", { n: u.name_changes, max: 3 })} icon={Pencil} />
      </div>
      <div className="grid-2">
        <Card>
          <CardHead title={t("Account")} />
          <div className="card-body">
            <dl className="kv">
              <dt>{t("Username")}</dt>
              <dd>
                <span className="row">
                  <b>{u.username}</b>
                  <Btn label={t("Copy")} kind="sm ghost" icon={Copy} iconOnly onClick={() => copy(u.username)} />
                </span>
              </dd>
              <dt>{t("Role")}</dt>
              <dd>{roleLabel(u.role)}</dd>
              <dt>{t("Country")}</dt>
              <dd><Country code={u.country} /></dd>
              <dt>{t("Recovery e-mail")}</dt>
              <dd>{u.recovery_email || (d.private_hidden ? <AdminOnly /> : none)}</dd>
              <dt>{t("Payment e-mail")}</dt>
              <dd>{d.payment_email || (d.private_hidden ? <AdminOnly /> : none)}</dd>
              <dt>{t("Created")}</dt>
              <dd>{fmtDate(u.created_at)}</dd>
              <dt>{t("Last seen")}</dt>
              <dd>{u.online ? t("online now") : fmtDate(u.last_seen)}</dd>
              {presence && d.presence ? (
                <>
                  <dt>{t("Right now")}</dt>
                  <dd className="row">{presence}<RulesBadge rules={d.presence.rules} long /></dd>
                </>
              ) : null}
              <dt>{t("Status message")}</dt>
              <dd>
                {u.status_message ? (
                  <span className="row">
                    <i>“{u.status_message}”</i>
                    <Btn label={t("Clear")} kind="sm" onClick={() => void actions.quick(u, "clear-status", {}, t("Status message cleared."))} />
                  </span>
                ) : none}
              </dd>
            </dl>
          </div>
        </Card>
        <Card>
          <CardHead title={t("Standing")} />
          <div className="card-body stack">
            <div className="health">
              <HealthRow ok={!banned}
                text={banned ? (u.banned_until! >= FOREVER ? t("Banned for good") : tf("Banned until {when}", { when: fmtDate(u.banned_until) })) : t("Not banned")} />
              <HealthRow ok={!muted} warnOnly text={muted ? tf("Muted until {when}", { when: fmtDate(u.muted_until) }) : t("Not muted")} />
              <HealthRow ok={openReports === 0} warnOnly text={tn(openReports, "{n} open report about them", "{n} open reports about them")}
                side={tn(d.reports.length, "{n} in all", "{n} in all")} />
              <HealthRow ok={warnings === 0} warnOnly text={tn(warnings, "{n} warning", "{n} warnings")} />
              <HealthRow ok={u.abandons <= 3} warnOnly text={tn(u.abandons, "{n} game left unfinished", "{n} games left unfinished")} />
            </div>
            <div className="row">
              <Btn label={t("Open the moderation history")} kind="sm" icon={Shield} onClick={() => router.push(playerHref(u.username, "moderation"))} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
