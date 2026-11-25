"use client";

import { Check, ChevronDown, Globe, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LOCALE_INFO, LOCALES, type Dict, type Locale } from "@/i18n";
import { rankingPath } from "@/lib/ranking";
import { pagePath } from "@/lib/routes";
import { GITHUB_URL } from "@/lib/site";
import { DownloadButton } from "./DownloadButton";
import { GithubIcon } from "./icons";

type Props = {
  t: Pick<Dict, "nav" | "hero" | "os">;
  locale: Locale;
  /** This page in each language (the home page's when left out). */
  paths?: Record<Locale, string>;
};

export function Header({ t, locale, paths }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // The home page's sections, from any page (on the home page itself the
  // browser just scrolls).
  const home = LOCALE_INFO[locale].path;
  const links = [
    { href: rankingPath(locale), label: t.nav.ranking },
    { href: pagePath(locale, "tournaments"), label: t.nav.tournaments },
    { href: pagePath(locale, "rules"), label: t.nav.rules },
    { href: `${home}#features`, label: t.nav.features },
    { href: `${home}#gallery`, label: t.nav.gallery },
    { href: `${home}#faq`, label: t.nav.faq },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
        open
          ? // The open menu covers the page: solid, so the hero's headline doesn't show through its links.
            "bg-ink-950 shadow-[0_1px_0_rgb(255_255_255/0.06),0_24px_40px_-12px_rgb(0_0_0/0.8)]"
          : scrolled
          ? "bg-ink-950/92 shadow-[0_1px_0_rgb(255_255_255/0.06),0_10px_30px_-10px_rgb(0_0_0/0.6)] md:bg-ink-950/75 md:backdrop-blur-xl md:backdrop-saturate-150"
          : "bg-transparent"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-gold-300 focus:px-4 focus:py-2 focus:text-ink-950"
      >
        {t.nav.skip}
      </a>
      <div className="container-page flex h-[var(--header-h)] items-center gap-4">
        <a href={LOCALE_INFO[locale].path} className="group flex items-center gap-2.5" aria-label="Snook Legend">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/icon-128.webp"
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-[10px] shadow-[0_4px_14px_-4px_rgb(0_0_0/0.8)] transition-transform duration-500 group-hover:rotate-[-8deg]"
          />
          <span className="font-display text-[17px] font-bold tracking-tight text-cream">
            Snook <span className="text-gold">Legend</span>
          </span>
        </a>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[14px] font-medium text-cream/70 transition hover:bg-white/[0.06] hover:text-cream"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LangSwitcher locale={locale} label={t.nav.language} paths={paths} />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener"
            className="hidden size-9 place-items-center rounded-full text-cream/70 transition hover:bg-white/[0.06] hover:text-cream sm:grid"
            aria-label={t.nav.github}
            title={t.nav.github}
          >
            <GithubIcon className="size-[18px]" />
          </a>
          <div className="hidden sm:block">
            <DownloadButton t={t} locale={locale} size="sm" />
          </div>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-cream/80 transition hover:bg-white/[0.06] lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t.nav.close : t.nav.menu}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-nav"
        className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-[var(--ease-out-expo)] lg:hidden ${
          open ? "max-h-[32rem] opacity-100" : "pointer-events-none max-h-0 opacity-0"
        }`}
      >
        <nav className="container-page flex flex-col gap-1 pb-6 pt-2" aria-label={t.nav.menu}>
          {[...links, { href: `${home}#play`, label: t.nav.play }, { href: `${home}#download`, label: t.nav.download }].map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 font-display text-lg font-semibold text-cream/85 transition hover:bg-white/[0.06]"
            >
              {l.label}
            </a>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-cream/70 transition hover:bg-white/[0.06]"
          >
            <GithubIcon className="size-5" /> GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

function LangSwitcher({ locale, label, paths }: { locale: Locale; label: string; paths?: Record<Locale, string> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-cream/75 transition hover:bg-white/[0.06] hover:text-cream"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        <Globe className="size-4" />
        {LOCALE_INFO[locale].short}
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        role="menu"
        className={`absolute right-0 top-11 w-44 origin-top-right rounded-2xl bg-ink-800 p-1.5 shadow-2xl ring-1 ring-white/10 transition duration-200 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {LOCALES.map((l) => (
          <a
            key={l}
            role="menuitem"
            href={paths?.[l] ?? LOCALE_INFO[l].path}
            hrefLang={LOCALE_INFO[l].htmlLang}
            lang={LOCALE_INFO[l].htmlLang}
            onClick={(e) => {
              try {
                localStorage.setItem("sl-lang", l);
              } catch {
                // Private mode: the choice just isn't remembered.
              }
              e.preventDefault();
              // The same page in that language (on the home page, at the same section).
              window.location.href = paths ? paths[l] : LOCALE_INFO[l].path + window.location.hash;
            }}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
              l === locale ? "bg-white/[0.06] text-cream" : "text-cream/75 hover:bg-white/[0.05] hover:text-cream"
            }`}
          >
            {LOCALE_INFO[l].name}
            {l === locale && <Check className="size-4 text-felt-300" />}
          </a>
        ))}
      </div>
    </div>
  );
}
