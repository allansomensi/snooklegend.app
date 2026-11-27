"use client";

import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useLocale } from "@/admin/components/providers/locale";
import { CodeField, RecoveryCodes, SetupSteps } from "@/admin/components/security/two-step";
import { BrandMark } from "@/admin/components/shell/shell";
import { Spinner } from "@/admin/components/ui/bits";
import { LANGS, type Lang } from "@/admin/i18n";
import { api, ApiError } from "@/admin/lib/api";
import { useSession } from "@/admin/lib/hooks";
import { installedApp, session } from "@/admin/lib/session";
import "@/admin/styles/security.css";

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

const noSubscription = () => () => {};

/** The website's page for a forgotten password, in the portal's language. */
function forgotPasswordHref(lang: Lang) {
  return lang === "pt-BR" ? "/pt/redefinir-senha/" : lang === "es" ? "/es/restablecer-contrasena/" : "/reset-password/";
}

interface FirstStep {
  step: "code" | "setup";
  ticket: string;
  secret?: string;
  uri?: string;
}

interface Signed {
  token: string;
  device?: string;
  device_id?: string;
  recovery_codes?: string[];
  codes_left?: number;
  user?: { username?: string };
}

type Step =
  | { kind: "password" }
  | { kind: "code"; ticket: string }
  | { kind: "setup"; ticket: string; secret: string; uri: string }
  | { kind: "codes"; signed: Signed; username: string }
  | { kind: "few-left"; signed: Signed };

function Login() {
  const { t, tn, lang, setLang } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const { token, notice } = useSession();
  const [step, setStep] = useState<Step>({ kind: "password" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  // The installed app keeps itself signed in unless told otherwise.
  const installed = useSyncExternalStore(noSubscription, installedApp, () => false);
  const [rememberChoice, setRemember] = useState<boolean | null>(null);
  const remember = rememberChoice ?? installed;
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const user = useRef<HTMLInputElement>(null);
  const pass = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const next = safeNext(params.get("next"));

  // Already signed in (another tab of this session): straight in.
  useEffect(() => {
    if (token) router.replace(next);
  }, [token, next, router]);
  useEffect(() => {
    user.current?.focus();
  }, []);
  useEffect(() => {
    if (step.kind === "code" || step.kind === "setup") codeRef.current?.focus();
  }, [step.kind]);

  /** Signed in: the session, and the device kept when asked. */
  function finish(s: Signed) {
    setPassword("");
    setCode("");
    if (s.device && s.device_id) session.keepDevice({ token: s.device, id: s.device_id });
    else session.forgetDevice();
    session.signedIn(s.token);
  }

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError(t("Enter your username and password."));
      (username.trim() ? pass : user).current?.focus();
      return;
    }
    setSending(true);
    try {
      const d = await api<FirstStep & { token?: string }>("/login", { method: "POST", body: { username: username.trim(), password, remember } });
      setCode("");
      // A game server from before two-step verification (0.12.2 and older)
      // signs in on the password alone: this portal still works with it.
      if (d.token && !d.step) finish({ token: d.token });
      else if (d.step === "setup" && d.secret && d.uri) setStep({ kind: "setup", ticket: d.ticket, secret: d.secret, uri: d.uri });
      else setStep({ kind: "code", ticket: d.ticket });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      pass.current?.select();
    } finally {
      setSending(false);
    }
  }

  async function submitCode(e: FormEvent) {
    e.preventDefault();
    if (step.kind !== "code" && step.kind !== "setup") return;
    setError(null);
    if (!code.trim()) {
      setError(t("Type the code the app shows."));
      codeRef.current?.focus();
      return;
    }
    setSending(true);
    try {
      const d = await api<Signed>("/login/code", { method: "POST", body: { ticket: step.ticket, code: code.trim() } });
      if (d.recovery_codes?.length) {
        setStep({ kind: "codes", signed: d, username: d.user?.username || username.trim() });
      } else if (typeof d.codes_left === "number" && d.codes_left <= 3) {
        setStep({ kind: "few-left", signed: d });
      } else {
        finish(d);
      }
    } catch (err) {
      // The sign-in took too long, its wrong codes ran out, or the account
      // lost its access: the password again.
      const wrongCode = err instanceof ApiError && err.message === t("Wrong code. Try the app's newest one.");
      if (err instanceof ApiError && (err.status === 403 || (err.status === 401 && !wrongCode))) {
        setStep({ kind: "password" });
        setPassword("");
      }
      setError(err instanceof Error ? err.message : String(err));
      setCode("");
      codeRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  const back = () => {
    setStep({ kind: "password" });
    setError(null);
    setCode("");
    setPassword("");
    setTimeout(() => pass.current?.focus(), 0);
  };

  const shown = error || (step.kind === "password" ? notice : null);
  const alert = shown ? (
    <div className={"alert " + (error ? "danger" : "warning")} role="alert">
      <TriangleAlert className="icon" aria-hidden />
      <div>{shown}</div>
    </div>
  ) : null;

  let body;
  if (step.kind === "password") {
    body = (
      <form className="login-step" noValidate onSubmit={submitPassword}>
        <p className="muted">{t("Sign in with your game account. Only moderators and administrators have access.")}</p>
        {alert}
        <div className="field">
          <label className="label" htmlFor="login-user">{t("Username")}</label>
          <input ref={user} id="login-user" className="input" autoComplete="username" autoCapitalize="off" required spellCheck={false}
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
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          {t("Keep me signed in on this device")}
        </label>
        <button className="btn primary login-submit" type="submit" disabled={sending}>
          {sending ? <><Spinner />{t("Signing in…")}</> : t("Continue")}
        </button>
        <div className="login-links">
          <a href={forgotPasswordHref(lang)}>{t("Forgot your password?")}</a>
        </div>
      </form>
    );
  } else if (step.kind === "code" || step.kind === "setup") {
    const setup = step.kind === "setup";
    body = (
      <form className="login-step" noValidate onSubmit={submitCode}>
        <button type="button" className="btn ghost login-back" onClick={back}>
          <ArrowLeft className="icon" aria-hidden />
          {t("Back")}
        </button>
        <div className="row">
          {setup ? <ShieldCheck className="icon" aria-hidden /> : <Smartphone className="icon" aria-hidden />}
          <strong>{setup ? t("Set up two-step verification") : t("Two-step verification")}</strong>
        </div>
        <p className="muted">
          {setup
            ? t("Moderators and administrators sign in with a code from an authenticator app too. It takes a minute, once.")
            : t("Open your authenticator app and type the code it shows for Snook Legend.")}
        </p>
        {setup ? <SetupSteps secret={step.secret} uri={step.uri} /> : null}
        {alert}
        <CodeField id="login-code" value={code} onChange={setCode} recovery={!setup} inputRef={codeRef} />
        <button className="btn primary login-submit" type="submit" disabled={sending}>
          {sending ? <><Spinner />{t("Checking…")}</> : setup ? t("Turn on and sign in") : t("Sign in")}
        </button>
      </form>
    );
  } else if (step.kind === "codes") {
    const s = step.signed;
    body = (
      <div className="login-step">
        <div className="row">
          <ShieldCheck className="icon" aria-hidden />
          <strong>{t("Two-step verification is on")}</strong>
        </div>
        <p className="muted">
          {t("Keep these recovery codes somewhere safe (a password manager, a printed page). If you lose your phone, each one signs you in once. They are not shown again.")}
        </p>
        <RecoveryCodes codes={s.recovery_codes || []} username={step.username} />
        <label className="check">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
          {t("I saved my recovery codes")}
        </label>
        <button className="btn primary login-submit" type="button" disabled={!saved} onClick={() => finish(s)}>
          {t("Continue to the portal")}
        </button>
      </div>
    );
  } else {
    const left = step.signed.codes_left ?? 0;
    body = (
      <div className="login-step">
        <div className={"alert " + (left === 0 ? "danger" : "warning")} role="alert">
          <TriangleAlert className="icon" aria-hidden />
          <div>
            {left === 0
              ? t("That was your last recovery code. Make new ones now, in your account's page.")
              : tn(left, "You have {n} recovery code left. Make new ones in your account's page.", "You have {n} recovery codes left. Make new ones in your account's page.")}
          </div>
        </div>
        <button className="btn primary login-submit" type="button" onClick={() => finish(step.signed)}>
          {t("Continue to the portal")}
        </button>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <BrandMark />
          <div>
            <h1>Snook Legend</h1>
            <p>{t("Staff portal")}</p>
          </div>
        </div>
        {body}
        <div className="login-foot">
          <span className="row">
            <Lock className="icon" aria-hidden />
            {remember ? t("Signed in here until 30 days without use.") : t("Sessions end after 8 hours.")}
          </span>
          <select className="select" aria-label={t("Language")} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            {LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
