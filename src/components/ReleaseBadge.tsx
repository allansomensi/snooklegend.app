"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import { CHANGELOG_URL } from "@/lib/site";
import { usePlatform } from "./PlatformProvider";

/** The latest version and a line about the game, linking to the changelog.
 * The version follows the release the download buttons offer (a new one may
 * be out since the site was built). */
export function ReleaseBadge({ text }: { text: string }) {
  const { release } = usePlatform();
  return (
    <a
      href={CHANGELOG_URL}
      target="_blank"
      rel="noopener"
      className="rise group mx-auto inline-flex max-w-full items-center gap-2 rounded-full bg-ink-900/70 py-1.5 pl-1.5 pr-4 text-[13px] text-cream/85 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:ring-white/20"
    >
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-400/15 px-2.5 py-0.5 font-semibold text-gold-200 ring-1 ring-gold-400/30">
        <Sparkles className="size-3.5" aria-hidden="true" /> v{release.version}
      </span>
      <span className="truncate">{text}</span>
      <ArrowUpRight className="size-3.5 shrink-0 text-mist transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
    </a>
  );
}
