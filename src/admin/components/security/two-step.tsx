"use client";

// The pieces of two-step verification the sign-in and the account's page
// share: the QR code an authenticator app scans, the secret to type or
// open on the phone itself, the field for a code, and the recovery codes
// to keep.
import { Check, Copy, Download, ExternalLink } from "lucide-react";
import { useMemo, useState, type Ref } from "react";
import { useLocale } from "@/admin/components/providers/locale";
import { saveFile } from "@/admin/lib/download";
import { qrCode, qrPath } from "@/admin/lib/qr";

/** The QR code of an `otpauth://` address. */
export function QrImage({ text, label }: { text: string; label: string }) {
  const { path, view } = useMemo(() => {
    const q = qrCode(text);
    return { path: qrPath(q, 4), view: q.size + 8 };
  }, [text]);
  return (
    <svg className="qr" viewBox={`0 0 ${view} ${view}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={view} height={view} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}

/** The secret in groups of four, as apps show and take it. */
export const groupSecret = (s: string) => s.replace(/(.{4})/g, "$1 ").trim();

/** Copies a text, with a check mark for a moment. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const { t } = useLocale();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        });
      }}
    >
      {done ? <Check className="icon" aria-hidden /> : <Copy className="icon" aria-hidden />}
      {done ? t("Copied") : label}
    </button>
  );
}

/** Adding the portal to an authenticator app: the QR code, the link that
 * opens the app on this phone, and the secret to type. */
export function SetupSteps({ secret, uri }: { secret: string; uri: string }) {
  const { t } = useLocale();
  return (
    <div className="two-step-setup">
      <ol className="two-step-list">
        <li>{t("Install an authenticator app on your phone: Google Authenticator, Microsoft Authenticator, 1Password, Authy or another.")}</li>
        <li>{t("Scan this code with it. On this phone, tap “Open in the app” instead, or type the key.")}</li>
        <li>{t("Type the 6-digit code the app shows.")}</li>
      </ol>
      <div className="two-step-qr">
        <QrImage text={uri} label={t("QR code for the authenticator app")} />
      </div>
      <div className="two-step-key">
        <span className="hint">{t("Key")}</span>
        <code className="mono">{groupSecret(secret)}</code>
      </div>
      <div className="two-step-actions">
        <a className="btn" href={uri}>
          <ExternalLink className="icon" aria-hidden />
          {t("Open in the app")}
        </a>
        <CopyButton text={secret} label={t("Copy the key")} />
      </div>
    </div>
  );
}

/** The field for a code of the app (or a recovery code). */
export function CodeField({ id, value, onChange, recovery, inputRef }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  /** A recovery code may be typed instead. */
  recovery?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const { t } = useLocale();
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{recovery ? t("Code from the app or a recovery code") : t("Code from the app")}</label>
      <input
        ref={inputRef}
        id={id}
        className="input code-input mono"
        inputMode={recovery ? "text" : "numeric"}
        autoComplete="one-time-code"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={12}
        placeholder="123456"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {recovery ? <span className="hint">{t("Lost your phone? Each recovery code works once.")}</span> : null}
    </div>
  );
}

/** Recovery codes, shown once: to copy or save as a file. */
export function RecoveryCodes({ codes, username }: { codes: string[]; username: string }) {
  const { t } = useLocale();
  const text = codes.join("\n");
  const file = () =>
    saveFile(
      "snook-legend-recovery-codes-" + username + ".txt",
      new Blob(
        [
          t("Snook Legend staff portal: recovery codes for") + " " + username + "\n" +
            t("Each code works once, instead of a code from the app.") + "\n\n" + text + "\n",
        ],
        { type: "text/plain" },
      ),
    );
  return (
    <div className="recovery">
      <ul className="recovery-codes mono">
        {codes.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <div className="two-step-actions">
        <CopyButton text={text} label={t("Copy the codes")} />
        <button type="button" className="btn" onClick={file}>
          <Download className="icon" aria-hidden />
          {t("Save as a file")}
        </button>
      </div>
    </div>
  );
}
