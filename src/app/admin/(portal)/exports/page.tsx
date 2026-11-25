"use client";

import { ChartColumn, Coins, CreditCard, Download, FileSpreadsheet, Lock, Trophy, Users, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { AlertBox, Btn, Card, Empty, PageHead } from "@/admin/components/ui/bits";
import { msg } from "@/admin/i18n";
import { downloadExport, type ExportKind } from "@/admin/lib/download";
import { useIsAdmin, useQueryParams } from "@/admin/lib/hooks";
import { exportRange, toDateInput } from "@/admin/lib/ops";
import "@/admin/styles/ops.css";

const KINDS: [ExportKind, LucideIcon, string, string][] = [
  ["players", Users, msg("Players"), msg("Accounts made in the range: name, country, role, when made and last seen, each rating and record.")],
  ["matches", Trophy, msg("Games"), msg("Games finished in the range: the players, rules, rated or not, the winner, how it ended, rating changes.")],
  ["purchases", CreditCard, msg("Purchases"), msg("Payments in the range: who, what, coins, amount and currency, refunded or test.")],
  ["ledger", Coins, msg("Coin ledger"), msg("Every coin credited or taken in the range, with the reason.")],
  ["daily", ChartColumn, msg("Daily numbers"), msg("A line per day: active players, games, new players, coins made and spent.")],
];

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toDateInput(d);
};

/** CSV files of the data for a range of days (administrators). */
export default function ExportsPage() {
  const { t, tf, fmtDateOnly } = useLocale();
  const admin = useIsAdmin();
  const { toast } = useToasts();
  const { get, set } = useQueryParams();
  const uid = useId();
  const from = get("from", day(-29));
  const to = get("to", day(0));
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const range = exportRange(from, to);
  const now = new Date();
  const presets: [string, string, string][] = [
    [t("Last 7 days"), day(-6), day(0)],
    [t("Last 30 days"), day(-29), day(0)],
    [t("This month"), toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)), day(0)],
    [t("Last month"), toDateInput(new Date(now.getFullYear(), now.getMonth() - 1, 1)), toDateInput(new Date(now.getFullYear(), now.getMonth(), 0))],
    [t("This year"), toDateInput(new Date(now.getFullYear(), 0, 1)), day(0)],
  ];
  const go = async (kind: ExportKind) => {
    if (!range || busy) return;
    setBusy(kind);
    try {
      await downloadExport(kind, range[0], range[1]);
      toast(t("Download started."));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    }
    setBusy(null);
  };
  if (!admin) {
    return (
      <div>
        <PageHead title={t("Exports")} />
        <Card><Empty icon={Lock} title={t("Visible to administrators only")} text={t("Exports hold players' data and money.")} /></Card>
      </div>
    );
  }
  return (
    <div className="stack">
      <PageHead title={t("Exports")} sub={t("The data as CSV, for a spreadsheet · every export is in the audit log")} />
      <Card>
        <div className="card-body stack">
          <div className="chips" role="group" aria-label={t("Quick picks")}>
            {presets.map(([label, a, b]) => (
              <button key={label} type="button" className={"chip" + (from === a && to === b ? " on" : "")} onClick={() => set({ from: a, to: b })}>{label}</button>
            ))}
          </div>
          <div className="row">
            <div className="field">
              <label className="label" htmlFor={uid + "-f"}>{t("From")}</label>
              <input id={uid + "-f"} className="input" type="date" value={from} max={to} onChange={(e) => set({ from: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor={uid + "-t"}>{t("To (included)")}</label>
              <input id={uid + "-t"} className="input" type="date" value={to} min={from} onChange={(e) => set({ to: e.target.value })} />
            </div>
          </div>
          {range ? (
            <div className="hint">{tf("From {from} to {to}, whole days in your time zone.", { from: fmtDateOnly(range[0]), to: fmtDateOnly(range[1] - 1) })}</div>
          ) : (
            <AlertBox tone="danger" title={t("Choose a first day before the last.")} />
          )}
        </div>
      </Card>
      <div className="grid-2">
        {KINDS.map(([kind, Icon, label, text]) => (
          <Card key={kind}>
            <div className="card-body export-card">
              <span className="event-icon info"><Icon className="icon" aria-hidden /></span>
              <div className="grow stack-tight-left">
                <b>{t(label)}</b>
                <span className="muted">{t(text)}</span>
                <span className="faint mono">{kind}.csv</span>
              </div>
              <Btn label={t("Download")} kind="primary" icon={busy === kind ? undefined : Download} busy={busy === kind} disabled={!range || (!!busy && busy !== kind)} onClick={() => void go(kind)} />
            </div>
          </Card>
        ))}
      </div>
      <div className="hint row"><FileSpreadsheet className="icon" aria-hidden />{t("Comma-separated, a header line, UTF-8; no cell is ever read as a formula.")}</div>
    </div>
  );
}
