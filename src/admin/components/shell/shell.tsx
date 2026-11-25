"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Globe, Keyboard, LogOut, Menu as MenuIcon, Moon, Search, Sun, User as UserIcon, Play } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LANGS } from "@/admin/i18n";
import { api, ApiError } from "@/admin/lib/api";
import { useDebounced, useMe } from "@/admin/lib/hooks";
import { NAV, NAV_ITEMS, sectionOf } from "@/admin/lib/nav";
import { session } from "@/admin/lib/session";
import type { Overview, UsersPage } from "@/admin/lib/types";
import { useDialogs } from "../providers/dialogs";
import { useLocale } from "../providers/locale";
import { useViewer } from "../providers/viewer";
import { Avatar, Btn, DropMenu, RatingPair, UserBadges, playerHref, useRoleLabel } from "../ui/bits";
import { Modal } from "../ui/modal";

export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx={16} cy={16} r={15} fill="#141414" />
      <circle cx={16} cy={16} r={7.5} fill="#f8f3e6" />
      <text x={16} y={20} fontSize={10.5} fontWeight={800} textAnchor="middle" fill="#141414" fontFamily="Arial, sans-serif">
        8
      </text>
    </svg>
  );
}

/** Who is online and the open reports, for the sidebar: every minute. */
function useCounts() {
  return useQuery({
    queryKey: ["/overview"],
    queryFn: ({ signal }) => api<Overview>("/overview", { signal }),
    refetchInterval: 60000,
  });
}

export function signOut() {
  if (session.token()) api("/logout", { method: "POST" }).catch(() => {});
  session.end(null);
}

export function Shell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const { t, tf } = useLocale();
  // The menu folds away when the page changes (phones).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setNavOpen(false);
  }
  useShortcuts();
  const section = sectionOf(pathname);
  const item = NAV_ITEMS.find((n) => n.id === section);
  useEffect(() => {
    document.title = (item ? t(item.label) + " · " : "") + "Snook Legend · " + t("Staff");
  }, [item, t, tf]);
  return (
    <div className={"shell" + (navOpen ? " nav-open" : "")}>
      <a className="skip-link" href="#main">{t("Skip to the page")}</a>
      <Sidebar section={section} />
      <div className="scrim" onClick={() => setNavOpen(false)} />
      <div className="workspace">
        <Topbar onMenu={() => setNavOpen((o) => !o)} />
        <main id="main" className="main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ section }: { section: string }) {
  const { t, tn, tf, fmtNum } = useLocale();
  const counts = useCounts();
  const reachable = !(counts.error instanceof ApiError && counts.error.status === 0);
  const o = counts.data;
  const reports = o?.stored.open_reports || 0;
  return (
    <aside className="sidebar" aria-label={t("Sections")}>
      <Link className="brand" href="/admin/dashboard">
        <BrandMark />
        <div>
          <b>Snook Legend</b>
          <span>{t("Staff portal")}</span>
        </div>
      </Link>
      <nav>
        {NAV.map((n, k) => {
          if ("group" in n) return <div key={k} className="nav-group">{t(n.group)}</div>;
          const c = n.count === "reports" ? reports : 0;
          const Icon = n.icon;
          const on = section === n.id;
          return (
            <Link key={n.id} className={"nav-link" + (on ? " on" : "")} href={"/admin/" + n.id} aria-current={on ? "page" : undefined}>
              <Icon className="icon" aria-hidden />
              <span className="grow ellipsis">{t(n.label)}</span>
              {c ? (
                <span className="nav-count" title={tn(c, "{n} open report", "{n} open reports")}>
                  {c > 99 ? "99+" : fmtNum(c)}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <span className={"live-dot" + (reachable ? "" : " off")}>
          {reachable ? (o ? tn(o.online, "{n} player online", "{n} players online") : t("Connected")) : t("Server unreachable")}
        </span>
        {o?.version ? <span>{tf("Server {version}", { version: o.version })}</span> : null}
      </div>
    </aside>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { t, lang, setLang, theme, setTheme } = useLocale();
  const me = useMe();
  const router = useRouter();
  const dialogs = useDialogs();
  const roleLabel = useRoleLabel();
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const themeLabel = theme === "dark" ? t("Light theme") : t("Dark theme");
  return (
    <header className="topbar">
      <Btn label={t("Menu")} kind="ghost menu-btn" icon={MenuIcon} iconOnly onClick={onMenu} />
      <SearchBox />
      <div className="topbar-actions">
        <select className="select lang-select hide-sm" aria-label={t("Language")} value={lang} onChange={(e) => setLang(e.target.value as typeof lang)}>
          {LANGS.map(([c, name]) => (
            <option key={c} value={c}>{name}</option>
          ))}
        </select>
        <Btn label={themeLabel} kind="ghost" icon={theme === "dark" ? Sun : Moon} iconOnly onClick={toggleTheme} />
        <Btn label={t("Keyboard shortcuts")} title={t("Keyboard shortcuts") + " (?)"} kind="ghost hide-sm" icon={Keyboard} iconOnly
          onClick={() => dialogs.open((close) => <ShortcutsDialog onClose={close} />)} />
        <DropMenu
          trigger={
            <button className="btn ghost me-chip" type="button" aria-label={t("Account")}>
              <Avatar name={me.username} size="sm" code={me.avatar} />
              <span className="who">
                <b>{me.username}</b>
                <span className={me.role === "admin" ? "admin" : ""}>{roleLabel(me.role)}</span>
              </span>
              <ChevronDown className="icon" aria-hidden />
            </button>
          }
          items={[
            { group: me.username + " · " + roleLabel(me.role) },
            { label: t("My player page"), icon: UserIcon, onSelect: () => router.push(playerHref(me.username)) },
            { label: themeLabel, icon: theme === "dark" ? Sun : Moon, onSelect: toggleTheme },
            { group: t("Language") },
            ...LANGS.map(([c, name]) => ({ label: name + (c === lang ? " ✓" : ""), icon: Globe, onSelect: () => setLang(c) })),
            "-",
            { label: t("Sign out"), icon: LogOut, danger: true, onSelect: signOut },
          ]}
        />
      </div>
    </header>
  );
}

/** Players by name as you type; "#123" opens game 123 (only with "#": a
 * username may be all digits). */
function SearchBox() {
  const { t, tf, fmtNum } = useLocale();
  const router = useRouter();
  const viewer = useViewer();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const term = useDebounced(q.trim(), 200);
  const found = useQuery({
    queryKey: ["search", term],
    queryFn: ({ signal }) => api<UsersPage>("/users?q=" + encodeURIComponent(term.replace(/^#/, "")) + "&sort=last_seen", { signal }),
    enabled: !!term,
    staleTime: 10000,
  });
  const game = q.trim().match(/^#(\d{1,18})$/);
  const items: { key: string; node: ReactNode; go: () => void }[] = [];
  // A stored game, or else a game being played (Live shows their numbers).
  if (game) {
    items.push({
      key: "game",
      node: <span className="row"><Play className="icon" aria-hidden />{tf("Watch game #{id}", { id: game[1] })}</span>,
      go: () => viewer.open("/replay/" + game[1] + "/view", "/live/" + game[1] + "/view"),
    });
  }
  const data = term && term === q.trim() ? found.data : undefined;
  for (const u of data?.users.slice(0, 7) || []) {
    items.push({
      key: "u" + u.id,
      node: (
        <span className="person grow">
          <Avatar name={u.username} size="sm" code={u.avatar} />
          <span className="person-name"><b>{u.username}</b><UserBadges u={u} /></span>
          <span className="meta"><RatingPair p={u} /></span>
        </span>
      ),
      go: () => router.push(playerHref(u.username)),
    });
  }
  if (data && data.total > 7) {
    items.push({ key: "all", node: <span className="muted">{tf("All {n} results", { n: fmtNum(data.total) })}</span>, go: () => router.push("/admin/players?q=" + encodeURIComponent(q.trim())) });
  }
  const shown = open && !!q.trim();
  const choose = (k: number) => {
    const it = items[k];
    if (!it) return;
    setOpen(false);
    setQ("");
    input.current?.blur();
    it.go();
  };
  return (
    <div className="search" role="search">
      <Search className="icon lead" aria-hidden />
      <input
        ref={input}
        id="global-search"
        className="input"
        type="search"
        placeholder={t("Search players, or #game number")}
        aria-label={t("Search")}
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={shown}
        aria-controls="search-results"
        aria-activedescendant={shown && items[sel] ? "sr-" + items[sel].key : undefined}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setSel(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
          else if (e.key === "Enter") {
            e.preventDefault();
            if (items[sel]) choose(sel);
            else if (q.trim()) { router.push("/admin/players?q=" + encodeURIComponent(q.trim())); setOpen(false); }
          } else if (e.key === "Escape") { setOpen(false); input.current?.blur(); }
        }}
      />
      <kbd aria-hidden>/</kbd>
      {shown ? (
        <div className="search-results" role="listbox" id="search-results">
          {items.map((it, k) => (
            <button key={it.key} id={"sr-" + it.key} type="button" role="option" aria-selected={k === sel} tabIndex={-1}
              className={"result" + (k === sel ? " sel" : "")} onMouseDown={(e) => { e.preventDefault(); choose(k); }} onMouseEnter={() => setSel(k)}>
              {it.node}
            </button>
          ))}
          {!items.length ? <div className="hint">{found.isFetching || term !== q.trim() ? t("Searching…") : t("No player by that name.")}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const { t, tf } = useLocale();
  const row = (label: string, ...keys: string[]) => (
    <div className="sc" key={label}>
      <span>{label}</span>
      <span>{keys.map((k) => <kbd key={k}>{k}</kbd>)}</span>
    </div>
  );
  return (
    <Modal title={t("Keyboard shortcuts")} icon={Keyboard} onClose={onClose}
      footer={<button type="button" data-primary className="btn primary" onClick={onClose}>{t("Close")}</button>}>
      <div className="shortcuts">
        {row(t("Search players"), "/")}
        {row(t("This list"), "?")}
        {row(t("Close a dialog or the replay"), "Esc")}
        {NAV_ITEMS.map((n) => row(tf("Go to {page}", { page: t(n.label) }), "g", n.key))}
        {row(t("Replay: play or pause"), t("Space"))}
        {row(t("Replay: previous or next stroke"), "←", "→")}
        {row(t("Replay: one frame back or forward"), ",", ".")}
      </div>
    </Modal>
  );
}

/** "/" searches, "?" lists the shortcuts, "g" then a letter goes to a page. */
function useShortcuts() {
  const router = useRouter();
  const dialogs = useDialogs();
  const viewer = useViewer();
  const pendingG = useRef(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewer.isOpen || dialogs.count || document.querySelector("[role=dialog], [role=menu]")) return;
      const a = document.activeElement;
      const typing = !!a && (["INPUT", "TEXTAREA", "SELECT"].includes(a.tagName) || (a as HTMLElement).isContentEditable);
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); document.getElementById("global-search")?.focus(); return; }
      if (e.key === "?") { e.preventDefault(); dialogs.open((close) => <ShortcutsDialog onClose={close} />); return; }
      if (e.key === "g") { pendingG.current = Date.now(); return; }
      if (Date.now() - pendingG.current < 1200) {
        pendingG.current = 0;
        const n = NAV_ITEMS.find((x) => x.key === e.key.toLowerCase());
        if (n) { e.preventDefault(); router.push("/admin/" + n.id); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router, dialogs, viewer.isOpen]);
}
