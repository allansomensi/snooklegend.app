"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

/** Copies this page's address (or shares it, on a phone that can). */
export function CopyLink({ url, label, done, title }: { url: string; label: string; done: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ url, title });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Cancelled, or no clipboard: nothing to do.
    }
  };
  return (
    <button type="button" onClick={copy} className="btn btn-ghost h-10 px-4 text-sm">
      {copied ? <Check className="size-4 text-felt-300" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      <span aria-live="polite">{copied ? done : label}</span>
    </button>
  );
}
