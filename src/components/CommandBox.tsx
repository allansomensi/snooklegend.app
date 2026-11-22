"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  command: string;
  prompt?: string;
  copyLabel: string;
  copiedLabel: string;
  className?: string;
};

/** A terminal command with a copy button. */
export function CommandBox({ command, prompt = "$", copyLabel, copiedLabel, className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // Old browsers or a page without clipboard permission: select the text instead.
      const range = document.createRange();
      const el = document.getElementById(id);
      if (el) {
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2200);
  }

  const id = `cmd-${hash(command)}`;

  return (
    <div
      className={`group relative flex items-stretch overflow-hidden rounded-2xl bg-black/50 ring-1 ring-white/10 ${className}`}
    >
      <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-3 overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-relaxed">
        <span className="select-none text-felt-400" aria-hidden="true">
          {prompt}
        </span>
        <code id={id} className="whitespace-nowrap text-cream/90">
          {command}
        </code>
      </div>
      <button
        type="button"
        onClick={copy}
        className={`flex shrink-0 items-center gap-2 border-l border-white/10 px-4 text-sm font-semibold transition-colors ${
          copied ? "bg-felt-600/30 text-felt-300" : "bg-white/[0.03] text-cream/80 hover:bg-white/[0.08] hover:text-cream"
        }`}
        aria-label={copied ? copiedLabel : copyLabel}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span className="hidden sm:inline">{copied ? copiedLabel : copyLabel}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? copiedLabel : ""}
      </span>
    </div>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}
