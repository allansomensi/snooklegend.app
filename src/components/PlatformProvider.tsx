"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Dict } from "@/i18n";
import type { ReleaseInfo } from "@/lib/release";
import { detectArch, detectOS, type Arch, type OS } from "@/lib/platform";
import { REPO, type AssetKey } from "@/lib/site";
import { DownloadModal } from "./DownloadModal";

export type DesktopOS = "windows" | "mac" | "linux";
export type DownloadTarget = { kind: "file"; os: DesktopOS; asset: AssetKey } | { kind: "command"; os: "mac" | "linux" };

type Ctx = {
  os: OS;
  arch: Arch;
  /** False while rendering on the server and during hydration. */
  ready: boolean;
  /** The latest release: from the build, refreshed in the browser if a newer one is out. */
  release: ReleaseInfo;
  openDownload: (target: DownloadTarget) => void;
};

const PlatformContext = createContext<Ctx | null>(null);

// ── The visitor's computer, as a tiny external store ────────────────────────
let cachedOS: OS | null = null;
let cachedArch: Arch = "unknown";
let archStarted = false;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!archStarted) {
    archStarted = true;
    detectArch(getOS()).then((a) => {
      cachedArch = a;
      listeners.forEach((l) => l());
    });
  }
  return () => void listeners.delete(cb);
}
const getOS = () => (cachedOS ??= detectOS());
const getArch = () => cachedArch;
const serverOS = (): OS => "unknown";
const serverArch = (): Arch => "unknown";
const getReady = () => true;
const serverReady = () => false;

export function PlatformProvider({
  t,
  release: built,
  locale,
  children,
}: {
  t: Pick<Dict, "modal" | "download" | "os">;
  release: ReleaseInfo;
  locale: string;
  children: ReactNode;
}) {
  const os = useSyncExternalStore(subscribe, getOS, serverOS);
  const arch = useSyncExternalStore(subscribe, getArch, serverArch);
  const ready = useSyncExternalStore(subscribe, getReady, serverReady);

  const release = useLatestRelease(built);
  const dialog = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<DownloadTarget | null>(null);

  const openDownload = useCallback((next: DownloadTarget) => {
    setTarget(next);
    // Wait for the content to render, then open the dialog.
    requestAnimationFrame(() => {
      const d = dialog.current;
      if (d && !d.open) d.showModal();
    });
  }, []);

  const value = useMemo(() => ({ os, arch, ready, release, openDownload }), [os, arch, ready, release, openDownload]);

  return (
    <PlatformContext.Provider value={value}>
      {children}
      <DownloadModal ref={dialog} target={target} t={t} release={release} locale={locale} arch={arch} />
    </PlatformContext.Provider>
  );
}

export function usePlatform(): Ctx {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform needs a PlatformProvider");
  return ctx;
}

/**
 * The site is static: if a new version of the game came out after it was
 * built, show that version's number and sizes. The download links always
 * point at the latest release; the checksums of the build no longer apply.
 */
function useLatestRelease(built: ReleaseInfo): ReleaseInfo {
  const [release, setRelease] = useState(built);
  useEffect(() => {
    const KEY = "sl-release";
    const apply = (r: ReleaseInfo) => {
      if (r.tag !== built.tag) setRelease(r);
    };
    try {
      const cached = sessionStorage.getItem(KEY);
      if (cached) {
        apply(JSON.parse(cached) as ReleaseInfo);
        return;
      }
    } catch {
      // No storage: just ask GitHub.
    }
    const ctrl = new AbortController();
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((rel: { tag_name: string; published_at: string; html_url: string; assets: { name: string; size: number }[] } | null) => {
        if (!rel?.tag_name) return;
        const fresh: ReleaseInfo = {
          version: rel.tag_name.replace(/^v/, ""),
          tag: rel.tag_name,
          date: rel.published_at,
          url: rel.html_url,
          assets: Object.fromEntries(
            rel.assets.map((a) => [a.name, { size: a.size, sha256: rel.tag_name === built.tag ? built.assets[a.name]?.sha256 : undefined }]),
          ),
        };
        try {
          sessionStorage.setItem(KEY, JSON.stringify(fresh));
        } catch {
          // Fine: it is asked again next time.
        }
        apply(fresh);
      })
      .catch(() => {
        // Offline or rate-limited: the build's release is shown.
      });
    return () => ctrl.abort();
  }, [built]);
  return release;
}
