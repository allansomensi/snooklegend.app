import { api } from "./api";

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
