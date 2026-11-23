"use client";

import { Megaphone, Pin, Send, Trash2, Users } from "lucide-react";
import { useId, useState } from "react";
import { useRefresh } from "@/admin/components/providers";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import {
  Badge, Btn, Card, CardHead, DataTable, Empty, PageHead, PersonLink, Segmented, TimeAgo, useBusy,
} from "@/admin/components/ui/bits";
import { Loaded } from "@/admin/components/ui/loaded";
import { msg } from "@/admin/i18n";
import { api, seg } from "@/admin/lib/api";
import { charCount, oneLine } from "@/admin/lib/format";
import { useApi, useIsAdmin } from "@/admin/lib/hooks";
import type { AuditEntry, BoardNote, Overview, Seek } from "@/admin/lib/types";
import "@/admin/styles/moderation.css";

type Kind = BoardNote["kind"];
const NOTE_KINDS: [Kind, string][] = [["notice", msg("Notice")], ["event", msg("Event")], ["rule", msg("Rule")]];
const NOTE_BUTTONS: [string, string][] = [["", msg("No button")], ["tournaments", msg("Tournaments")], ["shop", msg("Shop")], ["vip", msg("VIP")], ["missions", msg("Missions")]];
const kindName = (k: string) => NOTE_KINDS.find(([v]) => v === k)?.[1] || k;
const buttonName = (b: string) => NOTE_BUTTONS.find(([v]) => v === b)?.[1] || b;

export default function CommunityPage() {
  const { t } = useLocale();
  const overview = useApi<Overview>("/overview");
  const board = useApi<{ notes: BoardNote[] }>("/board");
  const seeks = useApi<{ notes: Seek[] }>("/seeks", { refetchInterval: 30000 });
  const sent = useApi<{ entries: AuditEntry[] }>("/audit?action=announce");
  return (
    <div>
      <PageHead title={t("Board & announcements")} sub={t("What players read in the lounge")} />
      <div className="grid-2">
        <div className="stack">
          <Announcement />
          <Loaded queries={[sent]}>{(s) => <SentLately entries={s.entries} />}</Loaded>
          <Loaded queries={[overview]}>{(o) => <WelcomeMessage key={o.motd} motd={o.motd} />}</Loaded>
        </div>
        <div className="stack">
          <BoardForm />
          <Loaded queries={[board]}>{(b) => <BoardNotes notes={b.notes} />}</Loaded>
        </div>
      </div>
      <div className="section">
        <Loaded queries={[seeks]}>{(s) => <Seeks notes={s.notes} />}</Loaded>
      </div>
    </div>
  );
}

function Counter({ n, max }: { n: number; max: number }) {
  const { fmtNum } = useLocale();
  return <span className={"counter" + (n > max ? " over" : "")}>{fmtNum(n)} / {fmtNum(max)}</span>;
}

function Announcement() {
  const { t } = useLocale();
  const id = useId();
  const dialogs = useDialogs();
  const { toast, attempt } = useToasts();
  const refresh = useRefresh();
  const [text, setText] = useState("");
  const [busy, run] = useBusy();
  const send = async () => {
    const line = oneLine(text).trim();
    if (!line) {
      toast(t("Write a message."), "error");
      document.getElementById(id)?.focus();
      return;
    }
    const ok = await dialogs.confirm({
      title: t("Send this announcement?"),
      text: t("Everyone in the lounge sees it in the chat, highlighted."),
      confirm: t("Send"),
      tone: "info",
      icon: Megaphone,
      details: (
        <div className="preview-box">
          <span className="faint">{t("Announcement")}</span>
          {line}
        </div>
      ),
    });
    if (ok && (await run(() => attempt(() => api("/announce", { method: "POST", body: { text: line } }), t("Announcement sent."))))) {
      setText("");
      void refresh();
    }
  };
  return (
    <Card>
      <CardHead title={t("Announcement")} sub={t("Shown at once in the lounge chat, highlighted")} />
      <div className="card-body stack">
        <div className="field">
          <label className="label" htmlFor={id}>
            <span>{t("Message")}</span>
            <Counter n={charCount(text)} max={200} />
          </label>
          <textarea id={id} className="textarea" rows={3} maxLength={200} placeholder={t("A message to everyone in the lounge, now")} value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }} />
        </div>
      </div>
      <div className="card-foot">
        <Btn label={t("Send to the lounge")} kind="primary" icon={Send} busy={busy} onClick={() => void send()} />
      </div>
    </Card>
  );
}

function SentLately({ entries }: { entries: AuditEntry[] }) {
  const { t, tf } = useLocale();
  return (
    <Card>
      <CardHead title={t("Sent lately")} />
      {entries.length ? (
        <div className="mini-list">
          {entries.slice(0, 8).map((e) => (
            <div key={e.id} className="mi">
              <span className="tl-dot info"><Megaphone className="icon" aria-hidden /></span>
              <div className="mi-main">
                <span>{e.details}</span>
                <span className="mi-sub">{tf("by {name}", { name: e.staff })}</span>
              </div>
              <span className="mi-side"><TimeAgo at={e.at} /></span>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon={Megaphone} title={t("No announcements yet")} />
      )}
    </Card>
  );
}

function WelcomeMessage({ motd }: { motd: string }) {
  const { t } = useLocale();
  const admin = useIsAdmin();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const [text, setText] = useState(motd);
  const [busy, run] = useBusy();
  const save = async () => {
    if (await run(() => attempt(() => api("/motd", { method: "POST", body: { text } }), t("Welcome message saved.")))) void refresh();
  };
  return (
    <Card>
      <CardHead title={t("Welcome message")} sub={t("Shown to everyone who signs in · until the server restarts")} />
      <div className="card-body">
        <input className="input" maxLength={300} aria-label={t("Welcome message")} value={text} disabled={!admin}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && admin) { e.preventDefault(); void save(); } }} />
      </div>
      {admin ? (
        <div className="card-foot">
          <Btn label={t("Save")} kind="primary" busy={busy} disabled={text === motd} onClick={() => void save()} />
        </div>
      ) : null}
    </Card>
  );
}

function BoardForm() {
  const { t, tf, tn } = useLocale();
  const id = useId();
  const { toast, attempt } = useToasts();
  const refresh = useRefresh();
  const [text, setText] = useState("");
  const [kind, setKind] = useState<Kind>("notice");
  const [button, setButton] = useState("");
  const [days, setDays] = useState("");
  const [pinned, setPinned] = useState(false);
  const [busy, run] = useBusy();
  const preview = oneLine(text);
  const put = async () => {
    const line = preview.trim();
    if (!line) {
      toast(t("Write a note."), "error");
      document.getElementById(id)?.focus();
      return;
    }
    const body = { text: line, days: days ? Number(days) : null, kind, action: button || null, pinned };
    if (await run(() => attempt(() => api("/board", { method: "POST", body }), t("On the board.")))) {
      setText("");
      setPinned(false);
      void refresh();
    }
  };
  return (
    <Card>
      <CardHead title={t("The lounge's board")} sub={t("Notes that stay up")} />
      <div className="card-body stack">
        <div className="field">
          <label className="label" htmlFor={id}>
            <span>{t("Note")}</span>
            <Counter n={charCount(text)} max={400} />
          </label>
          <textarea id={id} className="textarea" rows={3} maxLength={400} placeholder={t("A note that stays on the lounge's board: an event, a rule, news")}
            value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="row">
          <Segmented<Kind> name={t("Kind of note")} value={kind} onChange={setKind} options={NOTE_KINDS.map(([v, l]) => [v, t(l)])} />
          <select className="select" aria-label={t("Button")} value={button} onChange={(e) => setButton(e.target.value)}>
            {NOTE_BUTTONS.map(([v, l]) => (
              <option key={v} value={v}>{v ? tf("Button: {name}", { name: t(l) }) : t(l)}</option>
            ))}
          </select>
          <select className="select" aria-label={t("Up for")} value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="">{t("Until taken down")}</option>
            {[1, 3, 7, 14, 30].map((d) => (
              <option key={d} value={String(d)}>{tn(d, "{n} day", "{n} days")}</option>
            ))}
          </select>
        </div>
        <label className="check">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          {t("Pinned at the top")}
        </label>
        <div className="field">
          <div className="label">{t("Preview")}</div>
          <div className={"board-note " + kind} aria-live="polite">
            <div className="bn-meta">
              {pinned ? <Badge kind="accent" icon={Pin}>{t("Pinned")}</Badge> : null}
              <Badge>{t(kindName(kind))}</Badge>
            </div>
            <div className="bn-text">{preview || <span className="faint">{t("The note shows here as players see it.")}</span>}</div>
            {button ? <span className="btn sm bn-button">{t(buttonName(button))}</span> : null}
          </div>
        </div>
      </div>
      <div className="card-foot">
        <Btn label={t("Put on the board")} kind="primary" icon={Pin} busy={busy} onClick={() => void put()} />
      </div>
    </Card>
  );
}

function BoardNotes({ notes }: { notes: BoardNote[] }) {
  const { t, tf, tn, fmtDate } = useLocale();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const takeDown = async (n: BoardNote) => {
    const ok = await dialogs.confirm({ title: t("Take this note down?"), confirm: t("Take down"), details: <div className="preview-box">{n.text}</div> });
    if (ok && (await attempt(() => api("/board/" + seg(n.id), { method: "DELETE" }), t("Taken down.")))) void refresh();
  };
  return (
    <Card>
      <CardHead title={t("On the board now")} sub={tn(notes.length, "{n} note", "{n} notes")} />
      <div className="card-body">
        {notes.length ? (
          <div className="stack">
            {notes.map((n) => (
              <div key={n.id} className={"board-note " + n.kind}>
                <div className="bn-head">
                  <div className="bn-meta">
                    {n.pinned ? <Badge kind="accent" icon={Pin}>{t("Pinned")}</Badge> : null}
                    <Badge>{t(kindName(n.kind))}</Badge>
                    {n.action ? <Badge>{tf("Button: {name}", { name: t(buttonName(n.action)) })}</Badge> : null}
                  </div>
                  <Btn label={t("Take down")} kind="sm ghost" icon={Trash2} onClick={() => void takeDown(n)} />
                </div>
                <div className="bn-text">{n.text}</div>
                <div className="bn-meta">
                  <span>{tf("by {name}", { name: n.author || "?" })} · <TimeAgo at={n.created_at} /></span>
                  <span>· {n.expires_at ? tf("until {when}", { when: fmtDate(n.expires_at) }) : t("until taken down")}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={Pin} title={t("The board is empty")} text={t("Notes put here stay in the lounge for everyone.")} />
        )}
      </div>
    </Card>
  );
}

function Seeks({ notes }: { notes: Seek[] }) {
  const { t, tf } = useLocale();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const remove = async (n: Seek) => {
    const ok = await dialogs.confirm({ title: tf("Remove {name}'s note?", { name: n.username }), confirm: t("Remove") });
    if (ok && (await attempt(() => api("/seeks/" + seg(n.username), { method: "DELETE" }), t("Removed.")))) void refresh();
  };
  return (
    <Card>
      <CardHead title={t("Looking for a game")} sub={t("Players' notes, up while they are online")} />
      {notes.length ? (
        <DataTable headers={[t("Player"), t("Note"), t("Game"), t("Posted"), ""]}>
          {notes.map((n) => (
            <tr key={n.username}>
              <td><PersonLink name={n.username} /></td>
              <td className="wrap">{n.text || <span className="faint">{t("(no message)")}</span>}</td>
              <td>{n.rated ? <Badge kind="accent">{t("Rated")}</Badge> : <Badge>{t("Casual")}</Badge>}</td>
              <td><TimeAgo at={n.at} /></td>
              <td className="actions-cell">
                <Btn label={t("Remove")} kind="sm ghost" icon={Trash2} onClick={() => void remove(n)} />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <Empty icon={Users} title={t("Nobody is looking for a game")} />
      )}
    </Card>
  );
}
