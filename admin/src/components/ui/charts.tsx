"use client";

import type { ReactNode } from "react";
import { useLocale } from "../providers/locale";

function niceMax(v: number) {
  if (!(v > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const k of [1, 2, 5, 10]) if (k * p >= v) return k * p;
  return 10 * p;
}

export interface Series {
  values: number[];
  name: string;
  /** c-accent, c-success or c-info. */
  cls: string;
  format?: (v: number) => string;
}

/** Bars (and optionally a line) over evenly spaced columns, in SVG, with a
 * tip per column. */
export function Chart({ labels, titles, bars, line, every = 6, height = 200, unit = "", width = 960 }: {
  labels: string[];
  titles: string[];
  bars: Series;
  line?: Series;
  /** A label every this many columns (0: none). */
  every?: number;
  height?: number;
  unit?: string;
  width?: number;
}) {
  const { fmtNum } = useLocale();
  const W = width;
  const H = height;
  const left = 46;
  const right = 14;
  const top = 12;
  const bottom = every ? 24 : 8;
  const n = labels.length;
  const max = niceMax(Math.max(0, ...bars.values, ...(line ? line.values : [])));
  const fmt = bars.format || ((v: number) => fmtNum(Math.round(v * 10) / 10));
  const step = (W - left - right) / Math.max(1, n);
  const x = (k: number) => left + step * k + step / 2;
  const y = (v: number) => top + (H - top - bottom) * (1 - v / max);
  const bw = Math.max(1.5, step * 0.66);
  return (
    <div className="chart-wrap">
      <div className="legend">
        <span className="key">
          <i className={"sw-bar " + bars.cls} />
          {bars.name}
        </span>
        {line ? (
          <span className="key">
            <i className={"sw-line " + line.cls} />
            {line.name}
          </span>
        ) : null}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={bars.name + (line ? " · " + line.name : "")}>
        {[0, 0.5, 1].map((f) => {
          const yy = y(max * f);
          return (
            <g key={f}>
              <line x1={left} x2={W - right} y1={yy} y2={yy} className="grid-line" />
              <text x={left - 8} y={yy + 4} className="axis" textAnchor="end">
                {fmt(max * f)}
              </text>
            </g>
          );
        })}
        {bars.values.map((v, k) => {
          if (!(v > 0)) return null;
          const h = Math.max(1.5, y(0) - y(v));
          return <rect key={k} x={x(k) - bw / 2} y={y(0) - h} width={bw} height={h} rx={Math.min(3, bw / 3)} className={"col " + bars.cls} />;
        })}
        {line ? (
          <>
            <polyline points={line.values.map((v, k) => x(k).toFixed(1) + "," + y(v).toFixed(1)).join(" ")} className={"line " + line.cls} />
            {line.values.map((v, k) => (v > 0 ? <circle key={k} cx={x(k)} cy={y(v)} r={2.6} className={"dot " + line.cls} /> : null))}
          </>
        ) : null}
        {every
          ? labels.map((l, k) =>
              k % every === 0 || k === n - 1 ? (
                <text key={k} x={x(k)} y={H - 6} className="axis" textAnchor="middle">
                  {l}
                </text>
              ) : null,
            )
          : null}
        {labels.map((_, k) => {
          let tip = (titles[k] || labels[k]) + "\n" + bars.name + ": " + fmt(bars.values[k]) + unit;
          if (line) tip += "\n" + line.name + ": " + fmtNum(line.values[k]);
          return (
            <rect key={k} x={left + step * k} y={top} width={step} height={H - top - bottom} className="hit">
              <title>{tip}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

export interface BarRow {
  label: ReactNode;
  value: number;
  tone?: string;
  key?: string;
}

/** Horizontal bars, one per row, against the largest. */
export function BarList({ rows, max, tone = "", format }: { rows: BarRow[]; max?: number; tone?: string; format?: (v: number) => string }) {
  const { fmtNum } = useLocale();
  const top = max || Math.max(1, ...rows.map((r) => r.value));
  const f = format || fmtNum;
  return (
    <div className="barlist">
      {rows.map((r, k) => (
        <div key={r.key ?? k} className="bl-row">
          <div className="bl-label">{r.label}</div>
          <div className="bl-track">
            <div className={("bl-fill " + (r.tone || tone)).trim()} style={{ width: Math.max(r.value > 0 ? 1.5 : 0, (r.value / top) * 100) + "%" }} />
          </div>
          <div className="bl-value">{f(r.value)}</div>
        </div>
      ))}
    </div>
  );
}
