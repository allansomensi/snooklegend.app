"use client";

import { Eye, EyeOff, Lock, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale } from "@/admin/components/providers/locale";
import { BrandMark } from "@/admin/components/shell/shell";
import { Spinner } from "@/admin/components/ui/bits";
import { LANGS } from "@/admin/i18n";
import { api } from "@/admin/lib/api";
import { useSession } from "@/admin/lib/hooks";
import { session } from "@/admin/lib/session";

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

/** Where to go after signing in: a page of the portal only. */
function safeNext(next: string | null) {
  return next && next.startsWith("/admin/") && !next.startsWith("/admin/login") ? next : "/admin/dashboard";
}

function Login() {
  const { t, lang, setLang } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const { token, notice } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const user = useRef<HTMLInputElement>(null);
  const pass = useRef<HTMLInputElement>(null);
  const next = safeNext(params.get("next"));

  // Already signed in (another tab of this session): straight in.
  useEffect(() => {
    if (token) router.replace(next);
  }, [token, next, router]);
  useEffect(() => {
    user.current?.focus();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError(t("Enter your username and password."));
      (username.trim() ? pass : user).current?.focus();
      return;
    }
    setSending(true);
    try {
      const d = await api<{ token: string }>("/login", { method: "POST", body: { username: username.trim(), password } });
      setPassword("");
      session.signedIn(d.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSending(false);
      pass.current?.select();
    }
  }

  const shown = error || notice;
  return (
    <div className="login">
      <form className="login-card" noValidate onSubmit={submit}>
        <div className="login-brand">
          <BrandMark />
          <div>
            <h1>Snook Legend</h1>
            <p>{t("Staff portal")}</p>
          </div>
        </div>
        <p className="muted">{t("Sign in with your game account. Only moderators and administrators have access.")}</p>
        {shown ? (
          <div className={"alert " + (error ? "danger" : "warning")} role="alert">
            <TriangleAlert className="icon" aria-hidden />
            <div>{shown}</div>
          </div>
        ) : null}
        <div className="field">
          <label className="label" htmlFor="login-user">{t("Username")}</label>
          <input ref={user} id="login-user" className="input" autoComplete="username" required spellCheck={false}
            value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="login-pass">{t("Password")}</label>
          <div className="pass-wrap">
            <input ref={pass} id="login-pass" className="input" type={show ? "text" : "password"} autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="btn ghost icon-only" aria-label={show ? t("Hide password") : t("Show password")}
              title={show ? t("Hide password") : t("Show password")} onClick={() => setShow((s) => !s)}>
              {show ? <EyeOff className="icon" aria-hidden /> : <Eye className="icon" aria-hidden />}
            </button>
          </div>
        </div>
        <button className="btn primary login-submit" type="submit" disabled={sending}>
          {sending ? <><Spinner />{t("Signing in…")}</> : t("Sign in")}
        </button>
        <div className="login-foot">
          <span className="row"><Lock className="icon" aria-hidden />{t("Sessions end after 8 hours.")}</span>
          <select className="select" aria-label={t("Language")} value={lang} onChange={(e) => setLang(e.target.value as typeof lang)}>
            {LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </div>
      </form>
    </div>
  );
}
