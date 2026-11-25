import { BookOpen, Check, Globe } from "lucide-react";
import type { Dict, Locale } from "@/i18n";
import { pagePath } from "@/lib/routes";
import { SectionHeading } from "./Section";
import { Shot } from "./Shot";

export function Rules({ t, shotsDir, locale }: { t: Dict; shotsDir: string; locale: Locale }) {
  const r = t.rules;
  return (
    <section id="rules" aria-labelledby="rules-title" className="defer-render relative py-24 [--defer-size:1500px] sm:py-32">
      <div className="container-page">
        <SectionHeading id="rules-title" kicker={r.kicker} title={r.title} sub={r.sub} />

        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          <RuleCard
            delay={0}
            name={r.br.name}
            tag={r.br.tag}
            points={r.br.points}
            badge={<BrazilFlag />}
            accent="from-[#1f9d55]/25 via-[#f2c200]/10 to-transparent"
            ring="ring-[#f2c200]/25"
          />
          <RuleCard
            delay={90}
            name={r.wpa.name}
            tag={r.wpa.tag}
            points={r.wpa.points}
            badge={
              <span className="grid size-10 place-items-center rounded-full bg-[#2c5fd4] text-white shadow-[0_6px_18px_-6px_rgb(44_95_212/0.8)]">
                <Globe className="size-5" />
              </span>
            }
            accent="from-[#2c5fd4]/25 via-[#2c5fd4]/5 to-transparent"
            ring="ring-[#5b8bff]/25"
          />
        </div>

        <div data-reveal className="mt-5 grid items-center gap-6 overflow-hidden rounded-3xl bg-white/[0.03] p-5 ring-1 ring-white/[0.07] sm:p-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex items-start gap-4 px-1">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold-400/15 text-gold-300 ring-1 ring-gold-400/25">
              <BookOpen className="size-5" />
            </span>
            <div>
              <p className="text-[15px] leading-relaxed text-mist">{r.note}</p>
              <a href={pagePath(locale, "rules")} className="mt-3 inline-block font-semibold text-gold-300 transition hover:text-gold-200">
                {r.guide} →
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
            <Shot dir={shotsDir} name="08-rules" alt={t.gallery.items[7]} sizes="(max-width: 1024px) 100vw, 640px" />
          </div>
        </div>
      </div>
    </section>
  );
}

function RuleCard({
  name,
  tag,
  points,
  badge,
  accent,
  ring,
  delay,
}: {
  name: string;
  tag: string;
  points: string[];
  badge: React.ReactNode;
  accent: string;
  ring: string;
  delay: number;
}) {
  return (
    <article
      data-reveal
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
      className={`card noise overflow-hidden p-7 ring-1 sm:p-9 ${ring}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative">
        <div className="flex items-center gap-4">
          {badge}
          <div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-cream sm:text-[1.7rem]">{name}</h3>
            <p className="text-sm text-mist">{tag}</p>
          </div>
        </div>
        <ul className="mt-7 space-y-3.5">
          {points.map((p, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-cream/85">
              <Check className="mt-1 size-4 shrink-0 text-felt-400" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function BrazilFlag() {
  return (
    <svg viewBox="0 0 40 40" className="size-10 shrink-0 drop-shadow-[0_6px_14px_rgb(31_157_85/0.6)]" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#1f9d55" />
      <path d="M20 6 35 20 20 34 5 20z" fill="#f2c200" />
      <circle cx="20" cy="20" r="7.5" fill="#1f3f9d" />
      <path d="M12.7 18.6c4.8-.9 10-.2 14.4 2" stroke="#fff" strokeWidth="1.3" fill="none" />
    </svg>
  );
}
