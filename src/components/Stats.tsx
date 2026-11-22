import type { Dict } from "@/i18n";

export function Stats({ t }: { t: Dict }) {
  return (
    <section aria-label="Snook Legend" className="relative py-10 sm:py-14">
      <div className="container-page">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/[0.06] ring-1 ring-white/[0.06] sm:grid-cols-5">
          {t.stats.map((s, i) => (
            <div
              key={s.label}
              data-reveal
              style={{ ["--reveal-delay" as string]: `${i * 70}ms` }}
              className={`flex flex-col items-center justify-center gap-1 bg-ink-900/95 px-4 py-7 text-center ${
                i === t.stats.length - 1 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <dt className="order-2 text-[13px] leading-snug text-mist">{s.label}</dt>
              <dd className="order-1 font-display text-4xl font-extrabold tracking-tight text-gold sm:text-[2.6rem]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
