"use client";

import { ChevronRight, Crown, Download, ListOrdered, Play, Timer, Trophy, Undo2 } from "lucide-react";
import Link from "next/link";
import { use, type ReactNode } from "react";
import { usePlayerActions } from "@/admin/components/player-dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { useViewer } from "@/admin/components/providers/viewer";
import {
  AlertBox, Badge, Btn, Card, CardHead, DataTable, Empty, PageHead, PersonLink, RulesBadge, Segmented, playerHref,
} from "@/admin/components/ui/bits";
import { Chart } from "@/admin/components/ui/charts";
import { Loaded } from "@/admin/components/ui/loaded";
import { strokeWords } from "@/admin/components/viewer/strokes";
import { seg } from "@/admin/lib/api";
import { downloadReplay } from "@/admin/lib/download";
import { useGameEnd } from "@/admin/lib/games";
import { useApi, useIsAdmin, useQueryParams } from "@/admin/lib/hooks";
import { spinPoint, strokeStats, type SeatStats } from "@/admin/lib/inbox";
import type { MatchDetail, MatchStroke } from "@/admin/lib/types";
import "@/admin/styles/ops.css";

/** A stored game, shot by shot: who played what, how, and how long it was
 * thought over. */
export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, tf } = useLocale();
  const q = useApi<MatchDetail>("/matches/" + seg(id));
  return (
    <div>
      <nav className="crumbs" aria-label={t("Games")}>
        <Link href="/admin/players">{t("Players")}</Link>
        <ChevronRight className="icon" aria-hidden />
        <span aria-current="page">{tf("Game #{id}", { id })}</span>
      </nav>
      <Loaded queries={[q]}>{(d) => <Match d={d} />}</Loaded>
    </div>
  );
}

const SEAT_CLS = ["c-accent", "c-info"];

function Match({ d }: { d: MatchDetail }) {
  const l = useLocale();
  const { t, tf, tn, fmtDate } = l;
  const admin = useIsAdmin();
  const viewer = useViewer();
  const actions = usePlayerActions();
  const { attempt } = useToasts();
  const gameEnd = useGameEnd();
  const { get, set } = useQueryParams();
  const m = d.match;
  const strokes = d.strokes || [];
  const stats = strokeStats(strokes);
  const seatFilter = get("seat", "all");
  const only = get("only");
  const shown = strokes.filter(
    (s) => (seatFilter === "all" || String(s.seat) === seatFilter) && (only !== "fouls" || (s.fouls?.length || 0) > 0 || s.kind === "time_foul"),
  );
  const shots = strokes.filter((s) => s.kind === "shot");
  const hasThink = strokes.some((s) => typeof s.think_secs === "number");
  const broken = strokes.find((s) => s.error);
  const seatKeys: [string, string][] = [[m.names[0], SEAT_CLS[0]], [m.names[1], SEAT_CLS[1]]];
  const strokeLabel = (s: MatchStroke) => tf("Stroke {n}", { n: s.index + 1 }) + " · " + (s.player || "");

  return (
    <div className="stack">
      <PageHead
        title={<span className="row">{tf("Game #{id}", { id: m.id })}<RulesBadge rules={m.rules} long />{m.rated ? <Badge kind="accent">{t("Rated")}</Badge> : <Badge>{t("Casual")}</Badge>}
          {m.tournament ? <Badge kind="info" icon={Trophy}>{t("Tournament")}</Badge> : null}{m.voided_at ? <Badge kind="danger" icon={Undo2}>{t("Annulled")}</Badge> : null}</span>}
        sub={tf("Ended {when} · {how} · {n}", { when: fmtDate(m.ended_at), how: gameEnd(m.reason), n: tn(m.shots, "{n} stroke", "{n} strokes") })}
      >
        {strokes.length ? <Btn label={t("Watch")} kind="primary" icon={Play} onClick={() => viewer.open("/replay/" + m.id + "/view")} /> : null}
        {strokes.length ? <Btn label={t("Download")} icon={Download} onClick={() => void attempt(() => downloadReplay(m.id))} /> : null}
        {admin && m.rated && !m.voided_at ? <Btn label={t("Annul the game")} kind="danger-soft" icon={Undo2} onClick={() => actions.voidMatch({ id: m.id, names: m.names })} /> : null}
      </PageHead>
      {m.voided_at ? (
        <AlertBox tone="warning" title={tf("Annulled {when}", { when: fmtDate(m.voided_at) })} text={t("Both players got their rating change back; it no longer counts as a rated game.")} />
      ) : null}

      <div className="grid-2">
        {[0, 1].map((seat) => (
          <SeatCard key={seat} name={m.names[seat]} won={m.winner === seat} delta={m.rated ? m.delta[seat] : null} after={m.rated ? m.ratings_after[seat] : null}
            s={stats[seat]} cls={SEAT_CLS[seat]} voided={!!m.voided_at} />
        ))}
      </div>

      {broken ? <AlertBox tone="warning" title={t("The replay stops early")} text={broken.error} /> : null}

      {!d.strokes ? (
        <Card><Empty icon={ListOrdered} title={t("No replay of this game")} text={t("Only the result was kept.")} /></Card>
      ) : (
        <>
          <div className="grid-2">
            <Card>
              <CardHead title={t("Power of each shot")} sub={t("The cue's speed, in m/s")} />
              <div className="card-body">
                <Chart labels={shots.map((s) => String(s.index + 1))} titles={shots.map(strokeLabel)} every={Math.max(1, Math.ceil(shots.length / 12))} height={170} width={560}
                  bars={{ values: shots.map((s) => s.power || 0), name: t("Power"), cls: SEAT_CLS[0], classes: shots.map((s) => SEAT_CLS[s.seat || 0]), keys: seatKeys,
                    format: (v) => new Intl.NumberFormat(l.lang, { maximumFractionDigits: 1 }).format(v) }} unit=" m/s" />
              </div>
            </Card>
            <Card>
              <CardHead title={t("Time to think")} sub={hasThink ? t("From the shot clock's start to the shot, in seconds") : t("Kept for games played from 0.12 on")} />
              <div className="card-body">
                {hasThink ? (
                  <Chart labels={strokes.map((s) => String(s.index + 1))} titles={strokes.map(strokeLabel)} every={Math.max(1, Math.ceil(strokes.length / 12))} height={170} width={560}
                    bars={{ values: strokes.map((s) => s.think_secs || 0), name: t("Seconds"), cls: SEAT_CLS[0], classes: strokes.map((s) => SEAT_CLS[s.seat || 0]), keys: seatKeys }} unit=" s" />
                ) : (
                  <Empty icon={Timer} title={t("Not kept for this game")} />
                )}
              </div>
            </Card>
          </div>
          <Card>
            <CardHead title={t("Every stroke")} sub={tn(strokes.length, "{n} stroke", "{n} strokes")}>
              <Segmented<string> name={t("Player")} value={seatFilter} onChange={(v) => set({ seat: v === "all" ? null : v })}
                options={[["all", t("Both")], ["0", m.names[0]], ["1", m.names[1]]]} />
              <label className="check">
                <input type="checkbox" checked={only === "fouls"} onChange={(e) => set({ only: e.target.checked ? "fouls" : null })} />
                {t("Fouls only")}
              </label>
            </CardHead>
            {shown.length ? <StrokeTable strokes={shown} rules={m.rules} /> : <Empty icon={ListOrdered} title={t("No stroke matches")} />}
          </Card>
        </>
      )}
    </div>
  );
}

function SeatCard({ name, won, delta, after, s, cls, voided }: { name: string; won: boolean; delta: number | null; after: number | null; s: SeatStats; cls: string; voided: boolean }) {
  const { t, tf, fmtNum, fmtPct, lang } = useLocale();
  const dec = (v: number | null, unit: string) => (v === null ? "—" : new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(v) + unit);
  const kv: [string, ReactNode][] = [
    [t("Shots"), fmtNum(s.shots)],
    [t("Shots that made a ball"), s.shots ? fmtNum(s.potting) + " · " + fmtPct((s.potting * 100) / s.shots, 0) : "—"],
    [t("Balls made"), fmtNum(s.balls)],
    [t("Fouls"), fmtNum(s.fouls)],
    [t("Power"), tf("average {avg} · most {max}", { avg: dec(s.avgPower, " m/s"), max: dec(s.maxPower, " m/s") })],
    [t("Time to think"), s.avgThink === null ? "—" : tf("average {avg} · longest {max}", { avg: dec(s.avgThink, " s"), max: dec(s.maxThink, " s") })],
    [t("Shot clock ran out"), fmtNum(s.timeouts)],
  ];
  return (
    <Card className={"seat-card " + cls}>
      <CardHead title={<span className="row"><PersonLink name={name} />{won ? <Badge kind="success" icon={Crown}>{t("Winner")}</Badge> : null}</span>}>
        {delta !== null ? (
          <span className={"row" + (voided ? " faint" : "")}>
            <b className={"delta" + (delta > 0 ? " up" : delta < 0 ? " down" : "")}>{(delta > 0 ? "+" : "") + fmtNum(delta)}</b>
            <span className="faint">→ {fmtNum(after || 0)}</span>
          </span>
        ) : null}
      </CardHead>
      <div className="card-body">
        <dl className="kv">
          {kv.map(([k, v]) => (
            <div key={k} className="contents">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="row seat-links">
          <Link href={playerHref(name, "games")}>{t("Their games")}</Link>
          <Link href={playerHref(name, "moderation")}>{t("Moderation")}</Link>
        </div>
      </div>
    </Card>
  );
}

/** Where the tip struck the cue ball, drawn on its face. */
function SpinDot({ spin }: { spin?: MatchStroke["spin"] }) {
  const { tf, lang } = useLocale();
  const [x, y] = spinPoint(spin);
  const f = (v: number) => new Intl.NumberFormat(lang, { maximumFractionDigits: 2, signDisplay: "exceptZero" }).format(v);
  const label = tf("side {x} · top {y}", { x: f(x), y: f(y) });
  return (
    <span className="spin" title={label}>
      <svg viewBox="-12 -12 24 24" width={22} height={22} aria-hidden>
        <circle r={11} className="spin-ball" />
        <line x1={-11} x2={11} y1={0} y2={0} className="spin-axis" />
        <line y1={-11} y2={11} x1={0} x2={0} className="spin-axis" />
        <circle cx={x * 8.5} cy={-y * 8.5} r={2.6} className="spin-tip" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function StrokeTable({ strokes, rules }: { strokes: MatchStroke[]; rules: MatchDetail["match"]["rules"] }) {
  const l = useLocale();
  const { t, tf, lang } = l;
  const words = strokeWords(l);
  const dec = (v: number | null | undefined, digits = 1) => (typeof v === "number" ? new Intl.NumberFormat(lang, { maximumFractionDigits: digits }).format(v) : "—");
  const kindWord = (s: MatchStroke) =>
    s.kind === "time_foul" ? t("ran out of time") : s.kind === "resign" ? t("resigned") : s.kind === "abandon" ? t("left the game") : s.kind === "choice" ? s.option || "" : s.break ? t("break") : t("shot");
  return (
    <DataTable className="strokes"
      headers={["#", t("Player"), t("Stroke"), { label: t("Power"), cls: "num" }, t("Spin"), { label: t("Aim"), cls: "num" }, t("Cue ball in hand"), t("Called"),
        t("Made"), t("Fouls"), { label: t("Think"), cls: "num" }]}>
      {strokes.map((s) => {
        const foul = (s.fouls?.length || 0) > 0 || s.kind === "time_foul";
        const made = (s.potted || []).filter((p) => p.ball !== 0);
        const scratch = (s.potted || []).some((p) => p.ball === 0);
        return (
          <tr key={s.index} className={(foul ? "foul " : "") + "seat" + (s.seat ?? 0)}>
            <td className="mono faint">{s.index + 1}</td>
            <td><b className={"seat-name s" + (s.seat ?? 0)}>{s.player}</b></td>
            <td>
              <span className="badges">
                <span>{kindWord(s)}</span>
                {s.timeout ? <Badge kind="warning">{t("shot clock")}</Badge> : null}
                {s.continues ? <Badge kind="success">{t("plays on")}</Badge> : null}
              </span>
              {s.error ? <div className="faint">{s.error}</div> : null}
            </td>
            <td className="num">{s.kind === "shot" ? dec(s.power) : "—"}</td>
            <td>{s.kind === "shot" ? <SpinDot spin={s.spin} /> : "—"}</td>
            <td className="num" title={s.kind === "shot" && s.elevation_degrees ? tf("elevation {n}°", { n: dec(s.elevation_degrees) }) : undefined}>
              {s.kind === "shot" ? dec(s.aim_degrees) + "°" + (s.elevation_degrees ? " ↑" + dec(s.elevation_degrees, 0) + "°" : "") : "—"}
            </td>
            <td className="mono nowrap">{s.cue_ball ? dec(s.cue_ball[0], 0) + ", " + dec(s.cue_ball[1], 0) : "—"}</td>
            <td className="nowrap">{s.called ? words.pocketName(s.called) : rules === "official" && s.kind === "shot" && !s.break ? <span className="faint">{t("safety")}</span> : "—"}</td>
            <td>
              <span className="badges">
                {made.map((p, k) => <span key={k} className={"ball b" + p.ball} title={words.pocketName(p.pocket)}>{p.ball}</span>)}
                {scratch ? <Badge kind="danger">{t("cue ball")}</Badge> : null}
                {!made.length && !scratch && s.kind === "shot" ? <span className="faint">—</span> : null}
              </span>
            </td>
            <td className="wrap">{(s.fouls || []).map((f) => words.foulText(f)).join(" · ") || (s.kind === "time_foul" ? t("ran out of time") : "")}</td>
            <td className="num">{typeof s.think_secs === "number" ? dec(s.think_secs) + " s" : "—"}</td>
          </tr>
        );
      })}
    </DataTable>
  );
}

