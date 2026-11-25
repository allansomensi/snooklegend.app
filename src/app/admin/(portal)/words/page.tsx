"use client";

import { useQuery } from "@tanstack/react-query";
import { Ban, Plus, ShieldAlert, Trash2, WholeWord } from "lucide-react";
import { useId, useState } from "react";
import { useRefresh } from "@/admin/components/providers";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { AlertBox, Badge, Btn, Card, CardHead, DataTable, Empty, PageHead, PersonLink, Segmented, Spinner, TimeAgo, Updated, useBusy } from "@/admin/components/ui/bits";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { msg } from "@/admin/i18n";
import { api } from "@/admin/lib/api";
import { charCount } from "@/admin/lib/format";
import { useApi, useDebounced, useDebouncedParam, useQueryParams } from "@/admin/lib/hooks";
import type { BannedWord, WordCheck } from "@/admin/lib/types";
import "@/admin/styles/ops.css";

/** The languages of the starting list, and "every language". */
const LANGS: [string, string][] = [["pt", msg("Portuguese")], ["en", msg("English")], ["es", msg("Spanish")], ["*", msg("Every language")]];

export default function WordsPage() {
  const { t } = useLocale();
  const q = useApi<{ words: BannedWord[]; max_word: number }>("/words");
  return (
    <div>
      <PageHead title={t("Banned words")} sub={t("Refused in the chats, status messages, notes, presents' messages and new usernames")}>
        <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
      </PageHead>
      <Loaded queries={[q]}>{(d) => <Words words={d.words} max={d.max_word} />}</Loaded>
    </div>
  );
}

function useLangName() {
  const { t } = useLocale();
  return (code: string) => {
    const known = LANGS.find(([c]) => c === code);
    return known ? t(known[1]) : code;
  };
}

function Words({ words, max }: { words: BannedWord[]; max: number }) {
  const { t, tn, fmtNum } = useLocale();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const langName = useLangName();
  const { get, set } = useQueryParams();
  const [search, setSearch] = useDebouncedParam("q", 200);
  const lang = get("lang", "all");
  const term = get("q").toLowerCase();
  const langs = [...new Set([...LANGS.map(([c]) => c), ...words.map((w) => w.lang)])];
  const list = words
    .filter((w) => (lang === "all" || w.lang === lang) && (!term || w.word.includes(term)))
    .sort((a, b) => a.lang.localeCompare(b.lang) || a.word.localeCompare(b.word));
  const remove = async (w: BannedWord) => {
    const ok = await dialogs.confirm({
      title: t("Take this word off the list?"),
      text: t("Players can write it again at once."),
      confirm: t("Remove"),
      tone: "warning",
      details: <div className="preview-box"><b>{w.word}</b> · {langName(w.lang)}</div>,
    });
    if (ok && (await attempt(() => api("/words/remove", { method: "POST", body: { word: w.word, lang: w.lang } }), t("Word removed.")))) void refresh();
  };
  return (
    <div className="grid-aside">
      <Card>
        <CardHead title={t("The list")} sub={tn(words.length, "{n} word or phrase", "{n} words or phrases")} />
        <div className="card-body toolbar-in row">
          <Segmented<string> name={t("Language")} value={lang} onChange={(v) => set({ lang: v === "all" ? null : v })}
            options={[["all", t("All"), words.length], ...langs.map((c) => [c, langName(c), words.filter((w) => w.lang === c).length] as [string, string, number])]} />
          <input className="input" type="search" placeholder={t("Find a word")} aria-label={t("Find a word")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {list.length ? (
          <DataTable headers={[t("Word or phrase"), t("Language"), t("Added by"), t("When"), ""]}>
            {list.map((w) => (
              <tr key={w.lang + ":" + w.word}>
                <td><b className="mono">{w.word}</b></td>
                <td><Badge kind={w.lang === "*" ? "accent" : "info"}>{langName(w.lang)}</Badge></td>
                <td>{w.added_by ? <PersonLink name={w.added_by} /> : <span className="faint">{t("the starting list")}</span>}</td>
                <td className="nowrap">{w.added_at ? <TimeAgo at={w.added_at} /> : "—"}</td>
                <td className="actions-cell"><Btn label={t("Remove")} kind="sm ghost" icon={Trash2} iconOnly onClick={() => void remove(w)} /></td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty icon={WholeWord} title={term ? t("No word matches") : t("No word in this language")} />
        )}
        <div className="pager"><span>{fmtNum(list.length)} / {fmtNum(words.length)}</span></div>
      </Card>
      <div className="stack">
        <CheckBox />
        <AddWord max={max} defaultLang={lang === "all" ? "pt" : lang} />
        <Card>
          <CardHead title={t("How matching works")} />
          <div className="card-body stack hint">
            <span>{t("By whole words, so innocent words that contain one are not refused.")}</span>
            <span>{t("It sees through case, accents, repeated letters, spaced or dotted letters (p.u.t.a) and leetspeak (Z0NK).")}</span>
            <span>{t("Words glued together get through: list those forms too.")}</span>
            <span>{t("Every list applies to everyone: the server doesn't know a line's language.")}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

/** "Would this message be refused?" as you type. */
function CheckBox() {
  const { t, tf } = useLocale();
  const langName = useLangName();
  const id = useId();
  const [text, setText] = useState("");
  const term = useDebounced(text.trim(), 300);
  const check = useQuery({
    queryKey: ["/words/preview", term],
    queryFn: ({ signal }) => api<WordCheck>("/words/preview", { method: "POST", body: { text: term }, signal }),
    enabled: !!term,
    staleTime: 30000,
  });
  const r = term && term === text.trim() ? check.data : undefined;
  return (
    <Card>
      <CardHead title={t("Would this message be refused?")} />
      <div className="card-body stack">
        <textarea id={id} className="textarea" rows={3} aria-label={t("A message to try")} placeholder={t("Type a message as a player would")} value={text}
          onChange={(e) => setText(e.target.value)} />
        <div aria-live="polite">
          {!text.trim() ? (
            <span className="hint">{t("Nothing is sent to anyone: the server only checks it.")}</span>
          ) : !r ? (
            <span className="row muted"><Spinner />{t("Checking…")}</span>
          ) : r.blocked ? (
            <AlertBox tone="danger" title={tf("Refused: “{word}”", { word: r.word || "?" })} text={tf("On the list of {lang}.", { lang: langName(r.lang || "*") })} />
          ) : (
            <AlertBox tone="success" title={t("It gets through")} />
          )}
        </div>
        {r && r.tokens.length ? (
          <div>
            <div className="hint">{t("The words as they are matched")}</div>
            <div className="item-chips">
              {r.tokens.map((tok, k) => (
                <span key={k} className={"item-chip plain" + (r.word && r.word.split(" ").includes(tok) ? " hit" : "")}>
                  {r.word && r.word.split(" ").includes(tok) ? <Ban className="icon" aria-hidden /> : null}
                  {tok}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function AddWord({ max, defaultLang }: { max: number; defaultLang: string }) {
  const { t, fmtNum } = useLocale();
  const { toast } = useToasts();
  const refresh = useRefresh();
  const id = useId();
  const [word, setWord] = useState("");
  const [lang, setLang] = useState(defaultLang);
  const [other, setOther] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, run] = useBusy();
  const code = lang === "other" ? other.trim() : lang;
  const n = charCount(word.trim());
  const add = () =>
    run(async () => {
      setError(null);
      if (!word.trim()) return setError(t("Write the word."));
      if (n > max) return setError(t("That word is too long."));
      if (!/^(\*|[a-z]{2,3}(-[A-Za-z]{2,4})?)$/.test(code)) return setError(t("Give a language code (pt, en, es…) or *."));
      try {
        await api("/words", { method: "POST", body: { word: word.trim(), lang: code } });
        toast(t("Word added."));
        setWord("");
        void refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  return (
    <Card>
      <CardHead title={t("Add a word or a phrase")} />
      <div className="card-body stack">
        <div className="field">
          <label className="label" htmlFor={id + "-w"}>
            <span>{t("Word or phrase")}</span>
            <span className={"counter" + (n > max ? " over" : "")}>{fmtNum(n)} / {fmtNum(max)}</span>
          </label>
          <input id={id + "-w"} className={"input" + (error && !word.trim() ? " invalid" : "")} value={word} onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void add(); } }} />
        </div>
        <div className="field">
          <span className="label">{t("Language")}</span>
          <div className="chips" role="radiogroup" aria-label={t("Language")}>
            {[...LANGS, ["other", msg("Another…")] as [string, string]].map(([c, label]) => (
              <button key={c} type="button" role="radio" aria-checked={lang === c} className={"chip" + (lang === c ? " on" : "")} onClick={() => setLang(c)}>{t(label)}</button>
            ))}
          </div>
          {lang === "other" ? <input className="input" placeholder="fr, it, pt-PT…" aria-label={t("Language code")} value={other} onChange={(e) => setOther(e.target.value)} /> : null}
        </div>
        {error ? <AlertBox tone="danger" title={error} /> : null}
        <div className="row">
          <Btn label={t("Add to the list")} kind="primary" icon={Plus} busy={busy} onClick={() => void add()} />
        </div>
        <div className="hint row"><ShieldAlert className="icon" aria-hidden />{t("Players are told which word made a text be refused.")}</div>
      </div>
    </Card>
  );
}

