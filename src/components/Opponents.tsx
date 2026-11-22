import { Ghost } from "lucide-react";
import { fmt, type Dict } from "@/i18n";
import { SectionHeading } from "./Section";

const IMAGES = ["leo", "nina", "tito", "lola", "bruno", "ines", "marta", "otto", "diego", "rosa", "kenji", "amara", "sofia", "yuri", "viktor"];

export function Opponents({ t }: { t: Dict }) {
  const o = t.opponents;
  return (
    <section id="opponents" aria-labelledby="opponents-title" className="defer-render relative py-24 [--defer-size:1700px] sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 mx-auto h-[34rem] max-w-5xl bg-[radial-gradient(closest-side,rgb(212_162_67/0.07),transparent)]" />
      <div className="container-page">
        <SectionHeading id="opponents-title" kicker={o.kicker} title={o.title} sub={o.sub} />

        <ul className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {o.list.map(([name, nick], i) => {
            const strength = Math.floor(i / 3) + 1;
            return (
              <li
                key={name}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${(i % 5) * 60}ms` }}
                className="card group flex flex-col items-center px-3 pb-5 pt-6 text-center transition-[box-shadow,translate] duration-500 hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_rgb(232_188_94/0.3),0_24px_50px_-26px_rgb(0_0_0/0.8)]"
              >
                <span className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/opponents/${IMAGES[i]}.webp`}
                    alt=""
                    width={72}
                    height={72}
                    loading="lazy"
                    className="relative size-[72px] rounded-full ring-2 ring-white/10 transition duration-500 group-hover:scale-105 group-hover:shadow-[0_0_28px_rgb(232_188_94/0.35)] group-hover:ring-gold-400/50"
                  />
                </span>
                <h3 className="mt-3.5 font-display text-lg font-bold text-cream">{name}</h3>
                <p className="mt-0.5 min-h-10 text-[13px] leading-snug text-gold-300/90">{nick}</p>
                <div className="mt-3 flex gap-1" role="img" aria-label={fmt(o.strength, { n: strength })}>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <span key={k} className={`size-2 rounded-full ${k <= strength ? "bg-gold-400" : "bg-white/12 ring-1 ring-white/10"}`} />
                  ))}
                </div>
              </li>
            );
          })}
        </ul>

        <p data-reveal className="mt-8 flex items-center justify-center gap-2.5 text-center text-mist">
          <Ghost className="size-5 shrink-0 text-cream/70" /> {o.ghost}
        </p>
      </div>
    </section>
  );
}
