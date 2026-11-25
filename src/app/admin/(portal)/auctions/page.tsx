"use client";

import { CalendarDays, Coins, Gavel, Timer, X } from "lucide-react";
import { useId, useState } from "react";
import { fromLocalInput, toLocalInput } from "@/admin/components/events/event-words";
import { ItemLabel, ItemPicker, RarityBadge } from "@/admin/components/items";
import { Progress, RangeFields, Section, StatusBadge, minuteNow, useWhen } from "@/admin/components/ops/schedule";
import { useRefresh } from "@/admin/components/providers";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { AlertBox, Btn, Card, DataTable, Empty, Kpi, PageHead, PersonLink, Spinner, TimeAgo, Updated, useBusy } from "@/admin/components/ui/bits";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { Modal } from "@/admin/components/ui/modal";
import { api, seg } from "@/admin/lib/api";
import { useApi, useIsAdmin } from "@/admin/lib/hooks";
import type { Auction, Auctions } from "@/admin/lib/types";
import "@/admin/styles/moderation.css";
import "@/admin/styles/ops.css";

export default function AuctionsPage() {
  const { t, tf, tn, fmtNum, ago } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const q = useApi<Auctions>("/auctions", { refetchInterval: 15000 });
  return (
    <Loaded queries={[q]}>
      {(d) => {
        const open = d.auctions.filter((a) => a.state === "open").sort((a, b) => a.ends_at - b.ends_at);
        const coming = d.auctions.filter((a) => a.state === "coming").sort((a, b) => a.starts_at - b.starts_at);
        const past = d.auctions.filter((a) => a.state === "ended" || a.state === "cancelled");
        const held = open.reduce((s, a) => s + (a.leader ? a.bid : 0), 0);
        const sold = past.filter((a) => a.state === "ended" && a.leader).reduce((s, a) => s + a.bid, 0);
        const rarity = new Map(d.items.map((i) => [i.code, i.rarity]));
        const card = (a: Auction) => <AuctionCard key={a.id} a={a} now={d.now} rarity={rarity.get(a.code)} />;
        return (
          <div>
            <PageHead title={t("Auctions")} sub={tf("Rare items to the highest bid · a bid in the last {n} adds as much to the end", { n: tn(Math.round(d.limits.snipe_window_secs / 60), "{n} minute", "{n} minutes") })}>
              <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
              {admin ? <Btn label={t("New auction")} kind="primary" icon={Gavel} onClick={() => dialogs.open((close) => <AuctionDialog d={d} onClose={close} />)} /> : null}
            </PageHead>
            {admin ? null : <AlertBox tone="info" title={t("Only administrators open auctions")} text={t("The coins of the winning bid leave the economy.")} />}
            <div className={"kpis" + (admin ? "" : " section")}>
              <Kpi label={t("Open now")} value={fmtNum(open.length)} sub={open.length ? tf("the next ends {when}", { when: ago(open[0].ends_at) }) : t("none")} icon={Gavel} tone={open.length ? "success" : ""} />
              <Kpi label={t("Coins held in bids")} value={fmtNum(held)} sub={t("given back to whoever is outbid")} icon={Coins} tone="warning" />
              <Kpi label={t("Coming up")} value={fmtNum(coming.length)} sub={coming.length ? tf("the next {when}", { when: ago(coming[0].starts_at) }) : t("nothing scheduled")} icon={CalendarDays} tone="info" />
              <Kpi label={t("Won at auction")} value={fmtNum(sold)} sub={t("coins out of the economy (the latest 100)")} icon={Coins} />
            </div>
            <Section title={t("Open now")} empty={<Card><Empty icon={Gavel} title={t("No auction is open")} text={admin ? t("Open one with “New auction”.") : null} /></Card>}>{open.map(card)}</Section>
            <Section title={t("Coming up")} empty={<Card><Empty icon={CalendarDays} title={t("Nothing scheduled")} /></Card>}>{coming.map(card)}</Section>
            {past.length ? (
              <Section title={t("Past")} sub={t("The latest 100")} empty={null}>
                {[
                  <Card key="past">
                    <DataTable headers={[t("Item"), t("Ended"), { label: t("Bids"), cls: "num" }, { label: t("Winning bid"), cls: "num" }, t("Winner"), t("Status")]}>
                      {past.map((a) => (
                        <tr key={a.id} className={a.state === "cancelled" ? "dim" : ""}>
                          <td><ItemLabel code={a.code} name={a.name} rarity={rarity.get(a.code)} /></td>
                          <td className="nowrap"><TimeAgo at={a.cancelled_at || a.ends_at} /></td>
                          <td className="num">{fmtNum(a.bids)}</td>
                          <td className="num">{a.leader ? fmtNum(a.bid) : "—"}</td>
                          <td>{a.leader && a.state === "ended" ? <PersonLink name={a.leader} /> : <span className="faint">{a.state === "ended" ? t("no bid") : "—"}</span>}</td>
                          <td><StatusBadge status={a.state} /></td>
                        </tr>
                      ))}
                    </DataTable>
                  </Card>,
                ]}
              </Section>
            ) : null}
          </div>
        );
      }}
    </Loaded>
  );
}

function AuctionCard({ a, now, rarity }: { a: Auction; now: number; rarity?: string }) {
  const { t, tf, tn, fmtNum, fmtDate, ago } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const when = useWhen();
  const [busy, run] = useBusy();
  const [all, setAll] = useState(false);
  const cancel = async () => {
    const ok = await dialogs.confirm({
      title: tf("Call off the auction of {item}?", { item: a.name || a.code }),
      text: a.leader
        ? tf("{name} gets their {n} coins back; nobody gets the item. The bidders see it was called off.", { name: a.leader, n: fmtNum(a.bid) })
        : t("Nobody has bid yet; nobody gets the item."),
      confirm: t("Call off"),
    });
    if (ok && (await run(() => attempt(() => api("/auctions/" + seg(a.id) + "/cancel", { method: "POST" }), t("Auction called off."))))) void refresh();
  };
  const next = a.leader ? a.bid + a.min_increment : a.min_bid;
  const bids = all ? a.latest_bids : a.latest_bids.slice(0, 5);
  return (
    <Card>
      <div className="card-head">
        <div className="row">
          <span className={"event-icon " + (a.state === "open" ? "success" : "info")}><Gavel className="icon" aria-hidden /></span>
          <div>
            <h3 className="row"><ItemLabel code={a.code} name={a.name} rarity={rarity} showCode={false} /><RarityBadge rarity={rarity} /></h3>
            <div className="sub mono">{a.code}</div>
          </div>
        </div>
        <div className="row">
          <StatusBadge status={a.state} />
          {admin && (a.state === "open" || a.state === "coming") ? <Btn label={t("Call off")} kind="sm danger-soft" icon={X} busy={busy} onClick={() => void cancel()} /> : null}
        </div>
      </div>
      <div className="card-body stack">
        <div className="auction-numbers">
          <div><span className="faint">{a.leader ? t("Leading bid") : t("Least bid")}</span><b>{fmtNum(a.leader ? a.bid : a.min_bid)}</b>{a.leader ? <PersonLink name={a.leader} /> : <span className="faint">{t("no bid yet")}</span>}</div>
          <div><span className="faint">{t("Next bid from")}</span><b>{fmtNum(next)}</b><span className="faint">{tf("raises of {n}", { n: fmtNum(a.min_increment) })}</span></div>
          <div><span className="faint">{t("Bids")}</span><b>{fmtNum(a.bids)}</b></div>
          <div><span className="faint">{a.state === "coming" ? t("Starts") : t("Ends")}</span><b className="nowrap"><Timer className="icon" aria-hidden /> {ago(a.state === "coming" ? a.starts_at : a.ends_at)}</b>
            <span className="faint">{fmtDate(a.state === "coming" ? a.starts_at : a.ends_at)}</span></div>
        </div>
        {a.state === "open" ? <Progress from={a.starts_at} to={a.ends_at} now={now} tone="success" label={when("open", a.starts_at, a.ends_at)} /> : null}
        {a.latest_bids.length ? (
          <div className="table-wrap">
            <table className="data compact">
              <thead><tr><th>{t("Bidder")}</th><th className="num">{t("Bid")}</th><th>{t("When")}</th></tr></thead>
              <tbody>
                {bids.map((b, k) => (
                  <tr key={k}>
                    <td><PersonLink name={b.username} /></td>
                    <td className="num">{fmtNum(b.amount)}</td>
                    <td className="nowrap"><TimeAgo at={b.at} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {a.latest_bids.length > 5 && !all ? <Btn label={tn(a.latest_bids.length, "Show the latest {n} bid", "Show the latest {n} bids")} kind="sm ghost" onClick={() => setAll(true)} /> : null}
          </div>
        ) : null}
        <div className="faint">{tf("Opened by {name}, {when}", { name: a.created_by || "?", when: ago(a.created_at) })}</div>
      </div>
    </Card>
  );
}

function AuctionDialog({ d, onClose }: { d: Auctions; onClose: () => void }) {
  const { t, tf, fmtNum } = useLocale();
  const { toast } = useToasts();
  const refresh = useRefresh();
  const uid = useId();
  const [code, setCode] = useState("");
  const [[starts, ends], setRange] = useState<[string, string]>([toLocalInput(minuteNow()), toLocalInput(minuteNow() + 3 * 86400)]);
  const [minBid, setMinBid] = useState("");
  const [inc, setInc] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const item = d.items.find((i) => i.code === code);
  const a = fromLocalInput(starts);
  const b = fromLocalInput(ends);
  const pick = (c: string) => {
    setCode(c);
    const i = d.items.find((x) => x.code === c);
    // A start at half the shop's price, when it has one.
    if (!minBid && i?.price) setMinBid(String(Math.max(1, Math.round(i.price / 2 / 100) * 100)));
  };
  const presets: [string, () => [number, number]][] = [1, 3, 7].map((n) => [tf("From now, {n} days", { n }), () => [minuteNow(), minuteNow() + n * 86400]]);
  const save = async () => {
    if (sending) return;
    const mb = Number(minBid);
    const mi = Number(inc);
    let problem: string | null = null;
    if (!code) problem = t("Choose the item.");
    else if (!(a && b)) problem = t("Choose when it starts and ends.");
    else if (b <= Math.max(a, Date.now() / 1000) + 60) problem = t("The auction must end after it starts.");
    else if (b - a > d.limits.max_days * 86400) problem = tf("An auction lasts {n} days at most.", { n: d.limits.max_days });
    else if (!(Number.isInteger(mb) && mb >= 1 && mb <= d.limits.max_bid) || !(Number.isInteger(mi) && mi >= 1 && mi <= d.limits.max_bid)) problem = t("The least bid and raise are 1 coin or more.");
    setError(problem);
    if (problem) return;
    setSending(true);
    try {
      await api("/auctions", { method: "POST", body: { code, starts_at: a, ends_at: b, min_bid: mb, min_increment: mi } });
      toast(t("Auction opened."));
      void refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSending(false);
    }
  };
  return (
    <Modal title={t("New auction")} icon={Gavel} wide onClose={onClose}
      text={t("Items sold for coins or only won. A bid holds the bidder's coins; whoever is outbid gets them back at once; the winner gets the item for good.")}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>{t("Cancel")}</button>
          <button type="button" data-primary className="btn primary" disabled={sending} onClick={() => void save()}>
            {sending ? <Spinner /> : null}
            {t("Open the auction")}
          </button>
        </>
      }>
      <div className="field">
        <span className="label">{t("Item")}</span>
        <ItemPicker label={t("Item")} items={d.items.map((i) => ({ code: i.code, name: i.name, rarity: i.rarity, price: i.price }))} value={code} onChange={(v) => pick(String(v))} height={220} />
      </div>
      <RangeFields idPrefix={uid} starts={starts} ends={ends} onChange={(x, y) => setRange([x, y])} presets={presets} />
      <div className="grid-2">
        <div className="field">
          <label className="label" htmlFor={uid + "-min"}>{t("Least bid (coins)")}</label>
          <input id={uid + "-min"} className="input num" type="number" min={1} max={d.limits.max_bid} step={100} value={minBid} onChange={(e) => setMinBid(e.target.value)} />
          {item?.price ? <div className="hint">{tf("The shop sells it for {n} coins.", { n: fmtNum(item.price) })}</div> : null}
        </div>
        <div className="field">
          <label className="label" htmlFor={uid + "-inc"}>{t("Least raise (coins)")}</label>
          <input id={uid + "-inc"} className="input num" type="number" min={1} max={d.limits.max_bid} step={50} value={inc} onChange={(e) => setInc(e.target.value)} />
        </div>
      </div>
      <div className="hint">{tf("Up to {n} days. A bid in the last {m} minutes moves the end {m} minutes later.", { n: d.limits.max_days, m: Math.round(d.limits.snipe_window_secs / 60) })}</div>
      {error ? <AlertBox tone="danger" title={error} /> : null}
    </Modal>
  );
}
