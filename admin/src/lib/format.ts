// Numbers, dates, durations and money in the chosen language.
import type { Translator } from "@/i18n";

export const nowSecs = () => Date.now() / 1000;
/** A ban "for good" ends after this. */
export const FOREVER = 9e15;

export function formatters(tr: Translator) {
  const { lang, tf, tn } = tr;
  const numFmt = new Intl.NumberFormat(lang);
  const fmtNum = (n: unknown) => numFmt.format(Number(n) || 0);
  const fmtPct = (x: unknown, digits = 1) =>
    new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: digits }).format((Number(x) || 0) / 100);
  const dateTime = new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" });
  const dateOnly = new Intl.DateTimeFormat(lang, { dateStyle: "medium" });
  const fmtDate = (s?: number | null) => (s ? dateTime.format(new Date(s * 1000)) : "—");
  const fmtDateOnly = (s?: number | null) => (s ? dateOnly.format(new Date(s * 1000)) : "—");
  const fmtClock = (s: number) =>
    new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" }).format(new Date(s * 1000));
  const fmtClockSecs = (d: Date) =>
    new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(d);
  const fmtDay = (day: number) =>
    new Intl.DateTimeFormat(lang, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(day * 86400000));
  const fmtDayLong = (day: number) =>
    new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(day * 86400000));

  function ago(s?: number | null) {
    if (!s) return "—";
    const d = s - nowSecs();
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
    const a = Math.abs(d);
    if (a < 45) return rtf.format(0, "second");
    if (a < 3600) return rtf.format(Math.round(d / 60), "minute");
    if (a < 86400) return rtf.format(Math.round(d / 3600), "hour");
    if (a < 86400 * 45) return rtf.format(Math.round(d / 86400), "day");
    if (a < 86400 * 400) return rtf.format(Math.round(d / (86400 * 30)), "month");
    return rtf.format(Math.round(d / (86400 * 365)), "year");
  }

  function fmtDuration(secs: number) {
    secs = Math.max(0, Math.round(secs));
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (d) return tf("{d} d {h} h", { d, h });
    if (h) return tf("{h} h {m} min", { h, m });
    if (m) return tf("{m} min", { m });
    return tf("{s} s", { s: secs });
  }

  function fmtMinutes(min: number) {
    if (min % 10080 === 0) return tn(min / 10080, "{n} week", "{n} weeks");
    if (min % 1440 === 0) return tn(min / 1440, "{n} day", "{n} days");
    if (min % 60 === 0) return tn(min / 60, "{n} hour", "{n} hours");
    return tn(min, "{n} minute", "{n} minutes");
  }

  function fmtBytes(b?: number | null) {
    if (!b && b !== 0) return "—";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (b >= 1024 && i < u.length - 1) {
      b /= 1024;
      i++;
    }
    return new Intl.NumberFormat(lang, { maximumFractionDigits: i ? 1 : 0 }).format(b) + " " + u[i];
  }

  function money(cents: number, currency: string) {
    if (currency === "msstore") return "Microsoft Store";
    try {
      return new Intl.NumberFormat(lang, { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
    } catch {
      return (cents / 100).toFixed(2) + " " + currency.toUpperCase();
    }
  }

  function countryName(code?: string | null) {
    if (!code) return tr.t("No country");
    try {
      return new Intl.DisplayNames([lang], { type: "region" }).of(code.toUpperCase()) || code;
    } catch {
      return code;
    }
  }

  return {
    fmtNum, fmtPct, fmtDate, fmtDateOnly, fmtClock, fmtClockSecs, fmtDay, fmtDayLong,
    ago, fmtDuration, fmtMinutes, fmtBytes, money, countryName,
  };
}

export type Formatters = ReturnType<typeof formatters>;

/** A colour for a name's avatar, always the same for the same name. */
export function hue(name: string) {
  let h = 0;
  for (const c of String(name)) h = (h * 31 + (c.codePointAt(0) || 0)) % 360;
  return h;
}

/** The server drops line breaks (gluing the words), so a text typed on
 * several lines goes as one, with spaces. */
export const oneLine = (s: unknown) => String(s ?? "").replace(/\s*\n\s*/g, " ");

/** The number of characters (not UTF-16 units) of a text. */
export const charCount = (s: string) => [...s].length;
