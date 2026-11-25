"use client";

import { Gift, Lock, Package } from "lucide-react";
import { useMemo } from "react";
import { seg } from "@/admin/lib/api";
import { useApi, useIsAdmin, useQueryParams } from "@/admin/lib/hooks";
import type { Collection, UserDetail } from "@/admin/lib/types";
import { RARITIES, RarityBadge, useItemWords } from "../items";
import { usePlayerActions } from "../player-dialogs";
import { useLocale } from "../providers/locale";
import { Badge, Btn, Card, CardHead, Empty, Kpi } from "../ui/bits";
import { Loaded } from "../ui/loaded";
import "@/admin/styles/ops.css";

/** Everything the player has, with how and when they got it. */
export function PlayerCollection({ d }: { d: UserDetail }) {
  const q = useApi<Collection>("/users/" + seg(d.user.username) + "/collection");
  return <Loaded queries={[q]}>{(c) => <CollectionView c={c} d={d} />}</Loaded>;
}

function CollectionView({ c, d }: { c: Collection; d: UserDetail }) {
  const { t, tn, fmtNum, fmtDateOnly } = useLocale();
  const admin = useIsAdmin();
  const actions = usePlayerActions();
  const words = useItemWords();
  const { get, set } = useQueryParams();
  const u = d.user;
  const cat = get("cat");
  const rar = get("rarity");
  const how = get("how");
  const items = useMemo(() => [...c.items].sort((a, b) => b.acquired_at - a.acquired_at), [c.items]);
  const cats = [...new Set(items.map((i) => i.category))];
  const hows = [...new Set(items.map((i) => i.origin.how))];
  const list = items.filter((i) => (!cat || i.category === cat) && (!rar || i.rarity === rar) && (!how || i.origin.how === how));
  const count = (r: string) => items.filter((i) => i.rarity === r).length;
  return (
    <div className="stack">
      <div className="kpis">
        <Kpi label={t("Items")} value={fmtNum(items.length)} sub={tn(items.filter((i) => i.bound).length, "{n} bound to them", "{n} bound to them")} icon={Package} tone="info" />
        {RARITIES.slice(1).map((r) => (
          <Kpi key={r} label={words.rarity(r)} value={fmtNum(count(r))} icon={Gift} tone={r === "legendary" ? "warning" : r === "epic" ? "danger" : "info"} />
        ))}
      </div>
      <Card>
        <CardHead title={t("Collection")} sub={t("Free items and those VIP members use while VIP are not listed")}>
          {admin && !u.deleted_at ? <Btn label={t("Give an item")} kind="sm" icon={Gift} onClick={() => void actions.item(u)} /> : null}
        </CardHead>
        {items.length ? (
          <>
            <div className="card-body toolbar-in row">
              <select className="select" aria-label={t("Category")} value={cat} onChange={(e) => set({ cat: e.target.value })}>
                <option value="">{t("Every category")}</option>
                {cats.map((x) => <option key={x} value={x}>{words.category(x)}</option>)}
              </select>
              <select className="select" aria-label={t("Rarity")} value={rar} onChange={(e) => set({ rarity: e.target.value })}>
                <option value="">{t("Any rarity")}</option>
                {RARITIES.map((r) => <option key={r} value={r}>{words.rarity(r)}</option>)}
              </select>
              <select className="select" aria-label={t("How they got it")} value={how} onChange={(e) => set({ how: e.target.value })}>
                <option value="">{t("Any way")}</option>
                {hows.map((h) => <option key={h} value={h}>{words.originKind(h)}</option>)}
              </select>
            </div>
            <div className="card-body">
              {list.length ? (
                <div className="item-grid">
                  {list.map((i) => (
                    <div key={i.code} className={"item-tile r-" + (i.rarity || "none")}>
                      <span className="bar" aria-hidden />
                      <div className="it-main">
                        <span className="row between">
                          <b className={"r-text r-" + (i.rarity || "")}>{i.name || i.code}</b>
                          {i.bound ? <Badge icon={Lock} title={t("Can't be given nor put up for auction")}>{t("Bound")}</Badge> : null}
                        </span>
                        <span className="row">
                          <RarityBadge rarity={i.rarity} />
                          <span className="faint">{words.category(i.category)}</span>
                          <span className="faint mono">{i.code}</span>
                        </span>
                        <span className="it-origin">{words.origin(i.origin)}</span>
                        <span className="faint">{i.acquired_at ? fmtDateOnly(i.acquired_at) : t("date not known")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon={Package} title={t("No item matches")} />
              )}
            </div>
          </>
        ) : (
          <Empty icon={Package} title={t("Nothing in their collection")} text={t("Items bought, won or given show up here with how they got them.")} />
        )}
      </Card>
    </div>
  );
}
