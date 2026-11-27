// The staff member's session: a bearer token kept for this tab only
// (sessionStorage, never a cookie, so there is no CSRF surface), and who
// they are. A small store React reads with useSyncExternalStore.
//
// A device kept signed in ("Keep me signed in on this device") also has a
// device token in localStorage: when the tab's session is missing or ends,
// it is traded for a new one (`resumeWithDevice` in api.ts), without the
// password or the code. The server forgets it after 30 days without use,
// or when it is signed out (here, in the account's page, or everywhere).
import type { Me } from "./types";

const KEY = "snook-legend-admin";
const DEVICE_KEY = "snook-legend-admin-device";

export interface SessionState {
  token: string;
  me: Me | null;
  /** Why the staff member was sent to the sign-in page, if not by choice. */
  notice: string | null;
}

/** A device kept signed in: its token (secret) and its id (shown in the
 * account's page to tell this device from the others). */
export interface DeviceKey {
  token: string;
  id: string;
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

function readDevice(): DeviceKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<DeviceKey>;
    return typeof d.token === "string" && /^[0-9a-f]{64}$/.test(d.token) ? { token: d.token, id: typeof d.id === "string" ? d.id : "" } : null;
  } catch {
    return null;
  }
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
  /** A new session for the same staff member (from the kept device): who
   * they are stays, so the page shown stays too. */
  renewed(token: string) {
    set({ token, notice: null });
  },
  known(me: Me) {
    set({ me });
  },
  /** Signs out: by choice (no notice) or because the session ended. */
  end(notice: string | null = null) {
    if (!state.token && !state.me && notice === state.notice) return;
    set({ token: "", me: null, notice });
  },
  /** The device kept signed in, if this one is. */
  device: readDevice,
  keepDevice(d: DeviceKey) {
    try {
      localStorage.setItem(DEVICE_KEY, JSON.stringify(d));
    } catch {
      /* private mode: kept for this session only */
    }
  },
  forgetDevice() {
    try {
      localStorage.removeItem(DEVICE_KEY);
    } catch {
      /* private mode */
    }
  },
};

const SERVER_STATE: SessionState = { token: "", me: null, notice: null };
export const serverSession = () => SERVER_STATE;

/** Whether the portal runs as an installed app (added to the home screen):
 * there, keeping the device signed in is what one expects. */
export function installedApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}
