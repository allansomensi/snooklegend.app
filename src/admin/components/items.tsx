"use client";

import { Check, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { msg } from "@/admin/i18n";
import { useApi } from "@/admin/lib/hooks";
import type { CatalogItem, Economy, ItemOrigin, Rarity } from "@/admin/lib/types";
import { useLocale } from "./providers/locale";
import "@/admin/styles/ops.css";

/** The shop's categories, in words. */
export const CATEGORY: Record<string, string> = {
  cloth: msg("Cloth"), cue: msg("Cue"), chalk: msg("Chalk"), balls: msg("Balls"), frame: msg("Frame"), name: msg("Name colour"),
  effect: msg("Win effect"), table: msg("Table"), hall: msg("Hall"), avatar: msg("Picture"), reaction: msg("Reaction"),
};

export const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary"];

export const RARITY: Record<Rarity, string> = {
  common: msg("Common"), rare: msg("Rare"), epic: msg("Epic"), legendary: msg("Legendary"),
};

/** How an item is had in the shop (the catalogue's `how`). */
export const HOW: Record<string, [string, string]> = {
  coins: [msg("Coins"), "accent"],
  free: [msg("Free"), ""],
  achievement: [msg("Achievement"), "info"],
  vip: [msg("VIP"), "warning"],
  pack: [msg("Welcome pack"), "success"],
  earned: [msg("Only won"), "danger"],
};

/** The ways a player gets an item (a collection's `origin.how`). */
export const ORIGIN_KIND: Record<string, string> = {
  bought: msg("Bought"), gift: msg("A present"), staff: msg("From the staff"), tournament: msg("A tournament"), achievement: msg("An achievement"),
  auction: msg("An auction"), vip_month: msg("VIP's item of the month"), event: msg("An event"), season: msg("A season"),
  welcome_pack: msg("The welcome pack"), unknown: msg("Not known"),
};

export function useItemWords() {
  const { t, tf, fmtNum } = useLocale();
  return {
    originKind: (how: string) => t(ORIGIN_KIND[how] || how),
    category: (c?: string | null) => (c ? t(CATEGORY[c] || c) : "—"),
    rarity: (r?: string | null) => (r && r in RARITY ? t(RARITY[r as Rarity]) : ""),
    /** How a player got an item, in a line. */
    origin(o: ItemOrigin) {
      switch (o.how) {
        case "bought": return o.price ? tf("Bought for {n} coins", { n: fmtNum(o.price) }) : t("Bought");
        case "gift": return o.from ? tf("A present from {name}", { name: o.from }) : t("A present");
        case "staff": return o.reason ? tf("From the staff: {reason}", { reason: o.reason }) : t("From the staff");
        case "tournament": return o.place === 1 ? tf("Champion of {name}", { name: o.name || "?" }) : tf("Place {n} in {name}", { n: o.place ?? "?", name: o.name || "?" });
        case "achievement": return tf("Achievement {code}", { code: o.code || "?" });
        case "auction": return o.price ? tf("Won at auction for {n} coins", { n: fmtNum(o.price) }) : t("Won at auction");
        case "vip_month": return tf("VIP's item of {month}", { month: o.month || "?" });
        case "event": return tf("Prize of the event {name}", { name: o.name || "?" });
        case "season": return tf("Prize of {name}", { name: o.name || "?" });
        case "welcome_pack": return t("The welcome pack");
        default: return t("From before origins were kept");
      }
    },
  };
}

/** A rarity's colour dot and name. */
export function RarityBadge({ rarity, short }: { rarity?: Rarity | string | null; short?: boolean }) {
  const { rarity: name } = useItemWords();
  if (!rarity) return null;
  return (
    <span className={"rarity r-" + rarity} title={name(rarity)}>
      <i aria-hidden />
      {short ? <span className="sr-only">{name(rarity)}</span> : name(rarity)}
    </span>
  );
}

/** An item by its code: its name in its rarity's colour, and the code. */
export function ItemLabel({ code, name, rarity, showCode = true }: { code: string; name?: string | null; rarity?: Rarity | string | null; showCode?: boolean }) {
  return (
    <span className="item-label">
      <b className={rarity ? "r-text r-" + rarity : ""}>{name || code}</b>
      {showCode && name ? <span className="faint mono">{code}</span> : null}
    </span>
  );
}

/** The shop's catalogue (with each item's rarity), kept a while. */
export function useCatalog() {
  return useApi<Economy>("/economy", { staleTime: 5 * 60000 });
}

/** An item in a picker. */
export interface PickItem {
  code: string;
  name: string;
  category?: string | null;
  rarity?: Rarity | null;
  price?: number | null;
  how?: string;
}

export const fromCatalog = (i: CatalogItem): PickItem => ({ code: i.code, name: i.name, category: i.category, rarity: i.rarity, price: i.coins, how: i.how });

/**
 * Items to choose from: a search, a category, and a list (one item, or
 * several with `multiple`). The rarity shows as a colour, the price in coins.
 */
export function ItemPicker({ items, value, onChange, multiple, label, height = 260 }: {
  items: PickItem[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multiple?: boolean;
  label: string;
  height?: number;
}) {
  const { t, tf, tn, fmtNum } = useLocale();
  const words = useItemWords();
  const uid = useId();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [rar, setRar] = useState("");
  const chosen = useMemo(() => new Set(Array.isArray(value) ? value : value ? [value] : []), [value]);
  const cats = useMemo(() => [...new Set(items.map((i) => i.category || ""))].filter(Boolean), [items]);
  const s = q.trim().toLowerCase();
  const list = items.filter(
    (i) => (!s || i.name.toLowerCase().includes(s) || i.code.toLowerCase().includes(s)) && (!cat || i.category === cat) && (!rar || i.rarity === rar),
  );
  const shown = list.slice(0, 200);
  const toggle = (code: string) => {
    if (!multiple) return onChange(code);
    const next = new Set(chosen);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange([...next]);
  };
  const byCode = new Map(items.map((i) => [i.code, i]));
  return (
    <div className="picker" role="group" aria-label={label}>
      {multiple && chosen.size ? (
        <div className="item-chips">
          {[...chosen].map((c) => {
            const i = byCode.get(c);
            return (
              <button key={c} type="button" className="item-chip plain picked" onClick={() => toggle(c)} title={t("Remove")}>
                <span className={"r-text r-" + (i?.rarity || "")}>{i?.name || c}</span>
                <span aria-hidden>×</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="picker-tools">
        <span className="picker-search">
          <Search className="icon" aria-hidden />
          <input className="input" type="search" placeholder={t("Item name or code")} aria-label={t("Search items")} value={q} onChange={(e) => setQ(e.target.value)} />
        </span>
        <select className="select" aria-label={t("Category")} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">{t("Every category")}</option>
          {cats.map((c) => <option key={c} value={c}>{words.category(c)}</option>)}
        </select>
        <select className="select" aria-label={t("Rarity")} value={rar} onChange={(e) => setRar(e.target.value)}>
          <option value="">{t("Any rarity")}</option>
          {RARITIES.map((r) => <option key={r} value={r}>{words.rarity(r)}</option>)}
        </select>
      </div>
      <div className="picker-list" role={multiple ? "group" : "radiogroup"} aria-label={label} style={{ maxHeight: height }}>
        {shown.map((i) => {
          const on = chosen.has(i.code);
          return (
            <button key={i.code} id={uid + i.code} type="button" role={multiple ? "checkbox" : "radio"} aria-checked={on}
              className={"picker-row" + (on ? " on" : "")} onClick={() => toggle(i.code)}>
              <span className="tick" aria-hidden>{on ? <Check className="icon" /> : null}</span>
              <span className={"rdot r-" + (i.rarity || "none")} aria-hidden />
              <span className="grow picker-name">
                <b>{i.name}</b>
                <span className="faint mono">{i.code}</span>
              </span>
              <span className="faint hide-xs">{words.category(i.category)}</span>
              <span className="num picker-price">{i.price ? fmtNum(i.price) : i.how && HOW[i.how] ? t(HOW[i.how][0]) : "—"}</span>
            </button>
          );
        })}
        {!shown.length ? <div className="hint picker-empty">{t("No item matches")}</div> : null}
      </div>
      <div className="hint">
        {list.length > shown.length ? tf("The first {n} of {total}: search to narrow.", { n: fmtNum(shown.length), total: fmtNum(list.length) }) : tn(list.length, "{n} item", "{n} items")}
        {multiple ? " · " + tn(chosen.size, "{n} chosen", "{n} chosen") : null}
      </div>
    </div>
  );
}
