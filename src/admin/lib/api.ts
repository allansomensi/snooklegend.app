// The game server's staff API (/admin/api), with the staff member's bearer
// token. Errors carry the server's own words, translated.
import { apiBase } from "./config";
import { session } from "./session";

export class ApiError extends Error {
  constructor(
    message: string,
    /** The HTTP status; 0 when the server couldn't be reached. */
    public status: number,
  ) {
    super(message);
  }
}

type Translate = { t: (s: string) => string; tf: (s: string, v: Record<string, string | number>) => string };
/** The words of the language chosen (set by the preferences provider). */
let words: Translate = { t: (s) => s, tf: (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m)) };
export const setApiWords = (w: Translate) => {
  words = w;
};

export interface ApiOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { t, tf } = words;
  const token = session.token();
  let res: Response;
  try {
    res = await fetch(apiBase() + "/admin/api" + path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      credentials: "omit",
      signal: options.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(t("Can't reach the server. Check the connection and try again."), 0);
  }
  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    /* no body, or not JSON */
  }
  if (!data || typeof data !== "object") data = {};
  // The server's own words when it sent them. A body that isn't JSON (a
  // request the server couldn't read, a proxy's page) gets the general one.
  const error = (data as { error?: unknown }).error;
  const said = typeof error === "string" && error ? error : null;
  if (res.status === 401 && path !== "/login") {
    session.end(t("Your session expired. Sign in again."));
    throw new ApiError(said ? t(said) : t("Your session expired."), 401);
  }
  if (!res.ok) {
    throw new ApiError(said ? t(said) : tf("Something went wrong ({status}).", { status: res.status }), res.status);
  }
  return data as T;
}

/** A path segment, escaped. */
export const seg = (s: string | number) => encodeURIComponent(String(s));
