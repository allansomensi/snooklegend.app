"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Download, FileText, X } from "lucide-react";
import { AUDIT, PLAYER_ACTIONS, auditLook, useAuditWords } from "@/admin/components/audit";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { Badge, Btn, Card, DataTable, Empty, ErrorPage, PageHead, PageLoading, PersonLink } from "@/admin/components/ui/bits";
import { api } from "@/admin/lib/api";
import { saveFile } from "@/admin/lib/download";
import { useDebouncedParam, useQueryParams } from "@/admin/lib/hooks";
import type { AuditEntry } from "@/admin/lib/types";
import "@/admin/styles/business.css";

interface AuditPage {
  entries: AuditEntry[];
  next?: number | null;
}

/** The log as a spreadsheet: never a formula in a cell. */
function exportCsv(entries: AuditEntry[]) {
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const lines = [["id", "when", "staff", "action", "target", "details"].join(",")].concat(
    entries.map((e) => [e.id, new Date(e.at * 1000).toISOString(), e.staff, e.action, e.target, e.details].map(cell).join(",")),
  );
  saveFile("snook-legend-audit-" + new Date().toISOString().slice(0, 10) + ".csv", new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
}

export default function AuditPage() {
  const { t, tf, tn, lang, fmtDate } = useLocale();
  const { toast } = useToasts();
  const { get, set } = useQueryParams();
  const { auditLabel, auditTarget } = useAuditWords();
  const [search, setSearch] = useDebouncedParam("q", 350);
  const q = get("q");
  const action = get("action");
  const target = get("target");

  const log = useInfiniteQuery({
    queryKey: ["/audit", q, action, target],
    initialPageParam: null as number | null,
    queryFn: ({ pageParam, signal }) =>
      api<AuditPage>("/audit?" + new URLSearchParams({ q, action, target, ...(pageParam ? { before: String(pageParam) } : {}) }), { signal }),
    getNextPageParam: (last) => last.next ?? undefined,
    placeholderData: (prev) => prev,
  });

  const entries = log.data?.pages.flatMap((p) => p.entries) ?? [];
  const actions = Object.keys(AUDIT).sort((a, b) => auditLabel(a).localeCompare(auditLabel(b), lang));
  const loadMore = async () => {
    const r = await log.fetchNextPage();
    if (r.isError) toast(r.error instanceof Error ? r.error.message : String(r.error), "error");
  };

  let body;
  if (log.isError && !log.data) body = <ErrorPage error={log.error} onRetry={() => void log.refetch()} />;
  else if (!log.data) body = <PageLoading />;
  else
    body = (
      <Card className={log.isFetching && !log.isFetchingNextPage ? "loading-soft" : ""}>
        {entries.length ? (
          <>
            <DataTable headers={[t("When"), t("Staff"), t("Action"), t("Target"), t("Details")]}>
              {entries.map((e) => {
                const [tone, Icon] = auditLook(e.action);
                const login = e.action === "login";
                return (
                  <tr key={e.id}>
                    <td className="nowrap">{fmtDate(e.at)}</td>
                    <td><PersonLink name={e.staff} /></td>
                    <td><Badge kind={tone} icon={Icon}>{auditLabel(e.action)}</Badge></td>
                    <td>
                      {PLAYER_ACTIONS.has(e.action) && e.target ? (
                        <PersonLink name={e.target} avatar={false} />
                      ) : (
                        <span className={/^#?\d+$/.test(e.target || "") ? "mono" : ""}>{login ? "—" : auditTarget(e)}</span>
                      )}
                    </td>
                    {/* Moderators get no address for a sign-in: nothing to show then. */}
                    <td className="wrap muted">{login ? (e.details ? tf("from {ip}", { ip: e.details }) : null) : e.details}</td>
                  </tr>
                );
              })}
            </DataTable>
            <div className="pager">
              <span>{tn(entries.length, "{n} entry shown", "{n} entries shown")}</span>
              <div className="row">
                <Btn label={t("Export CSV")} kind="sm" icon={Download} onClick={() => exportCsv(entries)} />
                {log.hasNextPage ? <Btn label={t("Load more")} kind="sm primary" busy={log.isFetchingNextPage} onClick={() => void loadMore()} /> : null}
              </div>
            </div>
          </>
        ) : (
          <Empty icon={FileText} title={t("Nothing found")} text={q || action || target ? t("Try other words or another action.") : t("Every staff action is written here.")} />
        )}
      </Card>
    );

  return (
    <div>
      <PageHead title={t("Audit log")} sub={t("Every staff action, newest first")} />
      <div className="toolbar">
        <input className="input wide" type="search" placeholder={t("Staff, player or words")} aria-label={t("Search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" aria-label={t("Action")} value={action} onChange={(e) => set({ action: e.target.value })}>
          <option value="">{t("Every action")}</option>
          {actions.map((a) => <option key={a} value={a}>{auditLabel(a)}</option>)}
        </select>
        {target ? (
          <span className="badge accent">
            {tf("Player: {name}", { name: target })}
            <Btn label={t("Clear")} kind="sm ghost" icon={X} iconOnly onClick={() => set({ target: null })} />
          </span>
        ) : null}
      </div>
      {body}
    </div>
  );
}
