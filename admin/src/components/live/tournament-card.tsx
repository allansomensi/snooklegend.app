"use client";

import { Check, Clock, Lock, Search, Target, X } from "lucide-react";
import Link from "next/link";
import { useRefresh } from "@/components/providers";
import { useDialogs } from "@/components/providers/dialogs";
import { useLocale } from "@/components/providers/locale";
import { useToasts } from "@/components/providers/toasts";
import { AlertBox, Badge, Btn, Card, RulesBadge, playerHref, useBusy } from "@/components/ui/bits";
import { BarList } from "@/components/ui/charts";
import { api, seg } from "@/lib/api";
import { useIsAdmin } from "@/lib/hooks";
import { recordOf } from "@/lib/rules";
import type { LivePlayer, Tournament } from "@/lib/types";

/** What a player online is doing, as a badge. */
export function Doing({ p }: { p: LivePlayer }) {
  const { t } = useLocale();
  if (p.status === "available" && p.searching) return <Badge kind="warning" icon={Search}>{t("Looking for a game")}</Badge>;
  if (p.status === "available" && p.vs_computer) return <Badge kind="info" icon={Target}>{t("Against the computer")}</Badge>;
  if (p.status === "available" && p.away) return <Badge icon={Clock}>{t("Away")}</Badge>;
  const label = ({ available: t("In the lounge"), waiting: t("At a table"), playing: t("Playing") } as Record<string, string>)[p.status] || p.status;
  return <Badge kind={p.status === "playing" ? "info dot" : p.status === "waiting" ? "warning" : "success"}>{label}</Badge>;
}

export function TournamentCard({ tm }: { tm: Tournament }) {
  const { t, tf, fmtNum, ago } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const [busy, run] = useBusy();
  const state = ({ registering: [t("Signing up"), "warning"], running: [t("Running"), "success dot"], finished: [t("Finished"), ""] } as Record<string, [string, string]>)[tm.state] || [tm.state, ""];

  const cancel = async () => {
    const ok = await dialogs.confirm({
      title: tf("Call off “{name}”?", { name: tm.name }),
      text: t("Every entry fee goes back and the players are told. It can't be undone."),
      confirm: t("Call off"),
    });
    if (ok && (await run(() => attempt(() => api("/tournaments/" + seg(tm.id) + "/cancel", { method: "POST" }), t("Tournament called off."))))) void refresh();
  };

  const sub = [
    tm.host ? tf("by {name}", { name: tm.host }) : t("organised by the server"),
    tf("{n} of {size} players", { n: tm.players.length, size: tm.size }),
    tm.entry_fee ? tf("entry {n} coins", { n: fmtNum(tm.entry_fee) }) : t("free entry"),
    tm.starts_at ? tf("starts {when}", { when: ago(tm.starts_at) }) : null,
  ].filter(Boolean).join(" · ");

  const standings = (tm.standings || []).slice(0, 10).map((s) => (Array.isArray(s) ? { username: s[0], points: s[1] } : s));

  return (
    <Card>
      <div className="card-head">
        <div>
          <h3 className="row">
            {tm.name}
            <Badge kind={state[1]}>{state[0]}</Badge>
            <RulesBadge rules={tm.rules} />
            <Badge kind="info">{tm.format === "arena" ? t("Arena") : t("Knockout")}</Badge>
            {tm.rated ? <Badge kind="accent">{t("Rated")}</Badge> : null}
            {tm.private ? <Badge icon={Lock}>{t("Private")}</Badge> : null}
          </h3>
          <div className="sub">{sub}</div>
        </div>
        {admin && tm.state === "registering" ? <Btn label={t("Call off")} kind="sm danger-soft" icon={X} busy={busy} onClick={() => void cancel()} /> : null}
      </div>
      <div className="card-body stack">
        {tm.players.length ? (
          <div className="item-chips">
            {tm.players.map((p) => (
              <Link key={p.username} className="item-chip plain" href={playerHref(p.username)}>
                {p.username}
                <span className="faint">{fmtNum(recordOf(p, tm.rules).rating)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="faint">{t("Nobody has signed up yet.")}</p>
        )}
        {tm.champion ? <AlertBox tone="success" title={tf("Champion: {name}", { name: tm.champion })} /> : null}
        {tm.rounds && tm.rounds.length ? (
          <div className="bracket">
            {tm.rounds.map((round, k) => (
              <div key={k} className="round">
                <div className="faint">{k === tm.rounds!.length - 1 ? t("Final") : tf("Round {n}", { n: k + 1 })}</div>
                {round.map((m, j) => (
                  <div key={j} className={"match" + (m.live ? " live" : "")}>
                    {[0, 1].map((s) => (
                      <div key={s} className={m.winner === s ? "won" : ""}>
                        <span className="ellipsis">{m.players[s] || "—"}</span>
                        {m.winner === s ? <Check className="icon" aria-hidden /> : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}
        {standings.length ? (
          <BarList tone="success" rows={standings.map((s) => ({ key: s.username, label: <span className="ellipsis">{s.username}</span>, value: s.points ?? 0 }))} />
        ) : null}
      </div>
    </Card>
  );
}
