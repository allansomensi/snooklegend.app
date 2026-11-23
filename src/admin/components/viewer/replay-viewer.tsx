"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Download, Pause, Play, X } from "lucide-react";
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { api, ApiError } from "@/admin/lib/api";
import { downloadReplay } from "@/admin/lib/download";
import { useGameEnd } from "@/admin/lib/games";
import type { ReplayView, Stroke } from "@/admin/lib/types";
import "@/admin/styles/business.css";
import { useLocale } from "../providers/locale";
import { useToasts } from "../providers/toasts";
import { AlertBox, Btn, RulesBadge, Spinner, clickable } from "../ui/bits";
import { isFoulStroke, strokeWords } from "./strokes";

const BALL_COLORS = ["#f4efe2", "#f2c200", "#2051c9", "#d42a2a", "#6c2fa3", "#f07a1a", "#1d8a3a", "#8a2323", "#141414"];
const ballColor = (n: number) => BALL_COLORS[n > 8 ? n - 8 : n];
const SPEEDS: [string, string][] = [["0.25", "¼×"], ["0.5", "½×"], ["1", "1×"], ["2", "2×"], ["4", "4×"]];

type Spot = [number, number] | null;

/** A game, stored or being played, replayed from above: the table, the
 * strokes one by one, and what happened in each. */
export default function ReplayViewer({ path, fallback, onClose }: { path: string; fallback?: string; onClose: () => void }) {
  const { t } = useLocale();
  const [state, setState] = useState<{ data?: ReplayView; error?: string }>({});
  const closeBtn = useRef<HTMLButtonElement>(null);
  const wait = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctl = new AbortController();
    (async () => {
      try {
        let data: ReplayView;
        try {
          data = await api<ReplayView>(path, { signal: ctl.signal });
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 404 && fallback)) throw e;
          try {
            data = await api<ReplayView>(fallback, { signal: ctl.signal });
          } catch {
            throw e;
          }
        }
        setState({ data });
      } catch (e) {
        if (ctl.signal.aborted) return;
        setState({ error: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => ctl.abort();
  }, [path, fallback]);

  useEffect(() => {
    if (state.error) closeBtn.current?.focus();
  }, [state.error]);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="viewer">
          <Dialog.Content
            className="viewer-card card"
            aria-describedby={undefined}
            // The keyboard moves into the viewer while it loads.
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              wait.current?.focus();
            }}
          >
            {state.data ? (
              <Player data={state.data} onClose={onClose} />
            ) : (
              <>
                <Dialog.Title className="sr-only">{t("Replay")}</Dialog.Title>
                {state.error ? (
                  <>
                    <AlertBox tone="danger" title={t("The game couldn't be opened")} text={state.error} />
                    <div className="row">
                      <button ref={closeBtn} type="button" className="btn" onClick={onClose}>{t("Close")}</button>
                    </div>
                  </>
                ) : (
                  <div ref={wait} className="viewer-wait" role="status" tabIndex={-1}>
                    <Spinner />
                    {t("Rebuilding the game…")}
                  </div>
                )}
              </>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface Playback {
  k: number;
  f: number;
  pos: Spot[];
  playing: boolean;
  speed: number;
  acc: number;
  last: number;
  raf: number;
  hold: ReturnType<typeof setTimeout> | undefined;
}

function Player({ data, onClose }: { data: ReplayView; onClose: () => void }) {
  const locale = useLocale();
  const { t, tf, tn, fmtDate } = locale;
  const { toast } = useToasts();
  const gameEnd = useGameEnd();
  const words = useMemo(() => strokeWords(locale), [locale]);
  const m = data.match;
  const names = m.players;
  const strokes = data.strokes;

  // What is drawn each frame lives outside React (the balls move 30 times
  // a second); React draws again only when the stroke or the state changes.
  const st = useRef<Playback>({ k: 0, f: 0, pos: [], playing: false, speed: 1, acc: 0, last: 0, raf: 0, hold: undefined });
  const balls = useRef<(SVGGElement | null)[]>([]);
  const scrub = useRef<HTMLInputElement>(null);
  const playBtn = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState({ k: 0, f: 0, playing: false });
  const [speed, setSpeed] = useState("1");

  const frames = useCallback((k: number) => (k < strokes.length ? strokes[k].frames : []), [strokes]);
  const startOf = useCallback(
    (k: number): Spot[] => (k < strokes.length ? strokes[k].start : data.end).map((p) => (p ? [p[0], p[1]] : null)),
    [strokes, data.end],
  );

  const drawBalls = useCallback(() => {
    const s = st.current;
    s.pos.forEach((p, n) => {
      const g = balls.current[n];
      if (!g) return;
      if (p) {
        g.setAttribute("transform", `translate(${p[0]},${-p[1]})`);
        g.removeAttribute("visibility");
      } else g.setAttribute("visibility", "hidden");
    });
    if (scrub.current) scrub.current.value = String(s.f);
  }, []);

  const sync = useCallback(() => {
    const s = st.current;
    setView({ k: s.k, f: s.f, playing: s.playing });
  }, []);

  const seek = useCallback(
    (k: number, f: number) => {
      const s = st.current;
      s.k = Math.max(0, Math.min(k, strokes.length));
      s.pos = startOf(s.k);
      const fr = frames(s.k);
      s.f = Math.max(0, Math.min(f, fr.length));
      for (let i = 0; i < s.f; i++) applyFrame(s.pos, fr[i]);
      drawBalls();
      sync();
    },
    [strokes.length, startOf, frames, drawBalls, sync],
  );

  const pause = useCallback(() => {
    const s = st.current;
    s.playing = false;
    cancelAnimationFrame(s.raf);
    clearTimeout(s.hold);
    sync();
  }, [sync]);

  const tick = useCallback(
    function loop(now: number) {
      const s = st.current;
      if (!s.playing) return;
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 0;
      s.last = now;
      s.acc += dt * data.fps * s.speed;
      const fr = frames(s.k);
      let moved = false;
      while (s.acc >= 1 && s.f < fr.length) {
        applyFrame(s.pos, fr[s.f]);
        s.f++;
        s.acc -= 1;
        moved = true;
      }
      if (moved) drawBalls();
      if (s.f >= fr.length) {
        s.acc = 0;
        if (s.k >= strokes.length) {
          pause();
          return;
        }
        // A short rest between strokes, as at a table.
        clearTimeout(s.hold);
        s.hold = setTimeout(() => {
          if (!st.current.playing) return;
          seek(s.k + 1, 0);
          s.last = 0;
          s.raf = requestAnimationFrame(loop);
        }, 650 / s.speed);
        return;
      }
      s.raf = requestAnimationFrame(loop);
    },
    [data.fps, frames, drawBalls, strokes.length, pause, seek],
  );

  const play = useCallback(() => {
    const s = st.current;
    if (s.k >= strokes.length) seek(0, 0);
    s.playing = true;
    s.last = 0;
    s.acc = 0;
    sync();
    cancelAnimationFrame(s.raf);
    s.raf = requestAnimationFrame(tick);
  }, [strokes.length, seek, sync, tick]);

  const toggle = useCallback(() => (st.current.playing ? pause() : play()), [pause, play]);
  const stepFrame = useCallback(
    (d: number) => {
      pause();
      const s = st.current;
      const fr = frames(s.k);
      if (d > 0) {
        if (s.f < fr.length) seek(s.k, s.f + 1);
        else if (s.k < strokes.length) seek(s.k + 1, 0);
      } else if (s.f > 0) seek(s.k, s.f - 1);
      else if (s.k > 0) seek(s.k - 1, frames(s.k - 1).length);
    },
    [pause, frames, seek, strokes.length],
  );
  const stepStroke = useCallback(
    (d: number) => {
      pause();
      const s = st.current;
      if (d < 0 && s.f > 0) seek(s.k, 0);
      else seek(s.k + d, 0);
    },
    [pause, seek],
  );
  const pick = useCallback(
    (k: number) => {
      pause();
      seek(k, 0);
    },
    [pause, seek],
  );

  useEffect(() => {
    const s = st.current;
    seek(0, 0);
    playBtn.current?.focus();
    return () => {
      cancelAnimationFrame(s.raf);
      clearTimeout(s.hold);
    };
  }, [seek]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Already handled (Enter or Space on a stroke of the list).
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target as HTMLElement;
    if (["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName) && el !== scrub.current) return;
    if (e.key === " ") {
      // A focused button would "click" on Space too: the shortcut wins.
      e.preventDefault();
      toggle();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepStroke(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepStroke(1);
    } else if (e.key === ",") stepFrame(-1);
    else if (e.key === ".") stepFrame(1);
  };

  const over = data.over
    ? tf("{name} won ({how})", { name: names[data.over.winner] || "?", how: gameEnd(data.over.reason) })
    : m.live ? t("still being played") : t("unfinished");
  const cur = strokes[view.k];
  const frameCount = frames(view.k).length;
  const matchId = m.id;

  return (
    <div className="viewer-inner" onKeyDown={onKeyDown}>
      <div className="viewer-head">
        <div className="viewer-title">
          <Dialog.Title asChild>
            <b>{names[0] + " × " + names[1]}</b>
          </Dialog.Title>
          <span className="muted row">
            <RulesBadge rules={data.rules} long />
            {[m.live ? t("in progress") : m.rated ? t("rated") : t("casual"), m.live ? t("so far") : fmtDate(m.at), matchId ? "#" + matchId : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        <div className="row">
          {matchId && !m.live ? (
            <Btn label={t("Download")} kind="sm ghost" icon={Download}
              onClick={() => downloadReplay(matchId).catch((e) => toast(e instanceof Error ? e.message : String(e), "error"))} />
          ) : null}
          <Btn label={t("Close") + " (Esc)"} kind="ghost" icon={X} iconOnly onClick={onClose} />
        </div>
      </div>
      <div className="viewer-body">
        <div className="viewer-stage">
          <Table data={data} balls={balls} />
          <input ref={scrub} type="range" min={0} max={frameCount} defaultValue={0} className="scrub" aria-label={t("Position in the stroke")}
            disabled={frameCount === 0}
            onChange={(e) => {
              pause();
              seek(st.current.k, Number(e.currentTarget.value));
            }} />
          <div className="viewer-controls">
            <Btn label={t("Previous stroke") + " (←)"} icon={ChevronLeft} iconOnly disabled={view.k === 0 && view.f === 0} onClick={() => stepStroke(-1)} />
            <button type="button" className="btn" title={t("One frame back") + " (,)"} aria-label={t("One frame back")} onClick={() => stepFrame(-1)}>‹</button>
            <button ref={playBtn} type="button" className="btn primary play" title={t("Play or pause") + " (" + t("Space") + ")"} aria-pressed={view.playing} onClick={toggle}>
              {view.playing ? <Pause className="icon" aria-hidden /> : <Play className="icon" aria-hidden />}
              {view.playing ? t("Pause") : t("Play")}
            </button>
            <button type="button" className="btn" title={t("One frame forward") + " (.)"} aria-label={t("One frame forward")} onClick={() => stepFrame(1)}>›</button>
            <Btn label={t("Next stroke") + " (→)"} icon={ChevronRight} iconOnly disabled={view.k >= strokes.length} onClick={() => stepStroke(1)} />
            <select className="select" aria-label={t("Speed")} value={speed}
              onChange={(e) => {
                setSpeed(e.target.value);
                st.current.speed = Number(e.target.value);
              }}>
              {SPEEDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="viewer-status">
            {cur ? (
              <>
                <b>{tf("Stroke {n} of {total}", { n: view.k + 1, total: strokes.length })}</b>
                {" · " + words.summary(cur, names).join(" · ")}
                <div className="muted details">{words.details(cur, data.rules).join(" · ")}</div>
              </>
            ) : (
              <>
                <b>{t("End of the game")}</b>
                {" · " + over}
              </>
            )}
          </div>
        </div>
        <div className="viewer-side">
          <div className="side-head">{tn(strokes.length, "{n} stroke", "{n} strokes") + " · " + over}</div>
          <StrokeList strokes={strokes} names={names} current={view.k} follow={view.playing} words={words} onPick={pick} />
        </div>
      </div>
      {data.error ? <AlertBox tone="warning" title={t("The replay stops early")} text={data.error} /> : null}
    </div>
  );
}

/** A frame lists only what moved: [ball, x, y, ball, x, y…], null once a
 * ball has left the table. */
function applyFrame(pos: Spot[], frame: (number | null)[]) {
  for (let i = 0; i + 2 < frame.length; i += 3) {
    const x = frame[i + 1];
    const y = frame[i + 2];
    pos[frame[i] as number] = x === null || y === null ? null : [x, y];
  }
}

const StrokeList = memo(function StrokeList({ strokes, names, current, follow, words, onPick }: {
  strokes: Stroke[];
  names: string[];
  current: number;
  follow: boolean;
  words: ReturnType<typeof strokeWords>;
  onPick: (k: number) => void;
}) {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (!follow || !strokes.length) return;
    list.current?.children[Math.min(current, strokes.length - 1)]?.scrollIntoView({ block: "nearest" });
  }, [current, follow, strokes.length]);
  return (
    <ol ref={list} className="stroke-list">
      {strokes.map((s, k) => {
        const [who, what] = words.summary(s, names);
        return (
          <li key={k} className={[isFoulStroke(s) ? "foul" : "", k === current ? "current" : ""].join(" ").trim()}
            aria-current={k === current ? "step" : undefined} {...clickable(() => onPick(k))}>
            <span className="n">{k + 1}</span>
            <span className={"who seat" + s.seat}>{who}</span>
            <span className="what">{what}</span>
          </li>
        );
      })}
    </ol>
  );
});

/** The table from above, in millimetres (y up, as the game has it). */
const Table = memo(function Table({ data, balls }: { data: ReplayView; balls: RefObject<(SVGGElement | null)[]> }) {
  const locale = useLocale();
  const { t, tf } = locale;
  const { pocketName } = useMemo(() => strokeWords(locale), [locale]);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const tb = data.table;
  const R = tb.ball_radius;
  const rail = 120;
  const L = tb.length;
  const Wd = tb.width;
  const vb = [-L / 2 - rail, -Wd / 2 - rail, L + 2 * rail, Wd + 2 * rail];
  const diamonds: [number, number][] = [];
  for (let k = 1; k < 8; k++) if (k !== 4) for (const sy of [-1, 1]) diamonds.push([-L / 2 + (k * L) / 8, sy * (Wd / 2 + rail * 0.62)]);
  for (let k = 1; k < 4; k++) for (const sx of [-1, 1]) diamonds.push([sx * (L / 2 + rail * 0.62), -Wd / 2 + (k * Wd) / 4]);
  return (
    <svg viewBox={vb.join(" ")} className="table-svg" role="img" aria-label={t("The table from above")}>
      <defs>
        {[9, 10, 11, 12, 13, 14, 15].map((n) => (
          <clipPath key={n} id={`${uid}-b${n}`}>
            <circle r={R} />
          </clipPath>
        ))}
      </defs>
      <rect x={vb[0]} y={vb[1]} width={vb[2]} height={vb[3]} rx={70} className="t-rail" />
      <rect x={-L / 2 - 38} y={-Wd / 2 - 38} width={L + 76} height={Wd + 76} rx={18} className="t-cushion" />
      <rect x={-L / 2} y={-Wd / 2} width={L} height={Wd} className="t-cloth" />
      <line x1={-L / 4} x2={-L / 4} y1={-Wd / 2} y2={Wd / 2} className="t-string" />
      <circle cx={L / 4} cy={0} r={7} className="t-spot" />
      {diamonds.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={7} className="t-diamond" />)}
      {tb.cushions.map((c, k) => <line key={k} x1={c[0]} y1={-c[1]} x2={c[2]} y2={-c[3]} className="t-jaw" />)}
      {tb.pockets.map((p) => (
        <circle key={p.name} cx={p.x} cy={-p.y} r={p.r} className="t-pocket">
          <title>{pocketName(p.name)}</title>
        </circle>
      ))}
      {Array.from({ length: 16 }, (_, n) => (
        <g key={n} className="ball" visibility="hidden" ref={(g) => { balls.current[n] = g; }}>
          {n > 8 ? (
            <>
              <circle r={R} fill="#f4efe2" />
              <rect x={-R} y={-R * 0.55} width={2 * R} height={R * 1.1} fill={ballColor(n)} clipPath={`url(#${uid}-b${n})`} />
            </>
          ) : (
            <circle r={R} fill={ballColor(n)} />
          )}
          <circle r={R} className="ball-edge" />
          {n > 0 ? (
            <>
              <circle r={R * 0.5} className="ball-disc" />
              <text y={R * 0.22} textAnchor="middle" className="ball-num">{n}</text>
            </>
          ) : null}
          <title>{n === 0 ? t("Cue ball") : tf("The {n}", { n })}</title>
        </g>
      ))}
    </svg>
  );
});
