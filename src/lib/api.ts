// Reading the game server's public API (`/api/…`) while rendering a page.
//
// The pages that show it are regenerated in the background at most once a
// minute (ISR): a visitor gets the last good page at once. The free server
// can take up to a minute to wake up, so a request waits for it; while
// building, where it may not be reachable at all, it waits only a little.

import { apiBase } from "@/admin/lib/config";

export type Fetched<T> =
  | { ok: true; data: T }
  /** `status` 404: there's no such thing; anything else (0: no answer): try again later. */
  | { ok: false; status: number };

/** How long the pages that show the server's data are kept before being made again. */
export const REVALIDATE = 60;

export const BUILDING = process.env.NEXT_PHASE === "phase-production-build";

export async function getJson<T>(
  path: string,
  parse: (data: unknown) => T | null,
  { timeout = BUILDING ? 8_000 : 45_000, revalidate = REVALIDATE }: { timeout?: number; revalidate?: number } = {},
): Promise<Fetched<T>> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      signal: AbortSignal.timeout(timeout),
      headers: { accept: "application/json" },
      next: { revalidate },
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = parse(await res.json());
    return data === null ? { ok: false, status: 502 } : { ok: true, data };
  } catch {
    return { ok: false, status: 0 };
  }
}

/**
 * A page that couldn't get its data: while building, it is made without it
 * (and made again a minute later); afterwards, the error keeps the last
 * good page in place (ISR serves it until a new one is made).
 */
export class ServerUnavailable extends Error {
  constructor(what: string, status: number) {
    super(`The game server didn't answer for ${what} (status ${status})`);
    this.name = "ServerUnavailable";
  }
}

// Small readers for the server's JSON: what isn't there (or is something
// else) becomes a sensible default, so a field the server adds or drops
// doesn't break a page.
export type Obj = Record<string, unknown>;
export const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
export const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
export const num = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
export const numOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
export const strOrNull = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
export const bool = (v: unknown): boolean => v === true;
export const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
