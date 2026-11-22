"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { CircleCheck, Globe, Info, RefreshCw, Shield, TriangleAlert, Ban, MicOff, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { FLAG_CODES } from "@/lib/countries";
import { hue, nowSecs } from "@/lib/format";
import { RULES, recordOf } from "@/lib/rules";
import type { PerRules, Records, Role, RulesId, UserRow } from "@/lib/types";
import { useLocale } from "../providers/locale";

// ------------------------------------------------------------- controls

export const Spinner = ({ lg }: { lg?: boolean }) => <span className={"spinner" + (lg ? " lg" : "")} aria-hidden />;

export interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  /** Classes after "btn": "primary", "sm ghost", "danger-soft"… */
  kind?: string;
  icon?: LucideIcon;
  /** Only the icon shows; the label names it for screen readers and as a tip. */
  iconOnly?: boolean;
  busy?: boolean;
}

export function Btn({ label, kind = "", icon: Icon, iconOnly, busy, className, title, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      className={["btn", kind, iconOnly ? "icon-only" : "", className].filter(Boolean).join(" ")}
      aria-label={iconOnly ? label : undefined}
      title={title ?? (iconOnly ? label : undefined)}
      {...rest}
      disabled={rest.disabled || busy}
    >
      {busy ? <Spinner /> : Icon ? <Icon className="icon" aria-hidden /> : null}
      {iconOnly ? null : label}
    </button>
  );
}

/** Runs `fn` with the button off, so a second click doesn't send it twice. */
export function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (busy) return undefined;
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  };
  return [busy, run] as const;
}

/** A row of buttons, one of them on. */
export function Segmented<V extends string | number>({ options, value, onChange, name }: {
  options: [V, string, number?][];
  value: V;
  onChange: (v: V) => void;
  name?: string;
}) {
  const { fmtNum } = useLocale();
  return (
    <div className="segmented" role="tablist" aria-label={name}>
      {options.map(([v, label, count]) => (
        <button key={String(v)} type="button" role="tab" aria-selected={v === value} className={v === value ? "on" : ""} onClick={() => onChange(v)}>
          {label}
          {count !== undefined && count !== null ? <span className="count">{fmtNum(count)}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** Tabs that change the address (links) or the page's state (buttons). */
export function Tabs({ items, current, onChange }: {
  items: { id: string; label: string; icon?: LucideIcon; count?: number | null; alert?: boolean; href?: string }[];
  current: string;
  onChange?: (id: string) => void;
}) {
  const { fmtNum } = useLocale();
  return (
    <div className="tabs" role="tablist">
      {items.map(({ id, label, icon: Icon, count, alert, href }) => {
        const inner = (
          <>
            {Icon ? <Icon className="icon" aria-hidden /> : null}
            {label}
            {count !== undefined && count !== null ? <span className={"count" + (alert ? " alert" : "")}>{fmtNum(count)}</span> : null}
          </>
        );
        const cls = "tab" + (current === id ? " on" : "");
        return href ? (
          <Link key={id} href={href} className={cls} role="tab" aria-selected={current === id} scroll={false}>
            {inner}
          </Link>
        ) : (
          <button key={id} type="button" className={cls} role="tab" aria-selected={current === id} onClick={() => onChange?.(id)}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  danger?: boolean;
  onSelect: () => void;
}
/** A menu under a button: items, "-" for a line, { group } for a heading. */
export function DropMenu({ trigger, items }: { trigger: ReactNode; items: (MenuItem | "-" | { group: string } | null | false)[] }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>{trigger}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Content className="menu" align="end" sideOffset={6} collisionPadding={8}>
          {items.map((it, k) => {
            if (!it) return null;
            if (it === "-") return <Menu.Separator key={k} className="menu-sep" />;
            if ("group" in it) return <Menu.Label key={k} className="menu-label">{it.group}</Menu.Label>;
            const Icon = it.icon;
            return (
              <Menu.Item key={k} className={"menu-item" + (it.danger ? " danger" : "")} onSelect={it.onSelect}>
                {Icon ? <Icon className="icon" aria-hidden /> : null}
                {it.label}
              </Menu.Item>
            );
          })}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Props that make a row or a block clickable, and reachable by keyboard:
 * Tab to it, Enter or Space does what a click does. */
export function clickable(fn: () => void) {
  return {
    tabIndex: 0,
    onClick: fn,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
      e.preventDefault();
      fn();
    },
  };
}

// --------------------------------------------------------------- layout

export function PageHead({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      {children ? <div className="head-actions">{children}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={("card " + className).trim()}>{children}</section>;
}

export function CardHead({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="card-head">
      <div>
        <h3>{title}</h3>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      {children ? <div className="row">{children}</div> : null}
    </div>
  );
}

export function Kpi({ label, value, sub, icon: Icon, tone = "", href }: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="kpi-top">
        <span>{label}</span>
        {Icon ? (
          <span className={("kpi-icon " + tone).trim()}>
            <Icon className="icon" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="kpi-value">{value}</div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </>
  );
  return href ? (
    <Link href={href} className="card kpi link">
      {inner}
    </Link>
  ) : (
    <div className="card kpi">{inner}</div>
  );
}

export type Header = string | { label: ReactNode; cls?: string };
export function DataTable({ headers, children, className }: { headers: Header[]; children: ReactNode; className?: string }) {
  return (
    <div className="table-wrap">
      <table className={"data" + (className ? " " + className : "")}>
        <thead>
          <tr>
            {headers.map((h, k) => (typeof h === "string" ? <th key={k}>{h}</th> : <th key={k} className={h.cls || ""}>{h.label}</th>))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Empty({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string | null }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon className="icon" aria-hidden />
      </div>
      <b>{title}</b>
      {text ? <span>{text}</span> : null}
    </div>
  );
}

export function AlertBox({ tone, title, text, action }: { tone: "danger" | "warning" | "info" | "success"; title: ReactNode; text?: ReactNode; action?: ReactNode }) {
  const Icon = tone === "danger" || tone === "warning" ? TriangleAlert : Info;
  return (
    <div className={"alert " + tone}>
      <Icon className="icon" aria-hidden />
      <div className="alert-body grow">
        <b>{title}</b>
        {text ? <span>{text}</span> : null}
      </div>
      {action}
    </div>
  );
}

export function HealthRow({ ok, text, side, warnOnly }: { ok: boolean; text: ReactNode; side?: ReactNode; warnOnly?: boolean }) {
  const Icon = ok ? CircleCheck : TriangleAlert;
  return (
    <div className={"h-row " + (ok ? "ok" : warnOnly ? "warn" : "bad")}>
      <Icon className="icon" aria-hidden />
      <span>{text}</span>
      {side ? <span className="h-sub">{side}</span> : null}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="page-loading" aria-busy="true">
      <div className="skeleton line" />
      <div className="kpis">
        {[0, 1, 2, 3].map((k) => (
          <div key={k} className="skeleton block" />
        ))}
      </div>
      <div className="skeleton block" />
      <div className="skeleton block" />
    </div>
  );
}

export function ErrorPage({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useLocale();
  return (
    <div className="error-page">
      <div className="empty-icon">
        <TriangleAlert className="icon" aria-hidden />
      </div>
      <b>{t("This page couldn't be loaded.")}</b>
      <span className="muted">{error instanceof Error ? error.message : String(error)}</span>
      <Btn label={t("Try again")} kind="primary" icon={RefreshCw} onClick={onRetry} />
    </div>
  );
}

/** "Updated at 10:42:07", the "Live" mark, and a refresh button. */
export function Updated({ at, onRefresh, live }: { at: number; onRefresh?: () => void; live?: boolean }) {
  const { t, tf, fmtClockSecs } = useLocale();
  return (
    <span className="updated">
      {live ? <span className="badge success dot">{t("Live")}</span> : null}
      <span>{tf("Updated at {time}", { time: fmtClockSecs(new Date(at)) })}</span>
      {onRefresh ? <Btn label={t("Refresh")} kind="sm ghost" icon={RefreshCw} iconOnly onClick={onRefresh} /> : null}
    </span>
  );
}

// --------------------------------------------------------------- people

export function Badge({ children, kind = "", icon: Icon, title }: { children?: ReactNode; kind?: string; icon?: LucideIcon; title?: string }) {
  return (
    <span className={("badge " + kind).trim()} title={title}>
      {Icon ? <Icon className="icon" aria-hidden /> : null}
      {children}
    </span>
  );
}

export function Avatar({ name, size = "" }: { name: string; size?: "" | "sm" | "lg" }) {
  return (
    <span className={("avatar " + size).trim()} aria-hidden style={{ background: `hsl(${hue(name)} 38% 38%)` }}>
      {String(name || "?").slice(0, 1)}
    </span>
  );
}

/** A country's flag, from the game's own atlas (public/flags.png): the flag
 * emoji aren't drawn everywhere (Windows shows the two letters). */
export function Flag({ code, className = "" }: { code?: string | null; className?: string }) {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return null;
  const k = FLAG_CODES.indexOf(code.toUpperCase());
  if (k < 0) return null;
  return <span className={("fl " + className).trim()} aria-hidden style={{ backgroundPosition: `-${(k % 16) * 20}px -${Math.floor(k / 16) * 15}px` }} />;
}

export function Country({ code }: { code?: string | null }) {
  const { countryName } = useLocale();
  return (
    <span className="nowrap" title={code || ""}>
      <Flag code={code} />
      {code ? " " : null}
      {countryName(code)}
    </span>
  );
}

export const playerHref = (name: string, tab?: string) => "/players/" + encodeURIComponent(name) + (tab && tab !== "overview" ? "/" + tab : "");

export function PersonLink({ name, avatar = true }: { name?: string | null; avatar?: boolean }) {
  if (!name) return <span className="faint">—</span>;
  return (
    <span className="person">
      {avatar ? <Avatar name={name} size="sm" /> : null}
      <Link className="name" href={playerHref(name)} onClick={(e) => e.stopPropagation()}>
        {name}
      </Link>
    </span>
  );
}

/** "3 minutes ago", with the date as a tip; it keeps itself current. */
export function TimeAgo({ at }: { at?: number | null }) {
  const { ago, fmtDate } = useLocale();
  const [, tick] = useState(0);
  useEffect(() => {
    const h = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(h);
  }, []);
  return (
    <time dateTime={at ? new Date(at * 1000).toISOString() : undefined} title={fmtDate(at)}>
      {ago(at)}
    </time>
  );
}

export function useRoleLabel() {
  const { t } = useLocale();
  return (role?: Role | string) => ({ admin: t("Administrator"), moderator: t("Moderator"), player: t("Player") } as Record<string, string>)[role || ""] || role || "";
}

export function RoleBadge({ role }: { role: Role | string }) {
  const roleLabel = useRoleLabel();
  return (
    <Badge kind={role === "admin" ? "danger" : "info"} icon={Shield}>
      {roleLabel(role)}
    </Badge>
  );
}

export function UserBadges({ u, online = true }: { u: Partial<UserRow>; online?: boolean }) {
  const { t } = useLocale();
  const now = nowSecs();
  return (
    <span className="badges">
      {online && u.online ? <Badge kind="success dot">{t("Online")}</Badge> : null}
      {u.role && u.role !== "player" ? <RoleBadge role={u.role} /> : null}
      {u.banned_until && u.banned_until > now ? <Badge kind="danger" icon={Ban}>{t("Banned")}</Badge> : null}
      {u.muted_until && u.muted_until > now ? <Badge kind="warning" icon={MicOff}>{t("Muted")}</Badge> : null}
      {u.deleted_at ? <Badge>{t("Deleted")}</Badge> : null}
    </span>
  );
}

// ---------------------------------------------------------------- rules

export function useRulesNames() {
  const { t } = useLocale();
  return {
    rulesName: (r: RulesId) => (r === "official" ? t("Official rules") : t("Brazilian rules")),
    rulesShort: (r: RulesId) => (r === "official" ? t("Official") : t("Brazilian")),
  };
}

/** The rules' mark, as in the game: Brazil's flag, or a globe. */
export function RulesMark({ rules }: { rules: RulesId }) {
  return rules === "official" ? <Globe className="icon rules-mark" aria-hidden /> : <Flag code="BR" className="rules-mark" />;
}

export function RulesBadge({ rules, long }: { rules: RulesId; long?: boolean }) {
  const { rulesName, rulesShort } = useRulesNames();
  const k: RulesId = rules === "official" ? "official" : "brazilian";
  return (
    <span className={"badge rules " + k} title={rulesName(k)}>
      <RulesMark rules={k} />
      {long ? rulesName(k) : rulesShort(k)}
    </span>
  );
}

/** Both ratings side by side, each with its mark (lists, the search). */
export function RatingPair({ p }: { p: { records?: Records; standings?: Records } }) {
  const { fmtNum, tn } = useLocale();
  const { rulesName } = useRulesNames();
  return (
    <span className="rating-pair">
      {RULES.map((r) => {
        const x = recordOf(p, r);
        return (
          <span key={r} className={"rp" + (x.games ? "" : " unplayed")} title={rulesName(r) + " · " + tn(x.games, "{n} rated game", "{n} rated games")}>
            <RulesMark rules={r} />
            {fmtNum(x.rating)}
          </span>
        );
      })}
    </span>
  );
}

/** A number under each of the rules, in words ("3 Brazilian · 1 official"). */
export function usePerRules() {
  const { tf, fmtNum } = useLocale();
  return (n?: PerRules) => tf("{brazilian} Brazilian · {official} official", { brazilian: fmtNum(n?.brazilian || 0), official: fmtNum(n?.official || 0) });
}

/** Where the server leaves out what only administrators see. */
export function AdminOnly() {
  const { t } = useLocale();
  return <span className="faint">{t("Visible to administrators only")}</span>;
}
