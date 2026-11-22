import { Plus } from "lucide-react";
import type { Dict } from "@/i18n";
import { SectionHeading } from "./Section";

export function Faq({ t }: { t: Dict }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="defer-render relative py-24 [--defer-size:1000px] sm:py-32">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="faq-title" kicker={t.faq.kicker} title={t.faq.title} align="left" />
        </div>
        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {t.faq.items.map((item, i) => (
            <details key={i} data-reveal style={{ ["--reveal-delay" as string]: `${i * 40}ms` }} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-left font-display text-lg font-semibold text-cream transition hover:text-gold-200 sm:text-xl">
                {item.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.05] ring-1 ring-white/10 transition duration-300 group-open:rotate-45 group-open:bg-gold-400/15 group-open:text-gold-300">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 pr-10 text-[15px] leading-relaxed text-mist">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
