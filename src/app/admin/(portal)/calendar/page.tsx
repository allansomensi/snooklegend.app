"use client";

import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Gavel, List, Percent, Star, TriangleAlert, Trophy, Wrench, Zap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/admin/components/providers/locale";
import { AlertBox, Badge, Btn, Card, CardHead, Empty, PageHead, Segmented, Updated } from "@/admin/components/ui/bits";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { StatusBadge } from "@/admin/components/ops/schedule";
import { msg } from "@/admin/i18n";
import { PHONE, useApi, useMediaQuery, useQueryParams } from "@/admin/lib/hooks";
import { clashes, dayStart, itemKey, itemsOnDay, monthGrid, weekOrder, weekStartOf, type Clash } from "@/admin/lib/ops";
import type { CalendarItem, CalendarKind, CalendarRange as Range } from "@/admin/lib/types";
import "@/admin/styles/ops.css";

/** Each kind: its name, icon, colour and page. */
const KINDS: Record<CalendarKind, [string, LucideIcon, string, string]> = {
  event: [msg("Boosts"), Zap, "k-event", "/admin/events"],
  tournament: [msg("Tournaments"), Trophy, "k-tournament", "/admin/tournaments"],
  weekly_cup: [msg("The weekly cup"), Trophy, "k-cup", "/admin/tournaments"],
  promotion: [msg("Promotions"), Percent, "k-promotion", "/admin/promotions"],
  maintenance: [msg("Maintenance"), Wrench, "k-maintenance", "/admin/maintenance"],
  auction: [msg("Auctions"), Gavel, "k-auction", "/admin/auctions"],
  vip_item: [msg("VIP's item of the month"), Star, "k-vip", "/admin/settings#group-economy"],
};
const ALL = Object.keys(KINDS) as CalendarKind[];

const monthKey = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");

/** Everything scheduled in one place: events, tournaments, the weekly cup,
 * promotions, maintenance, auctions and VIP's items, by month or as a list,
 * with what clashes. */
export default function CalendarPage() {
  const { t, lang } = useLocale();
  const { get, set } = useQueryParams();
  // A month's grid is small on a phone: the list first there.
  const usual = useMediaQuery(PHONE) ? "agenda" : "month";
  const view = get("view", usual);
  const m = get("month").match(/^(\d{4})-(\d{2})$/);
  const today = new Date();
  const year = m ? Number(m[1]) : today.getFullYear();
  const month = m ? Number(m[2]) - 1 : today.getMonth();
  const hidden = new Set(get("hide").split(",").filter(Boolean));
  const weekStart = weekStartOf(lang);
  const grid = monthGrid(year, month, weekStart);
  // The month's page, or the agenda's 8 weeks from a day ago.
  const from = view === "agenda" ? dayStart(today) - 86400 : dayStart(grid[0]);
  const to = view === "agenda" ? from + 57 * 86400 : dayStart(grid[grid.length - 1]) + 86400;
  const q = useApi<Range>("/calendar?" + new URLSearchParams({ from: String(from), to: String(to) }), { refetchInterval: 60000, placeholderData: (p) => p });
  const shift = (n: number) => set({ month: monthKey(new Date(year, month + n, 1)) === monthKey(today) ? null : monthKey(new Date(year, month + n, 1)) });
  const title = new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(new Date(year, month, 1));
  return (
    <div className="stack">
      <PageHead title={t("Calendar")} sub={t("Everything scheduled, to avoid clashes")}>
        <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
        <Segmented<string> name={t("View")} value={view} onChange={(v) => set({ view: v === usual ? null : v })}
          options={[["month", t("Month")], ["agenda", t("Agenda")]]} />
      </PageHead>
      <div className="toolbar">
        {view === "month" ? (
          <span className="row">
            <Btn label={t("Previous month")} kind="sm" icon={ChevronLeft} iconOnly onClick={() => shift(-1)} />
            <b className="month-title">{title.charAt(0).toUpperCase() + title.slice(1)}</b>
            <Btn label={t("Next month")} kind="sm" icon={ChevronRight} iconOnly onClick={() => shift(1)} />
            <Btn label={t("Today")} kind="sm ghost" onClick={() => set({ month: null })} />
          </span>
        ) : null}
        <div className="chips" role="group" aria-label={t("Show")}>
          {ALL.map((k) => {
            const [label, Icon, cls] = KINDS[k];
            const on = !hidden.has(k);
            return (
              <button key={k} type="button" role="checkbox" aria-checked={on} className={"chip cal-chip " + cls + (on ? " on" : "")}
                onClick={() => {
                  const next = new Set(hidden);
                  if (on) next.add(k);
                  else next.delete(k);
                  set({ hide: [...next].join(",") });
                }}>
                <Icon className="icon" aria-hidden />{t(label)}
              </button>
            );
          })}
        </div>
      </div>
      <Loaded queries={[q]}>
        {(d) => {
          const items = d.items.filter((i) => !hidden.has(i.kind));
          const found = clashes(items);
          const clashing = new Set(found.flatMap((c) => [itemKey(c.a), itemKey(c.b)]));
          return (
            <>
              {found.length ? <Clashes list={found} /> : null}
              {view === "agenda" ? <Agenda items={items} clashing={clashing} now={d.now} /> : (
                <MonthView grid={grid} month={month} items={items} clashing={clashing} weekStart={weekStart} />
              )}
            </>
          );
        }}
      </Loaded>
    </div>
  );
}

function Clashes({ list }: { list: Clash[] }) {
  const { t, tf, tn, fmtDate } = useLocale();
  return (
    <AlertBox tone="warning" title={tn(list.length, "{n} clash", "{n} clashes")}
      text={
        <ul className="clash-list">
          {list.slice(0, 8).map((c, k) => (
            <li key={k}>
              {c.why === "maintenance" ? t("During a maintenance:") : t("At the same time:")} <b>{c.a.title}</b> × <b>{c.b.title}</b>
              {" · "}{fmtDate(Math.max(c.a.starts_at, c.b.starts_at))}
            </li>
          ))}
          {list.length > 8 ? <li>{tf("and {n} more", { n: list.length - 8 })}</li> : null}
        </ul>
      } />
  );
}

function ItemChip({ i, clash, compact, day }: { i: CalendarItem; clash: boolean; compact?: boolean; day?: Date }) {
  const { t, fmtClock, fmtDate } = useLocale();
  const [label, Icon, cls, href] = KINDS[i.kind] || [i.kind, CalendarDays, "", "/admin/calendar"];
  const tip = [t(label), i.title, fmtDate(i.starts_at) + " → " + fmtDate(i.ends_at), clash ? t("Clashes with something else") : ""].filter(Boolean).join("\n");
  return (
    <Link href={href} className={"cal-item " + cls + (i.status === "cancelled" ? " off" : "") + (clash ? " clash" : "")} title={tip}>
      {clash ? <TriangleAlert className="icon" aria-hidden /> : <Icon className="icon" aria-hidden />}
      {compact ? null : <span className="ellipsis">{i.kind === "vip_item" ? "" : !day || dayStart(day) <= i.starts_at ? fmtClock(i.starts_at) + " " : "… "}{i.title}</span>}
    </Link>
  );
}

function MonthView({ grid, month, items, clashing, weekStart }: { grid: Date[]; month: number; items: CalendarItem[]; clashing: Set<string>; weekStart: number }) {
  const { t, tn, lang } = useLocale();
  const today = dayStart(new Date());
  const weekday = (d: number) => new Intl.DateTimeFormat(lang, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 10, 1 + d)));
  // Month-long things (VIP's items) on the first day only, the rest on each day they run.
  const onDay = (d: Date) => itemsOnDay(items, d).filter((i) => i.kind !== "vip_item" || dayStart(d) <= i.starts_at || d.getDate() === 1);
  return (
    <Card>
      <div className="cal-grid" role="grid" aria-label={t("Month")}>
        {weekOrder(weekStart).map((d) => <div key={d} className="cal-head" role="columnheader">{weekday(d)}</div>)}
        {grid.map((d) => {
          const list = onDay(d);
          const out = d.getMonth() !== month;
          const isToday = dayStart(d) === today;
          return (
            <div key={d.toISOString()} role="gridcell" className={"cal-day" + (out ? " out" : "") + (isToday ? " today" : "")}
              aria-label={d.toLocaleDateString(lang) + " · " + tn(list.length, "{n} thing", "{n} things")}>
              <span className="cal-date">{d.getDate()}</span>
              <div className="cal-items">
                {list.slice(0, 4).map((i) => <ItemChip key={itemKey(i)} i={i} day={d} clash={clashing.has(itemKey(i))} />)}
                {list.length > 4 ? <span className="faint cal-more">{tn(list.length - 4, "+{n} more", "+{n} more")}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Agenda({ items, clashing, now }: { items: CalendarItem[]; clashing: Set<string>; now: number }) {
  const { t, lang, fmtDate, ago } = useLocale();
  const list = items.filter((i) => i.ends_at > now - 86400).sort((a, b) => a.starts_at - b.starts_at);
  const byDay = new Map<string, CalendarItem[]>();
  for (const i of list) {
    const k = new Date(Math.max(i.starts_at, dayStart(new Date(now * 1000))) * 1000).toDateString();
    byDay.set(k, [...(byDay.get(k) || []), i]);
  }
  if (!list.length) return <Card><Empty icon={CalendarRange} title={t("Nothing scheduled")} text={t("The next eight weeks are free.")} /></Card>;
  return (
    <div className="stack">
      {[...byDay.entries()].map(([k, day]) => (
        <Card key={k}>
          <CardHead title={new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" }).format(new Date(k))} />
          <div className="mini-list">
            {day.map((i) => {
              const [label, Icon, cls, href] = KINDS[i.kind] || [i.kind, CalendarDays, "", "/admin/calendar"];
              const clash = clashing.has(itemKey(i));
              return (
                <Link key={itemKey(i)} href={href} className={"mi click agenda-row " + cls}>
                  <span className={"tl-dot cal-dot " + cls}><Icon className="icon" aria-hidden /></span>
                  <div className="mi-main">
                    <span className="row"><b>{i.title}</b><Badge>{t(label)}</Badge>{clash ? <Badge kind="warning" icon={TriangleAlert}>{t("Clash")}</Badge> : null}</span>
                    <span className="mi-sub">{fmtDate(i.starts_at) + " → " + fmtDate(i.ends_at)}</span>
                  </div>
                  <span className="mi-side row"><StatusBadge status={i.status} /><span>{ago(i.starts_at > now ? i.starts_at : i.ends_at)}</span></span>
                </Link>
              );
            })}
          </div>
        </Card>
      ))}
      <div className="hint row"><List className="icon" aria-hidden />{t("The next eight weeks, and what ended in the last day.")}</div>
    </div>
  );
}
