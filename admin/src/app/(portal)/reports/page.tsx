"use client";

import { CircleCheck, Flag } from "lucide-react";
import { useLocale } from "@/components/providers/locale";
import { ReportCard } from "@/components/report-card";
import { REPORT_REASONS } from "@/components/report-reason";
import { Card, Empty, PageHead, Segmented, Updated } from "@/components/ui/bits";
import { Loaded, updatedAt } from "@/components/ui/loaded";
import { useApi, useDebouncedParam, useQueryParams } from "@/lib/hooks";
import type { Report } from "@/lib/types";
import "@/styles/moderation.css";

type Status = "open" | "actioned" | "dismissed" | "all";

export default function ReportsPage() {
  const { t, tn } = useLocale();
  const { get, set } = useQueryParams();
  const status = (get("status", "open") as Status) || "open";
  const reason = get("reason");
  const [who, setWho] = useDebouncedParam("q");
  const q = useApi<{ reports: Report[] }>("/reports?" + new URLSearchParams({ status }), { refetchInterval: 60000 });
  const term = get("q").toLowerCase();

  return (
    <div>
      <Loaded queries={[q]}>
        {(d) => {
          // (No inherited names: a player may be called "constructor".)
          const about: Record<string, number> = Object.create(null);
          for (const r of d.reports) about[r.target] = (about[r.target] || 0) + 1;
          const shown = d.reports.filter(
            (r) => (!reason || r.reason === reason) && (!term || r.target.toLowerCase().includes(term) || r.reporter.toLowerCase().includes(term)),
          );
          return (
            <>
              <PageHead
                title={t("Reports")}
                sub={status === "open" ? tn(d.reports.length, "{n} report waiting for review", "{n} reports waiting for review") : tn(d.reports.length, "{n} report", "{n} reports")}
              >
                <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
              </PageHead>
              <div className="toolbar">
                <Segmented<Status>
                  name={t("Status")}
                  value={status}
                  onChange={(v) => set({ status: v === "open" ? null : v })}
                  options={[["open", t("Open")], ["actioned", t("Action taken")], ["dismissed", t("Dismissed")], ["all", t("All")]]}
                />
                <select className="select" aria-label={t("Reason")} value={reason} onChange={(e) => set({ reason: e.target.value })}>
                  <option value="">{t("Every reason")}</option>
                  {REPORT_REASONS.map(([v, l]) => (
                    <option key={v} value={v}>{t(l)}</option>
                  ))}
                </select>
                <input className="input wide" type="search" placeholder={t("Player (reported or reporting)")} aria-label={t("Search")}
                  value={who} onChange={(e) => setWho(e.target.value)} />
              </div>
              {shown.length ? (
                <div className="stack">
                  {shown.map((r) => <ReportCard key={r.id} r={r} about={about[r.target]} />)}
                </div>
              ) : (
                <Card>
                  {status === "open" && !reason && !term ? (
                    <Empty icon={CircleCheck} title={t("All caught up")} text={t("No report waits for review.")} />
                  ) : (
                    <Empty icon={Flag} title={t("No reports here")} text={reason || term ? t("Try another name, or another filter.") : null} />
                  )}
                </Card>
              )}
            </>
          );
        }}
      </Loaded>
    </div>
  );
}
