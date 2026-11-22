"use client";

import { ArrowUpRight, Download, Terminal, X } from "lucide-react";
import type { Ref } from "react";
import type { Dict } from "@/i18n";
import { formatSize, type ReleaseInfo } from "@/lib/release";
import type { Arch } from "@/lib/platform";
import { ASSETS, INSTALL_SH, latestAsset, MS_STORE_URL } from "@/lib/site";
import { CommandBox } from "./CommandBox";
import { AppleIcon, LinuxIcon, MicrosoftIcon, WindowsIcon } from "./icons";
import type { DownloadTarget } from "./PlatformProvider";

type Props = {
  ref: Ref<HTMLDialogElement>;
  target: DownloadTarget | null;
  t: Pick<Dict, "modal" | "download" | "os">;
  release: ReleaseInfo;
  locale: string;
  arch: Arch;
};

export function DownloadModal({ ref, target, t, release, locale, arch }: Props) {
  const m = t.modal;
  const d = t.download;
  const size = (key: keyof typeof ASSETS) => formatSize(release.assets[ASSETS[key]]?.size, locale);

  const close = (e: React.MouseEvent) => (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close();

  const OsIcon = target?.os === "windows" ? WindowsIcon : target?.os === "mac" ? AppleIcon : LinuxIcon;
  const isFile = target?.kind === "file";
  const steps =
    !target ? [] : isFile ? (target.os === "windows" ? m.windows : target.os === "mac" ? m.mac : m.linux) : target.os === "mac" ? d.mac.steps : d.linux.steps;

  return (
    <dialog
      ref={ref}
      aria-labelledby="dl-title"
      className="m-auto w-[min(100vw-1.5rem,36rem)] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[1.75rem] bg-ink-850 p-0 text-cream shadow-[0_40px_120px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10 backdrop:cursor-pointer"
      onClick={(e) => {
        // A click on the backdrop closes it.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      {target && (
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(36_163_91/0.28),transparent)]" />
          <div className="relative flex items-start gap-4 p-6 pb-2 sm:p-8 sm:pb-2">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-felt-600/20 text-felt-300 ring-1 ring-felt-400/30">
              {isFile ? <Download className="size-6 animate-[bounce_1.6s_ease-in-out_2]" /> : <Terminal className="size-6" />}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="flex items-center gap-2 text-sm text-mist">
                <OsIcon className="size-4" /> {t.os[target.os]} · {fmtVersion(d.version, release.version)}
              </p>
              <h2 id="dl-title" className="font-display text-2xl font-bold tracking-tight sm:text-[1.7rem]">
                {isFile ? m.title : m.titleCommand}
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              className="-mr-2 -mt-1 grid size-10 place-items-center rounded-full text-mist transition hover:bg-white/10 hover:text-cream"
              aria-label={m.close}
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative space-y-6 p-6 pt-4 sm:p-8 sm:pt-5">
            {target.kind === "command" && (
              <>
                <p className="text-mist">{target.os === "mac" ? d.mac.cmdText : d.linux.cmdText}</p>
                <CommandBox command={INSTALL_SH} copyLabel={d.copy} copiedLabel={d.copied} />
              </>
            )}

            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold-400/15 font-display text-sm font-bold text-gold-300 ring-1 ring-gold-400/30">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 leading-relaxed text-cream/90">
                    <Rich text={s} />
                  </p>
                </li>
              ))}
            </ol>

            {isFile && target.os === "windows" && (
              <>
                <SmartScreen t={m.smartscreen} />
                <a
                  href={MS_STORE_URL}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-4 text-sm ring-1 ring-white/10 transition hover:bg-white/[0.07]"
                >
                  <MicrosoftIcon className="size-5 shrink-0" />
                  <span className="flex-1 text-cream/90">{m.windowsAlt}</span>
                  <ArrowUpRight className="size-4 text-mist" />
                </a>
              </>
            )}

            {isFile && target.os === "mac" && (
              <div className="space-y-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                <p className="text-sm text-cream/90">{m.macAlt}</p>
                <CommandBox command={INSTALL_SH} copyLabel={d.copy} copiedLabel={d.copied} />
              </div>
            )}

            {target.kind === "command" && (
              <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
                <p className="mb-3 text-sm font-semibold text-cream/90">{target.os === "mac" ? d.mac.fileTitle : d.linux.fileTitle}</p>
                <div className="grid gap-2">
                  {(target.os === "mac"
                    ? ([
                        ["macArm", d.mac.arm, arch !== "x64"],
                        ["macIntel", d.mac.intel, arch === "x64"],
                      ] as const)
                    : ([
                        ["linuxX64", d.linux.x64, arch !== "arm64"],
                        ["linuxArm", d.linux.arm, arch === "arm64"],
                      ] as const)
                  ).map(([key, label, primary]) => (
                    <a
                      key={key}
                      href={latestAsset(ASSETS[key])}
                      className={`btn btn-ghost h-11 justify-between rounded-xl px-4 text-sm ${primary ? "ring-1 ring-felt-400/40" : ""}`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Download className="size-4 shrink-0" />
                        <span className="truncate">{label}</span>
                      </span>
                      <span className="text-xs font-normal text-mist">{size(key)}</span>
                    </a>
                  ))}
                </div>
                {target.os === "mac" && <p className="mt-3 text-xs leading-relaxed text-fog">{d.mac.whichMac}</p>}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm">
              {isFile ? (
                <p className="text-mist">
                  {m.notStarted}{" "}
                  <a href={latestAsset(ASSETS[target.asset])} className="font-semibold text-gold-300 underline-offset-4 hover:underline">
                    {m.retry}
                  </a>
                </p>
              ) : (
                <span />
              )}
              <p className="font-display font-semibold text-felt-300">{m.enjoy}</p>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

function fmtVersion(template: string, version: string) {
  return template.replace("{version}", version);
}

/** Shows file names, commands and paths in a monospace font. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(snook-legend[\w.*-]*|\.\/snook-legend|tar -xf [^\s]+ ?[^\s]*|~\/[\w./-]*[\w/])/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <code key={i} className="rounded-md bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.88em] text-gold-200">
            {p}
          </code>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** A small picture of the SmartScreen window, with the two clicks to make. */
function SmartScreen({ t }: { t: Dict["modal"]["smartscreen"] }) {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl ring-1 ring-white/10">
      <div className="bg-[#1f5fa8] px-5 pb-4 pt-5 text-white">
        <p className="text-[17px] font-semibold tracking-tight">{t.title}</p>
        <p className="mt-2 text-[12px] leading-snug text-white/80">{t.text}</p>
        <p className="mt-2 inline-flex items-center gap-2 text-[12px] font-semibold underline decoration-white/60 underline-offset-2">
          <span className="relative">
            {t.more}
            <span className="absolute -inset-x-2 -inset-y-1 rounded-md ring-2 ring-gold-300 [animation:var(--animate-glow)]" />
          </span>
          <span className="rounded-full bg-gold-300 px-1.5 text-[10px] font-bold text-[#2b1a05] no-underline">1</span>
        </p>
      </div>
      <div className="flex items-center justify-end gap-2 bg-[#1a4f8c] px-5 py-3">
        <span className="inline-flex items-center gap-2 rounded-[3px] bg-white/90 px-3 py-1.5 text-[12px] font-semibold text-[#1a1a1a] ring-2 ring-gold-300">
          {t.run}
          <span className="rounded-full bg-gold-400 px-1.5 text-[10px] font-bold text-[#2b1a05]">2</span>
        </span>
        <span className="rounded-[3px] bg-white/15 px-3 py-1.5 text-[12px] text-white/90">{t.dont}</span>
      </div>
    </div>
  );
}
