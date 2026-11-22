"use client";

import { ArrowUpRight, ChevronDown, Download, FileArchive, Package, ShieldCheck, Terminal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { fmt, type Dict } from "@/i18n";
import { formatSize } from "@/lib/release";
import {
  ASSETS,
  CHANGELOG_URL,
  GITHUB_URL,
  INSTALL_PS1,
  INSTALL_SH,
  latestAsset,
  MS_STORE_URL,
  RELEASES_URL,
  type AssetKey,
} from "@/lib/site";
import { CommandBox } from "./CommandBox";
import { Rich } from "./DownloadModal";
import { AppleIcon, GithubIcon, LinuxIcon, MicrosoftIcon, WindowsIcon } from "./icons";
import { usePlatform, type DesktopOS } from "./PlatformProvider";
import { SectionHeading } from "./Section";

type Props = {
  t: Pick<Dict, "download" | "os" | "requirements">;
  locale: string;
  /** The release date of the build's release, written on the server. */
  releasedOn: { tag: string; text: string };
};

const TABS: { os: DesktopOS; Icon: typeof WindowsIcon }[] = [
  { os: "windows", Icon: WindowsIcon },
  { os: "mac", Icon: AppleIcon },
  { os: "linux", Icon: LinuxIcon },
];

const FILES: Record<DesktopOS, AssetKey[]> = {
  windows: ["winMsi", "winZip"],
  mac: ["macArm", "macIntel"],
  linux: ["linuxX64", "linuxArm"],
};

const VERIFY: Record<DesktopOS, (file: string) => { prompt: string; cmd: string }> = {
  windows: (f) => ({ prompt: "PS>", cmd: `Get-FileHash .\\${f} -Algorithm SHA256` }),
  mac: (f) => ({ prompt: "$", cmd: `shasum -a 256 ${f}` }),
  linux: (f) => ({ prompt: "$", cmd: `sha256sum ${f}` }),
};

export function DownloadSection({ t, locale, releasedOn }: Props) {
  const d = t.download;
  const { os, arch, ready, release, openDownload } = usePlatform();
  const detected: DesktopOS | null = ready && (os === "windows" || os === "mac" || os === "linux") ? os : null;
  const [chosen, setChosen] = useState<DesktopOS | null>(null);
  const tab = chosen ?? detected ?? "windows";
  const size = (k: AssetKey) => formatSize(release.assets[ASSETS[k]]?.size, locale);

  return (
    <section id="download" aria-labelledby="download-title" className="defer-render relative py-24 [--defer-size:2000px] sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[44rem] w-[72rem] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(24_138_74/0.14),transparent)]" />
      </div>
      <div className="container-page">
        <SectionHeading id="download-title" kicker={d.kicker} title={d.title} sub={d.sub} />

        {/* OS tabs */}
        <div data-reveal className="mt-12 flex justify-center">
          <div role="tablist" aria-label={d.kicker} className="inline-flex rounded-full bg-white/[0.05] p-1.5 ring-1 ring-white/10">
            {TABS.map(({ os: o, Icon }) => {
              const active = tab === o;
              return (
                <button
                  key={o}
                  role="tab"
                  id={`tab-${o}`}
                  aria-selected={active}
                  aria-controls={`panel-${o}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setChosen(o)}
                  onKeyDown={(e) => {
                    const i = TABS.findIndex((x) => x.os === o);
                    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
                    if (next === null) return;
                    const n = TABS[(next + TABS.length) % TABS.length].os;
                    setChosen(n);
                    document.getElementById(`tab-${n}`)?.focus();
                  }}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition sm:px-6 sm:text-[15px] ${
                    active ? "bg-cream text-ink-950 shadow-lg" : "text-cream/70 hover:text-cream"
                  }`}
                >
                  <Icon className="size-4" />
                  {t.os[o]}
                  {detected === o && (
                    <span className={`size-1.5 rounded-full ${active ? "bg-felt-600" : "bg-felt-400"}`} title={d.detected} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="mx-auto mt-10 max-w-5xl">
          {tab === "windows" && (
            <div className="grid gap-4 md:grid-cols-3">
              <Option
                className="md:col-span-3"
                recommended={d.recommended}
                icon={<Package />}
                title={d.windows.msiTitle}
                text={d.windows.msiText}
                detected={detected === "windows" ? d.detected : undefined}
              >
                <a
                  href={latestAsset(ASSETS.winMsi)}
                  onClick={() => openDownload({ kind: "file", os: "windows", asset: "winMsi" })}
                  className="btn btn-felt h-13 px-7 text-base"
                >
                  <Download className="size-5" /> {d.windows.msiButton}
                  <span className="text-sm font-medium text-white/75">{size("winMsi")}</span>
                </a>
              </Option>
              <Option icon={<MicrosoftIcon />} title={d.windows.storeTitle} text={d.windows.storeText}>
                <a href={MS_STORE_URL} target="_blank" rel="noopener" className="btn btn-ghost h-11 w-full px-5 text-sm">
                  {d.windows.storeButton} <ArrowUpRight className="size-4" />
                </a>
              </Option>
              <Option icon={<FileArchive />} title={d.windows.zipTitle} text={d.windows.zipText}>
                <a
                  href={latestAsset(ASSETS.winZip)}
                  onClick={() => openDownload({ kind: "file", os: "windows", asset: "winZip" })}
                  className="btn btn-ghost h-11 w-full px-5 text-sm"
                >
                  <Download className="size-4" /> {d.windows.zipButton}
                  <span className="text-xs font-normal text-mist">{size("winZip")}</span>
                </a>
              </Option>
              <Option icon={<Terminal />} title={d.windows.psTitle} text={d.windows.psText}>
                <CommandBox command={INSTALL_PS1} prompt="PS>" copyLabel={d.copy} copiedLabel={d.copied} />
              </Option>
            </div>
          )}

          {(tab === "mac" || tab === "linux") && (
            <div className="grid gap-4">
              <Option
                recommended={d.recommended}
                icon={<Terminal />}
                title={tab === "mac" ? d.mac.cmdTitle : d.linux.cmdTitle}
                text={tab === "mac" ? d.mac.cmdText : d.linux.cmdText}
                detected={detected === tab ? d.detected : undefined}
                wide
              >
                <CommandBox command={INSTALL_SH} copyLabel={d.copy} copiedLabel={d.copied} className="w-full" />
                <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                  {(tab === "mac" ? d.mac.steps : d.linux.steps).map((s, i) => (
                    <li key={i} className="flex gap-3 rounded-2xl bg-black/20 p-4 text-sm leading-relaxed text-cream/85 ring-1 ring-white/[0.06]">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold-400/15 font-display text-xs font-bold text-gold-300 ring-1 ring-gold-400/30">
                        {i + 1}
                      </span>
                      <span>
                        <Rich text={s} />
                      </span>
                    </li>
                  ))}
                </ol>
              </Option>

              <Option
                icon={<FileArchive />}
                title={tab === "mac" ? d.mac.fileTitle : d.linux.fileTitle}
                text={tab === "mac" ? d.mac.fileText : d.linux.fileText}
                wide
                note={tab === "mac" ? d.mac.whichMac : d.linux.deps}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {(tab === "mac"
                    ? ([
                        ["macArm", d.mac.arm, arch !== "x64"],
                        ["macIntel", d.mac.intel, arch === "x64"],
                      ] as const)
                    : ([
                        ["linuxX64", d.linux.x64, arch !== "arm64"],
                        ["linuxArm", d.linux.arm, arch === "arm64"],
                      ] as const)
                  ).map(([key, label, likely]) => (
                    <a
                      key={key}
                      href={latestAsset(ASSETS[key])}
                      onClick={() => openDownload({ kind: "file", os: tab, asset: key })}
                      className={`btn btn-ghost h-12 justify-between rounded-2xl px-5 text-sm ${likely && detected === tab ? "ring-1 ring-felt-400/50" : ""}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Download className="size-4" /> {label}
                      </span>
                      <span className="text-xs font-normal text-mist">{size(key)}</span>
                    </a>
                  ))}
                </div>
              </Option>
            </div>
          )}

          {/* Version, links and checksums */}
          <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-white/[0.025] p-5 ring-1 ring-white/[0.07] sm:p-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <span className="inline-flex items-center gap-2 font-semibold text-cream">
                <span className="size-2 rounded-full bg-felt-400 shadow-[0_0_10px_2px_rgb(63_192_118/0.6)]" />
                {fmt(d.version, { version: release.version })}
              </span>
              <span className="text-mist">{fmt(d.released, {
                  date:
                    release.tag === releasedOn.tag
                      ? releasedOn.text
                      : new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(release.date)),
                })}</span>
              <span className="flex flex-1 flex-wrap justify-end gap-x-5 gap-y-2">
                <ExtLink href={CHANGELOG_URL}>{d.whatsNew}</ExtLink>
                <ExtLink href={RELEASES_URL}>{d.allReleases}</ExtLink>
                <ExtLink href={GITHUB_URL}>
                  <GithubIcon className="size-4" /> {d.source}
                </ExtLink>
              </span>
            </div>

            <details className="group rounded-2xl bg-black/20 ring-1 ring-white/[0.06]">
              <summary className="flex cursor-pointer items-center gap-3 px-4 py-3.5 text-sm font-semibold text-cream/85 transition hover:text-cream">
                <ShieldCheck className="size-4 text-felt-400" />
                {d.checksums}
                <ChevronDown className="ml-auto size-4 text-mist transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-4 border-t border-white/[0.06] px-4 pb-5 pt-4">
                <p className="text-sm text-mist">{d.checksumsText}</p>
                <CommandBox
                  command={VERIFY[tab](ASSETS[FILES[tab][0]]).cmd}
                  prompt={VERIFY[tab](ASSETS[FILES[tab][0]]).prompt}
                  copyLabel={d.copy}
                  copiedLabel={d.copied}
                />
                <ul className="space-y-2">
                  {FILES[tab].map((k) => {
                    const sha = release.assets[ASSETS[k]]?.sha256;
                    return (
                      <li key={k} className="rounded-xl bg-white/[0.03] px-3.5 py-2.5 font-mono text-xs">
                        <span className="text-cream/90">{ASSETS[k]}</span>
                        <span className="mt-1 block break-all text-fog">
                          {sha ?? (
                            <a href={latestAsset(`${ASSETS[k]}.sha256`)} className="text-gold-300 underline-offset-4 hover:underline">
                              {ASSETS[k]}.sha256
                            </a>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          </div>

          {/* System requirements */}
          <div data-reveal className="mt-14">
            <h3 className="text-center font-display text-2xl font-bold tracking-tight text-cream">
              {t.requirements.title}
            </h3>
            <dl className="mt-6 grid gap-px overflow-hidden rounded-3xl bg-white/[0.06] ring-1 ring-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
              {t.requirements.items.map((r) => (
                <div key={r.label} className="bg-ink-900/95 p-5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-300/90">{r.label}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-cream/85">{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function Option({
  icon,
  title,
  text,
  children,
  recommended,
  detected,
  note,
  wide = false,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  text: string;
  children: ReactNode;
  recommended?: string;
  detected?: string;
  note?: string;
  wide?: boolean;
  className?: string;
}) {
  const big = Boolean(recommended);
  return (
    <div
      className={`card noise flex flex-col overflow-hidden p-6 sm:p-7 ${
        big ? "ring-1 ring-felt-400/30 shadow-[0_30px_80px_-40px_rgb(36_163_91/0.6)]" : ""
      } ${className}`}
    >
      {big && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_0%_0%,rgb(36_163_91/0.16),transparent_60%)]" />}
      <div className={`relative flex flex-1 flex-col gap-5 ${big && !wide ? "md:flex-row md:items-center md:justify-between" : ""}`}>
        <div className="flex items-start gap-4">
          <span
            className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 [&>svg]:size-5 ${
              big ? "bg-felt-500/20 text-felt-300 ring-felt-400/30" : "bg-white/[0.05] text-cream/80 ring-white/10"
            }`}
          >
            {icon}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-bold tracking-tight text-cream sm:text-xl">{title}</h3>
              {recommended && (
                <span className="rounded-full bg-felt-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-felt-300 ring-1 ring-felt-400/30">
                  {recommended}
                </span>
              )}
              {detected && (
                <span className="rounded-full bg-gold-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-gold-300 ring-1 ring-gold-400/25">
                  {detected}
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist">{text}</p>
          </div>
        </div>
        <div className={big && !wide ? "shrink-0" : "mt-auto"}>{children}</div>
        {note && <p className="text-xs leading-relaxed text-fog">{note}</p>}
      </div>
    </div>
  );
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-1.5 font-medium text-cream/75 transition hover:text-gold-200"
    >
      {children}
      <ArrowUpRight className="size-3.5" />
    </a>
  );
}
