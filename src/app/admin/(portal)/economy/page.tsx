"use client";

import { ChartColumn, Coins, Gift, Lock, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORY, usePlayerActions } from "@/admin/components/player-dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { AlertBox, Badge, Btn, Card, CardHead, DataTable, Empty, Kpi, PageHead, PersonLink, Tabs } from "@/admin/components/ui/bits";
import { BarList } from "@/admin/components/ui/charts";
import { Loaded } from "@/admin/components/ui/loaded";
import { msg } from "@/admin/i18n";
import { useApi, useIsAdmin, useQueryParams } from "@/admin/lib/hooks";
import type { CatalogItem, Economy, Metrics, Payment } from "@/admin/lib/types";

/** How an item is had: its name and colour. */
const HOW: Record<string, [string, string]> = {
  coins: [msg("Coins"), "accent"],
  free: [msg("Free"), ""],
  achievement: [msg("Achievement"), "info"],
  vip: [msg("VIP"), "warning"],
  pack: [msg("Welcome pack"), "success"],
};

/** Where coins come from and go, by the ledger's kind. */
const FLOW: Record<string, string> = {
  buy: msg("Bought in the shop"), gift: msg("Gifts to friends"), daily: msg("Daily bonus and challenge"), game: msg("Games played"),
  league: msg("Leagues reached"), level: msg("Levels reached"), staff: msg("Given by the staff"), refund: msg("Refunds"),
  tournament: msg("Tournament entries"), prize: msg("Tournament prizes"), mission: msg("Missions"), pack: msg("Coin packs bought"),
  welcome: msg("Welcome pack"), vip: msg("VIP"),
};

export default function EconomyPage() {
  const economy = useApi<Economy>("/economy");
  const metrics = useApi<Metrics>("/metrics");
  return <Loaded queries={[economy, metrics]}>{(e, m) => <EconomyView e={e} m={m} />}</Loaded>;
}

function EconomyView({ e, m }: { e: Economy; m: Metrics }) {
  const { t, tf, tn, fmtNum, money } = useLocale();
  const { get, set } = useQueryParams();
  const tab = get("tab", "coins");
  const eco = e.economy;
  const revenue = (m.metrics.revenue || []).filter((r) => r[0] !== "msstore");
  const ms = (m.metrics.revenue || []).find((r) => r[0] === "msstore");
  const credited = eco.flows.reduce((a, f) => a + f.credited, 0);
  const debited = eco.flows.reduce((a, f) => a + f.debited, 0);

  return (
    <div>
      <PageHead title={t("Economy")} sub={t("Coins, VIP, payments and the shop")} />
      <div className="kpis">
        <Kpi label={t("Coins in wallets")} value={fmtNum(eco.coins_total)} sub={tn(eco.wallets, "{n} wallet with coins", "{n} wallets with coins")} icon={Coins} tone="warning" />
        <Kpi label={t("VIP members")} value={fmtNum(eco.vip_now)} icon={Star} tone="success" />
        <Kpi label={t("Given in 30 days")} value={"+" + fmtNum(credited)} sub={t("coins credited")} icon={Gift} tone="success" />
        <Kpi label={t("Spent in 30 days")} value={"−" + fmtNum(debited)} sub={t("coins taken")} icon={Coins} tone="danger" />
        {revenue.map((r) => (
          <Kpi key={r[0]} label={tf("Revenue in 30 days ({currency})", { currency: r[0].toUpperCase() })} value={money(r[1], r[0])}
            sub={tn(r[2], "{n} payment", "{n} payments")} icon={ChartColumn} tone="info" />
        ))}
        {ms ? <Kpi label="Microsoft Store" value={fmtNum(ms[2])} sub={t("purchases in 30 days")} icon={Coins} /> : null}
      </div>
      {!e.stripe ? (
        <div className="section">
          <AlertBox tone="info" title={t("Card payments are off")} text={t("Stripe is not configured on this server.")} />
        </div>
      ) : null}
      <div className="section">
        <Tabs
          current={tab}
          onChange={(id) => set({ tab: id === "coins" ? null : id })}
          items={[
            { id: "coins", label: t("Coins"), icon: Coins },
            { id: "payments", label: t("Payments"), icon: ChartColumn, count: e.private_hidden ? null : e.payments.length },
            { id: "catalog", label: t("The shop's catalogue"), icon: Gift, count: e.catalog.length },
          ]}
        />
        {tab === "payments" ? <PaymentsTab e={e} /> : tab === "catalog" ? <CatalogTab catalog={e.catalog} /> : (
          <div className="grid-aside">
            <Card>
              <CardHead title={t("Where coins went in the last 30 days")} sub={t("By kind of reason")} />
              {eco.flows.length ? (
                <DataTable headers={[t("Reason"), { label: t("Given"), cls: "num" }, { label: t("Taken"), cls: "num" }, { label: t("Entries"), cls: "num" }]}>
                  {eco.flows.map((f) => (
                    <tr key={f.kind}>
                      <td>
                        <b>{t(FLOW[f.kind] || f.kind)}</b>
                        <div className="faint mono">{f.kind}</div>
                      </td>
                      <td className="num">{f.credited ? <Badge kind="success">+{fmtNum(f.credited)}</Badge> : "—"}</td>
                      <td className="num">{f.debited ? <Badge kind="danger">−{fmtNum(f.debited)}</Badge> : "—"}</td>
                      <td className="num">{fmtNum(f.entries)}</td>
                    </tr>
                  ))}
                </DataTable>
              ) : (
                <Empty icon={Coins} title={t("No coins moved")} />
              )}
            </Card>
            <Card>
              <CardHead title={t("Largest balances")} />
              {eco.richest.length ? (
                <div className="card-body">
                  <BarList rows={eco.richest.map(([n, c]) => ({ key: n, label: <PersonLink name={n} />, value: c }))} />
                </div>
              ) : (
                <Empty icon={Coins} title={t("No coins anywhere")} />
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentsTab({ e }: { e: Economy }) {
  const { t, fmtNum, fmtDate, money } = useLocale();
  const admin = useIsAdmin();
  const actions = usePlayerActions();
  return (
    <Card>
      <CardHead title={t("Latest payments")} sub={t("Test and refunded payments are faded")} />
      {e.private_hidden ? (
        <Empty icon={Lock} title={t("Visible to administrators only")} />
      ) : e.payments.length ? (
        <DataTable lead={2} headers={[t("When"), t("Player"), t("What"), { label: t("Coins"), cls: "num" }, { label: t("Amount"), cls: "num" }, t("Status"), ""]}>
          {e.payments.map((p: Payment) => (
            <tr key={p.id} className={p.test || p.refunded ? "dim" : ""}>
              <td className="nowrap">{fmtDate(p.at)}</td>
              <td><PersonLink name={p.payer} /></td>
              <td>{p.kind === "vip" ? "VIP" : t("Coins")}</td>
              <td className="num">{fmtNum(p.coins)}</td>
              <td className="num">{money(p.amount, p.currency)}</td>
              <td>
                <span className="badges">
                  {p.refunded ? <Badge kind="danger">{t("Refunded")}</Badge> : <Badge kind="success">{t("Paid")}</Badge>}
                  {p.test ? <Badge kind="warning">{t("Test")}</Badge> : null}
                </span>
              </td>
              <td className="actions-cell">
                {admin ? <Btn label={p.test ? t("Mark as real") : t("Mark as test")} kind="sm ghost" onClick={() => void actions.markPayment(p)} /> : null}
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <Empty icon={Coins} title={t("No payments yet")} />
      )}
    </Card>
  );
}

const PAGE = 40;

function CatalogTab({ catalog }: { catalog: CatalogItem[] }) {
  const { t, tf, fmtNum } = useLocale();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [how, setHow] = useState("");
  const [shown, setShown] = useState(PAGE);
  const cats = useMemo(() => [...new Set(catalog.map((i) => i.category))], [catalog]);
  const s = q.trim().toLowerCase();
  const all = catalog.filter((i) => (!s || i.name.toLowerCase().includes(s) || i.code.includes(s)) && (!cat || i.category === cat) && (!how || i.how === how));
  const items = all.slice(0, shown);
  const filter = <T,>(f: (v: T) => void) => (v: T) => {
    f(v);
    setShown(PAGE);
  };
  return (
    <div>
      <div className="toolbar">
        <input className="input wide" type="search" placeholder={t("Item name or code")} aria-label={t("Search items")} value={q} onChange={(e) => filter(setQ)(e.target.value)} />
        <select className="select" aria-label={t("Category")} value={cat} onChange={(e) => filter(setCat)(e.target.value)}>
          <option value="">{t("Every category")}</option>
          {cats.map((c) => <option key={c} value={c}>{t(CATEGORY[c] || c)}</option>)}
        </select>
        <select className="select" aria-label={t("How it is had")} value={how} onChange={(e) => filter(setHow)(e.target.value)}>
          <option value="">{t("Any way")}</option>
          {Object.entries(HOW).map(([v, [l]]) => <option key={v} value={v}>{t(l)}</option>)}
        </select>
      </div>
      <Card>
        {items.length ? (
          <>
            <DataTable headers={[t("Item"), t("Category"), t("How it is had"), { label: t("Price"), cls: "num" }]}>
              {items.map((i) => {
                const [label, tone] = HOW[i.how] || [i.how, ""];
                return (
                  <tr key={i.code}>
                    <td>
                      <b>{i.name}</b>
                      <div className="faint mono">{i.code}</div>
                    </td>
                    <td>{t(CATEGORY[i.category] || i.category)}</td>
                    <td>
                      <Badge kind={tone}>{t(label)}</Badge>
                      {i.achievement ? <span className="faint mono"> {i.achievement}</span> : null}
                    </td>
                    <td className="num">{i.coins ? fmtNum(i.coins) : "—"}</td>
                  </tr>
                );
              })}
            </DataTable>
            {all.length > items.length ? (
              <div className="pager">
                <span>{tf("{from}–{to} of {total}", { from: 1, to: fmtNum(items.length), total: fmtNum(all.length) })}</span>
                <Btn label={tf("Show all {n}", { n: fmtNum(all.length) })} kind="sm" onClick={() => setShown(Infinity)} />
              </div>
            ) : null}
          </>
        ) : (
          <Empty icon={Search} title={t("No item matches")} />
        )}
      </Card>
    </div>
  );
}
