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
  /** A class per column (bars only): columns of different kinds. */
  classes?: string[];
  /** The legend's keys when the columns have classes of their own. */
  keys?: [string, string][];
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
        {bars.keys ? (
          bars.keys.map(([name, cls]) => (
            <span key={name} className="key">
              <i className={"sw-bar " + cls} />
              {name}
            </span>
          ))
        ) : (
          <span className="key">
            <i className={"sw-bar " + bars.cls} />
            {bars.name}
          </span>
        )}
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
          return <rect key={k} x={x(k) - bw / 2} y={y(0) - h} width={bw} height={h} rx={Math.min(3, bw / 3)} className={"col " + (bars.classes?.[k] || bars.cls)} />;
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

export interface Stack {
  name: string;
  /** One value per column (≥ 0). */
  values: number[];
  /** A palette class: p1 … p8. */
  cls: string;
}

/**
 * Columns stacked above the zero line (`up`, e.g. coins created by source)
 * and below it (`down`, coins spent by sink), with a line (the net) and a
 * tip per column listing every part.
 */
export function StackChart({ labels, titles, up, down = [], line, every = 5, height = 260, width = 960, format }: {
  labels: string[];
  titles: string[];
  up: Stack[];
  down?: Stack[];
  line?: { name: string; values: number[] };
  every?: number;
  height?: number;
  width?: number;
  format?: (v: number) => string;
}) {
  const { fmtNum } = useLocale();
  const fmt = format || ((v: number) => fmtNum(Math.round(v)));
  const n = labels.length;
  const sum = (stacks: Stack[], k: number) => stacks.reduce((a, s) => a + (s.values[k] || 0), 0);
  const maxUp = niceMax(Math.max(0, ...labels.map((_, k) => sum(up, k)), ...(line ? line.values : [])));
  const maxDown = down.length ? niceMax(Math.max(0, ...labels.map((_, k) => sum(down, k)), ...(line ? line.values.map((v) => -v) : []))) : 0;
  const W = width;
  const H = height;
  const left = 56;
  const right = 12;
  const top = 10;
  const bottom = every ? 24 : 8;
  const plot = H - top - bottom;
  const zero = top + (plot * maxUp) / (maxUp + maxDown || 1);
  const scale = plot / (maxUp + maxDown || 1);
  const step = (W - left - right) / Math.max(1, n);
  const x = (k: number) => left + step * k + step / 2;
  const bw = Math.max(1.5, step * 0.66);
  const y = (v: number) => zero - v * scale;
  const ticks = [maxUp, maxUp / 2, 0, ...(maxDown ? [-maxDown / 2, -maxDown] : [])];
  return (
    <div className="chart-wrap">
      <div className="legend">
        {[...up, ...down].map((s) => (
          <span key={s.name + s.cls} className="key"><i className={"sw-bar " + s.cls} />{s.name}</span>
        ))}
        {line ? <span className="key"><i className="sw-line c-ink" />{line.name}</span> : null}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={[...up, ...down].map((s) => s.name).join(", ")}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={left} x2={W - right} y1={y(v)} y2={y(v)} className={"grid-line" + (v === 0 ? " zero" : "")} />
            <text x={left - 8} y={y(v) + 4} className="axis" textAnchor="end">{fmt(v)}</text>
          </g>
        ))}
        {labels.map((_, k) => {
          let acc = 0;
          const ups = up.map((s) => {
            const v = s.values[k] || 0;
            const r = v > 0 ? <rect key={s.cls + "u"} x={x(k) - bw / 2} y={y(acc + v)} width={bw} height={Math.max(0.5, v * scale)} className={"col " + s.cls} /> : null;
            acc += v;
            return r;
          });
          let dacc = 0;
          const downs = down.map((s) => {
            const v = s.values[k] || 0;
            const r = v > 0 ? <rect key={s.cls + "d"} x={x(k) - bw / 2} y={y(-dacc)} width={bw} height={Math.max(0.5, v * scale)} className={"col " + s.cls} /> : null;
            dacc += v;
            return r;
          });
          return <g key={k}>{ups}{downs}</g>;
        })}
        {line ? <polyline points={line.values.map((v, k) => x(k).toFixed(1) + "," + y(v).toFixed(1)).join(" ")} className="line c-ink" /> : null}
        {every ? labels.map((l, k) => (k % every === 0 || k === n - 1 ? <text key={k} x={x(k)} y={H - 6} className="axis" textAnchor="middle">{l}</text> : null)) : null}
        {labels.map((_, k) => {
          const parts = [...up.map((s) => [s.name, s.values[k] || 0] as const), ...down.map((s) => [s.name, -(s.values[k] || 0)] as const)].filter(([, v]) => v);
          const tip = [titles[k] || labels[k], ...parts.map(([nm, v]) => nm + ": " + (v > 0 ? "+" : "") + fmt(v)), ...(line ? [line.name + ": " + fmt(line.values[k])] : [])].join("\n");
          return <rect key={"h" + k} x={left + step * k} y={top} width={step} height={plot} className="hit"><title>{tip}</title></rect>;
        })}
      </svg>
    </div>
  );
}

/** A line over evenly spaced points (a total over time), with its area. */
export function LineChart({ labels, titles, values, name, every = 5, height = 180, width = 960, format }: {
  labels: string[];
  titles: string[];
  values: number[];
  name: string;
  every?: number;
  height?: number;
  width?: number;
  format?: (v: number) => string;
}) {
  const { fmtNum } = useLocale();
  const fmt = format || ((v: number) => fmtNum(Math.round(v)));
  const W = width;
  const H = height;
  const left = 64;
  const right = 12;
  const top = 10;
  const bottom = every ? 24 : 8;
  const lo0 = Math.min(...values, 0);
  const hi0 = Math.max(...values, 1);
  // Not from zero: the changes of a large total show.
  const pad = (hi0 - lo0) * 0.1 || hi0 * 0.05 || 1;
  const lo = Math.max(0, Math.min(...values) - pad);
  const hi = Math.max(...values) + pad;
  const n = values.length;
  const step = (W - left - right) / Math.max(1, n - 1);
  const x = (k: number) => left + step * k;
  const y = (v: number) => top + (H - top - bottom) * (1 - (v - lo) / (hi - lo || 1));
  const pts = values.map((v, k) => x(k).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={name}>
        {[hi, (hi + lo) / 2, lo].map((v) => (
          <g key={v}>
            <line x1={left} x2={W - right} y1={y(v)} y2={y(v)} className="grid-line" />
            <text x={left - 8} y={y(v) + 4} className="axis" textAnchor="end">{fmt(v)}</text>
          </g>
        ))}
        {n > 1 ? <polygon points={`${x(0)},${y(lo)} ${pts} ${x(n - 1)},${y(lo)}`} className="area c-accent" /> : null}
        <polyline points={pts} className="stroke c-accent" />
        {every ? labels.map((l, k) => (k % every === 0 || k === n - 1 ? <text key={k} x={x(k)} y={H - 6} className="axis" textAnchor="middle">{l}</text> : null)) : null}
        {values.map((v, k) => (
          <rect key={k} x={x(k) - step / 2} y={top} width={step} height={H - top - bottom} className="hit"><title>{(titles[k] || labels[k]) + "\n" + name + ": " + fmt(v)}</title></rect>
        ))}
      </svg>
    </div>
  );
}

/** A grid of shades (rows × columns), each cell with its tip. */
export function Heatmap({ rows, cols, value, tip, level, label }: {
  rows: { key: number; label: string }[];
  cols: { key: number; label: string }[];
  value: (r: number, c: number) => string;
  tip: (r: number, c: number) => string;
  level: (r: number, c: number) => number;
  label: string;
}) {
  return (
    <div className="table-wrap">
      <table className="heatmap" aria-label={label}>
        <thead>
          <tr>
            <th />
            {cols.map((c) => <th key={c.key} scope="col">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row">{r.label}</th>
              {cols.map((c) => (
                <td key={c.key} className={"hm l" + level(r.key, c.key)} title={tip(r.key, c.key)}>{value(r.key, c.key)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
