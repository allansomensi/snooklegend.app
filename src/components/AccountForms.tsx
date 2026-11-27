"use client";

// The account pages' forms: they call the game server's account API from
// the browser (`/api/account/…`, see crates/server/src/recovery.rs in the
// game's repository), which answers only this site's origin. The token of
// an e-mailed link travels after `#` (never sent to any server by the
// browser), is read once and taken out of the address bar.
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { apiBase } from "@/admin/lib/config";
import { fmt, type Dict } from "@/i18n";

type T = Dict["account"];
type ErrorCode = keyof T["errors"];

const input =
  "w-full rounded-xl bg-ink-950/70 px-4 py-3 text-[17px] text-cream ring-1 ring-white/[0.1] outline-none transition focus:ring-2 focus:ring-gold-400/70";
const label = "text-[13px] font-semibold text-mist";

/** The token read from the address, kept for this page (React runs an
 * effect twice in development, and the address no longer has it then). */
let lastToken: string | null = null;

/** The token in the address (`#token=…`), taken out of it. */
function takeToken(): string | null {
  const m = /(?:^#|&)token=([0-9a-f]{64})(?:&|$)/.exec(window.location.hash);
  if (m) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    lastToken = m[1];
  }
  return lastToken;
}

/** A link opened in a tab already on the page changes only the `#…`. */
function onHashChange(changed: () => void) {
  window.addEventListener("hashchange", changed);
  return () => window.removeEventListener("hashchange", changed);
}

/** The link's token: none while the page is prerendered, then the one in
 * the address (or null). */
function useToken(): string | null | undefined {
  return useSyncExternalStore(onHashChange, takeToken, () => undefined);
}

/** A link's token is used once: the same request, however often asked. */
const confirming = new Map<string, ReturnType<typeof post>>();

/** A request to the account API: the answer, or an error code. */
async function post(path: string, body: unknown): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; code: ErrorCode }> {
  let res: Response;
  try {
    res = await fetch(`${apiBase()}/api/account/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      credentials: "omit",
    });
  } catch {
    return { ok: false, code: "network" };
  }
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    /* no body */
  }
  if (res.ok) return { ok: true, data };
  const known: ErrorCode[] = ["weak_password", "invalid_token", "rate_limited", "unavailable", "bad_request"];
  const code = known.find((c) => c === data.code) ?? (res.status === 429 ? "rate_limited" : "unavailable");
  return { ok: false, code };
}

function Notice({ tone, children }: { tone: "ok" | "error"; children: ReactNode }) {
  const look = tone === "ok" ? "bg-felt-500/15 text-cream ring-felt-400/40" : "bg-red-500/10 text-red-200 ring-red-400/40";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-[15px] leading-relaxed ring-1 ${look}`}>
      {children}
    </div>
  );
}

/** "{support}" in a sentence, as a link when it is an e-mail or an address. */
function WithSupport({ text, support }: { text: string; support: string }) {
  const [before, after] = text.split("{support}");
  const href = support.includes("@") && !support.includes("://") ? `mailto:${support}` : support.startsWith("http") ? support : null;
  return (
    <>
      {before}
      {href ? (
        <a className="text-gold-300 underline underline-offset-2" href={href}>
          {support}
        </a>
      ) : (
        support
      )}
      {after ?? ""}
    </>
  );
}

/** Asking for a link, or (with a link's token) choosing the new password. */
export function ResetPasswordForm({ t, lang, support }: { t: T; lang: string; support: string }) {
  const linked = useToken();
  // "Ask for a new link" leaves this link's token behind (a newer link opened
  // after that is used).
  const [leftBehind, setLeftBehind] = useState<string | null>(null);
  const token = linked && linked === leftBehind ? null : linked;
  if (token === undefined) return <div className="h-40" aria-hidden />;
  return token ? (
    <NewPassword key={token} t={t} token={token} onRestart={() => setLeftBehind(token)} />
  ) : (
    <AskForLink t={t} lang={lang} support={support} />
  );
}

function AskForLink({ t, lang, support }: { t: T; lang: string; support: string }) {
  const id = useId();
  const [login, setLogin] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<ErrorCode | null>(null);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => field.current?.focus(), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!login.trim()) {
      setError("bad_request");
      return;
    }
    setError(null);
    setState("sending");
    const r = await post("forgot", { login: login.trim(), lang });
    if (r.ok) setState("sent");
    else {
      setError(r.code);
      setState("idle");
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card noise grid gap-5 p-6 ring-1 ring-white/[0.05] sm:p-8">
      {state === "sent" ? (
        <>
          <Notice tone="ok">{t.reset.sent}</Notice>
          <p className="text-[14.5px] leading-relaxed text-mist">
            <WithSupport text={t.reset.noEmail} support={support} />
          </p>
        </>
      ) : (
        <>
          <div>
            <label htmlFor={id} className={label}>
              {t.reset.login}
            </label>
            <input
              ref={field}
              id={id}
              className={`${input} mt-1.5`}
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={254}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
          {error && <Notice tone="error">{t.errors[error]}</Notice>}
          <button type="submit" disabled={state === "sending"} className="btn btn-gold h-12 px-6 text-[15px] disabled:opacity-60">
            {state === "sending" ? t.reset.sending : t.reset.send}
          </button>
        </>
      )}
    </form>
  );
}

function NewPassword({ t, token, onRestart }: { t: T; token: string; onRestart: () => void }) {
  const ids = { pass: useId(), again: useId() };
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<ErrorCode | "mismatch" | null>(null);
  const [name, setName] = useState("");
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => first.current?.focus(), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8 || /^\d+$/.test(password)) {
      setError("weak_password");
      return;
    }
    if (password !== again) {
      setError("mismatch");
      return;
    }
    setError(null);
    setState("saving");
    const r = await post("reset", { token, password });
    if (r.ok) {
      setName(String(r.data.username ?? ""));
      setPassword("");
      setAgain("");
      setState("done");
    } else {
      setError(r.code);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="card noise grid gap-5 p-6 ring-1 ring-white/[0.05] sm:p-8">
        <Notice tone="ok">{fmt(t.reset.done, { name })}</Notice>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="card noise grid gap-5 p-6 ring-1 ring-white/[0.05] sm:p-8">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-cream">{t.reset.newHeading}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-mist">{t.reset.newSub}</p>
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={ids.pass} className={label}>
            {t.reset.password}
          </label>
          <button type="button" onClick={() => setShow((s) => !s)} className="text-[13px] font-semibold text-gold-300 hover:underline">
            {show ? t.reset.hide : t.reset.show}
          </button>
        </div>
        <input
          ref={first}
          id={ids.pass}
          type={show ? "text" : "password"}
          className={`${input} mt-1.5`}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={ids.again} className={label}>
          {t.reset.repeat}
        </label>
        <input
          id={ids.again}
          type={show ? "text" : "password"}
          className={`${input} mt-1.5`}
          autoComplete="new-password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
        />
      </div>
      {error && <Notice tone="error">{error === "mismatch" ? t.reset.mismatch : t.errors[error]}</Notice>}
      <button type="submit" disabled={state === "saving"} className="btn btn-gold h-12 px-6 text-[15px] disabled:opacity-60">
        {state === "saving" ? t.reset.saving : t.reset.save}
      </button>
      {error === "invalid_token" && (
        <button type="button" onClick={onRestart} className="justify-self-center text-[14px] font-semibold text-gold-300 hover:underline">
          {t.reset.again}
        </button>
      )}
    </form>
  );
}

/** Confirms the recovery e-mail with the link's token, as the page opens. */
export function ConfirmEmailForm({ t }: { t: T }) {
  const token = useToken();
  const [answer, setAnswer] = useState<{ kind: "done"; email: string; name: string } | { kind: "error"; code: ErrorCode } | null>(null);
  useEffect(() => {
    if (!token) return;
    let live = true;
    if (!confirming.has(token)) confirming.set(token, post("confirm-email", { token }));
    void confirming.get(token)!.then((r) => {
      if (!live) return;
      setAnswer(r.ok ? { kind: "done", email: String(r.data.email ?? ""), name: String(r.data.username ?? "") } : { kind: "error", code: r.code });
    });
    return () => {
      live = false;
    };
  }, [token]);
  const state = answer ?? (token === null ? { kind: "none" as const } : { kind: "checking" as const });
  return (
    <div className="card noise grid gap-5 p-6 ring-1 ring-white/[0.05] sm:p-8" aria-live="polite">
      {state.kind === "checking" && <p className="text-[15px] text-mist">{t.confirm.checking}</p>}
      {state.kind === "done" && <Notice tone="ok">{fmt(t.confirm.done, { email: state.email, name: state.name })}</Notice>}
      {state.kind === "error" && <Notice tone="error">{t.errors[state.code]}</Notice>}
      {state.kind === "none" && <p className="text-[15px] text-mist">{t.confirm.noToken}</p>}
    </div>
  );
}
