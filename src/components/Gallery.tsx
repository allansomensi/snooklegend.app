"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dict } from "@/i18n";
import { Shot } from "./Shot";

// The screenshots, in the order of the captions in the dictionaries.
const ALL = ["01-aim", "04-hall", "02-top", "03-elevation", "05-opponents", "06-lounge", "10-drills", "08-rules", "09-menu", "07-pictures"];
// The rules screen is shown in its own section.
const SHOWN = ALL.filter((s) => s !== "08-rules");

export function Gallery({ t, shotsDir }: { t: Dict["gallery"]; shotsDir: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const caption = (name: string) => t.items[ALL.indexOf(name)];

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + SHOWN.length) % SHOWN.length), []);

  // Arrow keys and swipes while the picture is open.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (!d.open) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    let startX: number | null = null;
    const onDown = (e: PointerEvent) => (startX = e.pointerType === "mouse" ? null : e.clientX);
    const onUp = (e: PointerEvent) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      startX = null;
    };
    document.addEventListener("keydown", onKey);
    d.addEventListener("pointerdown", onDown);
    d.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("keydown", onKey);
      d.removeEventListener("pointerdown", onDown);
      d.removeEventListener("pointerup", onUp);
    };
  }, [go]);

  const current = SHOWN[index];

  return (
    <>
      <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SHOWN.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => open(i)}
            data-reveal
            style={{ ["--reveal-delay" as string]: `${(i % 3) * 70}ms` }}
            className={`group relative overflow-hidden rounded-2xl bg-ink-900 text-left ring-1 ring-white/[0.08] transition-[box-shadow] duration-500 hover:ring-gold-400/40 ${
              i === 0 ? "sm:col-span-2 lg:row-span-2" : ""
            }`}
            aria-label={t.open.replace("{caption}", caption(name))}
          >
            <Shot
              dir={shotsDir}
              name={name}
              alt=""
              sizes={i === 0 ? "(max-width: 1024px) 100vw, 800px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"}
              className="h-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.035]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
              <span className={`font-medium text-cream ${i === 0 ? "text-base sm:text-lg" : "text-sm"}`}>{caption(name)}</span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-cream opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                <Expand className="size-4" />
              </span>
            </span>
          </button>
        ))}
      </div>

      <dialog
        ref={dialog}
        aria-label={caption(current)}
        className="m-auto max-h-none max-w-none bg-transparent p-0 text-cream backdrop:bg-black/90"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className="flex h-dvh w-screen flex-col items-center justify-center gap-4 px-3 py-14 sm:px-16" onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}>
          <figure className="relative w-full max-w-[min(100%,calc((100dvh-9rem)*16/9))]">
            <div className="overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10">
              <Shot key={current} dir={shotsDir} name={current} alt={caption(current)} sizes="100vw" priority />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4 text-sm text-cream/85">
              <span>{caption(current)}</span>
              <span className="tabular-nums text-fog">
                {index + 1} / {SHOWN.length}
              </span>
            </figcaption>
          </figure>
        </div>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          className="fixed right-3 top-3 grid size-11 place-items-center rounded-full bg-white/10 text-cream backdrop-blur transition hover:bg-white/20"
          aria-label={t.close}
        >
          <X className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => go(-1)}
          className="fixed left-2 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-cream backdrop-blur transition hover:bg-white/20 sm:grid"
          aria-label={t.prev}
        >
          <ChevronLeft className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="fixed right-2 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-cream backdrop-blur transition hover:bg-white/20 sm:grid"
          aria-label={t.next}
        >
          <ChevronRight className="size-6" />
        </button>
      </dialog>
    </>
  );
}
