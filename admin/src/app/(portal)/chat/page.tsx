"use client";

import { EyeOff, MessageSquare, MicOff, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePlayerActions } from "@/components/player-dialogs";
import { useRefresh } from "@/components/providers";
import { useDialogs } from "@/components/providers/dialogs";
import { useLocale } from "@/components/providers/locale";
import { useToasts } from "@/components/providers/toasts";
import { Badge, Btn, Card, Empty, PageHead, Updated, playerHref, useBusy } from "@/components/ui/bits";
import { Loaded, updatedAt } from "@/components/ui/loaded";
import { api, seg } from "@/lib/api";
import { useApi, useDebouncedParam, useIsAdmin, useQueryParams } from "@/lib/hooks";
import type { ChatLine } from "@/lib/types";
import "@/styles/moderation.css";

export default function ChatPage() {
  const { t } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const [clearing, run] = useBusy();
  const { get, set } = useQueryParams();
  const showDeleted = get("deleted") !== "0";
  const [who, setWho] = useDebouncedParam("q");
  const term = get("q").toLowerCase();
  const q = useApi<{ lines: ChatLine[] }>("/chat", { refetchInterval: 10000 });

  const clear = async () => {
    const ok = await dialogs.confirm({
      title: t("Clear the lounge chat for everyone?"),
      text: t("Every line disappears from the players' screens (the staff keep them for reports)."),
      confirm: t("Clear the chat"),
    });
    if (ok && (await run(() => attempt(() => api("/chat/clear", { method: "POST" }), t("The chat was cleared."))))) void refresh();
  };

  return (
    <div>
      <PageHead title={t("Lounge chat")} sub={t("The latest lines, newest first · refreshes every 10 seconds")}>
        <Updated at={updatedAt(q)} live onRefresh={() => void q.refetch()} />
        {admin ? <Btn label={t("Clear the chat")} kind="danger-soft" icon={Trash2} busy={clearing} onClick={() => void clear()} /> : null}
      </PageHead>
      <div className="toolbar">
        <input className="input wide" type="search" placeholder={t("Name or words")} aria-label={t("Search the chat")} value={who} onChange={(e) => setWho(e.target.value)} />
        <label className="check">
          <input type="checkbox" checked={showDeleted} onChange={(e) => set({ deleted: e.target.checked ? null : "0" })} />
          {t("Show deleted lines")}
        </label>
      </div>
      <Loaded queries={[q]}>
        {(d) => {
          const lines = d.lines
            .slice()
            .reverse()
            .filter((l) => (showDeleted || !l.deleted) && (!term || (l.from || "").toLowerCase().includes(term) || (l.text || "").toLowerCase().includes(term)));
          return (
            <Card>
              {lines.length ? (
                <div className="chat-log" role="log" aria-label={t("Lounge chat")}>
                  {lines.map((l) => <Line key={l.id} l={l} />)}
                </div>
              ) : (
                <Empty icon={MessageSquare} title={t("Nothing said yet")} text={term ? t("No line matches.") : t("The lounge chat is quiet.")} />
              )}
            </Card>
          );
        }}
      </Loaded>
    </div>
  );
}

function Line({ l }: { l: ChatLine }) {
  const { t, fmtClock, fmtDate } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const actions = usePlayerActions();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const player = l.kind === "player";
  const person = { username: l.from, online: true };
  const DELETED: Record<string, string> = { author: t("Deleted by the author"), staff: t("Deleted by the staff"), removed: t("Removed without a trace") };

  const del = async (silent: boolean) => {
    const ok = await dialogs.confirm({
      title: silent ? t("Remove this line without a trace?") : t("Delete this line?"),
      text: silent ? t("It disappears for everyone, with no sign it was there.") : t("Players see that the staff deleted it."),
      confirm: silent ? t("Remove") : t("Delete"),
      details: (
        <div className="preview-box">
          <b>{l.from}: </b>
          {l.text}
        </div>
      ),
    });
    if (ok && (await attempt(() => api("/chat/" + seg(l.id) + "/delete", { method: "POST", body: { silent } }), silent ? t("Line removed.") : t("Line deleted.")))) {
      void refresh();
    }
  };

  return (
    <div className={"chat-line " + (l.kind || "") + (l.deleted ? " deleted" : "")}>
      <span className="time" title={fmtDate(l.at)}>{fmtClock(l.at)}</span>
      <div className="msg">
        {player ? (
          <Link className={"from" + (l.admin ? " admin" : "")} href={playerHref(l.from)}>{l.from}</Link>
        ) : (
          <b className="from">{l.from}</b>
        )}
        <span className="text">{l.text}</span>
        {l.deleted ? (
          <span>
            {" "}
            <Badge kind={l.deleted === "removed" ? "danger" : "warning"}>{DELETED[l.deleted] || l.deleted}</Badge>
          </span>
        ) : null}
      </div>
      {player ? (
        <div className="line-actions">
          {!l.deleted ? <Btn label={t("Delete")} kind="sm ghost" icon={Trash2} iconOnly onClick={() => void del(false)} /> : null}
          {admin && l.deleted !== "removed" ? <Btn label={t("Remove without a trace")} kind="sm ghost" icon={EyeOff} iconOnly onClick={() => void del(true)} /> : null}
          <Btn label={t("Warn")} kind="sm ghost" icon={TriangleAlert} iconOnly onClick={() => actions.note(person, "warning", () => {})} />
          <Btn label={t("Mute")} kind="sm ghost" icon={MicOff} iconOnly onClick={() => actions.mute(person, () => {})} />
        </div>
      ) : (
        <span />
      )}
    </div>
  );
}
