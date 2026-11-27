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

/** The sign-in's own requests: a 401 there is a wrong password or code. */
const SIGN_IN = new Set(["/login", "/login/code", "/login/device"]);

let resuming: Promise<boolean> | null = null;

/** Trades the device kept signed in for a new session (one request at a
 * time, however many pages ask). False without one, or when the server no
 * longer knows it (it is then forgotten here). */
export function resumeWithDevice(): Promise<boolean> {
  if (resuming) return resuming;
  const device = session.device();
  if (!device) return Promise.resolve(false);
  resuming = (async () => {
    try {
      const res = await fetch(apiBase() + "/admin/api/login/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device: device.token }),
        cache: "no-store",
        credentials: "omit",
      });
      if (res.ok) {
        const d = (await res.json()) as { token?: string; device_id?: string };
        if (!d.token) return false;
        if (session.get().me) session.renewed(d.token);
        else session.signedIn(d.token);
        if (d.device_id && d.device_id !== device.id) session.keepDevice({ token: device.token, id: d.device_id });
        return true;
      }
      // Signed out, unused for 30 days, or no longer staff: the password again.
      if (res.status === 401 || res.status === 403) {
        session.forgetDevice();
        session.end(words.t("This device was signed out (or unused for 30 days). Sign in again."));
      }
      return false;
    } catch {
      // No connection: the device stays kept for the next try.
      return false;
    } finally {
      resuming = null;
    }
  })();
  return resuming;
}

/** Signs out of the portal on this device: its session ends and, when it
 * was kept signed in, the device too. */
export async function signOutHere() {
  const device = session.device();
  session.forgetDevice();
  if (session.token()) {
    if (device?.id) await api("/security/devices/" + seg(device.id), { method: "DELETE" }).catch(() => {});
    await api("/logout", { method: "POST" }).catch(() => {});
  }
  session.end(null);
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  return request<T>(path, options, true);
}

async function request<T>(path: string, options: ApiOptions, mayResume: boolean): Promise<T> {
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
  if (res.status === 401 && !SIGN_IN.has(path)) {
    // The tab's session ended: a device kept signed in gets a new one, and
    // the request is made again.
    if (mayResume && token && (await resumeWithDevice())) return request<T>(path, options, false);
    if (session.token() === token) session.end(t("Your session expired. Sign in again."));
    throw new ApiError(said ? t(said) : t("Your session expired."), 401);
  }
  if (!res.ok) {
    throw new ApiError(said ? t(said) : tf("Something went wrong ({status}).", { status: res.status }), res.status);
  }
  return data as T;
}

/** A file from the staff API (a CSV export): the body as it came, with
 * the bearer token. Errors as `api`'s. */
export async function apiFile(path: string, signal?: AbortSignal, mayResume = true): Promise<Blob> {
  const { t, tf } = words;
  const token = session.token();
  let res: Response;
  try {
    res = await fetch(apiBase() + "/admin/api" + path, {
      headers: token ? { Authorization: "Bearer " + token } : {},
      cache: "no-store",
      credentials: "omit",
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(t("Can't reach the server. Check the connection and try again."), 0);
  }
  if (res.ok) return res.blob();
  let said: string | null = null;
  try {
    const data = await res.json();
    if (data && typeof data.error === "string" && data.error) said = data.error;
  } catch {
    /* not JSON */
  }
  if (res.status === 401) {
    if (mayResume && token && (await resumeWithDevice())) return apiFile(path, signal, false);
    if (session.token() === token) session.end(t("Your session expired. Sign in again."));
    throw new ApiError(said ? t(said) : t("Your session expired."), 401);
  }
  throw new ApiError(said ? t(said) : tf("Something went wrong ({status}).", { status: res.status }), res.status);
}

/** A path segment, escaped. */
export const seg = (s: string | number) => encodeURIComponent(String(s));
