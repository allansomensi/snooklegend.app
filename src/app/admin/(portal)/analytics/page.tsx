"use client";

import { Clock, Coins, Crown, Globe, Lock, Package, ShoppingBag, Star, TrendingDown, TrendingUp, UserPlus, Users, Wallet } from "lucide-react";
import { RarityBadge, useItemWords } from "@/admin/components/items";
import { useLocale } from "@/admin/components/providers/locale";
import {
  AlertBox, Badge, Card, CardHead, Country, DataTable, Empty, Kpi, PageHead, PersonLink, Segmented, Tabs, TimeAgo, Updated,
} from "@/admin/components/ui/bits";
import { BarList, Heatmap, LineChart, StackChart } from "@/admin/components/ui/charts";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { msg } from "@/admin/i18n";
import { useApi, useIsAdmin, useQueryParams } from "@/admin/lib/hooks";
import {
  ZONES, browserZone, healthTone, heatLevel, offsetLabel, seriesKeys, seriesValue, sinkParts, topWithRest, weekOrder, weekStartOf, zoneOffset,
} from "@/admin/lib/ops";
import type { CoinAnalytics, CountryRow, PeakHours, SalesPeriod, Sellers, VipAnalytics, VipSource } from "@/admin/lib/types";
import "@/admin/styles/business.css";
import "@/admin/styles/ops.css";

/** Where coins come from. */
const SOURCES: Record<string, string> = {
  games: msg("Games"), daily_bonus: msg("Daily bonus"), daily_challenge: msg("Daily challenge"), missions: msg("Missions"),
  tournament_prizes: msg("Tournament prizes"), rewards: msg("Leagues and levels"), staff: msg("The staff"), purchases: msg("Bought with money"),
  refunds: msg("Refunds"), other: msg("Other"), "*": msg("The rest"),
};
/** Where coins go. */
const SINKS: Record<string, string> = {
  shop: msg("Shop"), gifts: msg("Presents"), tournament_fees: msg("Tournament fees"), auctions: msg("Auctions"), name_changes: msg("Username changes"),
  staff: msg("Taken by the staff"), payment_refunds: msg("Payments refunded"), other: msg("Other"), "*": msg("The rest"),
};
const HEALTH: Record<string, [string, string]> = {
  healthy: [msg("Healthy"), msg("Coins made and spent are in balance (net under 3 % of the supply a week).")],
  watch: [msg("Watch"), msg("More coins made than spent: 3 % to 7 % of the supply a week.")],
  inflating: [msg("Inflating"), msg("Far more coins made than spent: over 7 % of the supply a week. Prices lose their worth.")],
  deflating: [msg("Deflating"), msg("More coins spent than made: the supply shrinks over 2 % a week.")],
  unknown: [msg("Not known"), msg("No coins in wallets yet.")],
};
const VIA: Record<VipSource, string> = { stripe: msg("Card (Stripe)"), microsoft_store: "Microsoft Store", gift: msg("A friend's present"), staff: msg("The staff") };
const PALETTE = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];

export default function AnalyticsPage() {
  const { t } = useLocale();
  const admin = useIsAdmin();
  const { get, set } = useQueryParams();
  const tab = get("tab", "coins");
  return (
    <div>
      <PageHead title={t("Analytics")} sub={t("The coin economy, what sells, where players are, when they play, VIP members")} />
      <Tabs
        current={tab}
        onChange={(id) => set({ tab: id === "coins" ? null : id })}
        items={[
          { id: "coins", label: t("Coins"), icon: Coins },
          { id: "sellers", label: t("Best and worst sellers"), icon: ShoppingBag },
          { id: "countries", label: t("Players by country"), icon: Globe },
          { id: "hours", label: t("Peak hours"), icon: Clock },
          ...(admin ? [{ id: "vip", label: t("VIP members"), icon: Star }] : []),
        ]}
      />
      {tab === "sellers" ? <SellersTab /> : tab === "countries" ? <CountriesTab /> : tab === "hours" ? <HoursTab /> : tab === "vip" ? (admin ? <VipTab /> : <Card><Empty icon={Lock} title={t("Visible to administrators only")} /></Card>) : <CoinsTab />}
    </div>
  );
}

function useCoinWords() {
  const { t } = useLocale();
  const words = useItemWords();
  return {
    source: (k: string) => t(SOURCES[k] || k),
    sink: (k: string) => {
      const [kind, cat] = sinkParts(k);
      const base = t(SINKS[kind] || kind);
      return cat ? base + ": " + words.category(cat) : base;
    },
  };
}

// ------------------------------------------------------------------ coins

function CoinsTab() {
  const { t, tf, fmtNum, fmtPct, fmtDay, fmtDayLong } = useLocale();
  const { get, set } = useQueryParams();
  const days = Number(get("days", "30")) || 30;
  const q = useApi<CoinAnalytics>("/analytics/coins?days=" + days);
  const w = useCoinWords();
  return (
    <Loaded queries={[q]}>
      {(d) => {
        const src = topWithRest(seriesKeys(d.days, "by_source"), 6);
        const snk = topWithRest(seriesKeys(d.days, "by_sink"), 6);
        const labels = d.days.map((x) => fmtDay(x.day));
        const titles = d.days.map((x) => fmtDayLong(x.day));
        const created = d.days.reduce((a, x) => a + x.created, 0);
        const spent = d.days.reduce((a, x) => a + x.spent, 0);
        const [hName, hText] = HEALTH[d.health] || [d.health, ""];
        const every = Math.max(1, Math.ceil(d.days.length / 12));
        const totals = (m: Record<string, number>, word: (k: string) => string, tone: string) =>
          Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: <span className="ellipsis">{word(k)}</span>, value: v, tone }));
        return (
          <div className="stack">
            <div className="row between">
              <Segmented<string> name={t("Days")} value={String(days)} onChange={(v) => set({ days: v === "30" ? null : v })}
                options={[["7", tf("{n} days", { n: 7 })], ["30", tf("{n} days", { n: 30 })], ["90", tf("{n} days", { n: 90 })], ["365", t("A year")]]} />
              <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
            </div>
            <AlertBox tone={(healthTone(d.health) || "info") as "success" | "warning" | "danger" | "info"} title={tf("The economy: {verdict}", { verdict: t(hName) })}
              text={t(hText) + " " + tf("Last 7 days: {net} coins net, {pct} of the supply.", { net: (d.net_7d > 0 ? "+" : "") + fmtNum(d.net_7d), pct: fmtPct(d.net_7d_percent, 2) })} />
            <div className="kpis">
              <Kpi label={t("Coins in wallets")} value={fmtNum(d.supply)} sub={tf("{n} wallets", { n: fmtNum(d.wallets) })} icon={Wallet} tone="warning" />
              <Kpi label={t("Made")} value={created ? "+" + fmtNum(created) : "0"} sub={tf("in {n} days", { n: days })} icon={TrendingUp} tone="success" />
              <Kpi label={t("Spent")} value={spent ? "−" + fmtNum(spent) : "0"} sub={tf("in {n} days", { n: days })} icon={TrendingDown} tone="danger" />
              <Kpi label={t("Net in 7 days")} value={(d.net_7d > 0 ? "+" : "") + fmtNum(d.net_7d)} sub={fmtPct(d.net_7d_percent, 2) + " " + t("of the supply")} icon={Coins}
                tone={healthTone(d.health)} />
            </div>
            <Card>
              <CardHead title={t("Coins made and spent, day by day")} sub={t("Made above the line by where they come from; spent below by where they go; the dashed line is the net")} />
              <div className="card-body">
                {created || spent ? (
                  <StackChart labels={labels} titles={titles} every={every}
                    up={src.map((k, i) => ({ name: w.source(k), cls: PALETTE[i % 8], values: d.days.map((x) => seriesValue(x, "by_source", k, src)) }))}
                    down={snk.map((k, i) => ({ name: "− " + w.sink(k), cls: PALETTE[(i + 3) % 8], values: d.days.map((x) => seriesValue(x, "by_sink", k, snk)) }))}
                    line={{ name: t("Net"), values: d.days.map((x) => x.net) }} />
                ) : (
                  <Empty icon={Coins} title={t("No coins moved in these days")} />
                )}
              </div>
            </Card>
            <Card>
              <CardHead title={t("Coins in wallets")} sub={t("At the end of each day")} />
              <div className="card-body">
                <LineChart labels={labels} titles={titles} every={every} values={d.days.map((x) => x.supply)} name={t("Coins in wallets")} />
              </div>
            </Card>
            <div className="grid-2">
              <Card>
                <CardHead title={t("Where coins come from")} sub={tf("{n} days", { n: days })} />
                <div className="card-body">
                  {Object.keys(d.totals.created).length ? <BarList rows={totals(d.totals.created, w.source, "success")} /> : <Empty icon={Coins} title={t("None")} />}
                </div>
              </Card>
              <Card>
                <CardHead title={t("Where coins go")} sub={tf("{n} days", { n: days })} />
                <div className="card-body">
                  {Object.keys(d.totals.spent).length ? <BarList rows={totals(d.totals.spent, w.sink, "danger")} /> : <Empty icon={Coins} title={t("None")} />}
                </div>
              </Card>
            </div>
          </div>
        );
      }}
    </Loaded>
  );
}

// ---------------------------------------------------------------- sellers

type Period = "days_7" | "days_30" | "all_time";

function SellersTab() {
  const { t, tf, fmtNum } = useLocale();
  const { get, set } = useQueryParams();
  const words = useItemWords();
  const period = (get("period", "days_30") as Period);
  const q = useApi<Sellers>("/analytics/sellers");
  return (
    <Loaded queries={[q]}>
      {(d) => {
        const of = (s: Sellers["items"][number]): SalesPeriod => s[period] || { sales: 0, coins: 0, buyers: 0 };
        const sold = d.items.filter((i) => of(i).sales > 0).sort((a, b) => of(b).coins - of(a).coins);
        const best = sold.slice(0, 25);
        // The worst: sold at some time but the least in this period.
        const worst = d.items.filter((i) => i.price).sort((a, b) => of(a).sales - of(b).sales || of(a).coins - of(b).coins).slice(0, 15);
        const total = sold.reduce((a, i) => a + of(i).coins, 0);
        const row = (i: Sellers["items"][number], k: number) => {
          const p = of(i);
          return (
            <tr key={i.code}>
              <td className="faint num">{k + 1}</td>
              <td><b className={"r-text r-" + (i.rarity || "")}>{i.name || i.code}</b><div className="faint mono">{i.code}</div></td>
              <td>{words.category(i.category)}</td>
              <td><RarityBadge rarity={i.rarity} /></td>
              <td className="num">{i.price ? fmtNum(i.price) : "—"}</td>
              <td className="num"><b>{fmtNum(p.sales)}</b></td>
              <td className="num">{fmtNum(p.coins)}</td>
              <td className="num">{fmtNum(p.buyers)}</td>
              <td className="nowrap">{i.last_sold_at ? <TimeAgo at={i.last_sold_at} /> : "—"}</td>
            </tr>
          );
        };
        const headers = ["#", t("Item"), t("Category"), t("Rarity"), { label: t("Price"), cls: "num" }, { label: t("Sales"), cls: "num" }, { label: t("Coins"), cls: "num" },
          { label: t("Buyers"), cls: "num" }, t("Last sold")];
        return (
          <div className="stack">
            <div className="row between">
              <Segmented<Period> name={t("Period")} value={period} onChange={(v) => set({ period: v === "days_30" ? null : v })}
                options={[["days_7", tf("{n} days", { n: 7 })], ["days_30", tf("{n} days", { n: 30 })], ["all_time", t("All time")]]} />
              <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
            </div>
            <div className="kpis">
              <Kpi label={t("Coins spent in the shop")} value={fmtNum(total)} sub={t("items bought and given")} icon={ShoppingBag} tone="warning" />
              <Kpi label={t("Items sold")} value={fmtNum(sold.length)} sub={tf("of {n} for sale", { n: fmtNum(d.items.filter((i) => i.price).length + d.never_sold.length) })} icon={Package} tone="success" />
              <Kpi label={t("Never sold")} value={fmtNum(d.never_sold.length)} sub={t("for coins, not once")} icon={TrendingDown} tone={d.never_sold.length ? "danger" : ""} />
            </div>
            <div className="grid-aside">
              <Card>
                <CardHead title={t("Best sellers")} sub={t("By coins, items bought and given (reactions too)")} />
                {best.length ? <DataTable headers={headers}>{best.map(row)}</DataTable> : <Empty icon={ShoppingBag} title={t("Nothing sold in this period")} />}
              </Card>
              <Card>
                <CardHead title={t("By category")} sub={period === "all_time" ? t("Coins, all time") : t("Coins in 30 days")} />
                <div className="card-body">
                  <BarList rows={d.categories.map((c) => ({ key: c.category, label: words.category(c.category), value: period === "all_time" ? c.coins : c.coins_30d }))} tone="info" />
                </div>
              </Card>
            </div>
            <div className="grid-2">
              <Card>
                <CardHead title={t("Worst sellers")} sub={t("Items for coins sold the least in this period")} />
                <DataTable headers={headers}>{worst.map(row)}</DataTable>
              </Card>
              <Card>
                <CardHead title={t("Never sold")} sub={t("Items for coins nobody bought nor gave")} />
                {d.never_sold.length ? (
                  <DataTable headers={[t("Item"), t("Category"), { label: t("Price"), cls: "num" }]}>
                    {d.never_sold.map((i) => (
                      <tr key={i.code}>
                        <td><b>{i.name}</b><div className="faint mono">{i.code}</div></td>
                        <td>{words.category(i.category)}</td>
                        <td className="num">{i.price ? fmtNum(i.price) : "—"}</td>
                      </tr>
                    ))}
                  </DataTable>
                ) : (
                  <Empty icon={Crown} title={t("Everything sold at least once")} />
                )}
              </Card>
            </div>
          </div>
        );
      }}
    </Loaded>
  );
}

// -------------------------------------------------------------- countries

function CountriesTab() {
  const { t, fmtNum, fmtPct } = useLocale();
  const { get, set } = useQueryParams();
  const sort = get("sort", "players") as "players" | "new_7d" | "online";
  const q = useApi<{ countries: CountryRow[]; online: number }>("/analytics/countries", { refetchInterval: 60000 });
  return (
    <Loaded queries={[q]}>
      {(d) => {
        const rows = [...d.countries].sort((a, b) => b[sort] - a[sort] || b.players - a.players);
        const players = d.countries.reduce((a, c) => a + c.players, 0);
        const fresh = d.countries.reduce((a, c) => a + c.new_7d, 0);
        const max = Math.max(1, ...rows.map((r) => r[sort]));
        const top = [...d.countries].filter((c) => c.country).sort((a, b) => b.new_7d - a.new_7d)[0];
        return (
          <div className="stack">
            <div className="row between">
              <Segmented<string> name={t("Order")} value={sort} onChange={(v) => set({ sort: v === "players" ? null : v })}
                options={[["players", t("Accounts")], ["new_7d", t("New this week")], ["online", t("Online now")]]} />
              <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
            </div>
            <div className="kpis">
              <Kpi label={t("Countries")} value={fmtNum(d.countries.filter((c) => c.country).length)} icon={Globe} tone="info" />
              <Kpi label={t("Accounts")} value={fmtNum(players)} icon={Users} />
              <Kpi label={t("New this week")} value={"+" + fmtNum(fresh)} icon={UserPlus} tone="success" />
              <Kpi label={t("Online now")} value={fmtNum(d.online)} icon={Users} tone="success" />
            </div>
            {top?.new_7d ? <div className="hint row">{t("Most new players this week:")} <Country code={top.country} /> (+{fmtNum(top.new_7d)})</div> : null}
            <Card>
              <CardHead title={t("Players by country")} sub={t("Accounts, new in the last 7 days, online now")} />
              {rows.length ? (
                <DataTable className="countries" headers={["#", t("Country"), "", { label: t("Accounts"), cls: "num" }, { label: t("Share"), cls: "num" }, { label: t("New this week"), cls: "num" }, { label: t("Online now"), cls: "num" }]}>
                  {rows.map((c, k) => (
                    <tr key={c.country || "none"}>
                      <td className="faint num">{k + 1}</td>
                      <td><Country code={c.country || null} /></td>
                      <td className="bar-cell"><div className="bl-track"><div className="bl-fill" style={{ width: Math.max(c[sort] ? 1.5 : 0, (c[sort] * 100) / max) + "%" }} /></div></td>
                      <td className="num"><b>{fmtNum(c.players)}</b></td>
                      <td className="num faint">{players ? fmtPct((c.players * 100) / players, 1) : "—"}</td>
                      <td className="num">{c.new_7d ? <Badge kind="success">+{fmtNum(c.new_7d)}</Badge> : <span className="faint">0</span>}</td>
                      <td className="num">{c.online ? <Badge kind="success dot">{fmtNum(c.online)}</Badge> : <span className="faint">0</span>}</td>
                    </tr>
                  ))}
                </DataTable>
              ) : (
                <Empty icon={Globe} title={t("Nobody yet")} />
              )}
            </Card>
          </div>
        );
      }}
    </Loaded>
  );
}

// ------------------------------------------------------------------ hours

function HoursTab() {
  const { t, tf, lang } = useLocale();
  const { get, set } = useQueryParams();
  const mine = browserZone();
  const zone = get("tz", mine);
  const weeks = Number(get("weeks", "4")) || 4;
  const show = get("show", "avg") as "avg" | "max";
  const offset = zoneOffset(zone);
  const q = useApi<PeakHours>("/analytics/hours?" + new URLSearchParams({ weeks: String(weeks), tz: String(offset) }));
  const zones = [mine, ...ZONES.filter((z) => z !== mine)];
  const weekday = (d: number) => new Intl.DateTimeFormat(lang, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 10, 1 + d)));
  const dec = (v: number) => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(v);
  return (
    <div className="stack">
      <div className="toolbar">
        <select className="select" aria-label={t("Time zone")} value={zone} onChange={(e) => set({ tz: e.target.value === mine ? null : e.target.value })}>
          {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, " ") + " (" + offsetLabel(zoneOffset(z)) + ")" + (z === mine ? " · " + t("yours") : "")}</option>)}
        </select>
        <Segmented<string> name={t("Weeks")} value={String(weeks)} onChange={(v) => set({ weeks: v === "4" ? null : v })}
          options={[["1", t("Last week")], ["4", tf("{n} weeks", { n: 4 })], ["12", tf("{n} weeks", { n: 12 })], ["52", t("A year")]]} />
        <Segmented<string> name={t("Show")} value={show} onChange={(v) => set({ show: v === "avg" ? null : v })} options={[["avg", t("Average online")], ["max", t("Most at once")]]} />
      </div>
      <Loaded queries={[q]}>
        {(d) => {
          const cell = new Map(d.cells.map((c) => [c.weekday * 24 + c.hour, c]));
          const v = (wd: number, h: number) => cell.get(wd * 24 + h)?.[show] || 0;
          const max = Math.max(0, ...d.cells.map((c) => c[show]));
          const peak = d.cells.reduce((a, c) => (c[show] > (a?.[show] ?? -1) ? c : a), d.cells[0]);
          const quiet = d.cells.filter((c) => c.samples).reduce((a, c) => (c[show] < (a?.[show] ?? Infinity) ? c : a), undefined as PeakHours["cells"][number] | undefined);
          const hour = (h: number) => String(h).padStart(2, "0") + "h";
          return (
            <Card>
              <CardHead title={t("Players online by weekday and hour")} sub={tf("{zone} · sampled every minute, by the hour", { zone: offsetLabel(d.utc_offset_minutes) })}>
                <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
              </CardHead>
              <div className="card-body stack">
                {max > 0 ? (
                  <>
                    <div className="row">
                      {peak ? <span>{tf("Busiest: {day} at {hour} ({n})", { day: weekday(peak.weekday), hour: hour(peak.hour), n: dec(peak[show]) })}</span> : null}
                      {quiet ? <span className="muted">{tf("Quietest: {day} at {hour} ({n})", { day: weekday(quiet.weekday), hour: hour(quiet.hour), n: dec(quiet[show]) })}</span> : null}
                    </div>
                    <Heatmap label={t("Players online by weekday and hour")}
                      rows={weekOrder(weekStartOf(lang)).map((wd) => ({ key: wd, label: weekday(wd) }))}
                      cols={Array.from({ length: 24 }, (_, h) => ({ key: h, label: String(h).padStart(2, "0") }))}
                      value={(wd, h) => (v(wd, h) ? (v(wd, h) >= 10 ? String(Math.round(v(wd, h))) : dec(v(wd, h))) : "")}
                      level={(wd, h) => heatLevel(v(wd, h), max)}
                      tip={(wd, h) => {
                        const c = cell.get(wd * 24 + h);
                        return weekday(wd) + " " + hour(h) + "\n" + tf("average {avg} · most {max}", { avg: dec(c?.avg || 0), max: String(c?.max || 0) });
                      }} />
                    <span className="heat-scale">{t("fewer")}{[1, 2, 3, 4, 5].map((l) => <i key={l} className={"hm l" + l} />)}{t("more")}</span>
                  </>
                ) : (
                  <Empty icon={Clock} title={t("No samples yet")} text={t("The server counts who is online every minute: the first hour shows up shortly.")} />
                )}
              </div>
            </Card>
          );
        }}
      </Loaded>
    </div>
  );
}

// -------------------------------------------------------------------- vip

function VipTab() {
  const { t, fmtNum, fmtDateOnly } = useLocale();
  const q = useApi<VipAnalytics>("/analytics/vip");
  return (
    <Loaded queries={[q]}>
      {(d) => (
        <div className="stack">
          <div className="row between"><span /><Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} /></div>
          <div className="kpis">
            <Kpi label={t("VIP now")} value={fmtNum(d.active)} icon={Star} tone="success" />
            <Kpi label={t("Renewed this month")} value={fmtNum(d.renewed_this_month)} icon={TrendingUp} tone="info" />
            <Kpi label={t("New this month")} value={fmtNum(d.new_this_month)} icon={UserPlus} tone="success" />
            <Kpi label={t("Lapsed in 90 days")} value={fmtNum(d.lapsed_90d)} sub={t("a cancelled subscription shows once its month ends")} icon={TrendingDown} tone={d.lapsed_90d ? "danger" : ""} />
          </div>
          <div className="grid-aside">
            <Card>
              <CardHead title={t("Members")} sub={t("VIP now, the period ending soonest first")} />
              {d.members.length ? (
                <DataTable headers={[t("Player"), t("Country"), t("How"), t("Since"), t("Last payment"), t("Period ends"), { label: t("Months"), cls: "num" }]}>
                  {[...d.members].sort((a, b) => a.until - b.until).map((m) => (
                    <tr key={m.username}>
                      <td><span className="row"><PersonLink name={m.username} />{m.subscriber ? <Badge kind="success">{t("Subscriber")}</Badge> : null}</span></td>
                      <td><Country code={m.country} /></td>
                      <td>{t(VIA[m.source] || m.source)}</td>
                      <td className="nowrap">{m.since ? fmtDateOnly(m.since) : "—"}</td>
                      <td className="nowrap">{m.last_payment ? fmtDateOnly(m.last_payment) : "—"}</td>
                      <td className="nowrap">{fmtDateOnly(m.until)} · <TimeAgo at={m.until} /></td>
                      <td className="num">{fmtNum(m.months)}</td>
                    </tr>
                  ))}
                </DataTable>
              ) : (
                <Empty icon={Star} title={t("No VIP member now")} />
              )}
            </Card>
            <div className="stack">
              <Card>
                <CardHead title={t("How they pay")} />
                <div className="card-body">
                  <BarList rows={(Object.entries(d.by_source) as [VipSource, number][]).map(([k, v]) => ({ key: k, label: t(VIA[k] || k), value: v }))} tone="success" />
                </div>
              </Card>
              <Card>
                <CardHead title={t("Lapsed")} sub={t("In the last 90 days")} />
                {d.lapsed.length ? (
                  <div className="mini-list">
                    {d.lapsed.map((m) => (
                      <div key={m.username} className="mi">
                        <div className="mi-main"><PersonLink name={m.username} /><span className="mi-sub">{t(VIA[m.source] || m.source)} · {fmtNum(m.months)} {t("Months").toLowerCase()}</span></div>
                        <span className="mi-side"><TimeAgo at={m.ended_at} /></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty icon={Star} title={t("Nobody lapsed")} />
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </Loaded>
  );
}
