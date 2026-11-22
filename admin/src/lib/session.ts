// The staff member's session: a bearer token kept for this tab only
// (sessionStorage, never a cookie, so there is no CSRF surface), and who
// they are. A small store React reads with useSyncExternalStore.
import type { Me } from "./types";

const KEY = "snook-legend-admin";

export interface SessionState {
  token: string;
  me: Me | null;
  /** Why the staff member was sent to the sign-in page, if not by choice. */
  notice: string | null;
}

let state: SessionState = { token: "", me: null, notice: null };
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = { ...state, token: sessionStorage.getItem(KEY) || "" };
  } catch {
    /* private mode */
  }
}

function set(next: Partial<SessionState>) {
  state = { ...state, ...next };
  try {
    if (state.token) sessionStorage.setItem(KEY, state.token);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
  for (const l of listeners) l();
}

export const session = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get(): SessionState {
    load();
    return state;
  },
  token: () => session.get().token,
  signedIn(token: string) {
    set({ token, me: null, notice: null });
  },
  known(me: Me) {
    set({ me });
  },
  /** Signs out: by choice (no notice) or because the session ended. */
  end(notice: string | null = null) {
    if (!state.token && !state.me) return;
    set({ token: "", me: null, notice });
  },
};

const SERVER_STATE: SessionState = { token: "", me: null, notice: null };
export const serverSession = () => SERVER_STATE;
