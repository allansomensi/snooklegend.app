"use client";

import { CalendarDays, Pencil, Percent, Sparkles, Tag, X } from "lucide-react";
import { useId, useState } from "react";
import { fromLocalInput, toLocalInput } from "@/admin/components/events/event-words";
import { CATEGORY, ItemPicker, fromCatalog, useCatalog, useItemWords } from "@/admin/components/items";
import { Progress, RangeFields, Section, StatusBadge, minuteNow, useQuickRanges, useWhen } from "@/admin/components/ops/schedule";
import { useRefresh } from "@/admin/components/providers";
import { useDialogs } from "@/admin/components/providers/dialogs";
import { useLocale } from "@/admin/components/providers/locale";
import { useToasts } from "@/admin/components/providers/toasts";
import { AlertBox, Btn, Card, Empty, Kpi, PageHead, Segmented, Spinner, Updated, useBusy } from "@/admin/components/ui/bits";
import { Loaded, updatedAt } from "@/admin/components/ui/loaded";
import { Modal } from "@/admin/components/ui/modal";
import { api, seg } from "@/admin/lib/api";
import { charCount } from "@/admin/lib/format";
import { useApi, useIsAdmin } from "@/admin/lib/hooks";
import type { CatalogItem, Promotion, Promotions } from "@/admin/lib/types";
import "@/admin/styles/moderation.css";
import "@/admin/styles/ops.css";

export default function PromotionsPage() {
  const { t, tf, fmtNum, ago } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const q = useApi<Promotions>("/promotions", { refetchInterval: 30000 });
  const catalog = useCatalog();
  return (
    <Loaded queries={[q, catalog]}>
      {(d, e) => {
        const live = d.promotions.filter((p) => p.status === "live").sort((a, b) => a.ends_at - b.ends_at);
        const next = d.promotions.filter((p) => p.status === "scheduled").sort((a, b) => a.starts_at - b.starts_at);
        const past = d.promotions.filter((p) => p.status === "ended" || p.status === "cancelled").slice(0, 20);
        const best = Math.max(0, ...live.filter((p) => p.kind === "discount").map((p) => p.percent));
        const open = (p?: Promotion) => dialogs.open((close) => <PromotionDialog d={d} catalog={e.catalog} editing={p} onClose={close} />);
        const card = (p: Promotion) => <PromotionCard key={p.id} p={p} now={d.now} catalog={e.catalog} onEdit={() => open(p)} />;
        return (
          <div>
            <PageHead title={t("Promotions")} sub={t("Sales and showcases in the shop, with a start and an end")}>
              <Updated at={updatedAt(q)} onRefresh={() => void q.refetch()} />
              {admin ? <Btn label={t("New promotion")} kind="primary" icon={Percent} onClick={() => open()} /> : null}
            </PageHead>
            {admin ? null : <AlertBox tone="info" title={t("Only administrators schedule promotions")} text={t("They change what the shop charges.")} />}
            <div className={"kpis" + (admin ? "" : " section")}>
              <Kpi label={t("Running now")} value={fmtNum(live.length)} sub={best ? tf("up to {n}% off", { n: best }) : t("no sale")} icon={Percent} tone={live.length ? "success" : ""} />
              <Kpi label={t("Coming up")} value={fmtNum(next.length)} sub={next.length ? tf("the next {when}", { when: ago(next[0].starts_at) }) : t("nothing scheduled")} icon={CalendarDays} tone="info" />
              <Kpi label={t("Players see")} value={tf("{n} days ahead", { n: 3 })} sub={t("what runs and starts within 3 days")} icon={Sparkles} />
            </div>
            <Section title={t("Running now")} empty={<Card><Empty icon={Percent} title={t("No promotion is running")} text={admin ? t("Schedule one with “New promotion”.") : null} /></Card>}>
              {live.map(card)}
            </Section>
            <Section title={t("Coming up")} empty={<Card><Empty icon={CalendarDays} title={t("Nothing scheduled")} /></Card>}>{next.map(card)}</Section>
            {past.length ? <Section title={t("Past")} sub={t("The latest 20")} empty={null}>{past.map(card)}</Section> : null}
          </div>
        );
      }}
    </Loaded>
  );
}

/** What a promotion does, in a line. */
function usePromotionWhat() {
  const { t, tf } = useLocale();
  return (p: Pick<Promotion, "kind" | "percent">) => (p.kind === "discount" ? tf("{n}% off", { n: p.percent }) : t("Shown first, highlighted"));
}

function PromotionCard({ p, now, catalog, onEdit }: { p: Promotion; now: number; catalog: CatalogItem[]; onEdit: () => void }) {
  const { t, tf, fmtDate, fmtNum, ago } = useLocale();
  const admin = useIsAdmin();
  const dialogs = useDialogs();
  const { attempt } = useToasts();
  const refresh = useRefresh();
  const words = useItemWords();
  const what = usePromotionWhat();
  const when = useWhen();
  const [busy, run] = useBusy();
  const byCode = new Map(catalog.map((i) => [i.code, i]));
  const cancel = async () => {
    const ok = await dialogs.confirm({
      title: tf("Call off “{name}”?", { name: p.title }),
      text: p.status === "live" ? t("The shop's prices go back at once; players stop seeing it.") : t("Players stop seeing it coming."),
      confirm: t("Call off"),
    });
    if (ok && (await run(() => attempt(() => api("/promotions/" + seg(p.id) + "/cancel", { method: "POST" }), t("Promotion called off."))))) void refresh();
  };
  const open = p.status === "live" || p.status === "scheduled";
  return (
    <Card className={open ? "" : "faded"}>
      <div className="card-head">
        <div className="row">
          <span className={"event-icon " + (p.kind === "discount" ? "warning" : "info")}>{p.kind === "discount" ? <Percent className="icon" aria-hidden /> : <Sparkles className="icon" aria-hidden />}</span>
          <div>
            <h3>{p.title}</h3>
            <div className="sub">{what(p)}</div>
          </div>
        </div>
        <div className="row">
          <StatusBadge status={p.status} />
          {admin && open ? <Btn label={t("Edit")} kind="sm" icon={Pencil} onClick={onEdit} /> : null}
          {admin && open ? <Btn label={t("Call off")} kind="sm danger-soft" icon={X} busy={busy} onClick={() => void cancel()} /> : null}
        </div>
      </div>
      <div className="card-body stack">
        <div className="item-chips">
          {p.categories.map((c) => <span key={c} className="item-chip plain" title={t("A whole category")}><Tag className="icon" aria-hidden />{words.category(c)}</span>)}
          {p.codes.map((c) => {
            const i = byCode.get(c);
            const price = i?.coins;
            return (
              <span key={c} className="item-chip plain" title={c}>
                <span className={"r-text r-" + (i?.rarity || "")}>{i?.name || c}</span>
                {price && p.kind === "discount" ? <span className="faint"><s>{fmtNum(price)}</s> {fmtNum(Math.round((price * (100 - p.percent)) / 100))}</span> : null}
              </span>
            );
          })}
        </div>
        <div className="row between">
          <span className="num">{fmtDate(p.starts_at) + " → " + fmtDate(p.ends_at)}</span>
          <span className="muted">{when(p.status, p.starts_at, p.ends_at, p.cancelled_at)}</span>
        </div>
        {p.status === "live" ? <Progress from={p.starts_at} to={p.ends_at} now={now} tone="warning" label={when(p.status, p.starts_at, p.ends_at)} /> : null}
        <div className="faint">{tf("Scheduled by {name}, {when}", { name: p.created_by || "?", when: ago(p.created_at) })}</div>
      </div>
    </Card>
  );
}

function PromotionDialog({ d, catalog, editing, onClose }: { d: Promotions; catalog: CatalogItem[]; editing?: Promotion; onClose: () => void }) {
  const { t, tf, tn, fmtNum } = useLocale();
  const { toast } = useToasts();
  const refresh = useRefresh();
  const words = useItemWords();
  const what = usePromotionWhat();
  const quick = useQuickRanges();
  const uid = useId();
  const [title, setTitle] = useState(editing?.title || "");
  const [kind, setKind] = useState<Promotion["kind"]>(editing?.kind || "discount");
  const [percent, setPercent] = useState(String(editing?.percent || 20));
  const [codes, setCodes] = useState<string[]>(editing?.codes || []);
  const [cats, setCats] = useState<string[]>(editing?.categories || []);
  const [[starts, ends], setRange] = useState<[string, string]>([
    toLocalInput(editing?.starts_at || minuteNow()), toLocalInput(editing?.ends_at || minuteNow() + 2 * 86400),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const discount = kind === "discount";
  // A sale is on items sold for coins; a showcase may show any.
  const items = catalog.filter((i) => (discount ? !!i.coins : i.how !== "free")).map(fromCatalog);
  const chosen = catalog.filter((i) => codes.includes(i.code));
  const pct = Number(percent);
  const a = fromLocalInput(starts);
  const b = fromLocalInput(ends);
  const n = charCount(title);

  const save = async () => {
    if (sending) return;
    let problem: string | null = null;
    if (!title.trim()) problem = t("Give the promotion a title.");
    else if (n > d.limits.max_title) problem = tf("“{field}” is too long.", { field: t("Title") });
    else if (discount && !(Number.isInteger(pct) && pct >= 1 && pct <= d.limits.max_percent)) problem = tf("A discount is 1% to {n}% off.", { n: d.limits.max_percent });
    else if (!codes.length && !cats.length) problem = t("Choose items or categories.");
    else if (!(a && b)) problem = t("Choose when it starts and ends.");
    else if (b <= a) problem = t("The promotion must end after it starts.");
    else if (b - a > d.limits.max_days * 86400) problem = tf("A promotion lasts {n} days at most.", { n: d.limits.max_days });
    setError(problem);
    if (problem) return;
    setSending(true);
    try {
      const body = { title: title.trim(), kind, percent: discount ? pct : 0, codes, categories: cats, starts_at: a, ends_at: b };
      await api(editing ? "/promotions/" + seg(editing.id) : "/promotions", { method: "POST", body });
      toast(editing ? t("Promotion changed.") : t("Promotion scheduled."));
      void refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSending(false);
    }
  };

  return (
    <Modal title={editing ? tf("Change “{name}”", { name: editing.title }) : t("New promotion")} icon={Percent} wide onClose={onClose}
      text={t("Players see it at once in the shop (and three days before it starts); purchases and presents charge the sale's price.")}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>{t("Cancel")}</button>
          <button type="button" data-primary className="btn primary" disabled={sending} onClick={() => void save()}>
            {sending ? <Spinner /> : null}
            {editing ? t("Save") : t("Schedule")}
          </button>
        </>
      }>
      <div className="field">
        <label className="label" htmlFor={uid + "-t"}>
          <span>{t("Title")}</span>
          <span className={"counter" + (n > d.limits.max_title ? " over" : "")}>{fmtNum(n)} / {fmtNum(d.limits.max_title)}</span>
        </label>
        <input id={uid + "-t"} className="input" placeholder={t("Weekend sale")} value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="hint">{t("Players see it as written (in one language).")}</div>
      </div>
      <div className="field">
        <span className="label">{t("Kind")}</span>
        <Segmented<Promotion["kind"]> name={t("Kind")} value={kind} onChange={setKind} options={[["discount", t("Sale")], ["featured", t("Showcase")]]} />
        <div className="hint">{discount ? t("A sale takes a percentage off items sold for coins.") : t("A showcase shows its items first in the shop, highlighted, at their usual price.")}</div>
      </div>
      {discount ? (
        <div className="field">
          <label className="label" htmlFor={uid + "-p"}>{t("Percent off")}</label>
          <div className="row">
            <input id={uid + "-p"} className="input num w-num" type="number" min={1} max={d.limits.max_percent} value={percent} onChange={(e) => setPercent(e.target.value)} />
            <div className="chips">
              {[10, 20, 30, 50].map((x) => <button key={x} type="button" className={"chip" + (pct === x ? " on" : "")} onClick={() => setPercent(String(x))}>{x}%</button>)}
            </div>
          </div>
        </div>
      ) : null}
      <div className="field">
        <span className="label">{t("Whole categories")}</span>
        <div className="chips" role="group" aria-label={t("Whole categories")}>
          {d.categories.map((c) => {
            const on = cats.includes(c);
            return (
              <button key={c} type="button" role="checkbox" aria-checked={on} className={"chip" + (on ? " on" : "")}
                onClick={() => setCats(on ? cats.filter((x) => x !== c) : [...cats, c])}>{t(CATEGORY[c] || c)}</button>
            );
          })}
        </div>
      </div>
      <div className="field">
        <span className="label">{t("Items")}</span>
        <ItemPicker label={t("Items")} items={items} value={codes} onChange={(v) => setCodes(v as string[])} multiple height={220} />
      </div>
      <RangeFields idPrefix={uid} starts={starts} ends={ends} onChange={(x, y) => setRange([x, y])} presets={quick} />
      <div className="preview-box" aria-live="polite">
        <span className="faint">{t("Players see")}</span>
        <b>{title || t("Weekend sale")}</b> · {what({ kind, percent: pct })}
        <div className="muted">
          {[...cats.map((c) => tf("the whole category “{category}”", { category: words.category(c) })), ...chosen.slice(0, 4).map((i) =>
            discount && i.coins ? tf("{item}: {from} → {to} coins", { item: i.name, from: fmtNum(i.coins), to: fmtNum(Math.round((i.coins * (100 - (pct || 0))) / 100)) }) : i.name,
          )].join(" · ") || t("Choose items or categories.")}
          {chosen.length > 4 ? " · " + tn(chosen.length - 4, "{n} more", "{n} more") : null}
        </div>
      </div>
      {error ? <AlertBox tone="danger" title={error} /> : null}
    </Modal>
  );
}
