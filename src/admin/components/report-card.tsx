"use client";

import { Ban, Check, Download, MicOff, Play, TriangleAlert, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, seg } from "@/admin/lib/api";
import { downloadReplay } from "@/admin/lib/download";
import { oneLine } from "@/admin/lib/format";
import { useIsAdmin, useMe } from "@/admin/lib/hooks";
import type { Report } from "@/admin/lib/types";
import { usePlayerActions } from "./player-dialogs";
import { useRefresh } from "./providers";
import { useLocale } from "./providers/locale";
import { useToasts } from "./providers/toasts";
import { useViewer } from "./providers/viewer";
import { ReasonBadge } from "./report-reason";
import { Badge, Btn, PersonLink, RulesBadge, TimeAgo } from "./ui/bits";

/** A report, with the game it is about and, while open, the answers:
 * a sanction (which closes it with what was done), dismiss or close. */
export function ReportCard({ r, compact = false, about = 0 }: { r: Report; compact?: boolean; about?: number }) {
  const { t, tf, tn } = useLocale();
  const me = useMe();
  const admin = useIsAdmin();
  const router = useRouter();
  const actions = usePlayerActions();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const open = r.status === 0;
  const target = { username: r.target, online: false };

  const resolve = async (status: "actioned" | "dismissed" | "open", text?: string) => {
    // One answer at a time: the buttons are off while it is sent.
    if (sending) return;
    setSending(true);
    try {
      const ok = await attempt(
        () => api("/reports/" + seg(r.id), { method: "POST", body: { status, note: oneLine(text ?? note) } }),
        status === "dismissed" ? t("Report dismissed.") : status === "open" ? t("Report reopened.") : t("Report closed."),
      );
      if (ok) {
        setNote("");
        void refresh();
      }
    } finally {
      setSending(false);
    }
  };
  const after = (what: string) => void resolve("actioned", [what, note].filter(Boolean).join(" · "));

  // About oneself: a moderator leaves it to an administrator; an
  // administrator closes it or dismisses it (no sanctions on oneself).
  const aboutMe = String(r.target || "").toLowerCase() === me.username.toLowerCase();
  const mayAnswer = !aboutMe || admin;

  return (
    <article className="card report-card" aria-label={tf("Report #{id}", { id: r.id })}>
      <div className="report-top">
        <ReasonBadge reason={r.reason} />
        <span className="faint mono">#{r.id}</span>
        {about > 1 ? <Badge kind="danger">{tn(about, "{n} report about them", "{n} reports about them")}</Badge> : null}
        <span className="when">
          <TimeAgo at={r.created_at} />
        </span>
      </div>
      {compact ? (
        <div className="parties">
          {t("By")} <PersonLink name={r.reporter} />
        </div>
      ) : (
        <div className="parties">
          <PersonLink name={r.target} />
          <span className="arrow">{t("reported by")}</span>
          <PersonLink name={r.reporter} />
        </div>
      )}
      {r.details ? <p className="details">{r.details}</p> : null}
      <GameBlock r={r} />
      {r.context ? (
        <details>
          <summary className="muted">{t("The chat before the report")}</summary>
          <pre className="context">{r.context}</pre>
        </details>
      ) : null}
      {open && !compact && !mayAnswer ? <div className="row muted">{t("An administrator answers reports about you.")}</div> : null}
      {open && !compact && mayAnswer ? (
        <div className="resolve">
          <input
            className="input"
            placeholder={t("A note on what was done (optional)")}
            maxLength={300}
            aria-label={t("Note")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void resolve("actioned");
              }
            }}
          />
          {aboutMe ? null : (
            <>
              <Btn label={t("Warn")} kind="sm" icon={TriangleAlert} disabled={sending} onClick={() => actions.note(target, "warning", () => after(t("Warned")))} />
              <Btn label={t("Mute")} kind="sm" icon={MicOff} disabled={sending} onClick={() => actions.mute(target, (time) => after(tf("Muted for {time}", { time })))} />
              <Btn label={t("Ban")} kind="sm danger-soft" icon={Ban} disabled={sending} onClick={() => actions.ban(target, (time) => after(tf("Banned ({time})", { time })))} />
            </>
          )}
          <Btn label={t("Dismiss")} kind="sm" disabled={sending} onClick={() => void resolve("dismissed")} />
          <Btn label={t("Close: action taken")} kind="sm primary" icon={Check} busy={sending} onClick={() => void resolve("actioned")} />
        </div>
      ) : null}
      {open && compact ? (
        <div className="row">
          <Btn label={t("Open in reports")} kind="sm ghost" onClick={() => router.push("/admin/reports?q=" + encodeURIComponent(r.target))} />
        </div>
      ) : null}
      {!open ? (
        <div className="row muted">
          <Badge kind={r.status === 1 ? "success" : ""}>{r.status === 1 ? t("Action taken") : t("Dismissed")}</Badge>
          <span>{tf("by {name}", { name: r.resolved_by || "?" })}</span>
          {r.resolution ? <span>· {r.resolution}</span> : null}
          {compact || !mayAnswer ? null : (
            <Btn label={t("Reopen")} kind="sm ghost" icon={Undo2} busy={sending} onClick={() => void resolve("open", "")} />
          )}
        </div>
      ) : null}
    </article>
  );
}

/** The game that came with a report. */
function GameBlock({ r }: { r: Report }) {
  const { t, tf, tn, ago } = useLocale();
  const viewer = useViewer();
  const { attempt } = useToasts();
  const g = r.game;
  if (!g) return <div className="game-attach none">{t("No game between them in the 24 hours before the report.")}</div>;
  if (g.kind === "gone") {
    return <div className="game-attach none">{t("They were playing when it was sent, but that game was never stored (the server restarted).")}</div>;
  }
  const live = g.kind === "live";
  const when = live ? (g.finished ? t("just ended") : t("in progress when reported")) : tf("ended {when}", { when: ago(g.at) });
  return (
    <div className="game-attach">
      <div className="gi">
        <b>{(live ? t("Game in progress") : t("The game")) + ": " + g.players[0] + " × " + g.players[1]}</b>
        <span className="row">
          <RulesBadge rules={g.rules} />
          {[when, g.rated ? t("rated") : t("casual"), tn(g.shots, "{n} stroke", "{n} strokes")].join(" · ")}
        </span>
      </div>
      <div className="row">
        <Btn label={live ? t("Watch so far") : t("Watch")} kind="sm primary" icon={Play}
          onClick={() => viewer.open(live ? "/live/" + g.id + "/view" : "/replay/" + g.id + "/view")} />
        {live ? null : <Btn label={t("Download")} kind="sm ghost" icon={Download} iconOnly onClick={() => void attempt(() => downloadReplay(g.id))} />}
      </div>
    </div>
  );
}
