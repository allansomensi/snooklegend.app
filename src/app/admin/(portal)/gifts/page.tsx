"use client";

import { Check, Coins, Gift, ListChecks, Lock, Search, Star, TriangleAlert, Users } from "lucide-react";
import { useId, useState } from "react";
import { ItemLabel, ItemPicker, RarityBadge, fromCatalog, useCatalog } from "@/admin/components/items";
import { GIVABLE, previewCall } from "@/admin/components/player-dialogs";
import { NotificationPreview } from "@/admin/components/preview";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { AlertBox, Badge, Btn, Card, CardHead, Empty, Kpi, PageHead, Segmented, Spinner, playerHref } from "@/admin/components/ui/bits";
import { Loaded } from "@/admin/components/ui/loaded";
import { api } from "@/admin/lib/api";
import { charCount, oneLine } from "@/admin/lib/format";
import { useIsAdmin } from "@/admin/lib/hooks";
import { splitNames } from "@/admin/lib/inbox";
import type { BatchResult, CatalogItem, Preview } from "@/admin/lib/types";
import Link from "next/link";
import "@/admin/styles/ops.css";

const MAX_PLAYERS = 500;

/** Presents from the staff to many players at once: coins, an item, days
 * of VIP, each in the player's inbox. A dry run first; then they're given. */
export default function GiftsPage() {
  const { t } = useLocale();
  const admin = useIsAdmin();
  const catalog = useCatalog();
  return (
    <div>
      <PageHead title={t("Presents to many")} sub={t("Coins, an item and days of VIP to a list of players, each told in their inbox")} />
      {admin ? (
        <Loaded queries={[catalog]}>{(e) => <GiftForm catalog={e.catalog} />}</Loaded>
      ) : (
        <Card><Empty icon={Lock} title={t("Only administrators give presents")} text={t("They change what the players own.")} /></Card>
      )}
    </div>
  );
}

interface Terms {
  usernames: string[];
  coins: number;
  item: string;
  vip_days: number;
  reason: string;
  message: string;
}

function GiftForm({ catalog }: { catalog: CatalogItem[] }) {
  const { t, tf, tn, fmtNum } = useLocale();
  const dialogs = useDialogs();
  const uid = useId();
  const [names, setNames] = useState("");
  const [coins, setCoins] = useState("");
  const [withItem, setWithItem] = useState(false);
  const [item, setItem] = useState("");
  const [vip, setVip] = useState("0");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"check" | "give" | null>(null);
  const [checked, setChecked] = useState<{ key: string; result: BatchResult; preview: Preview | null } | null>(null);
  const [given, setGiven] = useState<BatchResult | null>(null);
  const items = catalog.filter(GIVABLE).map(fromCatalog);
  const chosen = catalog.find((i) => i.code === item);
  const { names: list, repeated } = splitNames(names);
  const terms: Terms = {
    usernames: list, coins: Number(coins) || 0, item: withItem ? item : "", vip_days: Number(vip) || 0, reason: oneLine(reason).trim(), message: message.trim(),
  };
  const key = JSON.stringify(terms);
  const ready = !!checked && checked.key === key;

  const problem = (): string | null => {
    if (!list.length) return t("List the players.");
    if (list.length > MAX_PLAYERS) return t("500 players at most at a time.");
    if (coins.trim() && (!/^\d+$/.test(coins.trim()) || terms.coins > 1000000)) return t("Give 0 to 1,000,000 coins.");
    if (withItem && !item) return t("Choose the item.");
    if (!terms.coins && !terms.item && !terms.vip_days) return t("Give coins, an item or days of VIP.");
    if (!terms.reason) return t("Give a reason.");
    if (charCount(terms.reason) > 300) return tf("“{field}” is too long.", { field: t("Reason") });
    if (charCount(terms.message) > 1000) return tf("“{field}” is too long.", { field: t("Message to the players") });
    return null;
  };

  const check = async () => {
    const p = problem();
    setError(p);
    setGiven(null);
    if (p) return;
    setBusy("check");
    try {
      const [result, preview] = await Promise.all([
        api<BatchResult>("/gifts/batch", { method: "POST", body: { ...terms, dry_run: true } }),
        previewCall("/gifts/batch", { ...terms }),
      ]);
      setChecked({ key, result, preview });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };

  const give = async () => {
    if (!checked || !ready) return;
    const n = checked.result.players || 0;
    const what = [
      terms.coins ? tf("{n} coins", { n: fmtNum(terms.coins) }) : null,
      terms.item ? chosen?.name || terms.item : null,
      terms.vip_days ? tn(terms.vip_days, "{n} day of VIP", "{n} days of VIP") : null,
    ].filter(Boolean).join(" + ");
    const ok = await dialogs.confirm({
      title: tn(n, "Give the present to {n} player?", "Give the presents to {n} players?"),
      text: tf("{what}, for “{reason}”. Each is told in their inbox; it can't be undone from here.", { what, reason: terms.reason }),
      confirm: t("Give"),
      tone: "warning",
      icon: Gift,
    });
    if (!ok) return;
    setBusy("give");
    setError(null);
    try {
      const r = await api<BatchResult>("/gifts/batch", { method: "POST", body: { ...terms, dry_run: false } });
      setGiven(r);
      setChecked(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(null);
  };

  return (
    <div className="grid-aside">
      <Card>
        <CardHead title={t("The present")} sub={t("Check first: nothing is given until you confirm")} />
        <div className="card-body stack">
          <div className="field">
            <label className="label" htmlFor={uid + "-names"}>
              <span>{t("Players")}</span>
              <span className={"counter" + (list.length > MAX_PLAYERS ? " over" : "")}>{fmtNum(list.length)} / {fmtNum(MAX_PLAYERS)}</span>
            </label>
            <textarea id={uid + "-names"} className="textarea mono" rows={6} value={names} onChange={(e) => setNames(e.target.value)}
              placeholder={"ana, bob\n@caio\ndani"} spellCheck={false} />
            <div className="hint">
              {t("Paste the usernames: commas, spaces or one a line; a leading @ is fine.")}
              {repeated.length ? " " + tn(repeated.length, "{n} name given twice is counted once.", "{n} names given twice are counted once.") : null}
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label" htmlFor={uid + "-coins"}><span>{t("Coins")}</span><span className="faint">{t("optional")}</span></label>
              <input id={uid + "-coins"} className="input" type="number" min={0} max={1000000} step={100} placeholder="0" value={coins} onChange={(e) => setCoins(e.target.value)} />
            </div>
            <div className="field">
              <span className="label">{t("Days of VIP")}</span>
              <Segmented<string> name={t("Days of VIP")} value={vip} onChange={setVip} options={[["0", t("None")], ["7", "7"], ["30", "30"], ["90", "90"], ["365", "365"]]} />
            </div>
          </div>
          <div className="field">
            <label className="check">
              <input type="checkbox" checked={withItem} onChange={(e) => setWithItem(e.target.checked)} />
              {t("An item too")}
            </label>
            {withItem ? (
              <>
                <ItemPicker label={t("Item")} items={items} value={item} onChange={(v) => setItem(String(v))} height={220} />
                <div className="hint">{t("Who has it already gets the rest of the present. Items only won (event prizes) can be given too.")}</div>
              </>
            ) : null}
          </div>
          <div className="field">
            <label className="label" htmlFor={uid + "-reason"}><span>{t("Reason (the audit log; under the item in their collection)")}</span></label>
            <input id={uid + "-reason"} className="input" maxLength={600} placeholder={t("Winter Cup finalists")} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor={uid + "-msg"}>
              <span>{t("Message to the players")}<span className="faint"> · {t("optional")}</span></span>
              <span className={"counter" + (charCount(message) > 1000 ? " over" : "")}>{fmtNum(charCount(message))} / 1000</span>
            </label>
            <textarea id={uid + "-msg"} className="textarea" rows={3} placeholder={t("Thanks for playing!")} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          {error ? <AlertBox tone="danger" title={error} /> : null}
          <div className="row">
            <Btn label={t("Check (nothing is given)")} kind={ready ? "" : "primary"} icon={ListChecks} busy={busy === "check"} onClick={() => void check()} />
            <Btn label={ready && checked ? tn(checked.result.players || 0, "Give to {n} player", "Give to {n} players") : t("Give")} kind="primary" icon={Gift}
              disabled={!ready || !checked?.result.players} busy={busy === "give"} onClick={() => void give()} />
            {checked && !ready ? <span className="hint">{t("You changed something: check again.")}</span> : null}
          </div>
        </div>
      </Card>
      <div className="stack">
        {busy === "check" ? <Card><div className="card-body row muted"><Spinner />{t("Checking…")}</div></Card> : null}
        {given ? <Outcome r={given} done /> : checked ? (
          <>
            <Outcome r={checked.result} />
            {checked.preview ? <NotificationPreview preview={checked.preview} /> : null}
          </>
        ) : (
          <Card>
            <CardHead title={t("Before giving")} />
            <div className="card-body stack hint">
              <span>{t("The check lists the names nobody has and who has the item already, and shows what the players will read.")}</span>
              <span>{t("Each player gets the present in their inbox (“Equip now” for an item); the audit log keeps one entry per player and a summary.")}</span>
            </div>
          </Card>
        )}
        {chosen && withItem ? (
          <Card>
            <CardHead title={t("The item")} />
            <div className="card-body row">
              <ItemLabel code={chosen.code} name={chosen.name} rarity={chosen.rarity} />
              <RarityBadge rarity={chosen.rarity} />
              {chosen.how === "earned" ? <Badge kind="danger">{t("Only won")}</Badge> : null}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

/** What a check found, or what was given. */
function Outcome({ r, done }: { r: BatchResult; done?: boolean }) {
  const { t, tn, fmtNum } = useLocale();
  const names = (list: string[], tone: string) => (
    <div className="item-chips">
      {list.map((n) => (
        tone === "danger" ? <span key={n} className="item-chip plain bad">{n}</span>
          : <Link key={n} className="item-chip plain" href={playerHref(n)}>{n}</Link>
      ))}
    </div>
  );
  const count = done ? r.given?.length || 0 : r.players || 0;
  return (
    <Card>
      <CardHead title={done ? t("Given") : t("The check")} sub={done ? null : t("Nothing was given yet")} />
      <div className="card-body stack">
        <div className="kpis cols-2">
          <Kpi label={done ? t("Players given") : t("Players found")} value={fmtNum(count)} icon={done ? Check : Users} tone="success" />
          <Kpi label={t("Unknown names")} value={fmtNum(r.unknown.length)} icon={Search} tone={r.unknown.length ? "danger" : ""} />
        </div>
        {r.unknown.length ? (
          <div className="stack">
            <AlertBox tone="warning" title={tn(r.unknown.length, "{n} name is nobody's", "{n} names are nobody's")} text={t("No account (or a deleted one): they get nothing.")} />
            {names(r.unknown, "danger")}
          </div>
        ) : null}
        {r.already_own.length ? (
          <div className="stack">
            <span className="row"><TriangleAlert className="icon" aria-hidden />{tn(r.already_own.length, "{n} has the item already (gets the rest)", "{n} have the item already (get the rest)")}</span>
            {names(r.already_own, "")}
          </div>
        ) : null}
        {done && r.given?.length ? names(r.given, "") : null}
        {!done && !r.players ? <AlertBox tone="danger" title={t("Nobody to give to")} /> : null}
        <span className="hint row"><Coins className="icon" aria-hidden /><Star className="icon" aria-hidden />{t("Coins and VIP days go to everyone found.")}</span>
      </div>
    </Card>
  );
}
