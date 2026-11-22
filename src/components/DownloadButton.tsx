"use client";

import { ArrowDown, Check, Download, Share2 } from "lucide-react";
import { useState } from "react";
import { fmt, type Dict } from "@/i18n";
import { formatSize } from "@/lib/release";
import { ASSETS, latestAsset } from "@/lib/site";
import { AppleIcon, LinuxIcon, WindowsIcon } from "./icons";
import { usePlatform } from "./PlatformProvider";

type Props = {
  t: Pick<Dict, "hero" | "os">;
  locale: string;
  size?: "lg" | "md" | "sm";
  showMeta?: boolean;
  tone?: "felt" | "cream";
  className?: string;
};

const SIZES = {
  lg: "h-14 px-7 text-[17px] sm:h-[3.75rem] sm:px-8",
  md: "h-12 px-6 text-base",
  sm: "h-9 px-4 text-sm",
};

/** The one button that downloads (or explains how to install) the right thing for this computer. */
const TONES = {
  felt: "btn-felt",
  cream:
    "bg-cream text-ink-950 shadow-[0_14px_40px_-10px_rgb(0_0_0/0.6),inset_0_-2px_0_rgb(0_0_0/0.12)] hover:-translate-y-0.5 hover:bg-white",
};

export function DownloadButton({ t, locale, size = "lg", showMeta = false, tone = "felt", className = "" }: Props) {
  const { os, arch, ready, release, openDownload } = usePlatform();
  const cls = `btn ${TONES[tone]} ${SIZES[size]} ${className}`;
  const iconCls = size === "sm" ? "size-4" : "size-5";

  if (!ready || os === "unknown" || os === "mobile") {
    return (
      <div className="flex flex-col items-center gap-2">
        <a href="#download" className={cls}>
          <Download className={iconCls} />
          {t.hero.downloadFree}
        </a>
        {showMeta && <Meta light={tone === "cream"} text={fmt(t.hero.meta, { version: release.version, size: "Windows · macOS · Linux" })} />}
      </div>
    );
  }

  const label = fmt(t.hero.downloadFor, { os: t.os[os] });
  const Icon = os === "windows" ? WindowsIcon : os === "mac" ? AppleIcon : LinuxIcon;
  const assetKey = os === "windows" ? "winMsi" : os === "mac" ? (arch === "x64" ? "macIntel" : "macArm") : arch === "arm64" ? "linuxArm" : "linuxX64";
  const sizeText = formatSize(release.assets[ASSETS[assetKey]]?.size, locale);
  const meta = fmt(t.hero.meta, { version: release.version, size: sizeText });

  return (
    <div className="flex flex-col items-center gap-2">
      {os === "windows" ? (
        <a
          href={latestAsset(ASSETS.winMsi)}
          className={cls}
          onClick={() => openDownload({ kind: "file", os: "windows", asset: "winMsi" })}
        >
          <Icon className={iconCls} />
          {label}
        </a>
      ) : (
        <button type="button" className={cls} onClick={() => openDownload({ kind: "command", os })}>
          <Icon className={iconCls} />
          {label}
        </button>
      )}
      {showMeta && <Meta light={tone === "cream"} text={meta} />}
    </div>
  );
}

function Meta({ text, light }: { text: string; light?: boolean }) {
  return <p className={`text-[13px] ${light ? "text-white/75" : "text-mist/80"}`}>{text}</p>;
}

/** On a phone: the game is for computers, so offer to send the link. */
export function MobileNotice({ t }: { t: Pick<Dict, "hero"> }) {
  const { os, ready } = usePlatform();
  const [copied, setCopied] = useState(false);
  if (!ready || os !== "mobile") return null;

  async function share() {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: "Snook Legend", text: t.hero.mobileText, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // The visitor closed the share sheet.
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl bg-ink-900/80 p-4 text-left ring-1 ring-white/10">
      <p className="font-semibold text-cream">{t.hero.mobileTitle}</p>
      <p className="mt-1 text-sm leading-relaxed text-mist">{t.hero.mobileText}</p>
      <button type="button" onClick={share} className="btn btn-gold mt-3 h-10 px-5 text-sm">
        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
        {copied ? t.hero.copied : t.hero.share}
      </button>
    </div>
  );
}

export function AllPlatformsLink({ label, className = "" }: { label: string; className?: string }) {
  return (
    <a href="#download" className={`btn btn-ghost h-14 px-6 text-[15px] sm:h-[3.75rem] ${className}`}>
      {label}
      <ArrowDown className="size-4" />
    </a>
  );
}
