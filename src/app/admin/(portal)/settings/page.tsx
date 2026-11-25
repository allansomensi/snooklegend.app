"use client";

import { FileText, Gift, RotateCcw, Save, Search } from "lucide-react";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { ItemLabel, ItemPicker, fromCatalog, useCatalog } from "@/admin/components/items";
import { useRefresh } from "@/admin/components/providers";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { AlertBox, Badge, Btn, Card, CardHead, Empty, PageHead, Segmented, TimeAgo, Updated, useBusy } from "@/admin/components/ui/bits";
import { FormDialog } from "@/admin/components/ui/form-dialog";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { msg } from "@/admin/i18n";
import { api, seg } from "@/admin/lib/api";
import { charCount } from "@/admin/lib/format";
import { useApi, useDebouncedParam, useIsAdmin, useQueryParams } from "@/admin/lib/hooks";
import { checkSetting, offsetLabel, sameValue } from "@/admin/lib/ops";
import type { Setting, SettingValue } from "@/admin/lib/types";
import "@/admin/styles/ops.css";

const GROUPS: [string, string, string][] = [
  ["games", msg("Games"), msg("The shot clock and coming back after losing the connection")],
  ["lounge", msg("The lounge"), msg("The welcome message, the chat and the “looking for a game” board")],
  ["limits", msg("Limits"), msg("What one address and one connection may do")],
  ["tournaments", msg("Tournaments"), msg("How many at once, no-shows and the house's cut")],
  ["weekly_cup", msg("The weekly cup"), msg("When it is played and how")],
  ["economy", msg("Economy"), msg("Prices, the daily bonus and VIP's item of the month")],
];

/** Each setting's name and what it does, in the portal's languages (the
 * server's own words, in English, for one this portal doesn't know). */
const WORDS: Record<string, [string, string]> = {
  shot_clock_secs: [msg("Shot clock"), msg("Seconds for each shot (from the next shot clock).")],
  reconnect_grace_secs: [msg("Time to come back"), msg("Seconds a player who lost the connection has to come back before losing the game.")],
  motd: [msg("Welcome message"), msg("The message at the top of the lounge.")],
  chat_history: [msg("Chat lines kept"), msg("Lounge chat lines kept and shown to who arrives.")],
  seek_lifetime_secs: [msg("“Looking for a game” notes"), msg("Seconds a note stays on the board.")],
  max_connections_per_ip: [msg("Connections per address"), msg("Connections at once from one address (a home, a phone; IPv6 by its /64).")],
  messages_per_sec: [msg("Messages per second"), msg("Messages a second one connection may send, sustained (aiming sends about 20). New connections.")],
  message_burst: [msg("Message burst"), msg("Messages one connection may send at once. New connections.")],
  max_open_tournaments: [msg("Tournaments at once"), msg("Tournaments open at once (taking names or running).")],
  tournament_no_show_secs: [msg("No-show"), msg("Seconds a tournament player may be missing when their game is ready before losing it.")],
  tournament_house_cut_percent: [msg("The house's cut"), msg("Percent of the entry fees the house keeps (coins that leave the economy); the rest is prizes. Tournaments opened from now on.")],
  cup_enabled: [msg("Weekly cup on"), msg("The server organises the weekly cup.")],
  cup_name: [msg("Name"), msg("The cup's name (“Saturday Cup”).")],
  cup_weekday: [msg("Day"), msg("The day of the week it is played.")],
  cup_time: [msg("Time"), msg("When it starts, in the time zone below.")],
  cup_utc_offset_minutes: [msg("Time zone"), msg("The local time's offset from UTC, in minutes (Brasília: −180).")],
  cup_rules: [msg("Rules"), msg("The rules it is played under.")],
  cup_format: [msg("Format"), msg("Arena (points until time is up) or knockout.")],
  cup_minutes: [msg("Arena length"), msg("How long an arena lasts, in minutes.")],
  cup_size: [msg("Knockout seats"), msg("A knockout's seats.")],
  cup_entry_fee: [msg("Entry fee"), msg("Coins to enter (0: free).")],
  cup_house_prize: [msg("Prize from the house"), msg("Coins the house adds to the prizes.")],
  name_change_price: [msg("Username change price"), msg("Coins a username change costs once the free ones are used (0: no more changes).")],
  daily_bonus_base: [msg("Daily bonus, first day"), msg("The daily bonus's coins on the first day.")],
  daily_bonus_step: [msg("Daily bonus, each day more"), msg("Coins more each day in a row (the streak ends on a day missed).")],
  daily_streak_days: [msg("Daily bonus, top day"), msg("The day of the streak whose bonus is the highest (it stays there after).")],
  vip_month_item: [msg("VIP's item of the month"), msg("Instead of the catalogue's vip_month_YYYY_MM (empty: the catalogue's).")],
};

const SOURCES: Record<string, [string, string]> = {
  default: [msg("Built in"), ""],
  env: [msg("Environment"), "info"],
  portal: [msg("Set here"), "accent"],
};

export default function SettingsPage() {
  const { t } = useLocale();
  const q = useApi<{ settings: Setting[]; now: number }>("/settings");
  return (
    <Loaded queries={[q]}>
      {(d) => (
        <div>
          <PageHead title={t("Live settings")} sub={t("Applied at once, without a restart · a value set here wins over the environment until it is reset")}>
            <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
            <Link className="btn" href={"/admin/audit?action=setting"}>
              <FileText className="icon" aria-hidden />
              {t("Changes in the audit log")}
            </Link>
          </PageHead>
          <SettingsView settings={d.settings} />
        </div>
      )}
    </Loaded>
  );
}

function SettingsView({ settings }: { settings: Setting[] }) {
  const { t } = useLocale();
  const admin = useIsAdmin();
  const { get, set } = useQueryParams();
  const [search, setSearch] = useDebouncedParam("q", 200);
  const term = get("q").toLowerCase();
  const changedOnly = get("only") === "changed";
  const words = (s: Setting) => WORDS[s.key] ? [t(WORDS[s.key][0]), t(WORDS[s.key][1])] : [s.key, s.description];
  const shown = settings.filter((s) => {
    if (changedOnly && s.source === "default") return false;
    if (!term) return true;
    const [name, text] = words(s);
    return (s.key + " " + name + " " + text).toLowerCase().includes(term);
  });
  const groups = [...GROUPS.map((g) => g[0]), ...new Set(settings.map((s) => s.group).filter((g) => !GROUPS.some((x) => x[0] === g)))];
  return (
    <div className="stack">
      {admin ? null : <AlertBox tone="info" title={t("Only administrators change the settings")} text={t("You see them as they are now.")} />}
      <div className="toolbar">
        <span className="picker-search grow-0">
          <Search className="icon" aria-hidden />
          <input className="input" type="search" placeholder={t("Find a setting")} aria-label={t("Find a setting")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </span>
        <Segmented<string> name={t("Filter")} value={changedOnly ? "changed" : "all"} onChange={(v) => set({ only: v === "all" ? null : v })}
          options={[["all", t("All"), settings.length], ["changed", t("Not the built-in value"), settings.filter((s) => s.source !== "default").length]]} />
        <nav className="chips" aria-label={t("Groups")}>
          {groups.filter((g) => shown.some((s) => s.group === g)).map((g) => (
            <a key={g} className="chip" href={"#group-" + g}>{t(GROUPS.find((x) => x[0] === g)?.[1] || g)}</a>
          ))}
        </nav>
      </div>
      {!shown.length ? <Card><Empty icon={Search} title={t("No setting matches")} /></Card> : null}
      {groups.map((g) => {
        const list = shown.filter((s) => s.group === g);
        if (!list.length) return null;
        const meta = GROUPS.find((x) => x[0] === g);
        return (
          <Card key={g}>
            <div id={"group-" + g} className="anchor" />
            <CardHead title={t(meta?.[1] || g)} sub={meta ? t(meta[2]) : null} />
            <div className="settings-list">
              {list.map((s) => {
                const [name, text] = words(s);
                return <SettingRow key={s.key} s={s} name={name} text={text} />;
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

/** A setting: its control, its value now and its default, where that comes
 * from, and Save / Reset. */
function SettingRow({ s, name, text }: { s: Setting; name: string; text: string }) {
  const { t, tf, lang, fmtNum, fmtDuration } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const { toast } = useToasts();
  const refresh = useRefresh();
  const uid = useId();
  const [draft, setDraft] = useState<string | boolean>(s.type === "bool" ? !!s.value : String(s.value ?? ""));
  const [base, setBase] = useState(s.value);
  const [error, setError] = useState<string | null>(null);
  const [busy, run] = useBusy();
  // The server's value changed (a save, someone else): the field follows it.
  if (!sameValue(base, s.value)) {
    setBase(s.value);
    setDraft(s.type === "bool" ? !!s.value : String(s.value ?? ""));
  }
  const checked = checkSetting(s, draft);
  const dirty = "value" in checked ? !sameValue(checked.value, s.value) : true;
  const r = s.range || {};
  const weekday = (d: number) => new Intl.DateTimeFormat(lang, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 10, 1 + d)));
  const problem = (e: string) =>
    e === "range" ? tf("From {min} to {max}.", { min: fmtNum(r.min ?? 0), max: fmtNum(r.max ?? 0) })
      : e === "number" ? t("A whole number.")
        : e === "time" ? t("A time is needed (HH:MM).")
          : e === "length" ? tf("{n} characters at most.", { n: fmtNum(r.max_length ?? 0) })
            : t("Choose one of the options.");
  /** What a value means, in words (seconds as a length, a day's name…). */
  const meaning = (v: SettingValue | null | undefined): string | null => {
    if (v === null || v === undefined || v === "") return null;
    if (s.key.endsWith("_secs") && typeof v === "number") return fmtDuration(v);
    if (s.key === "cup_weekday") return weekday(Number(v));
    if (s.key === "cup_utc_offset_minutes") return offsetLabel(Number(v));
    if (s.key === "cup_minutes") return fmtDuration(Number(v) * 60);
    if (s.type === "bool") return v ? t("On") : t("Off");
    if (s.type === "choice") return choiceWord(String(v));
    return null;
  };
  const choiceWord = (v: string) => ({ brazilian: t("Brazilian rules"), official: t("Official rules"), arena: t("Arena"), knockout: t("Knockout") } as Record<string, string>)[v] || v;
  const show = (v: SettingValue | null | undefined) => {
    const m = meaning(v);
    if (s.type === "bool" || s.type === "choice") return m || String(v ?? "");
    const raw = v === "" ? t("empty") : typeof v === "number" ? fmtNum(v) : String(v);
    return m && m !== raw ? raw + " (" + m + ")" : m || raw;
  };

  const save = () =>
    run(async () => {
      setError(null);
      if (!("value" in checked)) return setError(problem(checked.error));
      try {
        await api("/settings/" + seg(s.key), { method: "POST", body: { value: checked.value } });
        toast(tf("“{name}” saved.", { name }));
        void refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  const reset = async () => {
    const ok = await dialogs.confirm({
      title: tf("Reset “{name}”?", { name }),
      text: tf("Back to {value}, from the server's environment or built in.", { value: show(s.default) }),
      confirm: t("Reset"),
      tone: "warning",
      icon: RotateCcw,
    });
    if (!ok) return;
    await run(async () => {
      try {
        await api("/settings/" + seg(s.key) + "/reset", { method: "POST" });
        toast(tf("“{name}” is back to its default.", { name }));
        void refresh();
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
      }
    });
  };

  let control: ReactNode;
  const disabled = !admin || busy;
  if (s.type === "bool") {
    control = (
      <label className="switch">
        <input type="checkbox" role="switch" checked={!!draft} disabled={disabled} onChange={(e) => setDraft(e.target.checked)} />
        <span>{draft ? t("On") : t("Off")}</span>
      </label>
    );
  } else if (s.type === "choice") {
    control = (
      <Segmented<string> name={name} value={String(draft)} onChange={(v) => admin && setDraft(v)} options={(r.options || []).map((o) => [o, choiceWord(o)])} />
    );
  } else if (s.key === "cup_weekday") {
    control = (
      <select id={uid} className="select" disabled={disabled} value={String(draft)} onChange={(e) => setDraft(e.target.value)}>
        {WEEKDAYS.map((d) => <option key={d} value={d}>{weekday(d)}</option>)}
      </select>
    );
  } else if (s.type === "time") {
    control = <input id={uid} className="input" type="time" disabled={disabled} value={String(draft)} onChange={(e) => setDraft(e.target.value)} />;
  } else if (s.type === "item") {
    control = <ItemSetting value={String(draft)} onChange={setDraft} disabled={disabled} label={name} />;
  } else if (s.type === "text") {
    const n = charCount(String(draft));
    control = (
      <div className="stack-tight">
        {(r.max_length || 0) > 60 ? (
          <textarea id={uid} className="textarea" rows={2} disabled={disabled} value={String(draft)} onChange={(e) => setDraft(e.target.value)} />
        ) : (
          <input id={uid} className="input" disabled={disabled} value={String(draft)} onChange={(e) => setDraft(e.target.value)} />
        )}
        {r.max_length ? <span className={"counter" + (n > r.max_length ? " over" : "")}>{fmtNum(n)} / {fmtNum(r.max_length)}</span> : null}
      </div>
    );
  } else {
    control = (
      <input id={uid} className={"input num" + ("error" in checked ? " invalid" : "")} type="number" disabled={disabled} min={r.min} max={r.max} step={1}
        value={String(draft)} onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && dirty) { e.preventDefault(); void save(); } }} />
    );
  }
  const [srcLabel, srcTone] = SOURCES[s.source] || [s.source, ""];
  const draftMeaning = "value" in checked ? meaning(checked.value) : null;
  return (
    <div className={"setting-row" + (dirty ? " dirty" : "")}>
      <div className="sr-about">
        <label className="sr-name" htmlFor={uid}>{name}</label>
        <span className="sr-text">{text}</span>
        <span className="row sr-meta">
          <Badge kind={srcTone} title={s.source === "env" ? t("From an environment variable of the server") : undefined}>{t(srcLabel)}</Badge>
          <span className="faint mono">{s.key}</span>
          {s.type === "int" && r.min !== undefined ? <span className="faint">{tf("{min} to {max}", { min: fmtNum(r.min), max: fmtNum(r.max ?? 0) })}</span> : null}
          <span className="faint">{tf("default {value}", { value: show(s.default) })}</span>
          {s.source === "portal" && s.updated_by ? (
            <span className="faint">{tf("by {name}", { name: s.updated_by })} · <TimeAgo at={s.updated_at} /></span>
          ) : null}
        </span>
      </div>
      <div className="sr-control">
        {control}
        {draftMeaning && s.type !== "bool" && s.type !== "choice" && s.key !== "cup_weekday" ? <span className="hint">{draftMeaning}</span> : null}
        {"error" in checked && dirty ? <span className="error-text">{problem(checked.error)}</span> : null}
        {error ? <span className="error-text" role="alert">{error}</span> : null}
        {admin ? (
          <span className="row">
            {dirty ? (
              <>
                <Btn label={t("Save")} kind="sm primary" icon={Save} busy={busy} onClick={() => void save()} />
                <Btn label={t("Undo")} kind="sm ghost" onClick={() => { setDraft(s.type === "bool" ? !!s.value : String(s.value ?? "")); setError(null); }} />
              </>
            ) : null}
            {s.source === "portal" && !dirty ? <Btn label={t("Reset")} kind="sm ghost" icon={RotateCcw} busy={busy} onClick={() => void reset()} /> : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** VIP's item of the month: one only won (or the catalogue's). */
function ItemSetting({ value, onChange, disabled, label }: { value: string; onChange: (v: string) => void; disabled: boolean; label: string }) {
  const { t } = useLocale();
  const dialogs = useDialogs();
  const catalog = useCatalog();
  const item = catalog.data?.catalog.find((i) => i.code === value);
  const choose = () => {
    const items = (catalog.data?.catalog || []).filter((i) => i.how === "earned" || i.how === "coins").map(fromCatalog);
    dialogs.open((close) => (
      <FormDialog title={label} icon={Gift} wide onClose={close}
        fields={[{ name: "item", type: "custom", value, render: (v, set) => <ItemPicker label={label} items={items} value={String(v)} onChange={(x) => set(String(x))} /> }]}
        submit={t("Choose")}
        onSubmit={async (v) => onChange(String(v.item))} />
    ));
  };
  return (
    <div className="row">
      {value ? <ItemLabel code={value} name={item?.name} rarity={item?.rarity} /> : <span className="faint">{t("The catalogue's")}</span>}
      {disabled ? null : (
        <>
          <Btn label={t("Choose…")} kind="sm" icon={Gift} disabled={!catalog.data} onClick={choose} />
          {value ? <Btn label={t("Use the catalogue's")} kind="sm ghost" onClick={() => onChange("")} /> : null}
        </>
      )}
    </div>
  );
}

