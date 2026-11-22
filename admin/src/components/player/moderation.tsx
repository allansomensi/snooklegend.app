"use client";

import { Check, Clock, Flag, Shield, StickyNote, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { useIsAdmin, useMe } from "@/lib/hooks";
import type { Note, UserDetail } from "@/lib/types";
import { auditLook, useAuditWords } from "../audit";
import { usePlayerActions } from "../player-dialogs";
import { useRefresh } from "../providers";
import { useDialogs } from "../providers/dialogs";
import { useLocale } from "../providers/locale";
import { useToasts } from "../providers/toasts";
import { ReportCard } from "../report-card";
import { Badge, Btn, Card, CardHead, Empty, TimeAgo } from "../ui/bits";

function NoteCard({ n }: { n: Note }) {
  const { t, tf, ago } = useLocale();
  const me = useMe();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const warning = n.kind === "warning";
  const remove = async () => {
    const ok = await dialogs.confirm({
      title: t("Remove this note?"),
      text: t("It is gone for every staff member. The audit log keeps that it was removed."),
      confirm: t("Remove"),
    });
    if (ok && (await attempt(() => api("/notes/" + n.id, { method: "DELETE" }), t("Note removed.")))) void refresh();
  };
  return (
    <div className={"note-card" + (warning ? " warning" : "")}>
      <div className="note-head">
        <span className="row">
          <Badge kind={warning ? "warning" : "info"} icon={warning ? TriangleAlert : StickyNote}>{warning ? t("Warning") : t("Note")}</Badge>
          <span>{tf("{name}, {when}", { name: n.author, when: ago(n.created_at) })}</span>
        </span>
        <span className="row">
          {warning ? (
            n.delivered_at ? (
              <Badge kind="success" icon={Check}>{tf("seen {when}", { when: ago(n.delivered_at) })}</Badge>
            ) : (
              <Badge icon={Clock}>{t("waiting for the next sign-in")}</Badge>
            )
          ) : null}
          {n.author === me.username || admin ? <Btn label={t("Remove")} kind="sm ghost" icon={Trash2} iconOnly onClick={() => void remove()} /> : null}
        </span>
      </div>
      <div className="note-text">{n.text}</div>
    </div>
  );
}

export function PlayerModeration({ d }: { d: UserDetail }) {
  const { t, tf, tn, fmtNum } = useLocale();
  const { auditLabel } = useAuditWords();
  const actions = usePlayerActions();
  const [allReports, setAllReports] = useState(false);
  const u = d.user;
  const shown = allReports ? d.reports : d.reports.slice(0, 5);
  return (
    <div className="grid-aside">
      <div className="stack">
        <Card>
          <CardHead title={t("Staff notes and warnings")}>
            <Btn label={t("Note")} kind="sm" icon={StickyNote} onClick={() => actions.note(u, "note")} />
            {u.deleted_at ? null : <Btn label={t("Warn")} kind="sm" icon={TriangleAlert} onClick={() => actions.note(u, "warning")} />}
          </CardHead>
          <div className="card-body">
            {d.notes.length ? (
              <div className="stack">{d.notes.map((n) => <NoteCard key={n.id} n={n} />)}</div>
            ) : (
              <Empty icon={StickyNote} title={t("No notes yet")} text={t("Notes stay among the staff; warnings are shown to the player.")} />
            )}
          </div>
        </Card>
        <Card>
          <CardHead title={tf("Reports about {name}", { name: u.username })} sub={tn(d.reports.length, "{n} report", "{n} reports")} />
          {d.reports.length ? (
            <div className="stack card-body">
              {shown.map((r) => <ReportCard key={r.id} r={r} compact />)}
              {d.reports.length > shown.length ? (
                <div className="row">
                  <Btn label={tf("Show all {n}", { n: fmtNum(d.reports.length) })} kind="sm" onClick={() => setAllReports(true)} />
                </div>
              ) : null}
            </div>
          ) : (
            <Empty icon={Flag} title={t("No reports")} text={t("Nobody has reported this player.")} />
          )}
        </Card>
      </div>
      <Card>
        <CardHead title={t("History")} sub={t("Every staff action on this account")} />
        <div className="card-body">
          {d.moderation.length ? (
            <ol className="timeline">
              {d.moderation.map((e) => {
                const [tone, Icon] = auditLook(e.action);
                return (
                  <li key={e.id} className="tl-item">
                    <div className={"tl-dot " + tone}><Icon className="icon" aria-hidden /></div>
                    <div className="tl-body">
                      <span className="tl-title">{auditLabel(e.action)}</span>
                      {e.details ? <span className="tl-text">{e.action === "login" ? tf("from {ip}", { ip: e.details }) : e.details}</span> : null}
                      <span className="tl-meta">{tf("by {name}", { name: e.staff })} · <TimeAgo at={e.at} /></span>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <Empty icon={Shield} title={t("A clean record")} text={t("No staff action has been taken on this account.")} />
          )}
        </div>
      </Card>
    </div>
  );
}
