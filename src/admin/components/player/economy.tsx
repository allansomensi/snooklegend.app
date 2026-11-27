"use client";

import { Coins, Gift, Lock, RefreshCw, Star, X } from "lucide-react";
import { api, seg } from "@/admin/lib/api";
import { nowSecs } from "@/admin/lib/format";
import { useIsAdmin } from "@/admin/lib/hooks";
import type { UserDetail } from "@/admin/lib/types";
import { usePlayerActions } from "../player-dialogs";
import { useRefresh } from "../providers";
import { useLocale } from "../providers/locale";
import { useToasts } from "../providers/toasts";
import { Badge, Btn, Card, CardHead, DataTable, Empty, Kpi } from "../ui/bits";

export function PlayerEconomy({ d }: { d: UserDetail }) {
  const { t, tf, fmtNum, fmtDate, fmtDateOnly, ago, money } = useLocale();
  const admin = useIsAdmin();
  const actions = usePlayerActions();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const u = d.user;
  const w = d.wallet;
  const vip = w.vip_until > nowSecs();
  const owned = w.owned || [];
  const msstore = d.msstore || [];
  const STATES: Record<string, [string, string]> = {
    done: [t("Done"), "success"], pending: [t("Pending"), "warning"], stuck: [t("Stuck"), "danger"], failed: [t("Failed"), "danger"],
  };
  return (
    <div className="stack">
      <div className="kpis">
        <Kpi label={t("Coins")} value={fmtNum(w.coins)} icon={Coins} tone="warning" />
        <Kpi label="VIP" value={vip ? t("Yes") : t("No")}
          sub={vip ? tf("until {when}", { when: fmtDateOnly(w.vip_until) }) : w.vip_until ? tf("ended {when}", { when: ago(w.vip_until) }) : null}
          icon={Star} tone={vip ? "success" : ""} />
        <Kpi label={t("Items")} value={fmtNum(owned.length)} icon={Gift} tone="info" />
        <Kpi label={t("Payments")} value={d.private_hidden ? "—" : fmtNum(d.payments.length)} sub={d.private_hidden ? t("Visible to administrators only") : null} icon={Coins} />
      </div>
      <Card>
        <CardHead title={t("Items owned")}>
          {admin ? (
            <>
              <Btn label={t("Coins")} kind="sm" icon={Coins} onClick={() => actions.coins(u)} />
              <Btn label={t("Item")} kind="sm" icon={Gift} onClick={() => void actions.item(u)} />
              <Btn label="VIP" kind="sm" icon={Star} onClick={() => actions.vip(u)} />
            </>
          ) : null}
        </CardHead>
        <div className="card-body">
          {owned.length ? (
            <ul className="item-chips">
              {owned.map((code) => (
                <li key={code} className={"item-chip" + (admin ? "" : " plain")}>
                  <span className="mono">{code}</span>
                  {admin ? <Btn label={tf("Take {item} back from {name}?", { item: code, name: u.username })} kind="sm ghost" icon={X} iconOnly onClick={() => actions.revoke(u, code)} /> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="faint">{t("No items.")}</p>
          )}
        </div>
      </Card>
      <Card>
        <CardHead title={t("Payments")} />
        {d.private_hidden ? (
          <Empty icon={Lock} title={t("Visible to administrators only")} />
        ) : d.payments.length ? (
          <DataTable lead={2} headers={[t("When"), t("What"), { label: t("Coins"), cls: "num" }, { label: t("Amount"), cls: "num" }, t("Status"), t("Payment"), ""]}>
            {d.payments.map((p) => (
              <tr key={p.id} className={p.test || p.refunded ? "dim" : ""}>
                <td className="nowrap">{fmtDate(p.at)}</td>
                <td>{p.kind === "vip" ? "VIP" : t("Coins")}</td>
                <td className="num">{fmtNum(p.coins)}</td>
                <td className="num">{money(p.amount, p.currency)}</td>
                <td>
                  <span className="badges">
                    {p.refunded ? <Badge kind="danger">{t("Refunded")}</Badge> : <Badge kind="success">{t("Paid")}</Badge>}
                    {p.test ? <Badge kind="warning">{t("Test")}</Badge> : null}
                  </span>
                </td>
                <td className="mono faint">{p.id}</td>
                <td className="actions-cell">
                  {admin ? <Btn label={p.test ? t("Mark as real") : t("Mark as test")} kind="sm ghost" onClick={() => void actions.markPayment(p)} /> : null}
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty icon={Coins} title={t("No payments")} />
        )}
      </Card>
      {msstore.length ? (
        <Card>
          <CardHead title={t("Microsoft Store purchases")} />
          <DataTable lead={2} headers={[t("Found"), t("Pack"), { label: t("Coins"), cls: "num" }, t("State"), { label: t("Tries"), cls: "num" }, t("Last error"), t("Orders"), ""]}>
            {msstore.map((r) => {
              const [label, tone] = STATES[r.state] || [r.state, "danger"];
              return (
                <tr key={r.tracking_id}>
                  <td className="nowrap">{fmtDate(r.created_at)}</td>
                  <td>{r.pack}</td>
                  <td className="num">{fmtNum(r.coins)}</td>
                  <td><Badge kind={tone}>{label}</Badge></td>
                  <td className="num">{fmtNum(r.attempts)}</td>
                  <td className="wrap faint">{r.last_error || ""}</td>
                  <td className="mono faint">{r.order_ids || ""}</td>
                  <td className="actions-cell">
                    {r.state === "stuck" && admin ? (
                      <Btn label={t("Send again")} kind="sm" icon={RefreshCw}
                        onClick={async () => {
                          if (await attempt(() => api("/msstore/" + seg(r.tracking_id) + "/retry", { method: "POST" }), t("Sent to Microsoft again."))) void refresh();
                        }} />
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </Card>
      ) : null}
      <Card>
        <CardHead title={t("Coin history")} sub={t("The latest 50 changes")} />
        {d.ledger.length ? (
          <DataTable headers={[t("When"), { label: t("Coins"), cls: "num" }, t("Why")]}>
            {d.ledger.map((l, k) => (
              <tr key={k}>
                <td className="nowrap">{fmtDate(l.at)}</td>
                <td className="num"><b className={"delta" + (l.delta > 0 ? " up" : l.delta < 0 ? " down" : "")}>{(l.delta > 0 ? "+" : "") + fmtNum(l.delta)}</b></td>
                <td className="wrap">{l.reason}</td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty icon={Coins} title={t("No coins moved yet")} />
        )}
      </Card>
    </div>
  );
}
