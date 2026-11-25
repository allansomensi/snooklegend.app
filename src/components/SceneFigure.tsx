"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A rules scene with its caption: it plays only while on screen, and can be
 * paused (motion that goes on by itself must be stoppable) or replayed.
 */
export function SceneFigure({
  children,
  caption,
  words,
}: {
  children: ReactNode;
  caption: string;
  words: { play: string; pause: string; replay: string };
}) {
  const ref = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(m.matches);
    sync();
    m.addEventListener("change", sync);
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVisible(true);
      return () => m.removeEventListener("change", sync);
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => {
      io.disconnect();
      m.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const anims = ref.current?.getAnimations?.({ subtree: true }) ?? [];
    for (const a of anims) {
      if (visible && !paused) a.play();
      else a.pause();
    }
  }, [visible, paused]);

  const replay = () => {
    for (const a of ref.current?.getAnimations?.({ subtree: true }) ?? []) {
      a.currentTime = 0;
      a.play();
    }
    setPaused(false);
  };

  return (
    <figure ref={ref} className="overflow-hidden rounded-2xl bg-ink-900 ring-1 ring-white/[0.08]">
      <div className="p-2 sm:p-3">{children}</div>
      <figcaption className="flex items-start gap-3 border-t border-white/[0.06] px-4 py-3">
        <span className="flex-1 text-[13.5px] leading-snug text-mist">{caption}</span>
        {!reduced && (
          <span className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="grid size-8 place-items-center rounded-full text-cream/70 transition hover:bg-white/[0.07] hover:text-cream"
              aria-label={paused ? words.play : words.pause}
              title={paused ? words.play : words.pause}
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
            <button
              type="button"
              onClick={replay}
              className="grid size-8 place-items-center rounded-full text-cream/70 transition hover:bg-white/[0.07] hover:text-cream"
              aria-label={words.replay}
              title={words.replay}
            >
              <RotateCcw className="size-4" />
            </button>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
