import { api, apiFile } from "./api";

/** Saves a file made in the page (a replay, the audit log as CSV). */
export function saveFile(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** A stored game as a file (the strokes). */
export async function downloadReplay(id: number) {
  const r = await api("/replay/" + id);
  saveFile("snook-legend-game-" + id + ".json", new Blob([JSON.stringify(r, null, 2)], { type: "application/json" }));
}

/** What the CSV exports hold (`GET /admin/api/export/{kind}.csv`). */
export const EXPORTS = ["players", "matches", "purchases", "ledger", "daily"] as const;
export type ExportKind = (typeof EXPORTS)[number];

const day = (secs: number) => {
  const d = new Date(secs * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** The file's name: what it holds and its days ("…-2026-11-01-2026-11-30.csv"). */
export const exportName = (kind: ExportKind, from: number, to: number) => `snook-legend-${kind}-${day(from)}-${day(to - 1)}.csv`;

/** An export as a file: fetched with the session's token (a plain link
 * would carry none), then saved. `from`/`to`: Unix seconds, `to` excluded. */
export async function downloadExport(kind: ExportKind, from: number, to: number) {
  const blob = await apiFile("/export/" + kind + ".csv?" + new URLSearchParams({ from: String(from), to: String(to) }));
  saveFile(exportName(kind, from, to), blob);
}
