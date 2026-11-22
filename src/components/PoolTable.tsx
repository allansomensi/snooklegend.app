"use client";

import { RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Dict } from "@/i18n";
import { Ball as BallChip, ballColor } from "./Ball";

// ── The table, in table units (the cloth is 1000 × 500) ─────────────────────
const W = 1000;
const H = 500;
const R = 13.5; // ball radius
const RAIL = 50; // the wooden frame around the cloth
const TW = W + RAIL * 2;
const TH = H + RAIL * 2;
const CORNER_R = 27;
const SIDE_R = 24;
const CORNER_MOUTH = 26;
const SIDE_MOUTH = 22;
const POCKETS = [
  { x: -2, y: -2, r: CORNER_R },
  { x: W / 2, y: -6, r: SIDE_R },
  { x: W + 2, y: -2, r: CORNER_R },
  { x: -2, y: H + 2, r: CORNER_R },
  { x: W / 2, y: H + 6, r: SIDE_R },
  { x: W + 2, y: H + 2, r: CORNER_R },
];
const HEAD = { x: W * 0.25, y: H / 2 };
const FOOT = { x: W * 0.72, y: H / 2 };
const RACK = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 6, 13, 7, 14, 15];

const MAX_SPEED = 2500; // units per second at full power
const FRICTION = 360; // rolling resistance, units/s²
const DAMPING = 0.2; // a little air and cloth drag
const E_BALL = 0.95;
const E_CUSHION = 0.76;
const PULL = 230; // how far to pull back for full power

type BallState = {
  n: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  on: boolean;
  sink: null | { px: number; py: number; t: number };
};

type Props = { t: Dict["play"] };

export function PoolTable({ t }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);
  const mutedRef = useRef(false);

  const [potted, setPotted] = useState<number[]>([]);
  const [shots, setShots] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const [muted, setMuted] = useState(false);
  const touch = useSyncExternalStore(noopSubscribe, isCoarse, () => false);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    let msgTimer: ReturnType<typeof setTimeout> | null = null;
    const engine = createEngine(canvas, {
      onPot: (n) => {
        if (n === 0) {
          setMessage(t.scratch);
          if (msgTimer) clearTimeout(msgTimer);
          msgTimer = setTimeout(() => setMessage(null), 2600);
        } else setPotted((p) => [...p, n]);
      },
      onShot: () => setShots((s) => s + 1),
      onCleared: () => setCleared(true),
      muted: () => mutedRef.current,
    });
    engineRef.current = engine;

    const ro = new ResizeObserver(() => engine.resize(wrap.clientWidth));
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => engine.setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(canvas);

    return () => {
      ro.disconnect();
      io.disconnect();
      engine.destroy();
      if (msgTimer) clearTimeout(msgTimer);
    };
  }, [t.scratch]);

  const rack = useCallback(() => {
    engineRef.current?.rack();
    setPotted([]);
    setShots(0);
    setCleared(false);
    setMessage(null);
  }, []);

  const breakShot = useCallback(() => engineRef.current?.breakShot(), []);

  const remaining = 15 - potted.length;

  return (
    <div className="relative">
      {/* Score bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-5 text-sm">
          <span className="text-mist">
            {t.potted} <strong className="ml-1 font-display text-xl text-cream">{potted.length}</strong>
            <span className="text-fog">/15</span>
          </span>
          <span className="text-mist">
            {t.shots} <strong className="ml-1 font-display text-xl text-cream">{shots}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {shots === 0 && remaining === 15 && (
            <button type="button" onClick={breakShot} className="btn btn-gold h-9 px-4 text-sm">
              {t.breakShot}
            </button>
          )}
          <button type="button" onClick={rack} className="btn btn-ghost h-9 px-4 text-sm">
            <RotateCcw className="size-4" /> {t.rack}
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="btn btn-ghost size-9 p-0"
            aria-pressed={muted}
            aria-label={muted ? t.soundOff : t.soundOn}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* The table */}
      <div ref={wrapRef} className="relative w-full" style={{ aspectRatio: `${TW} / ${TH}` }}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label={t.canvasLabel}
          role="application"
          className="absolute inset-0 size-full cursor-crosshair touch-none select-none rounded-[2.2%/4%] outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-4 focus-visible:ring-offset-ink-950"
        />
        {message && (
          <div className="pointer-events-none absolute inset-x-0 top-[12%] flex justify-center" aria-live="polite">
            <span className="rounded-full bg-ink-950/85 px-4 py-2 text-sm font-semibold text-gold-200 ring-1 ring-gold-400/30 backdrop-blur">
              {message}
            </span>
          </div>
        )}
        {cleared && (
          <div className="absolute inset-0 grid place-items-center rounded-[2.2%/4%] bg-ink-950/70 backdrop-blur-sm" aria-live="polite">
            <div className="px-6 text-center">
              <p className="font-display text-2xl font-extrabold text-gold sm:text-4xl">{t.cleared.replace("{shots}", String(shots))}</p>
              <p className="mt-2 text-mist">{t.clearedSub}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <a href="#download" className="btn btn-felt h-11 px-6">
                  {t.download}
                </a>
                <button type="button" onClick={rack} className="btn btn-ghost h-11 px-5">
                  <RotateCcw className="size-4" /> {t.rack}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tray of potted balls + hint */}
      <div className="mt-4 flex min-h-9 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" aria-label={`${t.potted}: ${potted.join(", ")}`}>
          {potted.map((n) => (
            <BallChip key={n} n={n} size={26} />
          ))}
        </div>
        <p className="text-sm text-fog">{touch ? t.hintTouch : t.hint}</p>
      </div>
    </div>
  );
}

const noopSubscribe = () => () => {};
const isCoarse = () => window.matchMedia("(pointer: coarse)").matches;

// ── The engine: physics, input and drawing, outside React ──────────────────

type EngineCallbacks = {
  onPot: (n: number) => void;
  onShot: () => void;
  onCleared: () => void;
  muted: () => boolean;
};

function createEngine(canvas: HTMLCanvasElement, cb: EngineCallbacks) {
  const ctx = canvas.getContext("2d")!;
  let scale = 1;
  let dpr = 1;
  let balls: BallState[] = [];
  let visible = false;
  let raf = 0;
  let last = 0;
  let dirty = true;
  let shotRunning = false;
  let scratched = false;
  let staticLayer: HTMLCanvasElement | null = null;

  // Aiming
  let pointer: { x: number; y: number } | null = null;
  let drag: null | { d0: number; id: number } = null;
  let power = 0;
  let aim = 0; // angle, radians
  let keyboard = false;

  // Sound
  let audio: AudioContext | null = null;
  let lastSound = 0;

  const cue = () => balls.find((b) => b.n === 0)!;
  const moving = () => balls.some((b) => (b.on && (b.vx !== 0 || b.vy !== 0)) || b.sink);
  const canShoot = () => !moving() && cue().on && balls.some((b) => b.on && b.n !== 0);

  function rack() {
    balls = [{ n: 0, x: HEAD.x, y: HEAD.y, vx: 0, vy: 0, on: true, sink: null }];
    let k = 0;
    const dx = (2 * R + 0.6) * Math.cos(Math.PI / 6);
    for (let row = 0; row < 5; row++) {
      for (let j = 0; j <= row; j++) {
        balls.push({
          n: RACK[k++],
          x: FOOT.x + row * dx + (Math.random() - 0.5) * 0.4,
          y: FOOT.y + (j - row / 2) * (2 * R + 0.6) + (Math.random() - 0.5) * 0.4,
          vx: 0,
          vy: 0,
          on: true,
          sink: null,
        });
      }
    }
    aim = 0;
    power = 0;
    shotRunning = false;
    scratched = false;
    dirty = true;
    wake();
  }

  function shoot(p: number, angle: number) {
    if (!canShoot() || p < 0.03) return;
    const c = cue();
    const speed = MAX_SPEED * Math.pow(p, 1.15);
    c.vx = Math.cos(angle) * speed;
    c.vy = Math.sin(angle) * speed;
    shotRunning = true;
    scratched = false;
    power = 0;
    cb.onShot();
    sound(Math.min(1, p * 1.2), 1800);
    wake();
  }

  function breakShot() {
    const c = cue();
    const apex = balls.find((b) => b.n === RACK[0]);
    if (!apex) return;
    ensureAudio();
    const angle = Math.atan2(apex.y - c.y, apex.x - c.x) + (Math.random() - 0.5) * 0.012;
    shoot(1, angle);
  }

  // ── Physics ────────────────────────────────────────────────────────────────
  function step(dt: number) {
    const N = 10;
    const h = dt / N;
    for (let s = 0; s < N; s++) {
      for (const b of balls) {
        if (!b.on) continue;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 0) {
          const dec = FRICTION * h + sp * DAMPING * h;
          if (sp <= dec || sp < 4) {
            b.vx = 0;
            b.vy = 0;
          } else {
            const k = (sp - dec) / sp;
            b.vx *= k;
            b.vy *= k;
          }
          b.x += b.vx * h;
          b.y += b.vy * h;
        }
        cushions(b);
        pockets(b);
      }
      collide();
    }
  }

  function cushions(b: BallState) {
    const inCornerX = b.x < CORNER_MOUTH || b.x > W - CORNER_MOUTH;
    const inCornerY = b.y < CORNER_MOUTH || b.y > H - CORNER_MOUTH;
    const inSide = Math.abs(b.x - W / 2) < SIDE_MOUTH;
    if (b.y < R && !inCornerX && !inSide && b.vy < 0) bounce(b, "y", R);
    else if (b.y > H - R && !inCornerX && !inSide && b.vy > 0) bounce(b, "y", H - R);
    if (b.x < R && !inCornerY && b.vx < 0) bounce(b, "x", R);
    else if (b.x > W - R && !inCornerY && b.vx > 0) bounce(b, "x", W - R);
  }

  function bounce(b: BallState, axis: "x" | "y", at: number) {
    const v = axis === "x" ? b.vx : b.vy;
    sound(Math.min(0.5, Math.abs(v) / 4000), 260);
    if (axis === "x") {
      b.x = at;
      b.vx = -b.vx * E_CUSHION;
      b.vy *= 0.96;
    } else {
      b.y = at;
      b.vy = -b.vy * E_CUSHION;
      b.vx *= 0.96;
    }
  }

  function pockets(b: BallState) {
    let target: (typeof POCKETS)[number] | null = null;
    for (const p of POCKETS) {
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.r) {
        target = p;
        break;
      }
    }
    // A ball that somehow left the cloth drops into the nearest pocket.
    if (!target && (b.x < -R * 2 || b.x > W + R * 2 || b.y < -R * 2 || b.y > H + R * 2)) {
      target = POCKETS.reduce((a, p) => (Math.hypot(b.x - p.x, b.y - p.y) < Math.hypot(b.x - a.x, b.y - a.y) ? p : a));
    }
    if (target) {
      b.on = false;
      b.sink = { px: target.x, py: target.y, t: 0 };
      b.vx = b.vy = 0;
      sound(0.45, 140);
      if (b.n === 0) scratched = true;
      cb.onPot(b.n);
    }
  }

  function collide() {
    const d2min = 4 * R * R;
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      if (!a.on) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        if (!b.on) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= d2min || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const overlap = 2 * R - d;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;
        const vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (vn <= 0) continue;
        const j2 = ((1 + E_BALL) / 2) * vn;
        a.vx -= j2 * nx;
        a.vy -= j2 * ny;
        b.vx += j2 * nx;
        b.vy += j2 * ny;
        sound(Math.min(1, vn / 1800), 2400);
      }
    }
  }

  function afterShot() {
    shotRunning = false;
    const c = cue();
    if (scratched || !c.on) {
      // Ball in hand, simply: back to the head spot (or as close as possible).
      let x = HEAD.x;
      const clear = (px: number) => balls.every((b) => !b.on || b.n === 0 || Math.hypot(b.x - px, b.y - HEAD.y) > 2 * R + 1);
      while (!clear(x) && x > R * 2) x -= 2 * R;
      Object.assign(c, { x, y: HEAD.y, vx: 0, vy: 0, on: true, sink: null });
      scratched = false;
    }
    if (balls.every((b) => b.n === 0 || !b.on)) cb.onCleared();
  }

  // ── Sound: a tiny synthesised click ────────────────────────────────────────
  function ensureAudio() {
    if (audio) {
      if (audio.state === "suspended") void audio.resume();
      return;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audio = new AC();
    } catch {
      audio = null;
    }
  }

  function sound(volume: number, freq: number) {
    if (!audio || cb.muted() || volume < 0.03) return;
    const now = audio.currentTime;
    if (now - lastSound < 0.018) return;
    lastSound = now;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22 * volume, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (freq < 500 ? 0.12 : 0.07));
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // ── Aim guide: where the cue ball meets the first ball ─────────────────────
  function trace(angle: number) {
    const c = cue();
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let best = Infinity;
    let hit: BallState | null = null;
    for (const b of balls) {
      if (!b.on || b.n === 0) continue;
      const fx = c.x - b.x;
      const fy = c.y - b.y;
      const bq = fx * dx + fy * dy;
      const cq = fx * fx + fy * fy - 4 * R * R;
      const disc = bq * bq - cq;
      if (disc < 0) continue;
      const tt = -bq - Math.sqrt(disc);
      if (tt > 0 && tt < best) {
        best = tt;
        hit = b;
      }
    }
    // Or the cushion
    const tx = dx > 0 ? (W - R - c.x) / dx : dx < 0 ? (R - c.x) / dx : Infinity;
    const ty = dy > 0 ? (H - R - c.y) / dy : dy < 0 ? (R - c.y) / dy : Infinity;
    const tc = Math.min(tx, ty);
    if (tc < best) return { x: c.x + dx * tc, y: c.y + dy * tc, hit: null as BallState | null };
    return { x: c.x + dx * best, y: c.y + dy * best, hit };
  }

  // ── Drawing ────────────────────────────────────────────────────────────────
  function resize(cssWidth: number) {
    if (!cssWidth) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    scale = cssWidth / TW;
    canvas.width = Math.round(TW * scale * dpr);
    canvas.height = Math.round(TH * scale * dpr);
    staticLayer = drawStatic();
    dirty = true;
    wake();
  }

  function drawStatic() {
    const layer = document.createElement("canvas");
    layer.width = canvas.width;
    layer.height = canvas.height;
    const g = layer.getContext("2d")!;
    g.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);

    // Wooden frame
    const wood = g.createLinearGradient(0, 0, 0, TH);
    wood.addColorStop(0, "#6b3a1f");
    wood.addColorStop(0.5, "#4e2812");
    wood.addColorStop(1, "#3a1d0c");
    g.fillStyle = wood;
    roundRect(g, 0, 0, TW, TH, 26);
    g.fill();
    // Wood grain
    g.save();
    roundRect(g, 0, 0, TW, TH, 26);
    g.clip();
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = `rgba(${i % 2 ? "255,220,180" : "20,8,2"},${0.025 + Math.random() * 0.03})`;
      g.lineWidth = 0.6 + Math.random() * 1.4;
      const y = Math.random() * TH;
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(TW * 0.3, y + (Math.random() - 0.5) * 18, TW * 0.7, y + (Math.random() - 0.5) * 18, TW, y + (Math.random() - 0.5) * 10);
      g.stroke();
    }
    g.restore();
    // Frame highlight
    g.strokeStyle = "rgba(255,225,190,0.18)";
    g.lineWidth = 1.5;
    roundRect(g, 1.5, 1.5, TW - 3, TH - 3, 25);
    g.stroke();

    // Cloth (including under the cushions)
    g.save();
    g.translate(RAIL, RAIL);
    const cloth = g.createRadialGradient(W * 0.5, H * 0.45, 40, W * 0.5, H * 0.5, W * 0.62);
    cloth.addColorStop(0, "#27a45e");
    cloth.addColorStop(0.55, "#1b8a4b");
    cloth.addColorStop(1, "#0f5f33");
    g.fillStyle = cloth;
    g.fillRect(-14, -14, W + 28, H + 28);
    // Cloth texture
    const noise = document.createElement("canvas");
    noise.width = noise.height = 96;
    const ng = noise.getContext("2d")!;
    const img = ng.createImageData(96, 96);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 16;
    }
    ng.putImageData(img, 0, 0);
    g.globalCompositeOperation = "overlay";
    g.fillStyle = g.createPattern(noise, "repeat")!;
    g.fillRect(-14, -14, W + 28, H + 28);
    g.globalCompositeOperation = "source-over";

    // Cushions (a darker band with a lit edge), leaving the pocket mouths open
    const cushion = 14;
    g.fillStyle = "#0e6234";
    const segs: [number, number, number, number, "h" | "v"][] = [
      [CORNER_MOUTH + 4, -cushion, W / 2 - SIDE_MOUTH - 2, 0, "h"],
      [W / 2 + SIDE_MOUTH + 2, -cushion, W - CORNER_MOUTH - 4, 0, "h"],
      [CORNER_MOUTH + 4, H, W / 2 - SIDE_MOUTH - 2, H + cushion, "h"],
      [W / 2 + SIDE_MOUTH + 2, H, W - CORNER_MOUTH - 4, H + cushion, "h"],
      [-cushion, CORNER_MOUTH + 4, 0, H - CORNER_MOUTH - 4, "v"],
      [W, CORNER_MOUTH + 4, W + cushion, H - CORNER_MOUTH - 4, "v"],
    ];
    for (const [x1, y1, x2, y2, o] of segs) {
      g.beginPath();
      if (o === "h") {
        const top = y1 < 0;
        g.moveTo(x1 - (top ? 10 : 10), top ? y1 : y2);
        g.lineTo(x2 + 10, top ? y1 : y2);
        g.lineTo(x2, top ? y2 : y1);
        g.lineTo(x1, top ? y2 : y1);
      } else {
        const left = x1 < 0;
        g.moveTo(left ? x1 : x2, y1 - 10);
        g.lineTo(left ? x1 : x2, y2 + 10);
        g.lineTo(left ? x2 : x1, y2);
        g.lineTo(left ? x2 : x1, y1);
      }
      g.closePath();
      g.fill();
    }
    // Lit inner edge of the cushions
    g.strokeStyle = "rgba(160,255,200,0.18)";
    g.lineWidth = 1.2;
    g.strokeRect(0, 0, W, H);
    g.restore();

    // Cloth shading near the rails
    g.save();
    g.translate(RAIL, RAIL);
    const vignette = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.28)");
    g.fillStyle = vignette;
    g.fillRect(-14, -14, W + 28, H + 28);

    // Head string and spots
    g.strokeStyle = "rgba(255,255,255,0.08)";
    g.setLineDash([4, 6]);
    g.beginPath();
    g.moveTo(HEAD.x, 0);
    g.lineTo(HEAD.x, H);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = "rgba(255,255,255,0.22)";
    for (const s of [HEAD, FOOT]) {
      g.beginPath();
      g.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
      g.fill();
    }

    // Pockets
    for (const p of POCKETS) {
      const px = Math.min(Math.max(p.x, -4), W + 4);
      const py = p.y < H / 2 ? Math.min(p.y, -2) : Math.max(p.y, H + 2);
      const rim = g.createRadialGradient(px, py, p.r * 0.5, px, py, p.r + 3);
      rim.addColorStop(0, "#000");
      rim.addColorStop(0.72, "#050505");
      rim.addColorStop(0.86, "#2a1a0e");
      rim.addColorStop(1, "rgba(212,162,67,0.0)");
      g.fillStyle = rim;
      g.beginPath();
      g.arc(px, py, p.r + 3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#020202";
      g.beginPath();
      g.arc(px, py, p.r - 3, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();

    // Diamonds on the rails
    g.save();
    g.translate(RAIL, RAIL);
    g.fillStyle = "rgba(245,236,214,0.85)";
    const diamond = (x: number, y: number) => {
      g.beginPath();
      g.moveTo(x, y - 3.6);
      g.lineTo(x + 2.6, y);
      g.lineTo(x, y + 3.6);
      g.lineTo(x - 2.6, y);
      g.closePath();
      g.fill();
    };
    for (const k of [1, 2, 3, 5, 6, 7]) {
      diamond((W * k) / 8, -RAIL / 2 - 4);
      diamond((W * k) / 8, H + RAIL / 2 + 4);
    }
    for (const k of [1, 2, 3]) {
      diamond(-RAIL / 2 - 4, (H * k) / 4);
      diamond(W + RAIL / 2 + 4, (H * k) / 4);
    }
    g.restore();

    return layer;
  }

  function drawBall(b: BallState, x: number, y: number, r: number) {
    const color = b.n === 0 ? "#f6f2e7" : ballColor(b.n);
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x + r * 0.28, y + r * 0.38, r * 1.02, r * 0.86, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    if (b.n > 8) {
      ctx.fillStyle = "#f6f2e7";
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = color;
      ctx.fillRect(x - r, y - r * 0.52, r * 2, r * 1.04);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Number disc
    if (b.n > 0) {
      ctx.fillStyle = "#f8f4ea";
      ctx.beginPath();
      ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#121212";
      ctx.font = `800 ${r * (b.n > 9 ? 0.58 : 0.66)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(b.n), x, y + r * 0.04);
    }
    // Shading and highlight
    const shade = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
    shade.addColorStop(0, "rgba(255,255,255,0.35)");
    shade.addColorStop(0.35, "rgba(255,255,255,0)");
    shade.addColorStop(0.8, "rgba(0,0,0,0.18)");
    shade.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = shade;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCue(c: BallState, angle: number, p: number) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const gap = R + 6 + p * 95;
    const len = 560;
    const tipX = c.x - dx * gap;
    const tipY = c.y - dy * gap;
    const buttX = tipX - dx * len;
    const buttY = tipY - dy * len;
    const nx = -dy;
    const ny = dx;
    const poly = (fromT: number, toT: number, w0: number, w1: number, fill: string | CanvasGradient) => {
      const ax = tipX - dx * len * fromT;
      const ay = tipY - dy * len * fromT;
      const bx = tipX - dx * len * toT;
      const by = tipY - dy * len * toT;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(ax + nx * w0, ay + ny * w0);
      ctx.lineTo(bx + nx * w1, by + ny * w1);
      ctx.lineTo(bx - nx * w1, by - ny * w1);
      ctx.lineTo(ax - nx * w0, ay - ny * w0);
      ctx.closePath();
      ctx.fill();
    };
    // Shadow
    ctx.save();
    ctx.translate(7, 11);
    ctx.globalAlpha = 0.3;
    poly(0, 1, 3, 7, "#000");
    ctx.restore();
    const w = (t: number) => 3 + t * 4.2;
    poly(0, 0.006, w(0), w(0.006), "#2f6fd6"); // tip
    poly(0.006, 0.03, w(0.006), w(0.03), "#f4f1e8"); // ferrule
    const shaft = ctx.createLinearGradient(tipX + nx * 6, tipY + ny * 6, tipX - nx * 6, tipY - ny * 6);
    shaft.addColorStop(0, "#f7deb0");
    shaft.addColorStop(0.5, "#e2bd84");
    shaft.addColorStop(1, "#b88a52");
    poly(0.03, 0.62, w(0.03), w(0.62), shaft);
    poly(0.62, 0.64, w(0.62), w(0.64), "#e8bc5e");
    const butt = ctx.createLinearGradient(tipX + nx * 8, tipY + ny * 8, tipX - nx * 8, tipY - ny * 8);
    butt.addColorStop(0, "#5a2d17");
    butt.addColorStop(0.5, "#2b1309");
    butt.addColorStop(1, "#160904");
    poly(0.64, 1, w(0.64), w(1), butt);
    poly(0.9, 0.92, w(0.9), w(0.92), "#e8bc5e");
    void buttX;
    void buttY;
  }

  function drawGuide(angle: number) {
    const c = cue();
    const hit = trace(angle);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 7]);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(hit.x, hit.y);
    ctx.stroke();
    ctx.setLineDash([]);
    // Ghost ball
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.arc(hit.x, hit.y, R, 0, Math.PI * 2);
    ctx.stroke();
    if (hit.hit) {
      const ox = hit.hit.x - hit.x;
      const oy = hit.hit.y - hit.y;
      const ol = Math.hypot(ox, oy) || 1;
      ctx.strokeStyle = "rgba(239,207,130,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hit.hit.x, hit.hit.y);
      ctx.lineTo(hit.hit.x + (ox / ol) * 110, hit.hit.y + (oy / ol) * 110);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPower(p: number) {
    const bw = 300;
    const bh = 10;
    const x = TW / 2 - bw / 2;
    const y = TH - RAIL / 2 - bh / 2 + 6;
    ctx.save();
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRect(ctx, x - 2, y - 2, bw + 4, bh + 4, 7);
    ctx.fill();
    const grad = ctx.createLinearGradient(x, 0, x + bw, 0);
    grad.addColorStop(0, "#3fc076");
    grad.addColorStop(0.6, "#e8bc5e");
    grad.addColorStop(1, "#d42a24");
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, Math.max(bh, bw * p), bh, 5);
    ctx.fill();
    ctx.restore();
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (staticLayer) ctx.drawImage(staticLayer, 0, 0);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, RAIL * scale * dpr, RAIL * scale * dpr);

    // Balls dropping into pockets
    for (const b of balls) {
      if (!b.sink) continue;
      const k = Math.min(1, b.sink.t / 0.22);
      const x = b.x + (b.sink.px - b.x) * k;
      const y = b.y + (b.sink.py - b.y) * k;
      ctx.globalAlpha = 1 - k * 0.8;
      drawBall(b, x, y, R * (1 - k * 0.45));
      ctx.globalAlpha = 1;
    }
    for (const b of balls) if (b.on) drawBall(b, b.x, b.y, R);

    const showAim = canShoot() && (drag || (pointer && !drag) || keyboard);
    if (showAim) {
      drawGuide(aim);
      drawCue(cue(), aim, power);
      if (power > 0) drawPower(power);
    }
  }

  // ── Loop ───────────────────────────────────────────────────────────────────
  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.033, (now - (last || now)) / 1000);
    last = now;
    const wasMoving = moving();
    if (wasMoving) {
      step(dt);
      for (const b of balls) {
        if (b.sink) {
          b.sink.t += dt;
          if (b.sink.t > 0.25) {
            b.sink = null;
            if (b.n === 0) {
              b.x = HEAD.x;
              b.y = HEAD.y;
            }
          }
        }
      }
      dirty = true;
    }
    if (shotRunning && !moving()) {
      afterShot();
      dirty = true;
    }
    if (dirty) {
      render();
      dirty = false;
    }
    if (visible && (moving() || drag)) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  function wake() {
    dirty = true;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  const toTable = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const k = TW / rect.width;
    return { x: (e.clientX - rect.left) * k - RAIL, y: (e.clientY - rect.top) * k - RAIL };
  };

  function aimFrom(p: { x: number; y: number }) {
    const c = cue();
    const dx = c.x - p.x;
    const dy = c.y - p.y;
    if (Math.hypot(dx, dy) > 2) aim = Math.atan2(dy, dx);
  }

  function onDown(e: PointerEvent) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    ensureAudio();
    keyboard = false;
    if (!canShoot()) return;
    const p = toTable(e);
    pointer = p;
    aimFrom(p);
    drag = { d0: Math.hypot(cue().x - p.x, cue().y - p.y), id: e.pointerId };
    power = 0;
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    wake();
  }

  function onMove(e: PointerEvent) {
    const p = toTable(e);
    pointer = p;
    if (!canShoot()) return;
    aimFrom(p);
    if (drag) {
      const d = Math.hypot(cue().x - p.x, cue().y - p.y);
      power = Math.max(0, Math.min(1, (d - drag.d0) / PULL));
    }
    keyboard = false;
    wake();
  }

  function onUp(e: PointerEvent) {
    if (!drag || drag.id !== e.pointerId) return;
    const p = power;
    drag = null;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (e.pointerType !== "mouse") pointer = null;
    if (p > 0.03) shoot(p, aim);
    power = 0;
    wake();
  }

  function onLeave() {
    if (!drag) {
      pointer = null;
      wake();
    }
  }

  function onKey(e: KeyboardEvent) {
    if (!canShoot()) return;
    const fine = e.shiftKey ? 0.2 : 1.5;
    let handled = true;
    if (e.key === "ArrowLeft") aim -= (fine * Math.PI) / 180;
    else if (e.key === "ArrowRight") aim += (fine * Math.PI) / 180;
    else if (e.key === "ArrowUp") power = Math.min(1, power + 0.05);
    else if (e.key === "ArrowDown") power = Math.max(0, power - 0.05);
    else if (e.key === " " || e.key === "Enter") {
      ensureAudio();
      shoot(power || 0.5, aim);
    } else handled = false;
    if (handled) {
      e.preventDefault();
      keyboard = true;
      wake();
    }
  }

  function onFocus() {
    keyboard = true;
    wake();
  }
  function onBlur() {
    keyboard = false;
    wake();
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("keydown", onKey);
  canvas.addEventListener("focus", onFocus);
  canvas.addEventListener("blur", onBlur);

  rack();

  return {
    rack,
    breakShot,
    resize,
    setVisible(v: boolean) {
      visible = v;
      if (v) wake();
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("keydown", onKey);
      canvas.removeEventListener("focus", onFocus);
      canvas.removeEventListener("blur", onBlur);
      void audio?.close();
    },
  };
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
