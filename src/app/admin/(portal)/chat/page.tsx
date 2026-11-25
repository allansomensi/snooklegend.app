"use client";

import { EyeOff, MessageSquare, MicOff, Pin, PinOff, Trash2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePlayerActions } from "@/admin/components/player-dialogs";
import { useRefresh } from "@/admin/components/providers";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { Badge, Btn, Card, Empty, PageHead, Updated, playerHref, useBusy } from "@/admin/components/ui/bits";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { api, seg } from "@/admin/lib/api";
import { useApi, useDebouncedParam, useIsAdmin, useQueryParams } from "@/admin/lib/hooks";
import type { ChatLine } from "@/admin/lib/types";
import "@/admin/styles/moderation.css";
import "@/admin/styles/ops.css";

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
  const pinned = useApi<{ line: ChatLine | null }>("/chat/pinned", { refetchInterval: 10000 });

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
        <Updated at={updatedAt(q, pinned)} live onRefresh={() => { void q.refetch(); void pinned.refetch(); }} />
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
          const pin = pinned.data?.line || null;
          return (
            <Card>
              <PinnedLine line={pin} />
              {lines.length ? (
                <div className="chat-log" role="log" aria-label={t("Lounge chat")}>
                  {lines.map((l) => <Line key={l.id} l={l} pinned={pin?.id === l.id} />)}
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

/** A line's text with the players it names ("@ana") lit, each a link. */
function LineText({ l }: { l: ChatLine }) {
  const names = new Map((l.mentions || []).map((n) => [n.toLowerCase(), n]));
  if (!names.size) return <span className="text">{l.text}</span>;
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of l.text.matchAll(/@([A-Za-z0-9_]{3,16})/g)) {
    const real = names.get(m[1].toLowerCase());
    if (!real) continue;
    parts.push(l.text.slice(last, m.index));
    parts.push(<Link key={m.index} className="mention" href={playerHref(real)}>@{m[1]}</Link>);
    last = m.index + m[0].length;
  }
  parts.push(l.text.slice(last));
  return <span className="text">{parts}</span>;
}

/** The line pinned at the top of the lounge's chat, for everyone. */
function PinnedLine({ line }: { line: ChatLine | null }) {
  const { t, fmtDate } = useLocale();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const dialogs = useDialogs();
  const [busy, run] = useBusy();
  if (!line) return null;
  const unpin = async () => {
    const ok = await dialogs.confirm({ title: t("Take the pinned line down?"), text: t("It stays in the chat, no longer at the top."), confirm: t("Unpin"), tone: "warning" });
    if (ok && (await run(() => attempt(() => api("/chat/unpin", { method: "POST" }), t("Line unpinned."))))) void refresh();
  };
  return (
    <div className="pinned-line" role="note" aria-label={t("Pinned line")}>
      <Pin className="icon" aria-hidden />
      <div className="grow">
        <div className="hint">{t("Pinned at the top of the lounge's chat for everyone")} · {fmtDate(line.at)}</div>
        <b>{line.from}: </b><LineText l={line} />
      </div>
      <Btn label={t("Unpin")} kind="sm" icon={PinOff} busy={busy} onClick={() => void unpin()} />
    </div>
  );
}

function Line({ l, pinned }: { l: ChatLine; pinned: boolean }) {
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

  const pin = async () => {
    const ok = await dialogs.confirm({
      title: t("Pin this line at the top of the chat?"),
      text: t("Every player in the lounge sees it above the chat until it is unpinned or deleted. It replaces the line pinned before."),
      confirm: t("Pin"),
      tone: "info",
      icon: Pin,
      details: <div className="preview-box"><b>{l.from}: </b>{l.text}</div>,
    });
    if (ok && (await attempt(() => api("/chat/" + seg(l.id) + "/pin", { method: "POST" }), t("Line pinned.")))) void refresh();
  };

  return (
    <div className={"chat-line " + (l.kind || "") + (l.deleted ? " deleted" : "") + (pinned ? " pinned" : "")}>
      <span className="time" title={fmtDate(l.at)}>{fmtClock(l.at)}</span>
      <div className="msg">
        {player ? (
          <Link className={"from" + (l.admin ? " admin" : "")} href={playerHref(l.from)}>{l.from}</Link>
        ) : (
          <b className="from">{l.from}</b>
        )}
        <LineText l={l} />
        {pinned ? <span> <Badge kind="accent" icon={Pin}>{t("Pinned")}</Badge></span> : null}
        {l.deleted ? (
          <span>
            {" "}
            <Badge kind={l.deleted === "removed" ? "danger" : "warning"}>{DELETED[l.deleted] || l.deleted}</Badge>
          </span>
        ) : null}
      </div>
      {player ? (
        <div className="line-actions">
          {!l.deleted && !pinned ? <Btn label={t("Pin at the top")} kind="sm ghost" icon={Pin} iconOnly onClick={() => void pin()} /> : null}
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
