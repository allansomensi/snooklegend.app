"use client";

import { Bell, Pin, ShieldCheck, SquareMousePointer } from "lucide-react";
import { useState } from "react";
import { msg } from "@/admin/i18n";
import { PREVIEW_LANGS, pinnedForGood } from "@/admin/lib/inbox";
import type { InboxAction, Preview, PreviewLang } from "@/admin/lib/types";
import { useLocale } from "./providers/locale";
import { Badge, Segmented } from "./ui/bits";
import "@/admin/styles/ops.css";

/** The inbox's filters, in words. */
export const CATEGORIES: Record<string, string> = {
  staff: msg("From the staff"), punishment: msg("Sanctions"), gift: msg("Presents"), tournament: msg("Tournaments"),
  achievement: msg("Achievements"), game: msg("The game"),
};

/** The button a notification carries, in words. */
export function useActionWords() {
  const { t, tf } = useLocale();
  return (a?: InboxAction | null): string | null => {
    if (!a || a.to === "none") return null;
    switch (a.to) {
      case "replay": return tf("Watch game #{id}", { id: a.match_id ?? "?" });
      case "equip": return tf("Equip now ({item})", { item: a.code || "?" });
      case "collection": return tf("The collection ({item})", { item: a.code || "?" });
      case "tournament": return t("Join the tournament");
      case "profile": return tf("{name}'s profile", { name: a.username || "?" });
      case "shop": return a.code ? tf("The shop ({item})", { item: a.code }) : t("The shop");
      case "auctions": return t("The auctions");
      case "vip": return "VIP";
      default: return a.to;
    }
  };
}

const LANG_NAMES: Record<PreviewLang, string> = { pt: "Português", en: "English", es: "Español" };

/** The portal's language as the game's ("pt-BR" → "pt"). */
const gameLang = (lang: string): PreviewLang => (lang.startsWith("pt") ? "pt" : lang.startsWith("es") ? "es" : "en");

/**
 * What the player will see in their inbox, worded as the game words it in
 * each of its languages (the staff's own text comes through as written):
 * its title and text, whether it asks to confirm reading it, how long it
 * stays pinned, and its button. With `names`, both players' (annul, end).
 */
export function NotificationPreview({ preview, names }: { preview: Preview; names?: [string, string] }) {
  const { t, tf, lang } = useLocale();
  const [shown, setShown] = useState<PreviewLang>(gameLang(lang));
  const both = preview.players && preview.players.length === 2 ? preview.players : null;
  return (
    <section className="notif-preview" aria-label={t("What the player will see")} aria-live="polite">
      <div className="row between">
        <span className="np-label">{both ? t("What each player will see") : t("What the player will see")}</span>
        <Segmented<PreviewLang> name={t("Language")} value={shown} onChange={setShown} options={PREVIEW_LANGS.map((l) => [l, LANG_NAMES[l]])} />
      </div>
      {both ? (
        <div className="np-pair">
          {both.map((p, k) => (
            <div key={k} className="stack">
              {/* Each is told about the other: seat 0's names seat 1 as the opponent. */}
              <span className="faint">{tf("To {name}", { name: both[1 - k].notification.opponent || names?.[k] || tf("Player {n}", { n: k + 1 }) })}</span>
              <InboxCard p={p} lang={shown} />
            </div>
          ))}
        </div>
      ) : (
        <InboxCard p={preview} lang={shown} />
      )}
    </section>
  );
}

function InboxCard({ p, lang }: { p: Preview; lang: PreviewLang }) {
  const { t, tf, fmtDate } = useLocale();
  const actionWords = useActionWords();
  const n = p.notification;
  const r = p.rendered[lang];
  const button = actionWords(n.action);
  const pinned = n.pinned_until ? (pinnedForGood(n.pinned_until) ? t("Pinned until taken down") : tf("Pinned until {when}", { when: fmtDate(n.pinned_until) })) : null;
  return (
    <div className={"inbox-card" + (n.important ? " important" : "")}>
      <div className="ic-head">
        <Bell className="icon" aria-hidden />
        <b className="grow">{r.title}</b>
        <Badge>{t(CATEGORIES[p.category] || p.category)}</Badge>
      </div>
      {r.body ? <p className="ic-body">{r.body}</p> : null}
      <div className="badges">
        {n.important ? <Badge kind="warning" icon={ShieldCheck}>{t("They must confirm reading it")}</Badge> : null}
        {pinned ? <Badge kind="info" icon={Pin}>{pinned}</Badge> : null}
        {button ? <Badge kind="accent" icon={SquareMousePointer}>{tf("Button: {action}", { action: button })}</Badge> : null}
        {n.from ? <Badge>{tf("Signed {name}", { name: n.from })}</Badge> : null}
      </div>
    </div>
  );
}
